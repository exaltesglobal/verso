// One-tap edits: a single registry the Quick workspace, clip right-click menus
// and "Do it all" read from. Every action calls the existing editing functions;
// nothing here re-implements an edit. Each run returns a new project that the
// caller applies as one undo step.
import type { IconName } from "../components/Icon";
import type { CreditAction } from "./credits";
import {
  ACCURACY,
  CAPTION_LANGUAGES,
  downloadModel,
  listModels,
  segmentsToClips,
  transcribe,
  replaceCaptions,
  type CaptionSegment,
} from "./captions";
import { getSettings } from "./settings";
import {
  PAUSE_PRESETS,
  applyPunchIns,
  beatMarkers,
  captionEmphasisTimes,
  collectWords,
  detectBeats,
  detectEmphasis,
  detectSilences,
  removeSilences,
  snapCutsToBeats,
  videoClips,
  type EmphasisMoment,
} from "./smart";
import { applyEnhanced, enhanceAudio, soundClipFor } from "./enhance";
import { applyHookTitle, hookIdeas } from "./insights";
import { withGrade } from "./looks";
import { addTextClip, projectDuration, updateClip, type Clip, type Project, type TrackKind } from "./project";

export type OneTapId =
  | "captions"
  | "remove-pauses"
  | "cut-to-beat"
  | "fit-9-16"
  | "clean-voice"
  | "hook-title"
  | "end-card"
  | "punch-ins"
  | "warm-look"
  | "loudness"
  | "mute";

/** Charges for an AI job and refunds it if the job throws (useCharged from credits.ts). */
export type Charge = <T>(action: CreditAction, units: number, job: () => Promise<T>) => Promise<T>;

export interface OneTapContext {
  project: Project;
  /** The clip the action was started from (right-click or selection), if any. */
  clip?: Clip;
  charge: Charge;
}

export interface OneTapAction {
  id: OneTapId;
  label: string;
  icon: IconName;
  /** One plain sentence for the tooltip. */
  hint: string;
  /** Credit price key for AI actions; null for free ones (no chip). */
  aiCost: CreditAction | null;
  /** Units for the price: minutes for per-minute actions, runs otherwise. */
  costUnits?: (p: Project) => number;
  /** Clip kinds the action shows for in clip menus and the Quick options column; "project" = whole reel. */
  appliesTo: (TrackKind | "project")[];
  /** Why it can't run right now, or null. */
  blocked: (p: Project) => string | null;
  /** True when running it again would change nothing (Do it all skips these). */
  done?: (p: Project) => boolean;
  run: (ctx: OneTapContext) => Promise<Project>;
  /** Toast line after it ran. */
  message: string;
}

const withSound = (p: Project) => videoClips(p).filter((c) => c.source?.hasAudio);
const mediaMinutes = (p: Project) => videoClips(p).reduce((s, c) => s + (c.end - c.start), 0) / 60;
const noVideo = (p: Project) => (videoClips(p).some((c) => c.source) ? null : "Add a video first.");
const noSound = (p: Project) => (withSound(p).length ? null : "Add a video with sound first.");
const NEEDS_CAPTIONS = "Add captions first.";
const noWords = (p: Project) => (collectWords(p).length ? null : NEEDS_CAPTIONS);
const hasCaptions = (p: Project) => !!p.tracks.find((t) => t.kind === "captions")?.clips.length;
const musicClip = (p: Project) => p.tracks.find((t) => t.kind === "music")?.clips.find((c) => c.source);

/** Captions for one clip with the on-device engine (same steps as the Captions panel). */
async function captionsFor(clip: Clip): Promise<Clip[]> {
  const source = clip.source;
  if (!source) return [];
  const saved = getSettings().captionLanguage;
  const language = CAPTION_LANGUAGES.find((l) => l.id === saved)?.id ?? "auto";
  const modelId = ACCURACY.find((a) => a.id === "balanced")?.modelId ?? ACCURACY[0].modelId;
  if (!(await listModels()).find((m) => m.id === modelId)?.present) await downloadModel(modelId);
  const inPoint = clip.inPoint ?? 0;
  const segments = await new Promise<CaptionSegment[]>((resolve, reject) => {
    let stop: (() => void) | undefined;
    transcribe(
      { path: source.path, inPoint, outPoint: inPoint + (clip.end - clip.start), language, modelId },
      {
        onProgress: () => undefined,
        onDone: (s) => {
          stop?.();
          resolve(s);
        },
        onError: (m) => {
          stop?.();
          reject(new Error(m));
        },
      },
    )
      .then((h) => {
        stop = h.stop;
      })
      .catch(reject);
  });
  return segmentsToClips(segments, clip);
}

