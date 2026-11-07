import { useSyncExternalStore } from "react";
import type { ExportQuality } from "./export";
import type { Mode } from "./modes";

/** App preferences, kept in localStorage. */
export interface Settings {
  exportQuality: ExportQuality;
  /** Empty means "ask every time". */
  exportFolder: string;
  captionLanguage: string;
  gpu: boolean;
  autoUpdate: boolean;
  /** How the transport, ruler and inspector show time. */
  timeFormat: "timecode" | "seconds";
  /** Workspace: Quick, Craft or Studio. Only the layout changes; the project stays the same. */
  mode: Mode;
  /** Modes the user has already seen the one-line "shows more controls" hint for. */
  modeHintsSeen: Mode[];
  /** Minutes saved by one-tap edits: all time, and for one local day. */
  timeSaved: { lifetime: number; day: string; today: number };
}

const KEY = "verso.settings";
const DEFAULTS: Settings = {
  exportQuality: "high",
  exportFolder: "",
  captionLanguage: "auto",
  gpu: true,
  autoUpdate: true,
  timeFormat: "timecode",
  mode: "quick",
  modeHintsSeen: [],
  timeSaved: { lifetime: 0, day: "", today: 0 },
};

const listeners = new Set<() => void>();
let current: Settings = load();

function load(): Settings {
  try {
    const saved = localStorage.getItem(KEY);
    const parsed = JSON.parse(saved ?? "{}");
    // People who used Verso before modes existed keep the editor they know.
    if (saved && !parsed.mode) parsed.mode = "craft";
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

export const getSettings = () => current;

export function updateSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch };
  localStorage.setItem(KEY, JSON.stringify(current));
  listeners.forEach((l) => l());
}

export function useSettings(): Settings {
  return useSyncExternalStore((l) => {
    listeners.add(l);
    return () => listeners.delete(l);
  }, getSettings);
}
