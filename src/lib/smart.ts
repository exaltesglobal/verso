// Smart editing: pause and filler removal, punch-in zooms and beat sync.
// The analysis runs in Rust (src-tauri/src/analysis); everything here that
// takes a Project returns a new Project, so each tool is one undoable change.
import { invoke } from "@tauri-apps/api/core";
import type { MediaInfo } from "./media";
import {
  MIN_CLIP_SECONDS,
  findClip,
  linkedIds,
  uid,
  type CaptionWord,
  type Clip,
  type Project,
} from "./project";

export interface Span {
  start: number;
  end: number;
}

export type AnalysisTask = "silences" | "emphasis" | "beats";
export interface AnalysisProgress {
  task: AnalysisTask;
  percent: number;
}
export const ANALYSIS_PROGRESS_EVENT = "analysis://progress";

const byStart = (a: Span, b: Span) => a.start - b.start;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Video clips (not effects), in timeline order. */
export function videoClips(project: Project): Clip[] {
  return (project.tracks.find((t) => t.kind === "video")?.clips ?? [])
    .filter((c) => !c.variant)
    .sort(byStart);
}

// ---------- Cutting time out of the timeline ----------

function mergeRanges(ranges: Span[]): Span[] {
  const out: Span[] = [];
  for (const r of ranges.filter((x) => x.end - x.start > 0.02).sort(byStart)) {
    const last = out[out.length - 1];
    if (last && r.start <= last.end) last.end = Math.max(last.end, r.end);
    else out.push({ ...r });
  }
  return out;
}

/** Pieces shorter than this after a cut are dropped rather than kept as slivers. */
const MIN_PIECE = 0.08;

/**
 * Removes timeline `ranges` from video and sound clips (only `onlyIds` if
 * given) and closes the gaps. Inpoints are kept, so each piece still shows the
 * right part of its file; linked pieces stay linked in pairs. Text and caption
 * clips follow the speech; music stays where it is.
 */
export function cutTimelineRanges(project: Project, ranges: Span[], onlyIds?: Set<string>): Project {
  const cuts = mergeRanges(ranges);
  if (!cuts.length) return project;
  const map = (t: number) => t - cuts.reduce((sum, r) => sum + Math.max(0, Math.min(t, r.end) - r.start), 0);
  const links = new Map<string, string>();
  const pieceLink = (linkId: string, k: number) => {
    const key = `${linkId}:${k}`;
    if (!links.has(key)) links.set(key, uid("l"));
    return links.get(key)!;
  };

  const cutClip = (c: Clip): Clip[] => {
    const pieces: Span[] = [];
    let cur = c.start;
    for (const r of cuts) {
      if (r.end <= cur) continue;
      if (r.start >= c.end) break;
      if (r.start > cur) pieces.push({ start: cur, end: r.start });
      cur = Math.max(cur, r.end);
    }
    if (cur < c.end) pieces.push({ start: cur, end: c.end });
    return pieces
      .filter((p) => p.end - p.start >= MIN_PIECE)
      .map((p, k) => {
        const offset = p.start - c.start;
        const length = p.end - p.start;
        const start = map(p.start);
        return {
          ...c,
          id: k === 0 ? c.id : uid(c.id[0] ?? "c"),
          start,
          end: start + length,
          inPoint: c.source ? (c.inPoint ?? 0) + offset : c.inPoint,
          linkId: c.linkId && k > 0 ? pieceLink(c.linkId, k) : c.linkId,
          transitionIn: k === 0 ? c.transitionIn : undefined,
          zoomKeys: c.zoomKeys
            ?.filter((z) => z.t >= offset && z.t < offset + length)
            .map((z) => ({ ...z, t: z.t - offset })),
        };
      });
  };

  return {
    ...project,
    updatedAt: Date.now(),
    tracks: project.tracks.map((t) => {
      if (t.kind === "music") return t;
      const media = t.kind === "video" || t.kind === "audio";
      const clips = t.clips.flatMap((c): Clip[] => {
        if (media && !c.variant && (!onlyIds || onlyIds.has(c.id))) return cutClip(c);
        if (media) {
          const d = map(c.start) - c.start;
          return [{ ...c, start: c.start + d, end: c.end + d }];
        }
        const start = map(c.start);
        const end = map(c.end);
        if (end - start < MIN_PIECE) return [];
        const words = c.words
          ?.filter((w) => map(w.end) - map(w.start) > 0.01)
          .map((w) => ({ ...w, start: map(w.start), end: map(w.end) }));
        if (!words || words.length === c.words?.length) return [{ ...c, start, end, words }];
        const label = words.map((w) => w.text).join(" ");
        return [{ ...c, start, end, words, label, text: c.text === undefined ? undefined : label }];
      });
      return { ...t, clips: clips.sort(byStart) };
    }),
  };
}

