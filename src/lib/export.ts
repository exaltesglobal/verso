import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  AspectRatio,
  CaptionWord,
  Clip,
  ClipColor,
  Look,
  Project,
  TextStyle,
  Transition,
} from "./project";
import { soundSource } from "./enhance";
import type { CropPath } from "./reframe";
import { captionStyle } from "./captionStyles";

/** Mirrors the request types in src-tauri/src/export/mod.rs. */
export type ExportQuality = "draft" | "standard" | "high" | "ultra";

export interface ExportVideoClip {
  path: string;
  inPoint: number;
  start: number;
  end: number;
  speed: number;
  cropPath?: CropPath;
  zoom: number;
  /** Where the zoomed frame sits, -1..1 (0 = centred). */
  posX: number;
  posY: number;
  /** 0..1, faded towards black. */
  opacity: number;
  zoomKeys: { t: number; zoom: number }[];
  transitionIn?: Transition;
  color?: ClipColor;
  speedRamp?: { t: number; speed: number }[];
  /** Freeze-frame PNG; `path`/`inPoint` are unused then. */
  still?: string;
  /** Background-removed VP9 copy: decode with libvpx-vp9 to keep alpha. */
  alpha?: boolean;
}

export interface ExportAudioClip {
  path: string;
  inPoint: number;
  start: number;
  end: number;
  /** 0..1.5 */
  volume: number;
  speed: number;
  fadeIn: number;
  fadeOut: number;
  /** Seconds of sound before `start` (crossfade under a video transition). */
  leadIn: number;
  speedRamp?: { t: number; speed: number }[];
}

export interface ExportText {
  text: string;
  start: number;
  end: number;
  y: number;
  /** Fraction of canvas height. */
  size: number;
  /** `#RRGGBB` or `#RRGGBBAA`. */
  color: string;
  align: TextStyle["align"];
  preset: TextStyle["preset"];
  /** Box colour (boxed) or glow colour (neon). */
  accent: string;
  boxTextColor: string;
  animation?: TextStyle["animation"];
}

export interface ExportCaption {
  text: string;
  start: number;
  end: number;
  words: CaptionWord[];
  speaker?: string;
}

/** captionStyles.ts `CaptionStyle` with colours resolved to hex. */
export interface ExportCaptionStyle {
  fontWeight: number;
  upper: boolean;
  scale: number;
  textColor: string;
  highlight: string;
  highlightColor: string;
  background: string;
  backgroundColor?: string;
  outlineColor?: string;
  outlineWidth: number;
  glow?: string;
  animation: string;
  revealWords: boolean;
}

export interface ExportRequest {
  aspect: AspectRatio;
  quality: ExportQuality;
  fps: number;
  videoClips: ExportVideoClip[];
  audioClips: ExportAudioClip[];
  textOverlays: ExportText[];
  captions: ExportCaption[];
  captionStyle: ExportCaptionStyle;
  outputPath: string;
  fontPath?: string;
  look?: Look;
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
  fps?: number;
  fontPath?: string;
}

/** Same as ADJACENT_EPS in src-tauri/src/export/mod.rs: clips this close are joined by their transition. */
const ADJACENT_EPS = 0.05;

/**
 * Resolves a style colour (hex, `var(--token)` or
 * `color-mix(in srgb, var(--token) N%, transparent)`) to `#RRGGBBAA`.
 */
function hexColor(value: string | undefined, fallback = "#FFFFFFFF"): string {
  if (!value) return fallback;
  const v = value.trim();
  if (v === "transparent") return "#00000000";
  if (/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v)) return v.length === 7 ? `${v}FF` : v;
  const token = (name: string) =>
    typeof document === "undefined"
      ? ""
      : getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const varName = /var\((--[\w-]+)\)/.exec(v)?.[1];
  const base = varName ? hexColor(token(varName), fallback) : fallback;
  const pct = /color-mix\(.*?(\d+(?:\.\d+)?)%/.exec(v)?.[1];
  if (!pct) return base;
  const alpha = Math.round((Number(pct) / 100) * 255);
  return base.slice(0, 7) + alpha.toString(16).padStart(2, "0").toUpperCase();
}

