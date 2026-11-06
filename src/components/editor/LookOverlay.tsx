import type { CSSProperties } from "react";
import { LEAK_COLORS, dipAmount, leakOpacity, letterboxBar } from "../../lib/looks";
import type { AspectRatio, Look } from "../../lib/project";

// Film grain tile: SVG fractal noise, no image files.
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.2 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const TAU = Math.PI * 2;

/**
 * Procedural look layers over the preview frame: grain, vignette, light leak,
 * anamorphic flare, letterbox bars and dip-to-black. Motion is a pure function
 * of `time`, so scrubbing matches export (see export/look.rs for the same curves).
 */
export function LookOverlay({
  look,
  aspect,
  time,
  duration,
}: {
  look: Look | undefined;
  aspect: AspectRatio;
  time: number;
  duration: number;
}) {
  if (!look) return null;
  const bar = letterboxBar(look.letterbox, aspect);
  const dip = dipAmount(look, time, duration);
  // Grain jumps to a new offset 24 times a second, like film.
  const f = Math.floor(time * 24);
  const gx = (f * 73) % 160;
  const gy = (f * 151) % 160;
  return (
    <div className="look" aria-hidden="true">
      {look.leak && look.leak.strength > 0 && (
        <div
          className="look__leak"
          style={
            {
              "--l1": LEAK_COLORS[look.leak.style][0],
              "--l2": LEAK_COLORS[look.leak.style][1],
              "--lx": `${(0.5 + 0.4 * Math.sin((TAU * time) / 7)) * 100}%`,
              opacity: leakOpacity(look.leak, time),
            } as CSSProperties
          }
        />
      )}
      {look.flare && look.flare.strength > 0 && (
        <div
          className="look__flare"
          style={
            {
              "--fc": look.flare.color,
              top: `${(0.42 + 0.05 * Math.sin((TAU * time) / 6)) * 100}%`,
              left: `${(0.5 + 0.3 * Math.sin((TAU * time) / 9)) * 100}%`,
              opacity: look.flare.strength,
            } as CSSProperties
          }
        />
      )}
      {!!look.vignette && (
        <div
          className="look__vignette"
          style={{
            background: `radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,${0.85 * look.vignette}) 100%)`,
          }}
        />
      )}
      {!!look.grain && (
        <div
          className="look__grain"
          style={{
            backgroundImage: GRAIN,
            backgroundPosition: `${gx}px ${gy}px`,
            opacity: 0.35 * look.grain,
          }}
        />
      )}
      {bar > 0 && (
        <>
          <div className="look__bar" style={{ top: 0, height: `${bar * 100}%` }} />
          <div className="look__bar" style={{ bottom: 0, height: `${bar * 100}%` }} />
        </>
      )}
      {dip > 0 && <div className="look__dip" style={{ opacity: dip }} />}
    </div>
  );
}
