import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { AspectRatio, Project } from "./project";

/** Mirrors the request types in src-tauri/src/export/mod.rs. */
export type ExportQuality = "draft" | "standard" | "high";

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ExportVideoClip {
  path: string;
  inPoint: number;
  start: number;
  end: number;
  /** Normalized 0..1. Omit for a centre crop to the canvas shape. */
  crop?: CropRect;
}

export interface ExportAudioClip {
  path: string;
  inPoint: number;
  start: number;
  end: number;
  /** 0..1 */
  volume: number;
}

export interface ExportText {
  text: string;
  start: number;
  end: number;
  /** Centre of the text, normalized 0..1. */
  x: number;
  y: number;
  /** Pixels on a 1080-wide canvas. */
  fontSize: number;
  /** `#RRGGBB` or `#RRGGBBAA`. */
  color: string;
}

export interface ExportRequest {
  aspect: AspectRatio;
  quality: ExportQuality;
  fps: number;
  videoClips: ExportVideoClip[];
  audioClips: ExportAudioClip[];
  textOverlays: ExportText[];
  captions: ExportText[];
  watermark: boolean;
  outputPath: string;
  fontPath?: string;
}

export interface ExportProgress {
  jobId: string;
  percent: number;
  etaSec: number | null;
  stage: "preparing" | "encoding" | "finishing";
}

export interface ExportDone {
  jobId: string;
  outputPath: string;
}

export interface ExportError {
  jobId: string;
  message: string;
  cancelled: boolean;
}

export interface EncoderInfo {
  available: string[];
  chosen: string;
  fallback: boolean;
}

export interface ExportOptions {
  quality: ExportQuality;
  outputPath: string;
  watermark?: boolean;
  fps?: number;
  fontPath?: string;
}

/** Turns the timeline into an export request. Clips without a real file are left as black gaps. */
export function buildExportRequest(
  project: Project,
  aspect: AspectRatio,
  options: ExportOptions,
): ExportRequest {
  const clipsOf = (kind: string) =>
    project.tracks.filter((t) => t.kind === kind).flatMap((t) => t.clips.filter((c) => c.end > c.start));

  // Font sizes are pixels on a 1080-wide canvas; styles store a fraction of canvas height.
  const canvasH = aspect === "9:16" ? 1920 : 1080;
  const text = (kind: string, y: number, fontSize: number): ExportText[] =>
    clipsOf(kind)
      .filter((c) => (c.text ?? c.label).trim())
      .map((c) => ({
        text: c.text ?? c.label,
        start: c.start,
        end: c.end,
        x: 0.5,
        y: c.style?.y ?? y,
        fontSize: c.style ? Math.round(c.style.size * canvasH) : fontSize,
        color: c.style?.color ?? "#FFFFFF",
      }));
  // Zoom > 1 crops into the centre of the frame.
  const zoomCrop = (z: number | undefined) => {
    if (!z || z <= 1.001) return undefined;
    const s = 1 / z;
    return { x: (1 - s) / 2, y: (1 - s) / 2, w: s, h: s };
  };

  return {
    aspect,
    quality: options.quality,
    fps: options.fps ?? 30,
    videoClips: clipsOf("video")
      .filter((c) => c.source?.hasVideo && !c.variant)
      .map((c) => ({
        path: c.source!.path,
        inPoint: c.inPoint ?? 0,
        start: c.start,
        end: c.end,
        crop: zoomCrop(c.zoom),
      })),
    audioClips: [...clipsOf("audio"), ...clipsOf("music")]
      .filter((c) => c.source?.hasAudio)
      .map((c) => ({
        path: c.source!.path,
        inPoint: c.inPoint ?? 0,
        start: c.start,
        end: c.end,
        volume: Math.min(1, c.volume ?? 1),
      })),
    textOverlays: text("text", 0.2, 72),
    captions: text("captions", 0.78, 60),
    watermark: options.watermark ?? true,
    outputPath: options.outputPath,
    fontPath: options.fontPath,
  };
}

export function detectEncoders(): Promise<EncoderInfo> {
  return invoke<EncoderInfo>("detect_encoders");
}

/** Starts an export and resolves with its job id. Follow it with `onExportEvents`. */
export function startExport(request: ExportRequest): Promise<string> {
  return invoke<string>("start_export", { request });
}

export function cancelExport(jobId: string): Promise<void> {
  return invoke("cancel_export", { jobId });
}

/** Subscribes to all export events. Returns one function that unsubscribes from all of them. */
export async function onExportEvents(handlers: {
  progress?: (p: ExportProgress) => void;
  done?: (d: ExportDone) => void;
  error?: (e: ExportError) => void;
}): Promise<UnlistenFn> {
  const subs = await Promise.all([
    listen<ExportProgress>("export://progress", (e) => handlers.progress?.(e.payload)),
    listen<ExportDone>("export://done", (e) => handlers.done?.(e.payload)),
    listen<ExportError>("export://error", (e) => handlers.error?.(e.payload)),
  ]);
  return () => subs.forEach((u) => u());
}
