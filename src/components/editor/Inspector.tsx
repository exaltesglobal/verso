import type { CSSProperties } from "react";
import { Icon, type IconName } from "../Icon";
import { Button } from "../ui";
import { ReframePanel } from "./ReframePanel";
import type { CropPath } from "../../lib/reframe";
import type { AspectRatio, Clip, Project, TextStyle, TrackKind, TransitionKind } from "../../lib/project";
import { CutToBeatToggle } from "../smart/CutToBeatToggle";
import { formatDuration } from "../../lib/media";
import { editSegmentText } from "../../lib/captions";

interface InspectorProps {
  clip: (Clip & { kind: TrackKind }) | undefined;
  aspect: AspectRatio;
  onChange: (patch: Partial<Clip>) => void;
  onDelete: () => void;
  onCropPath: (path: CropPath | null) => void;
  project: Project;
  onApply: (next: Project, message: string) => void;
}

const KIND_LABEL: Record<TrackKind, string> = {
  text: "Text",
  captions: "Caption",
  video: "Video clip",
  audio: "Sound",
  music: "Music",
};

const TRANSITIONS: { id: TransitionKind | "none"; label: string }[] = [
  { id: "none", label: "None" },
  { id: "fade", label: "Fade" },
  { id: "dissolve", label: "Dissolve" },
  { id: "slide", label: "Slide" },
  { id: "zoom", label: "Zoom" },
];

const TEXT_PRESETS: { id: TextStyle["preset"]; label: string }[] = [
  { id: "title", label: "Title" },
  { id: "subtitle", label: "Subtitle" },
  { id: "body", label: "Body" },
  { id: "boxed", label: "Boxed" },
  { id: "outline", label: "Outline" },
  { id: "neon", label: "Neon" },
];

const SWATCHES = ["#F5F4F0", "#FFB547", "#F472B6", "#5B8CFF", "#2FD4A3", "#0B0B0F"];

export function Inspector({
  clip,
  aspect,
  onChange,
  onDelete,
  onCropPath,
  project,
  onApply,
}: InspectorProps) {
  return (
    <aside className="inspector" aria-label="Properties">
      <div className="inspector__head">
        <p className="eyebrow">{clip ? KIND_LABEL[clip.kind] : "Nothing selected"}</p>
        <h2 className="inspector__title">{clip?.text ?? clip?.label ?? "Pick a clip"}</h2>
        {clip ? (
          <p className="muted small">
            {formatDuration(clip.start)} to {formatDuration(clip.end)} · {(clip.end - clip.start).toFixed(1)}s
          </p>
        ) : (
          <p className="muted small">Click a clip on the timeline to change it.</p>
        )}
      </div>

      {clip?.kind === "video" && (
        <VideoProps
          key={clip.id}
          clip={clip}
          aspect={aspect}
          onChange={onChange}
          onCropPath={onCropPath}
          project={project}
          onApply={onApply}
        />
      )}
      {(clip?.kind === "audio" || clip?.kind === "music") && <AudioProps clip={clip} onChange={onChange} />}
      {clip?.kind === "music" && (
        <section className="inspector__section">
          <CutToBeatToggle project={project} clip={clip} onApply={onApply} />
        </section>
      )}
      {(clip?.kind === "text" || clip?.kind === "captions") && <TextProps clip={clip} onChange={onChange} />}

      {clip && (
        <section className="inspector__section">
          <Button icon="delete" onClick={onDelete} className="btn--block">
            Delete clip
          </Button>
        </section>
      )}

      <p className="inspector__note">
        <Icon name="save" size={16} />
        Changes never touch your original file.
      </p>
    </aside>
  );
}

