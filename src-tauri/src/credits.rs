//! AI credits: pricing, balance and spending, with an offline queue. The server
//! (server/src/credits.ts) owns the ledger; this module calls it with the
//! account's access token. While offline, the app may spend up to the signed
//! offline grant from the last balance check. Those spends wait in an
//! HMAC-protected file (app data/credits.json) and are sent to
//! `/v1/credits/reconcile` on the next sync.

use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use tauri::{AppHandle, Manager};
use tauri_plugin_opener::OpenerExt;

use crate::account::{self, blocking, endpoint, send};

const KEYRING_SERVICE: &str = "com.agapelabs.verso";
const KEYRING_USER: &str = "credits-queue-key";

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Pending {
    action: String,
    units: f64,
    idempotency_key: String,
    at: u64,
    /// Our estimate; the server charges by its own pricing when it reconciles.
    credits: i64,
}

#[derive(Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Store {
    /// Last pricing from the server, for estimates while offline.
    pricing: Option<Value>,
    /// Signed offline grant (`cr.buf`, `cr.bal`) from the last balance check.
    grant: Option<String>,
    pending: Vec<Pending>,
    mac: String,
    /// The file was edited outside the app: still reconcile it, but allow no offline spending.
    #[serde(skip)]
    tampered: bool,
}

// ---------- local store ----------

fn store_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("We couldn't find the app data folder ({e})."))?;
    std::fs::create_dir_all(&dir).map_err(|e| format!("We couldn't create the app data folder ({e})."))?;
    Ok(dir.join("credits.json"))
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

fn hmac_sha256(key: &[u8], msg: &[u8]) -> String {
    let mut k = [0u8; 64];
    if key.len() > 64 {
        k[..32].copy_from_slice(&Sha256::digest(key));
    } else {
        k[..key.len()].copy_from_slice(key);
    }
    let mut inner = Sha256::new();
    inner.update(k.map(|b| b ^ 0x36));
    inner.update(msg);
    let mut outer = Sha256::new();
    outer.update(k.map(|b| b ^ 0x5c));
    outer.update(inner.finalize());
    hex(&outer.finalize())
}

/// Random per-install key kept in the OS keychain.
fn mac_key() -> Vec<u8> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER).ok();
    if let Some(k) = entry.as_ref().and_then(|e| e.get_password().ok()) {
        return k.into_bytes();
    }
    let fresh = hex(&rand::random::<[u8; 32]>());
    match entry.map(|e| e.set_password(&fresh)) {
        Some(Ok(())) => fresh.into_bytes(),
        // shortcut: without a keychain the key is fixed, so the MAC only catches accidental edits.
        _ => b"verso-credits-no-keychain".to_vec(),
    }
}

fn mac_of(s: &Store) -> String {
    let body = serde_json::to_string(&(&s.pending, &s.grant)).unwrap_or_default();
    hmac_sha256(&mac_key(), body.as_bytes())
}

fn load(app: &AppHandle) -> Store {
    let Some(mut s) = store_path(app)
        .ok()
        .and_then(|p| std::fs::read_to_string(p).ok())
        .and_then(|t| serde_json::from_str::<Store>(&t).ok())
    else {
        return Store::default();
    };
    s.tampered = s.mac != mac_of(&s);
    s
}

fn save(app: &AppHandle, s: &mut Store) -> Result<(), String> {
    s.mac = mac_of(s);
    let json = serde_json::to_string_pretty(s).map_err(|e| e.to_string())?;
    std::fs::write(store_path(app)?, json).map_err(|e| format!("We couldn't save your credits ({e})."))
}

// ---------- server calls ----------

