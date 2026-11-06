// Template format. Templates are original Verso designs: a timed layout of
// media slots and text layers that applyTemplate fills with the user's clips.
import type { AspectRatio, Look, TextStyle, TransitionKind } from "../lib/project";

export type PackId = "trending" | "cinematic" | "podcast" | "creator" | "festive" | "business";

export interface TemplateSlot {
  id: string;
  /** "photo" slots hold a still moment; any video works, held on its frame. */
  kind: "video" | "photo";
  /** Timeline seconds. */
  start: number;
  end: number;
  /** Shown in the slot filler, e.g. "Your strongest line". */
  hint: string;
  /** Where to keep in frame when cropping (0..1, 0.5 = centre) and how far to zoom. */
  crop?: { x: number; y: number; zoom?: number };
  /** Transition into this slot from the previous one. */
  transition?: { kind: TransitionKind; duration: number };
  /** Slow push-in: extra zoom reached by the slot end (0.08 = 8%). */
  push?: number;
  /** Playback speed for a ramp moment (0.5 = slow motion). */
  speed?: number;
  /** Punch-in zooms, seconds from the slot start (on the beat). */
  punch?: number[];
  /** Punch-in scale (default 1.12). */
  punchZoom?: number;
  /** Speed curve: speed (1 = normal) at seconds from the slot start. */
  ramp?: { t: number; speed: number }[];
  /** Prayer or ritual footage: no punch-ins, ramps or stickers. */
  sacred?: boolean;
  /** Split layouts: which panel this slot belongs to. */
  region?: "top" | "middle" | "bottom";
  /** Split layouts: timeline pieces this slot shows (cuts alternate between panels). */
  segments?: [number, number][];
  /** Shortest source clip (seconds) that fills the slot; shown as "Min clip N s". Filled in by withRules. */
  minClip?: number;
}

/** The three text styles a template uses: the hook line, supporting points, the call to action. */
export type TextRole = "headline" | "point" | "cta";

export interface TemplateText {
  id: string;
  /** Placeholder copy the user edits. */
  text: string;
  start: number;
  end: number;
  preset: TextStyle["preset"];
  /** 0 = top, 1 = bottom. */
  y: number;
  size?: number;
  /** Defaults to the template's first accent. */
  color?: string;
  animation?: TextStyle["animation"];
  font?: TextStyle["font"];
  align?: TextStyle["align"];
  /** Hinglish copy (Hindi in Latin script); the default language when present. */
  hi?: string;
  /** Headline, point or CTA. Filled in by withRules when the author leaves it out. */
  role?: TextRole;
  /** Regional copy (Tamil, Malayalam, Bengali, Marathi). */
  regional?: Partial<Record<RegionalLang, string>>;
}

export type RegionalLang = "ta" | "ml" | "bn" | "mr";
export type TemplateLang = "en" | "hi" | RegionalLang;

export interface Template {
  id: string;
  name: string;
  pack: PackId;
  /** One line for the card. */
  blurb: string;
  aspect: AspectRatio;
  /** Seconds. */
  duration: number;
  slots: TemplateSlot[];
  texts: TemplateText[];
  /** Caption style id (Project.captionStyle). */
  captionStyle: string;
  /** Suggested music feel, shown on the card. */
  musicMood: string;
  /** Two accent colours: text highlight and card gradient. */
  accents: [string, string];
  pro?: boolean;
  /** Grain, letterbox, leaks, flare, grade and dips applied to the project. */
  look?: Look;
  /** Shows a "New" badge on the card. */
  isNew?: boolean;
  /** Designed for a split screen; until the canvas supports panels, panels take turns. */
  layout?: "split-v" | "split-h" | "triptych-v" | "pip";
  /** Seconds a cut may move to land on a beat; defaults to the pack's BEAT_SNAP_TOLERANCE. */
  beatSnap?: number;
}

export interface TemplatePack {
  id: PackId;
  name: string;
  templates: Template[];
}
