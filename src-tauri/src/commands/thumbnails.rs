//! Thumbnails and filmstrips for the media bin and timeline.
//!
//! Each frame is grabbed with a fast input seek (`-ss` before `-i`), so even a
//! 2-hour video only decodes a few frames. Results are cached in the app cache
//! dir, keyed by file path, size, modified time and the request, so reopening a
//! project is instant and a changed file gets fresh frames.

use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::io::ErrorKind;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

use tauri::Manager;

use crate::tools::{self, Tool};

/// Max ffmpeg processes at once while building a filmstrip.
const PARALLEL: usize = 4;
const MAX_FRAMES: u32 = 48;

/// Evenly spaced timestamps, centred in each slot so we avoid black first frames.
pub fn frame_times(duration_sec: f64, count: u32) -> Vec<f64> {
    let count = count.clamp(1, MAX_FRAMES);
    if duration_sec <= 0.0 {
        return vec![0.0];
    }
    let slot = duration_sec / count as f64;
    (0..count)
        .map(|i| ((i as f64 + 0.5) * slot).min((duration_sec - 0.05).max(0.0)))
        .collect()
}

fn cache_key(path: &Path, extra: &str) -> Result<String, String> {
    let meta = std::fs::metadata(path).map_err(|_| {
        "We couldn't find that file. It may have been moved or deleted.".to_string()
    })?;
    let mut h = DefaultHasher::new();
    path.hash(&mut h);
    meta.len().hash(&mut h);
    meta.modified()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis())
        .hash(&mut h);
    extra.hash(&mut h);
    Ok(format!("{:016x}", h.finish()))
}

fn grab_frame(src: &Path, at: f64, height: u32, out: &Path) -> Result<(), String> {
    if out.is_file() {
        return Ok(());
    }
    let tmp = out.with_extension("part.jpg");
    let status = tools::command(Tool::Ffmpeg)
        .args(["-hide_banner", "-loglevel", "error", "-y", "-ss"])
        .arg(format!("{at:.3}"))
        .arg("-i")
        .arg(src)
        .args(["-frames:v", "1", "-an", "-vf"])
        .arg(format!("scale=-2:{height}:flags=bicubic"))
        .args(["-q:v", "4"])
        .arg(&tmp)
        .status()
        .map_err(|e| match e.kind() {
            ErrorKind::NotFound => tools::missing_message(),
            _ => format!("We couldn't start the frame grabber ({e})."),
        })?;
    if !status.success() || !tmp.is_file() {
        let _ = std::fs::remove_file(&tmp);
        return Err("We couldn't make a preview picture for this clip.".into());
    }
    std::fs::rename(&tmp, out).map_err(|e| format!("We couldn't save the preview picture ({e})."))
}

/// Build (or reuse) `count` frames across the clip. Returns JPEG paths in order.
pub fn filmstrip(
    cache_root: &Path,
    src: &Path,
    duration_sec: f64,
    count: u32,
    height: u32,
) -> Result<Vec<PathBuf>, String> {
    let height = height.clamp(32, 720);
    let times = frame_times(duration_sec, count);
    let key = cache_key(
        src,
        &format!("strip:{}:{height}:{duration_sec:.3}", times.len()),
    )?;
    let dir = cache_root.join("filmstrips").join(key);
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("We couldn't create the preview cache ({e})."))?;

    let outputs: Vec<PathBuf> = (0..times.len())
        .map(|i| dir.join(format!("{i:02}.jpg")))
        .collect();

    // Grab frames a few at a time.
    let jobs: Vec<(f64, &PathBuf)> = times.iter().copied().zip(outputs.iter()).collect();
    let mut first_error = None;
    for chunk in jobs.chunks(PARALLEL) {
        let results: Vec<Result<(), String>> = std::thread::scope(|s| {
            let handles: Vec<_> = chunk
                .iter()
                .map(|(at, out)| s.spawn(move || grab_frame(src, *at, height, out)))
                .collect();
            handles
                .into_iter()
                .map(|h| {
                    h.join()
                        .unwrap_or_else(|_| Err("Frame grabber crashed.".into()))
                })
                .collect()
        });
        for r in results {
            if let Err(e) = r {
                first_error.get_or_insert(e);
            }
        }
    }

    // A filmstrip with a few missing frames is still useful; only fail if all failed.
    let made: Vec<PathBuf> = outputs.into_iter().filter(|p| p.is_file()).collect();
    if made.is_empty() {
        return Err(first_error.unwrap_or_else(|| "We couldn't make preview pictures.".into()));
    }
    Ok(made)
}

/// `invoke("media_filmstrip", { path, durationSec, count, height })`.
/// Returns file paths; the frontend turns them into URLs with `convertFileSrc()`.
#[tauri::command]
pub async fn media_filmstrip(
    app: tauri::AppHandle,
    path: String,
    duration_sec: f64,
    count: u32,
    height: u32,
) -> Result<Vec<String>, String> {
    let cache_root = app
        .path()
        .app_cache_dir()
        .map_err(|e| format!("We couldn't find the app cache folder ({e})."))?;
    tauri::async_runtime::spawn_blocking(move || {
        filmstrip(&cache_root, Path::new(&path), duration_sec, count, height)
    })
    .await
    .map_err(|e| format!("Something went wrong while making previews ({e})."))?
    .map(|paths| {
        paths
            .into_iter()
            .map(|p| p.to_string_lossy().into_owned())
            .collect()
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn frame_times_are_spread_and_in_range() {
        let t = frame_times(10.0, 5);
        assert_eq!(t, vec![1.0, 3.0, 5.0, 7.0, 9.0]);
        assert_eq!(frame_times(0.0, 8), vec![0.0]);
        assert_eq!(frame_times(100.0, 500).len(), MAX_FRAMES as usize);
        assert!(frame_times(0.04, 3).iter().all(|&x| x >= 0.0));
    }

    /// Real ffmpeg run when VERSO_SAMPLE_MEDIA points at a video.
    #[test]
    fn builds_real_filmstrip_when_available() {
        let Ok(sample) = std::env::var("VERSO_SAMPLE_MEDIA") else {
            return;
        };
        let cache = std::env::temp_dir().join("verso-test-cache");
        let frames = filmstrip(&cache, Path::new(&sample), 4.0, 6, 90).expect("filmstrip");
        assert_eq!(frames.len(), 6);
        assert!(frames.iter().all(|p| p.is_file()));
        // Second call hits the cache.
        let again = filmstrip(&cache, Path::new(&sample), 4.0, 6, 90).unwrap();
        assert_eq!(frames, again);
        let _ = std::fs::remove_dir_all(&cache);
    }
}
