import { useCredits } from "../../lib/credits";

const fmt = new Intl.NumberFormat();

/** Top-bar chip: "120 credits". Turns amber below 10% of the monthly credits. Opens Get more credits. */
export function CreditsBadge() {
  const { configured, balance, low, openBuy } = useCredits();
  if (!configured || !balance) return null;

  const total = Math.max(0, balance.total);
  const title = balance.offline
    ? `Offline. You can use about ${balance.offlineBuffer} more credits until you reconnect.`
    : low
      ? "You're running low on credits. Get more?"
      : "Your AI credits. Editing and export are always free.";
  return (
    <button
      type="button"
      className={low ? "credits-badge credits-badge--low" : "credits-badge"}
      onClick={openBuy}
      title={title}
    >
      {fmt.format(total)} {total === 1 ? "credit" : "credits"}
      {balance.offline && <span className="credits-badge__note">offline</span>}
    </button>
  );
}