/// Authed request. Status 0 means offline (or the session couldn't be refreshed offline).
fn call(app: &AppHandle, api: &str, method: &str, path: &str, body: Option<Value>) -> Result<Value, (u16, String)> {
    let token = account::access_token(app, api)
        .map_err(|m| (if account::stored_refresh().is_some() { 0 } else { 401 }, m))?;
    let url = endpoint(api, path).map_err(|m| (400, m))?;
    let req = if method == "POST" { ureq2::post(&url) } else { ureq2::get(&url) };
    send(req.set("Authorization", &format!("Bearer {token}")), body)
}

/// Same formula as `costOf` in server/src/credits.ts.
fn estimate(pricing: &Option<Value>, action: &str, units: f64) -> Option<i64> {
    let c = &pricing.as_ref()?["costs"][action];
    let credits = c["credits"].as_f64()?;
    if credits == 0.0 {
        return Some(0);
    }
    Some(if c["unit"].as_str() == Some("minute") {
        ((units * credits - 1e-9).ceil() as i64).max(1)
    } else {
        credits as i64 * (units.ceil() as i64).max(1)
    })
}

/// (buffer, last known total) from the offline grant, if it's valid for this device and not expired.
fn grant(app: &AppHandle, s: &Store) -> Option<(i64, i64)> {
    let claims = account::verified_claims(app, s.grant.as_deref()?)?;
    Some((claims["cr"]["buf"].as_i64()?, claims["cr"]["bal"].as_i64()?))
}

fn offline_balance(app: &AppHandle, s: &Store) -> Value {
    let used: i64 = s.pending.iter().map(|p| p.credits).sum();
    let (buf, bal) = grant(app, s).unwrap_or((0, 0));
    json!({
        "allowance": null, "purchased": null, "total": bal - used, "resetsAt": null,
        "offlineBuffer": if s.tampered { 0 } else { (buf - used).max(0) },
        "offline": true, "pending": s.pending.len(),
    })
}

/// Sends queued offline spends. Every answered item (applied, duplicate or rejected) leaves the queue.
fn reconcile(app: &AppHandle, api: &str, s: &mut Store) -> Result<(), (u16, String)> {
    if s.pending.is_empty() {
        return Ok(());
    }
    let items: Vec<Value> = s
        .pending
        .iter()
        .map(|p| json!({ "action": p.action, "units": p.units, "idempotencyKey": p.idempotency_key, "at": p.at }))
        .collect();
    let v = call(app, api, "POST", "/v1/credits/reconcile", Some(json!({ "items": items })))?;
    let done: Vec<&str> = v["results"]
        .as_array()
        .map(|r| r.iter().filter_map(|x| x["idempotencyKey"].as_str()).collect())
        .unwrap_or_default();
    s.pending.retain(|p| !done.contains(&p.idempotency_key.as_str()));
    let _ = save(app, s);
    Ok(())
}

fn balance(app: &AppHandle, api: &str) -> Result<Value, String> {
    let mut s = load(app);
    let online = reconcile(app, api, &mut s).and_then(|_| call(app, api, "GET", "/v1/credits/balance", None));
    match online {
        Ok(mut v) => {
            s.grant = v["offlineGrant"].as_str().map(String::from);
            save(app, &mut s)?;
            if let Some(o) = v.as_object_mut() {
                o.remove("offlineGrant");
                o.insert("offline".into(), json!(false));
                o.insert("pending".into(), json!(s.pending.len()));
            }
            Ok(v)
        }
        Err((0, _)) => Ok(offline_balance(app, &s)),
        Err((_, m)) => Err(m),
    }
}

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn debit(app: &AppHandle, api: &str, action: String, units: f64, key: String) -> Result<Value, String> {
    let mut s = load(app);
    let _ = reconcile(app, api, &mut s);
    let body = json!({ "action": action, "units": units, "idempotencyKey": key });
    match call(app, api, "POST", "/v1/credits/debit", Some(body)) {
        Ok(v) => Ok(v),
        // Prefixes let the frontend tell "out of credits" and "offline" apart from other errors.
        Err((402, m)) => Err(format!("insufficient: {m}")),
        Err((0, _)) => {
            if let Some(p) = s.pending.iter().find(|p| p.idempotency_key == key) {
                return Ok(json!({ "charged": p.credits, "duplicate": true, "balance": offline_balance(app, &s) }));
            }
            let credits = estimate(&s.pricing, &action, units)
                .ok_or("offline: You're offline. Connect to the internet to use AI tools.")?;
            let used: i64 = s.pending.iter().map(|p| p.credits).sum();
            let buf = if s.tampered { 0 } else { grant(app, &s).map_or(0, |g| g.0) };
            if used + credits > buf {
                return Err(format!(
                    "offline: You're offline and this needs about {credits} credits. Connect to the internet to keep going."
                ));
            }
            s.pending.push(Pending { action, units, idempotency_key: key, at: now_ms(), credits });
            save(app, &mut s)?;
            Ok(json!({ "charged": credits, "duplicate": false, "balance": offline_balance(app, &s) }))
        }
        Err((_, m)) => Err(m),
    }
}

