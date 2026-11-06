import { useEffect, useState, type CSSProperties } from "react";
import type { CaptionStyle } from "../../lib/captionStyles";

/**
 * One caption line drawn in a style. `active` is the index of the word being
 * spoken (-1 for none). Usable by the player overlay as well as the picker.
 */
export function CaptionText({
  style,
  words,
  active,
  size = 18,
}: {
  style: CaptionStyle;
  words: string[];
  active: number;
  /** Base font size in px before the style's scale. */
  size?: number;
}) {
  const vars = {
    "--cap-text": style.textColor,
    "--cap-hi": style.highlightColor,
    "--cap-bg": style.backgroundColor,
    "--cap-outline": style.outline?.color ?? "transparent",
    "--cap-outline-w": `${style.outline?.width ?? 0}px`,
    "--cap-glow": style.glow ?? "transparent",
    fontSize: `${size * style.scale}px`,
    fontWeight: style.fontWeight,
  } as CSSProperties;
  const cls = [
    "cap",
    `cap--bg-${style.background}`,
    `cap--hl-${style.highlight}`,
    `cap--anim-${style.animation}`,
    style.textCase === "upper" && "cap--upper",
    style.glow && "cap--glow",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={cls} style={vars}>
      {words.map((w, i) => {
        const state = i === active ? "is-active" : i < active ? "is-past" : "is-future";
        if (style.revealWords && i > active) return null;
        return (
          <span key={i} className={`cap__word ${state}`}>
            {w}
          </span>
        );
      })}
    </span>
  );
}

const SAMPLE = ["Yeh", "trick", "try", "karo! 🔥"];

/** A small animated swatch: plays the style on sample words. */
export function CaptionStylePreview({
  style,
  words = SAMPLE,
  playing = true,
}: {
  style: CaptionStyle;
  words?: string[];
  playing?: boolean;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => setTick((n) => n + 1), 520);
    return () => window.clearInterval(t);
  }, [playing]);
  // One extra beat at the end so the whole line shows before it loops.
  const active = playing ? tick % (words.length + 1) : 1;
  return (
    <span className="cap-preview" aria-hidden="true">
      <CaptionText style={style} words={words} active={Math.min(active, words.length - 1)} size={14} />
    </span>
  );
}
