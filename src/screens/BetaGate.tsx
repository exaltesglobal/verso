import { useState, type FormEvent, type ReactNode } from "react";
import versoMark from "../assets/brand/verso-mark.svg";
import { Button } from "../components/ui";
import { API_URL, BETA_GATE, accountsConfigured } from "../lib/config";

const KEY = "verso.betaInvite";

/**
 * Closed beta gate: asks for an invite code once, then remembers it.
 * Only active when VITE_VERSO_BETA_GATE=true and the accounts API is set.
 */
export function BetaGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(
    () => !BETA_GATE || !accountsConfigured || !!localStorage.getItem(KEY),
  );
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (unlocked) return <>{children}</>;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/v1/beta/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message ?? "That code didn't work. Please check it and try again.");
      localStorage.setItem(KEY, code.trim().toUpperCase());
      setUnlocked(true);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "We couldn't reach Verso. Check your internet connection."
          : String((err as Error).message),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="beta-gate">
      <form className="acct-dialog" onSubmit={submit}>
        <img src={versoMark} alt="" width={56} height={56} />
        <h1 className="acct-dialog__title">Welcome to the Verso beta</h1>
        <p className="acct-muted">Enter the invite code from your email to get started.</p>
        <input
          className="field__input beta-gate__input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="VERSO-XXXX-XXXX"
          aria-label="Invite code"
          autoFocus
          spellCheck={false}
        />
        {error && <p className="acct-error">{error}</p>}
        <Button variant="primary" type="submit" disabled={busy || code.trim().length < 4}>
          {busy ? "Checking…" : "Continue"}
        </Button>
      </form>
    </div>
  );
}