fn refund(app: &AppHandle, api: &str, key: String) -> Result<Value, String> {
    let mut s = load(app);
    if let Some(i) = s.pending.iter().position(|p| p.idempotency_key == key) {
        let p = s.pending.remove(i);
        save(app, &mut s)?;
        return Ok(json!({ "refunded": p.credits, "duplicate": false, "balance": offline_balance(app, &s) }));
    }
    call(app, api, "POST", "/v1/credits/refund", Some(json!({ "idempotencyKey": key }))).map_err(|(_, m)| m)
}

// ---------- commands ----------

/// Costs, packs and allowances. Cached for offline estimates.
#[tauri::command]
pub async fn credits_pricing(app: AppHandle, api: String) -> Result<Value, String> {
    blocking(move || {
        let mut s = load(&app);
        match send(ureq2::get(&endpoint(&api, "/v1/credits/pricing")?), None) {
            Ok(v) => {
                s.pricing = Some(v.clone());
                save(&app, &mut s)?;
                Ok(v)
            }
            Err((_, m)) => s.pricing.ok_or(m),
        }
    })
    .await
}

/// Sends queued offline spends, then returns the balance. Offline: the estimate from the last grant.
#[tauri::command]
pub async fn credits_balance(app: AppHandle, api: String) -> Result<Value, String> {
    blocking(move || balance(&app, &api)).await
}

#[tauri::command]
pub async fn credits_debit(
    app: AppHandle,
    api: String,
    action: String,
    units: f64,
    idempotency_key: String,
) -> Result<Value, String> {
    blocking(move || debit(&app, &api, action, units, idempotency_key)).await
}

#[tauri::command]
pub async fn credits_refund(app: AppHandle, api: String, idempotency_key: String) -> Result<Value, String> {
    blocking(move || refund(&app, &api, idempotency_key)).await
}

#[tauri::command]
pub async fn credits_history(app: AppHandle, api: String, cursor: Option<String>) -> Result<Value, String> {
    blocking(move || {
        let path = match cursor.filter(|c| c.chars().all(|ch| ch.is_ascii_digit()) && !c.is_empty()) {
            Some(c) => format!("/v1/credits/history?cursor={c}"),
            None => "/v1/credits/history".into(),
        };
        call(&app, &api, "GET", &path, None).map_err(|(_, m)| m)
    })
    .await
}

/// Opens the hosted checkout page in the browser. The frontend refreshes the balance when the window regains focus.
#[tauri::command]
pub async fn credits_buy(app: AppHandle, api: String, pack_id: String) -> Result<(), String> {
    let mut url = tauri::Url::parse(&endpoint(&api, "/credits/buy")?).map_err(|e| e.to_string())?;
    url.query_pairs_mut().append_pair("pack", &pack_id);
    app.opener()
        .open_url(url.as_str(), None::<&str>)
        .map_err(|e| format!("We couldn't open your browser ({e})."))
}
