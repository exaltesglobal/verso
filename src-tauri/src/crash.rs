//! Privacy-first crash reports. Panics (and frontend errors, via
//! `report_frontend_error`) are written to `<app log dir>/crashes/*.json`
//! with the app version, OS and stack only. Nothing leaves the machine until
//! the user agrees to send them on the next launch.

use std::path::PathBuf;
use std::sync::OnceLock;
use std::time::{SystemTime, UNIX_EPOCH};

use serde_json::{Value, json};
use tauri::{AppHandle, Manager};

static CRASH_DIR: OnceLock<PathBuf> = OnceLock::new();
static VERSION: OnceLock<String> = OnceLock::new();
const MAX_REPORTS: usize = 20;
const MAX_TEXT: usize = 16_000;

pub fn init(app: &AppHandle) {
    if let Ok(dir) = app.path().app_log_dir() {
        let _ = CRASH_DIR.set(dir.join("crashes"));
    }
    let _ = VERSION.set(app.package_info().version.to_string());
    let previous = std::panic::take_hook();
    std::panic::set_hook(Box::new(move |info| {
        let stack = std::backtrace::Backtrace::force_capture().to_string();
        write("panic", &info.to_string(), &stack);
        previous(info);
    }));
}

/// Removes the home folder (and so the user name) from paths, and caps the length.
fn scrub(text: &str) -> String {
    let mut out = text.to_string();
    for var in ["USERPROFILE", "HOME"] {
        if let Ok(home) = std::env::var(var) {
            if home.len() > 3 {
                out = out.replace(&home, "~");
            }
        }
    }
    out.chars().take(MAX_TEXT).collect()
}

fn reports() -> Vec<PathBuf> {
    let Some(dir) = CRASH_DIR.get() else { return vec![] };
    let Ok(entries) = std::fs::read_dir(dir) else { return vec![] };
    entries
        .filter_map(|e| e.ok().map(|e| e.path()))
        .filter(|p| p.extension().is_some_and(|x| x == "json"))
        .collect()
}

fn write(kind: &str, message: &str, stack: &str) {
    let Some(dir) = CRASH_DIR.get() else { return };
    if reports().len() >= MAX_REPORTS || std::fs::create_dir_all(dir).is_err() {
        return;
    }
    let ts = SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_millis()).unwrap_or(0);
    let report = json!({
        "kind": kind,
        "appVersion": VERSION.get().cloned().unwrap_or_default(),
        "os": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "message": scrub(message),
        "stack": scrub(stack),
        "createdAt": ts as u64,
    });
    let _ = std::fs::write(dir.join(format!("{ts}-{kind}.json")), report.to_string());
}

#[tauri::command]
pub fn report_frontend_error(message: String, stack: Option<String>) {
    write("frontend", &message, stack.as_deref().unwrap_or(""));
}

/// How many reports are waiting to be sent.
#[tauri::command]
pub fn pending_crash_reports() -> usize {
    reports().len()
}

#[tauri::command]
pub fn discard_crash_reports() {
    for p in reports() {
        let _ = std::fs::remove_file(p);
    }
}

/// Sends every waiting report to `<api>/v1/crash-reports` and deletes the ones that arrived.
#[tauri::command]
pub async fn send_crash_reports(api: String) -> Result<usize, String> {
    let base = api.trim().trim_end_matches('/').to_string();
    if base.is_empty() {
        return Err("Crash reports can't be sent yet because sign-in isn't set up.".into());
    }
    tauri::async_runtime::spawn_blocking(move || {
        let mut sent = 0;
        for path in reports() {
            let Some(report) = std::fs::read_to_string(&path).ok().and_then(|s| serde_json::from_str::<Value>(&s).ok()) else {
                let _ = std::fs::remove_file(&path);
                continue;
            };
            let res = ureq2::post(&format!("{base}/v1/crash-reports"))
                .timeout(std::time::Duration::from_secs(15))
                .send_json(report);
            match res {
                Ok(_) | Err(ureq2::Error::Status(400, _)) => {
                    let _ = std::fs::remove_file(&path);
                    sent += 1;
                }
                Err(_) => return Err("We couldn't send the report. We'll ask again next time.".to_string()),
            }
        }
        Ok(sent)
    })
    .await
    .map_err(|e| e.to_string())?
}
