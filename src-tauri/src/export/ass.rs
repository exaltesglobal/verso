//! Text layers and captions as an ASS subtitle script, burned in with libass
//! (the `ass` filter). ASS gives us per-word colours, outlines, boxes, glow
//! and the pop-in animation without stacking dozens of `drawtext` filters.
//!
//! Sizes follow the preview: text layers are `size × canvas height` CSS
//! pixels; captions are 22 px on a ~550 px tall preview frame (4% of the
//! height) times the style's scale.

use std::fmt::Write;

use super::{
    Align, Caption, CaptionAnimation, CaptionBackground, CaptionStyle, ExportRequest, Highlight,
    TextOverlay, TextPreset, canvas,
};

/// libass sizes fonts by ascent + descent, CSS by the em box; Manrope (and
/// Segoe UI) are about 1.35 em tall.
const EM_TO_ASS: f64 = 1.35;
/// Caption base size: 22 px preview font on a ~550 px preview frame.
const CAPTION_BASE: f64 = 0.04;
const CAPTION_PREVIEW_PX: f64 = 22.0;

/// `#RRGGBB[AA]` to ASS `&HBBGGRR&` plus an ASS alpha (`00` opaque, `FF` clear).
fn color(c: &str) -> (String, String) {
    let hex = c.trim().trim_start_matches('#');
    let ok = (hex.len() == 6 || hex.len() == 8) && hex.chars().all(|c| c.is_ascii_hexdigit());
    if !ok {
        return ("&HFFFFFF&".into(), "&H00&".into());
    }
    let byte = |i: usize| u8::from_str_radix(&hex[i..i + 2], 16).unwrap_or(255);
    let a = if hex.len() == 8 { byte(6) } else { 255 };
    (
        format!("&H{:02X}{:02X}{:02X}&", byte(4), byte(2), byte(0)),
        format!("&H{:02X}&", 255 - a),
    )
}

/// `\1c..\1a..` style override for colour slot `slot` (1 fill, 3 outline, 4 shadow).
fn paint(slot: u8, c: &str) -> String {
    let (rgb, a) = color(c);
    format!("\\{slot}c{rgb}\\{slot}a{a}")
}

fn time(s: f64) -> String {
    let cs = (s.max(0.0) * 100.0).round() as u64;
    format!(
        "{}:{:02}:{:02}.{:02}",
        cs / 360_000,
        cs / 6000 % 60,
        cs / 100 % 60,
        cs % 100
    )
}

/// Literal text for an event line.
fn text(s: &str) -> String {
    s.replace('\\', "\\\u{200B}")
        .replace('{', "\\{")
        .replace('}', "\\}")
        .replace("\r\n", "\\N")
        .replace('\n', "\\N")
}

fn px(v: f64) -> String {
    format!("{:.1}", v.max(0.0))
}

/// `\fn..\b..` for a weight. The bundled static Manrope files name their
/// heavier cuts as separate families, so pick the face by name.
fn face(family: &str, weight: u32) -> String {
    let name = match (family, weight) {
        ("Manrope", 800..) => "Manrope ExtraBold",
        ("Manrope", 600..=699) => "Manrope SemiBold",
        _ => family,
    };
    format!("\\fn{name}\\b{weight}")
}

