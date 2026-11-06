// Template format. Templates are original Verso designs: a timed layout of
// media slots and text layers that applyTemplate fills with the user's clips.
import type { AspectRatio, TextStyle, TransitionKind } from "../lib/project";

export type PackId = "podcast" | "creator" | "festive";

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
}

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
}

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
}

export interface TemplatePack {
  id: PackId;
  name: string;
  templates: Template[];
}
