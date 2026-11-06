//! Accounts: desktop sign-in (system browser, loopback + PKCE), the refresh
//! token in the OS keychain, and plan entitlements backed by a signed offline
//! token. See docs/SETUP-KEYS.md section 7 for the server side.
//!
//! The frontend passes the API base URL (`VITE_VERSO_API_URL`) to every
//! command that talks to the server. Without it, everything still works
//! offline as the Free plan.

use std::collections::HashMap;
use std::io::{BufRead, BufReader, ErrorKind, Write};
use std::net::{TcpListener, TcpStream};
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{Duration, Instant};

use base64::Engine;
use base64::engine::general_purpose::URL_SAFE_NO_PAD as B64;
use jsonwebtoken::{Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use tauri::{AppHandle, Manager};
use tauri_plugin_opener::OpenerExt;

const KEYRING_SERVICE: &str = "com.agapelabs.verso";
const KEYRING_USER: &str = "refresh-token";
/// Ed25519 public key (the JWK `x` value, base64url) that signs offline
/// entitlement tokens. Baked in at build time, see docs/RELEASE.md.
const PINNED_KEY: Option<&str> = option_env!("VERSO_ENTITLEMENT_PUBLIC_KEY");
const SIGN_IN_TIMEOUT: Duration = Duration::from_secs(300);

#[derive(Default)]
pub struct AccountState {
    access: Mutex<Option<(String, Instant)>>,
    /// Held while refreshing: refresh tokens rotate, and using one twice signs the session out.
    refresh_lock: Mutex<()>,
    /// Last entitlements fetched online this session (used when no key can check the offline token).
    online: Mutex<Option<Value>>,
}

#[derive(Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Cache {
    device_id: String,
    email: Option<String>,
    offline_token: Option<String>,
    /// Debug builds only, when no key is pinned: the key fetched from the server.
    dev_public_key: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Entitlements {
    plan: String,
    features: Value,
    limits: Value,
    signed_in: bool,
    email: Option<String>,
    /// Epoch milliseconds until which the plan holds without going online.
    offline_until: Option<u64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    signed_in: bool,
    email: Option<String>,
}

/// Mirrors `PLANS.free` in server/src/plans.ts.
fn free() -> Entitlements {
    Entitlements {
        plan: "free".into(),
        features: json!({
            "auto_clips": false, "speaker_reframe": false, "background_pro": false, "dubbing": false, "export_4k": false,
            "watermark_free": true, "caption_styles_pro": false, "templates_pro": false
        }),
        limits: json!({ "auto_clips_per_month": 0, "max_devices": 1, "max_export_height": 1080 }),
        signed_in: false,
        email: None,
        offline_until: None,
    }
}

// ---------- local cache (app data/account.json) ----------

fn cache_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("We couldn't find the app data folder ({e})."))?;
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("We couldn't create the app data folder ({e})."))?;
    Ok(dir.join("account.json"))
}

fn load_cache(app: &AppHandle) -> Cache {
    let path = cache_path(app).ok();
    let mut cache: Cache = path
        .as_ref()
        .and_then(|p| std::fs::read_to_string(p).ok())
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default();
    if cache.device_id.is_empty() {
        cache.device_id = hex(&rand::random::<[u8; 16]>());
        let _ = save_cache(app, &cache);
    }
    cache
}

fn save_cache(app: &AppHandle, cache: &Cache) -> Result<(), String> {
    let json = serde_json::to_string_pretty(cache).map_err(|e| e.to_string())?;
    std::fs::write(cache_path(app)?, json)
        .map_err(|e| format!("We couldn't save your sign-in ({e})."))
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

// ---------- keychain ----------

fn keyring() -> Result<keyring::Entry, String> {
    keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER)
        .map_err(|e| format!("We couldn't open the system keychain ({e})."))
}

pub(crate) fn stored_refresh() -> Option<String> {
    keyring().ok()?.get_password().ok()
}

fn sign_out_local(app: &AppHandle) {
    if let Ok(entry) = keyring() {
        let _ = entry.delete_credential();
    }
    let state = app.state::<AccountState>();
    *state.access.lock().unwrap() = None;
    *state.online.lock().unwrap() = None;
    let mut cache = load_cache(app);
    cache.email = None;
    cache.offline_token = None;
    let _ = save_cache(app, &cache);
}

