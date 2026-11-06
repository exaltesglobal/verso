import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { Clip } from "../../lib/project";

interface VideoLayerProps {
  /** The video clip under the playhead, if it has a real file. */
  clip: Clip | undefined;
  time: number;
  playing: boolean;
  /** Written while playing so the editor clock follows the video exactly. */
  mediaClockRef: MutableRefObject<number | null>;
}

/** Seek tolerance while paused (about one frame at 30 fps). */
const SEEK_EPSILON = 0.03;

/**
 * Plays the clip's file in a <video>, centre-cropped by CSS to the frame shape.
 * While playing, the video drives the timeline clock; while paused, the
 * timeline drives the video (scrubbing).
 */
export function VideoLayer({ clip, time, playing, mediaClockRef }: VideoLayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const src = clip?.source?.hasVideo ? convertFileSrc(clip.source.path) : undefined;
  const [readySrc, setReadySrc] = useState<string | undefined>();
  const inPoint = clip?.inPoint ?? 0;
  const sourceTime = clip ? inPoint + (time - clip.start) : 0;

  // Keep the latest values for the animation loop without restarting it.
  const live = useRef({ clip, inPoint });
  useEffect(() => {
    live.current = { clip, inPoint };
  }, [clip, inPoint]);

  // Play / pause, and keep the picture on the playhead while paused.
  useEffect(() => {
    const v = ref.current;
    if (!v || !src) return;
    if (playing) {
      if (Math.abs(v.currentTime - sourceTime) > 0.25) v.currentTime = sourceTime;
      if (v.paused) void v.play().catch(() => {});
    } else {
      if (!v.paused) v.pause();
      if (Math.abs(v.currentTime - sourceTime) > SEEK_EPSILON) v.currentTime = sourceTime;
    }
  }, [src, playing, sourceTime]);

  // While playing, report the video's position as timeline time.
  useEffect(() => {
    if (!playing || !src) {
      mediaClockRef.current = null;
      return;
    }
    let raf = 0;
    const tick = () => {
      const v = ref.current;
      const { clip: c, inPoint: ip } = live.current;
      if (v && c && !v.paused && v.readyState >= 2) {
        const t = c.start + (v.currentTime - ip);
        // Past the clip's out point: hand over to the next clip.
        mediaClockRef.current = t >= c.end ? c.end : t;
      } else {
        mediaClockRef.current = null; // buffering: editor clock carries on
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      mediaClockRef.current = null;
    };
  }, [playing, src, mediaClockRef]);

  if (!src) return null;
  return (
    <video
      ref={ref}
      key={src}
      className={readySrc === src ? "frame__video is-ready" : "frame__video"}
      src={src}
      preload="auto"
      playsInline
      disablePictureInPicture
      onLoadedData={(e) => {
        e.currentTarget.currentTime = sourceTime;
        setReadySrc(src);
        if (playing) void e.currentTarget.play().catch(() => {});
      }}
    />
  );
}
