//! Pure FFmpeg filter builders for per-clip colour, LUTs, speed ramps and
//! freeze-frame stills. Nothing here runs FFmpeg.
//!
//! The LGPL FFmpeg build has no `eq` (GPL), so brightness/contrast use
//! `lutrgb` with the same maths as the CSS preview:
//! `out = ((in * B) - 128) * C + 128`, B = 1 + brightness/2, C = 1 + contrast/2.
//! Saturation is `hue=s`, vibrance `vibrance`, temperature `colortemperature`,
//! tint `colorbalance`, LUTs `lut3d` (blended when strength < 1).

use serde::Deserialize;

/// Mirrors `Clip.color` in src/lib/project.ts. Sliders are -1..1, 0 = unchanged.
#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct ClipColor {
    pub brightness: f64,
    pub contrast: f64,
    pub saturation: f64,
    pub temperature: f64,
    pub tint: f64,
    pub vibrance: f64,
    /// Path to a `.cube` file.
    pub lut: Option<String>,
    /// 0..1
    pub lut_strength: f64,
    pub preset: Option<String>,
}

impl Default for ClipColor {
    fn default() -> Self {
        Self {
            brightness: 0.0,
            contrast: 0.0,
            saturation: 0.0,
            temperature: 0.0,
            tint: 0.0,
            vibrance: 0.0,
            lut: None,
            lut_strength: 1.0,
            preset: None,
        }
    }
}

/// Mirrors `Clip.speedRamp`: `t` is 0..1 across the clip's source span.
#[derive(Debug, Clone, Copy, Deserialize, PartialEq)]
pub struct RampKey {
    pub t: f64,
    pub speed: f64,
}

/// Same escaping as `export::esc` (private there): option level, then graph level.
fn esc(s: &str) -> String {
    let mut lvl1 = String::with_capacity(s.len());
    for ch in s.chars() {
        if matches!(ch, '\\' | '\'' | ':') {
            lvl1.push('\\');
        }
        lvl1.push(ch);
    }
    let mut out = String::with_capacity(lvl1.len());
    for ch in lvl1.chars() {
        if matches!(ch, '\\' | '\'' | '[' | ']' | ',' | ';') {
            out.push('\\');
        }
        out.push(ch);
    }
    out
}

fn n(x: f64) -> String {
    let s = format!("{x:.4}");
    let s = s.trim_end_matches('0').trim_end_matches('.');
    if s.is_empty() || s == "-" {
        "0".into()
    } else {
        s.into()
    }
}

const EPS: f64 = 0.005;

/// Linear chain for the sliders (no LUT), or None when nothing changes.
pub fn color_chain(c: &ClipColor) -> Option<String> {
    let k = |x: f64| x.clamp(-1.0, 1.0);
    let mut f = Vec::new();
    let (b, ct) = (k(c.brightness), k(c.contrast));
    if b.abs() > EPS || ct.abs() > EPS {
        // lutrgb clips results to 0..255 itself; no commas keeps it graph-safe.
        let e = format!("(val*{}-128)*{}+128", n(1.0 + b / 2.0), n(1.0 + ct / 2.0));
        f.push(format!("lutrgb=r={e}:g={e}:b={e}"));
    }
    if k(c.saturation).abs() > EPS {
        f.push(format!("hue=s={}", n(1.0 + k(c.saturation))));
    }
    if k(c.vibrance).abs() > EPS {
        f.push(format!("vibrance=intensity={}", n(k(c.vibrance))));
    }
    let t = k(c.temperature);
    if t.abs() > EPS {
        // Warm (t > 0) lowers the light's kelvin: 6500 K -> 3500 K; cool -> 11500 K.
        let kelvin = if t > 0.0 {
            6500.0 - t * 3000.0
        } else {
            6500.0 - t * 5000.0
        };
        f.push(format!("colortemperature=temperature={}", kelvin.round()));
    }
    if k(c.tint).abs() > EPS {
        // Positive tint = magenta (less green in the midtones).
        f.push(format!("colorbalance=gm={}", n(-k(c.tint) * 0.3)));
    }
    (!f.is_empty()).then(|| f.join(","))
}

/// Full graph fragment `[input]...[output]` for a clip's colour and LUT.
/// `prefix` keeps internal labels unique per clip (e.g. "c3").
pub fn color_graph(c: &ClipColor, input: &str, output: &str, prefix: &str) -> String {
    let chain = color_chain(c).unwrap_or_else(|| "null".into());
    let s = c.lut_strength.clamp(0.0, 1.0);
    match c.lut.as_deref().filter(|p| !p.is_empty() && s > EPS) {
        None => format!("[{input}]{chain}[{output}]"),
        Some(path) => {
            let lut = format!("lut3d=file={}:interp=tetrahedral", esc(path));
            if s >= 1.0 - EPS {
                format!("[{input}]{chain},{lut}[{output}]")
            } else {
                format!(
                    "[{input}]{chain},format=gbrp,split[{prefix}a][{prefix}b];[{prefix}b]{lut},format=gbrp[{prefix}l];[{prefix}a][{prefix}l]blend=all_expr=A*{}+B*{}[{output}]",
                    n(1.0 - s),
                    n(s)
                )
            }
        }
    }
}

