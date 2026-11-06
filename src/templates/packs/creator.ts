import type { Template, TemplatePack } from "../types";
import { seq, total } from "./build";

const quick = { kind: "slide", duration: 0.2 } as const;

const dayInLife = seq("dl", [
  [2, "Morning: first light", { crop: { x: 0.5, y: 0.5, zoom: 1.1 } }],
  [2, "Coffee or breakfast", { transition: quick }],
  [2, "Getting to work", { transition: quick }],
  [2, "The busy middle", { transition: quick }],
  [2, "A small win", { transition: quick }],
  [3, "Evening wind-down", { transition: { kind: "fade", duration: 0.4 } }],
]);

const threeTips = seq("tt", [
  [3, "Tell them what they'll get", { crop: { x: 0.5, y: 0.4, zoom: 1.1 } }],
  [4, "Tip one", { transition: { kind: "zoom", duration: 0.25 } }],
  [4, "Tip two", { transition: { kind: "zoom", duration: 0.25 } }],
  [4, "Tip three", { transition: { kind: "zoom", duration: 0.25 } }],
  [2.5, "Ask them to save it", { crop: { x: 0.5, y: 0.4 } }],
]);

const beforeAfter = seq("ba", [
  [4, "Before", { crop: { x: 0.5, y: 0.5 } }],
  [1, "The switch moment", { kind: "photo", transition: { kind: "zoom", duration: 0.2 } }],
  [5, "After", { crop: { x: 0.5, y: 0.5, zoom: 1.05 }, transition: { kind: "dissolve", duration: 0.35 } }],
]);

const productDrop = seq("pd", [
  [1.5, "Tease: a close detail", { kind: "photo", crop: { x: 0.5, y: 0.5, zoom: 1.3 } }],
  [1.5, "Another angle", { kind: "photo", crop: { x: 0.5, y: 0.5, zoom: 1.2 }, transition: quick }],
  [4, "The full reveal", { transition: { kind: "zoom", duration: 0.3 } }],
  [4, "In use", { transition: { kind: "fade", duration: 0.25 } }],
  [3, "Price and where to buy", { kind: "photo" }],
]);

export const creatorPack: TemplatePack = {
  id: "creator",
  name: "Creator basics",
  templates: [
    {
      id: "creator-day-in-life",
      name: "Day in my life",
      pack: "creator",
      blurb: "Six quick moments from morning to night.",
      aspect: "9:16",
      duration: total(dayInLife),
      slots: dayInLife,
      texts: [
        { id: "dl-t1", text: "A day in my life", start: 0, end: 2, preset: "title", y: 0.2 },
        { id: "dl-t2", text: "6:30 am", start: 0, end: 2, preset: "body", y: 0.8 },
        { id: "dl-t3", text: "and that's a wrap", start: 10, end: 13, preset: "subtitle", y: 0.75 },
      ],
      captionStyle: "clean",
      musicMood: "Upbeat acoustic",
      accents: ["#FFB547", "#2B1E0D"],
    },
    {
      id: "creator-three-tips",
      name: "3 tips",
      pack: "creator",
      blurb: "Promise, deliver three tips, ask for the save.",
      aspect: "9:16",
      duration: total(threeTips),
      slots: threeTips,
      texts: [
        { id: "tt-t0", text: "3 tips I wish I knew sooner", start: 0, end: 3, preset: "title", y: 0.2 },
        { id: "tt-t1", text: "1", start: 3, end: 7, preset: "outline", y: 0.18, size: 0.1 },
        { id: "tt-t2", text: "2", start: 7, end: 11, preset: "outline", y: 0.18, size: 0.1 },
        { id: "tt-t3", text: "3", start: 11, end: 15, preset: "outline", y: 0.18, size: 0.1 },
        { id: "tt-t4", text: "Save this for later", start: 15, end: 17.5, preset: "boxed", y: 0.75 },
      ],
      captionStyle: "bold-pop",
      musicMood: "Light, bouncy",
      accents: ["#5B8CFF", "#101A30"],
    },
    {
      id: "creator-before-after",
      name: "Before / after",
      pack: "creator",
      blurb: "Show the change. The flash in the middle sells it.",
      aspect: "9:16",
      duration: total(beforeAfter),
      slots: beforeAfter,
      texts: [
        { id: "ba-t1", text: "Before", start: 0, end: 4, preset: "boxed", y: 0.15, size: 0.04 },
        { id: "ba-t2", text: "After", start: 5, end: 10, preset: "boxed", y: 0.15, size: 0.04 },
      ],
      captionStyle: "clean",
      musicMood: "Drop on the switch",
      accents: ["#C084FC", "#22142E"],
    },
    {
      id: "creator-product-drop",
      name: "Product drop",
      pack: "creator",
      blurb: "Tease the details, reveal it, then say where to get it.",
      aspect: "9:16",
      duration: total(productDrop),
      slots: productDrop,
      texts: [
        { id: "pd-t1", text: "Something new is here", start: 0, end: 3, preset: "subtitle", y: 0.8 },
        { id: "pd-t2", text: "Meet the product", start: 3, end: 7, preset: "title", y: 0.2 },
        { id: "pd-t3", text: "₹999 · Link in bio", start: 11, end: 14, preset: "neon", y: 0.5 },
      ],
      captionStyle: "bold-pop",
      musicMood: "Punchy electronic",
      accents: ["#FF4A2B", "#2E120C"],
      pro: true,
    },
  ] satisfies Template[],
};
