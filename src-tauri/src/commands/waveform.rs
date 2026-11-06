//! Audio peaks for timeline waveforms.
//!
//! ffmpeg decodes the audio to 8 kHz mono 16-bit PCM on a pipe; we keep the
//! peak of each slot (up to 50 per second, capped for very long files) as a
//! byte 0..255. Cached in the app cache dir next to the filmstrips.

use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::io::{ErrorKind, Read};
use std::path::Path;
use std::process::Stdio;
use std::time::UNIX_EPOCH;

use serde::Serialize;
use tauri::Manager;

use crate::tools::{self, Tool};

const SAMPLE_RATE: u32 = 8000;
const MAX_PEAKS: f64 = 200_000.0;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Waveform {
    peaks_per_sec: f64,
    peaks: Vec<u8>,
}

pub(crate) fn cache_key(path: &Path) -> Option<String> {
    let meta = std::fs::metadata(path).ok()?;
    let mut h = DefaultHasher::new();
    path.hash(&mut h);
    meta.len().hash(&mut h);
    meta.modified()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis())
        .hash(&mut h);
    Some(format!("{:016x}", h.finish()))
}

fn compute(src: &Path, duration_sec: f64) -> Result<Waveform, String> {
    let per_sec = (MAX_PEAKS / duration_sec.max(1.0)).clamp(4.0, 50.0);
    let slot = ((SAMPLE_RATE as f64) / per_sec).round().max(1.0) as usize;

    let mut child = tools::command(Tool::Ffmpeg)
        .args(["-hide_banner", "-loglevel", "error", "-i"])
        .arg(src)
        .args([
            "-vn",
            "-ac",
            "1",
            "-ar",
            &SAMPLE_RATE.to_string(),
            "-f",
            "s16le",
            "pipe:1",
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| match e.kind() {
            ErrorKind::NotFound => tools::missing_message(),
            _ => format!("We couldn't read the sound ({e})."),
        })?;

    let mut out = child.stdout.take().ok_or("No audio output.")?;
    let mut peaks = Vec::with_capacity((duration_sec * per_sec) as usize + 16);
    let mut buf = vec![0u8; 64 * 1024];
    let mut carry: Option<u8> = None;
    let mut count = 0usize;
    let mut peak = 0i32;
    loop {
        let n = out
            .read(&mut buf)
            .map_err(|e| format!("We couldn't read the sound ({e})."))?;
        if n == 0 {
            break;
        }
        let mut i = 0;
        if let Some(lo) = carry.take() {
            let s = i16::from_le_bytes([lo, buf[0]]) as i32;
            peak = peak.max(s.abs());
            count += 1;
            i = 1;
        }
        while i + 1 < n {
            let s = i16::from_le_bytes([buf[i], buf[i + 1]]) as i32;
            peak = peak.max(s.abs());
            count += 1;
            if count == slot {
                peaks.push(((peak as f64 / 32768.0).sqrt() * 255.0).min(255.0) as u8);
                peak = 0;
                count = 0;
            }
            i += 2;
        }
        if i < n {
            carry = Some(buf[i]);
        }
    }
    let _ = child.wait();
    if count > 0 {
        peaks.push(((peak as f64 / 32768.0).sqrt() * 255.0).min(255.0) as u8);
    }
    if peaks.is_empty() {
        return Err("This file has no sound we can draw.".into());
    }
    Ok(Waveform {
        peaks_per_sec: SAMPLE_RATE as f64 / slot as f64,
        peaks,
    })
}

#[tauri::command]
pub async fn media_waveform(
    app: tauri::AppHandle,
    path: String,
    duration_sec: f64,
) -> Result<Waveform, String> {
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|e| format!("We couldn't find the app cache folder ({e})."))?
        .join("waveforms");
    tauri::async_runtime::spawn_blocking(move || {
        let src = Path::new(&path);
        let key = cache_key(src)
            .ok_or("We couldn't find that file. It may have been moved or deleted.")?;
        let file = cache_dir.join(format!("{key}.bin"));
        if let Ok(bytes) = std::fs::read(&file) {
            if bytes.len() > 8 {
                let pps = f64::from_le_bytes(bytes[..8].try_into().unwrap_or([0; 8]));
                return Ok(Waveform {
                    peaks_per_sec: pps,
                    peaks: bytes[8..].to_vec(),
                });
            }
        }
        let wf = compute(src, duration_sec)?;
        let _ = std::fs::create_dir_all(&cache_dir);
        let mut bytes = wf.peaks_per_sec.to_le_bytes().to_vec();
        bytes.extend_from_slice(&wf.peaks);
        let _ = std::fs::write(&file, bytes);
        Ok(wf)
    })
    .await
    .map_err(|e| format!("Something went wrong while reading the sound ({e})."))?
}
