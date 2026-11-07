//! Beat tracking: log-magnitude spectral flux on an STFT (rustfft), an
//! adaptive local-mean threshold, tempo by autocorrelation of the onset
//! envelope (weighted towards 120 BPM), then dynamic-programming beat
//! placement (Ellis 2007).

use rustfft::{FftPlanner, num_complex::Complex};
use serde::{Deserialize, Serialize};

pub const RATE: u32 = 22_050;
const N: usize = 1024;
const HOP: usize = 512;

#[derive(Serialize, Deserialize, Clone)]
pub struct Beats {
    pub bpm: f64,
    /// Source-file seconds.
    pub beats: Vec<f64>,
}

pub fn detect(samples: &[f32], mut progress: impl FnMut(f64)) -> Beats {
    let fps = RATE as f64 / HOP as f64;
    let env = onset_envelope(samples, &mut progress);
    if env.len() < (fps * 4.0) as usize {
        return Beats {
            bpm: 0.0,
            beats: vec![],
        };
    }
    let period = tempo_period(&env, fps);
    let bpm = 60.0 * fps / period;
    let beats = track(&env, period)
        .into_iter()
        .map(|i| i as f64 / fps)
        .collect();
    Beats {
        bpm: (bpm * 10.0).round() / 10.0,
        beats,
    }
}

fn onset_envelope(samples: &[f32], progress: &mut impl FnMut(f64)) -> Vec<f32> {
    let fft = FftPlanner::<f32>::new().plan_fft_forward(N);
    let window: Vec<f32> = (0..N)
        .map(|i| 0.5 - 0.5 * (2.0 * std::f32::consts::PI * i as f32 / N as f32).cos())
        .collect();
    let frames = samples.len().saturating_sub(N) / HOP + 1;
    let bins = N / 2;
    let mut prev = vec![0f32; bins];
    let mut flux = Vec::with_capacity(frames);
    let mut buf = vec![Complex::new(0f32, 0f32); N];
    for f in 0..frames {
        let s = &samples[f * HOP..(f * HOP + N).min(samples.len())];
        for (i, b) in buf.iter_mut().enumerate() {
            *b = Complex::new(s.get(i).copied().unwrap_or(0.0) * window[i], 0.0);
        }
        fft.process(&mut buf);
        let mut sum = 0f32;
        for k in 1..bins {
            let m = (1.0 + 100.0 * buf[k].norm()).ln();
            sum += (m - prev[k]).max(0.0);
            prev[k] = m;
        }
        flux.push(if f == 0 { 0.0 } else { sum });
        if f % 2000 == 0 {
            progress(f as f64 / frames as f64);
        }
    }
    // Adaptive threshold: subtract the local mean (±8 frames), keep the rise.
    let mut env: Vec<f32> = (0..flux.len())
        .map(|i| {
            let a = i.saturating_sub(8);
            let b = (i + 9).min(flux.len());
            let mean = flux[a..b].iter().sum::<f32>() / (b - a) as f32;
            (flux[i] - mean).max(0.0)
        })
        .collect();
    let sd = (env.iter().map(|v| v * v).sum::<f32>() / env.len().max(1) as f32).sqrt();
    if sd > 0.0 {
        env.iter_mut().for_each(|v| *v /= sd);
    }
    env
}

/// Beat period in frames, from 60..200 BPM.
fn tempo_period(env: &[f32], fps: f64) -> f64 {
    let lo = (fps * 60.0 / 200.0).floor() as usize;
    let hi = ((fps * 60.0 / 60.0).ceil() as usize).min(env.len() - 1);
    let mean = env.iter().sum::<f32>() / env.len() as f32;
    let x: Vec<f32> = env.iter().map(|v| v - mean).collect();
    let ac: Vec<f32> = (0..=hi + 1)
        .map(|lag| {
            x[..x.len() - lag]
                .iter()
                .zip(&x[lag..])
                .map(|(a, b)| a * b)
                .sum()
        })
        .collect();
    let mut best = (lo, f32::MIN);
    for (lag, &a) in ac.iter().enumerate().take(hi + 1).skip(lo) {
        let bpm = 60.0 * fps / lag as f64;
        let w = (-0.5 * ((bpm / 120.0).log2() / 0.9).powi(2)).exp() as f32;
        if a * w > best.1 {
            best = (lag, a * w);
        }
    }
    // Parabolic refinement around the peak.
    let l = best.0;
    if l > 0 && l + 1 < ac.len() {
        let (a, b, c) = (ac[l - 1], ac[l], ac[l + 1]);
        let d = a - 2.0 * b + c;
        if d.abs() > 1e-9 {
            return l as f64 + (0.5 * (a - c) / d) as f64;
        }
    }
    l as f64
}

/// Dynamic programming: each beat = onset strength + best earlier beat about
/// one period back, penalised by how far the gap strays from the period.
fn track(env: &[f32], period: f64) -> Vec<usize> {
    const TIGHTNESS: f64 = 100.0;
    let n = env.len();
    let mut score = vec![0f64; n];
    let mut back = vec![usize::MAX; n];
    for i in 0..n {
        let lo = i as f64 - 2.0 * period;
        let hi = i as f64 - period / 2.0;
        let mut best: Option<(f64, usize)> = None;
        if hi >= 1.0 {
            let window = score.iter().enumerate().take(hi as usize + 1);
            for (j, &prev) in window.skip(lo.max(0.0) as usize) {
                let pen = TIGHTNESS * ((i - j) as f64 / period).ln().powi(2);
                let s = prev - pen;
                if best.is_none_or(|b| s > b.0) {
                    best = Some((s, j));
                }
            }
        }
        score[i] = env[i] as f64;
        // A weak chain is worse than starting fresh here.
        if let Some((s, j)) = best.filter(|b| b.0 > 0.0) {
            score[i] += s;
            back[i] = j;
        }
    }
    let tail = n.saturating_sub(period.ceil() as usize);
    let mut i = (tail..n)
        .max_by(|&a, &b| score[a].total_cmp(&score[b]))
        .unwrap_or(0);
    let mut beats = vec![i];
    while back[i] != usize::MAX {
        i = back[i];
        beats.push(i);
    }
    beats.reverse();
    // Drop beats in a silent intro.
    let first = env.iter().position(|&v| v > 1.0).unwrap_or(0);
    beats.retain(|&b| b + period as usize / 2 >= first);
    beats
}
