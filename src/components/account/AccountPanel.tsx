import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { API_URL } from "../../lib/config";
import { useCredits } from "../../lib/credits";
import { UsageHistory } from "../credits/UsageHistory";
import { useEntitlements } from "../../lib/entitlements";
import { timeAgo } from "../../lib/persist";
import { Button } from "../ui";
import { Dialog } from "./Dialog";
import { ProBadge } from "./ProBadge";

interface Device {
  name: string | null;
  platform: string | null;
  lastSeenAt: number;
  current: boolean;
}

const dateFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" });

/** Account summary and actions. Used in the account dialog and in Settings. */
export function AccountDetails() {
  const { ent, configured, signingIn, error, signIn, cancelSignIn, signOut, openUpgrade, openServerPage } =
    useEntitlements();
  const credits = useCredits();
  const [devices, setDevices] = useState<Device[] | null>(null);

  useEffect(() => {
    if (!configured || !ent.signedIn) return;
    invoke<{ devices: Device[] }>("list_devices", { api: API_URL })
      .then((r) => setDevices(r.devices))
      .catch(() => setDevices(null));
  }, [configured, ent.signedIn]);

  if (!configured) {
    return (
      <div className="acct-section">
        <p className="acct-lead">Sign-in isn't set up yet.</p>
        <p className="acct-muted">
          Everything else works offline on the Free plan. Accounts and Pro are coming soon.
        </p>
      </div>
    );
  }

  if (!ent.signedIn) {
    return (
      <div className="acct-section">
        <p className="acct-lead">You're using Verso Free.</p>
        <p className="acct-muted">
          Sign in to use Pro on this computer. We'll open your browser so you can sign in safely.
        </p>
        {error && <p className="acct-error">{error}</p>}
        <div className="acct-actions">
          {signingIn ? (
            <>
              <span className="acct-muted">Waiting for your browser…</span>
              <Button variant="ghost" onClick={cancelSignIn}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button onClick={signIn}>Sign in</Button>
              <Button variant="ghost" onClick={() => openUpgrade()}>
                See what Pro adds
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  const pro = ent.plan === "pro";
  const maxDevices = ent.limits.max_devices;
  return (
    <div className="acct-section">
      <div className="acct-row">
        <span className="acct-avatar acct-avatar--lg">{(ent.email ?? "?").charAt(0).toUpperCase()}</span>
        <div>
          <p className="acct-lead">{ent.email ?? "Signed in"}</p>
          <p className="acct-muted">
            {pro ? "Verso Pro" : "Verso Free"} {pro && <ProBadge title="You're on Verso Pro" />}
          </p>
        </div>
      </div>
      {ent.offlineUntil && (
        <p className="acct-muted">Works offline until {dateFmt.format(new Date(ent.offlineUntil))}.</p>
      )}
      {error && <p className="acct-error">{error}</p>}

      <h3 className="acct-subtitle">AI credits</h3>
      {credits.balance && (
        <p className="acct-muted">
          {Math.max(0, credits.balance.total)} credits
          {credits.balance.resetsAt &&
            ` · monthly credits refill ${dateFmt.format(new Date(credits.balance.resetsAt))}`}
          {credits.balance.offline && " · offline"}
        </p>
      )}
      <UsageHistory />

      <h3 className="acct-subtitle">
        Devices{maxDevices > 0 && devices ? ` (${devices.length} of ${maxDevices})` : ""}
      </h3>
      {devices ? (
        <ul className="acct-devices">
          {devices.map((d, i) => (
            <li key={i}>
              <span>
                {d.name ?? "Unnamed computer"}
                {d.current && <span className="acct-muted"> · this computer</span>}
              </span>
              <span className="acct-muted">{timeAgo(d.lastSeenAt)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="acct-muted">Your devices show up here when you're online.</p>
      )}

      <div className="acct-actions">
        {!pro && <Button onClick={() => openUpgrade()}>Upgrade to Pro</Button>}
        {credits.configured && (
          <Button variant="ghost" onClick={credits.openBuy}>
            Get more credits
          </Button>
        )}
        <Button variant={pro ? "secondary" : "ghost"} onClick={() => openServerPage("/account")}>
          Manage subscription
        </Button>
        <Button variant="ghost" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </div>
  );
}

/** Modal opened from the account button. Rendered by <AccountHost />. */
export function AccountPanel({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="Your account" onClose={onClose}>
      <AccountDetails />
    </Dialog>
  );
}
