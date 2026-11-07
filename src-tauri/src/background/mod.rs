//! Background blur / removal / replacement for talking-head video.
//!
//! On-device and offline: MediaPipe Selfie Segmentation (Apache-2.0, ONNX) via
//! ONNX Runtime. Pipeline: FFmpeg decodes rgb24 frames over a pipe at the
//! source fps -> the model makes a low-res person mask -> temporal EMA (no
//! flicker) + guided filter (edges follow the picture) -> composite per mode ->
//! a second FFmpeg encodes a processed copy into the app cache. The original
//! file is never written to. See docs/AI-MODELS.md ("Background").

use std::io::{ErrorKind, Read, Write};
use std::path::Path;
use std::process::{Child, Stdio};

use ort::session::Session;
use ort::value::Tensor;
use serde::{Deserialize, Serialize};

use crate::export::{Quality, encoders};
use crate::reframe::Frame;
use crate::reframe::models::ModelSpec;
use crate::reframe::onnx::{load, run_err};
use crate::tools::{self, Tool};

pub const SELFIE: &str = "seg_selfie";

pub const MODELS: &[ModelSpec] = &[ModelSpec {
    id: SELFIE,
    name: "Person finder",
    purpose: "Separates you from the background",
    file: "mediapipe_selfie_segmentation_256.onnx",
    url: "https://huggingface.co/onnx-community/mediapipe_selfie_segmentation/resolve/be49485c8e027524be38591817fc5cd31bd9d00e/onnx/model.onnx",
    sha256: "3241ac4ad8aa35bdaf33946776db29f7c283a413aa0b0dacb9483594b4531aad",
    size_bytes: 462_352,
    licence: "Apache-2.0",
    required: true,
}];

/// Longest edge of the processed copy. Reels are 1080x1920 at most.
const MAX_EDGE: u32 = 1920;
/// Longest edge of the guided-filter working mask.
const WORK_EDGE: u32 = 480;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Mode {
    Blur,
    Remove,
    Replace,
    Studio,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Options {
    /// 0..1 for blur and studio. Default 0.6.
    pub strength: Option<f64>,
    /// Replace: solid "#rrggbb".
    pub color: Option<String>,
    /// Replace: two "#rrggbb" colours, top to bottom (e.g. brand colours).
    pub gradient: Option<Vec<String>>,
    /// Replace: a picture file.
    pub image_path: Option<String>,
}

impl Mode {
    /// Remove keeps transparency, so it needs a format with alpha.
    pub fn ext(self) -> &'static str {
        if self == Mode::Remove { "webm" } else { "mp4" }
    }
}

// ---------- Model ----------

pub struct Segmenter {
    session: Session,
    nhwc: bool,
    /// Model input (w, h).
    size: (usize, usize),
}

impl Segmenter {
    pub fn new(path: &Path) -> Result<Self, String> {
        let session = load(path)?;
        let dim = |n: usize| {
            session
                .inputs()
                .first()
                .and_then(|i| i.dtype().tensor_shape()?.get(n).copied())
                .unwrap_or(-1)
        };
        let nhwc = dim(3) == 3;
        let (h, w) = if nhwc {
            (dim(1), dim(2))
        } else {
            (dim(2), dim(3))
        };
        let size = if h > 0 && w > 0 {
            (w as usize, h as usize)
        } else {
            (256, 256)
        };
        Ok(Self {
            session,
            nhwc,
            size,
        })
    }

    /// Person probability 0..1, `size.0 * size.1` values, row-major.
    pub fn mask(&mut self, frame: &Frame) -> Result<Vec<f32>, String> {
        let (w, h) = self.size;
        let (sx, sy) = (
            frame.width as f32 / w as f32,
            frame.height as f32 / h as f32,
        );
        let mut input = vec![0f32; 3 * w * h];
        for y in 0..h {
            for x in 0..w {
                let (fx, fy) = ((x as f32 + 0.5) * sx - 0.5, (y as f32 + 0.5) * sy - 0.5);
                for c in 0..3 {
                    let i = if self.nhwc {
                        (y * w + x) * 3 + c
                    } else {
                        c * w * h + y * w + x
                    };
                    input[i] = frame.sample(fx, fy, c) / 255.0;
                }
            }
        }
        let shape = if self.nhwc {
            [1usize, h, w, 3]
        } else {
            [1usize, 3, h, w]
        };
        let tensor = Tensor::from_array((shape, input)).map_err(run_err)?;
        let outputs = self.session.run(ort::inputs![tensor]).map_err(run_err)?;
        let out = outputs[0].try_extract_tensor::<f32>().map_err(run_err)?.1;
        if out.len() < w * h {
            return Err(
                "The person finder gave an unexpected answer. Try downloading it again.".into(),
            );
        }
        Ok(out[..w * h].iter().map(|v| v.clamp(0.0, 1.0)).collect())
    }
}

