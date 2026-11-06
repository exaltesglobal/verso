//! Smart vertical reframing: find faces, work out who is talking, and plan a
//! smooth crop path for 9:16 / 1:1 / 16:9 output.
//!
//! Everything runs on-device. Models are downloaded once by [`models`] and run
//! with ONNX Runtime ([`onnx`]). The planner ([`planner`]) is pure Rust and only
//! needs a [`ReframeAnalysis`], so it works the same with any detector.
//!
//! All times are in **source-file seconds** (same clock as a clip's `inPoint`).
//! All rects are **normalised** to the source frame (0..1).

pub mod analyze;
pub mod models;
pub mod onnx;
pub mod planner;
pub mod tracker;

use serde::{Deserialize, Serialize};

/// Normalised rectangle (0..1 of the source frame).
#[derive(Debug, Clone, Copy, PartialEq, Default, Serialize, Deserialize)]
pub struct Rect {
    pub x: f64,
    pub y: f64,
    pub w: f64,
    pub h: f64,
}

impl Rect {
    pub fn cx(&self) -> f64 {
        self.x + self.w / 2.0
    }
    pub fn cy(&self) -> f64 {
        self.y + self.h / 2.0
    }
    pub fn area(&self) -> f64 {
        self.w.max(0.0) * self.h.max(0.0)
    }
    pub fn iou(&self, o: &Rect) -> f64 {
        let ix = (self.x + self.w).min(o.x + o.w) - self.x.max(o.x);
        let iy = (self.y + self.h).min(o.y + o.h) - self.y.max(o.y);
        if ix <= 0.0 || iy <= 0.0 {
            return 0.0;
        }
        let inter = ix * iy;
        inter / (self.area() + o.area() - inter)
    }
}

/// One decoded RGB24 frame.
pub struct Frame {
    pub width: u32,
    pub height: u32,
    pub rgb: Vec<u8>,
}

impl Frame {
    /// Bilinear sample of channel `c` at pixel coords (clamped to the frame).
    pub fn sample(&self, x: f32, y: f32, c: usize) -> f32 {
        let w = self.width as i32;
        let h = self.height as i32;
        let x = x.clamp(0.0, (w - 1) as f32);
        let y = y.clamp(0.0, (h - 1) as f32);
        let (x0, y0) = (x.floor() as i32, y.floor() as i32);
        let (x1, y1) = ((x0 + 1).min(w - 1), (y0 + 1).min(h - 1));
        let (fx, fy) = (x - x0 as f32, y - y0 as f32);
        let px = |xx: i32, yy: i32| self.rgb[((yy * w + xx) * 3) as usize + c] as f32;
        let top = px(x0, y0) * (1.0 - fx) + px(x1, y0) * fx;
        let bot = px(x0, y1) * (1.0 - fx) + px(x1, y1) * fx;
        top * (1.0 - fy) + bot * fy
    }

    pub fn gray(&self, x: f32, y: f32) -> f32 {
        0.299 * self.sample(x, y, 0) + 0.587 * self.sample(x, y, 1) + 0.114 * self.sample(x, y, 2)
    }
}

/// A detected face in frame pixels.
#[derive(Debug, Clone)]
pub struct Face {
    pub x: f32,
    pub y: f32,
    pub w: f32,
    pub h: f32,
    pub score: f32,
    /// Right eye, left eye, nose tip, right mouth corner, left mouth corner
    /// (subject's right = image left), in frame pixels.
    pub landmarks: [[f32; 2]; 5],
}

/// Face detectors plug in here (YuNet today; anything else later).
pub trait FaceDetector: Send {
    fn detect(&mut self, frame: &Frame) -> Result<Vec<Face>, String>;
}

/// Face embedding for re-identification across cuts (SFace today).
pub trait FaceEmbedder: Send {
    fn embed(&mut self, frame: &Frame, face: &Face) -> Result<Vec<f32>, String>;
}

/// Voice activity: probability of speech per fixed-size chunk of 16 kHz audio.
pub trait VoiceDetector: Send {
    /// Samples per call to [`VoiceDetector::speech_prob`].
    fn chunk(&self) -> usize;
    fn speech_prob(&mut self, samples: &[f32]) -> Result<f32, String>;
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Speaker {
    pub id: u32,
    pub label: String,
    pub thumbnail_path: Option<String>,
    pub talk_time_sec: f64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrackBox {
    pub t: f64,
    pub x: f64,
    pub y: f64,
    pub w: f64,
    pub h: f64,
    pub score: f32,
}

impl TrackBox {
    pub fn rect(&self) -> Rect {
        Rect {
            x: self.x,
            y: self.y,
            w: self.w,
            h: self.h,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FaceTrack {
    pub id: u32,
    pub speaker_id: u32,
    pub boxes: Vec<TrackBox>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpeechSegment {
    pub start: f64,
    pub end: f64,
    /// `None` when the voice couldn't be matched to a face (e.g. off screen).
    pub speaker_id: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReframeAnalysis {
    pub analysis_id: String,
    pub source_path: String,
    pub source_width: u32,
    pub source_height: u32,
    pub in_point: f64,
    pub out_point: f64,
    pub sample_fps: f64,
    pub speakers: Vec<Speaker>,
    pub face_tracks: Vec<FaceTrack>,
    pub speech_segments: Vec<SpeechSegment>,
    /// Which models produced this, e.g. `["face_yunet", "vad_silero"]`.
    pub models: Vec<String>,
}
