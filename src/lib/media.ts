import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

/** Mirrors `MediaInfo` in src-tauri/src/commands/media.rs. */
export interface MediaInfo {
  path: string;
  fileName: string;
  sizeBytes: number;
  durationSec: number;
  width: number | null;
  height: number | null;
  fps: number | null;
  videoCodec: string | null;
  audioCodec: string | null;
  hasVideo: boolean;
  hasAudio: boolean;
}

export interface ImportResult {
  items: MediaInfo[];
  errors: { path: string; message: string }[];
}

const VIDEO_EXT = ["mp4", "mov", "m4v", "mkv", "webm", "avi"];
const AUDIO_EXT = ["mp3", "wav", "m4a", "aac", "flac", "ogg"];

export function probeMedia(path: string): Promise<MediaInfo> {
  return invoke<MediaInfo>("probe_media", { path });
}

/** Opens the native file picker, then reads each chosen file with ffprobe. */
export async function pickAndProbe(): Promise<ImportResult> {
  const selected = await open({
    multiple: true,
    title: "Import video",
    filters: [
      { name: "Videos and audio", extensions: [...VIDEO_EXT, ...AUDIO_EXT] },
      { name: "Videos", extensions: VIDEO_EXT },
      { name: "Audio", extensions: AUDIO_EXT },
    ],
  });
  if (!selected) return { items: [], errors: [] };

  const paths = Array.isArray(selected) ? selected : [selected];
  const settled = await Promise.allSettled(paths.map(probeMedia));

  const result: ImportResult = { items: [], errors: [] };
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") result.items.push(r.value);
    else result.errors.push({ path: paths[i], message: String(r.reason) });
  });
  return result;
}

export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

export function formatResolution(m: MediaInfo): string | null {
  if (!m.width || !m.height) return null;
  const shape = m.height > m.width ? "vertical" : m.height === m.width ? "square" : "wide";
  return `${m.width}×${m.height} · ${shape}`;
}

export function formatSize(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
  return `${Math.max(1, Math.round(bytes / 1e3))} KB`;
}
