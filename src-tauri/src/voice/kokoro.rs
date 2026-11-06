//! Kokoro-82M (Apache-2.0) text to speech through ONNX Runtime.
//! Input: phoneme ids (max 510) + a 256-float voice style row + speed. Output: 24 kHz mono.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use ort::session::Session;
use ort::value::Tensor;

use super::g2p::{self, EnglishDict};

pub const SAMPLE_RATE: u32 = 24_000;
const MAX_TOKENS: usize = 510;
/// Chunks stay well under the limit so long sentences keep natural prosody.
const CHUNK_TOKENS: usize = 400;

/// Kokoro's phoneme vocabulary (hexgrad/Kokoro-82M config.json).
const VOCAB: &[(char, i64)] = &[
    (';', 1), (':', 2), (',', 3), ('.', 4), ('!', 5), ('?', 6), ('—', 9), ('…', 10), ('"', 11), ('(', 12),
    (')', 13), ('“', 14), ('”', 15), (' ', 16), ('\u{0303}', 17), ('ʣ', 18), ('ʥ', 19), ('ʦ', 20),
    ('ʨ', 21), ('ᵝ', 22), ('\u{AB67}', 23), ('A', 24), ('I', 25), ('O', 31), ('Q', 33), ('S', 35),
    ('T', 36), ('W', 39), ('Y', 41), ('ᵊ', 42), ('a', 43), ('b', 44), ('c', 45), ('d', 46), ('e', 47),
    ('f', 48), ('h', 50), ('i', 51), ('j', 52), ('k', 53), ('l', 54), ('m', 55), ('n', 56), ('o', 57),
    ('p', 58), ('q', 59), ('r', 60), ('s', 61), ('t', 62), ('u', 63), ('v', 64), ('w', 65), ('x', 66),
    ('y', 67), ('z', 68), ('ɑ', 69), ('ɐ', 70), ('ɒ', 71), ('æ', 72), ('β', 75), ('ɔ', 76), ('ɕ', 77),
    ('ç', 78), ('ɖ', 80), ('ð', 81), ('ʤ', 82), ('ə', 83), ('ɚ', 85), ('ɛ', 86), ('ɜ', 87), ('ɟ', 90),
    ('ɡ', 92), ('ɥ', 99), ('ɨ', 101), ('ɪ', 102), ('ʝ', 103), ('ɯ', 110), ('ɰ', 111), ('ŋ', 112),
    ('ɳ', 113), ('ɲ', 114), ('ɴ', 115), ('ø', 116), ('ɸ', 118), ('θ', 119), ('œ', 120), ('ɹ', 123),
    ('ɾ', 125), ('ɻ', 126), ('ʁ', 128), ('ɽ', 129), ('ʂ', 130), ('ʃ', 131), ('ʈ', 132), ('ʧ', 133),
    ('ʊ', 135), ('ʋ', 136), ('ʌ', 138), ('ɣ', 139), ('ɤ', 140), ('χ', 142), ('ʎ', 143), ('ʒ', 147),
    ('ʔ', 148), ('ˈ', 156), ('ˌ', 157), ('ː', 158), ('ʰ', 162), ('ʲ', 164), ('↓', 169), ('→', 171),
    ('↗', 172), ('↘', 173), ('ᵻ', 177),
];

fn token_ids(phonemes: &str) -> Vec<i64> {
    let map: HashMap<char, i64> = VOCAB.iter().copied().collect();
    phonemes.chars().filter_map(|c| map.get(&c).copied()).collect()
}

/// Sentences, split after . ! ? । and new lines.
fn sentences(text: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut cur = String::new();
    for c in text.chars() {
        cur.push(c);
        if matches!(c, '.' | '!' | '?' | '।' | '\n') {
            if !cur.trim().is_empty() {
                out.push(cur.trim().to_string());
            }
            cur.clear();
        }
    }
    if !cur.trim().is_empty() {
        out.push(cur.trim().to_string());
    }
    out
}

pub struct Kokoro {
    session: Session,
    dir: PathBuf,
    pub dict: Arc<EnglishDict>,
    voices: HashMap<String, Vec<f32>>,
}