// ---------- Pauses ----------

export interface SilenceOptions {
  /** Fixed dBFS threshold; leave out for automatic (from the noise floor). */
  thresholdDb?: number;
  minSilence: number;
  padding: number;
  /** 0..1: where the auto threshold sits between noise floor and speech. */
  strength: number;
}

export type PauseSensitivity = "Gentle" | "Normal" | "Tight";
export const PAUSE_PRESETS: Record<PauseSensitivity, SilenceOptions> = {
  Gentle: { minSilence: 0.8, padding: 0.15, strength: 0.2 },
  Normal: { minSilence: 0.45, padding: 0.1, strength: 0.3 },
  Tight: { minSilence: 0.25, padding: 0.06, strength: 0.4 },
};

/** Pauses in a clip, in source-file seconds. */
export function detectSilences(clip: Clip, options: SilenceOptions): Promise<Span[]> {
  if (!clip.source) return Promise.resolve([]);
  const inPoint = clip.inPoint ?? 0;
  return invoke<Span[]>("detect_silences", {
    path: clip.source.path,
    inPoint,
    outPoint: inPoint + (clip.end - clip.start),
    options,
  });
}

export const totalLength = (spans: Span[]) => spans.reduce((s, x) => s + x.end - x.start, 0);

/** Cuts `silences` (source seconds) out of the clip and its linked sound, closing the gaps. */
export function removeSilences(project: Project, clipId: string, silences: Span[]): Project {
  const c = findClip(project, clipId);
  if (!c) return project;
  const ip = c.inPoint ?? 0;
  const ranges = silences
    .map((s) => ({
      start: Math.max(c.start, c.start + s.start - ip),
      end: Math.min(c.end, c.start + s.end - ip),
    }))
    .filter((r) => r.end > r.start);
  return cutTimelineRanges(project, ranges, linkedIds(project, clipId));
}

// ---------- Filler words ----------

export type FillerLang = "en" | "hi";

export interface FillerKind {
  id: string;
  label: string;
  lang: FillerLang;
  /** Lower-case phrases; several words are matched in sequence. */
  phrases: string[];
  /** Off until the user ticks it: often a real word. */
  optIn?: boolean;
  /** Only a filler when it stands apart (pause or comma around it). */
  contextual?: boolean;
}

/** Edit this list to tune filler detection per language. */
export const FILLER_KINDS: FillerKind[] = [
  { id: "um", label: "Um / hmm", lang: "en", phrases: ["um", "umm", "ummm", "hmm", "hm", "mm", "mmm"] },
  { id: "uh", label: "Uh / er", lang: "en", phrases: ["uh", "uhh", "uhm", "er", "erm", "ah", "ahh"] },
  { id: "like", label: "Like", lang: "en", phrases: ["like"], contextual: true },
  { id: "you-know", label: "You know", lang: "en", phrases: ["you know"] },
  { id: "i-mean", label: "I mean", lang: "en", phrases: ["i mean"] },
  { id: "basically", label: "Basically", lang: "en", phrases: ["basically"] },
  { id: "actually", label: "Actually", lang: "en", phrases: ["actually"], optIn: true },
  { id: "literally", label: "Literally", lang: "en", phrases: ["literally"], optIn: true },
  {
    id: "kind-of",
    label: "Kind of / sort of",
    lang: "en",
    phrases: ["kind of", "sort of", "kinda"],
    optIn: true,
  },
  { id: "aa", label: "Aa / hmm", lang: "hi", phrases: ["aa", "aaa", "à¤¹à¤®à¥à¤®", "à¤…", "à¤†"] },
  { id: "matlab", label: "Matlab", lang: "hi", phrases: ["matlab", "à¤®à¤¤à¤²à¤¬"] },
  {
    id: "haan",
    label: "Haan",
    lang: "hi",
    phrases: ["haan", "haa", "à¤¹à¤¾à¤", "à¤¹à¤¾à¤‚"],
    contextual: true,
  },
  { id: "yaani", label: "Yaani", lang: "hi", phrases: ["yaani", "yani", "à¤¯à¤¾à¤¨à¥€"] },
  {
    id: "aisa-hai",
    label: "Aisa hai ki",
    lang: "hi",
    phrases: ["aisa hai ki", "à¤à¤¸à¤¾ à¤¹à¥ˆ à¤•à¤¿"],
    optIn: true,
  },
  { id: "toh", label: "Toh", lang: "hi", phrases: ["toh", "à¤¤à¥‹"], optIn: true, contextual: true },
  {
    id: "acha",
    label: "Acha",
    lang: "hi",
    phrases: ["acha", "accha", "achha", "à¤…à¤šà¥à¤›à¤¾"],
    optIn: true,
  },
];

