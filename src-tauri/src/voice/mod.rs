//! On-device voiceover and dubbing: Kokoro-82M speech, IndicTrans2 translation,
//! FFmpeg `atempo` to fit each dubbed line into its caption's time slot.

pub mod g2p;
pub mod kokoro;
pub mod models;
pub mod translate;

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{LazyLock, Mutex};

use serde::Deserialize;

use crate::tools::{self, Tool};
use kokoro::{Kokoro, SAMPLE_RATE};
use translate::Translator;

// Loaded once, kept for the session: loading the models takes a few seconds.
static TTS: LazyLock<Mutex<Option<Kokoro>>> = LazyLock::new(Default::default);
static MT: LazyLock<Mutex<HashMap<bool, Translator>>> = LazyLock::new(Default::default);

fn with_tts<R>(root: &Path, f: impl FnOnce(&mut Kokoro) -> Result<R, String>) -> Result<R, String> {
    let mut guard = TTS
        .lock()
        .map_err(|_| "The voice engine is busy. Try again.".to_string())?;
    if guard.is_none() {
        *guard = Some(Kokoro::new(&models::require(root, models::VOICE)?)?);
    }
    f(guard.as_mut().expect("loaded above"))
}

pub fn write_wav(path: &Path, samples: &[f32]) -> Result<(), String> {
    let data_len = (samples.len() * 2) as u32;
    let mut b = Vec::with_capacity(44 + data_len as usize);
    b.extend_from_slice(b"RIFF");
    b.extend_from_slice(&(36 + data_len).to_le_bytes());
    b.extend_from_slice(b"WAVEfmt ");
    b.extend_from_slice(&16u32.to_le_bytes());
    b.extend_from_slice(&1u16.to_le_bytes()); // PCM
    b.extend_from_slice(&1u16.to_le_bytes()); // mono
    b.extend_from_slice(&SAMPLE_RATE.to_le_bytes());
    b.extend_from_slice(&(SAMPLE_RATE * 2).to_le_bytes());
    b.extend_from_slice(&2u16.to_le_bytes());
    b.extend_from_slice(&16u16.to_le_bytes());
    b.extend_from_slice(b"data");
    b.extend_from_slice(&data_len.to_le_bytes());
    for s in samples {
        b.extend_from_slice(&((s.clamp(-1.0, 1.0) * 32767.0) as i16).to_le_bytes());
    }
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir).map_err(|e| format!("We couldn't save the voice ({e})."))?;
    }
    std::fs::write(path, b).map_err(|e| format!("We couldn't save the voice ({e})."))
}

fn stamp() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
}

/// Speaks `text` and saves a WAV in `cache`. Returns its path.
pub fn synthesize(
    root: &Path,
    cache: &Path,
    text: &str,
    voice: &str,
    speed: f32,
    progress: &mut dyn FnMut(f64),
) -> Result<PathBuf, String> {
    let audio = with_tts(root, |k| k.speak(text, voice, speed, progress))?;
    let path = cache.join(format!("voiceover-{}.wav", stamp()));
    write_wav(&path, &audio)?;
    Ok(path)
}

/// Translates each line. `from` may be "hinglish" (Hindi in English letters).
pub fn translate_all(
    root: &Path,
    texts: &[String],
    from: &str,
    to: &str,
    progress: &mut dyn FnMut(f64),
) -> Result<Vec<String>, String> {
    if from == to {
        return Ok(texts.to_vec());
    }
    translate::tag(from)?;
    translate::tag(to)?;
    if from != "en" && to != "en" {
        return Err("Translate between English and an Indian language (Hindi ↔ Marathi isn't supported yet).".into());
    }
    let to_english = to == "en";
    let pack = if to_english {
        models::INDIC_EN
    } else {
        models::EN_INDIC
    };
    let dir = models::require(root, pack)?;
    // Hinglish: keep English words, write the Hindi ones in Devanagari first.
    let prepared: Vec<String> = if from == "hinglish" {
        let dict = TTS
            .lock()
            .ok()
            .and_then(|g| g.as_ref().map(|k| k.dict.clone()))
            .or_else(|| {
                let v = models::installed(root, models::VOICE)?;
                g2p::EnglishDict::load(&v.join("us_gold.json"), &v.join("us_silver.json"))
                    .ok()
                    .map(std::sync::Arc::new)
            });
        texts
            .iter()
            .map(|t| g2p::hinglish_to_devanagari(t, dict.as_deref()))
            .collect()
    } else {
        texts.to_vec()
    };
    let mut guard = MT
        .lock()
        .map_err(|_| "The translator is busy. Try again.".to_string())?;
    if let std::collections::hash_map::Entry::Vacant(e) = guard.entry(to_english) {
        e.insert(Translator::new(&dir, to_english)?);
    }
    let mt = guard.get_mut(&to_english).expect("inserted above");
    let mut out = Vec::with_capacity(prepared.len());
    for (i, t) in prepared.iter().enumerate() {
        out.push(mt.translate(t, from, to)?);
        progress((i + 1) as f64 / prepared.len().max(1) as f64 * 100.0);
    }
    Ok(out)
}

