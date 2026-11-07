// Smart reframing: talks to the Rust `reframe` commands and turns a CropPath
// into preview CSS and export crop rects. All times are source-file seconds;
// all rects are normalised (0..1) to the source frame.
import type { CSSProperties } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { Clip } from "./project";

export type ReframeMode = "centre" | "follow_subject" | "follow_speaker" | "active_speaker" | "split_two";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Speaker {
  id: number;
  label: string;
  thumbnailPath: string | null;
  talkTimeSec: number;
}

export interface TrackBox extends Rect {
  t: number;
  score: number;
}

export interface FaceTrack {
  id: number;
  speakerId: number;
  boxes: TrackBox[];
}

export interface SpeechSegment {
  start: number;
  end: number;
  speakerId: number | null;
}

export interface ReframeAnalysis {
  analysisId: string;
  sourcePath: string;
  sourceWidth: number;
  sourceHeight: number;
  inPoint: number;
  outPoint: number;
  sampleFps: number;
  speakers: Speaker[];
  faceTracks: FaceTrack[];
  speechSegments: SpeechSegment[];
  models: string[];
}

export interface CropKeyframe {
  t: number;
  rects: Rect[];
}

export interface CropPath {
  mode: ReframeMode;
  aspect: string;
  layout: "single" | "stacked" | "side_by_side";
  keyframes: CropKeyframe[];
}

export interface PlanOptions {
  zoom?: number;
  smoothingSec?: number;
  deadZone?: number;
  minHoldSec?: number;
  switchDelaySec?: number;
  transition?: "cut" | "pan";
  speakerId?: number;
  speakerIds?: number[];
}

export interface ReframeModel {
  id: string;
  name: string;
  purpose: string;
  sizeBytes: number;
  licence: string;
  required: boolean;
  installed: boolean;
}

export const reframeModels = () => invoke<ReframeModel[]>("reframe_models");

/** Downloads one model; `onPercent` gets 0..100. */
export async function downloadReframeModel(id: string, onPercent?: (p: number) => void): Promise<void> {
  const off = await listen<{ id: string; percent: number }>("reframe://download", (e) => {
    if (e.payload.id === id) onPercent?.(e.payload.percent);
  });
  try {
    await invoke("download_reframe_model", { id });
  } finally {
    off();
  }
}

/** Finds speakers in a source range. Resolves when the background job finishes. */
export async function analyzeReframe(
  path: string,
  inPoint: number,
  outPoint: number | undefined,
  onProgress?: (percent: number, stage: string) => void,
): Promise<ReframeAnalysis> {
  let jobId: string | undefined;
  // Events can arrive before invoke() returns the id, so buffer until we know it.
  const early: { event: string; payload: { jobId: string } & Record<string, unknown> }[] = [];
  let settle: ((e: (typeof early)[number]) => void) | undefined;
  const done = new Promise<ReframeAnalysis>((resolve, reject) => {
    settle = ({ event, payload }) => {
      if (event === "progress") onProgress?.(payload.percent as number, payload.stage as string);
      if (event === "done") resolve(payload.analysis as ReframeAnalysis);
      if (event === "error") reject(new Error(payload.message as string));
    };
  });
  const handle = (event: string) => (e: { payload: { jobId: string } & Record<string, unknown> }) => {
    if (jobId === undefined) early.push({ event, payload: e.payload });
    else if (e.payload.jobId === jobId) settle?.({ event, payload: e.payload });
  };
  const offs = await Promise.all([
    listen("reframe://progress", handle("progress")),
    listen("reframe://done", handle("done")),
    listen("reframe://error", handle("error")),
  ]);
  try {
    jobId = await invoke<string>("analyze_reframe", { path, inPoint, outPoint: outPoint ?? null });
    early.filter((e) => e.payload.jobId === jobId).forEach((e) => settle?.(e));
    return await done;
  } finally {
    offs.forEach((off) => off());
  }
}

export const planCrop = (analysisId: string, aspect: string, mode: ReframeMode, options: PlanOptions = {}) =>
  invoke<CropPath>("plan_crop", { analysisId, aspect, mode, options });

/** Source-file time for a timeline time inside `clip`. */
export const sourceTimeFor = (clip: Clip, timelineTime: number) =>
  (clip.inPoint ?? 0) + (timelineTime - clip.start);

