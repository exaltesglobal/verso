import { useEffect, useState, type MutableRefObject } from "react";
import { ContextMenu } from "../ContextMenu";
import { Timecode, TimecodeField } from "../Timecode";
import { FPS } from "../../lib/timecode";
import { SafeZoneOverlay, SAFE_ZONES_KEY } from "./SafeZoneOverlay";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Icon } from "../Icon";
import { VideoLayer } from "./VideoLayer";
import { BrandLogo, MusicLayer } from "./Overlays";
import { AnimatedText } from "./AnimatedText";
import { LookOverlay } from "./LookOverlay";
import { EnhancedSound } from "../smart/EnhancePanel";
import { colorFilter, colorWashStyle } from "../../lib/color";
import { sourceTimeAt } from "../../lib/speed";
import { cropStyle, panelBoxes, sampleCropPath, sourceTimeFor } from "../../lib/reframe";
import type { CSSProperties } from "react";
import { CaptionText } from "./CaptionStylePreview";
import { captionStyle } from "../../lib/captionStyles";
import { zoomAt } from "../../lib/smart";
import { Button, IconButton, Segmented } from "../ui";
import { frameAt, useFilmstrip } from "../../lib/filmstrip";
import { videoClipAt, type AspectRatio, type Project } from "../../lib/project";

interface PreviewProps {
  project: Project;
  duration: number;
  aspect: AspectRatio;
  time: number;
  playing: boolean;
  onTogglePlay: () => void;
  mediaClockRef: MutableRefObject<number | null>;
  onSeek: (t: number) => void;
  onAspect: (a: AspectRatio) => void;
  onImport: () => void;
  importing: boolean;
}

const RATIOS = ["9:16", "1:1", "16:9"] as const;

const RATIO_CLASS: Record<AspectRatio, string> = {
  "9:16": "is-vertical",
  "1:1": "is-square",
  "16:9": "is-wide",
};

