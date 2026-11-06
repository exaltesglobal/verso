import type { Template, TemplatePack } from "../types";
import { seq, total } from "./build";

const slide = { kind: "slide", duration: 0.25 } as const;
const soft = { kind: "dissolve", duration: 0.35 } as const;

const showcase = seq("ps", [
  [2, "Product hero shot", { kind: "photo", push: 0.08 }],
  [2.5, "Detail one", { transition: slide }],
  [2.5, "Detail two", { transition: slide }],
  [3, "In someone's hands", { transition: soft }],
  [3, "Logo or packshot", { kind: "photo", push: 0.05, transition: soft }],
]);

const offer = seq("of", [
  [3, "Your best seller", { kind: "photo", push: 0.06 }],
  [4, "Shop or product shot", { transition: { kind: "zoom", duration: 0.2 } }],
  [3, "Where to find you", { kind: "photo", transition: soft }],
]);

const testimonial = seq("te", [
  [3, "Happy customer, smiling", { crop: { x: 0.5, y: 0.4 } }],
  [6, "Customer talking to camera", { crop: { x: 0.5, y: 0.42 }, transition: soft }],
  [3, "Your product or service", { push: 0.05, transition: soft }],
]);

const hours = seq("oh", [
  [3, "Your shop front", { push: 0.05 }],
  [4, "Inside, ready for customers", { transition: soft }],
  [3, "Friendly face at the counter", { transition: soft }],
]);

const arrival = seq("na", [
  [1.5, "Box or bag, closed", { kind: "photo", crop: { x: 0.5, y: 0.5, zoom: 1.2 } }],
  [2, "Unboxing", { transition: { kind: "zoom", duration: 0.2 }, punch: [0.3] }],
  [3, "The new piece, turning", { push: 0.06, transition: slide }],
  [2.5, "Styled or in use", { transition: slide }],
]);

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
      id: "biz-showcase",
      name: "Product showcase",
      blurb: "Hero shot, two details, in use, then your packshot.",
      duration: total(showcase),
      slots: showcase,
      texts: [
        { id: "ps-t1", text: "Meet the new classic", start: 0, end: 2, preset: "title", y: 0.2, animation: "slide-up" },
        { id: "ps-t2", text: "Hand-stitched leather", start: 2, end: 4.5, preset: "boxed", y: 0.82, size: 0.035, animation: "slide-up" },
        { id: "ps-t3", text: "Fits every day", start: 4.5, end: 7, preset: "boxed", y: 0.82, size: 0.035, animation: "slide-up" },
        { id: "ps-t4", text: "yourbrand.in", start: 10, end: 13, preset: "subtitle", y: 0.8, animation: "typewriter" },
      ],
      captionStyle: "clean",
      musicMood: "Sleek electronic",
      accents: ["#E8E3D9", "#1A1814"],
      look: { grade: "clean-bright", vignette: 0.25 },
    },
    {
      ...base,
      id: "biz-offer",
      name: "Offer card",
      blurb: "Big discount up front, the product, then where to buy.",
      duration: total(offer),
      slots: offer,
      texts: [
        { id: "of-t1", text: "FLAT 30% OFF", start: 0, end: 3, preset: "neon", y: 0.4, size: 0.085, animation: "bounce" },
        { id: "of-t2", text: "This weekend only", start: 0.5, end: 3, preset: "subtitle", y: 0.52, animation: "slide-up" },
        { id: "of-t3", text: "Use code VERSO30", start: 3, end: 7, preset: "boxed", y: 0.82, size: 0.04, animation: "pop" },
        { id: "of-t4", text: "Shop name · Area, City", start: 7, end: 10, preset: "body", y: 0.82, animation: "typewriter" },
      ],
      captionStyle: "bold-pop",
      musicMood: "Upbeat pop",
      accents: ["#FF4A2B", "#2B0D08"],
      look: { grade: "punchy-pop" },
    },
    {
      ...base,
      id: "biz-testimonial",
      name: "Customer testimonial",
      blurb: "Let a happy customer say it, with their words on screen.",
      duration: total(testimonial),
      slots: testimonial,
      texts: [
        { id: "te-t1", text: "“Best decision we made this year.”", start: 0, end: 3, preset: "title", y: 0.2, size: 0.05, font: "serif", animation: "word-by-word" },
        { id: "te-t2", text: "Priya, Pune", start: 3, end: 9, preset: "boxed", y: 0.82, size: 0.03, animation: "slide-up" },
        { id: "te-t3", text: "★★★★★", start: 9, end: 12, preset: "subtitle", y: 0.5, animation: "pop" },
      ],
      captionStyle: "clean",
      musicMood: "Warm, hopeful",
      accents: ["#FFD166", "#241C06"],
      look: { grade: "golden-hour", vignette: 0.2 },
      pro: true,
    },
    {
      ...base,
      id: "biz-hours",
      name: "Opening hours",
      blurb: "Your doors, your hours and a friendly welcome.",
      duration: total(hours),
      slots: hours,
      texts: [
        { id: "oh-t1", text: "We're open", start: 0, end: 3, preset: "title", y: 0.2, animation: "bounce" },
        { id: "oh-t2", text: "Mon–Sat · 10 am – 9 pm", start: 3, end: 7, preset: "boxed", y: 0.5, size: 0.04, animation: "slide-up" },
        { id: "oh-t3", text: "Sunday · 11 am – 6 pm", start: 3.4, end: 7, preset: "body", y: 0.58, animation: "slide-up" },
        { id: "oh-t4", text: "See you soon!", start: 7, end: 10, preset: "subtitle", y: 0.8, animation: "pop" },
      ],
      captionStyle: "clean",
      musicMood: "Friendly jazz",
      accents: ["#7BD389", "#0B2010"],
    },
    {
      ...base,
      id: "biz-new-arrival",
      name: "New arrival",
      blurb: "Closed box, the unboxing, then the new piece.",
      duration: total(arrival),
      slots: arrival,
      texts: [
        { id: "na-t1", text: "Just landed", start: 0, end: 1.5, preset: "boxed", y: 0.2, size: 0.045, animation: "pop" },
        { id: "na-t2", text: "New in store", start: 3.5, end: 6.5, preset: "title", y: 0.8, animation: "blur-in" },
        { id: "na-t3", text: "Limited stock", start: 6.5, end: 9, preset: "body", y: 0.85, animation: "typewriter" },
      ],
      captionStyle: "bold-pop",
      musicMood: "Bouncy pop",
      accents: ["#C084FC", "#1D0E2E"],
      look: { grade: "punchy-pop", leak: { style: "cool", strength: 0.2 } },
    },
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
