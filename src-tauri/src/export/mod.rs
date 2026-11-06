//! Export: turns the timeline into one FFmpeg command.
//!
//! `build_args` is pure (no FFmpeg needed): every clip becomes its own input,
//! is trimmed, moved to its timeline position with `setpts`, cropped and scaled
//! to the canvas, then laid over a black base so gaps stay black. Audio clips
//! are delayed to their position and mixed. Text, captions and the watermark
//! are drawn last with `drawtext`.

pub mod encoders;

use serde::Deserialize;

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq)]
pub enum Aspect {
    #[serde(rename = "9:16")]
    Vertical,
    #[serde(rename = "1:1")]
    Square,
    #[serde(rename = "16:9")]
    Wide,
}

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum Quality {
    /// 720p, small file, quick to make.
    Draft,
    /// 1080p, best for posting.
    Standard,
    /// 1080p at a higher bitrate.
    High,
}

/// Part of the source frame to keep, normalized 0..1.
#[derive(Debug, Clone, Copy, Deserialize, PartialEq)]
pub struct CropRect {
    pub x: f64,
    pub y: f64,
    pub w: f64,
    pub h: f64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoClip {
    pub path: String,
    #[serde(default)]
    pub in_point: f64,
    pub start: f64,
    pub end: f64,
    /// None = centre crop to the canvas shape.
    #[serde(default)]
    pub crop: Option<CropRect>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioClip {
    pub path: String,
    #[serde(default)]
    pub in_point: f64,
    pub start: f64,
    pub end: f64,
    #[serde(default = "one")]
    pub volume: f64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextOverlay {
    pub text: String,
    pub start: f64,
    pub end: f64,
    /// Centre of the text, normalized 0..1 across the canvas.
    #[serde(default = "half")]
    pub x: f64,
    #[serde(default = "half")]
    pub y: f64,
    /// Pixels on a 1080-wide canvas; scaled for other sizes.
    #[serde(default = "default_font_size")]
    pub font_size: f64,
    /// `#RRGGBB` or `#RRGGBBAA`.
    #[serde(default = "white")]
    pub color: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportRequest {
    pub aspect: Aspect,
    pub quality: Quality,
    #[serde(default = "default_fps")]
    pub fps: u32,
    #[serde(default)]
    pub video_clips: Vec<VideoClip>,
    #[serde(default)]
    pub audio_clips: Vec<AudioClip>,
    #[serde(default)]
    pub text_overlays: Vec<TextOverlay>,
    #[serde(default)]
    pub captions: Vec<TextOverlay>,
    /// Small "Made with Verso" mark, bottom right (Free plan).
    #[serde(default)]
    pub watermark: bool,
    pub output_path: String,
    /// TTF/OTF used by drawtext. None = a system font.
    #[serde(default)]
    pub font_path: Option<String>,
}

fn one() -> f64 {
    1.0
}
fn half() -> f64 {
    0.5
}
fn default_font_size() -> f64 {
    64.0
}
fn white() -> String {
    "#FFFFFF".into()
}
fn default_fps() -> u32 {
    30
}

/// Output frame size for the aspect and quality.
pub fn canvas(aspect: Aspect, quality: Quality) -> (u32, u32) {
    let (w, h) = match aspect {
        Aspect::Vertical => (1080, 1920),
        Aspect::Square => (1080, 1080),
        Aspect::Wide => (1920, 1080),
    };
    match quality {
        Quality::Draft => (w * 2 / 3, h * 2 / 3),
        _ => (w, h),
    }
}

/// End of the last thing on the timeline, in seconds.
pub fn total_duration(req: &ExportRequest) -> f64 {
    let ends = req
        .video_clips
        .iter()
        .map(|c| c.end)
        .chain(req.audio_clips.iter().map(|c| c.end))
        .chain(req.text_overlays.iter().map(|c| c.end))
        .chain(req.captions.iter().map(|c| c.end));
    ends.fold(0.0, f64::max)
}

/// Escape a value for a filter option inside `-filter_complex`: once for the
/// option parser, once for the graph parser (see ffmpeg-filters "Notes on
/// filtergraph escaping").
fn esc(s: &str) -> String {
    let mut lvl1 = String::with_capacity(s.len());
    for ch in s.chars() {
        if matches!(ch, '\\' | '\'' | ':') {
            lvl1.push('\\');
        }
        lvl1.push(ch);
    }
    let mut out = String::with_capacity(lvl1.len());
    for ch in lvl1.chars() {
        if matches!(ch, '\\' | '\'' | '[' | ']' | ',' | ';') {
            out.push('\\');
        }
        out.push(ch);
    }
    out
}

/// `#RRGGBB[AA]` to FFmpeg's `0xRRGGBB[AA]`; anything else is white.
fn ffmpeg_color(c: &str) -> String {
    let hex = c.trim().trim_start_matches('#');
    if (hex.len() == 6 || hex.len() == 8) && hex.chars().all(|c| c.is_ascii_hexdigit()) {
        format!("0x{hex}")
    } else {
        "white".into()
    }
}

/// Seconds with millisecond precision, no trailing noise.
fn t(x: f64) -> String {
    let s = format!("{:.3}", x.max(0.0));
    let s = s.trim_end_matches('0').trim_end_matches('.');
    if s.is_empty() { "0".into() } else { s.into() }
}

fn drawtext(o: &TextOverlay, font: &str, scale: f64, border: bool) -> String {
    let size = (o.font_size * scale).round().max(8.0);
    let mut f = format!(
        "drawtext=fontfile={}:text={}:expansion=none:fontsize={size}:fontcolor={}",
        esc(font),
        esc(&o.text),
        ffmpeg_color(&o.color)
    );
    if border {
        f.push_str(&format!(
            ":borderw={}:bordercolor=black@0.6",
            (size / 16.0).round().max(1.0)
        ));
    }
    f.push_str(&format!(
        ":x=w*{}-text_w/2:y=h*{}-text_h/2:enable='between(t,{},{})'",
        o.x.clamp(0.0, 1.0),
        o.y.clamp(0.0, 1.0),
        t(o.start),
        t(o.end)
    ));
    f
}

/// Everything after the inputs except the encoder settings.
pub struct Plan {
    pub inputs: Vec<String>,
    pub filter: String,
    pub duration: f64,
}

/// Build inputs and the filter graph. Outputs are labelled `[vout]` and `[aout]`.
/// `font` is only used when there is text to draw.
pub fn build_plan(req: &ExportRequest, font: &str) -> Result<Plan, String> {
    let total = total_duration(req);
    if total <= 0.0 {
        return Err("Add a clip to your timeline before exporting.".into());
    }
    let fps = req.fps.clamp(1, 120);
    let (w, h) = canvas(req.aspect, req.quality);
    let mut inputs = Vec::new();
    let mut graph = vec![format!(
        "color=c=black:s={w}x{h}:r={fps}:d={}[base]",
        t(total)
    )];
    let mut idx = 0usize;

    let mut last = "base".to_string();
    for (i, c) in req.video_clips.iter().enumerate() {
        let dur = c.end - c.start;
        if dur <= 0.0 {
            continue;
        }
        inputs.extend([
            "-ss".into(),
            t(c.in_point),
            "-t".into(),
            t(dur),
            "-i".into(),
            c.path.clone(),
        ]);
        let crop = match c.crop {
            Some(r) => {
                let x = r.x.clamp(0.0, 1.0);
                let y = r.y.clamp(0.0, 1.0);
                let cw = r.w.clamp(0.01, 1.0 - x);
                let ch = r.h.clamp(0.01, 1.0 - y);
                format!("crop=iw*{cw}:ih*{ch}:iw*{x}:ih*{y}")
            }
            None => format!("crop='min(iw,ih*{w}/{h})':'min(ih,iw*{h}/{w})'"),
        };
        graph.push(format!(
            "[{idx}:v]trim=duration={d},setpts=PTS-STARTPTS+{s}/TB,fps={fps},{crop},scale={w}:{h},setsar=1[v{i}]",
            d = t(dur),
            s = t(c.start),
        ));
        graph.push(format!(
            "[{last}][v{i}]overlay=eof_action=pass:enable='between(t,{},{})'[o{i}]",
            t(c.start),
            t(c.end)
        ));
        last = format!("o{i}");
        idx += 1;
    }

    // Text sizes are given for a 1080-wide canvas.
    let scale = w.min(h) as f64 / 1080.0;
    let mut draws: Vec<String> = Vec::new();
    for o in &req.text_overlays {
        if o.end > o.start && !o.text.trim().is_empty() {
            draws.push(drawtext(o, font, scale, false));
        }
    }
    for o in &req.captions {
        if o.end > o.start && !o.text.trim().is_empty() {
            draws.push(drawtext(o, font, scale, true));
        }
    }
    if req.watermark {
        let size = (h.min(w) as f64 * 0.028).round();
        draws.push(format!(
            "drawtext=fontfile={}:text={}:expansion=none:fontsize={size}:fontcolor=white@0.75:borderw=1:bordercolor=black@0.4:x=w-text_w-{m}:y=h-text_h-{m}",
            esc(font),
            esc("Made with Verso"),
            m = (size * 0.9).round()
        ));
    }
    if draws.is_empty() {
        graph.push(format!("[{last}]null[vout]"));
    } else {
        graph.push(format!("[{last}]{}[vout]", draws.join(",")));
    }

    let mut mixed = Vec::new();
    for (k, c) in req.audio_clips.iter().enumerate() {
        let dur = c.end - c.start;
        if dur <= 0.0 {
            continue;
        }
        inputs.extend([
            "-ss".into(),
            t(c.in_point),
            "-t".into(),
            t(dur),
            "-i".into(),
            c.path.clone(),
        ]);
        graph.push(format!(
            "[{idx}:a]atrim=duration={d},asetpts=PTS-STARTPTS,aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,volume={v},adelay={ms}:all=1[a{k}]",
            d = t(dur),
            v = c.volume.clamp(0.0, 1.0),
            ms = (c.start.max(0.0) * 1000.0).round() as u64,
        ));
        mixed.push(format!("[a{k}]"));
        idx += 1;
    }
    if mixed.is_empty() {
        graph.push(format!(
            "anullsrc=r=48000:cl=stereo,atrim=duration={}[aout]",
            t(total)
        ));
    } else {
        graph.push(format!(
            "{}amix=inputs={}:duration=longest:normalize=0,apad,atrim=duration={}[aout]",
            mixed.join(""),
            mixed.len(),
            t(total)
        ));
    }

    Ok(Plan {
        inputs,
        filter: graph.join(";"),
        duration: total,
    })
}

/// Full FFmpeg argument list writing an MP4 (H.264 + AAC 48k) to `output`.
pub fn build_args(
    req: &ExportRequest,
    encoder: &str,
    font: &str,
    output: &str,
) -> Result<(Vec<String>, f64), String> {
    let plan = build_plan(req, font)?;
    let fps = req.fps.clamp(1, 120);
    let mut args: Vec<String> = [
        "-hide_banner",
        "-y",
        "-loglevel",
        "error",
        "-progress",
        "pipe:1",
        "-nostats",
    ]
    .map(String::from)
    .to_vec();
    args.extend(plan.inputs);
    args.extend([
        "-filter_complex".into(),
        plan.filter,
        "-map".into(),
        "[vout]".into(),
        "-map".into(),
        "[aout]".into(),
    ]);
    args.extend(encoders::video_args(encoder, req.quality, fps));
    args.extend(
        [
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-ar",
            "48000",
            "-ac",
            "2",
            "-t",
            &t(plan.duration),
            "-movflags",
            "+faststart",
            "-f",
            "mp4",
            output,
        ]
        .map(String::from),
    );
    Ok((args, plan.duration))
}

/// A font drawtext can use when the request names none.
pub fn default_font() -> Option<String> {
    let candidates: &[&str] = if cfg!(windows) {
        &[
            "C:\\Windows\\Fonts\\segoeuib.ttf",
            "C:\\Windows\\Fonts\\segoeui.ttf",
            "C:\\Windows\\Fonts\\arialbd.ttf",
            "C:\\Windows\\Fonts\\arial.ttf",
        ]
    } else if cfg!(target_os = "macos") {
        &[
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
        ]
    } else {
        &["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]
    };
    candidates
        .iter()
        .find(|p| std::path::Path::new(p).is_file())
        .map(|p| p.to_string())
}

/// `out_time_us=` (or the misnamed `out_time_ms=`, also microseconds) from
/// `-progress` output, in seconds.
pub fn parse_progress_time(line: &str) -> Option<f64> {
    let (key, value) = line.trim().split_once('=')?;
    if key != "out_time_us" && key != "out_time_ms" {
        return None;
    }
    let us: i64 = value.trim().parse().ok()?;
    Some(us.max(0) as f64 / 1_000_000.0)
}
