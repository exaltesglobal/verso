import { useState } from "react";
import { Toggle } from "../ui";
import { updateClip, type Clip, type Project } from "../../lib/project";
import { beatMarkers, detectBeats, snapCutsToBeats } from "../../lib/smart";
import { useAnalysisProgress } from "./hooks";
import { LevelSlider, Listening } from "./parts";

interface CutToBeatToggleProps {
  project: Project;
  /** A music clip with a file. */
  clip: Clip;
  onApply: (next: Project, message: string) => void;
}

/**
 * "Cut to the beat" for one music clip: finds its beats, moves video cuts onto
 * them and turns on beat markers. Mount it in the music section of the Inspector.
 */
export function CutToBeatToggle({ project, clip, onApply }: CutToBeatToggleProps) {
  const [strength, setStrength] = useState(0.6);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [percent, setPercent] = useAnalysisProgress("beats");
  const on = !!clip.beatSync;

  const snap = async (s: number) => {
    if (!clip.source) return;
    setBusy(true);
    setError(undefined);
    setPercent(0);
    try {
      const info = await detectBeats(clip.source);
      if (!info.beats.length) {
        setError("We couldn't hear a steady beat in this music.");
        return;
      }
      const snapped = snapCutsToBeats(project, beatMarkers(clip, info.beats), s);
      onApply(
        updateClip(snapped, clip.id, { beatSync: true }),
        `Cuts now land on the beat (${Math.round(info.bpm)} BPM).`,
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="beat-sync">
      <div className="beat-sync__row">
        <span className="beat-sync__label">Cut to the beat</span>
        <Toggle
          checked={on}
          label="Cut to the beat"
          onChange={(v) =>
            v
              ? void snap(strength)
              : onApply(
                  updateClip(project, clip.id, { beatSync: false }),
                  "Beat markers are off. Your cuts stay where they are; undo to move them back.",
                )
          }
        />
      </div>
      {busy && <Listening percent={percent} />}
      {on && !busy && (
        <LevelSlider
          label="How far a cut can move"
          low="A little"
          high="A lot"
          value={strength}
          onChange={setStrength}
          onCommit={() => void snap(strength)}
        />
      )}
      {error && <p className="smart-note smart-note--error">{error}</p>}
    </div>
  );
}
