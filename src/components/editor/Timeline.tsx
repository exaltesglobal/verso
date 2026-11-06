import { useMemo, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { Icon, type IconName } from "../Icon";
import { IconButton } from "../ui";
import { frameAt, useFilmstrip } from "../../lib/filmstrip";
import { formatDuration } from "../../lib/media";
import { MIN_TIMELINE_SECONDS, type Clip, type Project, type TrackKind } from "../../lib/project";

/** Width the timeline aims to fill at zoom 1, so short and long projects both fit. */
const FIT_WIDTH = 1100;
const MAX_PX_PER_SEC = 34;
const GUTTER = 12;
const TRACK_ICON: Record<TrackKind, IconName> = {
  text: "text",
  captions: "captions",
  video: "play",
  audio: "music",
};
const STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600];

interface TimelineProps {
  project: Project;
  duration: number;
  time: number;
  onSeek: (t: number) => void;
  zoom: number;
  onZoom: (z: number) => void;
  selectedClip: string;
  onSelectClip: (id: string) => void;
}

export function Timeline({
  project,
  duration,
  time,
  onSeek,
  zoom,
  onZoom,
  selectedClip,
  onSelectClip,
}: TimelineProps) {
  const viewSeconds = Math.max(MIN_TIMELINE_SECONDS, duration * 1.08 + 2);
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
    const t = (e.clientX - rect.left) / pps;
    onSeek(Math.min(duration, Math.max(0, t)));
  };

  const empty = duration === 0;

  return (
    <section className="timeline" aria-label="Timeline">
      <div className="timeline__toolbar">
        <div className="timeline__tools">
          <IconButton icon="split" label="Split at playhead (S)" />
          <IconButton icon="trim" label="Trim" />
          <IconButton icon="delete" label="Delete" />
          <span className="timeline__sep" />
          <IconButton icon="transitions" label="Add transition" />
          <IconButton icon="layers" label="Layers" />
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
        <div className="timeline__labels">
          <div className="timeline__label-spacer" />
          {project.tracks.map((t) => (
            <div key={t.kind} className="track-label">
              <Icon name={TRACK_ICON[t.kind]} size={16} />
              {t.label}
            </div>
          ))}
        </div>

        <div className="timeline__scroll">
          <div className="timeline__content" style={{ width }}>
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
              <div key={t.kind} className={`track track--${t.kind}`}>
                {t.clips.map((c) => (
                  <ClipView
                    key={c.id}
                    clip={c}
                    kind={t.kind}
                    pps={pps}
                    selected={c.id === selectedClip}
                    onSelect={() => onSelectClip(c.id)}
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
}

function ClipView({ clip: c, kind, pps, selected, onSelect }: ClipViewProps) {
  const widthPx = Math.max(18, (c.end - c.start) * pps - 4);
  const colour = c.variant === "effect" ? "effects" : kind;
  const hasFilmstrip = kind === "video" && !!c.source?.hasVideo;
  return (
    <button
      type="button"
      className={["clip", `clip--${colour}`, hasFilmstrip && "has-filmstrip", selected && "is-selected"]
        .filter(Boolean)
        .join(" ")}
      style={{ left: c.start * pps, width: widthPx }}
      onClick={onSelect}
      aria-pressed={selected}
      title={c.source ? `${c.label} · ${formatDuration(c.end - c.start)}` : c.label}
    >
      {hasFilmstrip && <Filmstrip clip={c} pps={pps} widthPx={widthPx} />}
      {kind === "audio" && <Waveform />}
      {c.variant === "effect" ? (
        <Icon name="transitions" size={16} />
      ) : (
        <span className="clip__label">{c.label}</span>
      )}
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
  const count = Math.max(1, Math.ceil(widthPx / tileW));
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

/** Placeholder waveform until real audio peaks land (next Phase 2 step). */
function Waveform() {
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
