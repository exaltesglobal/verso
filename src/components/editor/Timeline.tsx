import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Icon, type IconName } from "../Icon";
import { IconButton } from "../ui";
import { Timecode } from "../Timecode";
import { frameAt, useFilmstrip } from "../../lib/filmstrip";
import { useWaveform } from "../../lib/waveform";
import { BeatMarkers } from "../smart/BeatMarkers";
import { useBeatMarkers } from "../smart/hooks";
import { useSettings } from "../../lib/settings";
import { clampZoom, ZOOM_MAX, ZOOM_MIN } from "../../lib/layout";
import { FPS, formatSeconds, formatTimecode, timecodeParts } from "../../lib/timecode";
import {
  linkedIds,
  MIN_TIMELINE_SECONDS,
  snapPoints,
  type Clip,
  type Project,
  type TrackKind,
} from "../../lib/project";

/** Width the timeline aims to fill at zoom 1, so short and long projects both fit. */
const FIT_WIDTH = 1100;
const MAX_PX_PER_SEC = 34;
const GUTTER = 12;
const EDGE_PX = 8;
const SNAP_PX = 8;
const HEAD_W = 148;
const RULER_H = 28;
/** Fixed lane heights per kind; empty lanes shrink so they never waste room. */
const TRACK_H: Record<TrackKind, number> = { video: 56, audio: 40, music: 40, text: 32, captions: 32 };
const EMPTY_H = 28;
const TRACK_ICON: Record<TrackKind, IconName> = {
  text: "text",
  captions: "captions",
  video: "play",
  audio: "volume",
  music: "music",
};
const EMPTY_ACTION: Partial<Record<TrackKind, string>> = {
  text: "Add text",
  captions: "Add captions",
  music: "Add music",
};
/** Ruler steps, from single frames up to an hour. */
const STEPS = [
  1 / FPS,
  2 / FPS,
  5 / FPS,
  10 / FPS,
  15 / FPS,
  1,
  2,
  5,
  10,
  15,
  30,
  60,
  120,
  300,
  600,
  900,
  1800,
  3600,
];

const zoomToSlider = (z: number) => (Math.log(z / ZOOM_MIN) / Math.log(ZOOM_MAX / ZOOM_MIN)) * 1000;
const sliderToZoom = (v: number) => ZOOM_MIN * Math.pow(ZOOM_MAX / ZOOM_MIN, v / 1000);

export type TimelineEdit =
  | { type: "move"; id: string; delta: number }
  | { type: "trim"; id: string; edge: "start" | "end"; time: number }
  | { type: "end" };

interface TimelineProps {
  project: Project;
  duration: number;
  time: number;
  playing: boolean;
  onSeek: (t: number) => void;
  zoom: number;
  onZoom: (z: number) => void;
  /** Bumped by the editor to request zoom-to-fit (the \ key). */
  fitSignal: number;
  selectedClip: string;
  onSelectClip: (id: string) => void;
  onEdit: (e: TimelineEdit) => void;
  onSplit: () => void;
  onDelete: () => void;
  snapping: boolean;
  onToggleSnap: () => void;
  /** Right-click on a clip. */
  onClipMenu?: (id: string, x: number, y: number) => void;
  /** Right-click on a track header. */
  onTrackMenu?: (kind: TrackKind, x: number, y: number) => void;
  /** The one action inside an empty lane ("Add text"). */
  onEmptyTrack?: (kind: TrackKind) => void;
}

