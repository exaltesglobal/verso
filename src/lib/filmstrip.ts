import { useEffect, useState } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import type { MediaInfo } from "./media";

/** Frames per clip: about one every 3 seconds, between 6 and 24. */
export function frameCountFor(durationSec: number): number {
  return Math.min(24, Math.max(6, Math.round(durationSec / 3)));
}

const FRAME_HEIGHT = 96;
const cache = new Map<string, Promise<string[]>>();

/** Asks Rust for cached frames across the whole file. One request per file. */
export function loadFilmstrip(media: MediaInfo): Promise<string[]> {
  const key = media.path;
  let pending = cache.get(key);
  if (!pending) {
    pending = invoke<string[]>("media_filmstrip", {
      path: media.path,
      durationSec: media.durationSec,
      count: frameCountFor(media.durationSec),
      height: FRAME_HEIGHT,
    }).then((paths) => paths.map((p) => convertFileSrc(p)));
    // Let a failed request be retried later.
    pending.catch(() => cache.delete(key));
    cache.set(key, pending);
  }
  return pending;
}

/** Frame URLs for a file, or [] while loading / for audio-only files. */
export function useFilmstrip(media: MediaInfo | undefined): string[] {
  const [frames, setFrames] = useState<{ path: string; urls: string[] } | null>(null);
  const path = media?.hasVideo ? media.path : undefined;

  useEffect(() => {
    if (!media || !path) return;
    let alive = true;
    loadFilmstrip(media)
      .then((urls) => alive && setFrames({ path, urls }))
      .catch(() => alive && setFrames({ path, urls: [] }));
    return () => {
      alive = false;
    };
  }, [media, path]);

  return frames && frames.path === path ? frames.urls : [];
}

/** The frame closest to `sourceTime` seconds into the file. */
export function frameAt(urls: string[], durationSec: number, sourceTime: number): string | undefined {
  if (!urls.length || durationSec <= 0) return urls[0];
  const i = Math.floor((sourceTime / durationSec) * urls.length);
  return urls[Math.min(urls.length - 1, Math.max(0, i))];
}
