//! Text to phonemes for Kokoro, without espeak-ng (GPL-3, never linked or shipped).
//!
//! - English: misaki's Apache-2.0 pronunciation dictionaries (`us_gold.json`,
//!   `us_silver.json`, already in Kokoro's phoneme alphabet), plus suffix rules
//!   and a rough letter-to-sound fallback for unknown words.
//! - Hindi / Marathi: our own rule-based Devanagari reader (consonant + vowel
//!   tables, anusvara, nukta, and Hindi schwa deletion).
//! - Hinglish (Hindi in English letters): a rough Latin to Devanagari
//!   transliteration, used before translation.

use std::collections::HashMap;
use std::path::Path;

pub struct EnglishDict {
    words: HashMap<String, String>,
}

impl EnglishDict {
    /// Loads silver first, then gold on top (gold wins).
    pub fn load(gold: &Path, silver: &Path) -> Result<Self, String> {
        let mut words = HashMap::new();
        for p in [silver, gold] {
            let bytes = std::fs::read(p)
                .map_err(|e| format!("We couldn't read the pronunciation list ({e}). Try downloading the voices again."))?;
            let map: HashMap<String, serde_json::Value> =
                serde_json::from_slice(&bytes).map_err(|_| {
                    "The pronunciation list is damaged. Try downloading the voices again."
                        .to_string()
                })?;
            for (k, v) in map {
                let ph = match v {
                    serde_json::Value::String(s) => Some(s),
                    serde_json::Value::Object(o) => {
                        o.get("DEFAULT").and_then(|d| d.as_str()).map(String::from)
                    }
                    _ => None,
                };
                if let Some(ph) = ph {
                    words.insert(k, ph);
                }
            }
        }
        Ok(Self { words })
    }

    pub fn contains(&self, w: &str) -> bool {
        self.words.contains_key(w)
    }

    fn lookup(&self, w: &str) -> Option<String> {
        let lower = w.to_lowercase();
        let mut title = lower.clone();
        if let Some(f) = title.get_mut(0..1) {
            f.make_ascii_uppercase();
        }
        [w, lower.as_str(), title.as_str()]
            .into_iter()
            .find_map(|k| self.words.get(k).cloned())
    }

    fn word(&self, w: &str) -> String {
        match w.to_lowercase().as_str() {
            "a" => return "ɐ".into(),
            "the" => return "ðə".into(),
            _ => {}
        }
        if let Some(p) = self.lookup(w) {
            return p;
        }
        // Acronyms like "AI", "UPI".
        if w.len() <= 5 && w.chars().all(|c| c.is_ascii_uppercase()) {
            return w.chars().map(letter_name).collect::<Vec<_>>().join("");
        }
        let lower = w.to_lowercase();
        for (suffix, add) in [
            ("'s", "z"),
            ("s", "z"),
            ("es", "ɪz"),
            ("ed", "d"),
            ("d", "d"),
            ("ing", "ɪŋ"),
            ("ly", "li"),
        ] {
            if let Some(stem) = lower.strip_suffix(suffix)
                && stem.len() > 1
                && let Some(p) = self.lookup(stem)
            {
                return format!("{p}{add}");
            }
        }
        letters_to_sound(&lower)
    }
}

fn letter_name(c: char) -> &'static str {
    match c.to_ascii_lowercase() {
        'a' => "ˈA",
        'b' => "bˈi",
        'c' => "sˈi",
        'd' => "dˈi",
        'e' => "ˈi",
        'f' => "ˈɛf",
        'g' => "ʤˈi",
        'h' => "ˈAʧ",
        'i' => "ˈI",
        'j' => "ʤˈA",
        'k' => "kˈA",
        'l' => "ˈɛl",
        'm' => "ˈɛm",
        'n' => "ˈɛn",
        'o' => "ˈO",
        'p' => "pˈi",
        'q' => "kjˈu",
        'r' => "ˈɑɹ",
        's' => "ˈɛs",
        't' => "tˈi",
        'u' => "jˈu",
        'v' => "vˈi",
        'w' => "dˈʌbəlju",
        'x' => "ˈɛks",
        'y' => "wˈI",
        _ => "zˈi",
    }
}

