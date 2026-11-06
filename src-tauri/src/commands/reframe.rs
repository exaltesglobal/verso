//! Reframe commands: model downloads, speaker analysis (background job with
//! progress events) and crop planning.
//!
//! Events:
//! - `reframe://download` `{ id, percent }`
//! - `reframe://progress` `{ jobId, percent, stage }`
//! - `reframe://done` `{ jobId, analysis }`
//! - `reframe://error` `{ jobId, message }`

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};

use serde::Serialize;
use serde_json::json;
use tauri::{AppHandle, Emitter, Manager};

use crate::reframe::ReframeAnalysis;
use crate::reframe::analyze;
use crate::reframe::models::{self, ModelStatus};
use crate::reframe::planner::{self, CropPath, Mode, PlanOptions};

fn models_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_data_dir()
        .map_err(|e| format!("We couldn't find the app data folder ({e})."))?
        .join("models")
        .join("reframe"))
}

fn cache_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_cache_dir()
        .map_err(|e| format!("We couldn't find the app cache folder ({e})."))?
        .join("reframe"))
}

fn analysis_file(cache: &Path, id: &str) -> PathBuf {
    cache.join(format!("{id}.json"))
}

#[tauri::command]
pub fn reframe_models(app: AppHandle) -> Result<Vec<ModelStatus>, String> {
    Ok(models::status(&models_dir(&app)?))
}

#[tauri::command]
pub async fn download_reframe_model(app: AppHandle, id: String) -> Result<(), String> {
    let dir = models_dir(&app)?;
    tauri::async_runtime::spawn_blocking(move || {
        models::download(&dir, &id, |percent| {
            let _ = app.emit(
                "reframe://download",
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

/// Starts finding speakers in `path` between `inPoint` and `outPoint` (source
/// seconds). Returns a job id at once; results arrive as events. Cached per file
/// + range + installed models, so a repeat request finishes instantly.
#[tauri::command]
pub fn analyze_reframe(
    app: AppHandle,
    path: String,
    in_point: f64,
    out_point: Option<f64>,
) -> Result<String, String> {
    static NEXT: AtomicU64 = AtomicU64::new(1);
    let job_id = format!("reframe-{}", NEXT.fetch_add(1, Ordering::Relaxed));
    let mdir = models_dir(&app)?;
    let cache = cache_dir(&app)?;
    let installed: Vec<&str> = models::MODELS
        .iter()
        .filter(|m| models::installed(&mdir, m.id).is_some())
        .map(|m| m.id)
        .collect();
    let analysis_id = crate::commands::thumbnails::cache_key(
        Path::new(&path),
        &format!(
            "reframe:v1:{in_point:.3}:{:.3}:{}",
            out_point.unwrap_or(-1.0),
            installed.join(",")
        ),
    )?;

    let job = job_id.clone();
    std::thread::spawn(move || {
        let result = (|| -> Result<ReframeAnalysis, String> {
            let file = analysis_file(&cache, &analysis_id);
            if let Ok(bytes) = std::fs::read(&file)
                && let Ok(a) = serde_json::from_slice::<ReframeAnalysis>(&bytes)
            {
                return Ok(a);
            }
            let mut m = analyze::load_models(&mdir)?;
            let mut last = -1.0;
            let mut progress = |percent: f64, stage: &str| {
                let p = percent.floor();
                if p > last {
                    last = p;
                    let _ = app.emit(
                        "reframe://progress",
                        ProgressEvent {
                            job_id: &job,
                            percent: p,
                            stage,
                        },
                    );
                }
            };
            let a = analyze::analyze(
                Path::new(&path),
                in_point,
                out_point,
                &mut m,
                &cache.join(&analysis_id),
                analysis_id.clone(),
                &mut progress,
            )?;
            std::fs::create_dir_all(&cache)
                .and_then(|_| std::fs::write(&file, serde_json::to_vec(&a).unwrap_or_default()))
                .map_err(|e| format!("We couldn't save the speaker results ({e})."))?;
            Ok(a)
        })();
        let _ = match result {
            Ok(analysis) => app.emit(
                "reframe://done",
                json!({ "jobId": job, "analysis": analysis }),
            ),
            Err(message) => app.emit(
                "reframe://error",
                json!({ "jobId": job, "message": message }),
            ),
        };
    });
    Ok(job_id)
}

/// Plans a crop path from a finished analysis. Fast; no caching needed.
#[tauri::command]
pub fn plan_crop(
    app: AppHandle,
    analysis_id: String,
    aspect: String,
    mode: Mode,
    options: Option<PlanOptions>,
) -> Result<CropPath, String> {
    if analysis_id.contains(['/', '\\', '.']) {
        return Err("That speaker result isn't valid.".into());
    }
    let bytes = std::fs::read(analysis_file(&cache_dir(&app)?, &analysis_id))
        .map_err(|_| "Find speakers again: we couldn't find the earlier results.".to_string())?;
    let a: ReframeAnalysis = serde_json::from_slice(&bytes)
        .map_err(|_| "Find speakers again: the earlier results are damaged.".to_string())?;
    planner::plan(&a, &aspect, mode, &options.unwrap_or_default())
}
