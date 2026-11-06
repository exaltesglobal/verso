import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { MediaInfo } from "./media";

interface WaveformData {
  peaksPerSec: number;
  peaks: number[];
}

const cache = new Map<string, Promise<number[]>>();

/** Peaks 0..1 across the whole file, evenly spaced over its duration. */
export function loadWaveform(media: MediaInfo): Promise<number[]> {
  let pending = cache.get(media.path);
  if (!pending) {
    pending = invoke<WaveformData>("media_waveform", {
      path: media.path,
      durationSec: media.durationSec,
    }).then((w) => w.peaks.map((p) => p / 255));
    pending.catch(() => cache.delete(media.path));
    cache.set(media.path, pending);
  }
  return pending;
}

export function useWaveform(media: MediaInfo | undefined): number[] {
  const [state, setState] = useState<{ path: string; peaks: number[] } | null>(null);
  const path = media?.hasAudio ? media.path : undefined;
  useEffect(() => {
    if (!media || !path) return;
    let alive = true;
    loadWaveform(media)
      .then((peaks) => alive && setState({ path, peaks }))
      .catch(() => alive && setState({ path, peaks: [] }));
    return () => {
      alive = false;
    };
  }, [media, path]);
  return state && state.path === path ? state.peaks : [];
}
