// Animated caption style presets. A style is plain data so the preview, the
// player overlay and (later) the export renderer all read the same spec.
// Colours are Verso token variables, so they follow the brand kit.

export type CaptionAnimation = "pop" | "fade" | "slide" | "typewriter";
/** How the word being spoken stands out. */
export type CaptionHighlight = "color" | "fill" | "box" | "none";
export type CaptionBackground = "none" | "box" | "pill";

export interface CaptionStyle {
  id: string;
  name: string;
  fontWeight: 500 | 600 | 700 | 800;
  textCase: "none" | "upper";
  /** Relative size: 1 is the standard caption size for the frame. */
  scale: number;
  textColor: string;
  highlight: CaptionHighlight;
  highlightColor: string;
  background: CaptionBackground;
  backgroundColor: string;
  /** Text outline (stroke), if any. */
  outline?: { color: string; width: number };
  /** Soft coloured glow around letters. */
  glow?: string;
  animation: CaptionAnimation;
  /** Show only the word being spoken plus the words before it. */
  revealWords: boolean;
}

const ink = "var(--vs-color-neutral-950)";
const paper = "var(--vs-color-neutral-0)";

export const CAPTION_STYLES: CaptionStyle[] = [
  {
    id: "bold-pop",
    name: "Bold pop",
    fontWeight: 800,
    textCase: "upper",
    scale: 1.15,
    textColor: paper,
    highlight: "color",
    highlightColor: "var(--vs-color-track-text)",
    background: "none",
    backgroundColor: "transparent",
    outline: { color: ink, width: 3 },
    animation: "pop",
    revealWords: false,
  },
  {
    id: "clean",
    name: "Clean subtitle",
    fontWeight: 600,
    textCase: "none",
    scale: 0.85,
    textColor: paper,
    highlight: "none",
    highlightColor: paper,
    background: "box",
    backgroundColor: "color-mix(in srgb, var(--vs-color-neutral-950) 72%, transparent)",
    animation: "fade",
    revealWords: false,
  },
  {
    id: "karaoke",
    name: "Karaoke fill",
    fontWeight: 800,
    textCase: "none",
    scale: 1,
    textColor: "color-mix(in srgb, var(--vs-color-neutral-0) 55%, transparent)",
    highlight: "fill",
    highlightColor: "var(--vs-color-track-captions)",
    background: "none",
    backgroundColor: "transparent",
    outline: { color: ink, width: 2 },
    animation: "slide",
    revealWords: false,
  },
  {
    id: "boxed",
    name: "Boxed",
    fontWeight: 700,
    textCase: "upper",
    scale: 1,
    textColor: paper,
    highlight: "box",
    highlightColor: "var(--vs-color-track-video)",
    background: "none",
    backgroundColor: "transparent",
    outline: { color: ink, width: 2 },
    animation: "pop",
    revealWords: false,
  },
  {
    id: "neon",
    name: "Neon outline",
    fontWeight: 800,
    textCase: "upper",
    scale: 1.05,
    textColor: "transparent",
    highlight: "color",
    highlightColor: "var(--vs-color-track-audio)",
    background: "none",
    backgroundColor: "transparent",
    outline: { color: "var(--vs-color-track-effects)", width: 1.5 },
    glow: "var(--vs-color-track-effects)",
    animation: "fade",
    revealWords: false,
  },
  {
    id: "big-emoji",
    name: "Big & emoji-friendly",
    fontWeight: 800,
    textCase: "none",
    scale: 1.4,
    textColor: ink,
    highlight: "color",
    highlightColor: "var(--vs-color-semantic-info)",
    background: "pill",
    backgroundColor: paper,
    animation: "pop",
    revealWords: false,
  },
  {
    id: "typewriter",
    name: "Typewriter",
    fontWeight: 600,
    textCase: "none",
    scale: 0.95,
    textColor: paper,
    highlight: "none",
    highlightColor: paper,
    background: "box",
    backgroundColor: "color-mix(in srgb, var(--vs-color-neutral-950) 60%, transparent)",
    animation: "typewriter",
    revealWords: true,
  },
];

export const DEFAULT_CAPTION_STYLE = CAPTION_STYLES[0];

export function captionStyle(id: string | undefined): CaptionStyle {
  return CAPTION_STYLES.find((s) => s.id === id) ?? DEFAULT_CAPTION_STYLE;
}
