//! One-click voice clean-up: renders a cleaned WAV copy of a clip's sound into
//! the app cache. The original file is never touched.
//!
//! Chain: highpass -> noise reduction (`arnndn` with an RNNoise model, or
//! `afftdn` when the model can't be downloaded) -> deesser -> acompressor ->
//! loudnorm, two passes, to -14 LUFS (social media loudness).
//!
//! Event: `enhance://progress` `{ percent, stage }`, stage is "download",
//! "measure" or "clean".

use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::io::{BufRead, BufReader, ErrorKind, Read};
use std::path::{Path, PathBuf};
use std::process::Stdio;

use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{AppHandle, Emitter, Manager};

use super::waveform::cache_key;
use crate::export::parse_progress_time;
use crate::reframe::models::{ModelSpec, download_spec};
use crate::tools::{self, Tool};

/// RNNoise model "somnolent-hogwash" (speech in recording noise) from
/// GregorR/rnnoise-models, pinned to a commit. The repo states the trained
/// models are not creative work and not subject to copyright; RNNoise itself
/// (in FFmpeg's arnndn) is BSD-3-Clause.
const RNNOISE: ModelSpec = ModelSpec {
    id: "voice_rnnoise",
    name: "Voice cleaner",
    purpose: "Removes background noise from speech",
    file: "sh.rnnn",
    url: "https://raw.githubusercontent.com/GregorR/rnnoise-models/3eee541a283fd3b8f81b85b1748e3b9ccbefa04d/somnolent-hogwash-2018-09-01/sh.rnnn",
    sha256: "70bb6685eb0c2a1d18e2918dca3fbfbd39317010b1802eb1b6ea73a92f3fdec0",
    size_bytes: 297_646,
    licence: "Public domain (not copyrightable), RNNoise BSD-3-Clause",
    required: true,
};

/// Bump when the chain changes so old cached files are not reused.
const CHAIN_VERSION: u32 = 1;

