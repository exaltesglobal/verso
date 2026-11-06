//! ONNX Runtime implementations: YuNet (faces), SFace (face matching), Silero (voice).
//!
//! ONNX Runtime is linked statically from the `ort` crate's prebuilt binaries
//! (downloaded at *build* time), so nothing is fetched at runtime. GPU execution
//! providers are opt-in cargo features: `directml` (Windows) / `coreml` (macOS).
//! If a provider can't start, ONNX Runtime quietly falls back to CPU.

use std::path::Path;
use std::sync::OnceLock;

use ort::environment::Environment;
use ort::session::Session;
use ort::value::Tensor;

use super::{Face, FaceDetector, FaceEmbedder, Frame, VoiceDetector};

fn env() -> Result<&'static Environment, String> {
    static ENV: OnceLock<Result<Environment, String>> = OnceLock::new();
    ENV.get_or_init(|| {
        ort::init()
            .with_name("verso-reframe")
            .build()
            .map_err(|e| format!("We couldn't start the on-device AI engine ({e})."))
    })
    .as_ref()
    .map_err(Clone::clone)
}

pub(crate) fn load(path: &Path) -> Result<Session, String> {
    let fail =
        |e: ort::Error| format!("We couldn't load an AI model ({e}). Try downloading it again.");
    #[allow(unused_mut)]
    let mut eps = Vec::new();
    #[cfg(feature = "directml")]
    eps.push(ort::ep::DirectML::default().build());
    #[cfg(feature = "coreml")]
    eps.push(ort::ep::CoreML::default().build());
    Session::builder(env()?)
        .map_err(fail)?
        .with_execution_providers(eps)
        .map_err(|e| fail(e.into()))?
        .commit_from_file(path)
        .map_err(fail)
}

pub(crate) fn run_err(e: ort::Error) -> String {
    format!("The AI model stopped unexpectedly ({e}).")
}

// ---------- YuNet ----------

pub struct YuNet {
    session: Session,
    /// Fixed model input size, or None when the model takes any size.
    fixed: Option<(usize, usize)>,
    pub score_threshold: f32,
    pub nms_threshold: f32,
}

impl YuNet {
    pub fn new(path: &Path) -> Result<Self, String> {
        let session = load(path)?;
        let fixed = session.inputs().first().and_then(|i| {
            let s = i.dtype().tensor_shape()?;
            let (h, w) = (*s.get(2)?, *s.get(3)?);
            (h > 0 && w > 0).then_some((w as usize, h as usize))
        });
        Ok(Self {
            session,
            fixed,
            score_threshold: 0.7,
            nms_threshold: 0.3,
        })
    }
}

