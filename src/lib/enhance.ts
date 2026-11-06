// One-click voice clean-up. Rust renders a cleaned WAV copy into the app cache
// (src-tauri/src/commands/enhance.rs); the sound clip then points at it via
// `audioOverride`. The original file is never touched.
import { invoke } from "@tauri-apps/api/core";
import { clipsAt, findClip, linkedIds, updateClip, type Clip, type Project } from "./project";
import { sourceSpan } from "./speed";

export type EnhanceStrength = "Light" | "Normal" | "Strong";

export const ENHANCE_PROGRESS_EVENT = "enhance://progress";

export interface EnhanceProgress {
  percent: number;
  stage: "download" | "measure" | "clean";
}

export interface EnhanceResult {
  outputPath: string;
  /** False when the voice model couldn't be downloaded and a simpler filter was used. */
  usedVoiceModel: boolean;
}

/** The Sound clip behind a selection: the clip itself, or the video's linked sound. */
export function soundClipFor(project: Project, clipId: string): Clip | undefined {
  const sound = project.tracks.find((t) => t.kind === "audio")?.clips ?? [];
  const ids = linkedIds(project, clipId);
  return sound.find((c) => ids.has(c.id) && c.source?.hasAudio);
}

/** Renders the cleaned copy for the clip's source range. Progress: ENHANCE_PROGRESS_EVENT. */
export function enhanceAudio(clip: Clip, strength: EnhanceStrength): Promise<EnhanceResult> {
  if (!clip.source) return Promise.reject(new Error("This clip has no sound to clean up."));
  const inPoint = clip.inPoint ?? 0;
  return invoke<EnhanceResult>("enhance_audio", {
    path: clip.source.path,
    inPoint,
    outPoint: inPoint + sourceSpan(clip),
    options: { strength },
  });
}

/** Points the sound clip at the cleaned copy (one undoable step). */
export function applyEnhanced(project: Project, soundClipId: string, outputPath: string): Project {
  const clip = findClip(project, soundClipId);
  if (!clip) return project;
  const offset = clip.inPoint ?? 0;
  return updateClip(project, soundClipId, {
    audioOverride: { path: outputPath, kind: "enhanced", offset, until: offset + sourceSpan(clip) },
  });
}

export function clearEnhanced(project: Project, soundClipId: string): Project {
  return updateClip(project, soundClipId, { audioOverride: undefined });
}

/**
 * Where a sound clip's audio really comes from, for preview and export:
 * the cleaned copy while the clip still sits inside the cleaned range,
 * otherwise the original file.
 */
export function soundSource(clip: Clip): { path: string; inPoint: number } | undefined {
  if (!clip.source) return undefined;
  const inPoint = clip.inPoint ?? 0;
  const o = clip.audioOverride;
  const offset = o?.offset ?? 0;
  const inside =
    o && inPoint >= offset - 0.01 && (o.until === undefined || inPoint + sourceSpan(clip) <= o.until + 0.01);
  return inside ? { path: o.path, inPoint: inPoint - offset } : { path: clip.source.path, inPoint };
}

/** True when the Sound clip at `time` plays a cleaned copy (mute the <video> then). */
export function hasEnhancedSound(project: Project, time: number): boolean {
  return clipsAt(project, "audio", time).some(
    (c) => c.audioOverride !== undefined && soundSource(c)?.path === c.audioOverride.path,
  );
}