/** Turns the timeline into an export request. Clips without a real file are left as black gaps. */
export function buildExportRequest(
  project: Project,
  aspect: AspectRatio,
  options: ExportOptions,
): ExportRequest {
  const clipsOf = (kind: string) =>
    project.tracks
      .filter((t) => t.kind === kind)
      .flatMap((t) => t.clips.filter((c) => c.end > c.start))
      .sort((a, b) => a.start - b.start);
  const video = clipsOf("video").filter((c) => (c.source?.hasVideo || c.still) && !c.variant);

  // Video clips whose transition joins them to the clip before (same rule as the Rust side).
  const joined = new Map<string, number>();
  video.forEach((c, i) => {
    const prev = video[i - 1];
    if (prev && c.transitionIn && Math.abs(c.start - prev.end) < ADJACENT_EPS)
      joined.set(
        c.id,
        Math.min(c.transitionIn.duration, 0.9 * (prev.end - prev.start), 0.9 * (c.end - c.start)),
      );
  });
  const linkedVideo = (c: Clip) => (c.linkId ? video.find((v) => v.linkId === c.linkId) : undefined);

  // Sound: crossfade under joined video transitions (B fades in over a lead-in, A fades out).
  const sound = clipsOf("audio").filter((c) => c.source?.hasAudio);
  const fadeOutFor = new Map<string, number>();
  const leadFor = new Map<string, number>();
  sound.forEach((c, i) => {
    const v = linkedVideo(c);
    const d = v ? joined.get(v.id) : undefined;
    const prev = sound[i - 1];
    if (d && prev && Math.abs(c.start - prev.end) < ADJACENT_EPS) {
      leadFor.set(c.id, d);
      fadeOutFor.set(prev.id, d);
    }
  });

  const audioClip = (c: Clip): ExportAudioClip => ({
    // Cleaned copy when the clip sits inside its range (see enhance.ts).
    path: soundSource(c)!.path,
    inPoint: soundSource(c)!.inPoint,
    start: c.start,
    end: c.end,
    volume: Math.max(0, Math.min(1.5, c.volume ?? 1)),
    speed: c.speed ?? linkedVideo(c)?.speed ?? 1,
    fadeIn: Math.max(c.fadeIn ?? 0, leadFor.get(c.id) ?? 0),
    fadeOut: Math.max(c.fadeOut ?? 0, fadeOutFor.get(c.id) ?? 0),
    leadIn: leadFor.get(c.id) ?? 0,
    speedRamp: c.speedRamp ?? linkedVideo(c)?.speedRamp,
  });

  // shortcut: SVG shape stickers are preview-only for now; rasterise them in Rust to export them.
  const stickers = clipsOf("text").filter((c) => c.sticker);
  if (stickers.length) console.info(`Export skips ${stickers.length} shape sticker(s).`);
  const textOverlays: ExportText[] = clipsOf("text")
    .filter((c) => !c.sticker && (c.text ?? c.label).trim())
    .map((c) => {
      const s = c.style ?? { preset: "subtitle", y: 0.7, size: 0.045, color: "#F5F4F0", align: "center" };
      return {
        text: c.text ?? c.label,
        start: c.start,
        end: c.end,
        y: s.y,
        size: s.size,
        color: hexColor(s.color),
        align: s.align,
        preset: s.preset,
        accent: hexColor(
          s.preset === "neon" ? "var(--vs-color-track-captions)" : "var(--vs-color-track-text)",
        ),
        boxTextColor: hexColor("var(--vs-color-role-bg-app)", "#0B0B0FFF"),
        animation: s.animation,
      };
    });

  const captions: ExportCaption[] = clipsOf("captions")
    .filter((c) => (c.text ?? c.label).trim())
    .map((c) => ({
      text: c.text ?? c.label,
      start: c.start,
      end: c.end,
      words: c.words ?? [],
      speaker: c.label.includes(": ") ? c.label.split(": ")[0] : undefined,
    }));

  const cs = captionStyle(project.captionStyle);

  return {
    aspect,
    quality: options.quality,
    fps: options.fps ?? 30,
    videoClips: video.map((c) => {
      // A background copy covers source seconds start..end of the original (see background.ts).
      const o = c.videoOverride;
      const inPoint = c.inPoint ?? 0;
      const useCopy = !!o && inPoint >= o.start - 1e-3 && inPoint <= o.end + 1e-3;
      return {
        path: useCopy ? o.path : (c.source?.path ?? ""),
        inPoint: useCopy ? inPoint - o.start : inPoint,
        start: c.start,
        end: c.end,
        speed: c.speed ?? 1,
        cropPath: c.cropPath,
        zoom: c.zoom ?? 1,
        posX: c.pos?.x ?? 0,
        posY: c.pos?.y ?? 0,
        opacity: c.opacity ?? 1,
        zoomKeys: c.zoomKeys ?? [],
        transitionIn: c.transitionIn,
        color: c.color,
        speedRamp: c.speedRamp,
        still: c.still?.path,
        alpha: useCopy && o.mode === "remove",
      };
    }),
    audioClips: [...sound, ...clipsOf("music").filter((c) => c.source?.hasAudio)].map(audioClip),
    textOverlays,
    captions,
    captionStyle: {
      fontWeight: cs.fontWeight,
      upper: cs.textCase === "upper",
      scale: cs.scale,
      textColor: hexColor(cs.textColor),
      highlight: cs.highlight,
      highlightColor: hexColor(cs.highlightColor),
      background: cs.background,
      backgroundColor: cs.background === "none" ? undefined : hexColor(cs.backgroundColor),
      outlineColor: cs.outline ? hexColor(cs.outline.color) : undefined,
      outlineWidth: cs.outline?.width ?? 0,
      glow: cs.glow ? hexColor(cs.glow) : undefined,
      animation: cs.animation,
      revealWords: cs.revealWords,
    },
    outputPath: options.outputPath,
    fontPath: options.fontPath,
    look: project.look,
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
