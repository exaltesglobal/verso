/** Small "Pro" tag for Pro-only features and the account button. */
export function ProBadge({ title = "Part of Verso Pro" }: { title?: string }) {
  return (
    <span className="pro-badge" data-tip={title}>
      Pro
    </span>
  );
}
