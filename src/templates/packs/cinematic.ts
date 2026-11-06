import type { Template, TemplatePack } from "../types";
import { seq, total } from "./build";

const slowFade = { kind: "fade", duration: 0.6 } as const;
const melt = { kind: "dissolve", duration: 0.8 } as const;

const filmMemories = seq("fm", [
  [3, "An old favourite moment", { push: 0.05 }],
  [3, "Laughing together", { transition: melt }],
  [3, "A place that matters", { transition: melt }],
  [3, "Golden light, last look", { push: 0.06, transition: melt }],
]);

const travel = seq("tv", [
  [2, "Taking off or setting out", { push: 0.05 }],
  [1.5, "Window view", { transition: { kind: "slide", duration: 0.25 } }],
  [1.5, "Streets", { punch: [0.2], transition: { kind: "slide", duration: 0.25 } }],
  [1.5, "Food", { punch: [0.2], transition: { kind: "slide", duration: 0.25 } }],
  [1.5, "People", { punch: [0.2], transition: { kind: "slide", duration: 0.25 } }],
  [3, "The big view", { push: 0.08, transition: melt }],
  [2.5, "Walking away", { transition: slowFade }],
]);

const base = { pack: "cinematic", aspect: "9:16", isNew: true } as const;
const serifCard = { preset: "title", font: "serif", animation: "blur-in" } as const;

export const cinematicPack: TemplatePack = {
  id: "cinematic",
  name: "Cinematic",
  templates: [
    {
      ...base,
      id: "cine-film-memories",
      name: "Film memories",
      blurb: "Grain, warm light leaks and soft dissolves.",
      duration: total(filmMemories),
      slots: filmMemories,
      texts: [
        { ...serifCard, id: "fm-t1", text: "Summer, remembered", start: 0.5, end: 3.5, y: 0.78, size: 0.05 },
      ],
      captionStyle: "clean",
      musicMood: "Nostalgic piano",
      accents: ["#FFB36B", "#2A1606"],
      look: { grain: 0.6, leak: { style: "warm", strength: 0.45 }, grade: "faded-film", vignette: 0.4, dip: 0.5 },
    },
    {
      ...base,
      id: "cine-travel",
      name: "Travel montage",
      blurb: "Quick slides on the beat, then a wide that breathes.",
      duration: total(travel),
      slots: travel,
      texts: [
        { ...serifCard, id: "tv-t1", text: "Lisbon", start: 0.3, end: 2, y: 0.5, size: 0.08 },
        { id: "tv-t2", text: "5 days · 3 cities", start: 9.5, end: 13.5, preset: "body", y: 0.82, animation: "typewriter" },
      ],
      captionStyle: "clean",
      musicMood: "Upbeat indie folk",
      accents: ["#FF9F5A", "#0B2230"],
      look: { grade: "teal-ember", letterbox: "2.39", grain: 0.1 },
      pro: true,
    },
  ] satisfies Template[],
};
