import { useLayoutEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import { ContextMenu } from "../ContextMenu";
import { MAKE_IT_BETTER, oneTap } from "../../lib/oneTap";
import type { Project } from "../../lib/project";
import { CostChip } from "./CostChip";
import type { OneTapRunner } from "./useOneTapRunner";

const ACTIONS = MAKE_IT_BETTER.map(oneTap);
/** Room kept for the "More" chip when not every action fits. */
const MORE_W = 84;
const GAP = 8;

/**
 * The "Make it better" row at the top of Quick: one tap each, one undo step
 * each. It stays on one line; actions that don't fit go into a "More" menu.
 */
export function MakeItBetter({ project, runner }: { project: Project; runner: OneTapRunner }) {
  const row = useRef<HTMLDivElement>(null);
  /** Chip widths measured once, while every chip is on screen. */
  const widths = useRef<number[]>([]);
  const [fit, setFit] = useState(ACTIONS.length);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    const el = row.current;
    if (!el) return;
    const measure = () => {
      if (!widths.current.length)
        widths.current = [...el.querySelectorAll<HTMLElement>(".one-tap-chip")].map((c) => c.offsetWidth);
      const avail = el.clientWidth;
      const all = widths.current.reduce((s, w) => s + w + GAP, -GAP);
      if (all <= avail) return setFit(ACTIONS.length);
      let used = 0;
      let n = 0;
      for (const w of widths.current) {
        if (used + w + GAP + MORE_W > avail) break;
        used += w + GAP;
        n++;
      }
      setFit(n);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const shown = ACTIONS.slice(0, fit);
  const rest = ACTIONS.slice(fit);

  return (
    <div className="make-better" role="toolbar" aria-label="Make it better">
      <span className="make-better__label">Make it better</span>
      <div className="make-better__row" ref={row}>
        {shown.map((a) => {
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
        {rest.length > 0 && (
          <button
            type="button"
            className="one-tap-chip one-tap-chip--more"
            aria-haspopup="menu"
            aria-expanded={!!menu}
            data-tip={`${rest.length} more one-tap edits`}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setMenu(menu ? null : { x: r.right - 220, y: r.bottom + 4 });
            }}
          >
            More
            <Icon name="chevron-down" size={16} />
          </button>
        )}
      </div>
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          items={rest.map((a) => ({
            label: a.label,
            icon: a.icon,
            disabled: !!a.blocked(project) || !!runner.busy,
            onSelect: () => void runner.run(a),
          }))}
        />
      )}
    </div>
  );
}
