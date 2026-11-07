import { useState } from "react";
import { Icon, type IconName } from "../Icon";
import { Button } from "../ui";
import { CostConfirm } from "../credits/CostConfirm";
import { actionsFor, CONTENT_LABEL, doItAllPlan } from "../../lib/oneTap";
import type { Clip, Project, TrackKind } from "../../lib/project";
import { CostChip } from "./CostChip";
import type { OneTapRunner } from "./useOneTapRunner";

const KIND: Record<TrackKind, { label: string; icon: IconName }> = {
  text: { label: "Text", icon: "text" },
  captions: { label: "Caption", icon: "captions" },
  video: { label: "Video clip", icon: "video" },
  audio: { label: "Sound", icon: "voiceover" },
  music: { label: "Music", icon: "music" },
};

/** Quick's right column: "Do it all", then one-tap options for the selected clip. */
export function OneTapPanel({
  project,
  clip,
  runner,
  onChange,
  onDelete,
}: {
  project: Project;
  clip: (Clip & { kind: TrackKind }) | undefined;
  runner: OneTapRunner;
  onChange: (patch: Partial<Clip>) => void;
  onDelete: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const plan = doItAllPlan(project);
  const captions = plan.steps.find((s) => s.aiCost === "captions");
  const minutes = captions?.costUnits?.(project) ?? 0;
  const actions = clip ? actionsFor(clip.kind).slice(0, 4) : [];
  const start = () => {
    setConfirm(false);
    void runner.runAll();
  };

  return (
    <aside className="quick-options" aria-label="Options">
      <div className="panel__head">
        <h2 className="panel__title">
          <Icon name="one-click" size={20} />
          Do it all
        </h2>
        <p className="panel__lede">
          We look at your video and make the usual fixes in one go. One Undo takes it all back.
        </p>
      </div>

      {runner.busy === "all" ? (
        <p className="quick-options__step" role="status">
          {runner.step ?? "Working…"}
        </p>
      ) : confirm ? (
        <div className="quick-options__confirm">
          <p>This looks like {CONTENT_LABEL[plan.kind]}. We'll do:</p>
          <ul className="quick-options__plan">
            {plan.steps.map((s) => (
              <li key={s.id}>
                <Icon name={s.icon} size={16} />
                {s.label}
              </li>
            ))}
          </ul>
          {captions ? (
            <CostConfirm
              action="captions"
              units={minutes}
              onContinue={start}
              onCancel={() => setConfirm(false)}
              continueLabel="Do it all"
            />
          ) : (
            <div className="cost-confirm__actions">
              <Button variant="ghost" onClick={() => setConfirm(false)}>
                Cancel
              </Button>
              <Button onClick={start}>Do it all</Button>
            </div>
          )}
        </div>
      ) : (
        <Button
          icon="one-click"
          size="lg"
          className="btn--block"
          disabled={!plan.steps.length || !!runner.busy}
          data-tip={plan.steps.length ? undefined : "Add a video first, or everything is already done."}
          onClick={() => setConfirm(true)}
        >
          Do it all
        </Button>
      )}

      {runner.summary && (
        <div className="quick-options__summary" role="status">
          <p className="quick-options__summary-title">Done. It looked like {runner.summary.kind}.</p>
          <ul className="quick-options__plan">
            {runner.summary.done.map((d) => (
              <li key={d}>
                <Icon name="check" size={16} />
                {d}
              </li>
            ))}
          </ul>
          {runner.summary.skipped.length > 0 && (
            <p className="quick-options__muted">Skipped: {runner.summary.skipped.join(", ")}.</p>
          )}
          <div className="cost-confirm__actions">
            <Button variant="ghost" onClick={runner.clearSummary}>
              OK
            </Button>
            <Button icon="undo" onClick={runner.undoAll}>
              Undo all
            </Button>
          </div>
        </div>
      )}

      <h3 className="section-label">{clip ? KIND[clip.kind].label : "Selected clip"}</h3>
      {!clip ? (
        <div className="empty empty--panel">
          <Icon name="layers" size={32} />
          <p className="empty__title">Nothing selected</p>
          <p>Tap a clip in the strip under the preview to see what you can do with it.</p>
        </div>
      ) : (
        <div className="quick-options__list">
          {clip.kind === "text" && (
            <textarea
              className="quick-options__text"
              aria-label="Text on screen"
              rows={2}
              value={clip.text ?? ""}
              onChange={(e) => onChange({ text: e.target.value, label: e.target.value })}
            />
          )}
          {actions.map((a) => {
            const why = a.blocked(project);
            return (
              <button
                key={a.id}
                type="button"
                className="quick-choice"
                aria-disabled={!!why || !!runner.busy}
                data-tip={why ?? a.hint}
                onClick={() => !runner.busy && void runner.run(a, clip)}
              >
                <Icon name={a.icon} size={20} />
                <span className="quick-choice__label">{runner.busy === a.id ? "Working…" : a.label}</span>
                <CostChip action={a} project={project} />
              </button>
            );
          })}
          <button type="button" className="quick-choice quick-choice--danger" onClick={onDelete}>
            <Icon name="delete" size={20} />
            <span className="quick-choice__label">Delete clip</span>
          </button>
        </div>
      )}
    </aside>
  );
}