/// shortcut: crude spelling rules for words missing from the dictionary (names,
/// slang); swap for a small permissive G2P model if users report bad readings.
fn letters_to_sound(w: &str) -> String {
    const RULES: &[(&str, &str)] = &[
        ("tion", "ʃən"),
        ("ough", "ʌf"),
        ("igh", "I"),
        ("sch", "sk"),
        ("ch", "ʧ"),
        ("sh", "ʃ"),
        ("th", "θ"),
        ("ph", "f"),
        ("ng", "ŋ"),
        ("ck", "k"),
        ("qu", "kw"),
        ("wh", "w"),
        ("ee", "i"),
        ("ea", "i"),
        ("oo", "u"),
        ("ai", "A"),
        ("ay", "A"),
        ("oa", "O"),
        ("ow", "W"),
        ("ou", "W"),
        ("oi", "Y"),
        ("oy", "Y"),
        ("aa", "ɑ"),
        ("a", "æ"),
        ("b", "b"),
        ("c", "k"),
        ("d", "d"),
        ("e", "ɛ"),
        ("f", "f"),
        ("g", "ɡ"),
        ("h", "h"),
        ("i", "ɪ"),
        ("j", "ʤ"),
        ("k", "k"),
        ("l", "l"),
        ("m", "m"),
        ("n", "n"),
        ("o", "ɑ"),
        ("p", "p"),
        ("q", "k"),
        ("r", "ɹ"),
        ("s", "s"),
        ("t", "t"),
        ("u", "ʌ"),
        ("v", "v"),
        ("w", "w"),
        ("x", "ks"),
        ("y", "i"),
        ("z", "z"),
    ];
    let mut out = String::from("ˈ");
    let mut rest = w.trim_end_matches('e');
    if rest.is_empty() {
        rest = w;
    }
    'outer: while !rest.is_empty() {
        for (g, p) in RULES {
            if let Some(r) = rest.strip_prefix(g) {
                out.push_str(p);
                rest = r;
                continue 'outer;
            }
        }
        let mut chars = rest.chars();
        chars.next();
        rest = chars.as_str();
    }
    out
}

fn english_number(n: u64) -> String {
    const ONES: [&str; 20] = [
        "zero",
        "one",
        "two",
        "three",
        "four",
        "five",
        "six",
        "seven",
        "eight",
        "nine",
        "ten",
        "eleven",
        "twelve",
        "thirteen",
        "fourteen",
        "fifteen",
        "sixteen",
        "seventeen",
        "eighteen",
        "nineteen",
    ];
    const TENS: [&str; 10] = [
        "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety",
    ];
    match n {
        0..=19 => ONES[n as usize].into(),
        20..=99 => {
            let t = TENS[(n / 10) as usize];
            if n % 10 == 0 {
                t.into()
            } else {
                format!("{t} {}", ONES[(n % 10) as usize])
            }
        }
        100..=999 => {
            let rest = if n % 100 == 0 {
                String::new()
            } else {
                format!(" {}", english_number(n % 100))
            };
            format!("{} hundred{rest}", ONES[(n / 100) as usize])
        }
        _ => {
            let (div, name) = if n >= 1_000_000_000 {
                (1_000_000_000, "billion")
            } else if n >= 1_000_000 {
                (1_000_000, "million")
            } else {
                (1_000, "thousand")
            };
            let rest = if n % div == 0 {
                String::new()
            } else {
                format!(" {}", english_number(n % div))
            };
            format!("{} {name}{rest}", english_number(n / div))
        }
    }
}

// ---------- Devanagari (Hindi / Marathi) ----------

#[derive(Clone, Copy, PartialEq)]
enum V {
    Schwa,
    Full(&'static str),
    Gone,
}

#[derive(Clone, Copy, PartialEq)]
enum Nasal {
    No,
    Anusvara,
    Chandra,
}

struct Syl {
    cons: &'static str,
    v: V,
    nasal: Nasal,
    coda: &'static str,
}

fn consonant(c: char) -> Option<&'static str> {
    Some(match c {
        'क' => "k",
        'ख' => "kʰ",
        'ग' => "ɡ",
        'घ' => "ɡʰ",
        'ङ' => "ŋ",
        'च' => "ʧ",
        'छ' => "ʧʰ",
        'ज' => "ʤ",
        'झ' => "ʤʰ",
        'ञ' => "ɲ",
        'ट' => "ʈ",
        'ठ' => "ʈʰ",
        'ड' => "ɖ",
        'ढ' => "ɖʰ",
        'ण' => "ɳ",
        'त' => "t",
        'थ' => "tʰ",
        'द' => "d",
        'ध' => "dʰ",
        'न' => "n",
        'प' => "p",
        'फ' => "pʰ",
        'ब' => "b",
        'भ' => "bʰ",
        'म' => "m",
        'य' => "j",
        'र' => "ɾ",
        'ल' => "l",
        'ळ' => "l",
        'व' => "ʋ",
        'श' => "ʃ",
        'ष' => "ʂ",
        'स' => "s",
        'ह' => "h",
        // Precomposed nukta letters (qa, khha, ghha, za, dddha, rha, fa, yya).
        '\u{0958}' => "q",
        '\u{0959}' => "x",
        '\u{095A}' => "ɣ",
        '\u{095B}' => "z",
        '\u{095C}' => "ɽ",
        '\u{095D}' => "ɽʰ",
        '\u{095E}' => "f",
        '\u{095F}' => "j",
        _ => return None,
    })
}

