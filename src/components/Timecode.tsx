import { useState } from "react";
import { useSettings } from "../lib/settings";
import { formatSeconds, formatTimecode, parseTime, timecodeParts } from "../lib/timecode";

/** `00:00:12:15` with the leading zero groups dimmed, or `0:12.5` with "Show time as: Seconds". */
export function Timecode({ t, className }: { t: number; className?: string }) {
  const { timeFormat } = useSettings();
  if (timeFormat === "seconds")
    return <span className={["tc", className].filter(Boolean).join(" ")}>{formatSeconds(t)}</span>;
  const [dim, main] = timecodeParts(t);
  return (
    <span className={["tc", className].filter(Boolean).join(" ")}>
      {dim && <span className="tc-dim">{dim}</span>}
      {main}
    </span>
  );
}

/**
 * The transport's current time: click to type. Accepts `1:23`, `83`, `1:23:10`
 * (with frames) and relative `+2s` / `-10f`. Enter jumps, Esc cancels.
 */
export function TimecodeField({
  t,
  duration,
  onSeek,
}: {
  t: number;
  duration: number;
  onSeek: (t: number) => void;
}) {
  const { timeFormat } = useSettings();
  const [draft, setDraft] = useState<string | null>(null);

  if (draft === null)
    return (
      <button
        type="button"
        className="tc-field"
        onClick={() => setDraft(timeFormat === "seconds" ? formatSeconds(t) : formatTimecode(t))}
        data-tip="Type a time to jump there"
        aria-label="Current time. Click to type a time."
      >
        <Timecode t={t} />
      </button>
    );

  const commit = () => {
    const next = parseTime(draft, t);
    if (next !== null) onSeek(Math.min(duration, next));
    setDraft(null);
  };
  return (
    <input
      className="tc-field tc-field--edit tc"
      value={draft}
      autoFocus
      spellCheck={false}
      aria-label="Go to time"
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => setDraft(null)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") commit();
        else if (e.key === "Escape") setDraft(null);
      }}
    />
  );
}
