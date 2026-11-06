import type { Template, TemplatePack } from "../types";
import { seq, total } from "./build";

const soft = { kind: "dissolve", duration: 0.4 } as const;

const diwali = seq("dw", [
  [3, "Diyas or lights glowing", { kind: "photo", crop: { x: 0.5, y: 0.5, zoom: 1.15 } }],
  [3, "Family or friends together", { transition: soft }],
  [3, "Rangoli, sweets or decor", { transition: soft }],
  [3, "Your wishes to camera", { crop: { x: 0.5, y: 0.4 }, transition: soft }],
]);

const shopOpening = seq("so", [
  [2.5, "Shop front", { crop: { x: 0.5, y: 0.5 } }],
  [3, "Inside the shop", { transition: { kind: "slide", duration: 0.25 } }],
  [3, "Your best products", { transition: { kind: "slide", duration: 0.25 } }],
  [3.5, "Offer and address", { kind: "photo", transition: { kind: "zoom", duration: 0.25 } }],
]);

const weddingTeaser = seq("wt", [
  [3, "Venue or decor", { kind: "photo", crop: { x: 0.5, y: 0.5, zoom: 1.1 } }],
  [3, "The couple", { crop: { x: 0.5, y: 0.4 }, transition: soft }],
  [3, "Haldi or mehendi", { transition: soft }],
  [3, "Dance or baraat", { transition: soft }],
  [3, "Save the date", { kind: "photo", transition: { kind: "fade", duration: 0.5 } }],
]);

const fitness = seq("fc", [
  [2.5, "Day 1: the start", { crop: { x: 0.5, y: 0.45 } }],
  [3, "Workout move one", { transition: { kind: "zoom", duration: 0.2 } }],
  [3, "Workout move two", { transition: { kind: "zoom", duration: 0.2 } }],
  [3, "Workout move three", { transition: { kind: "zoom", duration: 0.2 } }],
  [2.5, "Challenge your friends", { crop: { x: 0.5, y: 0.4, zoom: 1.1 } }],
]);

const recipe = seq("fr", [
  [2.5, "The finished dish", { kind: "photo", crop: { x: 0.5, y: 0.5, zoom: 1.2 } }],
  [3, "Ingredients laid out", { kind: "photo" }],
  [3, "Step one", { transition: { kind: "slide", duration: 0.2 } }],
  [3, "Step two", { transition: { kind: "slide", duration: 0.2 } }],
  [3, "Step three", { transition: { kind: "slide", duration: 0.2 } }],
  [2.5, "First bite", { crop: { x: 0.5, y: 0.45, zoom: 1.1 }, transition: { kind: "fade", duration: 0.3 } }],
]);

export const festivePack: TemplatePack = {
  id: "festive",
  name: "Festive India",
  templates: [
    {
      id: "festive-diwali",
      name: "Diwali greeting",
      pack: "festive",
      blurb: "Warm lights, family moments and your wishes.",
      aspect: "9:16",
      duration: total(diwali),
      slots: diwali,
      texts: [
        { id: "dw-t1", text: "Happy Diwali", start: 0, end: 3, preset: "neon", y: 0.3, size: 0.08 },
        { id: "dw-t2", text: "शुभ दीपावली", start: 9, end: 12, preset: "title", y: 0.22 },
        { id: "dw-t3", text: "From our family to yours", start: 9, end: 12, preset: "subtitle", y: 0.8 },
      ],
      captionStyle: "pop",
      musicMood: "Festive shehnai",
      accents: ["#FFB547", "#3A1A05"],
    },
    {
      id: "festive-shop-opening",
      name: "Shop opening offer",
      pack: "festive",
      blurb: "Grand opening with your offer up front.",
      aspect: "9:16",
      duration: total(shopOpening),
      slots: shopOpening,
      texts: [
        { id: "so-t1", text: "Grand opening", start: 0, end: 2.5, preset: "title", y: 0.2 },
        {
          id: "so-t2",
          text: "Flat 20% off this week",
          start: 8.5,
          end: 12,
          preset: "boxed",
          y: 0.45,
          size: 0.05,
        },
        { id: "so-t3", text: "Shop name · Area, City", start: 8.5, end: 12, preset: "body", y: 0.8 },
      ],
      captionStyle: "bold-pop",
      musicMood: "Dhol, high energy",
      accents: ["#FF4A2B", "#331006"],
    },
    {
      id: "festive-wedding-teaser",
      name: "Wedding teaser",
      pack: "festive",
      blurb: "Soft dissolves from decor to dance, ending on the date.",
      aspect: "9:16",
      duration: total(weddingTeaser),
      slots: weddingTeaser,
      texts: [
        { id: "wt-t1", text: "Aanya weds Rohan", start: 3, end: 6, preset: "title", y: 0.75 },
        { id: "wt-t2", text: "12 · 12 · 2026", start: 12, end: 15, preset: "outline", y: 0.45, size: 0.07 },
      ],
      captionStyle: "clean",
      musicMood: "Romantic strings",
      accents: ["#F472B6", "#2E0F1E"],
      pro: true,
    },
    {
      id: "festive-fitness-challenge",
      name: "Fitness challenge",
      pack: "festive",
      blurb: "Three moves, a counter on screen and a call to join in.",
      aspect: "9:16",
      duration: total(fitness),
      slots: fitness,
      texts: [
        { id: "fc-t1", text: "30-day challenge", start: 0, end: 2.5, preset: "title", y: 0.2 },
        { id: "fc-t2", text: "x15", start: 2.5, end: 5.5, preset: "outline", y: 0.18, size: 0.09 },
        { id: "fc-t3", text: "x20", start: 5.5, end: 8.5, preset: "outline", y: 0.18, size: 0.09 },
        { id: "fc-t4", text: "x10", start: 8.5, end: 11.5, preset: "outline", y: 0.18, size: 0.09 },
        { id: "fc-t5", text: "Tag a friend who's in", start: 11.5, end: 14, preset: "boxed", y: 0.75 },
      ],
      captionStyle: "bold-pop",
      musicMood: "Bhangra workout",
      accents: ["#2FD4A3", "#0B261E"],
    },
    {
      id: "festive-food-recipe",
      name: "Food recipe",
      pack: "festive",
      blurb: "Dish first, then the steps, then the first bite.",
      aspect: "9:16",
      duration: total(recipe),
      slots: recipe,
      texts: [
        { id: "fr-t1", text: "Masala chai in 5 minutes", start: 0, end: 2.5, preset: "title", y: 0.2 },
        { id: "fr-t2", text: "You need", start: 2.5, end: 5.5, preset: "boxed", y: 0.15, size: 0.035 },
        { id: "fr-t3", text: "Step 1", start: 5.5, end: 8.5, preset: "body", y: 0.85 },
        { id: "fr-t4", text: "Step 2", start: 8.5, end: 11.5, preset: "body", y: 0.85 },
        { id: "fr-t5", text: "Step 3", start: 11.5, end: 14.5, preset: "body", y: 0.85 },
      ],
      captionStyle: "clean",
      musicMood: "Cosy tabla groove",
      accents: ["#FBBF24", "#2E2205"],
      pro: true,
    },
  ] satisfies Template[],
};
