import { Icon } from "../Icon";
import { MAKE_IT_BETTER, oneTap } from "../../lib/oneTap";
import type { Project } from "../../lib/project";
import { CostChip } from "./CostChip";
import type { OneTapRunner } from "./useOneTapRunner";

/** The "Make it better" row at the top of Quick: one tap each, one undo step each. */
export function MakeItBetter({ project, runner }: { project: Project; runner: OneTapRunner }) {
  return (
    <div className="make-better" role="toolbar" aria-label="Make it better">
      <span className="make-better__label">Make it better</span>
      <div className="make-better__row">
        {MAKE_IT_BETTER.map(oneTap).map((a) => {
          const why = a.blocked(project);
          const busy = runner.busy === a.id;
          return (
            <button
              key={a.id}
              type="button"
              className={busy ? "one-tap-chip is-busy" : "one-tap-chip"}
              aria-disabled={!!why || !!runner.busy}
              data-tip={why ?? a.hint}
              onClick={() => !runner.busy && void runner.run(a)}
            >
              <Icon name={a.icon} size={16} />
              <span>{busy ? "Working…" : a.label}</span>
              <CostChip action={a} project={project} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
