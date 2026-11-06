import { useCredits, type CreditAction } from "../../lib/credits";
import { Button } from "../ui";

/**
 * Inline cost line before an AI job: "This uses about 12 credits. You have 118."
 * Continue runs the job (the caller spends with useCredits().spend); Get more opens the packs.
 * When credits aren't charged (dev, or accounts not set up) it shows only the Continue button.
 */
export function CostConfirm({
  action,
  units,
  onContinue,
  onCancel,
  continueLabel = "Continue",
  disabled,
}: {
  action: CreditAction;
  /** Minutes of media for per-minute actions, number of runs otherwise. */
  units: number;
  onContinue: () => void;
  onCancel?: () => void;
  continueLabel?: string;
  disabled?: boolean;
}) {
  const { active, balance, estimate, openBuy } = useCredits();
  const cost = estimate(action, units);
  const have = balance ? Math.max(0, balance.total) : null;
  const short = active && have !== null && cost > (balance?.offline ? balance.offlineBuffer : have);

  return (
    <div className="cost-confirm">
      {active && cost > 0 && (
        <p className={short ? "cost-confirm__text cost-confirm__text--short" : "cost-confirm__text"}>
          This uses about {cost} {cost === 1 ? "credit" : "credits"}.{have !== null && ` You have ${have}.`}
          {short && " That's not enough for this one."}
        </p>
      )}
      <div className="cost-confirm__actions">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {short ? (
          <Button onClick={openBuy}>Get more credits</Button>
        ) : (
          <>
            {active && cost > 0 && (
              <Button variant="ghost" onClick={openBuy}>
                Get more
              </Button>
            )}
            <Button onClick={onContinue} disabled={disabled}>
              {continueLabel}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
