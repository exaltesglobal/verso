import { useState, type CSSProperties } from "react";
import { SAFE_ZONE } from "../../templates";

const KEY = "verso.safeZones";

/**
 * Shades the edges Reels/Shorts UI covers (top 10%, bottom 20%, right 12%) with
 * its own toggle. Mount inside the preview frame (a positioned box).
 */
export function SafeZoneOverlay() {
  const [on, setOn] = useState(() => localStorage.getItem(KEY) === "1");
  const toggle = () => {
    localStorage.setItem(KEY, on ? "0" : "1");
    setOn(!on);
  };
  const vars = {
    "--sz-top": `${SAFE_ZONE.top * 100}%`,
    "--sz-bottom": `${SAFE_ZONE.bottom * 100}%`,
    "--sz-right": `${SAFE_ZONE.right * 100}%`,
  } as CSSProperties;
  return (
    <>
      {on && (
        <span className="safe-zones" style={vars} aria-hidden="true">
          <span className="safe-zones__top" />
          <span className="safe-zones__bottom" />
          <span className="safe-zones__right" />
        </span>
      )}
      <button
        type="button"
        className={on ? "safe-zones__toggle is-active" : "safe-zones__toggle"}
        aria-pressed={on}
        title="Show where app buttons and captions cover the reel"
        onClick={toggle}
      >
        Safe zones
      </button>
    </>
  );
}
