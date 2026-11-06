//! Looks for export: FFmpeg filter snippets for grain, vignette, letterbox,
//! light leaks, anamorphic flare, dip-to-black and animated text. Pure string
//! builders; the motion curves mirror the preview (LookOverlay.tsx,
//! AnimatedText.tsx) so scrubbing and export match.

use crate::export::Aspect;
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Leak {
    /// "warm" | "rose" | "cool" | "gold".
    pub style: String,
    pub strength: f64,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Flare {
    pub strength: f64,
    /// `#RRGGBB`.
    pub color: String,
}

/// Same shape as `Project.look` in project.ts (grade is applied by the colour feature).
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Look {
    #[serde(default)]
    pub grain: Option<f64>,
    #[serde(default)]
    pub vignette: Option<f64>,
    /// "2.39" | "1.85".
    #[serde(default)]
    pub letterbox: Option<String>,
    #[serde(default)]
    pub leak: Option<Leak>,
    #[serde(default)]
    pub flare: Option<Flare>,
    #[serde(default)]
    pub grade: Option<String>,
    /// Seconds of dip-to-black at the start and end.
    #[serde(default)]
    pub dip: Option<f64>,
}

fn num(x: f64) -> String {
    let s = format!("{:.4}", x);
    let s = s.trim_end_matches('0').trim_end_matches('.');
    if s.is_empty() || s == "-" { "0".into() } else { s.into() }
}

fn rgb(hex: &str) -> (f64, f64, f64) {
    let h = hex.trim().trim_start_matches('#');
    let p = |i: usize| u8::from_str_radix(h.get(i..i + 2).unwrap_or("ff"), 16).unwrap_or(255) as f64;
    (p(0), p(2), p(4))
}

fn leak_colors(style: &str) -> (&'static str, &'static str) {
    match style {
        "rose" => ("#FF4F8B", "#FFB3A1"),
        "cool" => ("#4FB3FF", "#B58CFF"),
        "gold" => ("#FFB547", "#FFF1B8"),
        _ => ("#FF7A2F", "#FFD27A"),
    }
}

/// Letterbox bar height as a fraction of frame height (mirrors `letterboxBar` in looks.ts).
pub fn letterbox_bar(ratio: Option<&str>, aspect: Aspect) -> f64 {
    let r: f64 = match ratio {
        Some("2.39") => 2.39,
        Some("1.85") => 1.85,
        _ => return 0.0,
    };
    let a: f64 = match aspect {
        Aspect::Vertical => return if r > 2.0 { 0.12 } else { 0.08 },
        Aspect::Square => 1.0,
        Aspect::Wide => 16.0 / 9.0,
    };
    ((1.0 - a / r) / 2.0).max(0.0)
}

/// Filters to append (comma-joined) to the composited picture, after the clip
/// overlays and leak/flare, before text: grain, vignette, letterbox bars, dips.
/// `total` is the timeline length in seconds.
pub fn finishing_filters(look: &Look, aspect: Aspect, total: f64) -> Vec<String> {
    let mut f = Vec::new();
    if let Some(v) = look.vignette.filter(|v| *v > 0.0) {
        // Wider angle = darker edges; PI/5 is FFmpeg's default.
        f.push(format!("vignette=angle={}", num(0.25 + 0.6 * v.min(1.0))));
    }
    if let Some(g) = look.grain.filter(|g| *g > 0.0) {
        // Temporal noise: a new pattern every frame, like film.
        f.push(format!("noise=alls={}:allf=t", (g.min(1.0) * 28.0).round().max(1.0)));
    }
    let bar = letterbox_bar(look.letterbox.as_deref(), aspect);
    if bar > 0.0 {
        f.push(format!("drawbox=x=0:y=0:w=iw:h=ih*{b}:color=black:t=fill", b = num(bar)));
        f.push(format!("drawbox=x=0:y=ih-ih*{b}:w=iw:h=ih*{b}:color=black:t=fill", b = num(bar)));
    }
    if let Some(d) = look.dip.filter(|d| *d > 0.0 && total > 0.0) {
        let d = d.min(total / 2.0);
        f.push(format!("fade=t=in:st=0:d={}", num(d)));
        f.push(format!("fade=t=out:st={}:d={}", num(total - d), num(d)));
    }
    f
}

/// Filter-graph lines that screen a procedural light leak and/or anamorphic
/// flare over `[input]`, ending at `[output]`. None when the look has neither.
/// The layer is drawn with `geq` at 1/6 size and scaled up (the light is soft,
/// so this costs little and looks the same).
pub fn light_layers(
    look: &Look,
    w: u32,
    h: u32,
    fps: u32,
    total: f64,
    input: &str,
    output: &str,
) -> Option<Vec<String>> {
    let leak = look.leak.as_ref().filter(|l| l.strength > 0.0);
    let flare = look.flare.as_ref().filter(|f| f.strength > 0.0);
    if leak.is_none() && flare.is_none() {
        return None;
    }
    let mut terms: [Vec<String>; 3] = [Vec::new(), Vec::new(), Vec::new()];
    if let Some(l) = leak {
        let (c1, c2) = leak_colors(&l.style);
        let (c1, c2) = (rgb(c1), rgb(c2));
        // Same curves as LookOverlay: centre drifts on a 7 s cycle, brightness on 5 s.
        let lx = "(0.5+0.4*sin(2*PI*T/7))";
        let amp = format!("{}*(0.55+0.45*sin(2*PI*T/5))", num(l.strength));
        let b1 = format!("exp(-(pow(X/W-{lx},2)/0.045+pow(Y/H-0.3,2)/0.09))");
        let b2 = format!("0.6*exp(-(pow(X/W-1+{lx},2)/0.025+pow(Y/H-0.75,2)/0.045))");
        for (i, (a, bb)) in [(c1.0, c2.0), (c1.1, c2.1), (c1.2, c2.2)].into_iter().enumerate() {
            terms[i].push(format!("{amp}*({}*{b1}+{}*{b2})", num(a), num(bb)));
        }
    }
    if let Some(f) = flare {
        let c = rgb(&f.color);
        let cx = "(0.5+0.3*sin(2*PI*T/9))";
        let cy = "(0.42+0.05*sin(2*PI*T/6))";
        let streak = format!(
            "{}*exp(-pow((X/W-{cx})/0.45,2))*exp(-pow((Y/H-{cy})/0.012,2))",
            num(f.strength)
        );
        // White-hot core fading into the flare colour.
        for (i, ch) in [c.0, c.1, c.2].into_iter().enumerate() {
            terms[i].push(format!("{streak}*({}+102)", num(ch * 0.6)));
        }
    }
    let expr = |i: usize| format!("min(255,{})", terms[i].join("+"));
    let (sw, sh) = ((w / 6).max(2) & !1, (h / 6).max(2) & !1);
    Some(vec![
        format!(
            "color=c=black:s={sw}x{sh}:r={fps}:d={d},format=gbrp,geq=r='{}':g='{}':b='{}',scale={w}:{h},format=gbrp[lookl]",
            expr(0),
            expr(1),
            expr(2),
            d = num(total.max(0.04)),
        ),
        format!("[{input}]format=gbrp[lookb]"),
        format!("[lookb][lookl]blend=all_mode=screen:shortest=0,format=yuv420p[{output}]"),
    ])
}

// ---------- Animated text ----------

/// drawtext text escaping (same rules as export/mod.rs `esc`).
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

/// Prefix texts and their start times for typewriter / word-by-word (mirrors
/// `revealCount` in AnimatedText.tsx). At most 40 steps to keep the graph small.
pub fn reveal_steps(anim: &str, text: &str, start: f64, end: f64) -> Vec<(String, f64)> {
    let len = (end - start).max(0.1);
    let chars: Vec<char> = text.chars().collect();
    match anim {
        "typewriter" if !chars.is_empty() => {
            let dur = (len * 0.6).min((chars.len() as f64 * 0.05).max(0.6));
            let steps = chars.len().min(40);
            (1..=steps)
                .map(|i| {
                    let n = (chars.len() * i).div_ceil(steps);
                    let at = start + dur * ((n - 1) as f64 / chars.len() as f64);
                    (chars[..n].iter().collect(), at)
                })
                .collect()
        }
        "word-by-word" => {
            let words: Vec<&str> = text.split_whitespace().collect();
            let step = (len * 0.6 / words.len().max(1) as f64).min(0.35);
            (1..=words.len())
                .map(|i| (words[..i].join(" "), start + step * (i - 1) as f64))
                .collect()
        }
        _ => vec![(text.to_string(), start)],
    }
}

/// Complete drawtext filters for one text overlay with its entrance animation.
/// `base` holds the shared options without text/x/y/enable/alpha, for example
/// `fontfile=...:expansion=none:fontsize=64:fontcolor=0xFFFFFF:borderw=3`.
/// `x`/`y` are the overlay centre (0..1), `size` its pixel font size.
#[allow(clippy::too_many_arguments)]
pub fn animated_drawtext(
    base: &str,
    text: &str,
    anim: Option<&str>,
    x: f64,
    y: f64,
    size: f64,
    start: f64,
    end: f64,
) -> Vec<String> {
    let anim = anim.unwrap_or("pop");
    let s = num(start);
    let p = |secs: f64| format!("clip((t-{s})/{},0,1)", num(secs));
    // alpha and extra y offset (pixels) as expressions of t.
    let (alpha, dy) = match anim {
        "slide-up" => {
            let k = format!("(1-pow(1-{},3))", p(0.4));
            (k.clone(), format!("(1-{k})*{}", num(size * 0.6)))
        }
        "blur-in" => (p(0.5), "0".into()),
        "bounce" => {
            // easeOutBack drop: overshoots upward, then settles.
            let q = format!("({}-1)", p(0.5));
            let back = format!("(1+2.7*pow({q},3)+1.7*pow({q},2))");
            (p(0.12), format!("(1-{back})*{}", num(size * 0.8)))
        }
        "typewriter" | "word-by-word" => ("1".into(), "0".into()),
        _ => (p(0.25), "0".into()),
    };
    let steps = reveal_steps(anim, text, start, end);
    let n = steps.len();
    steps
        .iter()
        .enumerate()
        .filter(|(_, (t, _))| !t.trim().is_empty())
        .map(|(i, (txt, from))| {
            let to = if i + 1 < n { steps[i + 1].1 } else { end };
            // shortcut: each prefix is centred on its own width, so revealed text drifts
            // slightly left; draw left-aligned at a measured width if that ever bothers anyone.
            format!(
                "drawtext={base}:text={}:alpha='{alpha}':x='w*{}-text_w/2':y='h*{}-text_h/2+{dy}':enable='between(t,{},{})'",
                esc(txt),
                num(x.clamp(0.0, 1.0)),
                num(y.clamp(0.0, 1.0)),
                num(*from),
                num(to.max(*from)),
            )
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn letterbox_matches_preview() {
        assert_eq!(letterbox_bar(Some("2.39"), Aspect::Vertical), 0.12);
        assert!((letterbox_bar(Some("2.39"), Aspect::Wide) - 0.128).abs() < 0.001);
        assert_eq!(letterbox_bar(None, Aspect::Wide), 0.0);
    }

    #[test]
    fn reveal_steps_cover_text() {
        let w = reveal_steps("word-by-word", "one two three", 1.0, 4.0);
        assert_eq!(w.len(), 3);
        assert_eq!(w[2].0, "one two three");
        let t = reveal_steps("typewriter", "hello", 0.0, 3.0);
        assert_eq!(t.last().unwrap().0, "hello");
        assert!(t.windows(2).all(|p| p[0].1 <= p[1].1));
    }

    #[test]
    fn light_layers_only_when_needed() {
        assert!(light_layers(&Look::default(), 1080, 1920, 30, 10.0, "o1", "lk").is_none());
        let look = Look {
            leak: Some(Leak { style: "warm".into(), strength: 0.4 }),
            ..Default::default()
        };
        let g = light_layers(&look, 1080, 1920, 30, 10.0, "o1", "lk").unwrap();
        assert!(g[0].starts_with("color=c=black:s=180x320"));
        assert!(g[2].ends_with("[lk]"));
    }
}
