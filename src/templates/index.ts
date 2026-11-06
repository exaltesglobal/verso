// Template packs plus the transforms that turn a template into a project.
import { withGrade } from "../lib/looks";
import type { MediaInfo } from "../lib/media";
import { emptyProject, uid, type Clip, type Project, type TrackKind } from "../lib/project";
import { creatorPack } from "./packs/creator";
import { festivePack } from "./packs/festive";
import { businessPack } from "./packs/business";
import { cinematicPack } from "./packs/cinematic";
import { podcastPack } from "./packs/podcast";
import { trendingPack } from "./packs/trending";
import type { Template, TemplatePack, TemplateSlot } from "./types";

export type { Template, TemplatePack, TemplateSlot } from "./types";

export const TEMPLATE_PACKS: TemplatePack[] = [
  trendingPack,
  cinematicPack,
  podcastPack,
  creatorPack,
  festivePack,
  businessPack,
];
export const TEMPLATES: Template[] = TEMPLATE_PACKS.flatMap((p) => p.templates);

const stripExtension = (name: string) => name.replace(/\.[^.]+$/, "");

/** A video clip (plus linked sound) for `slot`, starting `inPoint` seconds into the file. */
function slotClips(
  slot: TemplateSlot,
  m: MediaInfo | undefined,
  inPoint: number,
): { video: Clip; audio?: Clip } {
  const slotLen = slot.end - slot.start;
  const base: Clip = {
    id: uid("v"),
    label: m ? stripExtension(m.fileName) : slot.hint,
    start: slot.start,
    end: slot.start + (m ? Math.min(slotLen, Math.max(0.2, m.durationSec - inPoint)) : slotLen),
    slotId: slot.id,
    zoom: slot.crop?.zoom,
    transitionIn: slot.transition,
    fx: slot.push ? { push: slot.push } : undefined,
    speed: slot.speed,
    zoomKeys: slot.punch?.map((t) => ({ t, zoom: 1.12 })),
  };
  if (!m) return { video: base };
  const linkId = m.hasAudio ? uid("l") : undefined;
  const video: Clip = { ...base, inPoint, source: m, linkId };
  if (!m.hasAudio) return { video };
  return {
    video,
    audio: {
      id: uid("a"),
      label: `${video.label} · sound`,
      start: video.start,
      end: video.end,
      inPoint,
      source: m,
      linkId,
      volume: 1,
      slotId: slot.id,
    },
  };
}

/**
 * Builds a project from a template: slots take the user's videos in order
 * (cycling if there are fewer videos than slots; a long video is used in
 * successive pieces), each trimmed to its slot. Text layers become text clips.
 * Music in `project` is kept; its video, sound and text are replaced.
 */
export function applyTemplate(template: Template, media: MediaInfo[], project?: Project): Project {
  const videos = media.filter((m) => m.hasVideo);
  const cursor = new Map<string, number>();
  const added: Record<TrackKind, Clip[]> = { text: [], captions: [], video: [], audio: [], music: [] };

  template.slots.forEach((slot, i) => {
    const m = videos.length ? videos[i % videos.length] : undefined;
    const len = slot.end - slot.start;
    let inPoint = 0;
    if (m) {
      const at = cursor.get(m.path) ?? 0;
      // Skip the first moments of a long file (often a black frame or setup).
      inPoint = at + len <= m.durationSec ? at : 0;
      if (inPoint === 0 && m.durationSec > len * 3)
        inPoint = Math.min(m.durationSec * 0.05, m.durationSec - len);
      cursor.set(m.path, inPoint + len);
    }
    const { video, audio } = slotClips(slot, m, inPoint);
    added.video.push(withGrade(video, template.look?.grade));
    if (audio) added.audio.push(audio);
  });

  for (const t of template.texts) {
    added.text.push({
      id: uid("t"),
      label: t.text,
      text: t.text,
      start: t.start,
      end: t.end,
      style: {
        preset: t.preset,
        y: t.y,
        size: t.size ?? (t.preset === "title" ? 0.065 : t.preset === "body" ? 0.032 : 0.045),
        color: t.color ?? (t.preset === "boxed" || t.preset === "neon" ? template.accents[0] : "#F5F4F0"),
        align: "center",
        animation: t.animation,
        font: t.font,
      },
    });
  }

  const base = project ?? emptyProject(template.name);
  return {
    ...base,
    aspect: template.aspect,
    captionStyle: template.captionStyle,
    look: template.look,
    updatedAt: Date.now(),
    tracks: base.tracks.map((t) =>
      t.kind === "music" || t.kind === "captions" ? t : { ...t, clips: added[t.kind] },
    ),
  };
}

/** Puts `media` into a template slot, replacing whatever was there (one undoable change). */
export function swapSlotMedia(project: Project, slotId: string, media: MediaInfo): Project {
  const video = project.tracks.find((t) => t.kind === "video")?.clips.find((c) => c.slotId === slotId);
  if (!video || !media.hasVideo) return project;
  const slot: TemplateSlot = {
    id: slotId,
    kind: "video",
    start: video.start,
    // Keep the slot's planned length even if the old clip was shorter.
    end: video.start + Math.max(video.end - video.start, slotLength(project, slotId)),
    hint: video.label,
    crop: video.zoom ? { x: 0.5, y: 0.5, zoom: video.zoom } : undefined,
    transition: video.transitionIn,
  };
  const { video: v, audio } = slotClips(slot, media, 0);
  // Keep the slot's motion and grade (fx, speed, colour); the new file gets a fresh crop.
  const next: Clip = {
    ...video,
    ...v,
    id: video.id,
    fx: video.fx,
    speed: video.speed,
    cropPath: undefined,
    zoomKeys: undefined,
  };
  return {
    ...project,
    updatedAt: Date.now(),
    tracks: project.tracks.map((t) => {
      if (t.kind === "video") return { ...t, clips: t.clips.map((c) => (c.id === video.id ? next : c)) };
      if (t.kind !== "audio") return t;
      const kept = t.clips.filter(
        (c) => !(c.slotId === slotId || (video.linkId && c.linkId === video.linkId)),
      );
      return { ...t, clips: (audio ? [...kept, audio] : kept).sort((a, b) => a.start - b.start) };
    }),
  };
}

/** Planned slot length: up to the next clip on the video track. */
function slotLength(project: Project, slotId: string) {
  const clips = [...(project.tracks.find((t) => t.kind === "video")?.clips ?? [])].sort(
    (a, b) => a.start - b.start,
  );
  const i = clips.findIndex((c) => c.slotId === slotId);
  const next = clips[i + 1];
  return next ? next.start - clips[i].start : clips[i].end - clips[i].start;
}
