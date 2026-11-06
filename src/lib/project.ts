// Project model and pure editing operations. Every operation returns a new
// Project, which keeps undo/redo trivial (see useHistory).
import type { MediaInfo } from "./media";
import type { CropPath } from "./reframe";

export type TrackKind = "text" | "captions" | "video" | "audio" | "music";
export type AspectRatio = "9:16" | "1:1" | "16:9";

export type TransitionKind = "fade" | "dissolve" | "slide" | "zoom";

export interface Transition {
  kind: TransitionKind;
  /** Seconds. Overlaps the end of the previous clip. */
  duration: number;
}

export interface TextStyle {
  preset: "title" | "subtitle" | "body" | "boxed" | "outline" | "neon";
  /** Vertical position, 0 = top, 1 = bottom. */
  y: number;
  /** Font size relative to canvas height (0.05 = 5%). */
  size: number;
  color: string;
  align: "left" | "center" | "right";
  /** Entrance animation (preview: AnimatedText; export: export/look.rs). */
  animation?: TextAnimation;
  /** "serif" = bundled Fraunces (SIL OFL), for cinematic title cards. */
  font?: "serif";
}

export type TextAnimation = "pop" | "typewriter" | "slide-up" | "blur-in" | "bounce" | "word-by-word";

/** Whole-frame look drawn over the picture (preview: LookOverlay; export: export/look.rs). */
export interface Look {
  /** 0..1 film grain amount. */
  grain?: number;
  /** 0..1 edge darkening. */
  vignette?: number;
  letterbox?: "2.39" | "1.85" | null;
  leak?: { style: "warm" | "rose" | "cool" | "gold"; strength: number };
  /** Anamorphic streak; `color` is #RRGGBB. */
  flare?: { strength: number; color: string };
  /** Colour grade preset id (see GRADES in lib/looks.ts). */
  grade?: string;
  /** Seconds of dip-to-black at the very start and end. */
  dip?: number;
}

export interface CaptionWord {
  text: string;
  start: number;
  end: number;
}

export interface Clip {
  id: string;
  label: string;
  /** Position on the timeline, in seconds. */
  start: number;
  end: number;
  /** Where in the source file the clip begins, in seconds. */
  inPoint?: number;
  source?: MediaInfo;
  /** Clips created together (a video and its sound) move, split and delete together. */
  linkId?: string;
  /** Transitions and effects sit on the video track but use the effects colour. */
  variant?: "effect";
  /** Video: transition into this clip from the previous one. */
  transitionIn?: Transition;
  /** Video: zoom 1 = fit. Audio/music: volume 0..1 (default 1). */
  zoom?: number;
  volume?: number;
  speed?: number;
  /** Text and caption clips. */
  text?: string;
  style?: TextStyle;
  words?: CaptionWord[];
  /** Video: smart reframe crop path (from the Reframe panel). */
  cropPath?: CropPath;
  /** Music: fade in/out seconds. */
  fadeIn?: number;
  fadeOut?: number;
  /** Video: punch-in zooms, `t` in seconds from the clip start (see zoomAt in smart.ts). */
  zoomKeys?: { t: number; zoom: number }[];
  /** Video: the template slot this clip fills (see swapSlotMedia). */
  slotId?: string;
  /** Music: "Cut to the beat" is on for this clip. */
  beatSync?: boolean;
  /** Video: template motion. `push` = slow push-in, extra zoom reached by the clip end (0.08 = 8%). */
  fx?: { push?: number };
}

export interface Track {
  kind: TrackKind;
  label: string;
  clips: Clip[];
}

export interface Project {
  id: string;
  name: string;
  /** Shown after the name in the top bar, e.g. "Reel 1 of 4". */
  subtitle?: string;
  aspect: AspectRatio;
  tracks: Track[];
  createdAt: number;
  updatedAt: number;
  /** Where the user saved it (.verso file), if they did. */
  filePath?: string;
  captionStyle?: string;
  look?: Look;
}

export const TRACK_ORDER: { kind: TrackKind; label: string }[] = [
  { kind: "text", label: "Text" },
  { kind: "captions", label: "Captions" },
  { kind: "video", label: "Video" },
  { kind: "audio", label: "Sound" },
  { kind: "music", label: "Music" },
];

/** The shortest timeline we show, so an empty project still has room. */
export const MIN_TIMELINE_SECONDS = 15;
export const MIN_CLIP_SECONDS = 0.2;

let nextId = 1;
export const uid = (prefix: string) => `${prefix}${Date.now().toString(36)}${(nextId++).toString(36)}`;