impl FaceDetector for YuNet {
    fn detect(&mut self, frame: &Frame) -> Result<Vec<Face>, String> {
        let (fw, fh) = (frame.width as usize, frame.height as usize);
        // Letterbox into the model input: scale to fit, pad right/bottom.
        let (iw, ih) = self
            .fixed
            .unwrap_or((fw.div_ceil(32) * 32, fh.div_ceil(32) * 32));
        let scale = (iw as f32 / fw as f32).min(ih as f32 / fh as f32).min(1.0);
        let (sw, sh) = ((fw as f32 * scale) as usize, (fh as f32 * scale) as usize);
        let mut input = vec![0f32; 3 * iw * ih];
        for y in 0..sh {
            for x in 0..sw {
                let (sx, sy) = (x as f32 / scale, y as f32 / scale);
                for c in 0..3 {
                    // Model wants BGR, 0..255.
                    input[c * iw * ih + y * iw + x] = frame.sample(sx, sy, 2 - c);
                }
            }
        }
        let tensor = Tensor::from_array(([1usize, 3, ih, iw], input)).map_err(run_err)?;
        let outputs = self.session.run(ort::inputs![tensor]).map_err(run_err)?;

        let mut faces = Vec::new();
        for stride in [8usize, 16, 32] {
            let get = |name: &str| -> Result<Vec<f32>, String> {
                let key = format!("{name}_{stride}");
                let v = outputs
                    .get(key.as_str())
                    .ok_or_else(|| format!("The face finder model is missing output {key}."))?;
                Ok(v.try_extract_tensor::<f32>().map_err(run_err)?.1.to_vec())
            };
            let (cls, obj, bbox, kps) = (get("cls")?, get("obj")?, get("bbox")?, get("kps")?);
            let cols = iw / stride;
            for (idx, (&c, &o)) in cls.iter().zip(&obj).enumerate() {
                let score = (c.clamp(0.0, 1.0) * o.clamp(0.0, 1.0)).sqrt();
                if score < self.score_threshold {
                    continue;
                }
                let (r, col) = ((idx / cols) as f32, (idx % cols) as f32);
                let s = stride as f32;
                let cx = (col + bbox[idx * 4]) * s;
                let cy = (r + bbox[idx * 4 + 1]) * s;
                let w = bbox[idx * 4 + 2].exp() * s;
                let h = bbox[idx * 4 + 3].exp() * s;
                let mut landmarks = [[0f32; 2]; 5];
                for (n, lm) in landmarks.iter_mut().enumerate() {
                    lm[0] = (kps[idx * 10 + 2 * n] + col) * s / scale;
                    lm[1] = (kps[idx * 10 + 2 * n + 1] + r) * s / scale;
                }
                faces.push(Face {
                    x: (cx - w / 2.0) / scale,
                    y: (cy - h / 2.0) / scale,
                    w: w / scale,
                    h: h / scale,
                    score,
                    landmarks,
                });
            }
        }
        Ok(nms(faces, self.nms_threshold))
    }
}

fn nms(mut faces: Vec<Face>, threshold: f32) -> Vec<Face> {
    faces.sort_by(|a, b| b.score.total_cmp(&a.score));
    let mut keep: Vec<Face> = Vec::new();
    for f in faces {
        let overlaps = keep.iter().any(|k| {
            let ix = (f.x + f.w).min(k.x + k.w) - f.x.max(k.x);
            let iy = (f.y + f.h).min(k.y + k.h) - f.y.max(k.y);
            if ix <= 0.0 || iy <= 0.0 {
                return false;
            }
            let inter = ix * iy;
            inter / (f.w * f.h + k.w * k.h - inter) > threshold
        });
        if !overlaps {
            keep.push(f);
        }
    }
    keep
}

// ---------- SFace ----------

pub struct SFace {
    session: Session,
}

impl SFace {
    pub fn new(path: &Path) -> Result<Self, String> {
        Ok(Self {
            session: load(path)?,
        })
    }
}

/// ArcFace 112x112 landmark template (same order as YuNet's landmarks).
const TEMPLATE: [[f32; 2]; 5] = [
    [38.2946, 51.6963],
    [73.5318, 51.5014],
    [56.0252, 71.7366],
    [41.5493, 92.3655],
    [70.7299, 92.2041],
];

