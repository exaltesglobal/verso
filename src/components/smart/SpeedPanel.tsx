import { useState } from "react";
import { Button, Segmented } from "../ui";
import { findClip, type Project } from "../../lib/project";
import { RAMP_PRESETS, applySpeedRamp, freezeFrame, rampTimeFactor, sourceSpan } from "../../lib/speed";
import { SmartCard } from "./parts";
import { MoreSettings } from "../MoreSettings";

export interface SpeedPanelProps {
  project: Project;
  /** The selected clip; ramps and freeze frames work on video clips. */
  clipId?: string;
  /** Playhead, in timeline seconds. */
  time: number;
  onApply: (next: Project, message: string) => void;
}

const HOLD = ["1 s", "2 s", "3 s"] as const;

/** Speed ramps and freeze frames for the selected video clip. */
export function SpeedPanel({ project, clipId, time, onApply }: SpeedPanelProps) {
  const clip = clipId ? findClip(project, clipId) : undefined;
  const video = clip?.kind === "video" && clip.source?.hasVideo ? clip : undefined;
  const [hold, setHold] = useState<(typeof HOLD)[number]>("2 s");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  if (!video) {
    return (
      <SmartCard icon="speed" title="Speed" lede="Speed up, slow down, or freeze a moment.">
        <p className="smart-note">Pick a video clip on the timeline to change its speed.</p>
      </SmartCard>
    );
  }

  const active = RAMP_PRESETS.find((p) => JSON.stringify(p.keys) === JSON.stringify(video.speedRamp))?.id;
  const span = sourceSpan(video);
  const canFreeze = time >= video.start && time <= video.end;

  const freeze = async () => {
    setError(undefined);
    setBusy(true);
    try {
      const seconds = parseFloat(hold);
      onApply(await freezeFrame(project, video.id, time, seconds), `Froze the picture for ${seconds} s.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SmartCard
        icon="speed"
        title="Speed ramp"
        lede="Change speed smoothly inside the clip. Sound follows along."
      >
        <div className="ramp-grid" role="radiogroup" aria-label="Speed ramp">
          {[
            { id: "", label: "Normal", hint: "Same speed all the way", keys: undefined },
            ...RAMP_PRESETS,
          ].map((p) => {
            const on = (active ?? (video.speedRamp?.length ? "custom" : "")) === p.id;
            const length = span * rampTimeFactor(p.keys ?? []);
            return (
              <button
                key={p.id || "normal"}
                type="button"
                role="radio"
                aria-checked={on}
                className={on ? "ramp-grid__item is-active" : "ramp-grid__item"}
                onClick={() =>
                  onApply(
                    applySpeedRamp(project, video.id, p.keys),
                    p.keys
                      ? `${p.label} added. The clip is now ${length.toFixed(1)} s.`
                      : "Back to normal speed.",
                  )
                }
              >
                <span className="ramp-grid__label">{p.label}</span>
                <span className="ramp-grid__hint">{p.hint}</span>
                <span className="ramp-grid__len">{length.toFixed(1)} s</span>
              </button>
            );
          })}
        </div>
      </SmartCard>

      <SmartCard icon="pause" title="Freeze frame" lede="Hold the picture at the playhead, then carry on.">
        {!canFreeze && <p className="smart-note">Move the playhead over this clip first.</p>}
        {error && <p className="smart-note smart-note--error">{error}</p>}
        <div className="smart-actions">
          <Button icon="pause" onClick={() => void freeze()} disabled={busy || !canFreeze}>
            {busy ? "Grabbing the frame…" : "Freeze frame at playhead"}
          </Button>
        </div>
        <MoreSettings>
          <Segmented label="How long" options={HOLD} value={hold} onChange={setHold} />
        </MoreSettings>
      </SmartCard>
    </>
  );
}
