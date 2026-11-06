// Template packs plus the transforms that turn a template into a project.
import { withGrade } from "../lib/looks";
import type { MediaInfo } from "../lib/media";
import { emptyProject, uid, type Clip, type Project, type TrackKind } from "../lib/project";
import { BRIEF_TEMPLATES } from "./packs/brief";
import { businessPack } from "./packs/business";
import { cinematicPack } from "./packs/cinematic";
import { creatorPack } from "./packs/creator";
import { festivePack } from "./packs/festive";
import { podcastPack } from "./packs/podcast";
import type { PackId, Template, TemplateLang, TemplatePack, TemplateSlot, TemplateText } from "./types";

export type { Template, TemplateLang, TemplatePack, TemplateSlot } from "./types";

const HAND_MADE = [cinematicPack, podcastPack, creatorPack, festivePack, businessPack];
const PACKS: [PackId, string][] = [
  ["trending", "Trending"],
  ["cinematic", "Cinematic"],
  ["podcast", "Podcast"],
  ["creator", "Creator basics"],
  ["festive", "Festive India"],
  ["business", "Business"],
];

/** Brief templates first (newest designs), then the hand-made ones. */
export const TEMPLATE_PACKS: TemplatePack[] = PACKS.map(([id, name]) => ({
  id,
  name,
  templates: [
    ...(BRIEF_TEMPLATES as Template[]).filter((t) => t.pack === id),
    ...HAND_MADE.filter((p) => p.id === id).flatMap((p) => p.templates),
  ],
}));
export const TEMPLATES: Template[] = TEMPLATE_PACKS.flatMap((p) => p.templates);

/** Languages a template has copy for (English always). */
export function templateLangs(t: Template): TemplateLang[] {
  const langs = new Set<TemplateLang>(["en"]);
  for (const x of t.texts) {
    if (x.hi) langs.add("hi");
    for (const k of Object.keys(x.regional ?? {})) langs.add(k as TemplateLang);
  }
  return [...langs];
}

const textIn = (t: TemplateText, lang: TemplateLang) =>
  lang === "en" ? t.text : lang === "hi" ? (t.hi ?? t.text) : (t.regional?.[lang] ?? t.hi ?? t.text);

const stripExtension = (name: string) => name.replace(/\.[^.]+$/, "");

/** A video clip (plus linked sound) for `slot`, starting `inPoint` seconds into the file. */
function slotClips(
  slot: TemplateSlot,
  m: MediaInfo | undefined,
  inPoint: number,
): { video: Clip; audio?: Clip } {
  const slotLen = slot.end - slot.start;
  // Prayer moments keep gentle push-ins but never punch, ramp or change speed.
  const lively = !slot.sacred;
  const base: Clip = {
    id: uid("v"),
    label: m ? stripExtension(m.fileName) : slot.hint,
    start: slot.start,
    end: slot.start + (m ? Math.min(slotLen, Math.max(0.2, m.durationSec - inPoint)) : slotLen),
    slotId: slot.id,
    zoom: slot.crop?.zoom,
    transitionIn: slot.transition,
    fx:
      slot.push || (lively && slot.ramp)
        ? { push: slot.push, ramp: lively ? slot.ramp : undefined }
        : undefined,
    speed: lively ? slot.speed : undefined,
    zoomKeys: lively ? slot.punch?.map((t) => ({ t, zoom: slot.punchZoom ?? 1.12 })) : undefined,
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

/** Split layouts: one clip per segment, all from the same file and in sync with the timeline. */
function segmentClips(slot: TemplateSlot, m: MediaInfo | undefined, inPoint: number) {
  const pieces = slot.segments?.length ? slot.segments : [[slot.start, slot.end] as [number, number]];
  return pieces.map(([s, e], i) =>
    slotClips(
      { ...slot, start: s, end: e, transition: i === 0 ? slot.transition : undefined },
      m,
      inPoint + (s - slot.start),
    ),
  );
}

/**
 * Builds a project from a template: slots take the user's videos in order
 * (cycling if there are fewer videos than slots; a long video is used in
 * successive pieces), each trimmed to its slot. Text layers become text clips
 * in `lang` (falling back to English). Music in `project` is kept; its video,
 * sound and text are replaced.
 */
export function applyTemplate(
  template: Template,
  media: MediaInfo[],
  project?: Project,
  lang: TemplateLang = "en",
): Project {
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
    for (const { video, audio } of segmentClips(slot, m, inPoint)) {
      added.video.push(withGrade(video, template.look?.grade, template.look?.gradeAmount));
      if (audio) added.audio.push(audio);
    }
  });
  added.video.sort((a, b) => a.start - b.start);
  added.audio.sort((a, b) => a.start - b.start);

  for (const t of template.texts) {
    const text = textIn(t, lang);
    added.text.push({
      id: uid("t"),
      label: text,
      text,
      start: t.start,
      end: t.end,
      style: {
        preset: t.preset,
        y: t.y,
        size: t.size ?? (t.preset === "title" ? 0.065 : t.preset === "body" ? 0.032 : 0.045),
        color: t.color ?? (t.preset === "boxed" || t.preset === "neon" ? template.accents[0] : "#F5F4F0"),
        align: t.align ?? "center",
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
  const olds = (project.tracks.find((t) => t.kind === "video")?.clips ?? [])
    .filter((c) => c.slotId === slotId)
    .sort((a, b) => a.start - b.start);
  if (!olds.length || !media.hasVideo) return project;
  const first = olds[0].start;
  const swapped = new Map<string, Clip>();
  const sounds: Clip[] = [];
  const oldLinks = new Set(olds.map((c) => c.linkId).filter(Boolean));
  for (const video of olds) {
    const slot: TemplateSlot = {
      id: slotId,
      kind: "video",
      start: video.start,
      // Keep the slot's planned length even if the old clip was shorter.
      end: video.start + Math.max(video.end - video.start, plannedLength(project, video.id)),
      hint: video.label,
      crop: video.zoom ? { x: 0.5, y: 0.5, zoom: video.zoom } : undefined,
      transition: video.transitionIn,
    };
    // Split-layout pieces stay in sync: each starts as far into the file as it is into the slot.
    const { video: v, audio } = slotClips(slot, media, video.start - first);
    // Keep the slot's motion and grade (fx, speed, colour); the new file gets a fresh crop.
    swapped.set(video.id, {
      ...video,
      ...v,
      id: video.id,
      fx: video.fx,
      speed: video.speed,
      cropPath: undefined,
      zoomKeys: undefined,
    });
    if (audio) sounds.push(audio);
  }
  return {
    ...project,
    updatedAt: Date.now(),
    tracks: project.tracks.map((t) => {
      if (t.kind === "video") return { ...t, clips: t.clips.map((c) => swapped.get(c.id) ?? c) };
      if (t.kind !== "audio") return t;
      const kept = t.clips.filter((c) => !(c.slotId === slotId || (c.linkId && oldLinks.has(c.linkId))));
      return { ...t, clips: [...kept, ...sounds].sort((a, b) => a.start - b.start) };
    }),
  };
}

/** Planned clip length: up to the next clip on the video track. */
function plannedLength(project: Project, clipId: string) {
  const clips = [...(project.tracks.find((t) => t.kind === "video")?.clips ?? [])].sort(
    (a, b) => a.start - b.start,
  );
  const i = clips.findIndex((c) => c.id === clipId);
  const next = clips[i + 1];
  return next ? next.start - clips[i].start : clips[i].end - clips[i].start;
}