// ---------- Mask clean-up ----------

/// Bilinear sample of a single-channel buffer.
fn sample1(buf: &[f32], w: usize, h: usize, x: f32, y: f32) -> f32 {
    let x = x.clamp(0.0, (w - 1) as f32);
    let y = y.clamp(0.0, (h - 1) as f32);
    let (x0, y0) = (x as usize, y as usize);
    let (x1, y1) = ((x0 + 1).min(w - 1), (y0 + 1).min(h - 1));
    let (fx, fy) = (x - x0 as f32, y - y0 as f32);
    let top = buf[y0 * w + x0] * (1.0 - fx) + buf[y0 * w + x1] * fx;
    let bot = buf[y1 * w + x0] * (1.0 - fx) + buf[y1 * w + x1] * fx;
    top * (1.0 - fy) + bot * fy
}

/// Mean over a (2r+1)^2 window (clipped at the edges), via an integral image.
fn box_mean(src: &[f32], w: usize, h: usize, r: usize) -> Vec<f32> {
    let mut ii = vec![0f64; (w + 1) * (h + 1)];
    for y in 0..h {
        let mut row = 0f64;
        for x in 0..w {
            row += src[y * w + x] as f64;
            ii[(y + 1) * (w + 1) + x + 1] = ii[y * (w + 1) + x + 1] + row;
        }
    }
    let mut out = vec![0f32; w * h];
    for y in 0..h {
        let (y0, y1) = (y.saturating_sub(r), (y + r + 1).min(h));
        for x in 0..w {
            let (x0, x1) = (x.saturating_sub(r), (x + r + 1).min(w));
            let s = ii[y1 * (w + 1) + x1] - ii[y0 * (w + 1) + x1] - ii[y1 * (w + 1) + x0]
                + ii[y0 * (w + 1) + x0];
            out[y * w + x] = (s / ((y1 - y0) * (x1 - x0)) as f64) as f32;
        }
    }
    out
}

/// He et al. guided filter: smooths `p` while snapping its edges to `guide`.
fn guided(guide: &[f32], p: &[f32], w: usize, h: usize, r: usize, eps: f32) -> Vec<f32> {
    let mi = box_mean(guide, w, h, r);
    let mp = box_mean(p, w, h, r);
    let ip: Vec<f32> = guide.iter().zip(p).map(|(a, b)| a * b).collect();
    let i2: Vec<f32> = guide.iter().map(|a| a * a).collect();
    let mip = box_mean(&ip, w, h, r);
    let mii = box_mean(&i2, w, h, r);
    let n = w * h;
    let a: Vec<f32> = (0..n)
        .map(|k| (mip[k] - mi[k] * mp[k]) / (mii[k] - mi[k] * mi[k] + eps))
        .collect();
    let b: Vec<f32> = (0..n).map(|k| mp[k] - a[k] * mi[k]).collect();
    let (ma, mb) = (box_mean(&a, w, h, r), box_mean(&b, w, h, r));
    (0..n)
        .map(|k| (ma[k] * guide[k] + mb[k]).clamp(0.0, 1.0))
        .collect()
}

/// Turns raw model masks into a steady, edge-aware matte at working size.
pub struct Matte {
    prev: Option<Vec<f32>>,
    pub w: usize,
    pub h: usize,
}

impl Matte {
    pub fn new(frame_w: u32, frame_h: u32) -> Self {
        let s = (WORK_EDGE as f32 / frame_w.max(frame_h) as f32).min(1.0);
        Self {
            prev: None,
            w: ((frame_w as f32 * s) as usize).max(2),
            h: ((frame_h as f32 * s) as usize).max(2),
        }
    }

