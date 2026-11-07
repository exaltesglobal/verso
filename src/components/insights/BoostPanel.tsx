import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useCharged } from "../../lib/credits";
import { Icon } from "../Icon";
import { Button } from "../ui";
import { MoreSettings } from "../MoreSettings";
import { useWaveform } from "../../lib/waveform";
import {
  applyColdOpen,
  applyHookTitle,
  hookIdeas,
  predictWatchTime,
  type Check,
  type HookIdea,
} from "../../lib/insights";
import type { Project } from "../../lib/project";

interface BoostPanelProps {
  project: Project;
  onApply: (next: Project, message: string) => void;
  /** Opens the tool that fixes a check (captions tab, Magic tab…). */
  onFix: (fix: NonNullable<Check["fix"]>) => void;
}

/** Hook ideas and a watch-time score with plain-language reasons. */
export function BoostPanel({ project, onApply, onFix }: BoostPanelProps) {
  const sound = project.tracks.find((t) => t.kind === "audio")?.clips.find((c) => c.source)?.source;
  const peaks = useWaveform(sound);
  const report = useMemo(() => predictWatchTime(project, peaks.length ? peaks : undefined), [project, peaks]);
  const [seed, setSeed] = useState(0);
  const charge = useCharged();
  // One watch-time check per time the tab is opened; null while charging, string when it couldn't.
  const [scoreError, setScoreError] = useState<string | null | undefined>(null);
  useEffect(() => {
    let alive = true;
    charge("watch_time_predictor", 1, async () => {})
      .then(() => alive && setScoreError(undefined))
      .catch((e) => alive && setScoreError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, [charge]);
  const newIdeas = () =>
    void charge("hook_generator", 1, async () => setSeed((s) => s + 1)).catch((e) =>
      setScoreError(e instanceof Error ? e.message : String(e)),
    );
  // `seed` lets people ask for fresh ideas after editing.
  const ideas = useMemo(() => hookIdeas(project), [project, seed]); // eslint-disable-line react-hooks/exhaustive-deps

  const hook = (h: HookIdea) => (
    <li key={h.id} className="hook">
      <span className="hook__title">{h.title}</span>
      <span className="hook__why">{h.why}</span>
      <span className="hook__actions">
        <Button
          onClick={() => onApply(applyHookTitle(project, h.title), "Title added to the first 3 seconds.")}
        >
          Use as title
        </Button>
        {h.coldOpen && (
          <Button
            icon="split"
            onClick={() =>
              onApply(applyColdOpen(project, h.coldOpen!), "Your reel now opens on its strongest line.")
            }
          >
            Open on this line
          </Button>
        )}
      </span>
    </li>
  );

  const tone = report.score >= 75 ? "good" : report.score >= 50 ? "ok" : "low";

  return (
    <div className="panel__body">
      <div className="panel__head">
        <h2 className="panel__title">
          <Icon name="auto-reel" size={20} />
          Boost
        </h2>
        <p className="panel__lede">
          See how well this reel holds attention, and get ideas for a stronger start.
        </p>
      </div>

      {scoreError && <p className="form-error">{scoreError}</p>}
      {scoreError === undefined && (
        <section className={`watch-score watch-score--${tone}`} aria-label="Watch-time score">
          <div className="watch-score__ring" style={{ "--p": `${report.score}%` } as CSSProperties}>
            <span>{report.score}</span>
          </div>
          <div>
            <strong>
              {tone === "good" ? "Looking strong" : tone === "ok" ? "Almost there" : "Needs a stronger hook"}
            </strong>
            <p className="muted small">
              We think viewers will watch about {report.predictedWatchPercent}% of it. This is an estimate
              from what usually works, not a promise.
            </p>
          </div>
        </section>
      )}

      <ul className="checks">
        {report.checks.map((c) => (
          <li key={c.id} className={c.ok ? "check is-ok" : "check"}>
            <span className="check__dot" aria-hidden="true" />
            <span className="check__text">
              <span className="check__label">{c.label}</span>
              <span className="check__detail">{c.detail}</span>
            </span>
            {!c.ok && c.fix && (
              <button type="button" className="btn btn--ghost check__fix" onClick={() => onFix(c.fix!)}>
                <span>Fix</span>
              </button>
            )}
          </li>
        ))}
      </ul>

      <h3 className="section-label">Hook ideas</h3>
      <ul className="hooks">{ideas.slice(0, 3).map(hook)}</ul>
      <MoreSettings label="More hook ideas">
        {ideas.length > 3 && <ul className="hooks">{ideas.slice(3).map(hook)}</ul>}
        <button type="button" className="btn btn--ghost" onClick={newIdeas}>
          <span>New ideas</span>
        </button>
      </MoreSettings>
    </div>
  );
}
