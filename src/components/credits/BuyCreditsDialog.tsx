import { useState } from "react";
import { useCredits } from "../../lib/credits";
import { useEntitlements } from "../../lib/entitlements";
import { Dialog } from "../account/Dialog";
import { Button } from "../ui";

const fmt = new Intl.NumberFormat();

/** Packs as cards. Buying opens the hosted checkout in the browser; the balance updates when it's paid. */
export function BuyCreditsDialog({ onClose }: { onClose: () => void }) {
  const { configured, pricing, balance, buy } = useCredits();
  const { ent, signIn, openUpgrade } = useEntitlements();
  const [picked, setPicked] = useState<string | undefined>();
  const [state, setState] = useState<"idle" | "opening" | "waiting">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!configured) {
    return (
      <Dialog title="Credits" onClose={onClose}>
        <p className="acct-lead">Credits aren't set up yet.</p>
        <p className="acct-muted">AI tools work as usual in the meantime.</p>
      </Dialog>
    );
  }

  const pro = ent.plan === "pro";
  const packs = pricing?.packs ?? [];
  const pack = packs.find((p) => p.id === picked) ?? packs[1] ?? packs[0];
  const canBuy = ent.signedIn && pricing?.paymentsConfigured && (pro || pricing.topUpsForFree);

  const go = async () => {
    if (!pack) return;
    setState("opening");
    setError(null);
    try {
      await buy(pack.id);
      setState("waiting");
    } catch (e) {
      setError(String(e));
      setState("idle");
    }
  };

  return (
    <Dialog title="Get more credits" onClose={onClose} wide>
      {balance && (
        <p className="acct-lead">
          You have {fmt.format(Math.max(0, balance.total))} credits
          {balance.allowance !== null && balance.purchased !== null && balance.purchased > 0
            ? ` (${fmt.format(balance.allowance)} monthly, ${fmt.format(balance.purchased)} bought)`
            : ""}
          .
        </p>
      )}
      <p className="acct-muted">
        Credits pay for AI tools like auto-cut, captions and dubbing. Editing and export are always free.
        Credits you buy never expire, and we use your monthly credits first.
      </p>

      {packs.length > 0 ? (
        <div className="credit-packs" role="radiogroup" aria-label="Credit packs">
          {packs.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={p.id === pack?.id}
              className={p.id === pack?.id ? "credit-pack credit-pack--on" : "credit-pack"}
              onClick={() => setPicked(p.id)}
              disabled={!canBuy}
            >
              <span className="credit-pack__credits">{fmt.format(p.credits)}</span>
              <span className="acct-muted">credits</span>
              <span className="credit-pack__price">{p.priceInr}</span>
              {p.priceUsd && <span className="acct-muted">or {p.priceUsd}</span>}
            </button>
          ))}
        </div>
      ) : (
        <p className="acct-muted">We couldn't load the packs. Check your internet connection.</p>
      )}

      {pricing && (
        <p className="acct-muted acct-note">
          {pro
            ? `Pro includes ${fmt.format(pricing.allowances.pro)} credits every month.`
            : `Free includes ${fmt.format(pricing.allowances.free)} credits a month. Pro includes ${fmt.format(pricing.allowances.pro)}.`}
        </p>
      )}
      {error && <p className="acct-error">{error}</p>}
      {state === "waiting" && (
        <p className="acct-muted">
          We opened your browser to finish paying. Your balance updates here as soon as it's done.
        </p>
      )}

      <div className="acct-actions acct-actions--end">
        {!ent.signedIn ? (
          <Button variant="primary" onClick={signIn}>
            Sign in to buy credits
          </Button>
        ) : !pricing?.paymentsConfigured ? (
          <span className="acct-muted">Payments aren't set up yet.</span>
        ) : !canBuy ? (
          <>
            <span className="acct-muted">Top-ups are part of Pro.</span>
            <Button variant="primary" onClick={() => openUpgrade()}>
              Upgrade to Pro
            </Button>
          </>
        ) : (
          <>
            {!pro && (
              <Button variant="ghost" onClick={() => openUpgrade()}>
                See Pro
              </Button>
            )}
            <Button variant="primary" onClick={() => void go()} disabled={!pack || state === "opening"}>
              {pack ? `Buy ${fmt.format(pack.credits)} credits for ${pack.priceInr}` : "Buy credits"}
            </Button>
          </>
        )}
      </div>
    </Dialog>
  );
}
