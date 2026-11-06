import type { CSSProperties } from "react";
import { SAFE_ZONE } from "../../templates";

export const SAFE_ZONES_KEY = "verso.safeZones";

/**
 * Shades the edges Reels/Shorts UI covers (top 10%, bottom 20%, right 12%).
 * Mount inside the preview frame (a positioned box); the preview toolbar owns the toggle.
 */
export function SafeZoneOverlay() {
  const vars = {
    "--sz-top": `${SAFE_ZONE.top * 100}%`,
    "--sz-bottom": `${SAFE_ZONE.bottom * 100}%`,
    "--sz-right": `${SAFE_ZONE.right * 100}%`,
  } as CSSProperties;
  return (
    <span className="safe-zones" style={vars} aria-hidden="true">
      <span className="safe-zones__top" />
      <span className="safe-zones__bottom" />
      <span className="safe-zones__right" />
    </span>
  );
}
