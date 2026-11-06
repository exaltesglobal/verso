import { useEntitlements } from "../../lib/entitlements";
import { Button } from "../ui";
import { Icon } from "../Icon";
import { ProBadge } from "./ProBadge";

/** Editor top bar / Welcome header: avatar initial when signed in, otherwise a "Sign in" ghost button. */
export function AccountButton() {
  const { ent, signingIn, signIn, openAccount } = useEntitlements();

  if (!ent.signedIn) {
    return (
      <Button variant="ghost" onClick={signingIn ? openAccount : signIn}>
        {signingIn ? "Finish in your browser…" : "Sign in"}
      </Button>
    );
  }

  // No email yet (offline sign-in): a person glyph, never a lone "?" that reads as Help.
  const initial = ent.email?.trim().charAt(0).toUpperCase();
  return (
    <button
      type="button"
      className="acct-btn"
      onClick={openAccount}
      data-tip={ent.email ?? "Your account"}
      aria-label="Your account"
    >
      <span className="acct-avatar">{initial || <Icon name="user" size={16} />}</span>
      {ent.plan === "pro" && <ProBadge title="You're on Verso Pro" />}
    </button>
  );
}
