// Hook generator and watch-time predictor. Pure heuristics over the project
// and its captions: no network, no model, instant.

import { hookStrength, toSentences, type Sentence, type TranscriptWord } from "./autoclips";
import { addTextClip, projectDuration, uid, type Clip, type Project } from "./project";

// ---------- Transcript from the project ----------

/** Words in timeline seconds, from caption clips (word timings when present). */
export function projectWords(project: Project): TranscriptWord[] {
  const caps = project.tracks.find((t) => t.kind === "captions")?.clips ?? [];
  return caps.flatMap((c) => {
    if (c.words?.length) return c.words.map((w) => ({ text: w.text, start: w.start, end: w.end }));
    const parts = (c.text ?? c.label).split(/\s+/).filter(Boolean);
    const step = (c.end - c.start) / Math.max(1, parts.length);
    return parts.map((t, i) => ({ text: t, start: c.start + i * step, end: c.start + (i + 1) * step }));
  });
}

// ---------- Hook generator ----------

export interface HookIdea {
  id: string;
  /** Short on-screen title for the first seconds. */
  title: string;
  why: string;
  /** If set, this sentence makes a strong cold open (timeline seconds). */
  coldOpen?: { start: number; end: number; text: string };
}

const isHindi = (s: string) => /[ऀ-ॿ]/.test(s);
const words = (s: string) =>
  s
    .replace(/[“”"']/g, "")
    .split(/\s+/)
    .filter(Boolean);
const clip = (s: string, n: number) => {
  const w = words(s);
  return w.length > n ? `${w.slice(0, n).join(" ")}…` : w.join(" ");
};
const cap = (s: string) => s.replace(/^./, (c) => c.toUpperCase());

/** Title patterns that work for reels, in English and Hindi/Hinglish. */
function titlesFrom(s: Sentence): string[] {
  const core = clip(s.text.replace(/[.!?।]+$/, ""), 7);
  const number = s.text.match(/\d+[\d,.]*\s*\w+/)?.[0];
  if (isHindi(s.text)) {
    return [core, `ये बात कोई नहीं बताता`, number ? `${number} — सच जानिए` : `आख़िर तक देखिए`];
  }
  const ideas = [cap(core)];
  if (/\?$/.test(s.text.trim())) ideas.push(cap(core.endsWith("?") ? core : `${core}?`));
  else ideas.push(`Why ${core.charAt(0).toLowerCase()}${core.slice(1)}?`);
  if (number) ideas.push(`${cap(number)}: here's what happened`);
  ideas.push("Nobody tells you this", "Watch till the end");
  return ideas;
}

export function hookIdeas(project: Project, max = 6): HookIdea[] {
  const sentences = toSentences(projectWords(project));
  if (!sentences.length) {
    return [
      { id: uid("h"), title: "Wait for it…", why: "A simple promise keeps people watching." },
      { id: uid("h"), title: "You need to see this", why: "Direct and personal." },
      { id: uid("h"), title: "3 things I wish I knew", why: "Numbered lists set clear expectations." },
    ];
  }
  const scored = sentences
    .map((s) => ({ s, ...hookStrength(s) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const out: HookIdea[] = [];
  for (const { s, reasons } of scored) {
    const first = s.start < 1.5;
    for (const t of titlesFrom(s)) {
      if (out.length >= max) break;
      if (out.some((o) => o.title === t)) continue;
      out.push({
        id: uid("h"),
        title: t,
        why: reasons[0] ?? "A clear, complete thought",
        coldOpen: first ? undefined : { start: s.start, end: s.end, text: s.text },
      });
    }
  }
  return out;
}

/** Adds a bold title over the first 3 seconds. */
export function applyHookTitle(project: Project, title: string): Project {
  const { project: next, id } = addTextClip(project, 0, "boxed", title);
  return {
    ...next,
    tracks: next.tracks.map((t) =>
      t.kind === "text"
        ? {
            ...t,
            clips: t.clips.map((c) =>
              c.id === id
                ? {
                    ...c,
                    end: Math.min(3, Math.max(1.5, projectDuration(project))),
                    style: { ...c.style!, y: 0.16, color: "#0B0B0F" },
                  }
                : c,
            ),
          }
        : t,
    ),
  };
}

/**
 * Cold open: copies the strongest moment (video + its sound) to the start, so
 * the reel opens on its best line, and shifts everything else right.
 */
export function applyColdOpen(project: Project, range: { start: number; end: number }): Project {
  const len = range.end - range.start;
  const copyRange = (c: Clip): Clip | null => {
    const s = Math.max(c.start, range.start);
    const e = Math.min(c.end, range.end);
    if (e - s < 0.05 || !c.source) return null;
    return {
      ...c,
      id: uid(c.id[0] ?? "c"),
      start: s - range.start,
      end: e - range.start,
      inPoint: (c.inPoint ?? 0) + (s - c.start),
      transitionIn: undefined,
    };
  };
  const link = uid("l");
  return {
    ...project,
    updatedAt: Date.now(),
    tracks: project.tracks.map((t) => {
      const shifted = t.clips.map((c) => ({ ...c, start: c.start + len, end: c.end + len }));
      if (t.kind !== "video" && t.kind !== "audio") return t.kind === "music" ? t : { ...t, clips: shifted };
      const copies = t.clips
        .map(copyRange)
        .filter((c): c is Clip => !!c)
        .map((c) => ({ ...c, linkId: link }));
      return { ...t, clips: [...copies, ...shifted] };
    }),
  };
}

// ---------- Watch-time predictor ----------

export interface Check {
  id: string;
  ok: boolean;
  label: string;
  detail: string;
  /** Which tool fixes it, if any. */
  fix?: "captions" | "hook" | "pauses" | "trim" | "aspect" | "music";
  weight: number;
}

export interface WatchTimeReport {
  /** 0..100 */
  score: number;
  /** Rough share of the reel an average viewer watches. */
  predictedWatchPercent: number;
  checks: Check[];
}

/** `peaks` are loudness values 0..1 across the reel's main sound, if available. */
export function predictWatchTime(project: Project, peaks?: number[]): WatchTimeReport {
  const duration = projectDuration(project);
  const video = project.tracks.find((t) => t.kind === "video")?.clips.filter((c) => !c.variant) ?? [];
  const text = project.tracks.find((t) => t.kind === "text")?.clips ?? [];
  const caps = project.tracks.find((t) => t.kind === "captions")?.clips ?? [];
  const music = project.tracks.find((t) => t.kind === "music")?.clips ?? [];
  const tw = projectWords(project);
  const sentences = toSentences(tw);
  const checks: Check[] = [];

  const add = (c: Check) => checks.push(c);

  // 1. Hook in the first 3 seconds.
  const earlyText = text.some((c) => c.start < 1.5);
  const firstSentence = sentences.find((s) => s.start < 3);
  const hook = firstSentence ? hookStrength(firstSentence).score : 0;
  add({
    id: "hook",
    ok: earlyText || hook >= 18,
    label: earlyText || hook >= 18 ? "Strong opening" : "Weak first 3 seconds",
    detail: earlyText
      ? "There's a title on screen right away."
      : hook >= 18
        ? "Your first line grabs attention."
        : "Add a title or open on your best line.",
    fix: "hook",
    weight: 22,
  });

  // 2. Length sweet spot.
  const goodLen = duration >= 12 && duration <= 45;
  add({
    id: "length",
    ok: goodLen,
    label: goodLen ? "Good length" : duration < 12 ? "Very short" : "On the long side",
    detail: `${Math.round(duration)} s. Reels between 15 and 40 seconds keep the most viewers.`,
    fix: goodLen ? undefined : "trim",
    weight: 14,
  });

  // 3. Captions.
  const capCoverage = duration ? caps.reduce((n, c) => n + (c.end - c.start), 0) / duration : 0;
  add({
    id: "captions",
    ok: capCoverage > 0.5,
    label: capCoverage > 0.5 ? "Captions on" : "No captions",
    detail:
      capCoverage > 0.5
        ? "Most people watch with the sound off."
        : "Most people watch with the sound off. Add captions.",
    fix: capCoverage > 0.5 ? undefined : "captions",
    weight: 18,
  });

  // 4. Pace: average shot length.
  const shots = Math.max(1, video.length);
  const avgShot = duration / shots;
  const zooms = video.reduce((n, c) => n + (c.zoomKeys?.length ?? 0), 0);
  const lively = avgShot <= 6 || zooms >= duration / 8;
  add({
    id: "pace",
    ok: lively,
    label: lively ? "Lively pace" : "Long shots",
    detail: lively
      ? "Cuts or zooms keep the eye moving."
      : `Shots last about ${Math.round(avgShot)} s. Try punch-in zooms or a cut every few seconds.`,
    weight: 12,
  });

  // 5. Dead air.
  let silentShare = 0;
  if (peaks?.length) silentShare = peaks.filter((p) => p < 0.08).length / peaks.length;
  else if (tw.length > 1) {
    let gaps = 0;
    for (let i = 1; i < tw.length; i++) gaps += Math.max(0, tw[i].start - tw[i - 1].end - 0.4);
    silentShare = duration ? gaps / duration : 0;
  }
  add({
    id: "pauses",
    ok: silentShare < 0.12,
    label: silentShare < 0.12 ? "Tight, no dead air" : "Long pauses",
    detail:
      silentShare < 0.12
        ? "Speech flows without gaps."
        : `About ${Math.round(silentShare * 100)}% is quiet. Remove pauses to tighten it.`,
    fix: silentShare < 0.12 ? undefined : "pauses",
    weight: 12,
  });

  // 6. Vertical canvas.
  add({
    id: "aspect",
    ok: project.aspect === "9:16",
    label: project.aspect === "9:16" ? "Full-screen vertical" : "Not vertical",
    detail:
      project.aspect === "9:16"
        ? "Fills the phone screen."
        : "9:16 fills the screen on Reels, Shorts and TikTok.",
    fix: project.aspect === "9:16" ? undefined : "aspect",
    weight: 8,
  });

  // 7. Ending that invites a replay or reply.
  const last = sentences[sentences.length - 1];
  const strongEnd =
    !!last &&
    (/\?$/.test(last.text.trim()) ||
      /follow|comment|share|save|part 2|subscribe|फॉलो|कमेंट/i.test(last.text));
  add({
    id: "ending",
    ok: strongEnd,
    label: strongEnd ? "Ends with a call to action" : "Flat ending",
    detail: strongEnd
      ? "A question or ask at the end boosts comments."
      : "End with a question or ask people to follow for part 2.",
    weight: 8,
  });

  // 8. Sound bed.
  add({
    id: "music",
    ok: music.length > 0 || tw.length / Math.max(1, duration) > 1.5,
    label: music.length ? "Music added" : "No music",
    detail: music.length
      ? "A soft music bed fills quiet moments."
      : "A quiet music bed can help, especially without much talking.",
    fix: music.length ? undefined : "music",
    weight: 6,
  });

  const total = checks.reduce((n, c) => n + c.weight, 0);
  const got = checks.reduce((n, c) => n + (c.ok ? c.weight : 0), 0);
  const score = Math.round((got / total) * 100);
  // Map score to a plausible average-watch range (short reels watch longer).
  const lenFactor = duration <= 20 ? 1.1 : duration <= 40 ? 1 : 0.85;
  const predictedWatchPercent = Math.max(15, Math.min(95, Math.round((25 + score * 0.6) * lenFactor)));
  return {
    score,
    predictedWatchPercent,
    checks: checks.sort((a, b) => Number(a.ok) - Number(b.ok) || b.weight - a.weight),
  };
}
