import type { CSSProperties } from "react";
import { safeZoneFor } from "../../templates";
import type { AspectRatio } from "../../lib/project";

export const SAFE_ZONES_KEY = "verso.safeZones";

/**
 * Shades the edges the platform covers for this shape (Reels/Shorts UI on 9:16,
 * the profile grid crop on 4:5) and dashes the 10% title-safe area. Mount inside
 * the preview frame (a positioned box); the preview toolbar owns the toggle.
 */
export function SafeZoneOverlay({ aspect = "9:16" }: { aspect?: AspectRatio }) {
  const z = safeZoneFor(aspect);
  const vars = {
    "--sz-top": `${z.top * 100}%`,
    "--sz-bottom": `${z.bottom * 100}%`,
    "--sz-right": `${z.right * 100}%`,
    "--sz-left": `${z.left * 100}%`,
  } as CSSProperties;
  return (
    <span className="safe-zones" style={vars} aria-hidden="true">
      <span className="safe-zones__top" />
      <span className="safe-zones__bottom" />
      <span className="safe-zones__right" />
      <span className="safe-zones__left" />
      <span className="safe-zones__title" />
    </span>
  );
}
