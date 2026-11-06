// On-device voiceover and dubbing: Rust command wrappers (src-tauri/src/commands/voice.rs)
// and pure transforms that return new Projects.
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { editSegmentText, type CaptionSegment } from "./captions";
import type { MediaInfo } from "./media";
import { uid, type Clip, type Project } from "./project";

export type VoiceLang = "en" | "hi" | "mr";
/** What the captions are written in. Hinglish = Hindi in English letters. */
export type SourceLang = VoiceLang | "hinglish";

export const VOICE_LANGUAGES: { id: VoiceLang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "hi", label: "हिंदी" },
  { id: "mr", label: "मराठी" },
];

export const SOURCE_LANGUAGES: { id: SourceLang; label: string }[] = [
  ...VOICE_LANGUAGES,
  { id: "hinglish", label: "Hinglish" },
];

/** Ids match `PACKS` in src-tauri/src/voice/models.rs. */
export const VOICE_PACK = "voice";
export const EN_INDIC_PACK = "mt_en_indic";
export const INDIC_EN_PACK = "mt_indic_en";

export interface VoicePack {
  id: string;
  name: string;
  purpose: string;
  sizeBytes: number;
  licence: string;
  installed: boolean;
}

export interface Voice {
  id: string;
  name: string;
  /** Language the voice was trained on. */
  lang: "en" | "hi";
  accent: string;
  gender: "female" | "male";
}

export interface VoiceProgress {
  task: "download" | "synthesize" | "translate" | "dub";
  id: string;
  percent: number;
  stage: "downloading" | "speaking" | "translating";
}

export interface DubSegment {
  start: number;
  end: number;
  text: string;
}

export const listVoiceModels = () => invoke<{ packs: VoicePack[]; voices: Voice[] }>("voice_models");
export const downloadVoiceModel = (id: string) => invoke<void>("download_voice_model", { id });
/** Returns the path of a WAV in the app cache. `speed` 1 = normal. */
export const synthesize = (text: string, voiceId: string, speed: number) =>
  invoke<string>("synthesize", { text, voiceId, speed });
export const translate = (texts: string[], from: SourceLang, to: VoiceLang) =>
  invoke<string[]>("translate", { texts, from, to });
/** Pass `from === to` when the lines are already translated. The WAV starts at the first segment. */
export const dub = (segments: DubSegment[], from: SourceLang, to: VoiceLang, voiceId: string) =>
  invoke<string>("dub", { segments, from, to, voiceId });

export function onVoiceProgress(cb: (p: VoiceProgress) => void): Promise<UnlistenFn> {
  return listen<VoiceProgress>("voice://progress", (e) => cb(e.payload));
}

/** Packs a job needs: always the voices, plus a translator when the languages differ. */
export function packsFor(from: SourceLang, to: VoiceLang): string[] {
  if (from === to) return [VOICE_PACK];
  return [VOICE_PACK, to === "en" ? INDIC_EN_PACK : EN_INDIC_PACK];
}

/**
 * Voices for a language. Hindi voices also read Marathi (no Marathi voice exists
 * under a commercial licence yet) and read English with an Indian accent.
 */
export function voicesFor(voices: Voice[], lang: VoiceLang): Voice[] {
  if (lang === "en") return [...voices].sort((a, b) => (a.lang === "hi" ? 0 : 1) - (b.lang === "hi" ? 0 : 1));
  return voices.filter((v) => v.lang === "hi");
}

export function voiceLabel(v: Voice, lang: VoiceLang): string {
  const accent = v.lang === "hi" && lang === "en" ? "Indian English" : v.accent;
  return `${v.name} · ${accent} · ${v.gender}`;
}

const captionClips = (project: Project) =>
  [...(project.tracks.find((t) => t.kind === "captions")?.clips ?? [])].sort((a, b) => a.start - b.start);

const captionText = (c: Clip) => c.text ?? c.label;

/** Caption lines on the timeline (timeline seconds), in order. */
export function captionSegments(project: Project): CaptionSegment[] {
  return captionClips(project)
    .filter((c) => captionText(c).trim())
    .map((c) => ({ start: c.start, end: c.end, text: captionText(c), words: c.words ?? [] }));
}

/** All caption text, one line per caption: a starting script for a voiceover. */
export function captionScript(project: Project): string {
  return captionSegments(project)
    .map((s) => s.text)
    .join("\n");
}

function addMusicClip(project: Project, clip: Clip): Project {
  return {
    ...project,
    updatedAt: Date.now(),
    tracks: project.tracks.map((t) =>
      t.kind === "music" ? { ...t, clips: [...t.clips, clip].sort((a, b) => a.start - b.start) } : t,
    ),
  };
}

/** Puts a generated voice on the Music track at `at` (the playhead). Returns the project and the new clip id. */
export function addVoiceover(project: Project, source: MediaInfo, at: number, label = "Voiceover") {
  const id = uid("m");
  const clip: Clip = {
    id,
    label,
    start: at,
    end: at + Math.max(0.1, source.durationSec),
    inPoint: 0,
    source,
    volume: 1,
  };
  return { project: addMusicClip(project, clip), id };
}

/**
 * Applies a finished dub: mutes the original Sound clips under the dub, swaps
 * caption text for `translated` (same order as `captionSegments`, timings kept)
 * and adds the dubbed voice at `at` (the first caption's start).
 */
export function applyDub(
  project: Project,
  source: MediaInfo,
  at: number,
  translated: string[],
  lang: VoiceLang,
): Project {
  const end = at + source.durationSec;
  const lines = captionClips(project).filter((c) => captionText(c).trim());
  const newText = new Map(lines.map((c, i) => [c.id, translated[i]]));
  const muted: Project = {
    ...project,
    tracks: project.tracks.map((t) => {
      if (t.kind === "audio")
        return { ...t, clips: t.clips.map((c) => (c.start < end && c.end > at ? { ...c, volume: 0 } : c)) };
      if (t.kind === "captions")
        return {
          ...t,
          clips: t.clips.map((c) => {
            const text = newText.get(c.id);
            if (text === undefined) return c;
            const seg = editSegmentText(
              { start: c.start, end: c.end, text: captionText(c), words: c.words ?? [] },
              text,
            );
            return { ...c, label: seg.text, ...(c.text !== undefined && { text: seg.text }), words: seg.words };
          }),
        };
      return t;
    }),
  };
  const name = VOICE_LANGUAGES.find((l) => l.id === lang)?.label ?? lang;
  return addMusicClip(muted, {
    id: uid("m"),
    label: `Dub · ${name}`,
    start: at,
    end,
    inPoint: 0,
    source,
    volume: 1,
  });
}