// ---------- HTTP ----------

pub(crate) fn endpoint(api: &str, path: &str) -> Result<String, String> {
    let base = api.trim().trim_end_matches('/');
    if base.is_empty() {
        return Err("Sign-in isn't set up yet.".into());
    }
    Ok(format!("{base}{path}"))
}

/// Sends a request. Errors are `(status, friendly message)`; status 0 means we couldn't reach the server.
pub(crate) fn send(req: ureq2::Request, body: Option<Value>) -> Result<Value, (u16, String)> {
    let req = req.timeout(Duration::from_secs(20));
    let res = match body {
        Some(b) => req.send_json(b),
        None => req.call(),
    };
    match res {
        Ok(r) if r.status() == 204 => Ok(Value::Null),
        Ok(r) => r
            .into_json()
            .map_err(|_| (0, "The server sent an answer we couldn't read.".into())),
        Err(ureq2::Error::Status(code, r)) => {
            let v: Value = r.into_json().unwrap_or_default();
            let msg = v["message"]
                .as_str()
                .unwrap_or("Something went wrong on our side. Please try again.");
            Err((code, msg.to_string()))
        }
        Err(_) => Err((
            0,
            "We couldn't reach Verso. Check your internet connection and try again.".into(),
        )),
    }
}

fn store_tokens(app: &AppHandle, v: &Value) -> Result<String, String> {
    let access = v["access_token"]
        .as_str()
        .ok_or("The server didn't send a sign-in token.")?;
    let refresh = v["refresh_token"]
        .as_str()
        .ok_or("The server didn't send a sign-in token.")?;
    keyring()?
        .set_password(refresh)
        .map_err(|e| format!("We couldn't save your sign-in to the system keychain ({e})."))?;
    let ttl = Duration::from_secs(v["expires_in"].as_u64().unwrap_or(900));
    *app.state::<AccountState>().access.lock().unwrap() =
        Some((access.to_string(), Instant::now() + ttl));
    Ok(access.to_string())
}

/// A valid access token, refreshing it with the keychain's refresh token when it's about to expire.
pub(crate) fn access_token(app: &AppHandle, api: &str) -> Result<String, String> {
    let state = app.state::<AccountState>();
    let _guard = state.refresh_lock.lock().unwrap();
    if let Some((token, exp)) = state.access.lock().unwrap().clone() {
        if exp > Instant::now() + Duration::from_secs(60) {
            return Ok(token);
        }
    }
    let refresh = stored_refresh().ok_or("You're signed out.")?;
    let body = json!({ "grant_type": "refresh_token", "refresh_token": refresh });
    match send(ureq2::post(&endpoint(api, "/v1/auth/token")?), Some(body)) {
        Ok(v) => store_tokens(app, &v),
        Err((401, msg)) => {
            // Revoked, expired or this device was removed from the account page.
            sign_out_local(app);
            Err(msg)
        }
        Err((_, msg)) => Err(msg),
    }
}

fn authed_get(app: &AppHandle, api: &str, path: &str) -> Result<Value, String> {
    let token = access_token(app, api)?;
    send(
        ureq2::get(&endpoint(api, path)?).set("Authorization", &format!("Bearer {token}")),
        None,
    )
    .map_err(|(_, m)| m)
}

pub(crate) async fn blocking<T: Send + 'static>(
    f: impl FnOnce() -> Result<T, String> + Send + 'static,
) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(f)
        .await
        .map_err(|e| e.to_string())?
}

// ---------- offline token ----------

/// All claims of a token signed by the entitlement key, for this device. None when invalid or expired.
fn decode(token: &str, x: &str, device_id: &str) -> Option<Value> {
    let key = DecodingKey::from_ed_components(x).ok()?;
    let mut validation = Validation::new(Algorithm::EdDSA);
    validation.set_audience(&["verso-desktop"]);
    validation.set_issuer(&["verso-accounts"]);
    let data = jsonwebtoken::decode::<Value>(token, &key, &validation).ok()?;
    if data.claims["did"].as_str().is_some_and(|d| d != device_id) {
        return None;
    }
    Some(data.claims)
}

