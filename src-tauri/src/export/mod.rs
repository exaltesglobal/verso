//! Export: turns the timeline into one FFmpeg command.
//!
//! `build_args` is pure (no FFmpeg needed). Each video clip becomes its own
//! input: trimmed, reframed (keyframed crop, one or two panels), sped up or
//! slowed down, zoomed, then scaled to the canvas. Clips joined by a
//! transition are chained with `xfade` into one run; runs are laid over a
//! black base so gaps stay black. Audio clips are sped up, faded, delayed to
//! their position and mixed. Text layers and captions are written to an ASS
//! file (see `ass.rs`) and burned with libass. No watermark is ever drawn.

pub mod ass;
pub mod color;
pub mod encoders;
// animated_drawtext stays as a drawtext fallback; text animations go through the ASS writer.
#[allow(dead_code)]
pub mod look;

use serde::Deserialize;

use color::{ClipColor, RampKey};

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
    /// 4K (Pro).
    Ultra,
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
pub struct CropKeyframe {
    /// Source-file seconds.
    pub t: f64,
    pub rects: Vec<CropRect>,
}

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "snake_case")]
pub enum Layout {
    #[default]
    Single,
    Stacked,
    SideBySide,
}

/// Smart reframe path (src/lib/reframe.ts `CropPath`).
#[derive(Debug, Clone, Deserialize)]
pub struct CropPath {
    #[serde(default)]
    pub layout: Layout,
    pub keyframes: Vec<CropKeyframe>,
}

#[derive(Debug, Clone, Copy, Deserialize)]
pub struct ZoomKey {
    /// Seconds from the clip start (timeline).
    pub t: f64,
    pub zoom: f64,
}

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum TransitionKind {
    Fade,
    Dissolve,
    Slide,
    Zoom,
}

