import { useCredits } from "../../lib/credits";
import type { OneTapAction } from "../../lib/oneTap";
import type { Project } from "../../lib/project";

/** Small credit price on AI actions. Free actions (and builds without credits) show nothing. */
export function CostChip({ action, project }: { action: OneTapAction; project: Project }) {
  const { estimate } = useCredits();
  if (!action.aiCost) return null;
  const cost = estimate(action.aiCost, action.costUnits?.(project) ?? 1);
  if (cost <= 0) return null;
  return (
    <span className="cost-chip" data-tip={`Uses about ${cost} ${cost === 1 ? "credit" : "credits"}`}>
      {cost}
    </span>
  );
}
