// Design rules every template follows (docs/templates/TEMPLATE-BRIEF.md, "Design rules").
// withRules enforces them on the template data at load, so pack files can stay as authored.
import type { AspectRatio, Look } from "../lib/project";
import type { PackId, Template, TemplateSlot, TemplateText, TextRole } from "./types";

/** Platform UI covers these edges of a 9:16 frame (fractions of width/height). */
export const SAFE_ZONE = { top: 0.1, bottom: 0.2, right: 0.12 };
/**
 * Edges each shape loses: Reels/Shorts UI on 9:16; the profile grid's 3:4 crop
 * on a 4:5 feed post (left and right); nothing fixed on 1:1 and 16:9.
 */
export function safeZoneFor(aspect: AspectRatio) {
  if (aspect === "9:16") return { ...SAFE_ZONE, left: 0 };
  if (aspect === "4:5") return { top: 0, bottom: 0, right: (1 - 0.75 / 0.8) / 2, left: (1 - 0.75 / 0.8) / 2 };
  return { top: 0, bottom: 0, right: 0, left: 0 };
}
/** The hook slot ends by this many seconds. */
export const HOOK_MAX_SECONDS = 3;
/** Smallest text on a 1080x1920 canvas, as a fraction of canvas height. */
export const SIZE_FLOOR = { latin: 56 / 1920, devanagari: 64 / 1920 };
/** Longest dip to black at the ends: a quick fade, never a black hold. */
const MAX_DIP = 0.25;

/** Seconds a cut may move to land on a beat, per pack (tight for trend edits, loose for talk). */
export const BEAT_SNAP_TOLERANCE: Record<PackId, number> = {
  trending: 0.08,
  creator: 0.1,
  festive: 0.1,
  business: 0.12,
  cinematic: 0.15,
  podcast: 0.25,
};

export const beatSnapTolerance = (t: Template) => t.beatSnap ?? BEAT_SNAP_TOLERANCE[t.pack];

const DEVANAGARI = /[ऀ-ॿ]/;
export const sizeFloor = (text: string) => (DEVANAGARI.test(text) ? SIZE_FLOOR.devanagari : SIZE_FLOOR.latin);

/** Keeps a text centre line out of the top and bottom safe zones (2% margin). */
export const clampTextY = (y: number) =>
  Math.min(1 - SAFE_ZONE.bottom - 0.02, Math.max(SAFE_ZONE.top + 0.02, y));

/** A grade plus at most two of grain / vignette / letterbox (vignette goes first). */
export function limitLook(look: Look | undefined): Look | undefined {
  if (!look) return look;
  const extras = [look.grain, look.vignette, look.letterbox].filter(Boolean).length;
  return extras > 2 ? { ...look, vignette: undefined } : look;
}

/** First line is the headline, the last (if more than one) the CTA, the rest points. */
function inferRole(i: number, count: number): TextRole {
  return i === 0 ? "headline" : i === count - 1 ? "cta" : "point";
}

/** Splits a long first slot so the hook cuts by HOOK_MAX_SECONDS; the rest keeps the same framing. */
function capHook(slots: TemplateSlot[]): TemplateSlot[] {
  const [hook, ...rest] = slots;
  if (!hook || hook.segments || hook.end - hook.start <= HOOK_MAX_SECONDS) return slots;
  const cut = hook.start + HOOK_MAX_SECONDS;
  const head: TemplateSlot = {
    ...hook,
    end: cut,
    punch: hook.punch?.filter((t) => t < HOOK_MAX_SECONDS),
    ramp: undefined,
  };
  const tail: TemplateSlot = {
    ...hook,
    id: `${hook.id}-b`,
    start: cut,
    hint: `${hook.hint} (keep going)`,
    transition: undefined,
    punch: hook.punch?.filter((t) => t >= HOOK_MAX_SECONDS).map((t) => t - HOOK_MAX_SECONDS),
    ramp: undefined,
  };
  return [head, tail, ...rest];
}

/** Light leaks flash on at most two transitions. */
function limitLeaks(look: Look | undefined, slots: TemplateSlot[]): Look | undefined {
  const leak = look?.leak;
  if (!look || !leak || (leak.at && leak.at.length <= 2)) return look;
  const cuts = slots.filter((s) => s.transition).map((s) => s.start);
  const at = (cuts.length ? cuts : slots.slice(1).map((s) => s.start)).slice(0, 2);
  return { ...look, leak: { ...leak, at: leak.at?.length ? leak.at.slice(0, 2) : at } };
}

function textRules(texts: TemplateText[]): TemplateText[] {
  const first = Math.min(...texts.map((x) => x.start));
  return texts.map((x, i) => ({
    ...x,
    role: x.role ?? inferRole(i, texts.length),
    y: clampTextY(x.y),
    // Text on frame 0: the earliest layer starts with the reel.
    start: x.start === first ? 0 : x.start,
  }));
}

export function withRules(t: Template): Template {
  const slots = capHook(t.slots).map((s) => ({
    ...s,
    minClip: s.minClip ?? Math.ceil((s.end - s.start) * (s.speed ?? 1) * 10) / 10,
  }));
  const look = limitLeaks(limitLook(t.look), slots);
  return {
    ...t,
    slots,
    texts: t.texts.length ? textRules(t.texts) : t.texts,
    look: look?.dip ? { ...look, dip: Math.min(look.dip, MAX_DIP) } : look,
  };
}
