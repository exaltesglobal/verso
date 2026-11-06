//! Smart-tool analysis commands. Long jobs report `analysis://progress`
//! events `{ task, percent }` so the UI can say "Listening… 40%".

use std::path::Path;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};

use crate::analysis::{
    self, beats::Beats, emphasis::Moment, silence::SilenceOptions, silence::Span,
};
use crate::commands::waveform::cache_key;

const SPEECH_RATE: u32 = 16_000;

#[derive(Serialize, Clone)]
struct Progress {
    task: &'static str,
    percent: f64,
}

fn reporter(app: &AppHandle, task: &'static str) -> impl FnMut(f64) + use<> {
    let app = app.clone();
    move |p| {
        let _ = app.emit(
            "analysis://progress",
            Progress {
                task,
                percent: (p * 100.0).clamp(0.0, 100.0).round(),
            },
        );
    }
}

async fn blocking<T: Send + 'static>(
    f: impl FnOnce() -> Result<T, String> + Send + 'static,
) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(f)
        .await
        .map_err(|e| format!("Something went wrong while listening ({e})."))?
}

/// Pauses between `in_point` and `out_point` (source seconds), as source seconds.
#[tauri::command]
pub async fn detect_silences(
    app: AppHandle,
    path: String,
    in_point: f64,
    out_point: f64,
    options: SilenceOptions,
) -> Result<Vec<Span>, String> {
    let mut report = reporter(&app, "silences");
    blocking(move || {
        let pcm = analysis::decode(
            Path::new(&path),
            in_point,
            Some(out_point),
            SPEECH_RATE,
            |p| report(p * 0.95),
        )?;
        let spans = analysis::silence::detect(&pcm, SPEECH_RATE, in_point, &options);
        report(1.0);
        Ok(spans)
    })
    .await
}

/// Big moments (loudness and pitch jumps) between `in_point` and `out_point`.
#[tauri::command]
pub async fn detect_emphasis(
    app: AppHandle,
    path: String,
    in_point: f64,
    out_point: f64,
) -> Result<Vec<Moment>, String> {
    let mut report = reporter(&app, "emphasis");
    blocking(move || {
        let pcm = analysis::decode(
            Path::new(&path),
            in_point,
            Some(out_point),
            SPEECH_RATE,
            |p| report(p * 0.9),
        )?;
        let moments = analysis::emphasis::detect(&pcm, SPEECH_RATE, in_point);
        report(1.0);
        Ok(moments)
    })
    .await
}

/// Tempo and beat times of a whole music file. Cached per file.
#[tauri::command]
pub async fn detect_beats(
    app: AppHandle,
    path: String,
    duration_sec: Option<f64>,
) -> Result<Beats, String> {
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|e| format!("We couldn't find the app cache folder ({e})."))?
        .join("beats");
    let mut report = reporter(&app, "beats");
    blocking(move || {
        let src = Path::new(&path);
        let key = cache_key(src)
            .ok_or("We couldn't find that file. It may have been moved or deleted.")?;
        let file = cache_dir.join(format!("{key}.json"));
        if let Some(b) = std::fs::read(&file)
            .ok()
            .and_then(|bytes| serde_json::from_slice::<Beats>(&bytes).ok())
        {
            report(1.0);
            return Ok(b);
        }
        let pcm = analysis::decode(src, 0.0, duration_sec, analysis::beats::RATE, |p| {
            report(p * 0.7)
        })?;
        let beats = analysis::beats::detect(&pcm, |p| report(0.7 + p * 0.3));
        let _ = std::fs::create_dir_all(&cache_dir);
        if let Ok(json) = serde_json::to_vec(&beats) {
            let _ = std::fs::write(&file, json);
        }
        report(1.0);
        Ok(beats)
    })
    .await
}
