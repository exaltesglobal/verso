import { useEffect, useMemo, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import type { Project } from "../../lib/project";
import {
  ANALYSIS_PROGRESS_EVENT,
  beatMarkers,
  detectBeats,
  type AnalysisProgress,
  type AnalysisTask,
} from "../../lib/smart";

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Live percent from `analysis://progress` for one task. Reset it when a run starts. */
export function useAnalysisProgress(task: AnalysisTask) {
  const [percent, setPercent] = useState(0);
  useEffect(() => {
    let alive = true;
    let stop: (() => void) | undefined;
    void listen<AnalysisProgress>(ANALYSIS_PROGRESS_EVENT, (e) => {
      if (e.payload.task === task) setPercent(e.payload.percent);
    }).then((un) => (alive ? (stop = un) : un()));
    return () => {
      alive = false;
      stop?.();
    };
  }, [task]);
  return [percent, setPercent] as const;
}

/** Timeline beat times of every music clip with "Cut to the beat" on. For BeatMarkers. */
export function useBeatMarkers(project: Project): number[] {
  const clips = useMemo(
    () => (project.tracks.find((t) => t.kind === "music")?.clips ?? []).filter((c) => c.beatSync && c.source),
    [project],
  );
  const [beats, setBeats] = useState<Record<string, number[]>>({});

  useEffect(() => {
    let alive = true;
    for (const c of clips) {
      const src = c.source!;
      detectBeats(src)
        .then((b) => alive && setBeats((prev) => (prev[src.path] ? prev : { ...prev, [src.path]: b.beats })))
        .catch(() => {});
    }
    return () => {
      alive = false;
    };
  }, [clips]);

  return useMemo(() => clips.flatMap((c) => beatMarkers(c, beats[c.source!.path] ?? [])), [clips, beats]);
}