function VideoProps({
  clip,
  aspect,
  onChange,
  onCropPath,
}: {
  clip: Clip;
  aspect: AspectRatio;
  onChange: (p: Partial<Clip>) => void;
  onCropPath: (path: CropPath | null) => void;
  project: Project;
  onApply: (next: Project, message: string) => void;
}) {
  const transition = clip.transitionIn?.kind ?? "none";
  return (
    <>
      {clip.source ? (
        <section className="inspector__section">
          <ReframePanel clip={clip} aspect={aspect} onCropPath={onCropPath} />
        </section>
      ) : null}
      <section className="inspector__section">
        <Slider
          icon="zoom-in"
          label="Zoom"
          value={Math.round((clip.zoom ?? 1) * 100)}
          min={100}
          max={250}
          unit="%"
          onChange={(v) => onChange({ zoom: v / 100 })}
        />
      </section>{" "}
      <section className="inspector__section">
        <h3 className="section-label">
          <Icon name="speed" size={16} /> Speed
        </h3>
        <Chips
          options={["0.5x", "1x", "1.5x", "2x"]}
          value={`${clip.speed ?? 1}x`}
          onChange={(s) => onChange({ speed: parseFloat(s) })}
        />
        <Slider
          icon="volume"
          label="Clip sound"
          value={Math.round((clip.volume ?? 1) * 100)}
          min={0}
          max={100}
          unit="%"
          onChange={(v) => onChange({ volume: v / 100 })}
        />
      </section>
      <section className="inspector__section">
        <h3 className="section-label">
          <Icon name="transitions" size={16} /> Transition in
        </h3>
        <Chips
          options={TRANSITIONS.map((t) => t.label)}
          value={TRANSITIONS.find((t) => t.id === transition)?.label ?? "None"}
          onChange={(label) => {
            const id = TRANSITIONS.find((t) => t.label === label)?.id ?? "none";
            onChange({
              transitionIn:
                id === "none" ? undefined : { kind: id, duration: clip.transitionIn?.duration ?? 0.5 },
            });
          }}
        />
        {clip.transitionIn && (
          <Slider
            icon="timeline"
            label="Length"
            value={Math.round(clip.transitionIn.duration * 10) / 10}
            min={0.2}
            max={2}
            step={0.1}
            unit="s"
            onChange={(v) =>
              clip.transitionIn && onChange({ transitionIn: { ...clip.transitionIn, duration: v } })
            }
          />
        )}
      </section>
    </>
  );
}

function AudioProps({ clip, onChange }: { clip: Clip; onChange: (p: Partial<Clip>) => void }) {
  return (
    <section className="inspector__section">
      <Slider
        icon="volume"
        label="Volume"
        value={Math.round((clip.volume ?? 1) * 100)}
        min={0}
        max={150}
        unit="%"
        onChange={(v) => onChange({ volume: v / 100 })}
      />
      <Slider
        icon="adjust"
        label="Fade in"
        value={clip.fadeIn ?? 0}
        min={0}
        max={5}
        step={0.1}
        unit="s"
        onChange={(v) => onChange({ fadeIn: v })}
      />
      <Slider
        icon="adjust"
        label="Fade out"
        value={clip.fadeOut ?? 0}
        min={0}
        max={5}
        step={0.1}
        unit="s"
        onChange={(v) => onChange({ fadeOut: v })}
      />
    </section>
  );
}

function TextProps({ clip, onChange }: { clip: Clip; onChange: (p: Partial<Clip>) => void }) {
  const style: TextStyle = clip.style ?? {
    preset: "subtitle",
    y: 0.7,
    size: 0.045,
    color: "#F5F4F0",
    align: "center",
  };
  const setStyle = (patch: Partial<TextStyle>) => onChange({ style: { ...style, ...patch } });
  return (
    <>
      <section className="inspector__section">
        <label className="field">
          <span className="field__label">Words</span>
          <textarea
            className="field__input"
            rows={3}
            value={clip.text ?? clip.label}
            onChange={(e) => {
              const text = e.target.value;
              // Preview draws caption words, not text: keep them in step with the edit.
              const words = clip.words
                ? editSegmentText({ start: clip.start, end: clip.end, text: "", words: clip.words }, text).words
                : undefined;
              onChange({ text, label: text, ...(words && { words }) });
            }}
          />
        </label>
      </section>
      <section className="inspector__section">
        <h3 className="section-label">Style</h3>
        <div className="style-pick">
          {TEXT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={
                p.id === style.preset
                  ? `style-pick__item text-look--${p.id} is-active`
                  : `style-pick__item text-look--${p.id}`
              }
              onClick={() => setStyle({ preset: p.id })}
              aria-pressed={p.id === style.preset}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="swatches" role="radiogroup" aria-label="Colour">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={c === style.color}
              aria-label={`Colour ${c}`}
              className={c === style.color ? "swatch is-active" : "swatch"}
              style={{ background: c }}
              onClick={() => setStyle({ color: c })}
            />
          ))}
        </div>
        <Slider
          icon="text"
          label="Size"
          value={Math.round(style.size * 1000)}
          min={20}
          max={120}
          unit=""
          onChange={(v) => setStyle({ size: v / 1000 })}
        />
        <Slider
          icon="layers"
          label="Position"
          value={Math.round(style.y * 100)}
          min={5}
          max={95}
          unit="%"
          onChange={(v) => setStyle({ y: v / 100 })}
        />
      </section>
    </>
  );
}

function Chips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="chips">
      {options.map((s) => (
        <button
          key={s}
          type="button"
          className={s === value ? "chip is-active" : "chip"}
          aria-pressed={s === value}
          onClick={() => onChange(s)}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function Slider({
  icon,
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  icon: IconName;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
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
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--fill": `${pct}%` } as CSSProperties}
      />
    </label>
  );
}