/** Sets voice (video and sound) and music volumes in one go. */
function mix(p: Project, voice: number, music: number): Project {
  return {
    ...p,
    tracks: p.tracks.map((t) =>
      t.kind === "video" || t.kind === "audio"
        ? { ...t, clips: t.clips.map((c) => (c.source?.hasAudio ? { ...c, volume: voice } : c)) }
        : t.kind === "music"
          ? { ...t, clips: t.clips.map((c) => ({ ...c, volume: music })) }
          : t,
    ),
  };
}

export const ONE_TAP: OneTapAction[] = [
  {
    id: "captions",
    label: "Auto captions",
    icon: "captions",
    hint: "Write captions from what is said, on this computer.",
    aiCost: "captions",
    costUnits: mediaMinutes,
    appliesTo: ["project", "video"],
    blocked: noSound,
    done: hasCaptions,
    message: "Captions added.",
    run: async ({ project, charge }) =>
      charge("captions", mediaMinutes(project), async () => {
        let next = project;
        for (const c of withSound(project)) next = replaceCaptions(next, c, await captionsFor(c));
        return next;
      }),
  },
  {
    id: "remove-pauses",
    label: "Remove pauses",
    icon: "auto-cut",
    hint: "Cut the quiet gaps between sentences.",
    aiCost: null,
    appliesTo: ["project", "video", "audio"],
    blocked: noSound,
    message: "Pauses removed.",
    run: async ({ project }) => {
      const found: { id: string; spans: Awaited<ReturnType<typeof detectSilences>> }[] = [];
      for (const c of withSound(project))
        found.push({ id: c.id, spans: await detectSilences(c, PAUSE_PRESETS.Normal) });
      return found.reduce((p, f) => removeSilences(p, f.id, f.spans), project);
    },
  },
  {
    id: "cut-to-beat",
    label: "Cut to beat",
    icon: "music",
    hint: "Move every cut onto the beat of your music.",
    aiCost: null,
    appliesTo: ["project", "music"],
    blocked: (p) =>
      musicClip(p) ? (videoClips(p).length > 1 ? null : "Needs two or more clips.") : "Add music first.",
    message: "Cuts now land on the beat.",
    run: async ({ project }) => {
      const music = musicClip(project);
      if (!music?.source) return project;
      const info = await detectBeats(music.source);
      if (!info.beats.length) throw new Error("We couldn't hear a steady beat in this music.");
      return updateClip(snapCutsToBeats(project, beatMarkers(music, info.beats), 0.6), music.id, {
        beatSync: true,
      });
    },
  },
  {
    id: "fit-9-16",
    label: "Fit to 9:16",
    icon: "vertical",
    hint: "Make it a full-screen vertical reel.",
    aiCost: null,
    appliesTo: ["project"],
    blocked: () => null,
    done: (p) => p.aspect === "9:16",
    message: "Switched to full-screen vertical.",
    run: async ({ project }) => ({ ...project, aspect: "9:16" }),
  },
  {
    id: "clean-voice",
    label: "Clean voice",
    icon: "voiceover",
    hint: "Remove background noise and even out the voice.",
    aiCost: "enhance_audio",
    costUnits: mediaMinutes,
    appliesTo: ["video", "audio"],
    blocked: noSound,
    message: "Voice cleaned up.",
    run: async ({ project, clip, charge }) => {
      const targets = clip ? [clip] : withSound(project);
      const sounds = targets.map((c) => soundClipFor(project, c.id)).filter((c): c is Clip => !!c);
      if (!sounds.length) throw new Error("This clip has no sound to clean.");
      const minutes = sounds.reduce((s, c) => s + (c.end - c.start), 0) / 60;
      return charge("enhance_audio", minutes, async () => {
        let next = project;
        for (const s of sounds)
          next = applyEnhanced(next, s.id, (await enhanceAudio(s, "Normal")).outputPath);
        return next;
      });
    },
  },
  {
    id: "hook-title",
    label: "Add hook title",
    icon: "text",
    hint: "Put your strongest line on screen for the first 3 seconds.",
    aiCost: null,
    appliesTo: ["project"],
    blocked: (p) => noWords(p) ?? (hookIdeas(p, 1).length ? null : "No strong line found yet."),
    message: "Hook title added.",
    run: async ({ project }) => {
      const idea = hookIdeas(project, 1)[0];
      return idea ? applyHookTitle(project, idea.title) : project;
    },
  },
  {
    id: "end-card",
    label: "Add end card",
    icon: "skip-end",
    hint: "Ask people to follow in the last seconds.",
    aiCost: null,
    appliesTo: ["project"],
    blocked: noVideo,
    message: "End card added.",
    run: async ({ project }) => {
      const end = projectDuration(project);
      const { project: next, id } = addTextClip(
        project,
        Math.max(0, end - 2.5),
        "boxed",
        "Follow for part 2",
      );
      return updateClip(next, id, { end });
    },
  },
  {
    id: "punch-ins",
    label: "Punch-ins",
    icon: "zoom-in",
    hint: "Zoom in a little on the big moments.",
    aiCost: null,
    appliesTo: ["project", "video"],
    blocked: noSound,
    message: "Punch-ins added.",
    run: async ({ project }) => {
      const moments: Record<string, EmphasisMoment[]> = {};
      for (const c of withSound(project)) moments[c.id] = await detectEmphasis(c);
      return applyPunchIns(project, moments, 0.75, captionEmphasisTimes(collectWords(project)));
    },
  },
  {
    id: "warm-look",
    label: "Warm look",
    icon: "filters",
    hint: "Give every clip a warm, filmic colour.",
    aiCost: null,
    appliesTo: ["project", "video"],
    blocked: noVideo,
    message: "Warm look added.",
    run: async ({ project, clip }) => ({
      ...project,
      tracks: project.tracks.map((t) =>
        t.kind !== "video"
          ? t
          : {
              ...t,
              clips: t.clips.map((c) => (!clip || c.id === clip.id ? withGrade(c, "warm-film", 0.8) : c)),
            },
      ),
    }),
  },
  {
    id: "loudness",
    label: "Loudness fix",
    icon: "volume",
    hint: "Voice up front, music softly underneath.",
    aiCost: null,
    appliesTo: ["project", "audio", "music"],
    blocked: noSound,
    message: "Voice and music levels balanced.",
    run: async ({ project }) => mix(project, 1, 0.3),
  },
  {
    id: "mute",
    label: "Mute",
    icon: "volume-off",
    hint: "Turn this clip's sound off.",
    aiCost: null,
    appliesTo: ["video", "audio", "music"],
    blocked: () => null,
    message: "Muted.",
    run: async ({ project, clip }) => (clip ? updateClip(project, clip.id, { volume: 0 }) : project),
  },
];

