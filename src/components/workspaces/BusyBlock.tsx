import { Button } from "../ui";
import type { OneTapRunner } from "./useOneTapRunner";

/**
 * Covers the editor while a one-tap edit runs, so nothing changes under it.
 * aria-modal also pauses the editor's keyboard shortcuts. Shows after a short
 * delay (CSS) so instant edits don't flash.
 */
export function BusyBlock({ runner }: { runner: OneTapRunner }) {
  if (!runner.busy) return null;
  return (
    <div className="busy-block" role="dialog" aria-modal="true" aria-label="Working">
      <div className="busy-block__card" role="status">
        <span className="busy-block__spinner" aria-hidden="true" />
        <span className="busy-block__text">{runner.step ?? "Working…"}</span>
        <Button variant="ghost" onClick={runner.cancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