fn text_event(out: &mut String, o: &TextOverlay, family: &str, w: f64, h: f64) {
    let css = o.size.clamp(0.005, 0.5) * h;
    let weight = match o.preset {
        TextPreset::Subtitle => 700,
        TextPreset::Body => 600,
        _ => 800,
    };
    let (an, x) = match o.align {
        Align::Left => (4, w * 0.06),
        Align::Center => (5, w * 0.5),
        Align::Right => (6, w * 0.94),
    };
    let mut tags = format!(
        "\\an{an}\\pos({},{})\\fs{}{}",
        px(x),
        px(o.y.clamp(0.0, 1.0) * h),
        px(css * EM_TO_ASS),
        face(family, weight)
    );
    let accent = o.accent.as_deref().unwrap_or("#FFB547");
    let style = match o.preset {
        TextPreset::Boxed => {
            tags += &paint(1, o.box_text_color.as_deref().unwrap_or("#0B0B0F"));
            tags += &paint(3, accent);
            tags += &paint(4, accent);
            tags += &format!("\\bord{}\\shad0", px(css * 0.14));
            "Box"
        }
        TextPreset::Outline => {
            tags += "\\1a&HFF&";
            tags += &paint(3, &o.color);
            tags += &format!("\\bord{}\\shad0", px(css * 0.03));
            "Plain"
        }
        TextPreset::Neon => {
            tags += &paint(1, &o.color);
            let rgb: String = accent.chars().take(7).collect();
            tags += &paint(3, &format!("{rgb}B0"));
            tags += &format!("\\bord{}\\blur{}\\shad0", px(css * 0.1), px(css * 0.12));
            "Plain"
        }
        _ => {
            tags += &paint(1, &o.color);
            // Preview: text-shadow 0 2px 14px rgba(0,0,0,.5).
            tags += &format!("\\bord0\\shad{}\\4c&H000000&\\4a&HA0&", px(css * 0.04));
            "Plain"
        }
    };
    // Pop in over 0.25 s: fade up and grow from 92%.
    tags += "\\fad(250,0)\\fscx92\\fscy92\\t(0,250,\\fscx100\\fscy100)";
    let _ = writeln!(
        out,
        "Dialogue: 0,{},{},{style},,0,0,0,,{{{tags}}}{}",
        time(o.start),
        time(o.end),
        text(&o.text)
    );
}

/// Index of the word being spoken at `at`, as the preview computes it.
fn active_at(c: &Caption, count: usize, at: f64) -> i64 {
    if !c.words.is_empty() {
        return c
            .words
            .iter()
            .position(|w| at >= w.start && at < w.end)
            .map_or(-1, |i| i as i64);
    }
    let len = (c.end - c.start).max(1e-6);
    (((at - c.start) / len * count as f64).floor() as i64).min(count as i64 - 1)
}

