// Stickers: emoji and Verso's own simple shapes, placed as text-track clips
// so they move, trim and export like text. Shapes are original SVGs.
import { uid, type Clip, type Project } from "./project";

export interface Sticker {
  id: string;
  label: string;
  /** Emoji text, or an SVG data URL for shapes. */
  emoji?: string;
  svg?: string;
}

export const EMOJI: string[] = [
  "🔥", "😂", "😍", "🤯", "👀", "💯", "✨", "🙌", "👉", "👇", "❤️", "💡", "✅", "❌", "⭐", "🎉",
  "🙏", "🪔", "🎊", "🌸", "📈", "💰", "🎧", "🎬", "📍", "⏰", "🤝", "🚀", "😎", "🥳", "🤔", "📢",
];

const svg = (body: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>${body}</svg>`)}`;

export const SHAPES: Sticker[] = [
  { id: "arrow", label: "Arrow", svg: svg("<path d='M10 50h62' stroke='#FFB547' stroke-width='10' stroke-linecap='round'/><path d='M58 26l26 24-26 24' fill='none' stroke='#FFB547' stroke-width='10' stroke-linecap='round' stroke-linejoin='round'/>") },
  { id: "circle", label: "Circle", svg: svg("<ellipse cx='50' cy='50' rx='42' ry='34' fill='none' stroke='#F472B6' stroke-width='6' stroke-dasharray='240 30' transform='rotate(-8 50 50)'/>") },
  { id: "burst", label: "Burst", svg: svg("<path d='M50 6l9 22 23-8-11 21 23 9-23 9 11 21-23-8-9 22-9-22-23 8 11-21-23-9 23-9-11-21 23 8z' fill='#FFB547'/>") },
  { id: "bubble", label: "Speech bubble", svg: svg("<path d='M14 18h72a8 8 0 0 1 8 8v36a8 8 0 0 1-8 8H44l-18 16v-16H14a8 8 0 0 1-8-8V26a8 8 0 0 1 8-8z' fill='#F5F4F0'/>") },
  { id: "underline", label: "Underline", svg: svg("<path d='M6 60c20-10 40 6 60-2s22-6 28-4' fill='none' stroke='#2FD4A3' stroke-width='9' stroke-linecap='round'/>") },
  { id: "follow", label: "Follow pill", svg: svg("<rect x='4' y='32' width='92' height='36' rx='18' fill='#5B8CFF'/><path d='M28 50h18M37 41v18' stroke='#0B0B0F' stroke-width='6' stroke-linecap='round'/><circle cx='66' cy='50' r='7' fill='#0B0B0F'/>") },
  { id: "spark", label: "Sparkle", svg: svg("<path d='M50 8c4 26 16 38 42 42-26 4-38 16-42 42-4-26-16-38-42-42 26-4 38-16 42-42z' fill='#C084FC'/>") },
  { id: "check", label: "Check", svg: svg("<circle cx='50' cy='50' r='42' fill='#34D399'/><path d='M30 52l14 14 26-30' fill='none' stroke='#0B0B0F' stroke-width='9' stroke-linecap='round' stroke-linejoin='round'/>") },
];

/** Adds a sticker for 2.5 s at the playhead, centred near the top third. */
export function addSticker(project: Project, time: number, s: Sticker): { project: Project; id: string } {
  const id = uid("s");
  const clip: Clip = {
    id,
    label: s.label,
    text: s.emoji ?? "",
    start: time,
    end: time + 2.5,
    sticker: s.svg ? { svg: s.svg } : undefined,
    style: { preset: "title", y: 0.32, size: s.emoji ? 0.09 : 0.14, color: "#F5F4F0", align: "center", animation: "pop" },
  };
  return {
    id,
    project: {
      ...project,
      updatedAt: Date.now(),
      tracks: project.tracks.map((t) =>
        t.kind === "text" ? { ...t, clips: [...t.clips, clip].sort((a, b) => a.start - b.start) } : t,
      ),
    },
  };
}
