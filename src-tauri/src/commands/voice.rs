//! Voiceover and dubbing commands. Everything runs on-device after the one-time
//! model downloads.
//!
//! Events:
//! - `voice://progress` `{ task, id, percent, stage }`
//!   task: download | synthesize | translate | dub; stage: downloading | speaking | translating

use std::path::PathBuf;

use serde::Serialize;
use serde_json::json;
use tauri::{AppHandle, Emitter, Manager};

use crate::voice::{self, DubSegment, models};

fn models_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_data_dir()
        .map_err(|e| format!("We couldn't find the app data folder ({e})."))?
        .join("models")
        .join("voice"))
}

fn cache_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_cache_dir()
        .map_err(|e| format!("We couldn't find the app cache folder ({e})."))?
        .join("voice"))
}

fn emit(app: &AppHandle, task: &str, id: &str, percent: f64, stage: &str) {
    let _ = app.emit(
        "voice://progress",
        json!({ "task": task, "id": id, "percent": percent.floor(), "stage": stage }),
    );
}

async fn blocking<R: Send + 'static>(
    f: impl FnOnce() -> Result<R, String> + Send + 'static,
) -> Result<R, String> {
    tauri::async_runtime::spawn_blocking(f)
        .await
        .map_err(|e| format!("Something went wrong ({e})."))?
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceInfo {
    id: &'static str,
    name: &'static str,
    lang: &'static str,
    accent: &'static str,
    gender: &'static str,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VoiceModels {
    packs: Vec<models::PackStatus>,
    voices: Vec<VoiceInfo>,
}

#[tauri::command]
pub fn voice_models(app: AppHandle) -> Result<VoiceModels, String> {
    Ok(VoiceModels {
        packs: models::status(&models_dir(&app)?),
        voices: models::VOICES
            .iter()
            .map(|v| VoiceInfo {
                id: v.id,
                name: v.name,
                lang: v.lang,
                accent: v.accent,
                gender: v.gender,
            })
            .collect(),
    })
}

#[tauri::command]
pub async fn download_voice_model(app: AppHandle, id: String) -> Result<(), String> {
    let dir = models_dir(&app)?;
    blocking(move || {
        models::download(&dir, &id, |p| emit(&app, "download", &id, p, "downloading")).map(|_| ())
    })
    .await
}

/// Speaks `text` with `voice_id` at `speed` (1 = normal). Returns the WAV path.
#[tauri::command]
pub async fn synthesize(
    app: AppHandle,
    text: String,
    voice_id: String,
    speed: f32,
) -> Result<String, String> {
    let (root, cache) = (models_dir(&app)?, cache_dir(&app)?);
    blocking(move || {
        voice::synthesize(&root, &cache, &text, &voice_id, speed, &mut |p| {
            emit(&app, "synthesize", &voice_id, p, "speaking")
        })
        .map(|p| p.to_string_lossy().into_owned())
    })
    .await
}

/// Translates each line. Languages: en, hi, mr, hinglish (source only).
#[tauri::command]
pub async fn translate(
    app: AppHandle,
    texts: Vec<String>,
    from: String,
    to: String,
) -> Result<Vec<String>, String> {
    let root = models_dir(&app)?;
    blocking(move || {
        voice::translate_all(&root, &texts, &from, &to, &mut |p| {
            emit(&app, "translate", &to, p, "translating")
        })
    })
    .await
}

/// Dubs caption segments (timeline seconds) into `to` with `voice_id`. Pass
/// `from == to` for lines that are already translated. The WAV starts at the
/// first segment's start.
#[tauri::command]
pub async fn dub(
    app: AppHandle,
    segments: Vec<DubSegment>,
    from: String,
    to: String,
    voice_id: String,
) -> Result<String, String> {
    let (root, cache) = (models_dir(&app)?, cache_dir(&app)?);
    blocking(move || {
        voice::dub(
            &root,
            &cache,
            &segments,
            &from,
            &to,
            &voice_id,
            &mut |p, stage| emit(&app, "dub", &to, p, stage),
        )
        .map(|p| p.to_string_lossy().into_owned())
    })
    .await
}
