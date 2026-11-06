//! Media commands: inspect files with ffprobe.
//!
//! Phase 1 expects `ffprobe` on PATH. A later phase will bundle FFmpeg as a
//! Tauri sidecar so end users never have to install it.

use serde::{Deserialize, Serialize};
use std::io::ErrorKind;
use std::path::Path;
use std::process::Command;

/// What the UI needs to show a file in the media bin.
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MediaInfo {
    pub path: String,
    pub file_name: String,
    pub size_bytes: u64,
    pub duration_sec: f64,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub fps: Option<f64>,
    pub video_codec: Option<String>,
    pub audio_codec: Option<String>,
    pub has_video: bool,
    pub has_audio: bool,
}

#[derive(Debug, Deserialize)]
struct ProbeOutput {
    #[serde(default)]
    streams: Vec<ProbeStream>,
    format: Option<ProbeFormat>,
}

#[derive(Debug, Deserialize)]
struct ProbeStream {
    codec_type: Option<String>,
    codec_name: Option<String>,
    width: Option<u32>,
    height: Option<u32>,
    avg_frame_rate: Option<String>,
    r_frame_rate: Option<String>,
    duration: Option<String>,
    disposition: Option<ProbeDisposition>,
}

#[derive(Debug, Deserialize)]
struct ProbeDisposition {
    #[serde(default)]
    attached_pic: u8,
}

#[derive(Debug, Deserialize)]
struct ProbeFormat {
    duration: Option<String>,
    size: Option<String>,
}

/// Parse an ffprobe rate such as `30000/1001` or `25/1`. `0/0` means unknown.
fn parse_rate(rate: &str) -> Option<f64> {
    let (num, den) = rate.split_once('/')?;
    let num: f64 = num.trim().parse().ok()?;
    let den: f64 = den.trim().parse().ok()?;
    if num <= 0.0 || den <= 0.0 {
        return None;
    }
    Some((num / den * 1000.0).round() / 1000.0)
}

fn ffprobe() -> Command {
    #[allow(unused_mut)]
    let mut cmd = Command::new("ffprobe");
    #[cfg(windows)]
    {
        // CREATE_NO_WINDOW: don't flash a console window on every probe.
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000);
    }
    cmd
}

/// Turn raw ffprobe JSON into [`MediaInfo`]. Split out so it can be unit tested
/// without ffprobe installed.
fn media_info_from_probe(path: &Path, json: &[u8]) -> Result<MediaInfo, String> {
    let probe: ProbeOutput = serde_json::from_slice(json)
        .map_err(|e| format!("We couldn't read the file details ({e})."))?;

    // Cover art inside audio files shows up as a video stream; skip it.
    let video = probe.streams.iter().find(|s| {
        s.codec_type.as_deref() == Some("video")
            && s.disposition.as_ref().is_none_or(|d| d.attached_pic == 0)
    });
    let audio = probe
        .streams
        .iter()
        .find(|s| s.codec_type.as_deref() == Some("audio"));

    let duration_sec = probe
        .format
        .as_ref()
        .and_then(|f| f.duration.as_deref())
        .or_else(|| video.and_then(|v| v.duration.as_deref()))
        .or_else(|| audio.and_then(|a| a.duration.as_deref()))
        .and_then(|d| d.parse::<f64>().ok())
        .unwrap_or(0.0);

    let size_bytes = probe
        .format
        .as_ref()
        .and_then(|f| f.size.as_deref())
        .and_then(|s| s.parse::<u64>().ok())
        .or_else(|| std::fs::metadata(path).ok().map(|m| m.len()))
        .unwrap_or(0);

    let fps = video.and_then(|v| {
        v.avg_frame_rate
            .as_deref()
            .and_then(parse_rate)
            .or_else(|| v.r_frame_rate.as_deref().and_then(parse_rate))
    });

    Ok(MediaInfo {
        path: path.to_string_lossy().into_owned(),
        file_name: path
            .file_name()
            .map(|n| n.to_string_lossy().into_owned())
            .unwrap_or_default(),
        size_bytes,
        duration_sec,
        width: video.and_then(|v| v.width),
        height: video.and_then(|v| v.height),
        fps,
        video_codec: video.and_then(|v| v.codec_name.clone()),
        audio_codec: audio.and_then(|a| a.codec_name.clone()),
        has_video: video.is_some(),
        has_audio: audio.is_some(),
    })
}