impl Kokoro {
    pub fn new(dir: &Path) -> Result<Self, String> {
        let dict = EnglishDict::load(&dir.join("us_gold.json"), &dir.join("us_silver.json"))?;
        Ok(Self {
            session: crate::reframe::onnx::load(&dir.join("kokoro_q8.onnx"))?,
            dir: dir.to_path_buf(),
            dict: Arc::new(dict),
            voices: HashMap::new(),
        })
    }

    fn style(&mut self, voice: &str) -> Result<&Vec<f32>, String> {
        super::models::voice(voice)?;
        if !self.voices.contains_key(voice) {
            let bytes = std::fs::read(self.dir.join(format!("{voice}.bin")))
                .map_err(|e| format!("We couldn't read that voice ({e}). Try downloading the voices again."))?;
            let floats = bytes
                .chunks_exact(4)
                .map(|b| f32::from_le_bytes([b[0], b[1], b[2], b[3]]))
                .collect();
            self.voices.insert(voice.to_string(), floats);
        }
        Ok(&self.voices[voice])
    }

    /// Phoneme-id chunks for `text`, each at most CHUNK_TOKENS (or MAX_TOKENS for one long sentence).
    fn chunks(&self, text: &str) -> Vec<Vec<i64>> {
        let mut chunks: Vec<Vec<i64>> = Vec::new();
        let mut cur: Vec<i64> = Vec::new();
        for s in sentences(text) {
            let mut ids = token_ids(&g2p::phonemize(&s, &self.dict));
            if ids.is_empty() {
                continue;
            }
            if !cur.is_empty() && cur.len() + 1 + ids.len() > CHUNK_TOKENS {
                chunks.push(std::mem::take(&mut cur));
            }
            // A single very long sentence: cut at the last space before the limit.
            while ids.len() > MAX_TOKENS {
                let cut = ids[..MAX_TOKENS].iter().rposition(|&t| t == 16).filter(|&p| p > 0).unwrap_or(MAX_TOKENS);
                if !cur.is_empty() {
                    chunks.push(std::mem::take(&mut cur));
                }
                chunks.push(ids[..cut].to_vec());
                ids = ids[cut..].iter().copied().skip_while(|&t| t == 16).collect();
            }
            if !cur.is_empty() {
                cur.push(16);
            }
            cur.extend(ids);
        }
        if !cur.is_empty() {
            chunks.push(cur);
        }
        chunks
    }

    /// 24 kHz mono samples. `progress` gets 0..=100.
    pub fn speak(&mut self, text: &str, voice: &str, speed: f32, progress: &mut dyn FnMut(f64)) -> Result<Vec<f32>, String> {
        let chunks = self.chunks(text);
        if chunks.is_empty() {
            return Err("There's nothing to say. Type a few words first.".into());
        }
        let style_all = self.style(voice)?.clone();
        let rows = style_all.len() / 256;
        let mut audio = Vec::new();
        let gap = vec![0f32; (SAMPLE_RATE as f32 * 0.12) as usize];
        let run_err = |e: ort::Error| format!("The voice stopped unexpectedly ({e}).");
        for (n, ids) in chunks.iter().enumerate() {
            let row = ids.len().min(rows.saturating_sub(1));
            let style = style_all[row * 256..row * 256 + 256].to_vec();
            let mut input = Vec::with_capacity(ids.len() + 2);
            input.push(0);
            input.extend_from_slice(ids);
            input.push(0);
            let len = input.len();
            let outputs = self
                .session
                .run(ort::inputs![
                    "input_ids" => Tensor::from_array(([1usize, len], input)).map_err(run_err)?,
                    "style" => Tensor::from_array(([1usize, 256], style)).map_err(run_err)?,
                    "speed" => Tensor::from_array(([1usize], vec![speed.clamp(0.5, 2.0)])).map_err(run_err)?
                ])
                .map_err(run_err)?;
            let (_, wave) = outputs[0].try_extract_tensor::<f32>().map_err(run_err)?;
            if n > 0 {
                audio.extend_from_slice(&gap);
            }
            audio.extend_from_slice(wave);
            progress((n + 1) as f64 / chunks.len() as f64 * 100.0);
        }
        Ok(audio)
    }
}
