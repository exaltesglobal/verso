//! Colour helpers: auto colour-correct (frame statistics), custom `.cube` LUT
//! import, and still frames for freeze frames.
//!
//! Colour values use the same units as `Clip.color` in src/lib/project.ts:
//! -1..1 with 0 = unchanged. See src-tauri/src/export/color.rs for the maths.

use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::io::ErrorKind;
use std::path::{Path, PathBuf};
use std::process::Stdio;

use serde::Serialize;
use tauri::{AppHandle, Manager};

use super::waveform::cache_key;
use crate::tools::{self, Tool};

#[derive(Debug, Default, Clone, Copy, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ColorFix {
    pub brightness: f64,
    pub contrast: f64,
    pub saturation: f64,
    pub temperature: f64,
}

fn cache_dir(app: &AppHandle, sub: &str) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_cache_dir()
        .map_err(|e| format!("We couldn't find the app cache folder ({e})."))?
        .join(sub))
}

fn spawn_err(e: std::io::Error) -> String {
    match e.kind() {
        ErrorKind::NotFound => tools::missing_message(),
        _ => format!("We couldn't read the video ({e})."),
    }
}

/// Averages `lavfi.signalstats.*` values printed by the metadata filter.
fn average_stats(log: &str) -> Option<[f64; 6]> {
    const KEYS: [&str; 6] = ["YAVG", "YLOW", "YHIGH", "SATAVG", "UAVG", "VAVG"];
    let mut sum = [0.0; 6];
    let mut n = [0u32; 6];
    for line in log.lines() {
        let Some(rest) = line.split("lavfi.signalstats.").nth(1) else { continue };
        let Some((k, v)) = rest.split_once('=') else { continue };
        if let (Some(i), Ok(v)) = (KEYS.iter().position(|x| *x == k), v.trim().parse::<f64>()) {
            sum[i] += v;
            n[i] += 1;
        }
    }
    if n.contains(&0) {
        return None;
    }
    Some(std::array::from_fn(|i| sum[i] / n[i] as f64))
}

/// Gentle proposal from 8-bit stats: aim for mid-grey exposure, a healthy
/// spread, moderate saturation and neutral white balance.
pub fn propose([yavg, ylow, yhigh, sat, u, v]: [f64; 6]) -> ColorFix {
    let r = |x: f64| (x * 100.0).round() / 100.0;
    let brightness = ((120.0 / yavg.max(1.0) - 1.0) * 2.0 * 0.7).clamp(-0.4, 0.4);
    let contrast = ((150.0 / (yhigh - ylow).max(1.0) - 1.0) * 2.0 * 0.6).clamp(-0.3, 0.5);
    let saturation = ((35.0 / sat.max(1.0) - 1.0) * 0.6).clamp(-0.3, 0.4);
    // Warm cast: V (red) above 128 and U (blue) below. Correct the opposite way.
    let warmth = ((v - 128.0) - (u - 128.0)) / 20.0;
    let temperature = (-warmth * 0.6).clamp(-0.5, 0.5);
    ColorFix {
        brightness: r(brightness),
        contrast: r(contrast),
        saturation: r(saturation),
        temperature: r(temperature),
    }
}

/// `invoke("auto_color", { path, inPoint, outPoint })`: samples up to ~30 frames.
#[tauri::command]
pub async fn auto_color(path: String, in_point: f64, out_point: f64) -> Result<ColorFix, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let dur = (out_point - in_point).max(0.1);
        let fps = (30.0 / dur).clamp(0.05, 2.0);
        let out = tools::command(Tool::Ffmpeg)
            .args(["-hide_banner", "-nostats", "-ss", &format!("{:.3}", in_point.max(0.0))])
            .args(["-t", &format!("{dur:.3}"), "-i"])
            .arg(&path)
            .args([
                "-an",
                "-vf",
                &format!("fps={fps:.3},scale=256:-2,signalstats,metadata=print"),
                "-f",
                "null",
                "-",
            ])
            .stdout(Stdio::null())
            .output()
            .map_err(spawn_err)?;
        let log = String::from_utf8_lossy(&out.stderr);
        average_stats(&log)
            .map(propose)
            .ok_or_else(|| "We couldn't look at the colours in this clip.".to_string())
    })
    .await
    .map_err(|e| format!("Something went wrong while checking the colours ({e})."))?
}

/// `invoke("render_still", { path, time })`: PNG of the frame at `time` (source
/// seconds), cached. Returns the PNG path.
#[tauri::command]
pub async fn render_still(app: AppHandle, path: String, time: f64) -> Result<String, String> {
    let dir = cache_dir(&app, "stills")?;
    tauri::async_runtime::spawn_blocking(move || {
        let src = Path::new(&path);
        let key = cache_key(src).ok_or("We couldn't find that file. It may have been moved or deleted.")?;
        let out = dir.join(format!("{key}-{}.png", (time.max(0.0) * 1000.0).round() as u64));
        if out.is_file() {
            return Ok(out.to_string_lossy().into_owned());
        }
        std::fs::create_dir_all(&dir)
            .map_err(|e| format!("We couldn't create the cache folder ({e})."))?;
        let status = tools::command(Tool::Ffmpeg)
            .args(["-hide_banner", "-loglevel", "error", "-y", "-ss", &format!("{:.3}", time.max(0.0)), "-i"])
            .arg(src)
            .args(["-frames:v", "1", "-update", "1"])
            .arg(&out)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .map_err(spawn_err)?;
        if !status.success() || !out.is_file() {
            return Err("We couldn't grab that frame. Try a slightly different spot.".into());
        }
        Ok(out.to_string_lossy().into_owned())
    })
    .await
    .map_err(|e| format!("Something went wrong while grabbing the frame ({e})."))?
}