impl FaceEmbedder for SFace {
    fn embed(&mut self, frame: &Frame, face: &Face) -> Result<Vec<f32>, String> {
        // Least-squares similarity transform: landmarks -> template.
        let mean = |p: &[[f32; 2]; 5]| {
            let (sx, sy) = p.iter().fold((0.0, 0.0), |a, q| (a.0 + q[0], a.1 + q[1]));
            (sx / 5.0, sy / 5.0)
        };
        let (ms, md) = (mean(&face.landmarks), mean(&TEMPLATE));
        let (mut num_a, mut num_b, mut den) = (0f32, 0f32, 0f32);
        for (s, d) in face.landmarks.iter().zip(&TEMPLATE) {
            let (sx, sy) = (s[0] - ms.0, s[1] - ms.1);
            let (dx, dy) = (d[0] - md.0, d[1] - md.1);
            num_a += sx * dx + sy * dy;
            num_b += sx * dy - sy * dx;
            den += sx * sx + sy * sy;
        }
        let (a, b) = (num_a / den.max(1e-6), num_b / den.max(1e-6));
        let norm = (a * a + b * b).max(1e-9);
        let mut input = vec![0f32; 3 * 112 * 112];
        for v in 0..112 {
            for u in 0..112 {
                // Inverse map template pixel -> frame pixel.
                let (dx, dy) = (u as f32 - md.0, v as f32 - md.1);
                let sx = (a * dx + b * dy) / norm + ms.0;
                let sy = (-b * dx + a * dy) / norm + ms.1;
                for c in 0..3 {
                    input[c * 112 * 112 + v * 112 + u] = frame.sample(sx, sy, c);
                }
            }
        }
        let tensor = Tensor::from_array(([1usize, 3, 112, 112], input)).map_err(run_err)?;
        let outputs = self.session.run(ort::inputs![tensor]).map_err(run_err)?;
        let mut e = outputs[0]
            .try_extract_tensor::<f32>()
            .map_err(run_err)?
            .1
            .to_vec();
        let n = e.iter().map(|x| x * x).sum::<f32>().sqrt().max(1e-9);
        e.iter_mut().for_each(|x| *x /= n);
        Ok(e)
    }
}

// ---------- Silero VAD (v5) ----------

pub struct Silero {
    session: Session,
    state: Vec<f32>,
    context: Vec<f32>,
}

const SILERO_CHUNK: usize = 512;
const SILERO_CONTEXT: usize = 64;

impl Silero {
    pub fn new(path: &Path) -> Result<Self, String> {
        Ok(Self {
            session: load(path)?,
            state: vec![0.0; 2 * 128],
            context: vec![0.0; SILERO_CONTEXT],
        })
    }
}

impl VoiceDetector for Silero {
    fn chunk(&self) -> usize {
        SILERO_CHUNK
    }

    fn speech_prob(&mut self, samples: &[f32]) -> Result<f32, String> {
        let mut x = Vec::with_capacity(SILERO_CONTEXT + SILERO_CHUNK);
        x.extend_from_slice(&self.context);
        x.extend_from_slice(samples);
        x.resize(SILERO_CONTEXT + SILERO_CHUNK, 0.0);
        self.context.copy_from_slice(&x[x.len() - SILERO_CONTEXT..]);
        let input = Tensor::from_array(([1usize, x.len()], x)).map_err(run_err)?;
        let state = Tensor::from_array(([2usize, 1, 128], self.state.clone())).map_err(run_err)?;
        let sr = Tensor::from_array(([0usize; 0], vec![16000i64])).map_err(run_err)?;
        let outputs = self
            .session
            .run(ort::inputs!["input" => input, "state" => state, "sr" => sr])
            .map_err(run_err)?;
        let prob = outputs["output"]
            .try_extract_tensor::<f32>()
            .map_err(run_err)?
            .1[0];
        self.state = outputs["stateN"]
            .try_extract_tensor::<f32>()
            .map_err(run_err)?
            .1
            .to_vec();
        Ok(prob)
    }
}

/// Fallback when the voice model isn't installed: loudness above the noise floor.
pub struct EnergyVad {
    floor: f32,
}

impl EnergyVad {
    pub fn new() -> Self {
        Self { floor: 1e-3 }
    }
}

impl VoiceDetector for EnergyVad {
    fn chunk(&self) -> usize {
        SILERO_CHUNK
    }
    fn speech_prob(&mut self, samples: &[f32]) -> Result<f32, String> {
        let rms = (samples.iter().map(|s| s * s).sum::<f32>() / samples.len().max(1) as f32).sqrt();
        // Slowly track the quietest level as the noise floor.
        self.floor = if rms < self.floor {
            rms.max(1e-4)
        } else {
            self.floor * 1.001
        };
        Ok(((rms / (self.floor * 4.0)) - 0.5).clamp(0.0, 1.0))
    }
}
