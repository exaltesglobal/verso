import { useSettings, updateSettings, getSettings } from "./settings";
import type { TrackKind } from "./project";
import type { PanelTab } from "../screens/Editor";

/**
 * Three workspaces over one project. The mode only changes what is on screen:
 * project, history and selection live in the Editor and survive every switch.
 */
export type Mode = "quick" | "craft" | "studio";

export const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "quick", label: "Quick", hint: "Big choices and one-tap edits" },
  { id: "craft", label: "Craft", hint: "All the tools, with every setting showing" },
  { id: "studio", label: "Studio", hint: "Full pro layout: resizable panels, track headers, every shortcut" },
];

const RANK: Record<Mode, number> = { quick: 0, craft: 1, studio: 2 };

/** What each workspace shows. Every component reads this map, so the three modes stay consistent. */
export interface Visibility {
  /** Left side: the icon rail plus a panel, or a big list of steps (Quick). */
  left: "rail" | "steps";
  /** Panels listed in the rail or the steps list. */
  tabs: PanelTab[];
  /** Right side: the full Effect Controls inspector, or one-tap options for the selected clip. */
  right: "inspector" | "oneTap";
  /** "Make it better" row of one-tap edits above the preview. */
  makeItBetter: boolean;
  /** Drag handles between panels. */
  resizable: boolean;
  /** Lanes the timeline shows; null means all of them. */
  tracks: TrackKind[] | null;
  /** Names on the left of each lane. */
  trackHeaders: boolean;
  /** Snapping, zoom and the ruler. Quick gets a plain clip strip with split, delete and mute. */
  timelineTools: "strip" | "full";
  /** Preview toolbar: only the reel shape, or the whole transport. */
  previewBar: "ratio" | "full";
  /** Panels open their "More settings" row by default. */
  moreSettingsOpen: boolean;
  /** Drag-to-change number fields in the inspector. */
  scrubFields: boolean;
  /** Pro terms and controls such as keyframes and speed ramps. */
  keyframes: boolean;
  /** J/K/L, frame stepping, zoom keys and ripple delete. Space, undo, save, split and export work everywhere. */
  proShortcuts: boolean;
}

const ALL_TABS: PanelTab[] = [
  "media",
  "templates",
  "text",
  "captions",
  "audio",
  "voice",
  "autocut",
  "magic",
  "boost",
];

export const VISIBILITY: Record<Mode, Visibility> = {
  quick: {
    left: "steps",
    tabs: ["media", "autocut", "captions", "templates", "text", "audio"],
    right: "oneTap",
    makeItBetter: true,
    resizable: false,
    tracks: ["video", "audio", "captions"],
    trackHeaders: false,
    timelineTools: "strip",
    previewBar: "ratio",
    moreSettingsOpen: false,
    scrubFields: false,
    keyframes: false,
    proShortcuts: false,
  },
  craft: {
    left: "rail",
    tabs: ALL_TABS,
    right: "inspector",
    makeItBetter: false,
    resizable: false,
    tracks: null,
    trackHeaders: true,
    timelineTools: "full",
    previewBar: "full",
    moreSettingsOpen: true,
    scrubFields: false,
    keyframes: false,
    proShortcuts: true,
  },
  studio: {
    left: "rail",
    tabs: ALL_TABS,
    right: "inspector",
    makeItBetter: false,
    resizable: true,
    tracks: null,
    trackHeaders: true,
    timelineTools: "full",
    previewBar: "full",
    moreSettingsOpen: true,
    scrubFields: true,
    keyframes: true,
    proShortcuts: true,
  },
};

export const useMode = (): Mode => useSettings().mode;
export const useVisibility = (): Visibility => VISIBILITY[useSettings().mode];

/**
 * Switches workspace. Returns the one-line hint to show the first time someone
 * moves up to a busier mode, or null.
 */
export function setMode(next: Mode): string | null {
  const { mode, modeHintsSeen } = getSettings();
  if (next === mode) return null;
  const firstUp = RANK[next] > RANK[mode] && !modeHintsSeen.includes(next);
  updateSettings({ mode: next, modeHintsSeen: firstUp ? [...modeHintsSeen, next] : modeHintsSeen });
  if (!firstUp) return null;
  return next === "craft"
    ? "Craft shows more controls. Switch back any time."
    : "Studio shows every pro control. Switch back any time.";
}