    pub fn refine(&mut self, frame: &Frame, raw: &[f32], raw_w: usize, raw_h: usize) -> Vec<f32> {
        let (w, h) = (self.w, self.h);
        let (fx, fy) = (
            frame.width as f32 / w as f32,
            frame.height as f32 / h as f32,
        );
        let (rx, ry) = (raw_w as f32 / w as f32, raw_h as f32 / h as f32);
        let mut guide = vec![0f32; w * h];
        let mut p = vec![0f32; w * h];
        for y in 0..h {
            for x in 0..w {
                let (xf, yf) = (x as f32 + 0.5, y as f32 + 0.5);
                guide[y * w + x] = frame.gray(xf * fx - 0.5, yf * fy - 0.5) / 255.0;
                p[y * w + x] = sample1(raw, raw_w, raw_h, xf * rx - 0.5, yf * ry - 0.5);
            }
        }
        // Temporal EMA: steady where little changes, follows quickly where a lot does.
        if let Some(prev) = &self.prev {
            for (n, o) in p.iter_mut().zip(prev) {
                let a = (0.45 + 0.55 * (*n - *o).abs()).min(1.0);
                *n = *o + (*n - *o) * a;
            }
        }
        self.prev = Some(p.clone());
        let r = (w.max(h) / 120).max(2);
        guided(&guide, &p, w, h, r, 1e-3)
    }
}

// ---------- Compositing ----------

fn smoothstep(e0: f32, e1: f32, x: f32) -> f32 {
    let t = ((x - e0) / (e1 - e0)).clamp(0.0, 1.0);
    t * t * (3.0 - 2.0 * t)
}

fn parse_hex(s: &str) -> Option<[u8; 3]> {
    let s = s.trim().trim_start_matches('#');
    if s.len() != 6 {
        return None;
    }
    let v = u32::from_str_radix(s, 16).ok()?;
    Some([(v >> 16) as u8, (v >> 8) as u8, v as u8])
}

/// Heavy, cheap blur: area-downscale by `k`, then box blur. Sample it scaled up.
fn soft_blur(frame: &Frame, k: u32) -> Frame {
    let (sw, sh) = (frame.width.div_ceil(k), frame.height.div_ceil(k));
    let (sw_, sh_) = (sw as usize, sh as usize);
    let mut acc = vec![0f32; sw_ * sh_ * 3];
    let mut cnt = vec![0f32; sw_ * sh_];
    for y in 0..frame.height as usize {
        let sy = y / k as usize;
        for x in 0..frame.width as usize {
            let s = sy * sw_ + x / k as usize;
            let i = (y * frame.width as usize + x) * 3;
            for c in 0..3 {
                acc[s * 3 + c] += frame.rgb[i + c] as f32;
            }
            cnt[s] += 1.0;
        }
    }
    let mut rgb = vec![0u8; sw_ * sh_ * 3];
    for c in 0..3 {
        let ch: Vec<f32> = (0..sw_ * sh_)
            .map(|s| acc[s * 3 + c] / cnt[s].max(1.0))
            .collect();
        let ch = box_mean(&box_mean(&ch, sw_, sh_, 2), sw_, sh_, 2);
        for (s, v) in ch.iter().enumerate() {
            rgb[s * 3 + c] = v.round().clamp(0.0, 255.0) as u8;
        }
    }
    Frame {
        width: sw,
        height: sh,
        rgb,
    }
}

/// What goes behind the person, prepared once per render.
enum Backdrop {
    /// Blur factor (downscale k), plus studio darkening/vignette.
    Blur { k: u32, studio: bool },
    /// Full-size rgb24 picture (colour, gradient or image).
    Picture(Vec<u8>),
    /// Transparent.
    None,
}

