//! Offline auto-captions: FFmpeg PCM -> whisper.cpp -> reel-sized segments.

pub mod audio;
pub mod engine;
pub mod models;
pub mod segment;

use std::path::Path;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

use segment::{CaptionSegment, CaptionWord};

pub const CANCELLED: &str = "Captions stopped.";

/// Audio is fed to Whisper in blocks so long videos keep memory flat, report
/// steady progress and can be stopped between blocks.
/// shortcut: a word spoken across a block boundary may be split or dropped; overlap blocks if users notice.
pub const CHUNK_SECONDS: usize = 300;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Language {
    Auto,
    English,
    Hindi,
    Marathi,
    /// Hindi-English code-mixing, written in Latin script.
    Hinglish,
}

#[cfg_attr(not(feature = "whisper"), allow(dead_code))]
impl Language {
    pub fn parse(s: &str) -> Result<Self, String> {
        Ok(match s {
            "auto" | "" => Self::Auto,
            "en" => Self::English,
            "hi" => Self::Hindi,
            "mr" => Self::Marathi,
            "hinglish" => Self::Hinglish,
            _ => return Err(format!("We don't support the language \"{s}\" yet.")),
        })
    }

    /// Hinglish decodes with the English language token: that keeps Whisper in
    /// Latin script, and the romanized prompt nudges it to transliterate Hindi
    /// words ("kya baat hai") instead of translating them.
    pub fn whisper_code(self) -> &'static str {
        match self {
            Self::Auto => "auto",
            Self::English | Self::Hinglish => "en",
            Self::Hindi => "hi",
            Self::Marathi => "mr",
        }
    }

    /// Example text in the target style. Whisper copies its script and punctuation.
    pub fn prompt(self) -> Option<&'static str> {
        match self {
            Self::Hinglish => Some(
                "Hello dosto, aaj ka video bahut special hai. Kya aapko pata hai? Chalo shuru karte hain, let's go!",
            ),
            Self::Hindi => Some("नमस्ते दोस्तों, आज का वीडियो बहुत खास है। चलिए शुरू करते हैं!"),
            Self::Marathi => Some("नमस्कार मित्रांनो, आजचा व्हिडिओ खूप खास आहे. चला सुरू करूया!"),
            Self::Auto | Self::English => None,
        }
    }
}

pub type Progress = Arc<dyn Fn(f64, &'static str) + Send + Sync>;

/// Transcribes `src` between `in_point` and `out_point` (seconds). Segment times
/// are seconds in the source file.
pub fn transcribe(
    model: &Path,
    src: &Path,
    in_point: f64,
    out_point: f64,
    language: Language,
    cancel: Arc<AtomicBool>,
    progress: Progress,
) -> Result<Vec<CaptionSegment>, String> {
    progress(0.0, "loading");
    let mut engine = engine::load(model)?;
    let mut pcm = audio::PcmStream::open(src, in_point, out_point)?;
    let total = (out_point - in_point).max(1.0);
    let chunk_samples = CHUNK_SECONDS * audio::SAMPLE_RATE;
    let n_chunks = (total / CHUNK_SECONDS as f64).ceil().max(1.0);

    let mut words: Vec<CaptionWord> = Vec::new();
    let mut offset = in_point.max(0.0);
    let mut index = 0.0;
    let mut heard_any = false;
    progress(5.0, "listening");
    loop {
        if cancel.load(Ordering::Relaxed) {
            return Err(CANCELLED.into());
        }
        let chunk = pcm.next_chunk(chunk_samples)?;
        if chunk.is_empty() {
            break;
        }
        heard_any = true;
        let p = progress.clone();
        let done = index;
        let on_progress = Box::new(move |pct: i32| {
            let overall = (done + pct as f64 / 100.0) / n_chunks;
            p((5.0 + overall * 90.0).min(95.0), "listening");
        });
        let tokens = engine.transcribe(&chunk, language, on_progress, cancel.clone())?;
        for mut w in segment::words_from_tokens(&tokens) {
            w.start += offset;
            w.end += offset;
            if language == Language::Hinglish && segment::has_devanagari(&w.text) {
                w.text = segment::romanize(&w.text);
            }
            words.push(w);
        }
        offset += chunk.len() as f64 / audio::SAMPLE_RATE as f64;
        index += 1.0;
    }
    if !heard_any {
        return Err("This clip has no sound we can listen to.".into());
    }
    progress(97.0, "writing");
    Ok(segment::segment_words(&words))
}
