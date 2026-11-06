import type { CSSProperties } from "react";
import "@fontsource-variable/fraunces"; // SIL OFL serif for title cards, bundled locally
import { clipsAt, type Clip, type Project, type TextStyle } from "../../lib/project";

const DEFAULT_STYLE: TextStyle = { preset: "subtitle", y: 0.7, size: 0.045, color: "#F5F4F0", align: "center" };

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (x: number) => 1 - (1 - x) ** 3;
const easeOutBack = (x: number) => 1 + 2.7 * (x - 1) ** 3 + 1.7 * (x - 1) ** 2;

/** How many characters / words are revealed `local` seconds in. Mirrored in export/look.rs. */
function revealCount(anim: TextStyle["animation"], text: string, local: number, len: number): number {
  if (anim === "typewriter") {
    const total = Math.min(len * 0.6, Math.max(0.6, text.length * 0.05));
    return Math.ceil(text.length * clamp01(local / total));
  }
  if (anim === "word-by-word") {
    const words = text.split(/\s+/).filter(Boolean).length;
    const step = Math.min(0.35, (len * 0.6) / Math.max(1, words));
    return Math.min(words, Math.floor(local / step) + 1);
  }
  return Infinity;
}

/** Transform/opacity/filter for the entrance animation, `local` seconds after the clip starts. */
function motion(anim: TextStyle["animation"], local: number): CSSProperties {
  switch (anim) {
    case "slide-up": {
      const k = easeOut(clamp01(local / 0.4));
      return { opacity: k, transform: `translateY(calc(-50% + ${(1 - k) * 0.6}em))` };
    }
    case "blur-in": {
      const k = clamp01(local / 0.5);
      return { opacity: k, filter: `blur(${(1 - easeOut(k)) * 0.3}em)`, transform: "translateY(-50%)" };
    }
    case "bounce": {
      const k = clamp01(local / 0.5);
      return { opacity: clamp01(local / 0.12), transform: `translateY(-50%) scale(${easeOutBack(k)})` };
    }
    case "typewriter":
    case "word-by-word":
      return { transform: "translateY(-50%)" };
    default: {
      // "pop" and unset: the original quick pop-in.
      const k = clamp01(local / 0.25);
      return { opacity: k, transform: `translateY(-50%) scale(${0.92 + 0.08 * k})` };
    }
  }
}

function Revealed({ clip, s, local }: { clip: Clip; s: TextStyle; local: number }) {
  const text = clip.text ?? clip.label;
  const n = revealCount(s.animation, text, local, clip.end - clip.start);
  if (!Number.isFinite(n)) return <span>{text}</span>;
  let cut = n;
  if (s.animation === "word-by-word") {
    // Character index after the n-th word.
    const m = text.match(new RegExp(`^\\s*(?:\\S+\\s*){${n}}`));
    cut = m ? m[0].length : text.length;
  }
  return (
    <span>
      {text.slice(0, cut)}
      <span className="frame__text-ghost">{text.slice(cut)}</span>
    </span>
  );
}

/** Text clips under the playhead with their entrance animation. Drop-in for TextOverlays. */
export function AnimatedText({ project, time }: { project: Project; time: number }) {
  return (
    <>
      {clipsAt(project, "text", time).map((c) => {
        const s = c.style ?? DEFAULT_STYLE;
        const local = time - c.start;
        const style = {
          top: `${s.y * 100}%`,
          fontSize: `calc(${s.size} * 100cqh)`,
          color: s.color,
          textAlign: s.align,
          ...motion(s.animation, local),
        } as CSSProperties;
        return (
          <p
            key={c.id}
            className={`frame__text text-look--${s.preset}${s.font === "serif" ? " text-font--serif" : ""}`}
            style={style}
          >
            <Revealed clip={c} s={s} local={local} />
          </p>
        );
      })}
    </>
  );
}