/// Consonant + nukta (U+093C) written as two code points.
fn with_nukta(c: &'static str) -> &'static str {
    match c {
        "k" => "q",
        "kʰ" => "x",
        "ɡ" => "ɣ",
        "ʤ" => "z",
        "ɖ" => "ɽ",
        "ɖʰ" => "ɽʰ",
        "pʰ" => "f",
        other => other,
    }
}

fn vowel(c: char) -> Option<&'static str> {
    Some(match c {
        'अ' => "ə",
        'आ' | 'ा' => "aː",
        'इ' | 'ि' => "ɪ",
        'ई' | 'ी' => "iː",
        'उ' | 'ु' => "ʊ",
        'ऊ' | 'ू' => "uː",
        'ऋ' | 'ृ' => "ɾɪ",
        'ए' | 'े' => "eː",
        'ऐ' | 'ै' => "ɛː",
        'ओ' | 'ो' => "oː",
        'औ' | 'ौ' => "ɔː",
        'ऑ' | 'ॉ' => "ɔ",
        'ऍ' | 'ॅ' => "æ",
        'ॲ' => "æ",
        _ => return None,
    })
}

fn is_matra(c: char) -> bool {
    ('\u{093E}'..='\u{094C}').contains(&c) || c == '\u{0962}' || c == '\u{0963}'
}

fn devanagari_word(word: &str) -> String {
    let mut syls: Vec<Syl> = Vec::new();
    for c in word.chars() {
        if let Some(k) = consonant(c) {
            syls.push(Syl {
                cons: k,
                v: V::Schwa,
                nasal: Nasal::No,
                coda: "",
            });
        } else if c == '\u{093C}' {
            if let Some(s) = syls.last_mut() {
                s.cons = with_nukta(s.cons);
            }
        } else if let Some(v) = vowel(c) {
            match syls.last_mut() {
                Some(s) if is_matra(c) && !s.cons.is_empty() && s.v == V::Schwa => s.v = V::Full(v),
                _ => syls.push(Syl {
                    cons: "",
                    v: if v == "ə" { V::Schwa } else { V::Full(v) },
                    nasal: Nasal::No,
                    coda: "",
                }),
            }
        } else if c == '\u{094D}' {
            if let Some(s) = syls.last_mut() {
                s.v = V::Gone;
            }
        } else if c == 'ं' || c == 'ँ' {
            if let Some(s) = syls.last_mut() {
                s.nasal = if c == 'ं' {
                    Nasal::Anusvara
                } else {
                    Nasal::Chandra
                };
            }
        } else if c == 'ः'
            && let Some(s) = syls.last_mut()
        {
            s.coda = "h";
        }
    }

    // Hindi schwa deletion: drop the final schwa, then VCəCV -> VCCV right to left.
    let n = syls.len();
    let has_v = |s: &Syl| s.v != V::Gone;
    if n > 1 {
        let last = &mut syls[n - 1];
        if last.v == V::Schwa && !last.cons.is_empty() && last.nasal == Nasal::No {
            last.v = V::Gone;
        }
    }
    for i in (1..n.saturating_sub(1)).rev() {
        let deletable =
            syls[i].v == V::Schwa && !syls[i].cons.is_empty() && syls[i].nasal == Nasal::No;
        // Keep it after a nasal/visarga coda (zindagi): deleting would make three consonants.
        let open_prev = syls[i - 1].nasal != Nasal::Anusvara && syls[i - 1].coda.is_empty();
        if deletable
            && open_prev
            && has_v(&syls[i - 1])
            && has_v(&syls[i + 1])
            && !syls[i + 1].cons.is_empty()
        {
            syls[i].v = V::Gone;
        }
    }

    let mut out = String::new();
    for (i, s) in syls.iter().enumerate() {
        out.push_str(s.cons);
        match s.v {
            V::Schwa => out.push('ə'),
            V::Full(v) => out.push_str(v),
            V::Gone => {}
        }
        match s.nasal {
            Nasal::No => {}
            Nasal::Chandra => out.push('\u{0303}'),
            Nasal::Anusvara => match syls.get(i + 1).map(|x| x.cons).filter(|c| !c.is_empty()) {
                Some(next) => out.push_str(match next.chars().next() {
                    Some('k' | 'ɡ' | 'q' | 'x' | 'ɣ') => "ŋ",
                    Some('ʧ' | 'ʤ') => "ɲ",
                    Some('ʈ' | 'ɖ' | 'ɽ' | 'ɳ') => "ɳ",
                    Some('p' | 'b' | 'm' | 'f') => "m",
                    _ => "n",
                }),
                None => out.push('\u{0303}'),
            },
        }
        out.push_str(s.coda);
    }
    out
}

