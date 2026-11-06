import { useMemo, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { Icon, type IconName } from "../Icon";
import { IconButton } from "../ui";
import { frameAt, useFilmstrip } from "../../lib/filmstrip";
import { useWaveform } from "../../lib/waveform";
import { formatDuration } from "../../lib/media";
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
const TRACK_ICON: Record<TrackKind, IconName> = {
  text: "text",
  captions: "captions",
  video: "play",
  audio: "volume",
  music: "music",
};
const STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600];

export type TimelineEdit =
  | { type: "move"; id: string; delta: number }
  | { type: "trim"; id: string; edge: "start" | "end"; time: number }
  | { type: "end" };

interface TimelineProps {
  project: Project;
  duration: number;
  time: number;
  onSeek: (t: number) => void;
  zoom: number;
  onZoom: (z: number) => void;
  selectedClip: string;
  onSelectClip: (id: string) => void;
  onEdit: (e: TimelineEdit) => void;
  onSplit: () => void;
  onDelete: () => void;
}

export function Timeline(props: TimelineProps) {
  const { project, duration, time, onSeek, zoom, onZoom, selectedClip, onSelectClip, onEdit } = props;
  const viewSeconds = Math.max(MIN_TIMELINE_SECONDS, duration * 1.15 + 4);
  const pps = Math.min(MAX_PX_PER_SEC, FIT_WIDTH / viewSeconds) * zoom;
  const width = viewSeconds * pps + GUTTER * 2;

  // Labelled ticks at least ~72px apart, with small ticks between when there's room.
  const major = STEPS.find((s) => s * pps >= 72) ?? STEPS[STEPS.length - 1];
  const minor = major / 5 >= 1 && (major / 5) * pps >= 10 ? major / 5 : major;
  const ticks = useMemo(() => {
    const out: number[] = [];
    for (let s = 0; s <= viewSeconds; s += minor) out.push(Math.round(s * 1000) / 1000);
    return out;
  }, [viewSeconds, minor]);

  const seekFromPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(Math.min(duration, Math.max(0, (e.clientX - rect.left) / pps)));
  };

  /** Snaps `t` to a nearby clip edge or the playhead. */
  const snapper = (exclude: Set<string>) => {
    const pts = snapPoints(project, exclude, time);
    const tol = SNAP_PX / pps;
    return (t: number) => {
      let best = t;
      let dist = tol;
      for (const p of pts) {
        const d = Math.abs(p - t);
        if (d < dist) {
          dist = d;
          best = p;
        }
      }
      return best;
    };
  };

  const empty = duration === 0;
  const rows = `32px repeat(${project.tracks.length}, minmax(40px, 1fr))`;

  return (
    <section className="timeline" aria-label="Timeline">
      <div className="timeline__toolbar">
        <div className="timeline__tools">
          <IconButton icon="split" label="Split at playhead (S)" onClick={props.onSplit} disabled={empty} />
          <IconButton
            icon="delete"
            label="Delete clip (Delete)"
            onClick={props.onDelete}
            disabled={!selectedClip}
          />
          <span className="timeline__sep" />
          <span className="timeline__hint">Drag clips to move them. Drag their edges to trim.</span>
        </div>
        <div className="timeline__zoom">
          <button
            type="button"
            className="zoom-step"
            aria-label="Zoom out"
            onClick={() => onZoom(Math.max(0.5, +(zoom - 0.25).toFixed(2)))}
          >
            −
          </button>
          <input
            type="range"
            min={0.5}
            max={8}
            step={0.05}
            value={zoom}
            aria-label="Timeline zoom"
            onChange={(e) => onZoom(Number(e.target.value))}
            style={{ "--fill": `${((zoom - 0.5) / 7.5) * 100}%` } as CSSProperties}
          />
          <button
            type="button"
            className="zoom-step"
            aria-label="Zoom in"
            onClick={() => onZoom(Math.min(8, +(zoom + 0.25).toFixed(2)))}
          >
            <Icon name="zoom-in" size={16} />
          </button>
        </div>
      </div>

      <div className="timeline__body">
        <div className="timeline__labels" style={{ gridTemplateRows: rows }}>
          <div className="timeline__label-spacer" />
          {project.tracks.map((t) => (
            <div key={t.kind} className="track-label">
              <Icon name={TRACK_ICON[t.kind]} size={16} />
              {t.label}
            </div>
          ))}
        </div>

        <div className="timeline__scroll">
          <div className="timeline__content" style={{ width, gridTemplateRows: rows }}>
            <div
              className="ruler"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                seekFromPointer(e);
              }}
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) seekFromPointer(e);
              }}
            >
              {ticks.map((s) => {
                const isMajor = Math.abs(s / major - Math.round(s / major)) < 1e-6;
                return (
                  <span
                    key={s}
                    className={isMajor ? "ruler__tick is-major" : "ruler__tick"}
                    style={{ left: s * pps }}
                  >
                    {isMajor && <span className="ruler__label">{formatDuration(s)}</span>}
                  </span>
                );
              })}
            </div>

            {project.tracks.map((t) => (
              <div
                key={t.kind}
                className={`track track--${t.kind}`}
                onPointerDown={(e) => {
                  if (e.target === e.currentTarget) onSelectClip("");
                }}
              >
                {t.clips.map((c) => (
                  <ClipView
                    key={c.id}
                    clip={c}
                    kind={t.kind}
                    pps={pps}
                    selected={c.id === selectedClip}
                    onSelect={() => onSelectClip(c.id)}
                    onEdit={onEdit}
                    makeSnapper={() => snapper(linkedIds(project, c.id))}
                  />
                ))}
                {empty && t.kind === "video" && (
                  <span className="track__hint">Import a video and it lands here.</span>
                )}
              </div>
            ))}

            {!empty && (
              <>
                <div
                  className="playhead"
                  style={{ transform: `translateX(${time * pps}px)` }}
                  aria-hidden="true"
                >
                  <span className="playhead__head" />
                </div>
                <div className="timeline__end" style={{ left: duration * pps }} aria-hidden="true" />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

interface ClipViewProps {
  clip: Clip;
  kind: TrackKind;
  pps: number;
  selected: boolean;
  onSelect: () => void;
  onEdit: (e: TimelineEdit) => void;
  makeSnapper: () => (t: number) => number;
}

type Drag = {
  mode: "move" | "start" | "end";
  x0: number;
  start0: number;
  end0: number;
  applied: number;
  moved: boolean;
  snap: (t: number) => number;
};

function ClipView({ clip: c, kind, pps, selected, onSelect, onEdit, makeSnapper }: ClipViewProps) {
  const drag = useRef<Drag | null>(null);
  const widthPx = Math.max(18, (c.end - c.start) * pps - 4);
  const colour = c.variant === "effect" ? "effects" : kind;
  const hasFilmstrip = kind === "video" && !!c.source?.hasVideo;
  const hasWave = (kind === "audio" || kind === "music") && !!c.source;

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    onSelect();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const mode = x < EDGE_PX ? "start" : x > rect.width - EDGE_PX ? "end" : "move";
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
    if (d.mode === "move") {
      // Snap whichever edge is closer to a snap point.
      let start = d.start0 + dt;
      const len = d.end0 - d.start0;
      const s1 = d.snap(start);
      const s2 = d.snap(start + len) - len;
      start = Math.abs(s1 - start) <= Math.abs(s2 - start) ? s1 : s2;
      const target = Math.max(0, start) - d.start0;
      onEdit({ type: "move", id: c.id, delta: target - d.applied });
      d.applied = target;
    } else {
      const edgeTime = d.snap((d.mode === "start" ? d.start0 : d.end0) + dt);
      onEdit({ type: "trim", id: c.id, edge: d.mode, time: edgeTime });
    }
  };

  const onPointerUp = () => {
    if (drag.current?.moved) onEdit({ type: "end" });
    drag.current = null;
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
      style={{ left: c.start * pps, width: widthPx }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-pressed={selected}
      title={`${c.text ?? c.label} · ${formatDuration(c.end - c.start)}`}
    >
      {hasFilmstrip && <Filmstrip clip={c} pps={pps} widthPx={widthPx} />}
      {hasWave && <Waveform clip={c} />}
      {(kind === "audio" || kind === "music") && !c.source && <FakeWave />}
      {c.transitionIn && <span className="clip__transition" title={`${c.transitionIn.kind} in`} />}
      {c.variant === "effect" ? (
        <Icon name="transitions" size={16} />
      ) : (
        <span className="clip__label">{c.text ?? c.label}</span>
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
  const tileW = Math.max(24, Math.round(40 * aspect)); // clip content is about 40px tall
  const count = Math.min(400, Math.max(1, Math.ceil(widthPx / tileW)));
  if (!frames.length) return <span className="filmstrip is-loading" aria-hidden="true" />;
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