fn backdrop(mode: Mode, o: &Options, w: u32, h: u32) -> Result<Backdrop, String> {
    let strength = o.strength.unwrap_or(0.6).clamp(0.0, 1.0) as f32;
    let long = w.max(h) as f32;
    Ok(match mode {
        Mode::Remove => Backdrop::None,
        Mode::Blur => Backdrop::Blur {
            // Long edge of the blurred image: ~240 px (light) down to ~40 px (heavy).
            k: (long / (240.0 - 200.0 * strength)).max(2.0) as u32,
            studio: false,
        },
        Mode::Studio => Backdrop::Blur {
            k: (long / (200.0 - 120.0 * strength)).max(2.0) as u32,
            studio: true,
        },
        Mode::Replace => {
            let n = (w * h) as usize;
            if let Some(img) = o.image_path.as_deref().filter(|p| !p.is_empty()) {
                Backdrop::Picture(load_picture(Path::new(img), w, h)?)
            } else if let Some([a, b]) = o.gradient.as_deref() {
                let (a, b) = (
                    parse_hex(a).unwrap_or([20, 20, 24]),
                    parse_hex(b).unwrap_or([60, 60, 70]),
                );
                let mut px = vec![0u8; n * 3];
                for y in 0..h as usize {
                    let t = y as f32 / (h.max(2) - 1) as f32;
                    for x in 0..w as usize {
                        for c in 0..3 {
                            px[(y * w as usize + x) * 3 + c] =
                                (a[c] as f32 + (b[c] as f32 - a[c] as f32) * t).round() as u8;
                        }
                    }
                }
                Backdrop::Picture(px)
            } else {
                let c = o
                    .color
                    .as_deref()
                    .and_then(parse_hex)
                    .unwrap_or([18, 18, 22]);
                Backdrop::Picture(c.iter().copied().cycle().take(n * 3).collect())
            }
        }
    })
}

fn load_picture(path: &Path, w: u32, h: u32) -> Result<Vec<u8>, String> {
    let out = tools::command(Tool::Ffmpeg)
        .args(["-hide_banner", "-loglevel", "error", "-i"])
        .arg(path)
        .args([
            "-frames:v",
            "1",
            "-vf",
            &format!("scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}"),
            "-f",
            "rawvideo",
            "-pix_fmt",
            "rgb24",
            "pipe:1",
        ])
        .stderr(Stdio::null())
        .output()
        .map_err(spawn_err)?;
    if out.stdout.len() < (w * h * 3) as usize {
        return Err("We couldn't open that picture. Try a JPG or PNG.".into());
    }
    Ok(out.stdout[..(w * h * 3) as usize].to_vec())
}

/// Writes the composited frame into `out` (rgb24, or rgba for Remove).
fn composite(
    frame: &Frame,
    matte: &[f32],
    mw: usize,
    mh: usize,
    bd: &Backdrop,
    blur: Option<&Frame>,
    out: &mut Vec<u8>,
) {
    let (w, h) = (frame.width as usize, frame.height as usize);
    let alpha_out = matches!(bd, Backdrop::None);
    let ch = if alpha_out { 4 } else { 3 };
    out.clear();
    out.resize(w * h * ch, 0);
    let (sx, sy) = (mw as f32 / w as f32, mh as f32 / h as f32);
    for y in 0..h {
        let my = (y as f32 + 0.5) * sy - 0.5;
        let ny = y as f32 / h as f32 - 0.5;
        for x in 0..w {
            let a = smoothstep(
                0.15,
                0.85,
                sample1(matte, mw, mh, (x as f32 + 0.5) * sx - 0.5, my),
            );
            let i = (y * w + x) * 3;
            let o = (y * w + x) * ch;
            let fg = &frame.rgb[i..i + 3];
            match bd {
                Backdrop::None => {
                    out[o..o + 3].copy_from_slice(fg);
                    out[o + 3] = (a * 255.0).round() as u8;
                }
                Backdrop::Picture(px) => {
                    for c in 0..3 {
                        out[o + c] =
                            (fg[c] as f32 * a + px[i + c] as f32 * (1.0 - a)).round() as u8;
                    }
                }
                Backdrop::Blur { studio, .. } => {
                    let b = blur.expect("blur frame");
                    let (bx, by) = (
                        (x as f32 + 0.5) * b.width as f32 / w as f32 - 0.5,
                        (y as f32 + 0.5) * b.height as f32 / h as f32 - 0.5,
                    );
                    // Studio: darker, vignetted background; person gets a gentle lift.
                    let (bg_gain, fg_gain, fg_add) = if *studio {
                        let nx = x as f32 / w as f32 - 0.5;
                        let v = 1.0 - 0.9 * (nx * nx + ny * ny);
                        (0.78 * v.max(0.3), 1.04, 6.0)
                    } else {
                        (1.0, 1.0, 0.0)
                    };
                    for c in 0..3 {
                        let f = (fg[c] as f32 * fg_gain + fg_add).min(255.0);
                        let g = b.sample(bx, by, c) * bg_gain;
                        out[o + c] = (f * a + g * (1.0 - a)).round().clamp(0.0, 255.0) as u8;
                    }
                }
            }
        }
    }
}

// ---------- FFmpeg plumbing ----------

