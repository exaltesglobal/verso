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

function add(minutes: number) {
  const t = getSettings().timeSaved;
  const day = today();
  const todayMin = t.day === day ? t.today : 0;
  updateSettings({
    timeSaved: { lifetime: Math.max(0, t.lifetime + minutes), day, today: Math.max(0, todayMin + minutes) },
  });
}

/**
 * Minutes saved per undo-history entry (the project state a one-tap edit
 * produced). Undoing that entry takes the minutes back; redoing adds them again.
 */
const ledger = new WeakMap<object, number>();

/** Records `minutes` for the history entry `entry` (the project the edit produced). */
export function recordTimeSaved(entry: object, minutes: number) {
  if (minutes <= 0) return;
  ledger.set(entry, minutes);
  add(minutes);
}

/** Call with the entry being undone. */
export function undoTimeSaved(entry: object) {
  const m = ledger.get(entry);
  if (m) add(-m);
}

/** Call with the entry being redone. */
export function redoTimeSaved(entry: object | undefined) {
  const m = entry && ledger.get(entry);
  if (m) add(m);
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