fn verify(token: &str, x: &str, device_id: &str) -> Option<(Value, u64)> {
    let claims = decode(token, x, device_id)?;
    Some((claims["ent"].clone(), claims["exp"].as_u64()?))
}

/// Claims of another server-signed token (e.g. the credits offline grant), checked like the entitlement token.
pub(crate) fn verified_claims(app: &AppHandle, token: &str) -> Option<Value> {
    let cache = load_cache(app);
    let key = PINNED_KEY.map(String::from).or(cache.dev_public_key)?;
    decode(token, &key, &cache.device_id)
}

fn current(app: &AppHandle) -> Entitlements {
    let mut out = free();
    if stored_refresh().is_none() {
        return out;
    }
    let cache = load_cache(app);
    out.signed_in = true;
    out.email = cache.email.clone();
    let key = PINNED_KEY
        .map(String::from)
        .or(cache.dev_public_key.clone());
    let verified = match (&cache.offline_token, &key) {
        (Some(t), Some(k)) => verify(t, k, &cache.device_id),
        _ => None,
    };
    let ent = match verified {
        Some((ent, exp)) => {
            out.offline_until = Some(exp * 1000);
            Some(ent)
        }
        None => app.state::<AccountState>().online.lock().unwrap().clone(),
    };
    if let Some(ent) = ent {
        out.plan = ent["plan"].as_str().unwrap_or("free").to_string();
        out.features = ent["features"].clone();
        out.limits = ent["limits"].clone();
    }
    out
}

fn fetch(app: &AppHandle, api: &str) -> Result<Entitlements, String> {
    let v = authed_get(app, api, "/v1/me/entitlements")?;
    let mut cache = load_cache(app);
    cache.offline_token = v["offlineToken"].as_str().map(String::from);
    // shortcut: debug builds trust the server's key on first use; release builds must pin it.
    if PINNED_KEY.is_none() && cfg!(debug_assertions) && cache.dev_public_key.is_none() {
        if let Ok(jwks) = send(ureq2::get(&endpoint(api, "/.well-known/jwks.json")?), None) {
            cache.dev_public_key = jwks["keys"][0]["x"].as_str().map(String::from);
        }
    }
    save_cache(app, &cache)?;
    *app.state::<AccountState>().online.lock().unwrap() = Some(v);
    Ok(current(app))
}

// ---------- loopback sign-in ----------

const PAGE_OK: &str = "You're signed in. You can close this tab and go back to Verso.";
const PAGE_FAIL: &str = "Sign-in didn't finish. Go back to Verso and try again.";

fn respond(stream: &mut TcpStream, status: &str, text: &str) {
    let body = format!(
        "<!doctype html><meta charset=utf-8><title>Verso</title>\
         <body style=\"margin:0;display:grid;place-items:center;height:100vh;background:#0B0B0F;color:#F5F4F0;\
         font:16px 'Segoe UI',system-ui,sans-serif\"><p>{text}</p></body>"
    );
    let _ = write!(
        stream,
        "HTTP/1.1 {status}\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
        body.len()
    );
}

fn wait_for_code(listener: &TcpListener, state: &str) -> Result<String, String> {
    listener.set_nonblocking(true).map_err(|e| e.to_string())?;
    let deadline = Instant::now() + SIGN_IN_TIMEOUT;
    loop {
        let mut stream = match listener.accept() {
            Ok((s, _)) => s,
            Err(e) if e.kind() == ErrorKind::WouldBlock => {
                if Instant::now() > deadline {
                    return Err("Sign-in timed out. Please try again.".into());
                }
                std::thread::sleep(Duration::from_millis(200));
                continue;
            }
            Err(e) => return Err(format!("Sign-in stopped unexpectedly ({e}).")),
        };
        let _ = stream.set_nonblocking(false);
        let _ = stream.set_read_timeout(Some(Duration::from_secs(5)));
        let mut line = String::new();
        let _ = BufReader::new(&stream).read_line(&mut line);
        let target = line.split_whitespace().nth(1).unwrap_or("/");
        let Ok(url) = tauri::Url::parse(&format!("http://127.0.0.1{target}")) else {
            continue;
        };
        if url.path() != "/callback" {
            respond(&mut stream, "404 Not Found", "");
            continue;
        }
        let q: HashMap<String, String> = url.query_pairs().into_owned().collect();
        return match (
            q.get("state").map(String::as_str) == Some(state),
            q.get("code"),
        ) {
            (true, Some(code)) => {
                respond(&mut stream, "200 OK", PAGE_OK);
                Ok(code.clone())
            }
            _ => {
                respond(&mut stream, "400 Bad Request", PAGE_FAIL);
                Err("Sign-in didn't finish. Please try again.".into())
            }
        };
    }
}

