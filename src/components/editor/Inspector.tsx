import { useState, type CSSProperties } from "react";
import { Icon, type IconName } from "../Icon";
import { IconButton, ScrubNumber, Section, Segmented } from "../ui";
import { ContextMenu } from "../ContextMenu";
import { Timecode } from "../Timecode";
import { ReframePanel } from "./ReframePanel";
import type { CropPath } from "../../lib/reframe";
import type { AspectRatio, Clip, Project, TextStyle, TrackKind, TransitionKind } from "../../lib/project";
import { CutToBeatToggle } from "../smart/CutToBeatToggle";
import { editSegmentText } from "../../lib/captions";
import { EnhancePanel } from "../smart/EnhancePanel";
import { ColorPanel } from "../smart/ColorPanel";
import { SpeedPanel } from "../smart/SpeedPanel";
import { BackgroundPanel } from "../smart/BackgroundPanel";
import { useVisibility } from "../../lib/modes";

interface InspectorProps {
  clip: (Clip & { kind: TrackKind }) | undefined;
  aspect: AspectRatio;
  onChange: (patch: Partial<Clip>) => void;
  onDelete: () => void;
  onCropPath: (path: CropPath | null) => void;
  project: Project;
  onApply: (next: Project, message: string) => void;
  /** Playhead, in timeline seconds. */
  time: number;
  onCollapse: () => void;
}

const KIND: Record<TrackKind, { label: string; icon: IconName; colour: string }> = {
  text: { label: "Text", icon: "text", colour: "var(--ui-track-text)" },
  captions: { label: "Caption", icon: "captions", colour: "var(--ui-track-captions)" },
  video: { label: "Video clip", icon: "play", colour: "var(--ui-track-video)" },
  audio: { label: "Sound", icon: "volume", colour: "var(--ui-track-audio)" },
  music: { label: "Music", icon: "music", colour: "var(--ui-track-audio)" },
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
  time,
  onCollapse,
}: InspectorProps) {
  // Speed ramps are keyframed: a Studio control.
  const showRamp = useVisibility().keyframes;
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const kind = clip ? KIND[clip.kind] : null;
  return (
    <aside className="inspector" aria-label="Properties">
      <div
        className="inspector__head"
        style={kind ? ({ "--kind": kind.colour } as CSSProperties) : undefined}
      >
        {kind ? (
          <>
            <span className="inspector__kind" data-tip={kind.label}>
              <Icon name={kind.icon} size={16} />
            </span>
            <h2 className="inspector__title">{clip?.text ?? clip?.label}</h2>
            {clip && <Timecode t={clip.end - clip.start} className="inspector__dur" />}
            <IconButton
              icon="more-horizontal"
              label="More"
              size={16}
              aria-haspopup="menu"
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setMenu({ x: r.right - 200, y: r.bottom + 4 });
              }}
            />
          </>
        ) : (
          <h2 className="inspector__title">Properties</h2>
        )}
        <IconButton
          icon="chevron-right"
          label="Hide properties"
          shortcut="Ctrl+\"
          size={16}
          onClick={onCollapse}
        />
      </div>

      {!clip && (
        <div className="empty empty--panel">
          <Icon name="layers" size={32} />
          <p className="empty__title">Nothing selected</p>
          <p>Click a clip on the timeline to change it.</p>
        </div>
      )}

      {clip?.kind === "video" && (
        <VideoProps key={clip.id} clip={clip} aspect={aspect} onChange={onChange} onCropPath={onCropPath} />
      )}
      {clip?.kind === "video" && (
        <>
          {showRamp && (
            <Section title="Speed ramp" defaultOpen={false}>
              <SpeedPanel project={project} clipId={clip.id} time={time} onApply={onApply} />
            </Section>
          )}
          <Section title="Colour" defaultOpen={false}>
            <ColorPanel project={project} clipId={clip.id} onApply={onApply} />
          </Section>
          {clip.source?.hasVideo && (
            <Section title="Background" defaultOpen={false}>
              <BackgroundPanel clip={clip} playhead={time} onChange={onChange} />
            </Section>
          )}
        </>
      )}
      {(clip?.kind === "audio" || clip?.kind === "music") && <AudioProps clip={clip} onChange={onChange} />}
      {(clip?.kind === "video" || clip?.kind === "audio") && (
        <Section title="Clean up voice" defaultOpen={false}>
          <EnhancePanel project={project} clipId={clip.id} onApply={onApply} />
        </Section>
      )}
      {clip?.kind === "music" && (
        <Section title="Beat">
          <CutToBeatToggle project={project} clip={clip} onApply={onApply} />
        </Section>
      )}
      {(clip?.kind === "text" || clip?.kind === "captions") && <TextProps clip={clip} onChange={onChange} />}

      <p className="inspector__note">
        <Icon name="save" size={16} />
        Changes never touch your original file.
      </p>
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          items={[
            {
              label: "Reset size and position",
              icon: "reset",
              disabled: clip?.kind !== "video",
              onSelect: () => onChange({ zoom: 1, pos: undefined, opacity: undefined }),
            },
            { separator: true },
            { label: "Delete clip", icon: "delete", shortcut: "Del", danger: true, onSelect: onDelete },
          ]}
        />
      )}
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
}) {
  const transition = clip.transitionIn?.kind ?? "none";
  const zoom = clip.zoom ?? 1;
  const pos = clip.pos ?? { x: 0, y: 0 };
  const opacity = clip.opacity ?? 1;
  // A speaker crop path owns the framing (preview and export ignore zoom and position then).
  const reframed = !!clip.cropPath;
  const moved = zoom !== 1 || pos.x !== 0 || pos.y !== 0 || opacity !== 1;
  const setPos = (p: Partial<{ x: number; y: number }>) => {
    const next = { ...pos, ...p };
    onChange({ pos: next.x || next.y ? next : undefined });
  };
  return (
    <>
      {/* Effect controls first, like Premiere: the basics everyone reaches for. */}
      <Section
        title="Size and position"
        onReset={moved ? () => onChange({ zoom: 1, pos: undefined, opacity: undefined }) : undefined}
      >
        <ScrubNumber
          label="Scale"
          value={Math.round(zoom * 100)}
          min={100}
          max={250}
          unit="%"
          defaultValue={100}
          disabled={reframed}
          slider
          onChange={(v) => onChange({ zoom: v / 100 })}
        />
        <ScrubNumber
          label="Position X"
          value={Math.round(pos.x * 100)}
          min={-100}
          max={100}
          defaultValue={0}
          disabled={reframed || zoom <= 1}
          onChange={(v) => setPos({ x: v / 100 })}
        />
        <ScrubNumber
          label="Position Y"
          value={Math.round(pos.y * 100)}
          min={-100}
          max={100}
          defaultValue={0}
          disabled={reframed || zoom <= 1}
          onChange={(v) => setPos({ y: v / 100 })}
        />
        <ScrubNumber
          label="Opacity"
          value={Math.round(opacity * 100)}
          min={0}
          max={100}
          unit="%"
          defaultValue={100}
          onChange={(v) => onChange({ opacity: v >= 100 ? undefined : v / 100 })}
        />
        {reframed ? (
          <p className="insp-hint">Reframe is following speakers, so it sets the framing.</p>
        ) : (
          zoom <= 1 && <p className="insp-hint">Scale up to move the picture around.</p>
        )}
      </Section>
      <Section title="Sound">
        <ScrubNumber
          label="Volume"
          value={Math.round((clip.volume ?? 1) * 100)}
          min={0}
          max={100}
          unit="%"
          defaultValue={100}
          slider
          onChange={(v) => onChange({ volume: v / 100 })}
        />
      </Section>
      {clip.source?.hasVideo && (
        <Section title={`Fit to ${aspect}`}>
          <ReframePanel clip={clip} aspect={aspect} onCropPath={onCropPath} />
        </Section>
      )}
      <Section title="Speed">
        <Segmented
          label="Speed"
          options={["0.5x", "1x", "1.5x", "2x"] as const}
          value={(["0.5x", "1x", "1.5x", "2x"] as const).find((o) => o === `${clip.speed ?? 1}x`) ?? "1x"}
          onChange={(s) => onChange({ speed: parseFloat(s), speedRamp: undefined })}
        />
      </Section>
      <Section title="Transition in" defaultOpen={false}>
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
          <ScrubNumber
            label="Length"
            value={Math.round(clip.transitionIn.duration * 10) / 10}
            min={0.2}
            max={2}
            step={0.1}
            unit="s"
            defaultValue={0.5}
            onChange={(v) =>
              clip.transitionIn && onChange({ transitionIn: { ...clip.transitionIn, duration: v } })
            }
          />
        )}
      </Section>
    </>
  );
}

