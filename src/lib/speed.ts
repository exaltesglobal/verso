// Speed ramps and freeze frames. Pure helpers plus one Rust call (render_still).
// Ramp keys: `t` is 0..1 across the clip's source span, `speed` 0.1..10.
// Export twin: src-tauri/src/export/color.rs (ramp_segments, still_input_args).
import { invoke } from "@tauri-apps/api/core";
import { findClip, linkedIds, splitClip, uid, type Clip, type Project } from "./project";

export type RampKey = { t: number; speed: number };

export const RAMP_PRESETS: { id: string; label: string; hint: string; keys: RampKey[] }[] = [
  {
    id: "smooth-in",
    label: "Smooth in",
    hint: "Starts slow, then speeds up",
    keys: [
      { t: 0, speed: 0.5 },
      { t: 1, speed: 1.6 },
    ],
  },
  {
    id: "smooth-out",
    label: "Smooth out",
    hint: "Starts fast, then eases off",
    keys: [
      { t: 0, speed: 1.6 },
      { t: 1, speed: 0.5 },
    ],
  },
  {
    id: "bullet",
    label: "Bullet",
    hint: "Fast, slow in the middle, fast again",
    keys: [
      { t: 0, speed: 2.5 },
      { t: 0.35, speed: 2.5 },
      { t: 0.45, speed: 0.3 },
      { t: 0.55, speed: 0.3 },
      { t: 0.65, speed: 2.5 },
      { t: 1, speed: 2.5 },
    ],
  },
  {
    id: "hero",
    label: "Hero moment",
    hint: "Normal speed, then a slow-motion finish",
    keys: [
      { t: 0, speed: 1 },
      { t: 0.6, speed: 1 },
      { t: 0.75, speed: 0.35 },
      { t: 1, speed: 0.35 },
    ],
  },
];

const clampSpeed = (s: number) => Math.min(10, Math.max(0.1, s));

/** Speed at `u` (0..1), linear between keys. Same maths as ramp_speed_at in Rust. */
export function rampSpeedAt(keys: RampKey[], u: number): number {
  if (!keys.length) return 1;
  const i = keys.findIndex((k) => k.t > u);
  if (i === 0) return clampSpeed(keys[0].speed);
  if (i === -1) return clampSpeed(keys[keys.length - 1].speed);
  const a = keys[i - 1];
  const b = keys[i];
  const f = Math.min(1, Math.max(0, (u - a.t) / Math.max(1e-9, b.t - a.t)));
  return clampSpeed(a.speed + (b.speed - a.speed) * f);
}

const STEPS = 200;

/** Timeline seconds per source second over the whole ramp (integral of 1/speed). */
export function rampTimeFactor(keys: RampKey[]): number {
  if (!keys.length) return 1;
  let sum = 0;
  for (let j = 0; j < STEPS; j++) sum += 1 / rampSpeedAt(keys, (j + 0.5) / STEPS);
  return sum / STEPS;
}

/** Source seconds the clip covers. */
export function sourceSpan(clip: Clip): number {
  return (clip.end - clip.start) / rampTimeFactor(clip.speedRamp ?? []);
}

/** Source time shown at timeline `time` (inverse of the ramp). */
export function sourceTimeAt(clip: Clip, time: number): number {
  const inPoint = clip.inPoint ?? 0;
  const local = Math.max(0, time - clip.start);
  const keys = clip.speedRamp ?? [];
  if (!keys.length) return inPoint + local;
  const span = sourceSpan(clip);
  const du = 1 / STEPS;
  let acc = 0;
  for (let j = 0; j < STEPS; j++) {
    const piece = (span * du) / rampSpeedAt(keys, (j + 0.5) * du);
    if (acc + piece >= local) return inPoint + span * (j + (local - acc) / piece) * du;
    acc += piece;
  }
  return inPoint + span;
}

/** `video.playbackRate` for the clip at timeline `time`. */
export function playbackRateAt(clip: Clip, time: number): number {
  const keys = clip.speedRamp ?? [];
  if (!keys.length) return 1;
  const span = sourceSpan(clip);
  return rampSpeedAt(keys, span > 0 ? (sourceTimeAt(clip, time) - (clip.inPoint ?? 0)) / span : 0);
}

/**
 * Sets (or clears, with `keys` undefined) the ramp on a clip and its linked
 * sound, changes their length to match, and moves later video/sound clips.
 */
export function applySpeedRamp(project: Project, clipId: string, keys: RampKey[] | undefined): Project {
  const clip = findClip(project, clipId);
  if (!clip) return project;
  const ids = linkedIds(project, clipId);
  const factor = rampTimeFactor(keys ?? []);
  const newEnd = clip.start + sourceSpan(clip) * factor;
  const delta = newEnd - clip.end;
  return {
    ...project,
    updatedAt: Date.now(),
    tracks: project.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (ids.has(c.id)) return { ...c, speedRamp: keys, end: c.start + sourceSpan(c) * factor };
        if ((t.kind === "video" || t.kind === "audio") && c.start >= clip.end - 1e-6)
          return { ...c, start: c.start + delta, end: c.end + delta };
        return c;
      }),
    })),
  };
}

/** PNG of one source frame, rendered once into the app cache. */
export function renderStill(path: string, time: number): Promise<string> {
  return invoke<string>("render_still", { path, time });
}

/**
 * Splits the video clip at `time`, inserts a still of that frame for
 * `duration` seconds, and pushes everything after it along (sound pauses).
 */
export function insertStill(
  project: Project,
  clipId: string,
  time: number,
  duration: number,
  stillPath: string,
): Project {
  const clip = findClip(project, clipId);
  if (!clip) return project;
  const { project: split } = splitClip(project, clipId, time);
  const still: Clip = {
    id: uid("v"),
    label: "Freeze frame",
    start: time,
    end: time + duration,
    still: { path: stillPath },
    color: clip.color,
  };
  return {
    ...split,
    updatedAt: Date.now(),
    tracks: split.tracks.map((t) => {
      if (t.kind !== "video" && t.kind !== "audio") return t;
      const moved = t.clips.map((c) =>
        c.start >= time - 1e-6 ? { ...c, start: c.start + duration, end: c.end + duration } : c,
      );
      return {
        ...t,
        clips: t.kind === "video" ? [...moved, still].sort((a, b) => a.start - b.start) : moved,
      };
    }),
  };
}

/** Freeze frame at the playhead: renders the PNG, then inserts it. */
export async function freezeFrame(
  project: Project,
  clipId: string,
  time: number,
  duration: number,
): Promise<Project> {
  const clip = findClip(project, clipId);
  if (!clip?.source?.hasVideo || clip.kind !== "video" || time < clip.start || time > clip.end)
    throw new Error("Put the playhead over a video clip to freeze it.");
  const path = await renderStill(clip.source.path, sourceTimeAt(clip, time));
  return insertStill(project, clipId, time, duration, path);
}