/// A parsed 3D `.cube` LUT, values 0..1, red changing fastest.
pub struct Cube {
    pub size: usize,
    pub title: Option<String>,
    pub data: Vec<[f64; 3]>,
}

pub const MAX_LUT_SIZE: usize = 65;

pub fn parse_cube(text: &str) -> Result<Cube, String> {
    let bad = |m: &str| format!("This LUT file can't be used: {m}.");
    let (mut size, mut title, mut data) = (0usize, None, Vec::new());
    let (mut lo, mut hi) = ([0.0; 3], [1.0; 3]);
    for line in text.lines().map(str::trim) {
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        let mut parts = line.split_whitespace();
        let first = parts.next().unwrap_or_default();
        let nums = |p: std::str::SplitWhitespace| -> Option<[f64; 3]> {
            let v: Vec<f64> = p.filter_map(|x| x.parse().ok()).collect();
            (v.len() == 3).then(|| [v[0], v[1], v[2]])
        };
        match first {
            "TITLE" => title = Some(line[5..].trim().trim_matches('"').to_string()),
            "LUT_3D_SIZE" => {
                size = parts.next().and_then(|s| s.parse().ok()).ok_or_else(|| bad("the size is missing"))?
            }
            "LUT_1D_SIZE" => return Err(bad("it is a 1D LUT, and Verso needs a 3D one")),
            "DOMAIN_MIN" => lo = nums(parts).ok_or_else(|| bad("DOMAIN_MIN is broken"))?,
            "DOMAIN_MAX" => hi = nums(parts).ok_or_else(|| bad("DOMAIN_MAX is broken"))?,
            _ if first.parse::<f64>().is_ok() => {
                let v = nums(line.split_whitespace()).ok_or_else(|| bad("a colour row is broken"))?;
                data.push(std::array::from_fn(|i| (v[i] - lo[i]) / (hi[i] - lo[i]).max(1e-6)));
            }
            _ => {} // Unknown keywords (e.g. LUT_IN_VIDEO_RANGE) are ignored.
        }
    }
    if !(2..=MAX_LUT_SIZE).contains(&size) {
        return Err(bad(&format!("its size must be between 2 and {MAX_LUT_SIZE}")));
    }
    if data.len() != size * size * size {
        return Err(bad("it has the wrong number of colours"));
    }
    Ok(Cube { size, title, data })
}

impl Cube {
    /// Nearest-entry lookup (good enough for estimating the look).
    fn at(&self, r: f64, g: f64, b: f64) -> [f64; 3] {
        let n = self.size;
        let i = |x: f64| ((x.clamp(0.0, 1.0) * (n - 1) as f64).round() as usize).min(n - 1);
        self.data[i(r) + i(g) * n + i(b) * n * n]
    }

    /// Rough look of the LUT in Clip.color units, for the CSS preview.
    pub fn approx(&self) -> ColorFix {
        let avg = |c: [f64; 3]| (c[0] + c[1] + c[2]) / 3.0;
        let mid = self.at(0.5, 0.5, 0.5);
        let m = (avg(mid) / 0.5).max(0.05);
        let slope = (avg(self.at(0.75, 0.75, 0.75)) - avg(self.at(0.25, 0.25, 0.25))) / 0.5 / m;
        let c = self.at(0.7, 0.4, 0.3);
        let chroma = c.iter().cloned().fold(f64::MIN, f64::max) - c.iter().cloned().fold(f64::MAX, f64::min);
        let r = |x: f64| (x.clamp(-1.0, 1.0) * 100.0).round() / 100.0;
        ColorFix {
            brightness: r((m - 1.0) * 2.0),
            contrast: r((slope - 1.0) * 2.0),
            saturation: r(chroma / 0.4 - 1.0),
            temperature: r((mid[0] - mid[2]) * 4.0),
        }
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportedLut {
    /// Copy inside the app data folder, so moving the original doesn't break projects.
    path: String,
    title: String,
    size: usize,
    approx: ColorFix,
}

/// `invoke("import_lut", { path })`: validates a `.cube` (3D, size <= 65) and copies it in.
#[tauri::command]
pub async fn import_lut(app: AppHandle, path: String) -> Result<ImportedLut, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("We couldn't find the app data folder ({e})."))?
        .join("luts");
    tauri::async_runtime::spawn_blocking(move || {
        let src = Path::new(&path);
        let meta = std::fs::metadata(src).map_err(|_| "We couldn't find that LUT file.".to_string())?;
        if meta.len() > 64 * 1024 * 1024 {
            return Err("This LUT file is too big to be a .cube LUT.".into());
        }
        let text = std::fs::read_to_string(src).map_err(|_| "We couldn't read that LUT file.".to_string())?;
        let cube = parse_cube(&text)?;
        let mut h = DefaultHasher::new();
        text.hash(&mut h);
        std::fs::create_dir_all(&dir).map_err(|e| format!("We couldn't save the LUT ({e})."))?;
        let dest = dir.join(format!("{:016x}.cube", h.finish()));
        std::fs::write(&dest, &text).map_err(|e| format!("We couldn't save the LUT ({e})."))?;
        let name = src.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default();
        Ok(ImportedLut {
            path: dest.to_string_lossy().into_owned(),
            title: cube.title.clone().filter(|t| !t.is_empty()).unwrap_or(name),
            size: cube.size,
            approx: cube.approx(),
        })
    })
    .await
    .map_err(|e| format!("Something went wrong while importing the LUT ({e})."))?
}