#[derive(Debug, Clone, Copy, Deserialize, Hash)]
pub enum Strength {
    Light,
    Normal,
    Strong,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnhanceOptions {
    pub strength: Strength,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EnhanceResult {
    output_path: String,
    /// False when the RNNoise model was unavailable and `afftdn` was used.
    used_voice_model: bool,
}

/// Filters before loudnorm. `model` is a file name relative to the working dir,
/// which keeps Windows drive colons out of the filter string.
fn chain(strength: Strength, model: Option<&str>) -> String {
    let (hp, mix, nr, ess, thr, ratio) = match strength {
        Strength::Light => (70, 0.5, 6, 0.2, -22, 2.0),
        Strength::Normal => (80, 0.8, 12, 0.4, -20, 3.0),
        Strength::Strong => (100, 1.0, 20, 0.6, -18, 4.0),
    };
    let denoise = match model {
        Some(m) => format!("arnndn=m={m}:mix={mix}"),
        None => format!("afftdn=nr={nr}:nf=-30"),
    };
    format!(
        "highpass=f={hp},{denoise},deesser=i={ess},acompressor=threshold={thr}dB:ratio={ratio}:attack=10:release=150:makeup=2"
    )
}

const LOUDNORM: &str = "loudnorm=I=-14:TP=-1.5:LRA=11";

/// `loudnorm` pass-1 JSON (last `{...}` block on stderr) to pass-2 options.
fn measured(stderr: &str) -> Option<String> {
    let start = stderr.rfind('{')?;
    let end = stderr[start..].find('}')? + start;
    let v: serde_json::Value = serde_json::from_str(&stderr[start..=end]).ok()?;
    let g = |k: &str| v.get(k)?.as_str().map(str::to_owned);
    Some(format!(
        "{LOUDNORM}:measured_I={}:measured_TP={}:measured_LRA={}:measured_thresh={}:offset={}:linear=true",
        g("input_i")?,
        g("input_tp")?,
        g("input_lra")?,
        g("input_thresh")?,
        g("target_offset")?
    ))
}

/// Runs ffmpeg with `-progress`; `progress` gets 0..1 of `duration`.
fn run_ffmpeg(
    args: &[String],
    cwd: &Path,
    duration: f64,
    mut progress: impl FnMut(f64),
) -> Result<String, String> {
    let mut child = tools::command(Tool::Ffmpeg)
        .current_dir(cwd)
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| match e.kind() {
            ErrorKind::NotFound => tools::missing_message(),
            _ => format!("We couldn't clean up the sound ({e})."),
        })?;
    let mut err = child.stderr.take().ok_or("No output from FFmpeg.")?;
    let err_thread = std::thread::spawn(move || {
        let mut s = String::new();
        let _ = err.read_to_string(&mut s);
        s
    });
    if let Some(out) = child.stdout.take() {
        for line in BufReader::new(out).lines().map_while(Result::ok) {
            if let Some(sec) = parse_progress_time(&line) {
                progress((sec / duration.max(0.1)).clamp(0.0, 1.0));
            }
        }
    }
    let status = child
        .wait()
        .map_err(|e| format!("We couldn't clean up the sound ({e})."))?;
    let stderr = err_thread.join().unwrap_or_default();
    if !status.success() {
        log::warn!("enhance_audio ffmpeg failed: {stderr}");
        return Err("We couldn't clean up this sound. The file may be damaged.".into());
    }
    Ok(stderr)
}

fn enhance(
    app: &AppHandle,
    src: &Path,
    in_point: f64,
    out_point: f64,
    strength: Strength,
    models: &Path,
    cache: &Path,
) -> Result<EnhanceResult, String> {
    let emit = |percent: f64, stage: &str| {
        let _ = app.emit(
            "enhance://progress",
            json!({ "percent": percent, "stage": stage }),
        );
    };

    // One-time model download; offline or blocked means we use afftdn instead.
    let model_ok = models.join(RNNOISE.file).is_file()
        || download_spec(models, &RNNOISE, |p| emit(p, "download")).is_ok();
    let model = model_ok.then_some(RNNOISE.file);

    let key =
        cache_key(src).ok_or("We couldn't find that file. It may have been moved or deleted.")?;
    let mut h = DefaultHasher::new();
    (key, CHAIN_VERSION, strength, model_ok).hash(&mut h);
    in_point.to_bits().hash(&mut h);
    out_point.to_bits().hash(&mut h);
    std::fs::create_dir_all(cache)
        .map_err(|e| format!("We couldn't create the cache folder ({e})."))?;
    let out: PathBuf = cache.join(format!("{:016x}.wav", h.finish()));
    let result = |p: &Path| EnhanceResult {
        output_path: p.to_string_lossy().into_owned(),
        used_voice_model: model_ok,
    };
    if out.is_file() {
        emit(100.0, "clean");
        return Ok(result(&out));
    }

    let mut input: Vec<String> = vec![
        "-hide_banner".into(),
        "-nostats".into(),
        "-progress".into(),
        "pipe:1".into(),
        "-ss".into(),
        format!("{:.3}", in_point.max(0.0)),
    ];
    let duration = out_point - in_point;
    if duration <= 0.0 {
        return Err("This clip is too short to clean up.".into());
    }
    input.extend(["-t".into(), format!("{duration:.3}")]);
    input.extend([
        "-i".into(),
        src.to_string_lossy().into_owned(),
        "-vn".into(),
    ]);
    let filters = chain(strength, model);

    // Pass 1: measure loudness after clean-up.
    let mut pass1 = input.clone();
    pass1.extend([
        "-af".into(),
        format!("{filters},{LOUDNORM}:print_format=json"),
        "-f".into(),
        "null".into(),
        "-".into(),
    ]);
    let stderr = run_ffmpeg(&pass1, models_cwd(models), duration, |f| {
        emit(f * 50.0, "measure")
    })?;
    let norm = measured(&stderr).unwrap_or_else(|| LOUDNORM.to_string());

    // Pass 2: render with the measured values (linear, no pumping).
    let part = out.with_extension("part.wav");
    let mut pass2 = input;
    pass2.extend([
        "-y".into(),
        "-af".into(),
        format!("{filters},{norm}"),
        "-ar".into(),
        "48000".into(),
        "-ac".into(),
        "2".into(),
        "-c:a".into(),
        "pcm_s16le".into(),
        part.to_string_lossy().into_owned(),
    ]);
    run_ffmpeg(&pass2, models_cwd(models), duration, |f| {
        emit(50.0 + f * 50.0, "clean")
    })?;
    std::fs::rename(&part, &out)
        .map_err(|e| format!("We couldn't save the cleaned sound ({e})."))?;
    emit(100.0, "clean");
    Ok(result(&out))
}

/// The models folder when it exists (arnndn reads the model by relative name).
fn models_cwd(models: &Path) -> &Path {
    if models.is_dir() {
        models
    } else {
        Path::new(".")
    }
}

/// `invoke("enhance_audio", { path, inPoint, outPoint, options: { strength } })`.
#[tauri::command]
pub async fn enhance_audio(
    app: AppHandle,
    path: String,
    in_point: f64,
    out_point: f64,
    options: EnhanceOptions,
) -> Result<EnhanceResult, String> {
    let models = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("We couldn't find the app data folder ({e})."))?
        .join("models")
        .join("audio");
    let cache = app
        .path()
        .app_cache_dir()
        .map_err(|e| format!("We couldn't find the app cache folder ({e})."))?
        .join("enhanced");
    tauri::async_runtime::spawn_blocking(move || {
        enhance(
            &app,
            Path::new(&path),
            in_point,
            out_point,
            options.strength,
            &models,
            &cache,
        )
    })
    .await
    .map_err(|e| format!("Something went wrong while cleaning up the sound ({e})."))?
}
