import agapeSymbol from "../assets/brand/agape-labs-symbol.svg";

/** Quiet "by Agape Labs" endorsement. Verso stays the hero. */
export function AgapeCredit({ className }: { className?: string }) {
  return (
    <span className={className ? `agape-credit ${className}` : "agape-credit"}>
      <span>by</span>
      <img src={agapeSymbol} alt="" width={16} height={16} />
      <span>Agape Labs</span>
    </span>
  );
}
