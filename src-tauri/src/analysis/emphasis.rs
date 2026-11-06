//! Emphasis moments: loudness peaks well above the rolling median, boosted
//! when the voice pitch also jumps above the speaker's usual pitch.

use serde::Serialize;

use super::{frame_db, percentile};

#[derive(Serialize)]
pub struct Moment {
    /// Source-file seconds.
    pub t: f64,
    /// 0..1, how big the moment is.
    pub strength: f32,
}

const FRAME_SEC: f64 = 0.01;
const MEDIAN_WINDOW: usize = 300; // 3 s
const PEAK_RADIUS: usize = 40; // a peak must be the loudest within ±0.4 s
const MIN_GAP_SEC: f64 = 1.5;
const MIN_SCORE: f32 = 6.0; // dB above the rolling median

pub fn detect(samples: &[f32], rate: u32, offset: f64) -> Vec<Moment> {
    let hop = (rate as f64 * FRAME_SEC) as usize;
    let db = frame_db(samples, hop);
    if db.len() < PEAK_RADIUS * 2 {
        return vec![];
    }
    // 50 ms moving average smooths syllable flicker.
    let sm: Vec<f32> = (0..db.len())
        .map(|i| {
            let a = i.saturating_sub(2);
            let b = (i + 3).min(db.len());
            db[a..b].iter().sum::<f32>() / (b - a) as f32
        })
        .collect();
    // Rolling median, sampled every 10 frames and held (cheap and plenty).
    let mut med = vec![0f32; sm.len()];
    for i in (0..sm.len()).step_by(10) {
        let a = i.saturating_sub(MEDIAN_WINDOW / 2);
        let b = (i + MEDIAN_WINDOW / 2).min(sm.len());
        let m = percentile(&sm[a..b], 0.5);
        med[i..(i + 10).min(sm.len())]
            .iter_mut()
            .for_each(|x| *x = m);
    }
    let floor = percentile(&sm, 0.1);
    let usual_pitch = {
        let pitches: Vec<f32> = (0..sm.len())
            .step_by(25)
            .filter(|&i| sm[i] > floor + 10.0)
            .filter_map(|i| pitch_at(samples, rate, i * hop))
            .collect();
        (pitches.len() >= 4).then(|| percentile(&pitches, 0.5))
    };

    let mut cands: Vec<(usize, f32)> = Vec::new();
    for i in PEAK_RADIUS..sm.len() - PEAK_RADIUS {
        let excess = sm[i] - med[i];
        if excess < MIN_SCORE * 0.7 || sm[i] < floor + 10.0 {
            continue;
        }
        let window = &sm[i - PEAK_RADIUS..=i + PEAK_RADIUS];
        if window.iter().any(|&v| v > sm[i]) {
            continue;
        }
        let bonus = match (usual_pitch, pitch_at(samples, rate, i * hop)) {
            (Some(u), Some(p)) if p > u * 1.2 => 3.0,
            _ => 0.0,
        };
        let score = excess + bonus;
        if score >= MIN_SCORE {
            cands.push((i, score));
        }
    }

    // Strongest first, then keep moments at least MIN_GAP_SEC apart.
    cands.sort_by(|a, b| b.1.total_cmp(&a.1));
    let gap = (MIN_GAP_SEC / FRAME_SEC) as usize;
    let mut kept: Vec<(usize, f32)> = Vec::new();
    for c in cands {
        if kept.iter().all(|k| k.0.abs_diff(c.0) >= gap) {
            kept.push(c);
        }
    }
    kept.sort_by_key(|k| k.0);
    kept.into_iter()
        .map(|(i, s)| Moment {
            t: offset + i as f64 * FRAME_SEC,
            strength: (0.3 + (s - MIN_SCORE) / 12.0).clamp(0.3, 1.0),
        })
        .collect()
}

/// Voice pitch (Hz) of the 40 ms around `at` by normalised autocorrelation.
fn pitch_at(samples: &[f32], rate: u32, at: usize) -> Option<f32> {
    let n = (rate as f64 * 0.04) as usize;
    let a = at.saturating_sub(n / 2);
    let frame = samples.get(a..(a + n).min(samples.len()))?;
    let (min_lag, max_lag) = ((rate / 400) as usize, (rate / 70) as usize);
    if frame.len() <= max_lag * 2 {
        return None;
    }
    let energy: f32 = frame.iter().map(|s| s * s).sum();
    if energy <= 1e-6 {
        return None;
    }
    let mut best = (0usize, 0f32);
    for lag in min_lag..=max_lag {
        let r: f32 = frame[..frame.len() - lag]
            .iter()
            .zip(&frame[lag..])
            .map(|(x, y)| x * y)
            .sum::<f32>()
            / energy;
        if r > best.1 {
            best = (lag, r);
        }
    }
    (best.1 > 0.5).then(|| rate as f32 / best.0 as f32)
}
