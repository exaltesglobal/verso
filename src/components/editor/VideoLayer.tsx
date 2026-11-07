import { useEffect, useRef, useState, type CSSProperties, type MutableRefObject } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import type { Clip, Project } from "../../lib/project";
import { playbackRateAt, sourceTimeAt, timelineTimeAt } from "../../lib/speed";
import { videoSourceAt } from "../../lib/background";
import { hasEnhancedSound } from "../../lib/enhance";
import { setElementGain } from "../../lib/audioBoost";

interface VideoLayerProps {
  project: Project;
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
export function VideoLayer({
  project,
  clip,
  time,
  playing,
  mediaClockRef,
  mediaStyle,
  secondary,
}: VideoLayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  // Speed (constant or ramped) maps timeline time to source time; a background copy may stand in for the file.
  const srcTime = clip ? sourceTimeAt(clip, time) : 0;
  const rate = clip ? playbackRateAt(clip, time) : 1;
  const media = clip?.source?.hasVideo ? videoSourceAt(clip, srcTime) : undefined;
  const src = media ? convertFileSrc(media.path) : undefined;
  const [readySrc, setReadySrc] = useState<string | undefined>();
  /** Position in the playing file (the copy starts at the override's start). */
  const sourceTime = media?.time ?? 0;
  const offset = srcTime - sourceTime;
  // Cleaned sound plays from its own <audio> (EnhancedSound), so the picture goes quiet.
  const enhanced = hasEnhancedSound(project, time);

  // Keep the latest values for the animation loop without restarting it.
  const live = useRef({ clip, offset });
  useEffect(() => {
    live.current = { clip, offset };
  }, [clip, offset]);

  // Play / pause, and keep the picture on the playhead while paused.
  const lastClipId = useRef<string | undefined>(undefined);
  useEffect(() => {
    const v = ref.current;
    if (!v || !src) return;
    setElementGain(v, clip?.volume ?? 1, playing);
    if (Math.abs(v.playbackRate - rate) > 0.01) v.playbackRate = rate;
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
  }, [src, playing, sourceTime, rate, clip?.volume, clip?.id]);

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
      const { clip: c, offset: off } = live.current;
      if (v && c && !v.paused && v.readyState >= 2) {
        const t = timelineTimeAt(c, v.currentTime + off);
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
      muted={secondary || enhanced || (clip?.volume ?? 1) === 0}
      preload="auto"
      crossOrigin="anonymous"
      playsInline
      disablePictureInPicture
      onLoadedData={(e) => {
        e.currentTarget.currentTime = sourceTime;
        e.currentTarget.playbackRate = rate;
        setReadySrc(src);
        if (playing) void e.currentTarget.play().catch(() => {});
      }}
    />
  );
}
