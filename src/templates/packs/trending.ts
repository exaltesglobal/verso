import type { Template, TemplatePack } from "../types";
import { seq, total } from "./build";

const snap = { kind: "slide", duration: 0.15 } as const;
const zoomIn = { kind: "zoom", duration: 0.2 } as const;

const hookCard = seq("hc", [
  [2, "Your face, saying the hook", { crop: { x: 0.5, y: 0.4, zoom: 1.15 }, punch: [0.1] }],
  [5, "The payoff", { transition: zoomIn }],
  [4, "Proof or result", { transition: snap }],
]);

const reaction = seq("rx", [
  [2.5, "The clip you're reacting to"],
  [1.5, "Your face: first reaction", { crop: { x: 0.5, y: 0.4, zoom: 1.2 }, punch: [0.2] }],
  [3, "The clip keeps going", { transition: snap }],
  [2, "Your face: the big reaction", { crop: { x: 0.5, y: 0.4, zoom: 1.25 }, punch: [0.1, 1] }],
  [3, "Your take, to camera", { crop: { x: 0.5, y: 0.42 }, transition: snap }],
]);

const onBeat = seq("ob", [
  [1, "Beat 1", { punch: [0] }],
  [1, "Beat 2", { punch: [0] }],
  [1, "Beat 3", { punch: [0] }],
  [1, "Beat 4", { punch: [0] }],
  [1, "Beat 5", { punch: [0] }],
  [1, "Beat 6", { punch: [0] }],
  [1, "Beat 7", { punch: [0] }],
  [2, "Land it", { crop: { x: 0.5, y: 0.45, zoom: 1.1 } }],
]);

const swipe = seq("sw", [
  [2.5, "Card 1: the cover", { kind: "photo", push: 0.05 }],
  [2.5, "Card 2", { kind: "photo", transition: { kind: "slide", duration: 0.3 } }],
  [2.5, "Card 3", { kind: "photo", transition: { kind: "slide", duration: 0.3 } }],
  [2.5, "Card 4", { kind: "photo", transition: { kind: "slide", duration: 0.3 } }],
  [2.5, "Last card: follow for more", { kind: "photo", transition: { kind: "slide", duration: 0.3 } }],
]);

const glowUp = seq("gu", [
  [3, "The before", { crop: { x: 0.5, y: 0.45 } }],
  [0.6, "Hand over the lens", { kind: "photo", transition: { kind: "zoom", duration: 0.15 } }],
  [4.5, "The after", { push: 0.06, transition: { kind: "fade", duration: 0.2 } }],
]);

const pov = seq("pv", [
  [3, "What you see, first person", { push: 0.04 }],
  [3, "What happens next", { transition: snap }],
  [3, "The twist", { transition: zoomIn, punch: [0.3] }],
]);

const countdown = seq("cd", [
  [2, "Promise the list", { crop: { x: 0.5, y: 0.42, zoom: 1.1 } }],
  [2.5, "Number 5", { transition: snap }],
  [2.5, "Number 4", { transition: snap }],
  [2.5, "Number 3", { transition: snap }],
  [2.5, "Number 2", { transition: snap }],
  [3, "Number 1: the best", { transition: zoomIn, punch: [0.1] }],
]);

const quoteCard = seq("qc", [[8, "A calm background shot", { push: 0.08 }]]);

const hourByHour = seq("hh", [
  [1.5, "7 am", { transition: snap }],
  [1.5, "9 am", { transition: snap }],
  [1.5, "12 pm", { transition: snap }],
  [1.5, "3 pm", { transition: snap }],
  [1.5, "6 pm", { transition: snap }],
  [1.5, "9 pm", { transition: snap }],
  [2, "Lights out", { transition: { kind: "fade", duration: 0.4 } }],
]);

const wishIKnew = seq("wk", [
  [2.5, "You, looking back", { crop: { x: 0.5, y: 0.42, zoom: 1.1 } }],
  [3.5, "Lesson one", { transition: { kind: "dissolve", duration: 0.3 } }],
  [3.5, "Lesson two", { transition: { kind: "dissolve", duration: 0.3 } }],
  [3.5, "Lesson three", { transition: { kind: "dissolve", duration: 0.3 } }],
  [2, "Tell them to follow", { crop: { x: 0.5, y: 0.42 } }],
]);