export function Timeline(props: TimelineProps) {
  const { project, duration, time, playing, onSeek, zoom, onZoom, selectedClip, onSelectClip, onEdit } =
    props;
  const { timeFormat } = useSettings();
  const scroller = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ left: 0, width: 1200 });
  const [snapAt, setSnapAt] = useState<number | null>(null);
  const [scrub, setScrub] = useState(false);
  /** Time to keep under the cursor after a wheel zoom: [time, x in the scroller]. */
  const anchor = useRef<[number, number] | null>(null);
  const manualScroll = useRef(false);
  /** Set before the timeline scrolls itself, so onScroll doesn't read it as the user scrolling. */
  const selfScroll = useRef(false);

  const viewSeconds = Math.max(MIN_TIMELINE_SECONDS, duration * 1.15 + 4);
  const basePps = Math.min(MAX_PX_PER_SEC, FIT_WIDTH / viewSeconds);
  const pps = basePps * zoom;
  const width = Math.max(viewSeconds * pps + GUTTER * 2, view.width - HEAD_W);
  const x = (t: number) => GUTTER + t * pps;
  const timeAt = (clientX: number, el: Element) =>
    Math.min(duration, Math.max(0, (clientX - el.getBoundingClientRect().left - GUTTER) / pps));

  // Ruler hierarchy: labelled major ticks about 96px apart, mid ticks at halves, minor ticks between.
  const major = STEPS.find((s) => s * pps >= 96) ?? STEPS[STEPS.length - 1];
  const div = [10, 5, 2].find((d) => major / d >= 1 / FPS - 1e-9 && (major / d) * pps >= 7) ?? 1;
  const minor = major / div;
  const showFrames = pps / FPS >= 6;
  const ticks = useMemo(() => {
    const out: { t: number; level: 0 | 1 | 2 }[] = [];
    const t0 = Math.max(0, Math.floor((view.left - HEAD_W) / pps / major) * major - major);
    const t1 = Math.min(viewSeconds, (view.left + view.width) / pps + major);
    for (let i = Math.round(t0 / minor); i * minor <= t1; i++) {
      const t = Math.round(i * minor * FPS) / FPS;
      const level = i % div === 0 ? 0 : div % 2 === 0 && i % (div / 2) === 0 ? 1 : 2;
      out.push({ t, level });
    }
    return out;
  }, [view.left, view.width, pps, major, minor, div, viewSeconds]);
  const label = (t: number) => {
    if (timeFormat === "seconds") return <span className="tc">{formatSeconds(t)}</span>;
    const [dim, main] = timecodeParts(t);
    const body = showFrames ? main : main.slice(0, -3);
    return (
      <span className="tc">
        <span className="tc-dim">{dim}</span>
        {body}
      </span>
    );
  };

  /** Snaps `t` to a nearby clip edge or the playhead (magnet on), otherwise to the nearest frame. */
  const snapper = (exclude: Set<string>) => {
    const pts = snapPoints(project, exclude, time);
    const tol = SNAP_PX / pps;
    return (t: number, bypass: boolean): [number, boolean] => {
      let best = Math.round(t * FPS) / FPS;
      if (!props.snapping || bypass) return [best, false];
      let dist = tol;
      let hit = false;
      for (const p of pts) {
        const d = Math.abs(p - t);
        if (d < dist) {
          dist = d;
          best = p;
          hit = true;
        }
      }
      return [best, hit];
    };
  };

  const fit = () => {
    const el = scroller.current;
    if (!el || duration <= 0) return;
    const avail = el.clientWidth - HEAD_W - GUTTER * 2 - 8;
    onZoom(clampZoom(avail / (duration * basePps)));
    manualScroll.current = false;
    el.scrollLeft = 0;
  };
  const fitRef = useRef(fit);
  useEffect(() => {
    fitRef.current = fit;
  });
  useEffect(() => {
    if (props.fitSignal) fitRef.current();
  }, [props.fitSignal]);

  // Ctrl/Alt + wheel zooms around the time under the cursor; a plain wheel scrolls sideways
  // when the lanes don't need vertical scrolling. Native listener: React's wheel is passive.
  const wheelState = useRef({ zoom, pps, onZoom });
  useEffect(() => {
    wheelState.current = { zoom, pps, onZoom };
  });
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const s = wheelState.current;
      if (e.ctrlKey || e.metaKey || e.altKey) {
        e.preventDefault();
        const px = e.clientX - el.getBoundingClientRect().left;
        const t = (el.scrollLeft + px - HEAD_W - GUTTER) / s.pps;
        const next = clampZoom(s.zoom * Math.pow(1.0015, -(e.deltaY || e.deltaX)));
        if (next === s.zoom) return;
        anchor.current = [t, px];
        s.onZoom(next);
      } else if (
        !e.shiftKey &&
        el.scrollHeight <= el.clientHeight &&
        Math.abs(e.deltaY) > Math.abs(e.deltaX)
      ) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Keep the anchored time under the cursor once the new zoom has laid out.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || !anchor.current) return;
    const [t, px] = anchor.current;
    anchor.current = null;
    el.scrollLeft = Math.max(0, HEAD_W + GUTTER + t * pps - px);
  }, [pps]);

  // Follow the playhead while playing: page-flip at 90% of the view, unless the user scrolled away.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (!playing) {
      manualScroll.current = false;
      return;
    }
    if (manualScroll.current) return;
    const px = HEAD_W + x(time) - el.scrollLeft;
    const lanes = el.clientWidth - HEAD_W;
    if (px > HEAD_W + lanes * 0.9 || px < HEAD_W) {
      selfScroll.current = true;
      el.scrollLeft = Math.max(0, x(time) - lanes * 0.1);
    }
  });

  // Track the visible width (ticks are only drawn for the visible range).
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setView({ left: el.scrollLeft, width: el.clientWidth }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const empty = duration === 0;
  const beats = useBeatMarkers(project);
  const heights = project.tracks.map((t) => (t.clips.length ? TRACK_H[t.kind] : EMPTY_H));
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `${HEAD_W}px ${width}px`,
    gridTemplateRows: `${RULER_H}px ${heights.map((h) => `${h}px`).join(" ")}`,
  };
  const head = Math.round(x(time));

  const scrubFrom = (e: ReactPointerEvent<HTMLElement>, el: Element) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setScrub(true);
    onSeek(timeAt(e.clientX, el));
  };

  return (
    <section className="timeline" aria-label="Timeline">
      <div className="timeline__toolbar">
        <div className="timeline__tools">
          <IconButton
            icon="split"
            label="Split at playhead"
            shortcut="S"
            onClick={props.onSplit}
            disabled={empty}
          />
          <IconButton
            icon="delete"
            label="Delete clip"
            shortcut="Del"
            onClick={props.onDelete}
            disabled={!selectedClip}
          />
          <span className="timeline__sep" />
          <IconButton
            icon="magnet"
            label={props.snapping ? "Snapping on" : "Snapping off"}
            shortcut="N"
            aria-pressed={props.snapping}
            onClick={props.onToggleSnap}
          />
        </div>
        <div className="timeline__zoom">
          <IconButton
            icon="zoom-out"
            label="Zoom out"
            shortcut="-"
            size={16}
            onClick={() => onZoom(clampZoom(zoom / 1.5))}
            disabled={zoom <= ZOOM_MIN}
          />
          <input
            type="range"
            min={0}
            max={1000}
            step={1}
            value={zoomToSlider(zoom)}
            aria-label="Timeline zoom"
            data-tip="Zoom (Ctrl or Alt + scroll)"
            onChange={(e) => onZoom(clampZoom(sliderToZoom(Number(e.target.value))))}
            style={{ "--fill": `${zoomToSlider(zoom) / 10}%` } as CSSProperties}
          />
          <IconButton
            icon="zoom-in"
            label="Zoom in"
            shortcut="="
            size={16}
            onClick={() => onZoom(clampZoom(zoom * 1.5))}
            disabled={zoom >= ZOOM_MAX}
          />
          <IconButton
            icon="zoom-fit"
            label="Zoom to fit"
            shortcut="\"
            size={16}
            onClick={fit}
            disabled={empty}
          />
        </div>
      </div>

      <div
        ref={scroller}
        className="timeline__scroll"
        onScroll={(e) => {
          const el = e.currentTarget;
          if (playing && !selfScroll.current) manualScroll.current = true;
          selfScroll.current = false;
          setView({ left: el.scrollLeft, width: el.clientWidth });
        }}
      >
        <div className="timeline__grid" style={gridStyle}>
          <div className="timeline__corner tc">{formatTimecode(time)}</div>
          <div
            className="ruler"
            onPointerDown={(e) => e.button === 0 && scrubFrom(e, e.currentTarget)}
            onPointerMove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) onSeek(timeAt(e.clientX, e.currentTarget));
            }}
            onPointerUp={() => setScrub(false)}
            onPointerCancel={() => setScrub(false)}
          >
            {ticks.map(({ t, level }) => (
              <span key={t} className={`ruler__tick is-l${level}`} style={{ left: x(t) }}>
                {level === 0 && <span className="ruler__label">{label(t)}</span>}
              </span>
            ))}
            {snapAt !== null && (
              <span className="ruler__flag tc" style={{ left: Math.round(x(snapAt)) }}>
                {formatTimecode(snapAt)}
              </span>
            )}
            {!empty && (
              <span
                className="playhead__head"
                style={{ left: head }}
                role="slider"
                tabIndex={-1}
                aria-label="Playhead"
                aria-valuemin={0}
                aria-valuemax={Math.round(duration * FPS) / FPS}
                aria-valuenow={Math.round(time * FPS) / FPS}
                aria-valuetext={formatTimecode(time)}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (e.button === 0) scrubFrom(e, e.currentTarget.parentElement as Element);
                }}
                onPointerMove={(e) => {
                  if (e.currentTarget.hasPointerCapture(e.pointerId))
                    onSeek(timeAt(e.clientX, e.currentTarget.parentElement as Element));
                }}
                onPointerUp={() => setScrub(false)}
                onPointerCancel={() => setScrub(false)}
              >
                {scrub && (
                  <span className="playhead__flag">
                    <Timecode t={time} />
                  </span>
                )}
              </span>
            )}
          </div>

          {project.tracks.map((t, row) => (
            <TrackRow
              key={t.kind}
              row={row + 2}
              kind={t.kind}
              label={t.label}
              count={t.clips.length}
              onMenu={(cx, cy) => props.onTrackMenu?.(t.kind, cx, cy)}
              onEmpty={
                EMPTY_ACTION[t.kind] && props.onEmptyTrack ? () => props.onEmptyTrack?.(t.kind) : undefined
              }
              onLanePointerDown={() => onSelectClip("")}
            >
              {t.clips.map((c) => (
                <ClipView
                  key={c.id}
                  clip={c}
                  kind={t.kind}
                  pps={pps}
                  left={Math.round(x(c.start))}
                  selected={c.id === selectedClip}
                  onSelect={() => onSelectClip(c.id)}
                  onEdit={onEdit}
                  makeSnapper={() => snapper(linkedIds(project, c.id))}
                  onSnap={setSnapAt}
                  onMenu={(mx, my) => {
                    onSelectClip(c.id);
                    props.onClipMenu?.(c.id, mx, my);
                  }}
                />
              ))}
              {empty && t.kind === "video" && (
                <span className="track__hint">Import a video and it lands here.</span>
              )}
            </TrackRow>
          ))}

          <div
            className="timeline__overlay"
            style={{ gridRow: `2 / span ${project.tracks.length}` }}
            aria-hidden="true"
          >
            <BeatMarkers beats={beats} pps={pps} offset={GUTTER} />
            {snapAt !== null && <span className="snap-line" style={{ left: Math.round(x(snapAt)) }} />}
            {!empty && (
              <>
                <span className="playhead" style={{ left: head }} />
                <span className="timeline__end" style={{ left: Math.round(x(duration)) }} />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrackRow({
  row,
  kind,
  label,
  count,
  onMenu,
  onEmpty,
  onLanePointerDown,
  children,
}: {
  row: number;
  kind: TrackKind;
  label: string;
  count: number;
  onMenu: (x: number, y: number) => void;
  onEmpty?: () => void;
  onLanePointerDown: () => void;
  children: ReactNode;
}) {
  const menu = (e: ReactMouseEvent) => {
    e.preventDefault();
    onMenu(e.clientX, e.clientY);
  };
  return (
    <>
      <div className={`track-head track-head--${kind}`} style={{ gridRow: row }} onContextMenu={menu}>
        <Icon name={TRACK_ICON[kind]} size={16} />
        <span className="track-head__name">{label}</span>
      </div>
      <div
        className={count ? `track track--${kind}` : `track track--${kind} is-empty`}
        style={{ gridRow: row }}
        onContextMenu={(e) => e.target === e.currentTarget && menu(e)}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) onLanePointerDown();
        }}
      >
        {children}
        {!count && onEmpty && (
          <button type="button" className="track__add" onClick={onEmpty}>
            <Icon name="add" size={16} />
            {EMPTY_ACTION[kind]}
          </button>
        )}
      </div>
    </>
  );
}