/** Fills in tracks/fields missing from older or sample projects. */
export function normalizeProject(p: Partial<Project> & { tracks: Track[]; name: string }): Project {
  const now = Date.now();
  const tracks = TRACK_ORDER.map(({ kind, label }) => {
    const found = p.tracks.find((t) => t.kind === kind);
    return { kind, label, clips: found ? [...found.clips].sort((a, b) => a.start - b.start) : [] };
  });
  return {
    id: p.id ?? uid("p"),
    name: p.name,
    subtitle: p.subtitle,
    aspect: p.aspect ?? "9:16",
    tracks,
    createdAt: p.createdAt ?? now,
    updatedAt: p.updatedAt ?? now,
    filePath: p.filePath,
    captionStyle: p.captionStyle ?? "bold-pop",
    look: p.look,
  };
}

export function emptyProject(name = "My first reel"): Project {
  return normalizeProject({ name, tracks: [] });
}

export function projectDuration(project: Project): number {
  const ends = project.tracks.flatMap((t) => t.clips.map((c) => c.end));
  return ends.length ? Math.max(...ends) : 0;
}

function stripExtension(name: string) {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

function mapTracks(project: Project, fn: (t: Track) => Track): Project {
  return { ...project, tracks: project.tracks.map(fn), updatedAt: Date.now() };
}

function trackEnd(project: Project, kind: TrackKind) {
  const t = project.tracks.find((x) => x.kind === kind);
  return t?.clips.length ? Math.max(...t.clips.map((c) => c.end)) : 0;
}

/**
 * Adds media to the end of the timeline: a video clip on the Video track and,
 * if the file has sound, a linked clip on the Sound track. Audio-only files go
 * on the Music track.
 */
export function appendMedia(project: Project, items: MediaInfo[]): Project {
  let videoCursor = Math.max(trackEnd(project, "video"), trackEnd(project, "audio"));
  let musicCursor = trackEnd(project, "music");
  const added: Record<TrackKind, Clip[]> = { text: [], captions: [], video: [], audio: [], music: [] };

  for (const m of items) {
    const length = Math.max(0.1, m.durationSec);
    const label = stripExtension(m.fileName);
    if (m.hasVideo) {
      const linkId = m.hasAudio ? uid("l") : undefined;
      added.video.push({
        id: uid("v"),
        label,
        start: videoCursor,
        end: videoCursor + length,
        inPoint: 0,
        source: m,
        linkId,
      });
      if (m.hasAudio) {
        added.audio.push({
          id: uid("a"),
          label: `${label} · sound`,
          start: videoCursor,
          end: videoCursor + length,
          inPoint: 0,
          source: m,
          linkId,
          volume: 1,
        });
      }
      videoCursor += length;
    } else if (m.hasAudio) {
      added.music.push({
        id: uid("m"),
        label,
        start: musicCursor,
        end: musicCursor + length,
        inPoint: 0,
        source: m,
        volume: 0.6,
        fadeIn: 0.5,
        fadeOut: 1.5,
      });
      musicCursor += length;
    }
  }

  return mapTracks(project, (t) => ({ ...t, clips: [...t.clips, ...added[t.kind]] }));
}

export function findClip(project: Project, id: string) {
  for (const t of project.tracks) {
    const c = t.clips.find((x) => x.id === id);
    if (c) return { ...c, kind: t.kind };
  }
  return undefined;
}

/** The clip plus any clips linked to it. */
function groupIds(project: Project, id: string): Set<string> {
  const clip = findClip(project, id);
  const ids = new Set<string>([id]);
  if (clip?.linkId) {
    for (const t of project.tracks) for (const c of t.clips) if (c.linkId === clip.linkId) ids.add(c.id);
  }
  return ids;
}

/** The video clip under the playhead, if any. */
export function videoClipAt(project: Project, time: number): Clip | undefined {
  return project.tracks
    .find((t) => t.kind === "video")
    ?.clips.find((c) => time >= c.start && time < c.end && !c.variant);
}

export function clipsAt(project: Project, kind: TrackKind, time: number): Clip[] {
  return (
    project.tracks.find((t) => t.kind === kind)?.clips.filter((c) => time >= c.start && time < c.end) ?? []
  );
}

export function updateClip(project: Project, id: string, patch: Partial<Clip>): Project {
  return mapTracks(project, (t) => ({
    ...t,
    clips: t.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  }));
}

/** Moves a clip (and its linked clips) by `delta` seconds, never before 0. */
export function moveClip(project: Project, id: string, delta: number): Project {
  const ids = groupIds(project, id);
  const group = project.tracks.flatMap((t) => t.clips.filter((c) => ids.has(c.id)));
  const minStart = Math.min(...group.map((c) => c.start));
  const d = Math.max(-minStart, delta);
  return mapTracks(project, (t) => ({
    ...t,
    clips: t.clips
      .map((c) => (ids.has(c.id) ? { ...c, start: c.start + d, end: c.end + d } : c))
      .sort((a, b) => a.start - b.start),
  }));
}

/** Clips with a real file can't be stretched past the file. */
function sourceLimit(c: Clip) {
  return c.source ? c.source.durationSec : Infinity;
}

/** Trims the left or right edge of a clip (and its linked clips) to `time`. */
export function trimClip(project: Project, id: string, edge: "start" | "end", time: number): Project {
  const ids = groupIds(project, id);
  return mapTracks(project, (t) => ({
    ...t,
    clips: t.clips.map((c) => {
      if (!ids.has(c.id)) return c;
      const inPoint = c.inPoint ?? 0;
      if (edge === "start") {
        const earliest = c.source ? c.start - inPoint : 0;
        const start = Math.min(c.end - MIN_CLIP_SECONDS, Math.max(earliest, 0, time));
        return { ...c, start, inPoint: c.source ? inPoint + (start - c.start) : c.inPoint };
      }
      const latest = c.start + (sourceLimit(c) - inPoint);
      const end = Math.max(c.start + MIN_CLIP_SECONDS, Math.min(latest, time));
      return { ...c, end };
    }),
  }));
}

/** Splits every clip in the group under `time` into two. Returns the new right-hand id. */
export function splitClip(
  project: Project,
  id: string,
  time: number,
): { project: Project; rightId?: string } {
  const ids = groupIds(project, id);
  let rightId: string | undefined;
  const newLink = uid("l");
  const next = mapTracks(project, (t) => ({
    ...t,
    clips: t.clips.flatMap((c) => {
      if (!ids.has(c.id) || time <= c.start + MIN_CLIP_SECONDS || time >= c.end - MIN_CLIP_SECONDS)
        return [c];
      const left: Clip = { ...c, end: time };
      const right: Clip = {
        ...c,
        id: uid(c.id[0] ?? "c"),
        start: time,
        inPoint: c.source ? (c.inPoint ?? 0) + (time - c.start) : c.inPoint,
        linkId: c.linkId ? newLink : undefined,
        transitionIn: undefined,
      };
      if (c.id === id) rightId = right.id;
      return [left, right];
    }),
  }));
  return { project: next, rightId };
}

/** Splits whatever is under the playhead on the video/sound tracks (or the given clip). */
export function splitAtPlayhead(project: Project, time: number, selectedId?: string) {
  if (selectedId) {
    const c = findClip(project, selectedId);
    if (c && time > c.start && time < c.end) return splitClip(project, selectedId, time);
  }
  const target = clipsAt(project, "video", time)[0] ?? clipsAt(project, "audio", time)[0];
  return target ? splitClip(project, target.id, time) : { project };
}

export function deleteClip(project: Project, id: string, ripple = false): Project {
  const ids = groupIds(project, id);
  const removed = project.tracks.flatMap((t) => t.clips.filter((c) => ids.has(c.id)));
  if (!removed.length) return project;
  const gapStart = Math.min(...removed.map((c) => c.start));
  const gap = Math.max(...removed.map((c) => c.end)) - gapStart;
  return mapTracks(project, (t) => ({
    ...t,
    clips: t.clips
      .filter((c) => !ids.has(c.id))
      .map((c) =>
        ripple && (t.kind === "video" || t.kind === "audio") && c.start >= gapStart
          ? { ...c, start: c.start - gap, end: c.end - gap }
          : c,
      ),
  }));
}

export function addTextClip(
  project: Project,
  start: number,
  preset: TextStyle["preset"],
  text: string,
): {
  project: Project;
  id: string;
} {
  const id = uid("t");
  const sizes: Record<TextStyle["preset"], number> = {
    title: 0.065,
    subtitle: 0.045,
    body: 0.032,
    boxed: 0.045,
    outline: 0.06,
    neon: 0.055,
  };
  const clip: Clip = {
    id,
    label: text,
    text,
    start,
    end: start + 3,
    style: {
      preset,
      y: preset === "title" ? 0.22 : 0.7,
      size: sizes[preset],
      color: "#F5F4F0",
      align: "center",
    },
  };
  return {
    id,
    project: mapTracks(project, (t) =>
      t.kind === "text" ? { ...t, clips: [...t.clips, clip].sort((a, b) => a.start - b.start) } : t,
    ),
  };
}

/** Replaces the captions track with new caption clips. */
export function setCaptions(project: Project, clips: Clip[]): Project {
  return mapTracks(project, (t) => (t.kind === "captions" ? { ...t, clips } : t));
}

/** Snap targets: clip edges on all tracks plus the playhead. */
export function snapPoints(project: Project, exclude: Set<string>, playhead: number): number[] {
  const pts = [0, playhead];
  for (const t of project.tracks) for (const c of t.clips) if (!exclude.has(c.id)) pts.push(c.start, c.end);
  return pts;
}

export function linkedIds(project: Project, id: string) {
  return groupIds(project, id);
}
