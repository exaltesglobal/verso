// Project model: tracks of clips. Clips may point at a real media file
// (`source`) or be sample placeholders.
import type { MediaInfo } from "./media";

export type TrackKind = "text" | "captions" | "video" | "audio";
export type AspectRatio = "9:16" | "1:1" | "16:9";

export interface Clip {
  id: string;
  label: string;
  /** Position on the timeline, in seconds. */
  start: number;
  end: number;
  /** Where in the source file the clip begins, in seconds. */
  inPoint?: number;
  source?: MediaInfo;
  /** Transitions and effects sit on the video track but use the effects colour. */
  variant?: "effect";
  /** Caption clips: per-word timings (timeline seconds) for karaoke highlight. */
  words?: { text: string; start: number; end: number }[];
}

export interface Track {
  kind: TrackKind;
  label: string;
  clips: Clip[];
}

export interface Project {
  name: string;
  /** Shown after the name in the top bar, e.g. "Reel 1 of 4". */
  subtitle?: string;
  tracks: Track[];
}

const TRACK_ORDER: { kind: TrackKind; label: string }[] = [
  { kind: "text", label: "Text" },
  { kind: "captions", label: "Captions" },
  { kind: "video", label: "Video" },
  { kind: "audio", label: "Audio" },
];

/** The shortest timeline we show, so an empty project still has room. */
export const MIN_TIMELINE_SECONDS = 15;

export function emptyProject(name = "My first reel"): Project {
  return { name, tracks: TRACK_ORDER.map((t) => ({ ...t, clips: [] })) };
}

export function projectDuration(project: Project): number {
  const ends = project.tracks.flatMap((t) => t.clips.map((c) => c.end));
  return ends.length ? Math.max(...ends) : 0;
}

let nextId = 1;
const uid = (prefix: string) => `${prefix}${Date.now().toString(36)}${(nextId++).toString(36)}`;

function stripExtension(name: string) {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

/**
 * Adds media to the end of the timeline: a video clip on the Video track and,
 * if the file has sound, a matching clip on the Audio track.
 */
export function appendMedia(project: Project, items: MediaInfo[]): Project {
  let cursor = projectDuration(project);
  const added: Record<TrackKind, Clip[]> = { text: [], captions: [], video: [], audio: [] };

  for (const m of items) {
    const length = Math.max(0.1, m.durationSec);
    const label = stripExtension(m.fileName);
    if (m.hasVideo) {
      added.video.push({ id: uid("v"), label, start: cursor, end: cursor + length, inPoint: 0, source: m });
    }
    if (m.hasAudio) {
      added.audio.push({
        id: uid("a"),
        label: m.hasVideo ? `${label} · sound` : label,
        start: cursor,
        end: cursor + length,
        inPoint: 0,
        source: m,
      });
    }
    cursor += length;
  }

  return {
    ...project,
    tracks: project.tracks.map((t) => ({ ...t, clips: [...t.clips, ...added[t.kind]] })),
  };
}

export function findClip(project: Project, id: string) {
  for (const t of project.tracks) {
    const c = t.clips.find((x) => x.id === id);
    if (c) return { ...c, kind: t.kind };
  }
  return undefined;
}

/** The video clip under the playhead, if any. */
export function videoClipAt(project: Project, time: number): Clip | undefined {
  return project.tracks
    .find((t) => t.kind === "video")
    ?.clips.find((c) => time >= c.start && time < c.end && !c.variant);
}
