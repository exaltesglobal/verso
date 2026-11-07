import { LOOK_CURVES, curveValue, lookFilterId, saturationMatrix } from "../../lib/looks";

const table = (c: (typeof LOOK_CURVES)[keyof typeof LOOK_CURVES], ch: "r" | "g" | "b") =>
  Array.from({ length: 256 }, (_, i) => curveValue(c, ch, i / 255).toFixed(4)).join(" ");

/**
 * SVG filters for the Look grades, referenced by `colorFilter` as url(#vs-look-*).
 * sRGB interpolation so the maths runs on the same encoded values FFmpeg's
 * colorchannelmixer and lutrgb see. Mount once.
 */
export function LookFilters() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      {Object.entries(LOOK_CURVES).map(([id, c]) => {
        const m = saturationMatrix(c.saturation);
        const values =
          [0, 1, 2].map((r) => `${m.slice(r * 3, r * 3 + 3).join(" ")} 0 0`).join(" ") + " 0 0 0 1 0";
        return (
          <filter key={id} id={lookFilterId(`look-${id}`)} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={values} />
            <feComponentTransfer>
              <feFuncR type="table" tableValues={table(c, "r")} />
              <feFuncG type="table" tableValues={table(c, "g")} />
              <feFuncB type="table" tableValues={table(c, "b")} />
            </feComponentTransfer>
          </filter>
        );
      })}
    </svg>
  );
}
