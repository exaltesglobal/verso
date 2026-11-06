import { useEffect, useRef, useState, type CSSProperties, type MutableRefObject } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { Clip } from "../../lib/project";

interface VideoLayerProps {
  /** The video clip under the playhead, if it has a real file. */
  clip: Clip | undefined;
  time: number;
  playing: boolean;
  /** Written while playing so the editor clock follows the video exactly. */
  mediaClockRef: MutableRefObject<number | null>;
  /** Positioning for reframe crops or zoom. */
  mediaStyle?: CSSProperties;
  /** A second view of the same clip (split screen): muted, never drives the clock. */
  secondary?: boolean;
}

/** Seek tolerance while paused (about one frame at 30 fps). */
const SEEK_EPSILON = 0.03;

/**
 * Plays the clip's file in a <video>, centre-cropped by CSS to the frame shape.
 * While playing, the video drives the timeline clock; while paused, the
 * timeline drives the video (scrubbing).
 */
export function VideoLayer({ clip, time, playing, mediaClockRef, mediaStyle, secondary }: VideoLayerProps) {
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
  const lastClipId = useRef<string | undefined>(undefined);
  useEffect(() => {
    const v = ref.current;
    if (!v || !src) return;
    v.volume = Math.max(0, Math.min(1, clip?.volume ?? 1));
    // Entering another clip of the same file (after a split or a removed pause) must jump
    // exactly to its in point, or the cut-out part plays and the clock runs backwards.
    const entered = clip?.id !== lastClipId.current;
    lastClipId.current = clip?.id;
    if (playing) {
      if (Math.abs(v.currentTime - sourceTime) > (entered ? SEEK_EPSILON : 0.25)) v.currentTime = sourceTime;
      if (v.paused) void v.play().catch(() => {});
    } else {
      if (!v.paused) v.pause();
      if (Math.abs(v.currentTime - sourceTime) > SEEK_EPSILON) v.currentTime = sourceTime;
    }
  }, [src, playing, sourceTime, clip?.volume, clip?.id]);

  // While playing, report the video's position as timeline time.
  useEffect(() => {
    if (secondary) return;
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
        // Past the clip's out point: hand over to the next clip. Before its start the
        // seek hasn't landed yet: let the editor clock carry on rather than jump back.
        mediaClockRef.current = t >= c.end ? c.end : t < c.start - 0.05 ? null : t;
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
  }, [playing, src, mediaClockRef, secondary]);

  if (!src) return null;
  return (
    <video
      ref={ref}
      key={src}
      className={readySrc === src ? "frame__video is-ready" : "frame__video"}
      src={src}
      style={mediaStyle}
      muted={secondary || (clip?.volume ?? 1) === 0}
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
