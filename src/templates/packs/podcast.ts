import type { Template, TemplatePack } from "../types";
import { seq, total } from "./build";

const hookQuote = seq("hq", [
  [2.5, "The hook: your boldest line", { crop: { x: 0.5, y: 0.4, zoom: 1.15 } }],
  [9, "The answer, in full", { crop: { x: 0.5, y: 0.45 }, transition: { kind: "zoom", duration: 0.3 } }],
  [
    3.5,
    "A reaction or nod",
    { crop: { x: 0.5, y: 0.4, zoom: 1.1 }, transition: { kind: "fade", duration: 0.25 } },
  ],
]);

const twoSpeaker = seq("ts", [
  [4, "Speaker one asks", { crop: { x: 0.35, y: 0.42 } }],
  [5, "Speaker two answers", { crop: { x: 0.65, y: 0.42 } }],
  [4, "Speaker one reacts", { crop: { x: 0.35, y: 0.42, zoom: 1.1 } }],
  [5, "Speaker two lands it", { crop: { x: 0.65, y: 0.42, zoom: 1.1 } }],
]);

const bigNumber = seq("bn", [
  [3, "Set up the number", { crop: { x: 0.5, y: 0.45 } }],
  [
    4,
    "Say the number",
    { kind: "photo", crop: { x: 0.5, y: 0.4, zoom: 1.2 }, transition: { kind: "zoom", duration: 0.25 } },
  ],
  [7, "Why it matters", { crop: { x: 0.5, y: 0.45 }, transition: { kind: "dissolve", duration: 0.3 } }],
]);

const clipChapters = seq("cc", [
  [3, "Episode cold open", { crop: { x: 0.5, y: 0.42, zoom: 1.1 } }],
  [6, "Point one", { transition: { kind: "slide", duration: 0.3 } }],
  [6, "Point two", { transition: { kind: "slide", duration: 0.3 } }],
  [5, "Where to listen", { kind: "photo", transition: { kind: "fade", duration: 0.3 } }],
]);

export const podcastPack: TemplatePack = {
  id: "podcast",
  name: "Podcast highlights",
  templates: [
    {
      id: "podcast-hook-quote",
      name: "Hook + quote",
      pack: "podcast",
      blurb: "Open on your boldest line, then let the answer breathe.",
      aspect: "9:16",
      duration: total(hookQuote),
      slots: hookQuote,
      texts: [
        { id: "hq-t1", text: "Nobody talks about this", start: 0, end: 2.5, preset: "title", y: 0.2 },
        {
          id: "hq-t2",
          text: "Guest name · Show name",
          start: 2.5,
          end: 6,
          preset: "boxed",
          y: 0.82,
          size: 0.032,
        },
      ],
      captionStyle: "bold-pop",
      musicMood: "Low, warm pulse",
      accents: ["#FFB547", "#3B2A12"],
    },
    {
      id: "podcast-two-speaker",
      name: "Two-speaker",
      pack: "podcast",
      blurb: "Cut between two voices so it feels like a real back-and-forth.",
      aspect: "9:16",
      duration: total(twoSpeaker),
      slots: twoSpeaker,
      texts: [
        { id: "ts-t1", text: "Host", start: 0, end: 4, preset: "boxed", y: 0.78, size: 0.03 },
        { id: "ts-t2", text: "Guest", start: 4, end: 9, preset: "boxed", y: 0.78, size: 0.03 },
      ],
      captionStyle: "clean",
      musicMood: "Soft lo-fi",
      accents: ["#5B8CFF", "#121C33"],
    },
    {
      id: "podcast-big-number",
      name: "Big number stat",
      pack: "podcast",
      blurb: "One number, huge on screen, then the story behind it.",
      aspect: "9:16",
      duration: total(bigNumber),
      slots: bigNumber,
      texts: [
        { id: "bn-t1", text: "73%", start: 3, end: 7, preset: "outline", y: 0.4, size: 0.14 },
        { id: "bn-t2", text: "of people get this wrong", start: 3.3, end: 7, preset: "subtitle", y: 0.55 },
      ],
      captionStyle: "bold-pop",
      musicMood: "Tense build",
      accents: ["#F472B6", "#2E1222"],
      pro: true,
    },
    {
      id: "podcast-chapters",
      name: "Episode in three beats",
      pack: "podcast",
      blurb: "Cold open, two points, and where to listen. A trailer in 20 seconds.",
      aspect: "9:16",
      duration: total(clipChapters),
      slots: clipChapters,
      texts: [
        { id: "cc-t1", text: "1 · The setup", start: 3, end: 5, preset: "boxed", y: 0.16, size: 0.032 },
        { id: "cc-t2", text: "2 · The twist", start: 9, end: 11, preset: "boxed", y: 0.16, size: 0.032 },
        { id: "cc-t3", text: "New episode out now", start: 15, end: 20, preset: "title", y: 0.45 },
      ],
      captionStyle: "clean",
      musicMood: "Bright, steady",
      accents: ["#2FD4A3", "#0F2A22"],
      pro: true,
    },
  ] satisfies Template[],
};
