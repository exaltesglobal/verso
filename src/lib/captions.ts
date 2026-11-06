// Offline auto-captions: types, Rust command wrappers and helpers that turn
// transcribed segments into `captions` track clips.
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { Clip, Project } from "./project";

export type CaptionLanguage = "auto" | "en" | "hi" | "mr" | "hinglish";

export const CAPTION_LANGUAGES: { id: CaptionLanguage; label: string; hint: string }[] = [
  { id: "en", label: "English", hint: "English speech" },
  { id: "hi", label: "हिंदी Hindi", hint: "Written in Devanagari" },
  { id: "mr", label: "मराठी Marathi", hint: "Written in Devanagari" },
  { id: "hinglish", label: "Hinglish", hint: "Hindi + English, in English letters" },
];

export type Accuracy = "fast" | "balanced" | "best";

/** What each accuracy choice downloads. Ids match `MODELS` in src-tauri/src/captions/models.rs. */
export const ACCURACY: { id: Accuracy; label: string; modelId: string; hint: string }[] = [
  { id: "fast", label: "Fast", modelId: "base-q5_1", hint: "Quick drafts" },
  { id: "balanced", label: "Balanced", modelId: "small-q5_1", hint: "Good for most reels" },
  { id: "best", label: "Best", modelId: "large-v3-turbo-q5_0", hint: "Best for Hindi and Marathi" },
];

export interface CaptionWord {
  text: string;
  start: number;
  end: number;
}

export interface CaptionSegment {
  start: number;
  end: number;
  text: string;
  words: CaptionWord[];
}

export interface ModelStatus {
  id: string;
  label: string;
  sizeBytes: number;
  present: boolean;
  partialBytes: number;
}

export interface CaptionProgress {
  jobId: string;
  percent: number;
  stage: "loading" | "listening" | "writing";
}

export interface ModelProgress {
  id: string;
  downloaded: number;
  total: number;
}

export const listModels = () => invoke<ModelStatus[]>("caption_models");
export const downloadModel = (id: string) => invoke<void>("download_caption_model", { id });
export const cancelDownload = (id: string) => invoke<void>("cancel_caption_download", { id });
export const cancelTranscription = (jobId: string) => invoke<void>("cancel_transcription", { jobId });

export function onModelProgress(cb: (p: ModelProgress) => void): Promise<UnlistenFn> {
  return listen<ModelProgress>("captions://model-progress", (e) => cb(e.payload));
}

export interface TranscribeRequest {
  path: string;
  /** Seconds in the source file. */
  inPoint: number;
  outPoint: number;
  language: CaptionLanguage;
  modelId: string;
}

export interface TranscribeHandlers {
  onProgress: (p: CaptionProgress) => void;
  onDone: (segments: CaptionSegment[]) => void;
  onError: (message: string, cancelled: boolean) => void;
}

/**
 * Starts a background transcription. Resolves with the job id (for
 * cancelTranscription) and a function that stops listening. Segment times are
 * seconds in the source file; use `segmentsToClips` to place them.
 */
export async function transcribe(
  req: TranscribeRequest,
  h: TranscribeHandlers,
): Promise<{ jobId: string; stop: UnlistenFn }> {
  let jobId: string | null = null;
  // Events can arrive before invoke() returns the id; hold them until we know it.
  const early: (() => void)[] = [];
  const route = <T extends { jobId: string }>(payload: T, run: (p: T) => void) => {
    if (jobId === null) early.push(() => payload.jobId === jobId && run(payload));
    else if (payload.jobId === jobId) run(payload);
  };
  const unlisten = await Promise.all([
    listen<CaptionProgress>("captions://progress", (e) => route(e.payload, h.onProgress)),
    listen<{ jobId: string; segments: CaptionSegment[] }>("captions://done", (e) =>
      route(e.payload, (p) => h.onDone(p.segments)),
    ),
    listen<{ jobId: string; message: string; cancelled: boolean }>("captions://error", (e) =>
      route(e.payload, (p) => h.onError(p.message, p.cancelled)),
    ),
  ]);
  const stop = () => unlisten.forEach((u) => u());
  try {
    jobId = await invoke<string>("transcribe", { ...req });
  } catch (e) {
    stop();
    throw e;
  }
  early.splice(0).forEach((run) => run());
  return { jobId, stop };
}

let nextId = 1;
const uid = () => `cap${Date.now().toString(36)}${(nextId++).toString(36)}`;

/**
 * Places source-time segments under a timeline clip: shifts them by the clip's
 * offset and drops anything outside the clip's visible range.
 */
export function segmentsToClips(segments: CaptionSegment[], clip: Clip): Clip[] {
  const shift = clip.start - (clip.inPoint ?? 0);
  return segments
    .map((s) => ({ ...s, start: s.start + shift, end: s.end + shift }))
    .filter((s) => s.end > clip.start && s.start < clip.end && s.text.trim())
    .map((s) => ({
      id: uid(),
      label: s.text,
      start: Math.max(clip.start, s.start),
      end: Math.min(clip.end, s.end),
      words: s.words.map((w) => ({ text: w.text, start: w.start + shift, end: w.end + shift })),
    }));
}

/** Swaps the captions under `clip` for `captions`; captions elsewhere stay. */
export function replaceCaptions(project: Project, clip: Clip, captions: Clip[]): Project {
  return {
    ...project,
    tracks: project.tracks.map((t) =>
      t.kind !== "captions"
        ? t
        : {
            ...t,
            clips: [...t.clips.filter((c) => c.end <= clip.start || c.start >= clip.end), ...captions].sort(
              (a, b) => a.start - b.start,
            ),
          },
    ),
  };
}

/**
 * New text for a segment. Word timings are kept when the word count matches;
 * otherwise words are spread evenly so karaoke highlight still lines up.
 */
export function editSegmentText(seg: CaptionSegment, text: string): CaptionSegment {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (parts.length === seg.words.length) {
    return { ...seg, text: parts.join(" "), words: seg.words.map((w, i) => ({ ...w, text: parts[i] })) };
  }
  const step = (seg.end - seg.start) / Math.max(1, parts.length);
  return {
    ...seg,
    text: parts.join(" "),
    words: parts.map((p, i) => ({ text: p, start: seg.start + i * step, end: seg.start + (i + 1) * step })),
  };
}

/** Index of the word being spoken at `time`, or -1. */
export function activeWordIndex(words: CaptionWord[], time: number): number {
  for (let i = words.length - 1; i >= 0; i--) if (time >= words[i].start) return i;
  return -1;
}

export function formatMegabytes(bytes: number): string {
  const mb = bytes / 1_000_000;
  return mb >= 1000 ? `${(mb / 1000).toFixed(1)} GB` : `${Math.round(mb)} MB`;
}
