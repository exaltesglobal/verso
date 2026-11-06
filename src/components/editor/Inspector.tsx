import { useState, type CSSProperties, type ReactNode } from "react";
import { Icon, type IconName } from "../Icon";
import { Toggle } from "../ui";
import type { AspectRatio, Clip, TrackKind } from "../../data/placeholder";
import { formatDuration } from "../../lib/media";

interface InspectorProps {
  clip: (Clip & { kind: TrackKind }) | undefined;
  aspect: AspectRatio;
}

const KIND_LABEL: Record<TrackKind, string> = {
  text: "Text",
  captions: "Caption",
  video: "Video clip",
  audio: "Audio",
};

export function Inspector({ clip, aspect }: InspectorProps) {
  const [follow, setFollow] = useState(true);
  const [autoCaptions, setAutoCaptions] = useState(true);
  const [beatSync, setBeatSync] = useState(false);
  const [zoom, setZoom] = useState(112);
  const [volume, setVolume] = useState(80);
  const [speed, setSpeed] = useState("1x");

  return (
    <aside className="inspector" aria-label="Properties">
      <div className="inspector__head">
        <p className="eyebrow">{clip ? KIND_LABEL[clip.kind] : "Nothing selected"}</p>
        <h2 className="inspector__title">{clip?.label ?? "Pick a clip"}</h2>
        {clip && (
          <p className="muted small">
            {formatDuration(clip.start)} to {formatDuration(clip.end)} · {(clip.end - clip.start).toFixed(1)}s
          </p>
        )}
      </div>

      <section className="inspector__section">
        <h3 className="section-label">Reframe for {aspect}</h3>
        <Row icon="subject-track" label="Follow the speaker">
          <Toggle label="Follow the speaker" checked={follow} onChange={setFollow} />
        </Row>
        <Row icon="captions" label="Auto captions">
          <Toggle label="Auto captions" checked={autoCaptions} onChange={setAutoCaptions} />
        </Row>
        <Row icon="music" label="Beat-synced music">
          <Toggle label="Beat-synced music" checked={beatSync} onChange={setBeatSync} />
        </Row>
      </section>

      <section className="inspector__section">
        <Slider icon="zoom-in" label="Zoom" value={zoom} min={100} max={200} unit="%" onChange={setZoom} />
        <Slider icon="volume" label="Volume" value={volume} min={0} max={100} unit="%" onChange={setVolume} />
      </section>

      <section className="inspector__section">
        <h3 className="section-label">
          <Icon name="speed" size={16} /> Speed
        </h3>
        <div className="chips">
          {["0.5x", "1x", "1.5x", "2x"].map((s) => (
            <button
              key={s}
              type="button"
              className={s === speed ? "chip is-active" : "chip"}
              aria-pressed={s === speed}
              onClick={() => setSpeed(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <p className="inspector__note">
        <Icon name="save" size={16} />
        Changes never touch your original file.
      </p>
    </aside>
  );
}

function Row({ icon, label, children }: { icon: IconName; label: string; children: ReactNode }) {
  return (
    <div className="prop-row">
      <Icon name={icon} size={20} />
      <span className="prop-row__label">{label}</span>
      {children}
    </div>
  );
}

function Slider({
  icon,
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  icon: IconName;
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="slider">
      <span className="slider__top">
        <span className="slider__label">
          <Icon name={icon} size={16} />
          {label}
        </span>
        <span className="slider__value">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--fill": `${pct}%` } as CSSProperties}
      />
    </label>
  );
}
