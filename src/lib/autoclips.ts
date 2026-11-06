// Auto clips: find the moments in a long video that work best as reels.
//
// Input is a word-level transcript (from the on-device captions engine), with
// optional speaker labels and audio loudness peaks. We cut candidates on
// sentence boundaries, score each one, and pick the best non-overlapping set.
// Everything here is plain TypeScript: no network, no model.

import type { MediaInfo } from "./media";
import { normalizeProject, uid, type Clip, type Project } from "./project";

export interface TranscriptWord {
  text: string;
  start: number;
  end: number;
  speaker?: string;
}

export interface Sentence {
  text: string;
  start: number;
  end: number;
  words: TranscriptWord[];
  speaker?: string;
}

export interface Moment {
  id: string;
  title: string;
  start: number;
  end: number;
  /** 0..100 */
  hookScore: number;
  reasons: string[];
  sentences: Sentence[];
}

export interface AutoClipOptions {
  minSec: number;
  maxSec: number;
  count: number;
  /** Loudness peaks 0..1 across the whole file, evenly spaced. */
  peaks?: number[];
  durationSec?: number;
}

export const DEFAULT_OPTIONS: AutoClipOptions = { minSec: 15, maxSec: 60, count: 6 };

const SENTENCE_END = /[.!?।]["')\]]?$/;
const PAUSE_BREAK = 0.7;

/** Groups words into sentences on punctuation, long pauses or speaker changes. */
export function toSentences(words: TranscriptWord[]): Sentence[] {
  const out: Sentence[] = [];
  let cur: TranscriptWord[] = [];
  const flush = () => {
    if (!cur.length) return;
    out.push({
      text: cur
        .map((w) => w.text.trim())
        .join(" ")
        .replace(/\s+([,.!?।])/g, "$1"),
      start: cur[0].start,
      end: cur[cur.length - 1].end,
      words: cur,
      speaker: cur[0].speaker,
    });
    cur = [];
  };
  words.forEach((w, i) => {
    const prev = words[i - 1];
    if (
      prev &&
      (w.start - prev.end > PAUSE_BREAK || (w.speaker && prev.speaker && w.speaker !== prev.speaker))
    ) {
      flush();
    }
    cur.push(w);
    if (SENTENCE_END.test(w.text.trim()) || cur.length > 40) flush();
  });
  flush();
  return out;
}

// Words that tend to open strong reels, in English, Hindi (Devanagari) and Hinglish.
const HOOK_WORDS = [
  "secret",
  "mistake",
  "never",
  "always",
  "nobody",
  "everyone",
  "truth",
  "why",
  "how",
  "what",
  "stop",
  "best",
  "worst",
  "biggest",
  "only",
  "first",
  "last",
  "money",
  "crore",
  "lakh",
  "free",
  "you",
  "your",
  "imagine",
  "honestly",
  "actually",
  "story",
  "changed",
  "quit",
  "failed",
  "learned",
  "kyun",
  "kaise",
  "kya",
  "sach",
  "galti",
  "kabhi",
  "sabse",
  "paisa",
  "zindagi",
  "dhyan",
  "क्यों",
  "कैसे",
  "क्या",
  "सच",
  "गलती",
  "कभी",
  "सबसे",
  "पैसा",
  "ज़िंदगी",
  "राज़",
];
const FILLERS = [
  "um",
  "uh",
  "erm",
  "hmm",
  "like",
  "basically",
  "matlab",
  "haan",
  "acha",
  "toh",
  "यानी",
  "मतलब",
];

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

function hookStrength(s: Sentence): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  const words = s.words.map((w) => norm(w.text));
  if (/\?$/.test(s.text.trim())) {
    score += 18;
    reasons.push("Opens with a question");
  }
  if (/\d/.test(s.text)) {
    score += 10;
    reasons.push("Has a number");
  }
  const hooks = words.filter((w) => HOOK_WORDS.includes(w)).length;
  if (hooks) {
    score += Math.min(24, hooks * 8);
    reasons.push("Strong opening words");
  }
  if (words.length >= 5 && words.length <= 18) score += 8;
  if (s.text.includes("!")) score += 6;
  return { score, reasons };
}

function speechDensity(sentences: Sentence[]) {
  const words = sentences.reduce((n, s) => n + s.words.length, 0);
  const span = sentences[sentences.length - 1].end - sentences[0].start;
  return span > 0 ? words / span : 0;
}

function fillerRatio(sentences: Sentence[]) {
  let n = 0;
  let f = 0;
  for (const s of sentences)
    for (const w of s.words) {
      n++;
      if (FILLERS.includes(norm(w.text))) f++;
    }
  return n ? f / n : 0;
}

function energy(opts: AutoClipOptions, start: number, end: number) {
  const { peaks, durationSec } = opts;
  if (!peaks?.length || !durationSec) return 0;
  const per = peaks.length / durationSec;
  const a = Math.floor(start * per);
  const b = Math.min(peaks.length, Math.ceil(end * per));
  if (b <= a) return 0;
  let sum = 0;
  let max = 0;
  for (let i = a; i < b; i++) {
    sum += peaks[i];
    max = Math.max(max, peaks[i]);
  }
  const mean = sum / (b - a);
  return Math.min(1, mean * 0.6 + max * 0.4);
}