fn spawn_err(e: std::io::Error) -> String {
    match e.kind() {
        ErrorKind::NotFound => tools::missing_message(),
        _ => format!("We couldn't start FFmpeg ({e})."),
    }
}

/// Displayed size: phones store portrait video as rotated landscape.
fn rotated(src: &Path) -> bool {
    tools::command(Tool::Ffprobe)
        .args([
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream_side_data=rotation",
            "-of",
            "csv=p=0",
        ])
        .arg(src)
        .output()
        .ok()
        .and_then(|o| {
            String::from_utf8_lossy(&o.stdout)
                .trim()
                .lines()
                .next()?
                .trim()
                .parse::<f64>()
                .ok()
        })
        .is_some_and(|r| (r.abs() as i64) % 180 == 90)
}

fn read_full(r: &mut impl Read, buf: &mut [u8]) -> Result<usize, String> {
    let mut got = 0;
    while got < buf.len() {
        match r.read(&mut buf[got..]) {
            Ok(0) => break,
            Ok(n) => got += n,
            Err(e) if e.kind() == ErrorKind::Interrupted => {}
            Err(e) => return Err(format!("We couldn't read the video ({e}).")),
        }
    }
    Ok(got)
}

struct Kill(Child);
impl Drop for Kill {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

pub struct Request<'a> {
    pub src: &'a Path,
    pub in_point: f64,
    pub out_point: Option<f64>,
    pub mode: Mode,
    pub options: &'a Options,
    pub model: &'a Path,
    /// Final file. Written as `<out>.part` first, renamed when complete.
    pub out: &'a Path,
}

