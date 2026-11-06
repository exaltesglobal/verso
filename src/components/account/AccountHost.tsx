import { useEffect, useState } from "react";
import { accountsConfigured } from "../../lib/config";
import { discardCrashReports, pendingCrashReports, sendCrashReports } from "../../lib/crash";
import { useEntitlements } from "../../lib/entitlements";
import { useSettings } from "../../lib/settings";
import { checkForUpdates, installUpdate } from "../../lib/updates";
import { Button } from "../ui";
import { AccountPanel } from "./AccountPanel";
import { UpgradeDialog } from "./UpgradeDialog";

/**
 * App-wide account UI, mounted once in main.tsx: the account and upgrade dialogs
 * (opened via useEntitlements()), the crash report prompt and the update prompt.
 */
export function AccountHost() {
  const { accountOpen, closeAccount, upgradeReason, closeUpgrade } = useEntitlements();
  return (
    <>
      {accountOpen && <AccountPanel onClose={closeAccount} />}
      {upgradeReason !== undefined && <UpgradeDialog reason={upgradeReason} onClose={closeUpgrade} />}
      <CrashPrompt />
      <UpdatePrompt />
    </>
  );
}

function CrashPrompt() {
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!accountsConfigured) return; // nowhere to send them yet; keep them for later
    pendingCrashReports()
      .then(setCount)
      .catch(() => {});
  }, []);

  if (!count) return null;
  const send = async () => {
    setBusy(true);
    try {
      await sendCrashReports();
      setCount(0);
    } catch (e) {
      setNote(String(e));
      setBusy(false);
    }
  };
  return (
    <div className="acct-card" role="alertdialog" aria-labelledby="crash-title">
      <p id="crash-title" className="acct-lead">
        Verso closed unexpectedly last time. Send a report to help us fix it?
      </p>
      <p className="acct-muted">
        It includes the app version, your system type and where the error happened. No files or personal info.
      </p>
      {note && <p className="acct-error">{note}</p>}
      <div className="acct-actions acct-actions--end">
        <Button
          variant="ghost"
          onClick={() => discardCrashReports().finally(() => setCount(0))}
          disabled={busy}
        >
          Don't send
        </Button>
        <Button onClick={send} disabled={busy}>
          {busy ? "Sending…" : "Send report"}
        </Button>
      </div>
    </div>
  );
}

function UpdatePrompt() {
  const { autoUpdate } = useSettings();
  const [version, setVersion] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!autoUpdate || import.meta.env.DEV) return;
    const t = window.setTimeout(() => {
      checkForUpdates()
        .then((u) => setVersion(u.version))
        .catch(() => {
          /* offline or updates not set up: try again next launch */
        });
    }, 5000);
    return () => window.clearTimeout(t);
  }, [autoUpdate]);

  if (!version) return null;
  return (
    <div className="acct-card acct-card--update" role="status">
      <p className="acct-lead">A new version of Verso is ready. Restart to update.</p>
      <p className="acct-muted">Version {version}. Save your work first.</p>
      {error && <p className="acct-error">{error}</p>}
      <div className="acct-actions acct-actions--end">
        <Button variant="ghost" onClick={() => setVersion(null)} disabled={installing}>
          Later
        </Button>
        <Button
          onClick={() => {
            setInstalling(true);
            installUpdate().catch((e) => {
              setError(String(e));
              setInstalling(false);
            });
          }}
          disabled={installing}
        >
          {installing ? "Updating…" : "Restart to update"}
        </Button>
      </div>
    </div>
  );
}