function AudioProps({ clip, onChange }: { clip: Clip; onChange: (p: Partial<Clip>) => void }) {
  return (
    <Section title="Sound">
      <ScrubNumber
        label="Volume"
        value={Math.round((clip.volume ?? 1) * 100)}
        min={0}
        max={150}
        unit="%"
        defaultValue={100}
        slider
        onChange={(v) => onChange({ volume: v / 100 })}
      />
      <ScrubNumber
        label="Fade in"
        value={clip.fadeIn ?? 0}
        min={0}
        max={5}
        step={0.1}
        unit="s"
        defaultValue={0}
        onChange={(v) => onChange({ fadeIn: v })}
      />
      <ScrubNumber
        label="Fade out"
        value={clip.fadeOut ?? 0}
        min={0}
        max={5}
        step={0.1}
        unit="s"
        defaultValue={0}
        onChange={(v) => onChange({ fadeOut: v })}
      />
    </Section>
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
      <Section title="Words">
        <textarea
          className="field__input"
          rows={3}
          aria-label="Words"
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
      </Section>
      <Section title="Style">
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
      </Section>
      <Section title="Size and position">
        <ScrubNumber
          label="Size"
          value={Math.round(style.size * 1000)}
          min={20}
          max={120}
          defaultValue={45}
          slider
          onChange={(v) => setStyle({ size: v / 1000 })}
        />
        <ScrubNumber
          label="Position Y"
          value={Math.round(style.y * 100)}
          min={5}
          max={95}
          unit="%"
          defaultValue={70}
          onChange={(v) => setStyle({ y: v / 100 })}
        />
      </Section>
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