/// Run ffprobe on `path`. Error messages are plain language: they go straight
/// to the UI.
pub fn probe(path: &str) -> Result<MediaInfo, String> {
    let p = Path::new(path);
    if !p.is_file() {
        return Err("We couldn't find that file. It may have been moved or deleted.".into());
    }

    let output = ffprobe()
        .args([
            "-v",
            "error",
            "-print_format",
            "json",
            "-show_format",
            "-show_streams",
        ])
        .arg(p)
        .output()
        .map_err(|e| match e.kind() {
            ErrorKind::NotFound => {
                "Verso needs FFmpeg to read videos, and we couldn't find it on this computer."
                    .to_string()
            }
            _ => format!("We couldn't open the file reader ({e})."),
        })?;

    if !output.status.success() {
        let detail = String::from_utf8_lossy(&output.stderr);
        return Err(format!(
            "That file doesn't look like a video or audio file we can open. ({})",
            detail.trim()
        ));
    }

    let info = media_info_from_probe(p, &output.stdout)?;
    if !info.has_video && !info.has_audio {
        return Err("That file has no video or sound we can use.".into());
    }
    Ok(info)
}

/// `invoke("probe_media", { path })` from the frontend.
#[tauri::command]
pub async fn probe_media(path: String) -> Result<MediaInfo, String> {
    tauri::async_runtime::spawn_blocking(move || probe(&path))
        .await
        .map_err(|e| format!("Something went wrong while reading the file ({e})."))?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_frame_rates() {
        assert_eq!(parse_rate("30/1"), Some(30.0));
        assert_eq!(parse_rate("30000/1001"), Some(29.97));
        assert_eq!(parse_rate("0/0"), None);
        assert_eq!(parse_rate("junk"), None);
    }

    #[test]
    fn builds_media_info_and_skips_cover_art() {
        let json = br#"{
          "streams": [
            {"codec_type":"video","codec_name":"mjpeg","width":600,"height":600,
             "avg_frame_rate":"0/0","disposition":{"attached_pic":1}},
            {"codec_type":"video","codec_name":"h264","width":1920,"height":1080,
             "avg_frame_rate":"30000/1001","disposition":{"attached_pic":0}},
            {"codec_type":"audio","codec_name":"aac"}
          ],
          "format": {"duration":"2520.5","size":"123456"}
        }"#;
        let info = media_info_from_probe(Path::new("C:/videos/ep42.mp4"), json).unwrap();
        assert_eq!(info.file_name, "ep42.mp4");
        assert_eq!(info.width, Some(1920));
        assert_eq!(info.height, Some(1080));
        assert_eq!(info.fps, Some(29.97));
        assert_eq!(info.video_codec.as_deref(), Some("h264"));
        assert_eq!(info.audio_codec.as_deref(), Some("aac"));
        assert_eq!(info.duration_sec, 2520.5);
        assert_eq!(info.size_bytes, 123456);
    }

    /// Runs real ffprobe on a real file when VERSO_SAMPLE_MEDIA points at one.
    #[test]
    fn probes_real_file_when_available() {
        let Ok(path) = std::env::var("VERSO_SAMPLE_MEDIA") else {
            return;
        };
        let info = probe(&path).expect("probe should succeed");
        assert!(info.has_video);
        assert!(info.duration_sec > 0.0);
        println!("{}", serde_json::to_string_pretty(&info).unwrap());
    }

    #[test]
    fn missing_file_is_a_friendly_error() {
        let err = probe("Z:/definitely/not/here.mp4").unwrap_err();
        assert!(err.contains("couldn't find"));
    }
}
