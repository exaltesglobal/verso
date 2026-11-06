import { useState } from "react";
import { Button } from "../ui";
import { findClip, updateClip, type ClipColor, type Project } from "../../lib/project";
import { frameAt, useFilmstrip } from "../../lib/filmstrip";
import {
  COLOR_PRESETS,
  NEUTRAL_COLOR,
  applyPreset,
  autoColor,
  colorFilter,
  colorWashStyle,
  importLut,
  withLut,
} from "../../lib/color";
import { LevelSlider, SmartCard } from "./parts";

export interface ColorPanelProps {
  project: Project;
  /** The selected clip; only video clips can be coloured. */
  clipId?: string;
  onApply: (next: Project, message: string) => void;
}

type SliderKey = "brightness" | "contrast" | "saturation" | "temperature" | "tint" | "vibrance";

const SLIDERS: { key: SliderKey; label: string; low: string; high: string }[] = [
  { key: "brightness", label: "Brightness", low: "Darker", high: "Brighter" },
  { key: "contrast", label: "Contrast", low: "Flatter", high: "Punchier" },
  { key: "saturation", label: "Colour", low: "Less", high: "More" },
  { key: "vibrance", label: "Vibrance", low: "Softer", high: "Richer" },
  { key: "temperature", label: "Warmth", low: "Cooler", high: "Warmer" },
  { key: "tint", label: "Tint", low: "Greener", high: "Pinker" },
];

/** Colour tab: looks, sliders, custom LUTs and auto fix for the selected video clip. */
export function ColorPanel({ project, clipId, onApply }: ColorPanelProps) {
  const clip = clipId ? findClip(project, clipId) : undefined;
  const video = clip?.kind === "video" && (clip.source?.hasVideo || clip.still) ? clip : undefined;
  const frames = useFilmstrip(video?.source);
  const [draft, setDraft] = useState<{ id: string; color: ClipColor } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  if (!video) {
    return (
      <SmartCard icon="filters" title="Colour" lede="Give your clip a look, or fix its colours.">
        <p className="smart-note">Pick a video clip on the timeline to change its colours.</p>
      </SmartCard>
    );
  }

  const saved = video.color ?? NEUTRAL_COLOR;
  const color = draft?.id === video.id ? draft.color : saved;
  const thumb = video.still
    ? undefined
    : video.source &&
      frameAt(frames, video.source.durationSec, (video.inPoint ?? 0) + (video.end - video.start) / 2);
  const commit = (next: ClipColor, message: string) => {
    setDraft(null);
    onApply(updateClip(project, video.id, { color: next }), message);
  };
  const run = async (job: () => Promise<void>) => {
    setError(undefined);
    setBusy(true);
    try {
      await job();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SmartCard
        icon="filters"
        title="Looks"
        lede="Tap a look to try it. You can fine-tune it below."
        aside={
          <Button
            icon="one-click"
            disabled={busy || !video.source}
            onClick={() =>
              void run(async () => commit(await autoColor(video), "Colours fixed automatically."))
            }
          >
            Auto fix
          </Button>
        }
      >
        <div className="look-grid" role="radiogroup" aria-label="Looks">
          {[{ id: "", label: "Original" }, ...COLOR_PRESETS].map((p) => {
            const c = p.id
              ? applyPreset(color, p.id)
              : { ...NEUTRAL_COLOR, lut: color.lut, lutLook: color.lutLook, lutStrength: color.lutStrength };
            const active = (color.preset ?? "") === p.id;
            return (
              <button
                key={p.id || "none"}
                type="button"
                role="radio"
                aria-checked={active}
                className={active ? "look-grid__item is-active" : "look-grid__item"}
                onClick={() =>
                  commit(
                    { ...c, preset: p.id || undefined },
                    p.id ? `Look: ${p.label}.` : "Back to the original colours.",
                  )
                }
              >
                <span className="look-grid__thumb">
                  {thumb && <img src={thumb} alt="" draggable={false} style={{ filter: colorFilter(c) }} />}
                  <span style={colorWashStyle(c)} />
                </span>
                <span className="look-grid__label">{p.label}</span>
              </button>
            );
          })}
        </div>
      </SmartCard>

      <SmartCard icon="adjust" title="Adjust" lede="Small changes go a long way.">
        {SLIDERS.map((s) => (
          <LevelSlider
            key={s.key}
            label={s.label}
            low={s.low}
            high={s.high}
            value={(color[s.key] + 1) / 2}
            onChange={(v) =>
              setDraft({ id: video.id, color: { ...color, [s.key]: v * 2 - 1, preset: undefined } })
            }
            onCommit={() => draft && commit(draft.color, `${s.label} changed.`)}
          />
        ))}
        <div className="smart-actions">
          <Button
            icon="undo"
            onClick={() => commit({ ...NEUTRAL_COLOR }, "Colours reset.")}
            disabled={!video.color}
          >
            Reset colours
          </Button>
        </div>
      </SmartCard>

      <SmartCard
        icon="layers"
        title="Your own LUT"
        lede="Use a .cube colour file from your camera or editor."
      >
        {color.lut ? (
          <>
            <LevelSlider
              label="LUT strength"
              low="Off"
              high="Full"
              value={color.lutStrength}
              onChange={(v) => setDraft({ id: video.id, color: { ...color, lutStrength: v } })}
              onCommit={() => draft && commit(draft.color, "LUT strength changed.")}
            />
            <p className="smart-note">The preview is close. Your export uses the exact LUT.</p>
          </>
        ) : null}
        {error && <p className="smart-note smart-note--error">{error}</p>}
        <div className="smart-actions">
          <Button
            icon="import"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const lut = await importLut();
                if (lut) commit(withLut(color, lut), `LUT added: ${lut.title}.`);
              })
            }
          >
            {color.lut ? "Change LUT" : "Import LUT"}
          </Button>
          {color.lut && (
            <Button
              icon="delete"
              onClick={() => commit({ ...color, lut: undefined, lutLook: undefined }, "LUT removed.")}
            >
              Remove LUT
            </Button>
          )}
        </div>
      </SmartCard>
    </>
  );
}
