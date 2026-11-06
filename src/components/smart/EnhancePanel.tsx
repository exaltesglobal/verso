import { useEffect, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Button, Segmented } from "../ui";
import { clipsAt, type Project } from "../../lib/project";
import {
  ENHANCE_PROGRESS_EVENT,
  applyEnhanced,
  clearEnhanced,
  enhanceAudio,
  soundClipFor,
  soundSource,
  type EnhanceProgress,
  type EnhanceStrength,
} from "../../lib/enhance";
import { Listening, SmartCard } from "./parts";
import { useCharged } from "../../lib/credits";
import { playbackRateAt, sourceTimeAt } from "../../lib/speed";

export interface EnhancePanelProps {
  project: Project;
  /** The selected clip (video or sound). */
  clipId?: string;
  onApply: (next: Project, message: string) => void;
}

const STAGE: Record<EnhanceProgress["stage"], string> = {
  download: "Getting the voice cleaner…",
  measure: "Listening…",
  clean: "Cleaning up…",
};

/** "Clean up voice": removes background noise, evens out the voice, sets social loudness. */
export function EnhancePanel({ project, clipId, onApply }: EnhancePanelProps) {
  const sound = clipId ? soundClipFor(project, clipId) : undefined;
  const [strength, setStrength] = useState<EnhanceStrength>("Normal");
  const [progress, setProgress] = useState<EnhanceProgress | null>(null);
  const [error, setError] = useState<string>();
  // Last cleaned file per sound clip, so "After" can come back without re-rendering.
  const [cleaned, setCleaned] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    let stop: (() => void) | undefined;
    void listen<EnhanceProgress>(ENHANCE_PROGRESS_EVENT, (e) => setProgress(e.payload)).then((un) =>
      alive ? (stop = un) : un(),
    );
    return () => {
      alive = false;
      stop?.();
    };
  }, []);

  const busy = progress !== null;
  const charge = useCharged();
  const run = async () => {
    if (!sound) return;
    setError(undefined);
    setProgress({ percent: 0, stage: "measure" });
    try {
      const r = await charge("enhance_audio", (sound.end - sound.start) / 60, () =>
        enhanceAudio(sound, strength),
      );
      setCleaned((m) => ({ ...m, [sound.id]: r.outputPath }));
      onApply(
        applyEnhanced(project, sound.id, r.outputPath),
        r.usedVoiceModel
          ? "Voice cleaned up."
          : "Voice cleaned up with the basic cleaner. Connect to the internet for the better one.",
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setProgress(null);
    }
  };

  const after = Boolean(sound?.audioOverride);
  const restorable = sound && (sound.audioOverride?.path ?? cleaned[sound.id]);

  return (
    <SmartCard
      icon="voiceover"
      title="Clean up voice"
      lede="Removes background noise and makes your voice clear and loud enough for social."
    >
      {!sound ? (
        <p className="smart-note">Pick a clip with sound to use this.</p>
      ) : (
        <>
          <Segmented
            label="Strength"
            options={["Light", "Normal", "Strong"] as const}
            value={strength}
            onChange={setStrength}
          />
          {busy && <Listening percent={progress.percent} label={STAGE[progress.stage]} />}
          {error && <p className="smart-note smart-note--error">{error}</p>}
          <div className="smart-actions enhance-actions">
            <Button icon="voiceover" onClick={() => void run()} disabled={busy}>
              {after ? "Clean up again" : "Clean up voice"}
            </Button>
            {restorable && (
              <Segmented
                label="Compare"
                options={["Before", "After"] as const}
                value={after ? "After" : "Before"}
                onChange={(v) =>
                  v === "Before"
                    ? onApply(clearEnhanced(project, sound.id), "Playing the original sound.")
                    : onApply(applyEnhanced(project, sound.id, restorable), "Playing the cleaned-up sound.")
                }
              />
            )}
          </div>
        </>
      )}
    </SmartCard>
  );
}

/**
 * Preview player for cleaned sound: plays the cleaned copy of the Sound clip
 * under the playhead in sync. Mute the <video> while this is active
 * (`hasEnhancedSound` in lib/enhance.ts).
 */
export function EnhancedSound({
  project,
  time,
  playing,
}: {
  project: Project;
  time: number;
  playing: boolean;
}) {
  const clip = clipsAt(project, "audio", time).find((c) => c.audioOverride);
  const found = clip && soundSource(clip);
  // Outside the cleaned range the <video> plays the original sound itself.
  const src = found && found.path === clip.audioOverride?.path ? found : undefined;
  const ref = useRef<HTMLAudioElement>(null);
  const sourceTime = clip && src ? src.inPoint + sourceTimeAt(clip, time) - (clip.inPoint ?? 0) : 0;
  const rate = clip ? playbackRateAt(clip, time) : 1;
  const volume = Math.max(0, Math.min(1, clip?.volume ?? 1));

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    a.volume = volume;
    if (Math.abs(a.playbackRate - rate) > 0.01) a.playbackRate = rate;
    if (playing) {
      if (Math.abs(a.currentTime - sourceTime) > 0.3) a.currentTime = sourceTime;
      if (a.paused) void a.play().catch(() => {});
    } else {
      if (!a.paused) a.pause();
      if (Math.abs(a.currentTime - sourceTime) > 0.05) a.currentTime = sourceTime;
    }
  }, [playing, sourceTime, volume, rate]);

  return src ? <audio key={src.path} ref={ref} src={convertFileSrc(src.path)} preload="auto" /> : null;
}