interface ClipViewProps {
  clip: Clip;
  kind: TrackKind;
  pps: number;
  left: number;
  selected: boolean;
  onSelect: () => void;
  onEdit: (e: TimelineEdit) => void;
  makeSnapper: () => (t: number, bypass: boolean) => [number, boolean];
  onSnap: (t: number | null) => void;
  onMenu: (x: number, y: number) => void;
}

type Drag = {
  mode: "move" | "start" | "end";
  x0: number;
  start0: number;
  end0: number;
  applied: number;
  moved: boolean;
  snap: (t: number, bypass: boolean) => [number, boolean];
};

function ClipView({
  clip: c,
  kind,
  pps,
  left,
  selected,
  onSelect,
  onEdit,
  makeSnapper,
  onSnap,
  onMenu,
}: ClipViewProps) {
  const drag = useRef<Drag | null>(null);
  const widthPx = Math.max(12, Math.round((c.end - c.start) * pps) - 2);
  const colour = c.variant === "effect" ? "effects" : kind;
  const hasFilmstrip = kind === "video" && !!c.source?.hasVideo;
  const hasWave = (kind === "audio" || kind === "music") && !!c.source;
  const name = c.text ?? c.label;

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    onSelect();
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const mode = px < EDGE_PX ? "start" : px > rect.width - EDGE_PX ? "end" : "move";
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      mode,
      x0: e.clientX,
      start0: c.start,
      end0: c.end,
      applied: 0,
      moved: false,
      snap: makeSnapper(),
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x0;
    if (!d.moved && Math.abs(dx) < 3) return;
    d.moved = true;
    const dt = dx / pps;
    // Hold Alt to drag without snapping.
    const bypass = e.altKey;
    if (d.mode === "move") {
      // Snap whichever edge is closer to a snap point.
      let start = d.start0 + dt;
      const len = d.end0 - d.start0;
      const [s1, h1] = d.snap(start, bypass);
      const [e2, h2] = d.snap(start + len, bypass);
      const s2 = e2 - len;
      const useStart = h1 && (!h2 || Math.abs(s1 - start) <= Math.abs(s2 - start));
      start = useStart ? s1 : h2 ? s2 : s1;
      onSnap(useStart ? s1 : h2 ? e2 : null);
      const target = Math.max(0, start) - d.start0;
      onEdit({ type: "move", id: c.id, delta: target - d.applied });
      d.applied = target;
    } else {
      const [edgeTime, hit] = d.snap((d.mode === "start" ? d.start0 : d.end0) + dt, bypass);
      onSnap(hit ? edgeTime : null);
      onEdit({ type: "trim", id: c.id, edge: d.mode, time: edgeTime });
    }
  };

  const onPointerUp = () => {
    if (drag.current?.moved) onEdit({ type: "end" });
    drag.current = null;
    onSnap(null);
  };

  return (
    <button
      type="button"
      className={[
        "clip",
        `clip--${colour}`,
        hasFilmstrip && "has-filmstrip",
        c.transitionIn && "has-transition",
        selected && "is-selected",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ left, width: widthPx }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={(e) => {
        e.preventDefault();
        onMenu(e.clientX, e.clientY);
      }}
      aria-pressed={selected}
      aria-label={`${name}, ${formatTimecode(c.end - c.start)}`}
      data-tip={`${name} · ${formatTimecode(c.end - c.start)}`}
    >
      {hasFilmstrip && <Filmstrip clip={c} pps={pps} widthPx={widthPx} />}
      {hasWave && <Waveform clip={c} />}
      {(kind === "audio" || kind === "music") && !c.source && <FakeWave />}
      {c.transitionIn && <span className="clip__transition" />}
      {c.variant === "effect" ? (
        <Icon name="transitions" size={16} />
      ) : (
        widthPx > 28 && <span className="clip__label">{name}</span>
      )}
      <span className="clip__handle clip__handle--start" aria-hidden="true" />
      <span className="clip__handle clip__handle--end" aria-hidden="true" />
    </button>
  );
}