fn device_name() -> String {
    std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_else(|_| format!("{} computer", std::env::consts::OS))
}

fn sign_in(app: &AppHandle, api: &str) -> Result<Entitlements, String> {
    let listener = TcpListener::bind("127.0.0.1:0")
        .map_err(|e| format!("We couldn't start sign-in ({e})."))?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    let verifier = B64.encode(rand::random::<[u8; 32]>());
    let challenge = B64.encode(Sha256::digest(verifier.as_bytes()));
    let state = B64.encode(rand::random::<[u8; 16]>());
    let mut cache = load_cache(app);

    let mut url =
        tauri::Url::parse(&endpoint(api, "/desktop/sign-in")?).map_err(|e| e.to_string())?;
    url.query_pairs_mut()
        .append_pair("port", &port.to_string())
        .append_pair("code_challenge", &challenge)
        .append_pair("code_challenge_method", "S256")
        .append_pair("state", &state)
        .append_pair("device_id", &cache.device_id)
        .append_pair("device_name", &device_name())
        .append_pair("platform", std::env::consts::OS);
    app.opener()
        .open_url(url.as_str(), None::<&str>)
        .map_err(|e| format!("We couldn't open your browser ({e})."))?;

    let code = wait_for_code(&listener, &state)?;
    let body =
        json!({ "grant_type": "authorization_code", "code": code, "code_verifier": verifier });
    let tokens =
        send(ureq2::post(&endpoint(api, "/v1/auth/token")?), Some(body)).map_err(|(_, m)| m)?;
    store_tokens(app, &tokens)?;

    let me = authed_get(app, api, "/v1/me")?;
    cache.email = me["user"]["email"].as_str().map(String::from);
    save_cache(app, &cache)?;
    fetch(app, api)
}

// ---------- commands ----------

/// Opens the browser to sign in and waits (up to 5 minutes) for it to come back.
#[tauri::command]
pub async fn start_sign_in(app: AppHandle, api: String) -> Result<Entitlements, String> {
    blocking(move || sign_in(&app, &api)).await
}

#[tauri::command]
pub async fn sign_out(app: AppHandle, api: String) -> Result<Entitlements, String> {
    blocking(move || {
        if let (Some(refresh), Ok(url)) = (stored_refresh(), endpoint(&api, "/v1/auth/logout")) {
            let _ = send(ureq2::post(&url), Some(json!({ "refresh_token": refresh })));
        }
        sign_out_local(&app);
        Ok(free())
    })
    .await
}

/// Whether someone is signed in. Refreshes the access token when it's due; offline is not an error.
#[tauri::command]
pub async fn get_session(app: AppHandle, api: String) -> Result<Session, String> {
    blocking(move || {
        if stored_refresh().is_some() && !api.trim().is_empty() {
            let _ = access_token(&app, &api);
        }
        let signed_in = stored_refresh().is_some();
        let email = if signed_in {
            load_cache(&app).email
        } else {
            None
        };
        Ok(Session { signed_in, email })
    })
    .await
}

/// Fetches fresh entitlements and a new offline token from the server.
#[tauri::command]
pub async fn fetch_entitlements(app: AppHandle, api: String) -> Result<Entitlements, String> {
    blocking(move || fetch(&app, &api)).await
}

/// Entitlements from the cached offline token, no network. Free when signed out or expired.
#[tauri::command]
pub async fn get_entitlements(app: AppHandle) -> Result<Entitlements, String> {
    blocking(move || Ok(current(&app))).await
}

#[tauri::command]
pub async fn list_devices(app: AppHandle, api: String) -> Result<Value, String> {
    blocking(move || authed_get(&app, &api, "/v1/me/devices")).await
}
