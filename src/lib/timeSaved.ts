import { getSettings, updateSettings, useSettings } from "./settings";
import { projectDuration, type Project } from "./project";

/**
 * Conservative estimates of the hand-editing time (in a pro editor) each
 * one-tap edit replaces. `perRun` is fixed minutes; `perMinute` scales with
 * the length of the media in minutes. Shaped so a server config can replace
 * it later via `setTimeSavedTable`.
 */
export interface TimeSavedRule {
  perRun?: number;
  perMinute?: number;
}

export type TimeSavedTable = Record<string, TimeSavedRule>;

let table: TimeSavedTable = {
  // 25 min per 10 min of speech, at least 5.
  captions: { perRun: 2.5, perMinute: 2.5 },
  "remove-pauses": { perRun: 12 },
  "cut-to-beat": { perRun: 10 },
  "fit-9-16": { perRun: 20 },
  "clean-voice": { perRun: 8 },
  "hook-title": { perRun: 5 },
  "end-card": { perRun: 5 },
  "punch-ins": { perRun: 15 },
  "warm-look": { perRun: 5 },
  loudness: { perRun: 5 },
  mute: { perRun: 0.5 },
  "auto-cut": { perRun: 45 },
};

export function setTimeSavedTable(next: TimeSavedTable) {
  table = { ...table, ...next };
}

/** Minutes saved by running `actionId` on `project`. */
export function estimateMinutes(actionId: string, project: Project): number {
  const r = table[actionId];
  if (!r) return 0;
  return (r.perRun ?? 0) + (r.perMinute ?? 0) * (projectDuration(project) / 60);
}

const today = () => new Date().toLocaleDateString("en-CA");

/** Adds minutes to today's and the lifetime total. Returns a function that takes them back (for Undo). */
export function recordTimeSaved(minutes: number): () => void {
  if (minutes <= 0) return () => undefined;
  const add = (m: number) => {
    const t = getSettings().timeSaved;
    const day = today();
    const todayMin = t.day === day ? t.today : 0;
    updateSettings({
      timeSaved: { lifetime: Math.max(0, t.lifetime + m), day, today: Math.max(0, todayMin + m) },
    });
  };
  add(minutes);
  let undone = false;
  return () => {
    if (undone) return;
    undone = true;
    add(-minutes);
  };
}

/** "1 h 20 min", "45 min". */
export function formatMinutes(min: number): string {
  const m = Math.round(min);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 ? `${h} h ${m % 60} min` : `${h} h`;
}

export function useTimeSaved(): { today: number; lifetime: number } {
  const t = useSettings().timeSaved;
  return { today: t.day === today() ? t.today : 0, lifetime: t.lifetime };
}
