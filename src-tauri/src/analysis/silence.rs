//! Pause detection: RMS loudness per 10 ms, threshold set from the clip's own
//! noise floor and speech level, then runs longer than `min_silence`.

use serde::{Deserialize, Serialize};

use super::{frame_db, percentile};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct SilenceOptions {
    /// Fixed threshold in dBFS. `None` = automatic from the noise floor.
    pub threshold_db: Option<f32>,
    /// Shortest pause worth removing, seconds.
    pub min_silence: f64,
    /// Breathing room kept on each side of a cut, seconds.
    pub padding: f64,
    /// Where the auto threshold sits between noise floor (0) and speech (1).
    pub strength: f32,
}

impl Default for SilenceOptions {
    fn default() -> Self {
        Self {
            threshold_db: None,
            min_silence: 0.45,
            padding: 0.1,
            strength: 0.3,
        }
    }
}

#[derive(Serialize, Clone, Copy)]
pub struct Span {
    pub start: f64,
    pub end: f64,
}

const FRAME_SEC: f64 = 0.01;
/// Loud blips (clicks, lip smacks) up to this many frames don't break a pause.
const BLIP_FRAMES: usize = 3;

/// Pauses in `samples`, as source-file seconds (`offset` = where samples begin).
pub fn detect(samples: &[f32], rate: u32, offset: f64, o: &SilenceOptions) -> Vec<Span> {
    let hop = (rate as f64 * FRAME_SEC) as usize;
    let db = frame_db(samples, hop);
    let floor = percentile(&db, 0.1);
    let speech = percentile(&db, 0.95);
    let thr = match o.threshold_db {
        Some(t) => t,
        // Flat level (music, room tone only): nothing reads as a pause.
        None if speech - floor < 8.0 => return vec![],
        None => floor + o.strength.clamp(0.05, 0.9) * (speech - floor),
    };

    let mut silent: Vec<bool> = db.iter().map(|&d| d < thr).collect();
    // Fill short loud blips that sit between quiet frames.
    let mut i = 0;
    while i < silent.len() {
        if silent[i] {
            i += 1;
            continue;
        }
        let run_start = i;
        while i < silent.len() && !silent[i] {
            i += 1;
        }
        if run_start > 0 && i < silent.len() && i - run_start <= BLIP_FRAMES {
            silent[run_start..i].iter_mut().for_each(|s| *s = true);
        }
    }

    let min_frames = (o.min_silence / FRAME_SEC).ceil() as usize;
    let mut spans = Vec::new();
    let mut i = 0;
    while i < silent.len() {
        if !silent[i] {
            i += 1;
            continue;
        }
        let s = i;
        while i < silent.len() && silent[i] {
            i += 1;
        }
        if i - s >= min_frames {
            let start = offset + s as f64 * FRAME_SEC + o.padding;
            let end = offset + i as f64 * FRAME_SEC - o.padding;
            if end - start >= 0.05 {
                spans.push(Span { start, end });
            }
        }
    }
    spans
}
