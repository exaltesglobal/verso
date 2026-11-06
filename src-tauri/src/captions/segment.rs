//! Turns timed words into short, reel-sized caption segments, and handles the
//! script side of Hindi/Marathi/Hinglish text.

use serde::Serialize;

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct CaptionWord {
    pub text: String,
    /// Seconds in the source file.
    pub start: f64,
    pub end: f64,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct CaptionSegment {
    pub start: f64,
    pub end: f64,
    pub text: String,
    /// Word timings for karaoke-style highlight.
    pub words: Vec<CaptionWord>,
}

/// Reels read best in small bites.
pub const MAX_WORDS: usize = 4;
pub const MAX_SECONDS: f64 = 1.6;
/// A silence longer than this always starts a new caption.
pub const PAUSE_SECONDS: f64 = 0.45;

fn ends_phrase(word: &str) -> bool {
    word.trim_end()
        .ends_with(['.', ',', '!', '?', ';', ':', '।', '॥', '…'])
}

pub fn segment_words(words: &[CaptionWord]) -> Vec<CaptionSegment> {
    let mut out: Vec<CaptionSegment> = Vec::new();
    let mut cur: Vec<CaptionWord> = Vec::new();
    let flush = |cur: &mut Vec<CaptionWord>, out: &mut Vec<CaptionSegment>| {
        if cur.is_empty() {
            return;
        }
        let words = std::mem::take(cur);
        out.push(CaptionSegment {
            start: words[0].start,
            end: words[words.len() - 1].end,
            text: words
                .iter()
                .map(|w| w.text.as_str())
                .collect::<Vec<_>>()
                .join(" "),
            words,
        });
    };
    for w in words {
        if w.text.trim().is_empty() {
            continue;
        }
        if let (Some(first), Some(last)) = (cur.first(), cur.last()) {
            let too_many = cur.len() >= MAX_WORDS;
            let too_long = w.end - first.start > MAX_SECONDS;
            let paused = w.start - last.end > PAUSE_SECONDS;
            if too_many || too_long || paused || ends_phrase(&last.text) {
                flush(&mut cur, &mut out);
            }
        }
        cur.push(CaptionWord {
            text: w.text.trim().to_string(),
            start: w.start,
            end: w.end.max(w.start),
        });
    }
    flush(&mut cur, &mut out);
    out
}

/// Joins raw Whisper tokens into words. Tokens are byte pieces: a word starts
/// at a token beginning with a space, and Devanagari letters are often split
/// across two tokens, so bytes are joined before decoding as UTF-8.
pub fn words_from_tokens(tokens: &[(Vec<u8>, f64, f64)]) -> Vec<CaptionWord> {
    let mut words = Vec::new();
    let mut bytes: Vec<u8> = Vec::new();
    let mut start = 0.0;
    let mut end = 0.0;
    let mut push = |bytes: &mut Vec<u8>, start: f64, end: f64| {
        let text = String::from_utf8_lossy(bytes).trim().to_string();
        bytes.clear();
        if !text.is_empty() {
            words.push(CaptionWord { text, start, end });
        }
    };
    for (tok, t0, t1) in tokens {
        if tok.first() == Some(&b' ') && !bytes.is_empty() {
            push(&mut bytes, start, end);
        }
        if bytes.is_empty() {
            start = *t0;
        }
        bytes.extend_from_slice(tok);
        end = *t1;
    }
    push(&mut bytes, start, end);
    words
}

pub fn has_devanagari(s: &str) -> bool {
    s.chars().any(|c| ('\u{0900}'..='\u{097F}').contains(&c))
}

/// Simple, readable Devanagari to Latin romanization in the style reels use
/// ("kya baat hai"), not academic IAST. Used for Hinglish when Whisper still
/// writes some words in Devanagari.
pub fn romanize(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let chars: Vec<char> = s.chars().collect();
    let mut i = 0;
    while i < chars.len() {
        let c = chars[i];
        if let Some(cons) = consonant(c) {
            out.push_str(cons);
            let mut j = i + 1;
            if chars.get(j) == Some(&'\u{093C}') {
                j += 1; // nukta: the base letter is close enough for captions
            }
            match chars.get(j).copied() {
                Some('\u{094D}') => j += 1, // virama: no vowel
                Some(m) if matra(m).is_some() => {
                    out.push_str(matra(m).unwrap());
                    j += 1;
                }
                next => {
                    // Inherent "a", dropped at the end of a word (schwa deletion).
                    let word_end = next.is_none_or(|n| !is_devanagari_letter(n));
                    let short_word = i == 0 || !is_devanagari_letter(chars[i - 1]);
                    if !word_end || short_word {
                        out.push('a');
                    }
                }
            }
            i = j;
            continue;
        }
        match c {
            '\u{0902}' | '\u{0901}' => out.push('n'), // anusvara, candrabindu
            '\u{0903}' => out.push('h'),
            '\u{0964}' | '\u{0965}' => out.push('.'),
            '\u{0966}'..='\u{096F}' => {
                out.push(char::from(b'0' + (c as u32 - 0x0966) as u8));
            }
            _ => match vowel(c) {
                Some(v) => out.push_str(v),
                None => out.push(c),
            },
        }
        i += 1;
    }
    out
}

fn is_devanagari_letter(c: char) -> bool {
    ('\u{0900}'..='\u{0963}').contains(&c)
}

fn consonant(c: char) -> Option<&'static str> {
    Some(match c {
        'क' => "k",
        'ख' => "kh",
        'ग' => "g",
        'घ' => "gh",
        'ङ' => "n",
        'च' => "ch",
        'छ' => "chh",
        'ज' => "j",
        'झ' => "jh",
        'ञ' => "n",
        'ट' => "t",
        'ठ' => "th",
        'ड' => "d",
        'ढ' => "dh",
        'ण' => "n",
        'त' => "t",
        'थ' => "th",
        'द' => "d",
        'ध' => "dh",
        'न' => "n",
        'प' => "p",
        'फ' => "ph",
        'ब' => "b",
        'भ' => "bh",
        'म' => "m",
        'य' => "y",
        'र' => "r",
        'ल' => "l",
        'ळ' => "l",
        'व' => "v",
        'श' => "sh",
        'ष' => "sh",
        'स' => "s",
        'ह' => "h",
        // Precomposed nukta letters.
        '\u{0958}' => "q",
        '\u{0959}' => "kh",
        '\u{095A}' => "g",
        '\u{095B}' => "z",
        '\u{095C}' => "d",
        '\u{095D}' => "dh",
        '\u{095E}' => "f",
        _ => return None,
    })
}

fn matra(c: char) -> Option<&'static str> {
    Some(match c {
        'ा' => "aa",
        'ि' => "i",
        'ी' => "ee",
        'ु' => "u",
        'ू' => "oo",
        'ृ' => "ri",
        'े' => "e",
        'ै' => "ai",
        'ो' => "o",
        'ौ' => "au",
        'ॅ' => "e",
        'ॉ' => "o",
        _ => return None,
    })
}

fn vowel(c: char) -> Option<&'static str> {
    Some(match c {
        'अ' => "a",
        'आ' => "aa",
        'इ' => "i",
        'ई' => "ee",
        'उ' => "u",
        'ऊ' => "oo",
        'ऋ' => "ri",
        'ए' => "e",
        'ऐ' => "ai",
        'ओ' => "o",
        'औ' => "au",
        'ऑ' => "o",
        _ => return None,
    })
}
