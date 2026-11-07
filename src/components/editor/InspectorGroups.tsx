import { useEffect, useState, type ReactNode } from "react";
import { listen } from "@tauri-apps/api/event";
import { Icon, type IconName } from "../Icon";
import { useFilmstrip, frameAt } from "../../lib/filmstrip";
import { colorFilter, colorWashStyle } from "../../lib/color";
import { LOOK_PICKS, lookColor } from "../../lib/looks";
import { CreditsError, useCharged, useCredits } from "../../lib/credits";
import {
  applyEnhanced,
  clearEnhanced,
  enhanceAudio,
  soundClipFor,
  ENHANCE_PROGRESS_EVENT,
  type EnhanceProgress,
} from "../../lib/enhance";
import type { Clip, Project } from "../../lib/project";

/** Spec 1.2: an always-open group with an icon title; the hairline is its bottom edge. */
export function Group({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <section className="grp">
      <h3 className="grp__t">
        <Icon name={icon} size={20} />
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Look swatches: the clip's own frame through the same grade the preview and export use (spec 1.5). */
export function LookGroup({
  clip,
  time,
  onChange,
}: {
  clip: Clip;
  time: number;
  onChange: (p: Partial<Clip>) => void;
}) {
  const frames = useFilmstrip(clip.source);
  const src = clip.source
    ? frameAt(frames, clip.source.durationSec, (clip.inPoint ?? 0) + Math.max(0, time - clip.start))
    : undefined;
  const current = clip.color?.preset;
  return (
    <Group icon="filters" title="Look">
      <div className="look-picks" role="radiogroup" aria-label="Look">
        {LOOK_PICKS.map((l) => {
          const color = l.id ? lookColor(l.id) : undefined;
          const selected = l.id ? current === color?.preset : !current;
          return (
            <button
              key={l.label}
              type="button"
              role="radio"
              aria-checked={selected}
              className={selected ? "look-pick is-selected" : "look-pick"}
              onClick={() => onChange({ color })}
            >
              <span className="look-pick__sw">
                {src && <img src={src} alt="" style={{ filter: colorFilter(color) }} draggable={false} />}
                {color && <span style={colorWashStyle(color)} />}
              </span>
              {l.label}
            </button>
          );
        })}
      </div>
    </Group>
  );
}

const SPEEDS = [0.5, 1, 1.5, 2];
const NEEDLE = [-95, -45, 5, 50];

/** A gauge whose needle turns further per step. */
function Gauge({ angle }: { angle: number }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="vs-icon">
      <path
        d="M2.5 11.5a6 6 0 1 1 11 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M8 9.5V5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        transform={`rotate(${angle} 8 9.5)`}
      />
      <circle cx="8" cy="9.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function SpeedGroup({ clip, onChange }: { clip: Clip; onChange: (p: Partial<Clip>) => void }) {
  const speed = clip.speedRamp ? null : (clip.speed ?? 1);
  return (
    <Group icon="speed" title="Speed">
      <div className="chips" role="radiogroup" aria-label="Speed">
        {SPEEDS.map((s, i) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={speed === s}
            className={speed === s ? "chip is-selected" : "chip"}
            onClick={() => onChange({ speed: s, speedRamp: undefined })}
          >
            <Gauge angle={NEEDLE[i]} />
            {s}x
          </button>
        ))}
      </div>
    </Group>
  );
}

/** Voice: one toggle for clean-up (AI, credits) and Louder / Normal. */
export function VoiceGroup({
  project,
  clip,
  onChange,
  onApply,
}: {
  project: Project;
  clip: Clip;
  onChange: (p: Partial<Clip>) => void;
  onApply: (next: Project, message: string) => void;
}) {
  const sound = soundClipFor(project, clip.id);
  const charge = useCharged();
  const { showOutOfCredits } = useCredits();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const on = !!sound?.audioOverride;
  const louder = (clip.volume ?? 1) > 1;

  useEffect(() => {
    let alive = true;
    let stop: (() => void) | undefined;
    void listen<EnhanceProgress>(ENHANCE_PROGRESS_EVENT, (e) => setProgress(e.payload.percent)).then((un) =>
      alive ? (stop = un) : un(),
    );
    return () => {
      alive = false;
      stop?.();
    };
  }, []);

  const toggle = async () => {
    if (!sound) return;
    setError(null);
    if (on) return onApply(clearEnhanced(project, sound.id), "Playing the original sound.");
    setProgress(0);
    try {
      const r = await charge("enhance_audio", (sound.end - sound.start) / 60, () =>
        enhanceAudio(sound, "Normal"),
      );
      onApply(applyEnhanced(project, sound.id, r.outputPath), "Voice cleaned up.");
    } catch (e) {
      if (e instanceof CreditsError && e.code === "insufficient") showOutOfCredits(e.message);
      else setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProgress(null);
    }
  };

  const outcome =
    progress !== null
      ? `Cleaning… ${Math.round(progress)}%`
      : error
        ? "Didn't work, try again"
        : on
          ? "Noise and echo removed"
          : "Off";

  return (
    <Group icon="voiceover" title="Voice">
      <div className="trow">
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Clean up voice"
          className={on ? "toggle is-on" : "toggle"}
          disabled={!sound || progress !== null}
          onClick={() => void toggle()}
        >
          <span className="toggle__knob" />
        </button>
        <span className="trow__l">Clean up voice</span>
        <span className="trow__h" data-tip={error ?? undefined}>
          {sound ? outcome : "No sound in this clip"}
        </span>
      </div>
      <div className="chips" role="radiogroup" aria-label="Loudness">
        {(
          [
            ["Louder", 1.5, "volume"],
            ["Normal", 1, "volume"],
          ] as const
        ).map(([label, v, icon]) => {
          const selected = label === "Louder" ? louder : !louder;
          return (
            <button
              key={label}
              type="button"
              role="radio"
              aria-checked={selected}
              className={selected ? "chip is-selected" : "chip"}
              onClick={() => onChange({ volume: v })}
            >
              <Icon name={icon} size={16} />
              {label}
            </button>
          );
        })}
      </div>
    </Group>
  );
}
