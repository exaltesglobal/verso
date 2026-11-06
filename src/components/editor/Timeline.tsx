import { useMemo, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { Icon, type IconName } from "../Icon";
import { IconButton } from "../ui";
import { REEL_DURATION, tracks, type TrackKind } from "../../data/placeholder";
import { formatDuration } from "../../lib/media";

const BASE_PX_PER_SEC = 34;
const VIEW_SECONDS = 36; // a little past the reel end, so there's room to drop clips
const TRACK_ICON: Record<TrackKind, IconName> = {
  text: "text",
  captions: "captions",
  video: "play",
  audio: "music",
};

interface TimelineProps {
  time: number;
  onSeek: (t: number) => void;
  zoom: number;
  onZoom: (z: number) => void;
  selectedClip: string;
  onSelectClip: (id: string) => void;
}

export function Timeline({ time, onSeek, zoom, onZoom, selectedClip, onSelectClip }: TimelineProps) {
  const pps = BASE_PX_PER_SEC * zoom;
  const width = VIEW_SECONDS * pps + 24; // + left/right gutter
  const scroller = useRef<HTMLDivElement>(null);

  // Label every 5s, or every 1-2s when zoomed in.
  const step = zoom >= 2.2 ? 1 : zoom >= 1.4 ? 2 : 5;
  const ticks = useMemo(() => {
    const out: number[] = [];
    for (let s = 0; s <= VIEW_SECONDS; s += 1) out.push(s);
    return out;
  }, []);

  const seekFromPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const t = (e.clientX - rect.left) / pps;
    onSeek(Math.min(REEL_DURATION, Math.max(0, t)));
  };

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
            max={3}
            step={0.05}
            value={zoom}
            aria-label="Timeline zoom"
            onChange={(e) => onZoom(Number(e.target.value))}
            style={{ "--fill": `${((zoom - 0.5) / 2.5) * 100}%` } as CSSProperties}
          />
          <button
            type="button"
            className="zoom-step"
            aria-label="Zoom in"
            onClick={() => onZoom(Math.min(3, +(zoom + 0.25).toFixed(2)))}
          >
            <Icon name="zoom-in" size={16} />
          </button>
        </div>
      </div>

      <div className="timeline__body">
        <div className="timeline__labels">
          <div className="timeline__label-spacer" />
          {tracks.map((t) => (
            <div key={t.kind} className="track-label">
              <Icon name={TRACK_ICON[t.kind]} size={16} />
              {t.label}
            </div>
          ))}
        </div>

        <div className="timeline__scroll" ref={scroller}>
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
              {ticks.map((s) => (
                <span
                  key={s}
                  className={s % step === 0 ? "ruler__tick is-major" : "ruler__tick"}
                  style={{ left: s * pps }}
                >
                  {s % step === 0 && <span className="ruler__label">{formatDuration(s)}</span>}
                </span>
              ))}
            </div>

            {tracks.map((t) => (
              <div key={t.kind} className={`track track--${t.kind}`}>
                {t.clips.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={[
                      "clip",
                      `clip--${c.variant === "effect" ? "effects" : t.kind}`,
                      c.id === selectedClip && "is-selected",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{ left: c.start * pps, width: Math.max(18, (c.end - c.start) * pps - 4) }}
                    onClick={() => onSelectClip(c.id)}
                    aria-pressed={c.id === selectedClip}
                    title={c.label}
                  >
                    {t.kind === "audio" && <Waveform />}
                    {c.variant === "effect" ? (
                      <Icon name="transitions" size={16} />
                    ) : (
                      <span className="clip__label">{c.label}</span>
                    )}
                  </button>
                ))}
              </div>
            ))}

            <div className="playhead" style={{ transform: `translateX(${time * pps}px)` }} aria-hidden="true">
              <span className="playhead__head" />
            </div>
            <div className="timeline__end" style={{ left: REEL_DURATION * pps }} aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Deterministic fake waveform so the audio clip reads as sound. */
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
