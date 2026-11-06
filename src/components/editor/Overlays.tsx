import { useEffect, useRef, type CSSProperties } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { clipsAt, type Clip, type Project } from "../../lib/project";

/**
 * Plays the music clip under the playhead in sync with the timeline, with its
 * volume and fades. Video sound comes from the <video> itself.
 */
export function MusicLayer({ project, time, playing }: { project: Project; time: number; playing: boolean }) {
  const clip = clipsAt(project, "music", time).find((c) => c.source);
  return clip ? <AudioClip key={clip.id} clip={clip} time={time} playing={playing} /> : null;
}

function AudioClip({ clip, time, playing }: { clip: Clip; time: number; playing: boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  const src = clip.source ? convertFileSrc(clip.source.path) : undefined;
  const sourceTime = (clip.inPoint ?? 0) + (time - clip.start);

  // Volume envelope: fade in/out at the clip edges.
  const fadeIn = clip.fadeIn ?? 0;
  const fadeOut = clip.fadeOut ?? 0;
  const local = time - clip.start;
  const len = clip.end - clip.start;
  let gain = clip.volume ?? 1;
  if (fadeIn > 0 && local < fadeIn) gain *= local / fadeIn;
  if (fadeOut > 0 && len - local < fadeOut) gain *= Math.max(0, (len - local) / fadeOut);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    a.volume = Math.max(0, Math.min(1, gain));
    if (playing) {
      if (Math.abs(a.currentTime - sourceTime) > 0.3) a.currentTime = sourceTime;
      if (a.paused) void a.play().catch(() => {});
    } else {
      if (!a.paused) a.pause();
      if (Math.abs(a.currentTime - sourceTime) > 0.05) a.currentTime = sourceTime;
    }
  }, [playing, sourceTime, gain]);

  return src ? <audio ref={ref} src={src} preload="auto" /> : null;
}

/** The creator's own logo from their brand kit, in a corner of the frame. */
export function BrandLogo({ project }: { project: Project }) {
  const b = project.brand;
  if (!b?.logo) return null;
  const [v, h] = b.logoCorner.split("-");
  const style: CSSProperties = {
    position: "absolute",
    width: `${b.logoSize * 100}%`,
    opacity: b.logoOpacity,
    [v]: "4%",
    [h]: "5%",
    pointerEvents: "none",
  };
  return <img className="frame__logo" src={convertFileSrc(b.logo.path)} alt="" style={style} />;
}
