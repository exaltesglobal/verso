// Placeholder project data for the Phase 1 shell. Replaced by the real
// project model and media engine in later phases.

export type TrackKind = "text" | "captions" | "video" | "audio";
export type AspectRatio = "9:16" | "1:1" | "16:9";

export interface Clip {
  id: string;
  label: string;
  start: number; // seconds
  end: number;
  /** Transitions and effects sit on the video track but use the effects colour. */
  variant?: "effect";
}

export interface Track {
  kind: TrackKind;
  label: string;
  clips: Clip[];
}

export const REEL_DURATION = 31;

export const tracks: Track[] = [
  {
    kind: "text",
    label: "Text",
    clips: [{ id: "t1", label: "Hook title", start: 1.2, end: 11 }],
  },
  {
    kind: "captions",
    label: "Captions",
    clips: [
      { id: "c1", label: "The 3am idea", start: 0, end: 5 },
      { id: "c2", label: "that changed", start: 5.2, end: 9.6 },
      { id: "c3", label: "everything for me", start: 9.8, end: 15.4 },
      { id: "c4", label: "and honestly", start: 15.6, end: 20.4 },
      { id: "c5", label: "I almost ignored it", start: 20.6, end: 27.5 },
    ],
  },
  {
    kind: "video",
    label: "Video",
    clips: [
      { id: "v1", label: "Podcast Ep. 42 · Cam A", start: 0, end: 14 },
      { id: "v2", label: "Cam B", start: 14.2, end: 24 },
      { id: "v3", label: "Fade", start: 24.2, end: 25.4, variant: "effect" },
      { id: "v4", label: "Cam A", start: 25.6, end: 31 },
    ],
  },
  {
    kind: "audio",
    label: "Audio",
    clips: [{ id: "a1", label: "Voice · cleaned", start: 0, end: 31 }],
  },
];

export interface Moment {
  id: string;
  title: string;
  hookScore: number;
  duration: string;
  tint: [string, string];
}

export const moments: Moment[] = [
  {
    id: "m1",
    title: "The 3am idea that changed everything",
    hookScore: 94,
    duration: "0:28",
    tint: ["#3B4BDB", "#14142A"],
  },
  { id: "m2", title: "Why I quit my 9 to 5", hookScore: 88, duration: "0:31", tint: ["#14707A", "#0E1A20"] },
  {
    id: "m3",
    title: "Studio tour in 30 seconds",
    hookScore: 81,
    duration: "0:34",
    tint: ["#B9852F", "#2A1A0E"],
  },
  {
    id: "m4",
    title: "My honest morning routine",
    hookScore: 76,
    duration: "0:37",
    tint: ["#7C4DDB", "#1A1230"],
  },
];

export interface Template {
  id: string;
  name: string;
  uses: string;
  tint: [string, string];
}

export const templates: Template[] = [
  { id: "tp1", name: "Bold hook", uses: "Podcasts", tint: ["#5B8CFF", "#151A33"] },
  { id: "tp2", name: "Clean talk", uses: "Talking head", tint: ["#2FD4A3", "#0F2420"] },
  { id: "tp3", name: "Pop quote", uses: "Quotes", tint: ["#F472B6", "#2A1020"] },
  { id: "tp4", name: "Product drop", uses: "Launches", tint: ["#FFB547", "#2A1C0A"] },
  { id: "tp5", name: "Vlog recap", uses: "Travel", tint: ["#C084FC", "#1C1030"] },
  { id: "tp6", name: "Tutorial steps", uses: "How-to", tint: ["#60A5FA", "#0F1A2A"] },
];

export const audioTracks = [
  { id: "au1", name: "Late night drive", mood: "Calm", duration: "2:14" },
  { id: "au2", name: "Morning lift", mood: "Upbeat", duration: "1:48" },
  { id: "au3", name: "Studio pulse", mood: "Energetic", duration: "3:02" },
  { id: "au4", name: "Soft focus", mood: "Warm", duration: "2:36" },
];

export const recentProjects = [
  {
    id: "p1",
    name: "Podcast Ep. 42",
    detail: "4 reels · edited 2 hours ago",
    tint: ["#3B4BDB", "#14142A"] as [string, string],
  },
  {
    id: "p2",
    name: "Cafe opening vlog",
    detail: "2 reels · edited yesterday",
    tint: ["#B9852F", "#2A1A0E"] as [string, string],
  },
  {
    id: "p3",
    name: "Gym form tips",
    detail: "6 reels · edited 3 days ago",
    tint: ["#14707A", "#0E1A20"] as [string, string],
  },
];
