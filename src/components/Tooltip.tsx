import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const DELAY = 500;
/** Moving between tooltipped controls within this window shows the next tip at once. */
const SKIP = 400;

interface Tip {
  el: HTMLElement;
  text: string;
  kbd?: string;
}

/**
 * One app-wide tooltip layer. Any element with `data-tip` (and optional
 * `data-kbd` for a shortcut chip) gets a styled tooltip in a portal, so it
 * never clips inside scrolling panels and flips at the window edges.
 * Mounted once in main.tsx; callers only set attributes.
 */
export function TooltipLayer() {
  const [tip, setTip] = useState<Tip | null>(null);
  const timer = useRef(0);
  const lastHide = useRef(0);

  useEffect(() => {
    const read = (el: HTMLElement): Tip | null => {
      const text = el.dataset.tip;
      return text ? { el, text, kbd: el.dataset.kbd } : null;
    };
    const hide = () => {
      window.clearTimeout(timer.current);
      setTip((t) => {
        if (t) lastHide.current = Date.now();
        return null;
      });
    };
    const over = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.<HTMLElement>("[data-tip]");
      if (!el) return;
      const next = read(el);
      if (!next) return;
      window.clearTimeout(timer.current);
      const wait = Date.now() - lastHide.current < SKIP ? 0 : DELAY;
      timer.current = window.setTimeout(() => setTip(next), wait);
    };
    const out = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-tip]");
      if (el && !el.contains(e.relatedTarget as Node)) hide();
    };
    const focus = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (el.matches?.(":focus-visible") && el.dataset.tip) setTip(read(el));
    };
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerout", out);
    document.addEventListener("focusin", focus);
    document.addEventListener("focusout", hide);
    document.addEventListener("pointerdown", hide, true);
    document.addEventListener("keydown", hide, true);
    document.addEventListener("scroll", hide, true);
    window.addEventListener("blur", hide);
    return () => {
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerout", out);
      document.removeEventListener("focusin", focus);
      document.removeEventListener("focusout", hide);
      document.removeEventListener("pointerdown", hide, true);
      document.removeEventListener("keydown", hide, true);
      document.removeEventListener("scroll", hide, true);
      window.removeEventListener("blur", hide);
    };
  }, []);

  // Below the control by default; above it in the timeline and transport; flip and clamp at the edges.
  // Placed straight on the DOM node once it has a size, so there is no second render.
  const place = (node: HTMLDivElement | null) => {
    if (!node || !tip) return;
    const r = tip.el.getBoundingClientRect();
    const b = node.getBoundingClientRect();
    const preferAbove = !!tip.el.closest(".timeline, .transport, .preview-bar");
    const below = r.bottom + 6;
    const above = r.top - b.height - 6;
    let top = preferAbove ? above : below;
    if (top < 4) top = below;
    if (top + b.height > window.innerHeight - 4) top = above;
    const left = Math.min(window.innerWidth - b.width - 4, Math.max(4, r.left + r.width / 2 - b.width / 2));
    node.style.left = `${Math.round(left)}px`;
    node.style.top = `${Math.round(top)}px`;
    node.style.visibility = "visible";
  };

  if (!tip || !tip.el.isConnected) return null;
  return createPortal(
    <div
      ref={place}
      key={tip.text + (tip.kbd ?? "")}
      className="tooltip"
      role="tooltip"
      style={{ visibility: "hidden" }}
    >
      <span>{tip.text}</span>
      {tip.kbd && <kbd className="kbd">{tip.kbd}</kbd>}
    </div>,
    document.body,
  );
}