/** A short, plain title from the opening sentence. */
function titleFor(s: Sentence) {
  const words = s.text.replace(/[.!।]+$/, "").split(/\s+/);
  const t = words.slice(0, 9).join(" ");
  return (words.length > 9 ? `${t}…` : t).replace(/^./, (c) => c.toUpperCase());
}

/** Scores every sentence-aligned window and returns the best non-overlapping moments. */
export function findMoments(words: TranscriptWord[], options: Partial<AutoClipOptions> = {}): Moment[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const sentences = toSentences(words);
  const candidates: Moment[] = [];

  for (let i = 0; i < sentences.length; i++) {
    let j = i;
    while (j < sentences.length && sentences[j].end - sentences[i].start < opts.minSec) j++;
    for (; j < sentences.length && sentences[j].end - sentences[i].start <= opts.maxSec; j++) {
      const span = sentences.slice(i, j + 1);
      const start = Math.max(0, span[0].start - 0.15);
      const end = span[span.length - 1].end + 0.25;
      const hook = hookStrength(span[0]);
      const density = speechDensity(span); // ~2-3.5 words/s is lively speech
      const reasons = [...hook.reasons];
      let score = 30 + hook.score;
      if (density > 2.2) {
        score += Math.min(12, (density - 2.2) * 10);
        reasons.push("Fast, lively talk");
      }
      const e = energy(opts, start, end);
      if (e > 0.45) {
        score += Math.round((e - 0.45) * 30);
        reasons.push("High energy");
      }
      if (SENTENCE_END.test(span[span.length - 1].text.trim())) score += 6;
      const filler = fillerRatio(span);
      score -= Math.round(filler * 80);
      // Prefer reel-friendly lengths around 25-40 s.
      const len = end - start;
      score -= Math.round(Math.abs(len - 32) / 4);
      const speakers = new Set(span.map((s) => s.speaker).filter(Boolean));
      if (speakers.size === 2) {
        score += 4;
        reasons.push("Back-and-forth between two speakers");
      }
      candidates.push({
        id: uid("mo"),
        title: titleFor(span[0]),
        start,
        end,
        hookScore: Math.max(1, Math.min(99, Math.round(score))),
        reasons: [...new Set(reasons)].slice(0, 3),
        sentences: span,
      });
    }
  }

  candidates.sort((a, b) => b.hookScore - a.hookScore);
  const picked: Moment[] = [];
  for (const c of candidates) {
    if (picked.length >= opts.count) break;
    if (picked.some((p) => c.start < p.end && c.end > p.start)) continue;
    picked.push(c);
  }
  return picked.sort((a, b) => b.hookScore - a.hookScore);
}

/** Caption clips (with word timings and speaker labels) for a moment, relative to the reel. */
export function captionsFor(moment: Moment, offset = 0, maxWords = 4): Clip[] {
  const clips: Clip[] = [];
  for (const s of moment.sentences) {
    for (let i = 0; i < s.words.length; i += maxWords) {
      const group = s.words.slice(i, i + maxWords);
      const start = group[0].start - moment.start + offset;
      const end = group[group.length - 1].end - moment.start + offset;
      const text = group.map((w) => w.text.trim()).join(" ");
      clips.push({
        id: uid("c"),
        label: s.speaker ? `${s.speaker}: ${text}` : text,
        text,
        start: Math.max(0, start),
        end: Math.max(start + 0.2, end),
        words: group.map((w) => ({
          text: w.text.trim(),
          start: w.start - moment.start + offset,
          end: w.end - moment.start + offset,
        })),
      });
    }
  }
  return clips;
}

/** Builds a ready-to-edit 9:16 reel project for one moment. */
export function projectForMoment(media: MediaInfo, moment: Moment, index: number, total: number): Project {
  const len = moment.end - moment.start;
  const linkId = uid("l");
  const base = media.fileName.replace(/\.[^.]+$/, "");
  const video: Clip = {
    id: uid("v"),
    label: base,
    start: 0,
    end: len,
    inPoint: moment.start,
    source: media,
    linkId: media.hasAudio ? linkId : undefined,
  };
  const sound: Clip[] = media.hasAudio
    ? [
        {
          id: uid("a"),
          label: `${base} · sound`,
          start: 0,
          end: len,
          inPoint: moment.start,
          source: media,
          linkId,
          volume: 1,
        },
      ]
    : [];
  const hook: Clip = {
    id: uid("t"),
    label: moment.title,
    text: moment.title,
    start: 0,
    end: Math.min(len, 3.5),
    style: { preset: "boxed", y: 0.18, size: 0.042, color: "#0B0B0F", align: "center" },
  };
  return normalizeProject({
    name: moment.title,
    subtitle: `Reel ${index + 1} of ${total}`,
    aspect: "9:16",
    tracks: [
      { kind: "video", label: "Video", clips: [video] },
      { kind: "audio", label: "Sound", clips: sound },
      { kind: "text", label: "Text", clips: [hook] },
      { kind: "captions", label: "Captions", clips: captionsFor(moment) },
    ],
  });
}