export const REPEAT_KIND = { id: "repeat", label: "Repeated words" } as const;
export const FALSE_START_KIND = { id: "false-start", label: "False starts" } as const;

/** Words "like" is a real verb/preposition after. */
const LIKE_KEEP = new Set(
  "i you we they he she it would do does did don't didn't i'd you'd look looks looked feel feels felt seem seems sound sounds something anything nothing more less much just exactly most really".split(
    " ",
  ),
);
/** Words people stammer on; other repeats ("jaldi jaldi") are usually meant. */
const STAMMER = new Set(
  "i the a an we it and so but to that this my is main hum ki ke ka ko jo ye wo yeh woh toh".split(" "),
);

export interface FillerHit {
  kind: string;
  /** Inclusive word indexes. */
  from: number;
  to: number;
  text: string;
  start: number;
  end: number;
}

export interface FillerOptions {
  languages: FillerLang[];
  /** Kind ids to remove, including "repeat" and "false-start". */
  enabled: string[];
}

export const defaultFillerOptions = (languages: FillerLang[] = ["en", "hi"]): FillerOptions => ({
  languages,
  enabled: [
    ...FILLER_KINDS.filter((k) => !k.optIn && languages.includes(k.lang)).map((k) => k.id),
    REPEAT_KIND.id,
    FALSE_START_KIND.id,
  ],
});

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{M}\p{N}']/gu, "");

/** Every filler, repeat and false start in `words`. */
export function findFillers(words: CaptionWord[], options: FillerOptions): FillerHit[] {
  const n = words.map((w) => norm(w.text));
  const enabled = new Set(options.enabled);
  const kinds = FILLER_KINDS.filter((k) => options.languages.includes(k.lang) && enabled.has(k.id))
    .flatMap((k) => k.phrases.map((p) => ({ kind: k, tokens: p.split(" ").map(norm) })))
    .sort((a, b) => b.tokens.length - a.tokens.length);
  const gap = (i: number, j: number) =>
    i < 0 || j >= words.length ? Infinity : words[j].start - words[i].end;
  const apart = (from: number, to: number) =>
    gap(from - 1, from) > 0.25 ||
    gap(to, to + 1) > 0.25 ||
    /[,.!?â€¦]$/.test(words[from - 1]?.text ?? ".") ||
    /[,.!?â€¦]$/.test(words[to].text);

  const hits: FillerHit[] = [];
  const add = (kind: string, from: number, to: number) =>
    hits.push({
      kind,
      from,
      to,
      text: words
        .slice(from, to + 1)
        .map((w) => w.text)
        .join(" "),
      start: words[from].start,
      end: words[to].end,
    });

  for (let i = 0; i < words.length; i++) {
    const match = kinds.find(({ tokens }) => tokens.every((t, k) => n[i + k] === t));
    if (match) {
      const to = i + match.tokens.length - 1;
      const keepLike = match.kind.id === "like" && LIKE_KEEP.has(n[i - 1] ?? "");
      if (!keepLike && (!match.kind.contextual || apart(i, to))) {
        add(match.kind.id, i, to);
        i = to;
        continue;
      }
    }
    if (enabled.has(FALSE_START_KIND.id) && /[-â€”â€“]$/.test(words[i].text.trim()) && i < words.length - 1) {
      add(FALSE_START_KIND.id, i, i);
      continue;
    }
    if (enabled.has(REPEAT_KIND.id) && n[i]) {
      if (n[i] === n[i + 1] && (STAMMER.has(n[i]) || gap(i, i + 1) > 0.15) && gap(i, i + 1) < 0.8) {
        add(REPEAT_KIND.id, i, i);
      } else if (n[i + 1] && n[i] === n[i + 2] && n[i + 1] === n[i + 3] && gap(i + 1, i + 2) < 0.8) {
        add(REPEAT_KIND.id, i, i + 1); // "I think I think"
        i += 1;
      }
    }
  }
  return hits;
}

