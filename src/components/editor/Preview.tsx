import {
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";
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
import {
  cropStyle,
  panelBoxes,
  sampleCropPath,
  sourceTimeFor,
  speakerAt,
  type Rect,
} from "../../lib/reframe";
import type { CSSProperties } from "react";
import { CaptionText } from "./CaptionStylePreview";
import { captionStyle } from "../../lib/captionStyles";
import { zoomAt } from "../../lib/smart";
import { Button, IconButton, Segmented } from "../ui";
import { frameAt, useFilmstrip } from "../../lib/filmstrip";
import {
  ASPECTS,
  ASPECT_NAME,
  ASPECT_SIZE,
  videoClipAt,
  type AspectRatio,
  type Project,
} from "../../lib/project";

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
  /** "ratio": play and reel shape only (Quick). "full": the whole transport. */
  bar?: "ratio" | "full";
}

const RATIO_CLASS: Record<AspectRatio, string> = {
  "9:16": "is-vertical",
  "1:1": "is-square",
  "4:5": "is-portrait",
  "16:9": "is-wide",
};

/** Preview zoom: fit the stage, or a share of the output's real pixels. */
type Zoom = "fit" | 0.5 | 1 | 2;
const ZOOMS: { value: Zoom; label: string }[] = [
  { value: "fit", label: "Fit" },
  { value: 0.5, label: "50%" },
  { value: 1, label: "100%" },
  { value: 2, label: "200%" },
];
const THIRDS_KEY = "verso.thirds";

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
  bar = "full",
}: PreviewProps) {
  const full_ = bar === "full";
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
  const [thirds, setThirds] = useState(() => localStorage.getItem(THIRDS_KEY) === "1");
  const toggleThirds = () => {
    localStorage.setItem(THIRDS_KEY, thirds ? "0" : "1");
    setThirds(!thirds);
  };
  const [full, setFull] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [zoomMenu, setZoomMenu] = useState<{ x: number; y: number } | null>(null);

  // Zoom scales the fitted frame (so captions and overlays scale with it); drag pans.
  const [zoomPick, setZoom] = useState<Zoom>("fit");
  const zoom: Zoom = full_ ? zoomPick : "fit";
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [fitW, setFitW] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFitW(el.offsetWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const k = zoom === "fit" || !fitW ? 1 : (ASPECT_SIZE[aspect][0] * zoom) / fitW;
  const clampPan = (x: number, y: number) => {
    const st = stageRef.current;
    const fr = frameRef.current;
    if (!st || !fr) return { x: 0, y: 0 };
    const mx = Math.max(0, (fr.offsetWidth * k - st.clientWidth) / 2 + 24);
    const my = Math.max(0, (fr.offsetHeight * k - st.clientHeight) / 2 + 24);
    return { x: Math.max(-mx, Math.min(mx, x)), y: Math.max(-my, Math.min(my, y)) };
  };
  const pickZoom = (z: Zoom) => {
    setZoom(z);
    setPan({ x: 0, y: 0 });
  };
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const onStageDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (zoom === "fit" || e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic or already-released pointer: panning still follows moves over the stage.
    }
  };
  const onStageMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d) setPan(clampPan(d.px + e.clientX - d.x, d.py + e.clientY - d.y));
  };
  const onStageUp = () => {
    drag.current = null;
  };

  // Speaker tracking brackets: only while a reframe plan follows someone (spec section 4).
  const tracking = !!clip?.cropPath && clip.cropPath.mode !== "centre" && boxes.length <= 1 && !!rects[0];
  const seen = tracking && clip?.source ? speakerAt(clip.source.path, sourceTimeFor(clip, time)) : null;
  const bracket: { box: Rect; label: string } | null = !tracking
    ? null
    : seen && rects[0]
      ? {
          box: {
            x: (seen.box.x - rects[0].x) / rects[0].w,
            y: (seen.box.y - rects[0].y) / rects[0].h,
            w: seen.box.w / rects[0].w,
            h: seen.box.h / rects[0].h,
          },
          label: seen.label,
        }
      : // The plan keeps the speaker centred; without face boxes from this session, bracket the centre.
        { box: { x: 0.28, y: 0.16, w: 0.44, h: 0.36 }, label: "Speaker 1" };

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
      <div className="ptool">
        <Segmented label="Reel shape" options={ASPECTS} value={aspect} onChange={onAspect} />
        {full_ && (
          <>
            <span className="ptool__spec tc">
              {Math.min(...ASPECT_SIZE[aspect])}p · {project.fps ?? FPS} fps
            </span>
            <span className="ptool__fill" />
            <button
              type="button"
              className="fitbtn"
              aria-haspopup="menu"
              aria-expanded={!!zoomMenu}
              disabled={empty}
              data-tip="Preview zoom"
              onClick={(e) => {
                const b = e.currentTarget.getBoundingClientRect();
                setZoomMenu({ x: b.left, y: b.bottom + 4 });
              }}
            >
              {ZOOMS.find((z) => z.value === zoom)?.label}
              <Icon name="chevron-down" size={16} />
            </button>
            <IconButton
              icon="thirds"
              label="Thirds grid"
              aria-pressed={thirds}
              onClick={toggleThirds}
              data-tip="Show a rule-of-thirds grid"
            />
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
          </>
        )}
      </div>
      <div
        ref={stageRef}
        className={zoom === "fit" ? "preview__stage" : "preview__stage is-zoomed"}
        onPointerDown={onStageDown}
        onPointerMove={onStageMove}
        onPointerUp={onStageUp}
        onPointerCancel={onStageUp}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        <div
          ref={frameRef}
          className={`frame ${RATIO_CLASS[aspect]}`}
          style={{
            background: project.background,
            transform:
              k !== 1 || pan.x || pan.y ? `translate(${pan.x}px, ${pan.y}px) scale(${k})` : undefined,
          }}
        >
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
          {thirds && (
            <span className="frame__thirds" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
          )}
          {bracket && (
            <span
              className="frame__track"
              aria-hidden="true"
              style={{
                left: `${bracket.box.x * 100}%`,
                top: `${bracket.box.y * 100}%`,
                width: `${bracket.box.w * 100}%`,
                height: `${bracket.box.h * 100}%`,
              }}
            >
              <span className="frame__track-tag">Auto · {bracket.label}</span>
            </span>
          )}
          {safe && <SafeZoneOverlay aspect={aspect} />}
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

      <div className={full_ ? "transport preview-bar" : "transport preview-bar preview-bar--ratio"}>
        {full_ && (
          <div className="transport__time">
            <TimecodeField t={time} duration={duration} onSeek={onSeek} />
            <span className="transport__total">
              / <Timecode t={duration} />
            </span>
          </div>
        )}
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
      </div>
      {zoomMenu && (
        <ContextMenu
          x={zoomMenu.x}
          y={zoomMenu.y}
          onClose={() => setZoomMenu(null)}
          items={ZOOMS.map((z) => ({
            label: z.label,
            icon: z.value === zoom ? ("check" as const) : undefined,
            onSelect: () => pickZoom(z.value),
          }))}
        />
      )}
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
            ...ASPECTS.map((r) => ({
              label: `${r} ${ASPECT_NAME[r]}`,
              icon: r === aspect ? ("check" as const) : undefined,
              onSelect: () => onAspect(r),
            })),
          ]}
        />
      )}
    </section>
  );
}