const HINDI_DIGITS: [&str; 10] = [
    "शून्य",
    "एक",
    "दो",
    "तीन",
    "चार",
    "पाँच",
    "छह",
    "सात",
    "आठ",
    "नौ",
];

fn is_devanagari(c: char) -> bool {
    ('\u{0900}'..='\u{097F}').contains(&c) && !matches!(c, '।' | '॥')
}

/// Kokoro phonemes for mixed English / Devanagari text. Words in Devanagari are
/// read with Hindi rules, Latin words with the English dictionary.
pub fn phonemize(text: &str, dict: &EnglishDict) -> String {
    let indic = text.chars().any(is_devanagari);
    let mut out = String::new();
    let chars: Vec<char> = text.chars().collect();
    let mut i = 0;
    let push_word = |out: &mut String, w: &str| {
        if !out.is_empty() && !out.ends_with(' ') {
            out.push(' ');
        }
        out.push_str(w);
    };
    while i < chars.len() {
        let c = chars[i];
        let start = i;
        if is_devanagari(c) && !('\u{0966}'..='\u{096F}').contains(&c) {
            while i < chars.len()
                && is_devanagari(chars[i])
                && !('\u{0966}'..='\u{096F}').contains(&chars[i])
            {
                i += 1;
            }
            let w: String = chars[start..i].iter().collect();
            push_word(&mut out, &devanagari_word(&w));
        } else if c.is_ascii_alphabetic() {
            while i < chars.len()
                && (chars[i].is_ascii_alphabetic()
                    || (chars[i] == '\''
                        && i + 1 < chars.len()
                        && chars[i + 1].is_ascii_alphabetic()))
            {
                i += 1;
            }
            let w: String = chars[start..i].iter().collect();
            push_word(&mut out, &dict.word(&w));
        } else if c.is_ascii_digit() || ('\u{0966}'..='\u{096F}').contains(&c) {
            while i < chars.len()
                && (chars[i].is_ascii_digit()
                    || ('\u{0966}'..='\u{096F}').contains(&chars[i])
                    || chars[i] == ',')
            {
                i += 1;
            }
            let digits: String = chars[start..i]
                .iter()
                .filter(|c| *c != &',')
                .map(|&c| {
                    if c.is_ascii_digit() {
                        c
                    } else {
                        char::from(b'0' + (c as u32 - 0x0966) as u8)
                    }
                })
                .collect();
            if indic {
                // shortcut: Hindi numbers are read digit by digit; add a number-word table if needed.
                for d in digits.bytes() {
                    push_word(
                        &mut out,
                        &devanagari_word(HINDI_DIGITS[(d - b'0') as usize]),
                    );
                }
            } else if let Ok(n) = digits.parse::<u64>() {
                for w in english_number(n).split(' ') {
                    push_word(&mut out, &dict.word(w));
                }
            }
        } else {
            i += 1;
            match c {
                '।' | '॥' | '.' => out.push('.'),
                ',' | '!' | '?' | ';' | ':' | '—' | '…' => out.push(c),
                '-' | '–' | '\n' | '\t' | ' ' => {
                    if !out.ends_with(' ') && !out.is_empty() {
                        out.push(' ');
                    }
                }
                _ => {}
            }
        }
    }
    out.trim().to_string()
}

// ---------- Hinglish (Latin letters) to Devanagari ----------

const HINGLISH_WORDS: &[&str] = &[
    "hai", "hain", "main", "mein", "me", "ka", "ki", "ke", "ko", "se", "to", "bhi", "kya", "nahi",
    "nahin", "aur", "ye", "yeh", "wo", "woh", "hum", "tum", "aap", "ho", "tha", "thi", "the",
    "kar", "karo", "raha", "rahi", "rahe", "bhai", "yaar", "accha", "acha", "theek", "thik",
    "bahut", "kuch", "sab", "abhi", "phir", "kaise", "kyun", "kyon", "apna", "apni", "apne",
    "mera", "meri", "mere", "tera", "teri", "tere", "jo", "jab", "tab", "par", "pe", "liye",
    "wala", "wali", "wale", "haan", "na", "mat", "ek", "do", "hoga", "hogi",
];