/// Speed at `u` (0..1), linear between keys, clamped to 0.1..10x.
pub fn ramp_speed_at(keys: &[RampKey], u: f64) -> f64 {
    let s = match keys {
        [] => 1.0,
        [k] => k.speed,
        _ => {
            let i = keys.iter().position(|k| k.t > u).unwrap_or(keys.len());
            if i == 0 {
                keys[0].speed
            } else if i == keys.len() {
                keys[i - 1].speed
            } else {
                let (a, b) = (keys[i - 1], keys[i]);
                let f = ((u - a.t) / (b.t - a.t).max(1e-9)).clamp(0.0, 1.0);
                a.speed + (b.speed - a.speed) * f
            }
        }
    };
    s.clamp(0.1, 10.0)
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct RampSegment {
    /// Seconds from the clip's in point, in the source.
    pub src_start: f64,
    pub src_end: f64,
    /// Constant speed for this piece (keeps the total length exact).
    pub speed: f64,
}

/// Splits the clip's source span into `pieces` equal parts. Each part's speed
/// is its harmonic mean, so the summed output length equals the integral of
/// 1/speed (what the timeline helper in src/lib/speed.ts shows).
pub fn ramp_segments(keys: &[RampKey], source_span: f64, pieces: usize) -> Vec<RampSegment> {
    let pieces = pieces.max(1);
    const STEPS: usize = 16;
    (0..pieces)
        .map(|i| {
            let (u0, u1) = (i as f64 / pieces as f64, (i + 1) as f64 / pieces as f64);
            let inv: f64 = (0..STEPS)
                .map(|j| {
                    1.0 / ramp_speed_at(keys, u0 + (u1 - u0) * (j as f64 + 0.5) / STEPS as f64)
                })
                .sum::<f64>()
                / STEPS as f64;
            RampSegment {
                src_start: u0 * source_span,
                src_end: u1 * source_span,
                speed: 1.0 / inv,
            }
        })
        .collect()
}

/// Output length of the segments, in seconds.
pub fn ramp_duration(segs: &[RampSegment]) -> f64 {
    segs.iter()
        .map(|s| (s.src_end - s.src_start) / s.speed)
        .sum()
}

/// `[input]` must start at the clip's in point. Output starts at PTS 0.
pub fn ramp_video_graph(segs: &[RampSegment], input: &str, output: &str, prefix: &str) -> String {
    let k = segs.len();
    let mut g = vec![format!(
        "[{input}]split={k}{}",
        (0..k)
            .map(|i| format!("[{prefix}s{i}]"))
            .collect::<String>()
    )];
    for (i, s) in segs.iter().enumerate() {
        g.push(format!(
            "[{prefix}s{i}]trim=start={}:end={},setpts=(PTS-STARTPTS)/{}[{prefix}r{i}]",
            n(s.src_start),
            n(s.src_end),
            n(s.speed)
        ));
    }
    g.push(format!(
        "{}concat=n={k}:v=1:a=0[{output}]",
        (0..k)
            .map(|i| format!("[{prefix}r{i}]"))
            .collect::<String>()
    ));
    g.join(";")
}

/// `atempo` accepts 0.5..100 per instance; chain it for slower speeds.
pub fn atempo_chain(speed: f64) -> String {
    let mut s = speed.clamp(0.1, 10.0);
    let mut parts = Vec::new();
    while s < 0.5 {
        parts.push("atempo=0.5".to_string());
        s /= 0.5;
    }
    parts.push(format!("atempo={}", n(s)));
    parts.join(",")
}

/// Audio twin of `ramp_video_graph` (pitch kept by atempo).
pub fn ramp_audio_graph(segs: &[RampSegment], input: &str, output: &str, prefix: &str) -> String {
    let k = segs.len();
    let mut g = vec![format!(
        "[{input}]asplit={k}{}",
        (0..k)
            .map(|i| format!("[{prefix}s{i}]"))
            .collect::<String>()
    )];
    for (i, s) in segs.iter().enumerate() {
        g.push(format!(
            "[{prefix}s{i}]atrim=start={}:end={},asetpts=PTS-STARTPTS,{}[{prefix}r{i}]",
            n(s.src_start),
            n(s.src_end),
            atempo_chain(s.speed)
        ));
    }
    g.push(format!(
        "{}concat=n={k}:v=0:a=1[{output}]",
        (0..k)
            .map(|i| format!("[{prefix}r{i}]"))
            .collect::<String>()
    ));
    g.join(";")
}

/// Input args for a freeze-frame still (`Clip.still.path`): loops the PNG for
/// `duration` seconds. Use instead of `-ss/-t/-i` for that clip.
pub fn still_input_args(path: &str, duration: f64, fps: u32) -> Vec<String> {
    vec![
        "-loop".into(),
        "1".into(),
        "-framerate".into(),
        fps.clamp(1, 120).to_string(),
        "-t".into(),
        n(duration.max(0.04)),
        "-i".into(),
        path.into(),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ramp_length_matches_integral() {
        // 2x then 0.5x halves: 0.5*(1/2) + 0.5*(1/0.5) = 1.25 of the span.
        let keys = [
            RampKey { t: 0.0, speed: 2.0 },
            RampKey { t: 0.5, speed: 2.0 },
            RampKey { t: 0.5, speed: 0.5 },
            RampKey { t: 1.0, speed: 0.5 },
        ];
        let d = ramp_duration(&ramp_segments(&keys, 10.0, 8));
        assert!((d - 12.5).abs() < 0.01, "{d}");
        assert_eq!(atempo_chain(0.2), "atempo=0.5,atempo=0.5,atempo=0.8");
        assert_eq!(color_chain(&ClipColor::default()), None);
    }
}