export function Preview({
  project,
  duration,
  aspect,
  time,
  playing,
  onTogglePlay,
  mediaClockRef,
  onSeek,
  onAspect,
  onImport,
  importing,
}: PreviewProps) {
  const captions = project.tracks.find((t) => t.kind === "captions")?.clips ?? [];
  const caption = captions.find((c) => time >= c.start && time < c.end);
  // Real word timings when the captions engine wrote them; otherwise spread evenly.
  const timed = caption?.words?.length ? caption.words : null;
  const words = timed ? timed.map((w) => w.text) : ((caption?.text ?? caption?.label)?.split(" ") ?? []);
  const active = !caption
    ? -1
    : timed
      ? timed.findIndex((w) => time >= w.start && time < w.end)
      : Math.min(
          words.length - 1,
          Math.floor(((time - caption.start) / (caption.end - caption.start)) * words.length),
        );
  const speaker = caption?.label.includes(": ") ? caption.label.split(": ")[0] : undefined;

  const clip = videoClipAt(project, time);
  const frames = useFilmstrip(clip?.source);
  const frame = clip?.source && frameAt(frames, clip.source.durationSec, sourceTimeAt(clip, time));
  const still = clip?.still ? convertFileSrc(clip.still.path) : undefined;
  // The <video> must not wait for the filmstrip (slow, or missing without FFmpeg).
  const picture = !!frame || !!clip?.source?.hasVideo || !!still;
  const filter = colorFilter(clip?.color);
  const wash = colorWashStyle(clip?.color);
  const empty = duration === 0;

  // Reframe: one crop rect per panel (two when showing both speakers).
  const rects = clip?.cropPath ? sampleCropPath(clip.cropPath, sourceTimeFor(clip, time)) : [];
  const boxes = clip?.cropPath && rects.length ? panelBoxes(clip.cropPath) : [];
  // zoomAt already includes the clip's own zoom.
  const scale = clip ? zoomAt(clip, time - clip.start) : 1;
  // Scaling around an origin at fraction f shows the same window as export's crop at x = (w - w/z) * f.
  const pos = clip?.pos ?? { x: 0, y: 0 };
  const zoomStyle: CSSProperties | undefined =
    scale > 1.001
      ? { transform: `scale(${scale})`, transformOrigin: `${50 + pos.x * 50}% ${50 + pos.y * 50}%` }
      : undefined;
  const panels = boxes.length
    ? boxes.map((b, i) => ({ box: b, style: rects[i] ? cropStyle(rects[i]) : undefined }))
    : [{ box: { x: 0, y: 0, w: 1, h: 1 }, style: zoomStyle }];

  const [safe, setSafe] = useState(() => localStorage.getItem(SAFE_ZONES_KEY) === "1");
  const toggleSafe = () => {
    localStorage.setItem(SAFE_ZONES_KEY, safe ? "0" : "1");
    setSafe(!safe);
  };
  const [full, setFull] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  // F toggles full screen, Esc leaves it. Text fields and dialogs keep their keys.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target;
      if (
        el instanceof Element &&
        el.closest("input, textarea, [contenteditable='true'], [role='menu'], [role='listbox']")
      )
        return;
      if (document.querySelector("[aria-modal='true']") || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.toLowerCase() === "f" && !empty) setFull((f) => !f);
      else if (e.key === "Escape") setFull(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [empty]);

  return (
    <section className={full ? "preview is-full" : "preview"} aria-label="Preview">
      <div
        className="preview__stage"
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        <div className={`frame ${RATIO_CLASS[aspect]}`}>
          {!picture && (
            <div className="frame__scene">
              <div className="frame__light" />
              {!empty && <div className="frame__subject" />}
            </div>
          )}
          {picture &&
            panels.map((p, i) => (
              <div
                key={i}
                className="frame__panel"
                style={{
                  left: `${p.box.x * 100}%`,
                  top: `${p.box.y * 100}%`,
                  width: `${p.box.w * 100}%`,
                  height: `${p.box.h * 100}%`,
                  filter,
                  opacity: clip?.opacity ?? 1,
                }}
              >
                {/* Real frame under the video: shows instantly while scrubbing. Centre crop = vertical cutout. */}
                {still ? (
                  <img className="frame__image" src={still} alt="" draggable={false} style={p.style} />
                ) : (
                  <>
                    {frame && (
                      <img className="frame__image" src={frame} alt="" draggable={false} style={p.style} />
                    )}
                    <VideoLayer
                      project={project}
                      clip={clip}
                      time={time}
                      playing={playing}
                      mediaClockRef={mediaClockRef}
                      mediaStyle={p.style}
                      secondary={i > 0}
                    />
                  </>
                )}
                {wash && <div style={wash} />}
              </div>
            ))}
          <LookOverlay look={project.look} aspect={aspect} time={time} duration={duration} />
          <AnimatedText project={project} time={time} />
          <BrandLogo project={project} />
          <MusicLayer project={project} time={time} playing={playing} />
          <EnhancedSound project={project} time={time} playing={playing} />
          {safe && <SafeZoneOverlay />}
          {empty && (
            <div className="frame__empty">
              <Icon name="import" size={32} />
              <p className="empty__title">Add a video to start your reel</p>
              <Button icon="import" onClick={onImport} disabled={importing}>
                {importing ? "Reading your file…" : "Import video"}
              </Button>
            </div>
          )}
          {caption && (
            <div className="frame__caption-wrap" key={caption.id}>
              {speaker && <span className="frame__speaker">{speaker}</span>}
              <CaptionText
                style={captionStyle(project.captionStyle)}
                words={words}
                active={active}
                size={22}
              />
            </div>
          )}
        </div>
      </div>

      <div className="transport preview-bar">
        <div className="transport__time">
          <TimecodeField t={time} duration={duration} onSeek={onSeek} />
          <span className="transport__total">
            / <Timecode t={duration} />
          </span>
        </div>
        <div className="transport__buttons">
          <IconButton
            icon="skip-start"
            label="Go to start"
            shortcut="Home"
            disabled={empty}
            onClick={() => onSeek(0)}
          />
          <IconButton
            icon="step-back"
            label="Back 1 frame"
            shortcut="←"
            disabled={empty}
            onClick={() => onSeek(Math.max(0, Math.round((time - 1 / FPS) * FPS) / FPS))}
          />
          <button
            type="button"
            className="play-btn"
            onClick={onTogglePlay}
            disabled={empty}
            aria-label={playing ? "Pause" : "Play"}
            aria-keyshortcuts="Space"
            data-tip={playing ? "Pause" : "Play"}
            data-kbd="Space"
          >
            <Icon name={playing ? "pause" : "play"} size={20} />
          </button>
          <IconButton
            icon="step-forward"
            label="Forward 1 frame"
            shortcut="→"
            disabled={empty}
            onClick={() => onSeek(Math.min(duration, Math.round((time + 1 / FPS) * FPS) / FPS))}
          />
          <IconButton
            icon="skip-end"
            label="Go to end"
            shortcut="End"
            disabled={empty}
            onClick={() => onSeek(duration)}
          />
        </div>
        <div className="transport__view">
          <Segmented label="Reel shape" options={RATIOS} value={aspect} onChange={onAspect} />
          <span className="transport__spec">1080p</span>
          <IconButton
            icon="safe-zone"
            label="Safe zones"
            aria-pressed={safe}
            onClick={toggleSafe}
            data-tip="Show where app buttons and captions cover the reel"
          />
          <IconButton
            icon="fullscreen"
            label={full ? "Exit full screen" : "Full screen"}
            shortcut={full ? "Esc" : "F"}
            aria-pressed={full}
            disabled={empty}
            onClick={() => setFull(!full)}
          />
        </div>
      </div>
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          items={[
            {
              label: playing ? "Pause" : "Play",
              icon: playing ? "pause" : "play",
              shortcut: "Space",
              disabled: empty,
              onSelect: onTogglePlay,
            },
            { label: safe ? "Hide safe zones" : "Show safe zones", icon: "safe-zone", onSelect: toggleSafe },
            {
              label: full ? "Exit full screen" : "Full screen",
              icon: "fullscreen",
              shortcut: full ? "Esc" : "F",
              disabled: empty,
              onSelect: () => setFull(!full),
            },
            { separator: true },
            ...RATIOS.map((r) => ({
              label: `${r} ${r === "9:16" ? "reel" : r === "1:1" ? "square" : "wide"}`,
              icon: r === aspect ? ("check" as const) : undefined,
              onSelect: () => onAspect(r),
            })),
          ]}
        />
      )}
    </section>
  );
}