const mythFact = seq("mf", [
  [3, "Say the myth", { crop: { x: 0.5, y: 0.42 } }],
  [4, "Show the fact", { transition: zoomIn, punch: [0.2] }],
  [3, "Second myth", { transition: snap }],
  [4, "Second fact", { transition: zoomIn, punch: [0.2] }],
]);

const tutorial = seq("mt", [
  [2, "The finished result", { kind: "photo", push: 0.06 }],
  [3, "Step 1", { transition: snap }],
  [3, "Step 2", { transition: snap }],
  [3, "Step 3", { transition: snap }],
  [2, "Result again, side by side", { transition: zoomIn }],
]);

const base = { pack: "trending", aspect: "9:16", isNew: true } as const;

export const trendingPack: TemplatePack = {
  id: "trending",
  name: "Trending",
  templates: [
    {
      ...base,
      id: "trend-hook-card",
      name: "Hook card opener",
      blurb: "A bold card on your first two seconds, then the payoff.",
      duration: total(hookCard),
      slots: hookCard,
      texts: [
        { id: "hc-t1", text: "Stop scrolling if you…", start: 0, end: 2, preset: "boxed", y: 0.24, size: 0.05, animation: "bounce" },
        { id: "hc-t2", text: "Here's what happened", start: 2, end: 4.5, preset: "subtitle", y: 0.8, animation: "slide-up" },
      ],
      captionStyle: "bold-pop",
      musicMood: "Punchy trap beat",
      accents: ["#FFE14D", "#2A2405"],
      look: { grade: "punchy-pop" },
    },
    {
      ...base,
      id: "trend-watch-along",
      name: "Watch-along reaction",
      blurb: "Clip, your face, clip again. Fast cuts keep both on screen.",
      duration: total(reaction),
      slots: reaction,
      texts: [
        { id: "rx-t1", text: "Wait for it…", start: 0, end: 2.5, preset: "boxed", y: 0.14, size: 0.04, animation: "pop" },
        { id: "rx-t2", text: "NO WAY", start: 7, end: 9, preset: "outline", y: 0.2, size: 0.1, animation: "bounce" },
        { id: "rx-t3", text: "My honest take", start: 9, end: 12, preset: "subtitle", y: 0.8, animation: "slide-up" },
      ],
      captionStyle: "karaoke",
      musicMood: "Playful suspense",
      accents: ["#5BE3FF", "#06212A"],
    },
    {
      ...base,
      id: "trend-text-on-beat",
      name: "Text on beat",
      blurb: "One word per beat, a punch-in on every cut.",
      duration: total(onBeat),
      slots: onBeat,
      texts: [
        { id: "ob-t1", text: "this", start: 0, end: 1, preset: "title", y: 0.5, size: 0.09, animation: "pop" },
        { id: "ob-t2", text: "is", start: 1, end: 2, preset: "title", y: 0.5, size: 0.09, animation: "pop" },
        { id: "ob-t3", text: "your", start: 2, end: 3, preset: "title", y: 0.5, size: 0.09, animation: "pop" },
        { id: "ob-t4", text: "sign", start: 3, end: 4, preset: "outline", y: 0.5, size: 0.11, animation: "bounce" },
        { id: "ob-t5", text: "to", start: 4, end: 5, preset: "title", y: 0.5, size: 0.09, animation: "pop" },
        { id: "ob-t6", text: "start", start: 5, end: 6, preset: "title", y: 0.5, size: 0.09, animation: "pop" },
        { id: "ob-t7", text: "today", start: 6, end: 9, preset: "neon", y: 0.5, size: 0.1, animation: "bounce" },
      ],
      captionStyle: "bold-pop",
      musicMood: "Four-on-the-floor, 120 bpm",
      accents: ["#FF5CA8", "#2B0A1B"],
    },
    {
      ...base,
      id: "trend-swipe",
      name: "Swipe-through cards",
      blurb: "Photo cards that slide like a carousel, one point each.",
      duration: total(swipe),
      slots: swipe,
      texts: [
        { id: "sw-t1", text: "5 things to try this week", start: 0, end: 2.5, preset: "title", y: 0.2, animation: "slide-up" },
        { id: "sw-t2", text: "1 / Wake up earlier", start: 2.5, end: 5, preset: "boxed", y: 0.82, size: 0.035, animation: "slide-up" },
        { id: "sw-t3", text: "2 / Walk after lunch", start: 5, end: 7.5, preset: "boxed", y: 0.82, size: 0.035, animation: "slide-up" },
        { id: "sw-t4", text: "3 / Read 10 pages", start: 7.5, end: 10, preset: "boxed", y: 0.82, size: 0.035, animation: "slide-up" },
        { id: "sw-t5", text: "Follow for more", start: 10, end: 12.5, preset: "subtitle", y: 0.8, animation: "pop" },
      ],
      captionStyle: "clean",
      musicMood: "Lo-fi bounce",
      accents: ["#9FE870", "#152409"],
      look: { grade: "soft-pastel" },
    },
    {
      ...base,
      id: "trend-glow-up",
      name: "Glow-up reveal",
      blurb: "Cover the lens, swap, and reveal the after on the drop.",
      duration: total(glowUp),
      slots: glowUp,
      texts: [
        { id: "gu-t1", text: "before", start: 0, end: 3, preset: "body", y: 0.12, animation: "typewriter" },
        { id: "gu-t2", text: "after", start: 3.6, end: 8.1, preset: "neon", y: 0.12, size: 0.06, animation: "blur-in" },
      ],
      captionStyle: "clean",
      musicMood: "Build-up, drop on the reveal",
      accents: ["#C9A2FF", "#1C1230"],
      look: { grade: "clean-bright", leak: { style: "rose", strength: 0.25 } },
    },
    {
      ...base,
      id: "trend-pov",
      name: "POV captions",
      blurb: "First-person shots with a POV line that sets the scene.",
      duration: total(pov),
      slots: pov,
      texts: [
        { id: "pv-t1", text: "POV: you finally booked the trip", start: 0, end: 4, preset: "subtitle", y: 0.18, animation: "typewriter" },
        { id: "pv-t2", text: "and then…", start: 6, end: 9, preset: "body", y: 0.82, animation: "blur-in" },
      ],
      captionStyle: "typewriter",
      musicMood: "Dreamy indie",
      accents: ["#FFFFFF", "#1A1A1F"],
      look: { grade: "faded-film", grain: 0.3 },
    },
    {
      ...base,
      id: "trend-countdown",
      name: "Top 5 countdown",
      blurb: "Big numbers from five down to one. Save the best for last.",
      duration: total(countdown),
      slots: countdown,
      texts: [
        { id: "cd-t0", text: "Top 5 you need to see", start: 0, end: 2, preset: "title", y: 0.2, animation: "bounce" },
        { id: "cd-t5", text: "5", start: 2, end: 4.5, preset: "outline", y: 0.16, size: 0.12, animation: "pop" },
        { id: "cd-t4", text: "4", start: 4.5, end: 7, preset: "outline", y: 0.16, size: 0.12, animation: "pop" },
        { id: "cd-t3", text: "3", start: 7, end: 9.5, preset: "outline", y: 0.16, size: 0.12, animation: "pop" },
        { id: "cd-t2", text: "2", start: 9.5, end: 12, preset: "outline", y: 0.16, size: 0.12, animation: "pop" },
        { id: "cd-t1", text: "1", start: 12, end: 15, preset: "neon", y: 0.16, size: 0.14, animation: "bounce" },
      ],
      captionStyle: "bold-pop",
      musicMood: "Rising drums",
      accents: ["#FF8A3D", "#2B1405"],
      pro: true,
    },
    {
      ...base,
      id: "trend-quote-card",
      name: "Quote card",
      blurb: "One line that hits, over a slow, calm shot.",
      duration: total(quoteCard),
      slots: quoteCard,
      texts: [
        { id: "qc-t1", text: "“Small steps, every day.”", start: 0.4, end: 8, preset: "title", y: 0.45, size: 0.06, font: "serif", animation: "word-by-word" },
        { id: "qc-t2", text: "— your name", start: 3, end: 8, preset: "body", y: 0.6, animation: "blur-in" },
      ],
      captionStyle: "clean",
      musicMood: "Soft piano",
      accents: ["#EDE6D6", "#1E1B16"],
      look: { grade: "faded-film", vignette: 0.5, grain: 0.2 },
    },
    {
      ...base,
      id: "trend-hour-by-hour",
      name: "Hour by hour",
      blurb: "Your day in quick clock-stamped cuts.",
      duration: total(hourByHour),
      slots: hourByHour,
      texts: [
        { id: "hh-t1", text: "7:00", start: 0, end: 1.5, preset: "boxed", y: 0.12, size: 0.035, animation: "slide-up" },
        { id: "hh-t2", text: "9:00", start: 1.5, end: 3, preset: "boxed", y: 0.12, size: 0.035, animation: "slide-up" },
        { id: "hh-t3", text: "12:00", start: 3, end: 4.5, preset: "boxed", y: 0.12, size: 0.035, animation: "slide-up" },
        { id: "hh-t4", text: "15:00", start: 4.5, end: 6, preset: "boxed", y: 0.12, size: 0.035, animation: "slide-up" },
        { id: "hh-t5", text: "18:00", start: 6, end: 7.5, preset: "boxed", y: 0.12, size: 0.035, animation: "slide-up" },
        { id: "hh-t6", text: "21:00", start: 7.5, end: 9, preset: "boxed", y: 0.12, size: 0.035, animation: "slide-up" },
        { id: "hh-t7", text: "goodnight", start: 9, end: 11, preset: "subtitle", y: 0.8, animation: "typewriter" },
      ],
      captionStyle: "clean",
      musicMood: "Bright ukulele",
      accents: ["#7CC4FF", "#0C1D2E"],
    },
    {
      ...base,
      id: "trend-wish-i-knew",
      name: "Things I wish I knew",
      blurb: "Three honest lessons, softly dissolved together.",
      duration: total(wishIKnew),
      slots: wishIKnew,
      texts: [
        { id: "wk-t0", text: "Things I wish I knew at 20", start: 0, end: 2.5, preset: "title", y: 0.2, animation: "word-by-word" },
        { id: "wk-t1", text: "Nobody is watching that closely", start: 2.5, end: 6, preset: "subtitle", y: 0.78, animation: "blur-in" },
        { id: "wk-t2", text: "Save before you spend", start: 6, end: 9.5, preset: "subtitle", y: 0.78, animation: "blur-in" },
        { id: "wk-t3", text: "Rest is part of the work", start: 9.5, end: 13, preset: "subtitle", y: 0.78, animation: "blur-in" },
      ],
      captionStyle: "clean",
      musicMood: "Warm acoustic",
      accents: ["#FFC27A", "#2A1A08"],
      look: { grade: "golden-hour", grain: 0.15 },
      pro: true,
    },
    {
      ...base,
      id: "trend-myth-fact",
      name: "Myth vs fact",
      blurb: "Say the myth, then flip it with the fact.",
      duration: total(mythFact),
      slots: mythFact,
      texts: [
        { id: "mf-t1", text: "MYTH", start: 0, end: 3, preset: "boxed", y: 0.14, size: 0.045, color: "#FF5A5A", animation: "pop" },
        { id: "mf-t2", text: "FACT", start: 3, end: 7, preset: "boxed", y: 0.14, size: 0.045, color: "#3DDC97", animation: "bounce" },
        { id: "mf-t3", text: "MYTH", start: 7, end: 10, preset: "boxed", y: 0.14, size: 0.045, color: "#FF5A5A", animation: "pop" },
        { id: "mf-t4", text: "FACT", start: 10, end: 14, preset: "boxed", y: 0.14, size: 0.045, color: "#3DDC97", animation: "bounce" },
      ],
      captionStyle: "boxed",
      musicMood: "Quirky plucks",
      accents: ["#3DDC97", "#082418"],
    },
    {
      ...base,
      id: "trend-mini-tutorial",
      name: "Mini tutorial",
      blurb: "Result first, three quick steps, result again.",
      duration: total(tutorial),
      slots: tutorial,
      texts: [
        { id: "mt-t0", text: "Do this in 30 seconds", start: 0, end: 2, preset: "title", y: 0.2, animation: "pop" },
        { id: "mt-t1", text: "Step 1", start: 2, end: 5, preset: "boxed", y: 0.85, size: 0.035, animation: "slide-up" },
        { id: "mt-t2", text: "Step 2", start: 5, end: 8, preset: "boxed", y: 0.85, size: 0.035, animation: "slide-up" },
        { id: "mt-t3", text: "Step 3", start: 8, end: 11, preset: "boxed", y: 0.85, size: 0.035, animation: "slide-up" },
        { id: "mt-t4", text: "Save it for later", start: 11, end: 13, preset: "subtitle", y: 0.78, animation: "bounce" },
      ],
      captionStyle: "bold-pop",
      musicMood: "Clean house beat",
      accents: ["#5B8CFF", "#0D1630"],
      pro: true,
    },
  ] satisfies Template[],
};
