import type { Template, TemplatePack } from "../types";
import { seq, total } from "./build";

const slowFade = { kind: "fade", duration: 0.6 } as const;
const melt = { kind: "dissolve", duration: 0.8 } as const;

const widescreen = seq("ws", [
  [4, "A wide, quiet establishing shot", { push: 0.06 }],
  [3.5, "A detail that sets the mood", { push: 0.05, transition: melt }],
  [4.5, "Your subject enters", { push: 0.08, transition: melt }],
]);

const filmMemories = seq("fm", [
  [3, "An old favourite moment", { push: 0.05 }],
  [3, "Laughing together", { transition: melt }],
  [3, "A place that matters", { transition: melt }],
  [3, "Golden light, last look", { push: 0.06, transition: melt }],
]);

const nightStreaks = seq("ns", [
  [3, "City lights or traffic", { push: 0.05 }],
  [2.5, "Neon signs, rain or reflections", { transition: slowFade }],
  [3, "Your subject in the night", { push: 0.07, transition: slowFade }],
  [2.5, "The road ahead", { transition: slowFade }],
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

const moodyPortrait = seq("mp", [
  [4, "A close portrait, still", { crop: { x: 0.5, y: 0.4 }, push: 0.1 }],
  [3.5, "Eyes or hands, close", { crop: { x: 0.5, y: 0.45, zoom: 1.15 }, transition: melt }],
  [4, "Looking away", { push: 0.06, transition: melt }],
]);

const goldenHour = seq("gh", [
  [3.5, "Sun low on the horizon", { push: 0.06 }],
  [3, "Light through hair or leaves", { transition: melt }],
  [3, "Walking into the light", { push: 0.05, transition: melt }],
  [3.5, "Silhouette", { transition: slowFade }],
]);

const speedRamp = seq("sr", [
  [2, "Build-up, normal speed"],
  [2, "The moment, slowed right down", { speed: 0.5, push: 0.08, transition: { kind: "zoom", duration: 0.2 } }],
  [1.5, "Snap back to speed", { speed: 1.5, punch: [0], transition: { kind: "zoom", duration: 0.15 } }],
  [2.5, "The landing", { speed: 0.6, push: 0.05 }],
]);

const chapters = seq("ch", [
  [4, "Chapter one: the start", { push: 0.06 }],
  [4, "Chapter two: the turn", { push: 0.06, transition: slowFade }],
  [4, "Chapter three: the end", { push: 0.06, transition: slowFade }],
]);

const slowReveal = seq("rv", [
  [3, "Something hidden in shadow", { push: 0.04 }],
  [3, "A closer look", { push: 0.06, transition: melt }],
  [4, "The full reveal", { push: 0.1, transition: melt }],
]);

const forest = seq("fo", [
  [4, "Trees, mist or mountains", { push: 0.05 }],
  [3.5, "Moving through nature", { transition: melt }],
  [4.5, "Stillness", { push: 0.06, transition: slowFade }],
]);

const base = { pack: "cinematic", aspect: "9:16", isNew: true } as const;
const serifCard = { preset: "title", font: "serif", animation: "blur-in" } as const;

export const cinematicPack: TemplatePack = {
  id: "cinematic",
  name: "Cinematic",
  templates: [
    {
      ...base,
      id: "cine-widescreen",
      name: "Widescreen opener",
      blurb: "2.39 bars, slow push-ins and a serif title. Instant film.",
      duration: total(widescreen),
      slots: widescreen,
      texts: [
        { ...serifCard, id: "ws-t1", text: "The Long Way Home", start: 1, end: 5, y: 0.5, size: 0.06 },
        { id: "ws-t2", text: "a short film by you", start: 2.2, end: 5, preset: "body", y: 0.58, animation: "blur-in" },
      ],
      captionStyle: "clean",
      musicMood: "Slow strings swell",
      accents: ["#3FB8AF", "#081C1B"],
      look: { letterbox: "2.39", grade: "teal-ember", vignette: 0.35, grain: 0.15, dip: 0.6 },
    },
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
      id: "cine-night-streaks",
      name: "Night streaks",
      blurb: "Cool night grade with a drifting anamorphic streak.",
      duration: total(nightStreaks),
      slots: nightStreaks,
      texts: [
        { id: "ns-t1", text: "AFTER DARK", start: 0.5, end: 3, preset: "title", y: 0.5, size: 0.07, animation: "blur-in" },
      ],
      captionStyle: "neon",
      musicMood: "Synthwave pulse",
      accents: ["#5BA8FF", "#060E1C"],
      look: { grade: "night-blue", flare: { strength: 0.6, color: "#6FB6FF" }, letterbox: "1.85", vignette: 0.5, grain: 0.2 },
      pro: true,
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
    {
      ...base,
      id: "cine-moody-portrait",
      name: "Moody portrait",
      blurb: "Black and white, deep vignette, a slow push on the face.",
      duration: total(moodyPortrait),
      slots: moodyPortrait,
      texts: [
        { ...serifCard, id: "mp-t1", text: "Quiet", start: 1, end: 4, y: 0.82, size: 0.07 },
      ],
      captionStyle: "clean",
      musicMood: "Ambient cello",
      accents: ["#D6D6D6", "#111111"],
      look: { grade: "moody-mono", vignette: 0.75, grain: 0.45, dip: 0.6 },
      pro: true,
    },
    {
      ...base,
      id: "cine-golden-hour",
      name: "Golden hour",
      blurb: "Warm grade, a gold leak drifting across the frame.",
      duration: total(goldenHour),
      slots: goldenHour,
      texts: [
        { ...serifCard, id: "gh-t1", text: "chasing the light", start: 0.5, end: 3.5, y: 0.5, size: 0.055 },
      ],
      captionStyle: "clean",
      musicMood: "Warm acoustic swell",
      accents: ["#FFC857", "#2E1C04"],
      look: { grade: "golden-hour", leak: { style: "gold", strength: 0.4 }, vignette: 0.3, grain: 0.15 },
    },
    {
      ...base,
      id: "cine-speed-ramp",
      name: "Speed ramp",
      blurb: "Slow the big moment right down, then snap back.",
      duration: total(speedRamp),
      slots: speedRamp,
      texts: [
        { id: "sr-t1", text: "wait for it", start: 0, end: 2, preset: "body", y: 0.82, animation: "typewriter" },
      ],
      captionStyle: "bold-pop",
      musicMood: "Hard-hitting drop",
      accents: ["#FF4A2B", "#1F0A06"],
      look: { grade: "teal-ember", letterbox: "1.85", flare: { strength: 0.35, color: "#FFB27A" } },
      pro: true,
    },
    {
      ...base,
      id: "cine-chapters",
      name: "Chapter cards",
      blurb: "Serif chapter titles with dips to black between them.",
      duration: total(chapters),
      slots: chapters,
      texts: [
        { ...serifCard, id: "ch-t1", text: "I. Beginnings", start: 0.4, end: 2.6, y: 0.5, size: 0.06 },
        { ...serifCard, id: "ch-t2", text: "II. The Turn", start: 4.4, end: 6.6, y: 0.5, size: 0.06 },
        { ...serifCard, id: "ch-t3", text: "III. Home", start: 8.4, end: 10.6, y: 0.5, size: 0.06 },
      ],
      captionStyle: "clean",
      musicMood: "Minimal piano",
      accents: ["#E9DCC4", "#15120D"],
      look: { letterbox: "2.39", grade: "faded-film", grain: 0.3, vignette: 0.4, dip: 0.8 },
      pro: true,
    },
    {
      ...base,
      id: "cine-slow-reveal",
      name: "Slow reveal",
      blurb: "From shadow to full view with long push-ins.",
      duration: total(slowReveal),
      slots: slowReveal,
      texts: [
        { ...serifCard, id: "rv-t1", text: "Introducing", start: 6, end: 10, y: 0.8, size: 0.05 },
      ],
      captionStyle: "clean",
      musicMood: "Tension, then release",
      accents: ["#B8B8C8", "#0E0E14"],
      look: { grade: "night-blue", vignette: 0.6, flare: { strength: 0.3, color: "#FFFFFF" }, dip: 1 },
      pro: true,
    },
    {
      ...base,
      id: "cine-forest",
      name: "Deep forest",
      blurb: "Rich greens, fine grain and stillness.",
      duration: total(forest),
      slots: forest,
      texts: [
        { ...serifCard, id: "fo-t1", text: "Into the green", start: 0.8, end: 4, y: 0.5, size: 0.06 },
      ],
      captionStyle: "clean",
      musicMood: "Ambient nature pads",
      accents: ["#6FCF97", "#081A10"],
      look: { grade: "green-forest", grain: 0.25, vignette: 0.45, letterbox: "1.85" },
    },
  ] satisfies Template[],
};