fn caption_events(out: &mut String, c: &Caption, s: &CaptionStyle, family: &str, w: f64, h: f64) {
    let words: Vec<String> = if c.words.is_empty() {
        c.text.split_whitespace().map(String::from).collect()
    } else {
        c.words.iter().map(|x| x.text.trim().to_string()).collect()
    };
    if words.is_empty() || c.end <= c.start {
        return;
    }
    let words: Vec<String> = if s.upper {
        words.iter().map(|x| x.to_uppercase()).collect()
    } else {
        words
    };

    // Segments where the active word stays the same.
    let mut cuts = vec![c.start, c.end];
    if c.words.is_empty() {
        let step = (c.end - c.start) / words.len() as f64;
        cuts.extend((1..words.len()).map(|i| c.start + step * i as f64));
    } else {
        cuts.extend(c.words.iter().flat_map(|x| [x.start, x.end]));
    }
    let mut cuts: Vec<f64> = cuts.into_iter().map(|x| x.clamp(c.start, c.end)).collect();
    cuts.sort_by(f64::total_cmp);
    cuts.dedup_by(|a, b| (*a - *b).abs() < 0.01);
    let mut segs: Vec<(f64, f64, i64)> = Vec::new();
    for pair in cuts.windows(2) {
        let (a, b) = (pair[0], pair[1]);
        let act = active_at(c, words.len(), (a + b) / 2.0);
        match segs.last_mut() {
            Some(last) if last.2 == act => last.1 = b,
            _ => segs.push((a, b, act)),
        }
    }

    let css = CAPTION_BASE * h * s.scale.clamp(0.3, 3.0);
    let r = CAPTION_BASE * h / CAPTION_PREVIEW_PX; // export px per preview px
    let boxed = s.background != CaptionBackground::None;
    let mut base = format!(
        "\\an2\\pos({},{})\\fs{}{}",
        px(w / 2.0),
        px(h * 0.82),
        px(css * EM_TO_ASS),
        face(family, s.font_weight.clamp(100, 900))
    );
    if boxed {
        let bg = s.background_color.as_deref().unwrap_or("#0B0B0FB8");
        base += &paint(3, bg);
        base += &paint(4, bg);
        let pad = if s.background == CaptionBackground::Pill {
            0.3
        } else {
            0.18
        };
        base += &format!("\\bord{}\\shad0", px(css * pad));
    } else if let (Some(oc), true) = (&s.outline_color, s.outline_width > 0.0) {
        // Preview strokes with paint-order stroke-fill: half the width shows.
        base += &paint(3, oc);
        base += &format!("\\bord{}\\shad0", px(s.outline_width * r / 2.0));
    } else {
        base += "\\bord0\\shad0";
    }
    if let Some(g) = &s.glow {
        base += &paint(4, g);
        base += &format!("\\blur{}", px(10.0 * r / 3.0));
    }

    for (a, b, act) in segs {
        let mut line = format!("{{{base}}}");
        if let Some(sp) = c.speaker.as_deref().filter(|x| !x.trim().is_empty()) {
            let _ = write!(
                line,
                "{{\\fs{}{}}}{}\\N{{\\fs{}}}",
                px(css * EM_TO_ASS * 0.55),
                paint(1, &s.text_color),
                text(sp),
                px(css * EM_TO_ASS)
            );
        }
        let mut first = true;
        for (i, word) in words.iter().enumerate() {
            let i = i as i64;
            if s.reveal_words && i > act {
                break;
            }
            let lit = match s.highlight {
                Highlight::Color | Highlight::Box => i == act,
                Highlight::Fill => i <= act && act >= 0,
                Highlight::None => false,
            };
            let col = if lit {
                &s.highlight_color
            } else {
                &s.text_color
            };
            if !first {
                line.push(' ');
            }
            first = false;
            // shortcut: the "box" highlight is drawn as a colour change; libass can't box one word.
            let pop = i == act && s.animation == CaptionAnimation::Pop;
            if pop {
                let _ = write!(
                    line,
                    "{{{}\\fscx70\\fscy70\\t(0,120,\\fscx112\\fscy112)\\t(120,220,\\fscx100\\fscy100)}}{}{{\\fscx100\\fscy100}}",
                    paint(1, col),
                    text(word)
                );
            } else {
                let _ = write!(line, "{{{}}}{}", paint(1, col), text(word));
            }
        }
        if time(a) == time(b) {
            continue;
        }
        let style = if boxed { "Box" } else { "Plain" };
        let _ = writeln!(
            out,
            "Dialogue: 1,{},{},{style},,0,0,0,,{line}",
            time(a),
            time(b)
        );
    }
}

/// The whole script, or None when there is no text to burn.
pub fn build_ass(req: &ExportRequest, family: &str) -> Option<String> {
    let texts: Vec<&TextOverlay> = req
        .text_overlays
        .iter()
        .filter(|o| o.end > o.start && !o.text.trim().is_empty())
        .collect();
    let caps: Vec<&Caption> = req
        .captions
        .iter()
        .filter(|c| c.end > c.start && !c.text.trim().is_empty())
        .collect();
    if texts.is_empty() && caps.is_empty() {
        return None;
    }
    let (w, h) = canvas(req.aspect, req.quality);
    let (wf, hf) = (w as f64, h as f64);
    let margin = (wf * 0.06).round();
    let family = family.replace(',', " ");
    let mut out = String::new();
    let _ = write!(
        out,
        "[Script Info]\nScriptType: v4.00+\nPlayResX: {w}\nPlayResY: {h}\nWrapStyle: 0\nScaledBorderAndShadow: yes\nYCbCr Matrix: None\n\n\
[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n\
Style: Plain,{family},48,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,0,0,5,{margin},{margin},0,1\n\
Style: Box,{family},48,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,3,0,0,5,{margin},{margin},0,1\n\n\
[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
    );
    for o in texts {
        text_event(&mut out, o, &family, wf, hf);
    }
    let style = req.caption_style.clone().unwrap_or_default();
    for c in caps {
        caption_events(&mut out, c, &style, &family, wf, hf);
    }
    Some(out)
}