/** How many of each kind, for the checklist. */
export function countFillers(words: CaptionWord[], languages: FillerLang[]) {
  const all = findFillers(words, {
    languages,
    enabled: [...FILLER_KINDS.map((k) => k.id), REPEAT_KIND.id, FALSE_START_KIND.id],
  });
  const counts = new Map<string, number>();
  for (const h of all) counts.set(h.kind, (counts.get(h.kind) ?? 0) + 1);
  return counts;
}

/** Every caption word in the project, in timeline seconds. */
export function collectWords(project: Project): CaptionWord[] {
  const seen = new Set<number>();
  return project.tracks
    .flatMap((t) => t.clips.flatMap((c) => c.words ?? []))
    .filter((w) => !seen.has(w.start) && seen.add(w.start))
    .sort(byStart);
}

/** Removes filler words (and their video/sound) from the timeline. */
export function removeFillers(project: Project, words: CaptionWord[], options: FillerOptions): Project {
  const sorted = [...words].sort(byStart);
  const ranges = findFillers(sorted, options).map((h) => {
    // Take half the gap to each neighbour (max 0.15 s) so no breath clicks remain.
    const before = h.from > 0 ? (sorted[h.from].start - sorted[h.from - 1].end) / 2 : 0.15;
    const after = h.to < sorted.length - 1 ? (sorted[h.to + 1].start - sorted[h.to].end) / 2 : 0.15;
    return {
      start: h.start - Math.min(0.15, Math.max(0, before)),
      end: h.end + Math.min(0.15, Math.max(0, after)),
    };
  });
  return cutTimelineRanges(project, ranges);
}

// ---------- Punch-in zooms ----------

export interface EmphasisMoment {
  /** Source-file seconds. */
  t: number;
  strength: number;
}

export function detectEmphasis(clip: Clip): Promise<EmphasisMoment[]> {
  if (!clip.source?.hasAudio) return Promise.resolve([]);
  const inPoint = clip.inPoint ?? 0;
  return invoke<EmphasisMoment[]>("detect_emphasis", {
    path: clip.source.path,
    inPoint,
    outPoint: inPoint + (clip.end - clip.start),
  });
}

const PUNCH_IN = 0.25;
const PUNCH_HOLD = 1.0;
const PUNCH_OUT = 0.35;
const easeOut = (x: number) => 1 - (1 - x) ** 3;
const easeInOut = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);

/**
 * Total zoom (clip zoom Ã— punch-in) at `localTime` seconds from the clip start.
 * Each key eases in over 0.25 s, holds 1 s, then eases back out.
 */
export function zoomAt(clip: Clip, localTime: number): number {
  let punch = 1;
  for (const k of clip.zoomKeys ?? []) {
    const d = localTime - k.t;
    if (d < 0 || d > PUNCH_IN + PUNCH_HOLD + PUNCH_OUT) continue;
    const env =
      d < PUNCH_IN
        ? easeOut(d / PUNCH_IN)
        : d < PUNCH_IN + PUNCH_HOLD
          ? 1
          : 1 - easeInOut((d - PUNCH_IN - PUNCH_HOLD) / PUNCH_OUT);
    punch = Math.max(punch, 1 + (k.zoom - 1) * env);
  }
  // Template slow push-in: eases from 1 to 1 + push over the clip.
  const len = clip.end - clip.start;
  const push = clip.fx?.push && len > 0 ? 1 + clip.fx.push * easeInOut(Math.min(1, Math.max(0, localTime / len))) : 1;
  return (clip.zoom ?? 1) * punch * push;
}

/** Timeline times of caption words said loudly: ALL CAPS or with "!". */
export function captionEmphasisTimes(words: CaptionWord[]): number[] {
  return words
    .filter((w) => {
      const letters = w.text.replace(/[^\p{L}]/gu, "");
      return (
        w.text.includes("!") ||
        (letters.length >= 2 && /\p{Lu}/u.test(letters) && letters === letters.toUpperCase())
      );
    })
    .map((w) => w.start);
}

/**
 * Sets punch-in keys on video clips. `moments` is per clip id (source seconds);
 * `intensity` 0..1 (0.75 â‰ˆ a 1.15Ã— punch on the biggest moments).
 */