#[derive(Debug, Clone, Copy, Deserialize)]
pub struct Transition {
    pub kind: TransitionKind,
    pub duration: f64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VideoClip {
    pub path: String,
    #[serde(default)]
    pub in_point: f64,
    pub start: f64,
    pub end: f64,
    /// Source seconds per timeline second.
    #[serde(default = "one")]
    pub speed: f64,
    #[serde(default)]
    pub crop_path: Option<CropPath>,
    /// 1 = fit. Ignored when there is a crop path (as in the preview).
    #[serde(default = "one")]
    pub zoom: f64,
    #[serde(default)]
    pub zoom_keys: Vec<ZoomKey>,
    #[serde(default)]
    pub transition_in: Option<Transition>,
    #[serde(default)]
    pub color: Option<ClipColor>,
    /// Speed keyframes, `t` 0..1 across the source span (src/lib/speed.ts). Overrides `speed`.
    #[serde(default)]
    pub speed_ramp: Vec<RampKey>,
    /// Freeze frame: a PNG looped for the clip's length (`path`/`in_point` unused).
    #[serde(default)]
    pub still: Option<String>,
    /// VP9 copy with alpha (background "remove"): FFmpeg's native decoder drops alpha.
    #[serde(default)]
    pub alpha: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioClip {
    pub path: String,
    #[serde(default)]
    pub in_point: f64,
    pub start: f64,
    pub end: f64,
    /// 0..1.5
    #[serde(default = "one")]
    pub volume: f64,
    #[serde(default = "one")]
    pub speed: f64,
    #[serde(default)]
    pub fade_in: f64,
    #[serde(default)]
    pub fade_out: f64,
    /// Seconds of sound before `start` (crossfade under a video transition).
    #[serde(default)]
    pub lead_in: f64,
    /// Same ramp as the linked video clip. Overrides `speed`.
    #[serde(default)]
    pub speed_ramp: Vec<RampKey>,
}

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub enum Align {
    Left,
    #[default]
    Center,
    Right,
}

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub enum TextPreset {
    Title,
    #[default]
    Subtitle,
    Body,
    Boxed,
    Outline,
    Neon,
}

/// A text layer (src/lib/project.ts `TextStyle`, colours resolved).
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextOverlay {
    pub text: String,
    pub start: f64,
    pub end: f64,
    /// Vertical centre, 0 = top, 1 = bottom.
    #[serde(default = "half")]
    pub y: f64,
    /// Font size as a fraction of canvas height.
    #[serde(default = "default_text_size")]
    pub size: f64,
    /// `#RRGGBB` or `#RRGGBBAA`.
    #[serde(default = "white")]
    pub color: String,
    #[serde(default)]
    pub align: Align,
    #[serde(default)]
    pub preset: TextPreset,
    /// Box colour (boxed) or glow colour (neon).
    #[serde(default)]
    pub accent: Option<String>,
    /// Text colour inside the box (boxed).
    #[serde(default)]
    pub box_text_color: Option<String>,
    /// Entrance animation (src/lib/project.ts `TextAnimation`); None = pop.
    #[serde(default)]
    pub animation: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CaptionWord {
    pub text: String,
    pub start: f64,
    pub end: f64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Caption {
    pub text: String,
    pub start: f64,
    pub end: f64,
    /// Word timings; empty = spread evenly over the clip.
    #[serde(default)]
    pub words: Vec<CaptionWord>,
    #[serde(default)]
    pub speaker: Option<String>,
}

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub enum Highlight {
    #[default]
    Color,
    Fill,
    Box,
    None,
}

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub enum CaptionBackground {
    #[default]
    None,
    Box,
    Pill,
}

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub enum CaptionAnimation {
    #[default]
    Pop,
    Fade,
    Slide,
    Typewriter,
}

/// src/lib/captionStyles.ts `CaptionStyle` with colours resolved to hex.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CaptionStyle {
    #[serde(default = "default_weight")]
    pub font_weight: u32,
    #[serde(default)]
    pub upper: bool,
    #[serde(default = "one")]
    pub scale: f64,
    #[serde(default = "white")]
    pub text_color: String,
    #[serde(default)]
    pub highlight: Highlight,
    #[serde(default = "white")]
    pub highlight_color: String,
    #[serde(default)]
    pub background: CaptionBackground,
    #[serde(default)]
    pub background_color: Option<String>,
    #[serde(default)]
    pub outline_color: Option<String>,
    /// Stroke width in preview pixels (22 px base font).
    #[serde(default)]
    pub outline_width: f64,
    #[serde(default)]
    pub glow: Option<String>,
    #[serde(default)]
    pub animation: CaptionAnimation,
    #[serde(default)]
    pub reveal_words: bool,
}

impl Default for CaptionStyle {
    fn default() -> Self {
        Self {
            font_weight: 800,
            upper: false,
            scale: 1.0,
            text_color: white(),
            highlight: Highlight::None,
            highlight_color: white(),
            background: CaptionBackground::None,
            background_color: None,
            outline_color: Some("#000000".into()),
            outline_width: 2.0,
            glow: None,
            animation: CaptionAnimation::Fade,
            reveal_words: false,
        }
    }
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
    pub captions: Vec<Caption>,
    #[serde(default)]
    pub caption_style: Option<CaptionStyle>,
    pub output_path: String,
    /// Subtitle font used only when the bundled Manrope is missing. None = a system font.
    #[serde(default)]
    pub font_path: Option<String>,
    /// Whole-frame look: grain, vignette, letterbox, leaks, dips (export/look.rs).
    #[serde(default)]
    pub look: Option<look::Look>,
}

fn one() -> f64 {
    1.0
}
fn half() -> f64 {
    0.5
}
fn default_text_size() -> f64 {
    0.045
}
fn default_weight() -> u32 {
    800
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
        Quality::Ultra => (w * 2, h * 2),
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
pub fn esc(s: &str) -> String {
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

/// Seconds with millisecond precision, no trailing noise.
fn t(x: f64) -> String {
    let s = format!("{:.3}", x.max(0.0));
    let s = s.trim_end_matches('0').trim_end_matches('.');
    if s.is_empty() { "0".into() } else { s.into() }
}

/// A number for an expression (may be negative), 5 decimals.
fn n(x: f64) -> String {
    let s = format!("{x:.5}");
    let s = s.trim_end_matches('0').trim_end_matches('.');
    if s.is_empty() || s == "-" || s == "-0" {
        "0".into()
    } else {
        s.into()
    }
}

/// Speed clamped to what we support.
fn speed(s: f64) -> f64 {
    if s.is_finite() {
        s.clamp(0.1, 16.0)
    } else {
        1.0
    }
}

/// Pieces a speed ramp is cut into (each at its own constant speed).
const RAMP_PIECES: usize = 24;

/// Ramp segments for a clip `len` timeline seconds long, and the source span they cover.
fn ramp_plan(keys: &[RampKey], len: f64) -> (Vec<color::RampSegment>, f64) {
    let factor = color::ramp_duration(&color::ramp_segments(keys, 1.0, RAMP_PIECES)).max(1e-6);
    let span = len / factor;
    (color::ramp_segments(keys, span, RAMP_PIECES), span)
}

/// `atempo` only takes 0.5..2 per instance, so chain it.
fn atempo(s: f64) -> Vec<String> {
    let mut s = speed(s);
    let mut out = Vec::new();
    while s > 2.0 {
        out.push("atempo=2".into());
        s /= 2.0;
    }
    while s < 0.5 {
        out.push("atempo=0.5".into());
        s /= 0.5;
    }
    if (s - 1.0).abs() > 1e-4 {
        out.push(format!("atempo={}", n(s)));
    }
    out
}

/// Piecewise-linear expression of `t` through `pts` (sorted by time):
/// v0 + sum(slope_k * (clip(t, t_k, t_k+1) - t_k)). Flat, so no nesting limits.
fn lerp_expr(pts: &[(f64, f64)]) -> String {
    let mut s = n(pts[0].1);
    for w in pts.windows(2) {
        let (a, b) = (w[0], w[1]);
        let dt = b.0 - a.0;
        let dv = b.1 - a.1;
        if dt <= 1e-6 || dv.abs() < 1e-6 {
            continue;
        }
        s.push_str(&format!(
            "+{}*(clip(t,{},{})-{})",
            n(dv / dt),
            n(a.0),
            n(b.0),
            n(a.0)
        ));
    }
    s
}

/// Drops keyframes a straight line already explains (keyframes come ~5/s) and
/// caps the count so expressions stay small.
fn simplify(pts: Vec<(f64, f64, f64)>) -> Vec<(f64, f64, f64)> {
    const TOL: f64 = 0.0015;
    const MAX: usize = 400;
    if pts.len() <= 2 {
        return pts;
    }
    let mut out = vec![pts[0]];
    for i in 1..pts.len() - 1 {
        let a = *out.last().unwrap();
        let (b, c) = (pts[i], pts[i + 1]);
        let f = (b.0 - a.0) / (c.0 - a.0).max(1e-9);
        let ex = a.1 + (c.1 - a.1) * f;
        let ey = a.2 + (c.2 - a.2) * f;
        if (ex - b.1).abs() > TOL || (ey - b.2).abs() > TOL {
            out.push(b);
        }
    }
    out.push(pts[pts.len() - 1]);
    if out.len() > MAX {
        // shortcut: uniform thinning can soften fast pans; only hit by very long reframed clips.
        let step = out.len().div_ceil(MAX);
        let last = *out.last().unwrap();
        out = out.into_iter().step_by(step).collect();
        out.push(last);
    }
    out
}

/// `crop` for panel `j` of a crop path. `t` inside the filter is seconds from
/// `t0` (source time of the first decoded frame). Width and height come from
/// the first keyframe; x/y follow the keyframes.
fn path_crop(path: &CropPath, j: usize, t0: f64, span: f64) -> Option<String> {
    let rect = |k: &CropKeyframe| k.rects.get(j).or(k.rects.last()).copied();
    let keys: Vec<&CropKeyframe> = path
        .keyframes
        .iter()
        .filter(|k| !k.rects.is_empty())
        .collect();
    let first = rect(keys.first()?)?;
    // Keep one keyframe either side of the window so edges interpolate.
    let lo = keys.iter().rposition(|k| k.t <= t0).unwrap_or(0);
    let hi = keys
        .iter()
        .position(|k| k.t >= t0 + span)
        .unwrap_or(keys.len() - 1);
    let pts: Vec<(f64, f64, f64)> = keys[lo..=hi.max(lo)]
        .iter()
        .filter_map(|k| rect(k).map(|r| (k.t - t0, r.x, r.y)))
        .collect();
    let pts = simplify(pts);
    let w = first.w.clamp(0.02, 1.0);
    let h = first.h.clamp(0.02, 1.0);
    let xs: Vec<(f64, f64)> = pts.iter().map(|p| (p.0, p.1.clamp(0.0, 1.0 - w))).collect();
    let ys: Vec<(f64, f64)> = pts.iter().map(|p| (p.0, p.2.clamp(0.0, 1.0 - h))).collect();
    Some(format!(
        "crop=w=iw*{}:h=ih*{}:x='iw*({})':y='ih*({})'",
        n(w),
        n(h),
        lerp_expr(&xs),
        lerp_expr(&ys)
    ))
}

const PUNCH_IN: f64 = 0.25;
const PUNCH_HOLD: f64 = 1.0;
const PUNCH_OUT: f64 = 0.35;

/// Zoom at local time `T` (an expression), the same curve as `zoomAt` in
/// src/lib/smart.ts: ease out over 0.25 s, hold 1 s, ease in-out back over 0.35 s.
fn zoom_expr(base: f64, keys: &[ZoomKey], time: &str) -> String {
    let mut punch = "1".to_string();
    for k in keys {
        let d = format!("({time}-{})", n(k.t));
        let x_in = format!("({d}/{PUNCH_IN})");
        let x_out = format!("(({d}-{})/{PUNCH_OUT})", n(PUNCH_IN + PUNCH_HOLD));
        let ease_in_out = format!("if(lt({x_out},0.5),4*pow({x_out},3),1-pow(-2*{x_out}+2,3)/2)");
        let env = format!(
            "if(lt({d},{PUNCH_IN}),1-pow(1-{x_in},3),if(lt({d},{}),1,1-{ease_in_out}))",
            n(PUNCH_IN + PUNCH_HOLD)
        );
        let one_key = format!(
            "if(between({d},0,{}),1+{}*{env},1)",
            n(PUNCH_IN + PUNCH_HOLD + PUNCH_OUT),
            n(k.zoom - 1.0)
        );
        punch = format!("max({punch},{one_key})");
    }
    format!("{}*{punch}", n(base))
}

/// xfade transition name for a clip transition.
fn xfade_name(k: TransitionKind) -> &'static str {
    match k {
        TransitionKind::Fade => "fade",
        TransitionKind::Dissolve => "dissolve",
        TransitionKind::Slide => "slideleft",
        TransitionKind::Zoom => "zoomin",
    }
}

/// Clips closer than this count as touching (joined by a transition).
/// src/lib/export.ts uses the same value for the matching sound crossfade.
pub const ADJACENT_EPS: f64 = 0.05;

/// Everything after the inputs except the encoder settings.
pub struct Plan {
    pub inputs: Vec<String>,
    pub filter: String,
    pub duration: f64,
}

/// Burned subtitles: the ASS file and the folder libass loads fonts from.
pub struct Subtitles<'a> {
    pub ass_path: &'a str,
    pub fonts_dir: &'a str,
}

/// Build inputs and the filter graph. Outputs are labelled `[vout]` and `[aout]`.
/// Exports never carry a watermark, on any plan.
pub fn build_plan(req: &ExportRequest, subs: Option<&Subtitles>) -> Result<Plan, String> {
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

    // Video: sort by start, then group clips joined by transitions into runs.
    let mut clips: Vec<&VideoClip> = req.video_clips.iter().filter(|c| c.end > c.start).collect();
    clips.sort_by(|a, b| a.start.total_cmp(&b.start));
    // Per clip: transition seconds joining it to the previous clip (0 = new run).
    let mut join = vec![0.0; clips.len()];
    for i in 1..clips.len() {
        if let Some(tr) = clips[i].transition_in {
            let (prev, cur) = (clips[i - 1], clips[i]);
            if (cur.start - prev.end).abs() < ADJACENT_EPS {
                let d = tr
                    .duration
                    .min(0.9 * (prev.end - prev.start))
                    .min(0.9 * (cur.end - cur.start))
                    .min(3.0);
                if d >= 0.04 {
                    join[i] = d;
                }
            }
        }
    }

    for (i, c) in clips.iter().enumerate() {
        let ramped = !c.speed_ramp.is_empty() && c.still.is_none();
        let held = ramped || c.still.is_some();
        let sp = if held { 1.0 } else { speed(c.speed) };
        let len = c.end - c.start;
        // Joined clips start `lead` early so the transition overlaps the previous clip.
        // Stills and ramped clips hold their first frame instead (tpad below).
        let lead = join[i];
        let lead_src = if held {
            0.0
        } else {
            lead.min(c.in_point.max(0.0) / sp)
        };
        let t0 = (c.in_point - lead_src * sp).max(0.0);
        let mut span = (len + lead_src) * sp;
        let mut head = format!("[{idx}:v]trim=duration={},setpts=PTS-STARTPTS", t(span));
        let mut retime = format!("setpts=PTS/{},fps={fps}", n(sp));
        if let Some(still) = &c.still {
            inputs.extend(color::still_input_args(still, len, fps));
            retime = format!("fps={fps}");
        } else {
            if ramped {
                // shortcut: a reframe crop path on a ramped clip is sampled on timeline time, not
                // source time, so the crop drifts on ramps; fine for the usual unframed ramp.
                let (segs, src_span) = ramp_plan(&c.speed_ramp, len);
                span = src_span;
                graph.push(format!(
                    "[{idx}:v]trim=duration={},setpts=PTS-STARTPTS[ri{i}]",
                    t(span)
                ));
                graph.push(color::ramp_video_graph(
                    &segs,
                    &format!("ri{i}"),
                    &format!("rv{i}"),
                    &format!("q{i}"),
                ));
                head = format!("[rv{i}]null");
                retime = format!("fps={fps}");
            }
            if c.alpha {
                inputs.extend(["-c:v".into(), "libvpx-vp9".into()]);
            }
            inputs.extend([
                "-ss".into(),
                t(t0),
                "-t".into(),
                t(span),
                "-i".into(),
                c.path.clone(),
            ]);
        }
        let fit = |pw: u32, ph: u32| {
            format!("scale={pw}:{ph}:force_original_aspect_ratio=increase,crop={pw}:{ph},setsar=1")
        };
        let layout = c.crop_path.as_ref().map(|p| p.layout).unwrap_or_default();
        let crop = |j: usize| {
            c.crop_path
                .as_ref()
                .and_then(|p| path_crop(p, j, t0, span))
                .map(|s| format!("{s},"))
                .unwrap_or_default()
        };
        let mut post = Vec::new();
        match layout {
            Layout::Stacked | Layout::SideBySide => {
                let (pw, ph, stack) = if layout == Layout::Stacked {
                    (w, h / 2, "vstack")
                } else {
                    (w / 2, h, "hstack")
                };
                graph.push(format!("{head},split=2[s{i}a][s{i}b]"));
                for (j, tag) in ["a", "b"].iter().enumerate() {
                    graph.push(format!(
                        "[s{i}{tag}]{}{retime},{}[p{i}{tag}]",
                        crop(j),
                        fit(pw, ph)
                    ));
                }
                graph.push(format!("[p{i}a][p{i}b]{stack}=inputs=2[g{i}]"));
            }
            Layout::Single => {
                let mut chain = format!("{head},{}{retime},{}", crop(0), fit(w, h));
                // The preview ignores zoom on reframed clips; so do we.
                if c.crop_path.is_none() {
                    let base = if c.zoom.is_finite() {
                        c.zoom.clamp(1.0, 5.0)
                    } else {
                        1.0
                    };
                    if !c.zoom_keys.is_empty() {
                        // `on` counts output frames from the first decoded frame.
                        let time = format!("(on/{fps}-{})", n(lead_src));
                        chain.push_str(&format!(
                            ",zoompan=z='{}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={w}x{h}:fps={fps}",
                            zoom_expr(base, &c.zoom_keys, &time)
                        ));
                    } else if base > 1.001 {
                        chain.push_str(&format!(",crop=iw/{z}:ih/{z},scale={w}:{h}", z = n(base)));
                    }
                }
                graph.push(format!("{chain}[g{i}]"));
            }
        }
        post.push("format=yuv420p".to_string());
        if lead - lead_src > 0.001 {
            post.push(format!(
                "tpad=start_duration={}:start_mode=clone",
                t(lead - lead_src)
            ));
        }
        if join[i] == 0.0
            && let Some(tr) = c.transition_in
        {
            // No clip right before: fade in from black.
            let d = tr.duration.clamp(0.0, len * 0.9);
            if d >= 0.04 {
                post.push(format!("fade=t=in:st=0:d={}", t(d)));
            }
        }
        let mut g = format!("g{i}");
        if let Some(col) = &c.color {
            graph.push(color::color_graph(
                col,
                &g,
                &format!("gc{i}"),
                &format!("c{i}"),
            ));
            g = format!("gc{i}");
        }
        graph.push(format!("[{g}]{}[v{i}]", post.join(",")));
        idx += 1;
    }

    let mut last = "base".to_string();
    let mut i = 0;
    let mut run_no = 0;
    while i < clips.len() {
        let run_start = clips[i].start;
        let mut cur = format!("v{i}");
        let mut cum = clips[i].end - clips[i].start;
        let mut j = i + 1;
        while j < clips.len() && join[j] > 0.0 {
            let d = join[j];
            let kind = clips[j]
                .transition_in
                .map(|x| x.kind)
                .unwrap_or(TransitionKind::Fade);
            // Blend in 4:4:4 so colour edges don't smear during the transition, then back to 4:2:0.
            graph.push(format!(
                "[{cur}]format=yuv444p[xa{j}];[v{j}]format=yuv444p[xb{j}];[xa{j}][xb{j}]xfade=transition={}:duration={}:offset={},format=yuv420p[x{j}]",
                xfade_name(kind),
                t(d),
                t(cum - d)
            ));
            cur = format!("x{j}");
            cum += clips[j].end - clips[j].start;
            j += 1;
        }
        graph.push(format!(
            "[{cur}]setpts=PTS-STARTPTS+{}/TB[r{run_no}]",
            t(run_start)
        ));
        graph.push(format!(
            "[{last}][r{run_no}]overlay=eof_action=pass:enable='between(t,{},{})'[o{run_no}]",
            t(run_start),
            t(run_start + cum)
        ));
        last = format!("o{run_no}");
        run_no += 1;
        i = j;
    }

    let mut draws: Vec<String> = Vec::new();
    if let Some(lk) = &req.look {
        if let Some(lines) = look::light_layers(lk, w, h, fps, total, &last, "lk") {
            graph.extend(lines);
            last = "lk".into();
        }
        draws.extend(look::finishing_filters(lk, req.aspect, total));
    }
    if let Some(s) = subs {
        draws.push(format!(
            "ass=filename={}:fontsdir={}",
            esc(s.ass_path),
            esc(s.fonts_dir)
        ));
    }
    if draws.is_empty() {
        graph.push(format!("[{last}]null[vout]"));
    } else {
        graph.push(format!("[{last}]{}[vout]", draws.join(",")));
    }

    let mut mixed = Vec::new();
    for (k, c) in req.audio_clips.iter().enumerate() {
        let len = c.end - c.start;
        if len <= 0.0 {
            continue;
        }
        let ramp = (!c.speed_ramp.is_empty()).then(|| ramp_plan(&c.speed_ramp, len));
        let sp = if ramp.is_some() { 1.0 } else { speed(c.speed) };
        let lead = if ramp.is_some() {
            0.0
        } else {
            c.lead_in
                .clamp(0.0, c.start.max(0.0))
                .min(c.in_point.max(0.0) / sp)
        };
        let t0 = c.in_point - lead * sp;
        let span = ramp.as_ref().map(|r| r.1).unwrap_or((len + lead) * sp);
        inputs.extend([
            "-ss".into(),
            t(t0),
            "-t".into(),
            t(span),
            "-i".into(),
            c.path.clone(),
        ]);
        let mut src = format!("{idx}:a");
        let mut chain = Vec::new();
        if let Some((segs, _)) = &ramp {
            graph.push(format!(
                "[{idx}:a]atrim=duration={},asetpts=PTS-STARTPTS[ai{k}]",
                t(span)
            ));
            graph.push(color::ramp_audio_graph(
                segs,
                &format!("ai{k}"),
                &format!("ar{k}"),
                &format!("qa{k}"),
            ));
            src = format!("ar{k}");
        } else {
            chain.push(format!("atrim=duration={}", t(span)));
            chain.push("asetpts=PTS-STARTPTS".into());
            chain.extend(atempo(sp));
        }
        chain.push("aresample=48000".into());
        chain.push("aformat=sample_fmts=fltp:channel_layouts=stereo".into());
        chain.push(format!("volume={}", n(c.volume.clamp(0.0, 1.5))));
        let whole = len + lead;
        let fin = c.fade_in.max(0.0).min(whole);
        if fin >= 0.01 {
            chain.push(format!("afade=t=in:st=0:d={}", t(fin)));
        }
        let fout = c.fade_out.max(0.0).min(whole);
        if fout >= 0.01 {
            chain.push(format!("afade=t=out:st={}:d={}", t(whole - fout), t(fout)));
        }
        chain.push(format!(
            "adelay={}:all=1",
            ((c.start - lead).max(0.0) * 1000.0).round() as u64
        ));
        graph.push(format!("[{src}]{}[a{k}]", chain.join(",")));
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
    subs: Option<&Subtitles>,
    output: &str,
) -> Result<(Vec<String>, f64), String> {
    let plan = build_plan(req, subs)?;
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

/// A system font, the subtitle fallback when the bundled Manrope is missing.
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