#[derive(Debug, Clone, Deserialize)]
pub struct DubSegment {
    /// Timeline seconds.
    pub start: f64,
    pub end: f64,
    pub text: String,
}

/// Runs FFmpeg's `atempo` on mono 24 kHz samples (0.5..=2.0 per pass; we stay in 0.8..=1.25).
fn atempo(samples: &[f32], tempo: f64, tmp: &Path) -> Result<Vec<f32>, String> {
    write_wav(tmp, samples)?;
    let out = tools::command(Tool::Ffmpeg)
        .args(["-v", "error", "-i"])
        .arg(tmp)
        .args([
            "-filter:a",
            &format!("atempo={tempo:.4}"),
            "-f",
            "f32le",
            "-ac",
            "1",
            "-ar",
            "24000",
            "pipe:1",
        ])
        .output()
        .map_err(|_| tools::missing_message())?;
    let _ = std::fs::remove_file(tmp);
    if !out.status.success() {
        return Err(format!(
            "We couldn't fit a line into its time ({}).",
            String::from_utf8_lossy(&out.stderr).trim()
        ));
    }
    Ok(out
        .stdout
        .as_chunks::<4>()
        .0
        .iter()
        .map(|b| f32::from_le_bytes(*b))
        .collect())
}

/// Translates (unless `from == to`), speaks each segment, fits it into its slot
/// and mixes one track. The WAV starts at the first segment's `start`.
pub fn dub(
    root: &Path,
    cache: &Path,
    segments: &[DubSegment],
    from: &str,
    to: &str,
    voice: &str,
    progress: &mut dyn FnMut(f64, &str),
) -> Result<PathBuf, String> {
    let mut segs: Vec<DubSegment> = segments
        .iter()
        .filter(|s| s.end > s.start && !s.text.trim().is_empty())
        .cloned()
        .collect();
    if segs.is_empty() {
        return Err("Write captions first: dubbing follows your caption lines.".into());
    }
    segs.sort_by(|a, b| a.start.total_cmp(&b.start));
    let texts: Vec<String> = segs.iter().map(|s| s.text.clone()).collect();
    let texts = if from == to {
        texts
    } else {
        translate_all(root, &texts, from, to, &mut |p| {
            progress(p * 0.3, "translating")
        })?
    };

    let sr = f64::from(SAMPLE_RATE);
    let t0 = segs[0].start;
    let total_end = segs.iter().map(|s| s.end).fold(0.0, f64::max);
    let mut mix = vec![0f32; ((total_end - t0 + 2.0) * sr) as usize];
    let tmp = cache.join(format!("dub-line-{}.wav", stamp()));
    let n = segs.len();
    for (i, (seg, text)) in segs.iter().zip(&texts).enumerate() {
        let mut speech = with_tts(root, |k| k.speak(text, voice, 1.0, &mut |_| {}))?;
        let slot = seg.end - seg.start;
        // A line may run into the silence before the next one, never over it.
        let room = segs
            .get(i + 1)
            .map_or(slot + 1.0, |next| next.start - seg.start)
            .max(slot);
        let ratio = speech.len() as f64 / sr / slot;
        if (0.8..=1.25).contains(&ratio) {
            speech = atempo(&speech, ratio, &tmp)?;
        } else if ratio > 1.25 {
            speech = atempo(&speech, 1.25, &tmp)?;
        } // shorter than 0.8 of the slot: keep natural speed, the rest is silence.
        let max = (room * sr) as usize;
        if speech.len() > max {
            speech.truncate(max);
            let fade = speech.len().min((0.04 * sr) as usize);
            let len = speech.len();
            for (k, s) in speech[len - fade..].iter_mut().enumerate() {
                *s *= 1.0 - k as f32 / fade as f32;
            }
        }
        let at = ((seg.start - t0) * sr) as usize;
        for (k, s) in speech.iter().enumerate() {
            if let Some(m) = mix.get_mut(at + k) {
                *m = (*m + s).clamp(-1.0, 1.0);
            }
        }
        progress(30.0 + (i + 1) as f64 / n as f64 * 70.0, "speaking");
    }
    let path = cache.join(format!("dub-{to}-{}.wav", stamp()));
    write_wav(&path, &mix)?;
    Ok(path)
}