export function applyPunchIns(
  project: Project,
  moments: Record<string, EmphasisMoment[]>,
  intensity: number,
  captionTimes: number[] = [],
): Project {
  const amount = 0.2 * clamp01(intensity);
  return {
    ...project,
    updatedAt: Date.now(),
    tracks: project.tracks.map((t) =>
      t.kind !== "video"
        ? t
        : {
            ...t,
            clips: t.clips.map((c) => {
              if (c.variant) return c;
              const ip = c.inPoint ?? 0;
              const len = c.end - c.start;
              const found = [
                // Start a beat early so the zoom lands on the word.
                ...(moments[c.id] ?? []).map((m) => ({ t: m.t - ip - 0.08, strength: m.strength })),
                ...captionTimes.map((t) => ({ t: t - c.start - 0.08, strength: 0.8 })),
              ]
                .filter((m) => m.t >= 0 && m.t < len - PUNCH_IN)
                .sort((a, b) => b.strength - a.strength);
              const keys: { t: number; zoom: number }[] = [];
              for (const m of found) {
                if (keys.every((k) => Math.abs(k.t - m.t) > PUNCH_IN + PUNCH_HOLD)) {
                  keys.push({
                    t: +m.t.toFixed(3),
                    zoom: +(1 + amount * (0.6 + 0.4 * m.strength)).toFixed(3),
                  });
                }
              }
              keys.sort((a, b) => a.t - b.t);
              return { ...c, zoomKeys: keys.length ? keys : undefined };
            }),
          },
    ),
  };
}

export function clearPunchIns(project: Project): Project {
  return {
    ...project,
    updatedAt: Date.now(),
    tracks: project.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => (c.zoomKeys ? { ...c, zoomKeys: undefined } : c)),
    })),
  };
}

export const hasPunchIns = (project: Project) => videoClips(project).some((c) => c.zoomKeys?.length);

// ---------- Beat sync ----------

export interface BeatInfo {
  bpm: number;
  /** Source-file seconds. */
  beats: number[];
}

const beatCache = new Map<string, Promise<BeatInfo>>();

/** Tempo and beats of a music file (cached here and on disk by Rust). */
export function detectBeats(media: MediaInfo): Promise<BeatInfo> {
  let pending = beatCache.get(media.path);
  if (!pending) {
    pending = invoke<BeatInfo>("detect_beats", { path: media.path, durationSec: media.durationSec });
    pending.catch(() => beatCache.delete(media.path));
    beatCache.set(media.path, pending);
  }
  return pending;
}

/** A music clip's beats as timeline seconds (only the part that's on the timeline). */
export function beatMarkers(musicClip: Clip, beats: number[]): number[] {
  const ip = musicClip.inPoint ?? 0;
  const len = musicClip.end - musicClip.start;
  return beats.filter((b) => b >= ip && b <= ip + len).map((b) => musicClip.start + (b - ip));
}

/** Moves the cut after clip `aId` (at `cut`) by `delta`, rippling later clips. Music stays put. */
function shiftCut(project: Project, aId: string, cut: number, delta: number): Project {
  const group = linkedIds(project, aId);
  return {
    ...project,
    updatedAt: Date.now(),
    tracks: project.tracks.map((t) =>
      t.kind === "music"
        ? t
        : {
            ...t,
            clips: t.clips.map((c) => {
              if (group.has(c.id)) return { ...c, end: c.end + delta };
              if (c.start < cut - 0.01) return c;
              return {
                ...c,
                start: c.start + delta,
                end: c.end + delta,
                words: c.words?.map((w) => ({ ...w, start: w.start + delta, end: w.end + delta })),
              };
            }),
          },
    ),
  };
}

/**
 * Moves each cut between back-to-back video clips onto the nearest beat
 * (timeline seconds) within a tolerance set by `strength` 0..1 (up to 0.25 s),
 * by trimming the outgoing clip and its sound. Later clips ripple along.
 */
export function snapCutsToBeats(project: Project, beats: number[], strength: number): Project {
  const tol = 0.04 + 0.21 * clamp01(strength);
  const sorted = [...beats].sort((a, b) => a - b);
  let p = project;
  for (let i = 0; ; i++) {
    const clips = videoClips(p);
    if (i >= clips.length - 1) break;
    const a = clips[i];
    const b = clips[i + 1];
    if (Math.abs(a.end - b.start) > 0.02) continue;
    const cut = a.end;
    const room = a.source ? a.source.durationSec - ((a.inPoint ?? 0) + (a.end - a.start)) : Infinity;
    const options = sorted.filter(
      (bt) =>
        Math.abs(bt - cut) <= tol && (bt < cut ? bt - a.start >= MIN_CLIP_SECONDS * 2 : bt - cut <= room),
    );
    const target = options.sort((x, y) => Math.abs(x - cut) - Math.abs(y - cut))[0];
    if (target === undefined || Math.abs(target - cut) < 0.005) continue;
    p = shiftCut(p, a.id, cut, target - cut);
  }
  return p;
}
