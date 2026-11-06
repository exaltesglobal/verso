import type { Template, TemplatePack } from "../types";
import { seq, total } from "./build";

const slide = { kind: "slide", duration: 0.25 } as const;
const soft = { kind: "dissolve", duration: 0.35 } as const;

const countdown = seq("ec", [
  [2.5, "Venue or stage", { push: 0.05 }],
  [2.5, "Last year's crowd", { transition: slide }],
  [2.5, "Speakers or performers", { transition: slide }],
  [3.5, "Date and how to book", { kind: "photo", transition: soft }],
]);

const serviceBA = seq("sb", [
  [3.5, "Before the service", { crop: { x: 0.5, y: 0.5 } }],
  [3, "Work in progress", { transition: slide }],
  [4, "After: the result", { push: 0.06, transition: { kind: "zoom", duration: 0.25 } }],
  [2.5, "Book now card", { kind: "photo", transition: soft }],
]);

const base = { pack: "business", aspect: "9:16", isNew: true } as const;

export const businessPack: TemplatePack = {
  id: "business",
  name: "Business",
  templates: [
    {
      ...base,
      id: "biz-event-countdown",
      name: "Event countdown",
      blurb: "Build the buzz and land on the date.",
      duration: total(countdown),
      slots: countdown,
      texts: [
        { id: "ec-t1", text: "3 days to go", start: 0, end: 2.5, preset: "outline", y: 0.2, size: 0.08, animation: "pop" },
        { id: "ec-t2", text: "Bigger than last year", start: 2.5, end: 5, preset: "subtitle", y: 0.8, animation: "slide-up" },
        { id: "ec-t3", text: "Live on stage", start: 5, end: 7.5, preset: "subtitle", y: 0.8, animation: "slide-up" },
        { id: "ec-t4", text: "SAT 14 DEC · BOOK NOW", start: 7.5, end: 11, preset: "boxed", y: 0.5, size: 0.04, animation: "bounce" },
      ],
      captionStyle: "bold-pop",
      musicMood: "Stadium build-up",
      accents: ["#FFB547", "#2A1A04"],
      look: { flare: { strength: 0.35, color: "#FFC27A" }, vignette: 0.3 },
      pro: true,
    },
    {
      ...base,
      id: "biz-service-before-after",
      name: "Service before / after",
      blurb: "Show the job: before, the work, the shiny result.",
      duration: total(serviceBA),
      slots: serviceBA,
      texts: [
        { id: "sb-t1", text: "Before", start: 0, end: 3.5, preset: "boxed", y: 0.14, size: 0.04, animation: "pop" },
        { id: "sb-t2", text: "After", start: 6.5, end: 10.5, preset: "boxed", y: 0.14, size: 0.04, animation: "bounce" },
        { id: "sb-t3", text: "Book a visit · 98765 43210", start: 10.5, end: 13, preset: "subtitle", y: 0.6, animation: "slide-up" },
      ],
      captionStyle: "clean",
      musicMood: "Satisfying groove",
      accents: ["#4FD1C5", "#062320"],
      look: { grade: "clean-bright" },
    },
  ] satisfies Template[],
};
