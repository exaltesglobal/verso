import { useSyncExternalStore } from "react";
import type { ExportQuality } from "./export";

/** App preferences, kept in localStorage. */
export interface Settings {
  exportQuality: ExportQuality;
  /** Empty means "ask every time". */
  exportFolder: string;
  captionLanguage: string;
  gpu: boolean;
  autoUpdate: boolean;
}

const KEY = "verso.settings";
const DEFAULTS: Settings = {
  exportQuality: "high",
  exportFolder: "",
  captionLanguage: "auto",
  gpu: true,
  autoUpdate: true,
};

const listeners = new Set<() => void>();
let current: Settings = load();

function load(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
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