/** Real frames tiled across the clip; denser frames appear as you zoom in. */
function Filmstrip({ clip, pps, widthPx }: { clip: Clip; pps: number; widthPx: number }) {
  const source = clip.source;
  const frames = useFilmstrip(source);
  if (!source) return null;
  const aspect = source.width && source.height ? source.width / source.height : 16 / 9;
  const tileW = Math.max(24, Math.round(52 * aspect)); // filmstrip is about 52px tall
  const count = Math.min(400, Math.max(1, Math.ceil(widthPx / tileW)));
  if (!frames.length) return <span className="filmstrip skeleton" aria-hidden="true" />;
  return (
    <span className="filmstrip" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const t = (clip.inPoint ?? 0) + ((i + 0.5) * tileW) / pps;
        return (
          <img
            key={i}
            src={frameAt(frames, source.durationSec, t)}
            alt=""
            style={{ width: tileW }}
            draggable={false}
          />
        );
      })}
    </span>
  );
}

/** Real audio peaks for the visible part of the file. */
function Waveform({ clip }: { clip: Clip }) {
  const peaks = useWaveform(clip.source);
  const source = clip.source;
  if (!source || !peaks.length) return <FakeWave />;
  const per = peaks.length / Math.max(0.001, source.durationSec);
  const from = Math.floor((clip.inPoint ?? 0) * per);
  const to = Math.min(peaks.length, Math.ceil(((clip.inPoint ?? 0) + clip.end - clip.start) * per));
  const slice = peaks.slice(from, Math.max(from + 1, to));
  const step = Math.max(1, Math.floor(slice.length / 600));
  const bars: number[] = [];
  for (let i = 0; i < slice.length; i += step) {
    let m = 0;
    for (let j = i; j < Math.min(slice.length, i + step); j++) m = Math.max(m, slice[j]);
    bars.push(m);
  }
  return (
    <svg className="waveform" viewBox={`0 0 ${bars.length} 1`} preserveAspectRatio="none" aria-hidden="true">
      {bars.map((h, i) => {
        const v = Math.max(0.04, Math.min(1, h * (clip.volume ?? 1)));
        return <rect key={i} x={i + 0.15} y={(1 - v) / 2} width={0.7} height={v} />;
      })}
    </svg>
  );
}

/** Placeholder waveform for sample clips without a real file. */
function FakeWave() {
  const bars = useMemo(
    () =>
      Array.from({ length: 220 }, (_, i) => {
        const v = Math.abs(Math.sin(i * 0.37) * 0.6 + Math.sin(i * 1.13) * 0.3 + Math.sin(i * 2.9) * 0.1);
        return 0.25 + v * 0.75;
      }),
    [],
  );
  return (
    <svg className="waveform" viewBox="0 0 220 1" preserveAspectRatio="none" aria-hidden="true">
      {bars.map((h, i) => (
        <rect key={i} x={i + 0.2} y={(1 - h) / 2} width={0.6} height={h} />
      ))}
    </svg>
  );
}
