import { useEffect } from "react";
import { useEntitlements } from "../../lib/entitlements";
import { Button } from "../ui";
import { Dialog } from "./Dialog";

const ROWS: [string, string, string][] = [
  ["Export quality", "Up to 1080p", "Up to 4K"],
  ["Watermark", "Small Verso mark", "No watermark"],
  ["Auto clips", "10 a month", "Unlimited"],
  ["Caption styles", "The basics", "Every style"],
  ["Templates", "The basics", "Every template"],
  ["Computers", "1", "Up to 3"],
];

/**
 * Free vs Pro in plain words. "Upgrade to Pro" opens the pricing page in the browser;
 * the plan is re-checked when the user comes back to the window.
 */
export function UpgradeDialog({ reason, onClose }: { reason?: string | null; onClose: () => void }) {
  const { ent, configured, refresh, openServerPage } = useEntitlements();
  const pro = ent.plan === "pro";

  useEffect(() => {
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  return (
    <Dialog title={pro ? "You're on Pro" : "Get more with Verso Pro"} onClose={onClose} wide>
      {reason && !pro && <p className="acct-lead">{reason}</p>}
      {pro && <p className="acct-lead">Thanks for supporting Verso. Every Pro feature is unlocked.</p>}
      <table className="plan-table">
        <thead>
          <tr>
            <th />
            <th>Free</th>
            <th>Pro</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([label, free, proText]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{free}</td>
              <td className="plan-table__pro">{proText}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="acct-actions acct-actions--end">
        {pro ? (
          <Button onClick={onClose}>Done</Button>
        ) : configured ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Not now
            </Button>
            <Button variant="primary" onClick={() => openServerPage("/pricing")}>
              Upgrade to Pro
            </Button>
          </>
        ) : (
          <>
            <span className="acct-muted">Sign-in isn't set up yet, so upgrades aren't available.</span>
            <Button onClick={onClose}>Close</Button>
          </>
        )}
      </div>
      {!pro && configured && (
        <p className="acct-muted acct-note">
          We'll open your browser to finish. Come back here when you're done and Pro switches on.
        </p>
      )}
    </Dialog>
  );
}