/// Renders the processed copy. `progress(percent, stage)`; `cancelled()` is
/// polled every frame. Returns (start, end) in source seconds.
pub fn render(
    req: &Request,
    cancelled: &dyn Fn() -> bool,
    progress: &mut dyn FnMut(f64, &str),
) -> Result<(f64, f64), String> {
    let info = crate::commands::media::probe(&req.src.to_string_lossy())?;
    let (true, Some(cw), Some(chh)) = (info.has_video, info.width, info.height) else {
        return Err("This file has no picture, so there's no background to change.".into());
    };
    let start = req.in_point.clamp(0.0, info.duration_sec);
    let end = req
        .out_point
        .unwrap_or(info.duration_sec)
        .min(info.duration_sec)
        .max(start);
    let dur = end - start;
    if dur < 0.05 {
        return Err("This part of the clip is too short.".into());
    }
    let fps = info.fps.filter(|f| *f > 1.0 && *f < 241.0).unwrap_or(30.0);
    let (sw, sh) = if rotated(req.src) {
        (chh, cw)
    } else {
        (cw, chh)
    };
    let s = (MAX_EDGE as f64 / sw.max(sh) as f64).min(1.0);
    let even = |v: f64| ((v / 2.0).round() as u32 * 2).max(2);
    let (w, h) = (even(sw as f64 * s), even(sh as f64 * s));

    progress(0.0, "Getting ready…");
    let mut seg = Segmenter::new(req.model)?;
    let bd = backdrop(req.mode, req.options, w, h)?;
    let mut matte = Matte::new(w, h);
    let alpha = req.mode == Mode::Remove;

    let (ss, t) = (format!("{start:.3}"), format!("{dur:.3}"));
    let fps_s = format!("{fps:.5}");
    let dec = tools::command(Tool::Ffmpeg)
        .args([
            "-hide_banner",
            "-loglevel",
            "error",
            "-ss",
            &ss,
            "-t",
            &t,
            "-i",
        ])
        .arg(req.src)
        .args([
            "-an",
            "-vf",
            &format!("fps={fps_s},scale={w}:{h}:flags=bicubic"),
            "-f",
            "rawvideo",
            "-pix_fmt",
            "rgb24",
            "pipe:1",
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(spawn_err)?;
    let mut dec = Kill(dec);

    let part = req.out.with_extension(format!("part.{}", req.mode.ext()));
    let mut enc = tools::command(Tool::Ffmpeg);
    enc.args([
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-f",
        "rawvideo",
        "-pix_fmt",
    ])
    .arg(if alpha { "rgba" } else { "rgb24" })
    .args([
        "-s",
        &format!("{w}x{h}"),
        "-framerate",
        &fps_s,
        "-i",
        "pipe:0",
    ]);
    if info.has_audio {
        enc.args(["-ss", &ss, "-t", &t, "-i"])
            .arg(req.src)
            .args(["-map", "0:v", "-map", "1:a:0"]);
    }
    if alpha {
        // VP9 with alpha in WebM: plays with transparency in the WebView and
        // FFmpeg reads it back (with the libvpx-vp9 decoder) at export.
        enc.args([
            "-c:v",
            "libvpx-vp9",
            "-pix_fmt",
            "yuva420p",
            "-crf",
            "20",
            "-b:v",
            "0",
            "-deadline",
            "good",
            "-cpu-used",
            "4",
            "-row-mt",
            "1",
            "-auto-alt-ref",
            "0",
        ]);
        if info.has_audio {
            enc.args(["-c:a", "libopus", "-b:a", "160k"]);
        }
        enc.args(["-f", "webm"]);
    } else {
        let encoder = encoders::detect()?.remove(0);
        let mut v = encoders::video_args(&encoder, Quality::High, fps.round() as u32);
        // Keep the exact source rate set on the input instead of a rounded `-r`.
        if let Some(i) = v.iter().position(|a| a == "-r") {
            v.drain(i..(i + 2).min(v.len()));
        }
        enc.args(&v);
        if info.has_audio {
            enc.args(["-c:a", "aac", "-b:a", "192k"]);
        }
        enc.args(["-movflags", "+faststart", "-f", "mp4"]);
    }
    enc.args(["-shortest"]).arg(&part);
    let enc = enc
        .stdin(Stdio::piped())
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(spawn_err)?;
    let mut enc = Kill(enc);
    let mut stdin = enc
        .0
        .stdin
        .take()
        .ok_or("FFmpeg didn't accept the video.")?;
    let mut stderr = enc.0.stderr.take().ok_or("FFmpeg didn't start properly.")?;
    let errors = std::thread::spawn(move || {
        let mut s = String::new();
        let _ = stderr.read_to_string(&mut s);
        s
    });
    let mut stdout = dec.0.stdout.take().ok_or("FFmpeg gave us no picture.")?;

    let fail = |part: &Path, msg: String| {
        let _ = std::fs::remove_file(part);
        Err(msg)
    };
    let total = (dur * fps).max(1.0);
    let mut buf = vec![0u8; (w * h * 3) as usize];
    let mut out = Vec::new();
    let mut n = 0usize;
    let stage = "Separating you from the background…";
    loop {
        if cancelled() {
            drop(stdin);
            return fail(&part, "Cancelled.".into());
        }
        let got = read_full(&mut stdout, &mut buf)?;
        if got < buf.len() {
            break;
        }
        let frame = Frame {
            width: w,
            height: h,
            rgb: std::mem::take(&mut buf),
        };
        let raw = seg.mask(&frame)?;
        let m = matte.refine(&frame, &raw, seg.size.0, seg.size.1);
        let blur = match &bd {
            Backdrop::Blur { k, .. } => Some(soft_blur(&frame, *k)),
            _ => None,
        };
        composite(&frame, &m, matte.w, matte.h, &bd, blur.as_ref(), &mut out);
        buf = frame.rgb;
        if let Err(e) = stdin.write_all(&out) {
            drop(stdin);
            let detail = errors.join().unwrap_or_default();
            let last = detail
                .lines()
                .rev()
                .find(|l| !l.trim().is_empty())
                .unwrap_or("")
                .trim()
                .to_string();
            return fail(
                &part,
                format!(
                    "We couldn't save the new video ({}).",
                    if last.is_empty() { e.to_string() } else { last }
                ),
            );
        }
        n += 1;
        progress((n as f64 / total * 99.0).min(99.0), stage);
    }
    drop(stdin);
    if n == 0 {
        return fail(&part, "We couldn't read any frames from this clip.".into());
    }
    let ok = enc.0.wait().map(|s| s.success()).unwrap_or(false);
    let detail = errors.join().unwrap_or_default();
    if !ok || !part.is_file() {
        let last = detail
            .lines()
            .rev()
            .find(|l| !l.trim().is_empty())
            .unwrap_or("")
            .trim();
        return fail(&part, format!("We couldn't finish the new video. ({last})"));
    }
    std::fs::rename(&part, req.out)
        .map_err(|e| format!("We couldn't save the new video ({e})."))?;
    progress(100.0, "Done");
    Ok((start, end))
}
