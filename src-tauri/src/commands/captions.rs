//! Captions commands: speech model management and background transcription.
//!
//! Events:
//! - `captions://model-progress` `{ id, downloaded, total }`
//! - `captions://progress` `{ jobId, percent, stage }` (stage: loading | listening | writing)
//! - `captions://done` `{ jobId, segments }`
//! - `captions://error` `{ jobId, message }`

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, LazyLock, Mutex};
use std::time::{Duration, Instant};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};

use crate::captions::segment::CaptionSegment;
use crate::captions::{self, Language, models};

type Flags = LazyLock<Mutex<HashMap<String, Arc<AtomicBool>>>>;
static DOWNLOADS: Flags = LazyLock::new(Default::default);
static JOBS: Flags = LazyLock::new(Default::default);
static NEXT_JOB: AtomicU64 = AtomicU64::new(1);

fn models_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map(|d| d.join("models").join("whisper"))
        .map_err(|e| format!("We couldn't find the app data folder ({e})."))
}

fn register(map: &Flags, key: &str) -> Arc<AtomicBool> {
    let flag = Arc::new(AtomicBool::new(false));
    map.lock().unwrap().insert(key.to_string(), flag.clone());
    flag
}

fn cancel(map: &Flags, key: &str) {
    if let Some(flag) = map.lock().unwrap().get(key) {
        flag.store(true, Ordering::Relaxed);
    }
}

/// `invoke("caption_models")`: every model with size and whether it's downloaded.
#[tauri::command]
pub fn caption_models(app: AppHandle) -> Result<Vec<models::ModelStatus>, String> {
    Ok(models::statuses(&models_dir(&app)?))
}

#[derive(Clone, Serialize)]
struct ModelProgress<'a> {
    id: &'a str,
    downloaded: u64,
    total: u64,
}

/// `invoke("download_caption_model", { id })`. Resolves when the model is
/// downloaded and verified. Calling it again after a cancel resumes.
#[tauri::command]
pub async fn download_caption_model(app: AppHandle, id: String) -> Result<(), String> {
    let spec = models::find(&id)?;
    let dir = models_dir(&app)?;
    if DOWNLOADS.lock().unwrap().contains_key(&id) {
        return Err("That AI pack is already downloading.".into());
    }
    let flag = register(&DOWNLOADS, &id);
    let result = tauri::async_runtime::spawn_blocking(move || {
        let mut last = Instant::now() - Duration::from_secs(1);
        models::download(&dir, spec, &flag, |downloaded, total| {
            if downloaded == total || last.elapsed() >= Duration::from_millis(200) {
                last = Instant::now();
                let _ = app.emit(
                    "captions://model-progress",
                    ModelProgress {
                        id: spec.id,
                        downloaded,
                        total,
                    },
                );
            }
        })
    })
    .await
    .map_err(|e| format!("Something went wrong while downloading ({e})."));
    DOWNLOADS.lock().unwrap().remove(&id);
    result?.map(|_| ())
}

/// `invoke("cancel_caption_download", { id })`. The partial file is kept for resume.
#[tauri::command]
pub fn cancel_caption_download(id: String) {
    cancel(&DOWNLOADS, &id);
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct JobProgress<'a> {
    job_id: &'a str,
    percent: f64,
    stage: &'a str,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct JobDone {
    job_id: String,
    segments: Vec<CaptionSegment>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct JobError {
    job_id: String,
    message: String,
    cancelled: bool,
}

/// `invoke("transcribe", { path, inPoint, outPoint, language, modelId })`.
/// Returns a job id at once; results arrive as `captions://*` events.
/// Segment times are seconds in the source file.
#[tauri::command]
pub fn transcribe(
    app: AppHandle,
    path: String,
    in_point: f64,
    out_point: f64,
    language: String,
    model_id: String,
) -> Result<String, String> {
    let language = Language::parse(&language)?;
    let spec = models::find(&model_id)?;
    let dir = models_dir(&app)?;
    if !models::is_present(&dir, spec) {
        return Err("Download the captions AI pack first. It only takes a minute, once.".into());
    }
    let model = models::model_path(&dir, spec);
    let job_id = format!("cap{}", NEXT_JOB.fetch_add(1, Ordering::Relaxed));
    let flag = register(&JOBS, &job_id);

    let id = job_id.clone();
    std::thread::spawn(move || {
        let progress_app = app.clone();
        let progress_id = id.clone();
        let last_pct = Mutex::new(-1.0f64);
        let progress: captions::Progress = Arc::new(move |percent, stage| {
            let mut last = last_pct.lock().unwrap();
            if (percent - *last).abs() < 1.0 && percent < 100.0 {
                return;
            }
            *last = percent;
            let _ = progress_app.emit(
                "captions://progress",
                JobProgress {
                    job_id: &progress_id,
                    percent: percent.round(),
                    stage,
                },
            );
        });
        let result = captions::transcribe(
            &model,
            Path::new(&path),
            in_point,
            out_point,
            language,
            flag,
            progress,
        );
        JOBS.lock().unwrap().remove(&id);
        let _ = match result {
            Ok(segments) => app.emit(
                "captions://done",
                JobDone {
                    job_id: id,
                    segments,
                },
            ),
            Err(message) => app.emit(
                "captions://error",
                JobError {
                    job_id: id,
                    cancelled: message == captions::CANCELLED,
                    message,
                },
            ),
        };
    });
    Ok(job_id)
}

/// `invoke("cancel_transcription", { jobId })`.
#[tauri::command]
pub fn cancel_transcription(job_id: String) {
    cancel(&JOBS, &job_id);
}
