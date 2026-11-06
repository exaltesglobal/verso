//! H.264 encoder choice. The shipped FFmpeg is LGPL (no libx264), so we use
//! the GPU encoders when they work, then Windows MediaFoundation, then
//! OpenH264, and MPEG-4 part 2 only as a last resort.

use std::io::ErrorKind;
use std::process::Stdio;
use std::sync::OnceLock;

use super::Quality;
use crate::tools::{self, Tool};

pub const PREFERENCE: [&str; 6] = [
    "h264_nvenc",
    "h264_qsv",
    "h264_amf",
    "h264_mf",
    "libopenh264",
    "mpeg4",
];

static WORKING: OnceLock<Vec<String>> = OnceLock::new();

/// QSV only takes NV12; everything else gets plain 4:2:0.
fn pix_fmt(encoder: &str) -> &'static str {
    if encoder == "h264_qsv" {
        "nv12"
    } else {
        "yuv420p"
    }
}

fn listed() -> Result<String, String> {
    let out = tools::command(Tool::Ffmpeg)
        .args(["-hide_banner", "-encoders"])
        .output()
        .map_err(|e| match e.kind() {
            ErrorKind::NotFound => tools::missing_message(),
            _ => format!("We couldn't start FFmpeg ({e})."),
        })?;
    Ok(String::from_utf8_lossy(&out.stdout).into_owned())
}

/// A listed encoder can still fail (no GPU, old driver), so encode one frame.
fn works(encoder: &str) -> bool {
    tools::command(Tool::Ffmpeg)
        .args([
            "-hide_banner",
            "-loglevel",
            "error",
            "-f",
            "lavfi",
            "-i",
            "color=c=black:s=256x256:r=30:d=0.1",
            "-frames:v",
            "1",
            "-pix_fmt",
            pix_fmt(encoder),
            "-c:v",
            encoder,
            "-f",
            "null",
            "-",
        ])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .map(|s| s.success())
        .unwrap_or(false)
}

/// Working encoders, best first. Probed once per app run.
pub fn detect() -> Result<Vec<String>, String> {
    if let Some(found) = WORKING.get() {
        return Ok(found.clone());
    }
    let list = listed()?;
    // VERSO_DISABLE_NVENC=1 skips NVENC, to test the fallback encoders on an NVIDIA machine.
    let skip_nvenc = std::env::var("VERSO_DISABLE_NVENC").is_ok_and(|v| v == "1");
    let found: Vec<String> = PREFERENCE
        .iter()
        .filter(|e| !(skip_nvenc && **e == "h264_nvenc"))
        .filter(|e| list.split_whitespace().any(|w| w == **e))
        .filter(|e| works(e))
        .map(|e| e.to_string())
        .collect();
    if found.is_empty() {
        return Err("We couldn't find a way to make video files on this computer. Updating your graphics driver may help.".into());
    }
    Ok(WORKING.get_or_init(|| found).clone())
}

/// Encoder settings for a quality preset.
pub fn video_args(encoder: &str, quality: Quality, fps: u32) -> Vec<String> {
    let (mbps, cq) = match quality {
        Quality::Draft => (4, 28),
        Quality::Standard => (10, 23),
        Quality::High => (16, 19),
        Quality::Ultra => (40, 19),
    };
    let b = format!("{mbps}M");
    let max = format!("{}M", mbps * 3 / 2);
    let buf = format!("{}M", mbps * 2);
    let mut a: Vec<String> = vec!["-c:v".into(), encoder.into()];
    let extra: Vec<String> = match encoder {
        "h264_nvenc" => vec![
            "-preset",
            "p5",
            "-rc",
            "vbr",
            "-cq",
            &cq.to_string(),
            "-b:v",
            &b,
            "-maxrate",
            &max,
            "-bufsize",
            &buf,
            "-profile:v",
            "high",
        ]
        .into_iter()
        .map(String::from)
        .collect(),
        "h264_qsv" => vec![
            "-preset",
            "medium",
            "-b:v",
            &b,
            "-maxrate",
            &max,
            "-bufsize",
            &buf,
            "-profile:v",
            "high",
        ]
        .into_iter()
        .map(String::from)
        .collect(),
        "h264_amf" => vec![
            "-quality", "balanced", "-rc", "vbr_peak", "-b:v", &b, "-maxrate", &max, "-bufsize",
            &buf,
        ]
        .into_iter()
        .map(String::from)
        .collect(),
        "mpeg4" => {
            let q = match quality {
                Quality::Draft => "6",
                Quality::Standard => "3",
                Quality::High | Quality::Ultra => "2",
            };
            vec!["-q:v".into(), q.into()]
        }
        // h264_mf, libopenh264
        _ => vec!["-b:v".into(), b.clone(), "-maxrate".into(), max.clone()],
    };
    a.extend(extra);
    a.extend([
        "-pix_fmt".into(),
        pix_fmt(encoder).into(),
        "-g".into(),
        (fps * 2).to_string(),
        "-r".into(),
        fps.to_string(),
    ]);
    a
}
