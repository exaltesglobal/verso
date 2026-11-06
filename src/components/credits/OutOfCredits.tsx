import { useCredits } from "../../lib/credits";
import { useEntitlements } from "../../lib/entitlements";
import { Button } from "../ui";

/** "Not enough credits" with Upgrade / Get more. Inline in a panel, or inside the dialog from <CreditsHost />. */
export function OutOfCredits({ message, onDone }: { message?: string; onDone?: () => void }) {
  const { openBuy, balance } = useCredits();
  const { ent, openUpgrade } = useEntitlements();
  const resets = balance?.resetsAt ? new Date(balance.resetsAt) : null;
  return (
    <div className="out-of-credits" role="alert">
      <p className="acct-lead">{message ?? "You're out of credits for now."}</p>
      {resets && (
        <p className="acct-muted">
          Your monthly credits refill on{" "}
          {resets.toLocaleDateString(undefined, { day: "numeric", month: "short" })}.
        </p>
      )}
      <div className="acct-actions">
        {ent.plan !== "pro" && (
          <Button
            variant="ghost"
            onClick={() => {
              onDone?.();
              openUpgrade("Pro gives you many more AI credits every month.");
            }}
          >
            Upgrade to Pro
          </Button>
        )}
        <Button
          variant="primary"
          onClick={() => {
            onDone?.();
            openBuy();
          }}
        >
          Get more credits
        </Button>
      </div>
    </div>
  );
}
