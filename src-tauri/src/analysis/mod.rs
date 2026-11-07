//! On-device audio analysis for the smart tools: pauses, emphasis moments and
//! beats. The bundled ffmpeg decodes to mono f32 PCM on a pipe; all DSP is our
//! own code (plus `rustfft`, MIT/Apache), so nothing here is GPL/AGPL.

pub mod beats;
pub mod emphasis;
pub mod silence;

use std::io::{ErrorKind, Read};
use std::path::Path;
use std::process::Stdio;

use crate::tools::{self, Tool};

/// Decodes `[start, end)` seconds of the file's audio to mono f32 at `rate`.
/// `progress` gets 0..1 when the length is known.
pub fn decode(
    path: &Path,
    start: f64,
    end: Option<f64>,
    rate: u32,
    mut progress: impl FnMut(f64),
) -> Result<Vec<f32>, String> {
    let mut cmd = tools::command(Tool::Ffmpeg);
    cmd.args(["-hide_banner", "-loglevel", "error"]);
    if start > 0.0 {
        cmd.args(["-ss", &format!("{start:.3}")]);
    }
    if let Some(e) = end {
        cmd.args(["-t", &format!("{:.3}", (e - start).max(0.01))]);
    }
    let mut child = cmd
        .arg("-i")
        .arg(path)
        .args([
            "-vn",
            "-ac",
            "1",
            "-ar",
            &rate.to_string(),
            "-f",
            "f32le",
            "pipe:1",
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| match e.kind() {
            ErrorKind::NotFound => tools::missing_message(),
            _ => format!("We couldn't read the sound ({e})."),
        })?;

    let expected = end.map(|e| ((e - start).max(0.01) * rate as f64) as usize);
    let mut out = child.stdout.take().ok_or("No audio output.")?;
    let mut samples = Vec::with_capacity(expected.unwrap_or(0) + 1024);
    let mut buf = vec![0u8; 64 * 1024];
    let mut carry: Vec<u8> = Vec::with_capacity(4);
    let mut last_report = 0usize;
    loop {
        let n = out
            .read(&mut buf)
            .map_err(|e| format!("We couldn't read the sound ({e})."))?;
        if n == 0 {
            break;
        }
        let mut chunk = &buf[..n];
        if !carry.is_empty() {
            let need = 4 - carry.len();
            let take = need.min(chunk.len());
            carry.extend_from_slice(&chunk[..take]);
            chunk = &chunk[take..];
            if carry.len() == 4 {
                samples.push(f32::from_le_bytes([carry[0], carry[1], carry[2], carry[3]]));
                carry.clear();
            }
        }
        let (whole, rest) = chunk.as_chunks::<4>();
        samples.extend(whole.iter().map(|b| f32::from_le_bytes(*b)));
        carry.extend_from_slice(rest);
        if let Some(total) = expected
            && samples.len() - last_report > rate as usize
        {
            last_report = samples.len();
            progress((samples.len() as f64 / total as f64).min(1.0));
        }
    }
    let _ = child.wait();
    if samples.is_empty() {
        return Err("This clip has no sound we can listen to.".into());
    }
    Ok(samples)
}

/// Loudness in dB of each `hop`-sample frame (RMS).
pub fn frame_db(samples: &[f32], hop: usize) -> Vec<f32> {
    samples
        .chunks(hop)
        .map(|f| {
            let ms = f.iter().map(|s| s * s).sum::<f32>() / f.len() as f32;
            10.0 * (ms + 1e-10).log10()
        })
        .collect()
}

/// The `p`-th percentile (0..1) of `v`.
pub fn percentile(v: &[f32], p: f32) -> f32 {
    if v.is_empty() {
        return 0.0;
    }
    let mut s = v.to_vec();
    s.sort_by(|a, b| a.total_cmp(b));
    s[((s.len() - 1) as f32 * p.clamp(0.0, 1.0)).round() as usize]
}