/** Crop rects at source time `t` (linear between keyframes; cuts are 1 ms keyframe pairs). */
export function sampleCropPath(path: CropPath, t: number): Rect[] {
  const k = path.keyframes;
  if (!k.length) return [];
  if (t <= k[0].t) return k[0].rects;
  if (t >= k[k.length - 1].t) return k[k.length - 1].rects;
  let lo = 0;
  let hi = k.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (k[mid].t <= t) lo = mid;
    else hi = mid;
  }
  const a = k[lo];
  const b = k[hi];
  const f = (t - a.t) / Math.max(1e-9, b.t - a.t);
  return a.rects.map((r, i) => {
    const s = b.rects[i] ?? r;
    return {
      x: r.x + (s.x - r.x) * f,
      y: r.y + (s.y - r.y) * f,
      w: r.w + (s.w - r.w) * f,
      h: r.h + (s.h - r.h) * f,
    };
  });
}

/**
 * Style for a `<video>`/`<img>` inside an `overflow: hidden; position: relative`
 * box that has the crop's aspect: scales and shifts the full frame so only
 * `rect` shows. Exact for any zoom.
 */
export function cropStyle(rect: Rect): CSSProperties {
  return {
    position: "absolute",
    width: `${100 / rect.w}%`,
    height: `${100 / rect.h}%`,
    left: `${(-rect.x / rect.w) * 100}%`,
    top: `${(-rect.y / rect.h) * 100}%`,
    maxWidth: "none",
    objectFit: "fill",
  };
}

/** For a plain `object-fit: cover` element (zoom 1 only): the matching object-position. */
export function objectPosition(rect: Rect): string {
  const px = rect.w >= 1 ? 50 : (rect.x / (1 - rect.w)) * 100;
  const py = rect.h >= 1 ? 50 : (rect.y / (1 - rect.h)) * 100;
  return `${px}% ${py}%`;
}

/** Panel boxes inside the output frame for each rect (percentages), by layout. */
export function panelBoxes(path: CropPath): Rect[] {
  if (path.layout === "stacked")
    return [
      { x: 0, y: 0, w: 1, h: 0.5 },
      { x: 0, y: 0.5, w: 1, h: 0.5 },
    ];
  if (path.layout === "side_by_side")
    return [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ];
  return [{ x: 0, y: 0, w: 1, h: 1 }];
}

/** Keyframes in source pixels (even numbers) for building FFmpeg crop filters at export. */
export function cropPixels(path: CropPath, sourceWidth: number, sourceHeight: number) {
  const even = (v: number) => Math.max(0, Math.round(v / 2) * 2);
  return path.keyframes.map((k) => ({
    t: k.t,
    rects: k.rects.map((r) => ({
      x: even(r.x * sourceWidth),
      y: even(r.y * sourceHeight),
      w: even(r.w * sourceWidth),
      h: even(r.h * sourceHeight),
    })),
  }));
}

// Analyses found this session, by source file, so the preview can draw the
// speaker tracking brackets (spec section 4) without asking Rust again.
const found = new Map<string, ReframeAnalysis>();
export const rememberAnalysis = (a: ReframeAnalysis) => found.set(a.sourcePath, a);

/** Face box (source-normalised) of who is talking at source time `t`, if a face was seen within 0.6 s. */
export function speakerAt(path: string, t: number): { box: Rect; label: string } | null {
  const a = found.get(path);
  if (!a) return null;
  const seg = a.speechSegments.find((s) => t >= s.start && t < s.end && s.speakerId != null);
  const tracks = seg ? a.faceTracks.filter((f) => f.speakerId === seg.speakerId) : a.faceTracks;
  let best: { box: TrackBox; speakerId: number } | null = null;
  let gap = 0.6;
  for (const f of tracks)
    for (const b of f.boxes) {
      const d = Math.abs(b.t - t);
      if (d < gap) {
        gap = d;
        best = { box: b, speakerId: f.speakerId };
      }
    }
  if (!best) return null;
  const label = a.speakers.find((s) => s.id === best.speakerId)?.label ?? `Speaker ${best.speakerId + 1}`;
  return { box: best.box, label };
}
