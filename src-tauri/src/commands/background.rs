//! Background commands: model download, render a processed copy (background
//! job with progress events) and cancel.
//!
//! Events:
//! - `background://download` `{ id, percent }`
//! - `background://progress` `{ jobId, percent, stage }`
//! - `background://done` `{ jobId, path, start, end, mode }`
//! - `background://error` `{ jobId, message, cancelled }`

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{LazyLock, Mutex};

use serde::Serialize;
use serde_json::json;
use tauri::{AppHandle, Emitter, Manager};

use crate::background::{self, Mode, Options};
use crate::reframe::models::{self, ModelStatus};

static CANCELLED: LazyLock<Mutex<HashMap<String, bool>>> = LazyLock::new(Default::default);

fn models_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_data_dir()
        .map_err(|e| format!("We couldn't find the app data folder ({e})."))?
        .join("models")
        .join("background"))
}

fn cache_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_cache_dir()
        .map_err(|e| format!("We couldn't find the app cache folder ({e})."))?
        .join("background"))
}

#[tauri::command]
pub fn background_models(app: AppHandle) -> Result<Vec<ModelStatus>, String> {
    Ok(models::status_of(&models_dir(&app)?, background::MODELS))
}

#[tauri::command]
pub async fn download_background_model(app: AppHandle, id: String) -> Result<(), String> {
    let dir = models_dir(&app)?;
    let spec = background::MODELS
        .iter()
        .find(|m| m.id == id)
        .ok_or_else(|| format!("We don't know the model \"{id}\"."))?;
    tauri::async_runtime::spawn_blocking(move || {
        models::download_spec(&dir, spec, |percent| {
            let _ = app.emit(
                "background://download",
                json!({ "id": id, "percent": percent }),
            );
        })
        .map(|_| ())
    })
    .await
    .map_err(|e| format!("Something went wrong while downloading ({e})."))?
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ProgressEvent<'a> {
    job_id: &'a str,
    percent: f64,
    stage: &'a str,
}

/// Starts making a processed copy of `path` between `inPoint` and `outPoint`
/// (source seconds) into the app cache. Returns a job id at once; the result
/// arrives as events. Cached per file + range + mode + options.
#[tauri::command]
pub fn render_background(
    app: AppHandle,
    path: String,
    in_point: f64,
    out_point: Option<f64>,
    mode: Mode,
    options: Option<Options>,
) -> Result<String, String> {
    static NEXT: AtomicU64 = AtomicU64::new(1);
    let job_id = format!("bg-{}", NEXT.fetch_add(1, Ordering::Relaxed));
    let options = options.unwrap_or_default();
    let model = models_dir(&app)?.join(background::MODELS[0].file);
    if !model.is_file() {
        return Err("Download the person finder first, then try again.".into());
    }
    let cache = cache_dir(&app)?;
    let key = crate::commands::thumbnails::cache_key(
        Path::new(&path),
        &format!(
            "bg:v1:{in_point:.3}:{:.3}:{mode:?}:{options:?}",
            out_point.unwrap_or(-1.0)
        ),
    )?;
    let out = cache.join(format!("{key}.{}", mode.ext()));
    let meta = cache.join(format!("{key}.json"));
    CANCELLED.lock().unwrap().insert(job_id.clone(), false);

    let job = job_id.clone();
    std::thread::spawn(move || {
        let result = (|| -> Result<(f64, f64), String> {
            if out.is_file()
                && let Ok(b) = std::fs::read(&meta)
                && let Ok((s, e)) = serde_json::from_slice::<(f64, f64)>(&b)
            {
                return Ok((s, e));
            }
            std::fs::create_dir_all(&cache)
                .map_err(|e| format!("We couldn't create the cache folder ({e})."))?;
            let mut last = -1.0;
            let mut progress = |percent: f64, stage: &str| {
                let p = percent.floor();
                if p > last {
                    last = p;
                    let _ = app.emit(
                        "background://progress",
                        ProgressEvent {
                            job_id: &job,
                            percent: p,
                            stage,
                        },
                    );
                }
            };
            let cancelled = || {
                CANCELLED
                    .lock()
                    .unwrap()
                    .get(&job)
                    .copied()
                    .unwrap_or(false)
            };
            let range = background::render(
                &background::Request {
                    src: Path::new(&path),
                    in_point,
                    out_point,
                    mode,
                    options: &options,
                    model: &model,
                    out: &out,
                },
                &cancelled,
                &mut progress,
            )?;
            let _ = std::fs::write(&meta, serde_json::to_vec(&range).unwrap_or_default());
            Ok(range)
        })();
        let cancelled = CANCELLED.lock().unwrap().remove(&job).unwrap_or(false);
        let _ = match result {
            Ok((start, end)) => app.emit(
                "background://done",
                json!({ "jobId": job, "path": out.to_string_lossy(), "start": start, "end": end, "mode": mode }),
            ),
            Err(message) => app.emit(
                "background://error",
                json!({ "jobId": job, "message": message, "cancelled": cancelled }),
            ),
        };
    });
    Ok(job_id)
}

/// Unknown or finished jobs are a no-op.
#[tauri::command]
pub fn cancel_background(job_id: String) {
    if let Some(c) = CANCELLED.lock().unwrap().get_mut(&job_id) {
        *c = true;
    }
}
