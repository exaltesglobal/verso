import { useEffect, useState } from "react";
import { ACTION_LABELS, useCredits, type CreditHistoryItem } from "../../lib/credits";
import { Button } from "../ui";

const dateFmt = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

function label(i: CreditHistoryItem) {
  if (i.kind === "debit") return i.action ? ACTION_LABELS[i.action] : "AI tool";
  if (i.kind === "refund") return `${i.action ? ACTION_LABELS[i.action] : "AI tool"} refund`;
  return i.reason ?? (i.kind === "reset" ? "Monthly credits" : "Credits added");
}

/** Recent credit activity, newest first. Shown in the account panel. */
export function UsageHistory() {
  const { active, configured, balance, history } = useCredits();
  const [items, setItems] = useState<CreditHistoryItem[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const total = balance?.total;

  useEffect(() => {
    if (!configured || total === undefined) return;
    history()
      .then((r) => {
        setItems(r.items);
        setCursor(r.nextCursor);
        setError(null);
      })
      .catch((e) => setError(String(e)));
  }, [configured, total, history]);

  if (!configured) return <p className="acct-muted">Credits aren't set up yet.</p>;
  if (error) return <p className="acct-muted">Your credit history shows up here when you're online.</p>;
  if (!items) return null;
  if (!items.length) {
    return (
      <p className="acct-muted">
        {active
          ? "No credit activity yet."
          : "No credit activity yet. AI tools don't use credits in this build."}
      </p>
    );
  }

  const more = async () => {
    try {
      const r = await history(cursor);
      setItems((prev) => [...(prev ?? []), ...r.items]);
      setCursor(r.nextCursor);
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <>
      <ul className="acct-devices credit-history">
        {items.map((i) => (
          <li key={i.id}>
            <span>
              {label(i)}
              <span className="acct-muted"> · {dateFmt.format(new Date(i.createdAt))}</span>
            </span>
            <span className={i.delta > 0 ? "credit-history__plus" : "acct-muted"}>
              {i.delta > 0 ? `+${i.delta}` : i.delta}
            </span>
          </li>
        ))}
      </ul>
      {cursor && (
        <Button variant="ghost" onClick={() => void more()}>
          Show more
        </Button>
      )}
    </>
  );
}