/// Turns Hindi typed in English letters into Devanagari so the translator can
/// read it. English words (found in the dictionary) are kept as they are.
/// shortcut: rule-based, guesses dental vs retroflex and vowel length; fine
/// for short captions, not for long text.
pub fn hinglish_to_devanagari(text: &str, dict: Option<&EnglishDict>) -> String {
    let mut out = String::new();
    let mut word = String::new();
    let flush = |word: &mut String, out: &mut String| {
        if word.is_empty() {
            return;
        }
        let lower = word.to_lowercase();
        let keep =
            !HINGLISH_WORDS.contains(&lower.as_str()) && dict.is_some_and(|d| d.contains(&lower));
        out.push_str(&if keep {
            word.clone()
        } else {
            roman_word(&lower)
        });
        word.clear();
    };
    for c in text.chars() {
        if c.is_ascii_alphabetic() {
            word.push(c);
        } else {
            flush(&mut word, &mut out);
            out.push(c);
        }
    }
    flush(&mut word, &mut out);
    out
}

fn roman_word(w: &str) -> String {
    const CONS: &[(&str, &str)] = &[
        ("chh", "छ"),
        ("kh", "ख"),
        ("gh", "घ"),
        ("ch", "च"),
        ("jh", "झ"),
        ("th", "थ"),
        ("dh", "ध"),
        ("ph", "फ"),
        ("bh", "भ"),
        ("sh", "श"),
        ("k", "क"),
        ("g", "ग"),
        ("c", "क"),
        ("j", "ज"),
        ("t", "त"),
        ("d", "द"),
        ("n", "न"),
        ("p", "प"),
        ("f", "फ़"),
        ("b", "ब"),
        ("m", "म"),
        ("y", "य"),
        ("r", "र"),
        ("l", "ल"),
        ("v", "व"),
        ("w", "व"),
        ("s", "स"),
        ("h", "ह"),
        ("z", "ज़"),
        ("q", "क़"),
        ("x", "क्स"),
    ];
    const VOWELS: &[(&str, &str, &str)] = &[
        ("aa", "आ", "ा"),
        ("ai", "ऐ", "ै"),
        ("au", "औ", "ौ"),
        ("ee", "ई", "ी"),
        ("ii", "ई", "ी"),
        ("oo", "ऊ", "ू"),
        ("uu", "ऊ", "ू"),
        ("a", "अ", ""),
        ("i", "इ", "ि"),
        ("u", "उ", "ु"),
        ("e", "ए", "े"),
        ("o", "ओ", "ो"),
    ];
    let mut out = String::new();
    let mut rest = w;
    let mut prev_cons = false;
    'outer: while !rest.is_empty() {
        for (g, ind, matra) in VOWELS {
            if let Some(r) = rest.strip_prefix(g) {
                let at_end = r.is_empty();
                if prev_cons {
                    // Final short vowels are usually long in romanised Hindi ("kya", "pani").
                    out.push_str(match (*g, at_end) {
                        ("a", true) => "ा",
                        ("i", true) => "ी",
                        ("u", true) => "ू",
                        _ => matra,
                    });
                } else {
                    out.push_str(ind);
                }
                prev_cons = false;
                rest = r;
                continue 'outer;
            }
        }
        for (g, d) in CONS {
            if let Some(r) = rest.strip_prefix(g) {
                let next_is_cons = r.chars().next().is_some_and(|c| !"aeiou".contains(c));
                if *g == "n" && !prev_cons && !out.is_empty() && next_is_cons {
                    out.push('ं');
                } else {
                    if prev_cons {
                        out.push('्');
                    }
                    out.push_str(d);
                    prev_cons = true;
                }
                rest = r;
                continue 'outer;
            }
        }
        let mut chars = rest.chars();
        chars.next();
        rest = chars.as_str();
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hindi_rules_and_hinglish() {
        assert_eq!(devanagari_word("नमस्ते"), "nəməsteː");
        assert_eq!(devanagari_word("कमल"), "kəməl");
        assert_eq!(devanagari_word("समझना"), "səməʤʰnaː");
        assert_eq!(devanagari_word("हिंदी"), "hɪndiː");
        assert_eq!(devanagari_word("ज़िंदगी"), "zɪndəɡiː");
        assert_eq!(roman_word("kya"), "क्या");
        assert_eq!(roman_word("bahut"), "बहुत");
        assert_eq!(letters_to_sound("zing"), "ˈzɪŋ");
        assert_eq!(english_number(2026), "two thousand twenty six");
    }
}