export const oneTap = (id: OneTapId) => ONE_TAP.find((a) => a.id === id)!;

/** "Make it better" row at the top of Quick. */
export const MAKE_IT_BETTER: OneTapId[] = [
  "captions",
  "remove-pauses",
  "cut-to-beat",
  "fit-9-16",
  "clean-voice",
  "hook-title",
  "end-card",
  "punch-ins",
  "warm-look",
  "loudness",
];

/** Actions for a clip of this kind (right-click menu, Quick options column). */
export const actionsFor = (kind: TrackKind) => ONE_TAP.filter((a) => a.appliesTo.includes(kind));

// ---------- Do it all ----------

export type ContentKind = "talking" | "podcast" | "broll";

export const CONTENT_LABEL: Record<ContentKind, string> = {
  talking: "talking to camera",
  podcast: "a podcast or interview",
  broll: "footage without much talking",
};

/**
 * What kind of video this is, from what we already know: sound, speech
 * density from captions (words per second), shape and length, and whether a
 * speaker crop already found more than one face.
 */
export function detectContent(p: Project): ContentKind {
  const vids = videoClips(p);
  const words = collectWords(p).length;
  const dur = Math.max(1, projectDuration(p));
  if (!withSound(p).length || (words > 0 && words / dur < 0.8)) return "broll";
  const wide = vids.some((c) => (c.source?.width ?? 0) > (c.source?.height ?? 0));
  const twoFaces = vids.some((c) => c.cropPath && c.cropPath.layout !== "single");
  return twoFaces || (wide && dur > 120) ? "podcast" : "talking";
}

const PLAN: Record<ContentKind, OneTapId[]> = {
  // Captions first: later cuts carry the caption words along.
  talking: ["captions", "remove-pauses", "punch-ins", "hook-title", "loudness", "fit-9-16"],
  podcast: ["captions", "remove-pauses", "hook-title", "end-card", "loudness", "fit-9-16"],
  broll: ["fit-9-16", "cut-to-beat", "warm-look"],
};

/**
 * The steps Do it all would run, skipping ones that are blocked or already
 * done. A step that only waits for captions stays when captions run first.
 */
export function doItAllPlan(p: Project): { kind: ContentKind; steps: OneTapAction[] } {
  const kind = detectContent(p);
  const all = PLAN[kind].map(oneTap).filter((a) => !a.done?.(p));
  const captionsFirst = all.some((a) => a.id === "captions");
  const ok = (a: OneTapAction) => {
    const why = a.blocked(p);
    return !why || (captionsFirst && why === NEEDS_CAPTIONS);
  };
  return { kind, steps: all.filter(ok) };
}
