// Background blur / removal / replacement: talks to the Rust `background`
// commands, which make a processed copy of a clip in the app cache. The clip
// then plays and exports that copy via `Clip.videoOverride`; the original file
// is never changed, and turning the effect off just drops the override.
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { Clip, VideoOverride } from "./project";
import type { ReframeModel } from "./reframe";

export type BackgroundMode = "blur" | "remove" | "replace" | "studio";

export interface BackgroundOptions {
  /** 0..1, blur and studio. */
  strength?: number;
  /** Replace: "#rrggbb". */
  color?: string;
  /** Replace: two "#rrggbb" colours, top to bottom. */
  gradient?: [string, string];
  /** Replace: picture file. */
  imagePath?: string;
}

export interface BackgroundResult {
  path: string;
  /** Source seconds the copy covers. */
  start: number;
  end: number;
  mode: BackgroundMode;
}

/** Blur and Studio are free; removing or swapping the background is Pro. */
export const needsPro = (mode: BackgroundMode) => mode === "remove" || mode === "replace";

export const backgroundModels = () => invoke<ReframeModel[]>("background_models");

/** Downloads one model; `onPercent` gets 0..100. */
export async function downloadBackgroundModel(id: string, onPercent?: (p: number) => void): Promise<void> {
  const off = await listen<{ id: string; percent: number }>("background://download", (e) => {
    if (e.payload.id === id) onPercent?.(e.payload.percent);
  });
  try {
    await invoke("download_background_model", { id });
  } finally {
    off();
  }
}

type Payload = { jobId: string } & Record<string, unknown>;

/** Renders a processed copy of a source range. Resolves when the background job finishes. */
export async function renderBackground(
  path: string,
  inPoint: number,
  outPoint: number | undefined,
  mode: BackgroundMode,
  options: BackgroundOptions,
  onProgress?: (percent: number, stage: string) => void,
  onJob?: (jobId: string) => void,
): Promise<BackgroundResult> {
  let jobId: string | undefined;
  // Events can arrive before invoke() returns the id, so buffer until we know it.
  const early: { event: string; payload: Payload }[] = [];
  let settle: ((e: (typeof early)[number]) => void) | undefined;
  const done = new Promise<BackgroundResult>((resolve, reject) => {
    settle = ({ event, payload }) => {
      if (event === "progress") onProgress?.(payload.percent as number, payload.stage as string);
      if (event === "done") resolve(payload as unknown as BackgroundResult);
      if (event === "error") reject(new Error(payload.message as string));
    };
  });
  const handle = (event: string) => (e: { payload: Payload }) => {
    if (jobId === undefined) early.push({ event, payload: e.payload });
    else if (e.payload.jobId === jobId) settle?.({ event, payload: e.payload });
  };
  const offs = await Promise.all([
    listen("background://progress", handle("progress")),
    listen("background://done", handle("done")),
    listen("background://error", handle("error")),
  ]);
  try {
    jobId = await invoke<string>("render_background", {
      path,
      inPoint,
      outPoint: outPoint ?? null,
      mode,
      options,
    });
    onJob?.(jobId);
    early.filter((e) => e.payload.jobId === jobId).forEach((e) => settle?.(e));
    return await done;
  } finally {
    offs.forEach((off) => off());
  }
}

export const cancelBackground = (jobId: string) => invoke("cancel_background", { jobId });

/** Clip patch that makes the clip play the processed copy. */
export const overridePatch = (r: BackgroundResult): Pick<Clip, "videoOverride"> => ({
  videoOverride: { path: r.path, kind: "background", mode: r.mode, start: r.start, end: r.end },
});

/** Clip patch for "Turn off": back to the original file. */
export const clearOverridePatch = (): Pick<Clip, "videoOverride"> => ({ videoOverride: undefined });

/**
 * What the player and export should read for `clip` at `sourceTime` (source
 * seconds): the processed copy when it covers that time, else the original.
 */
export function videoSourceAt(clip: Clip, sourceTime: number): { path: string; time: number } | undefined {
  const o: VideoOverride | undefined = clip.videoOverride;
  if (o && sourceTime >= o.start - 1e-3 && sourceTime <= o.end + 1e-3)
    return { path: o.path, time: Math.max(0, sourceTime - o.start) };
  return clip.source ? { path: clip.source.path, time: sourceTime } : undefined;
}
