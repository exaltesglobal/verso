import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

export const ZOOM_MIN = 0.25;
/** About 36px per frame at the top end, so single frames are easy to hit. */
export const ZOOM_MAX = 32;
export const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

/** Editor panel sizes, remembered between sessions. */
export interface Layout {
  left: number;
  insp: number;
  tl: number;
  leftOpen: boolean;
  inspOpen: boolean;
}

export type Splitter = "left" | "insp" | "tl";

const KEY = "verso.layout.v1";
export const DEFAULT_LAYOUT: Layout = { left: 296, insp: 384, tl: 260, leftOpen: true, inspOpen: true };
const LIMITS: Record<Splitter, (h: number) => [number, number]> = {
  left: () => [260, 440],
  insp: () => [320, 480],
  tl: (h) => [180, Math.round(h * 0.55)],
};

const clamp = (k: Splitter, v: number) => {
  const [lo, hi] = LIMITS[k](window.innerHeight);
  return Math.round(Math.min(hi, Math.max(lo, v)));
};

function load(): Layout {
  try {
    const l: Layout = { ...DEFAULT_LAYOUT, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
    // Saved sizes from older versions can be narrower than the panels now need.
    return { ...l, left: clamp("left", l.left), insp: clamp("insp", l.insp), tl: clamp("tl", l.tl) };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

/**
 * Drag-to-resize panels. Splitters call `startDrag`; the size follows the
 * pointer and is saved on pointer-up (not per move). Double-click resets.
 */
export function useLayout() {
  const [layout, setLayout] = useState(load);
  const latest = useRef(layout);

  const commit = useCallback((next: Layout, save: boolean) => {
    latest.current = next;
    setLayout(next);
    if (save) localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const startDrag = useCallback(
    (k: Splitter, e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);
      const x0 = e.clientX;
      const y0 = e.clientY;
      const v0 = latest.current[k];
      const move = (ev: PointerEvent) => {
        // Left panel grows to the right; inspector to the left; timeline upwards.
        const d = k === "left" ? ev.clientX - x0 : k === "insp" ? x0 - ev.clientX : y0 - ev.clientY;
        commit({ ...latest.current, [k]: clamp(k, v0 + d) }, false);
      };
      const up = () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", up);
        commit(latest.current, true);
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
    },
    [commit],
  );

  const reset = useCallback(
    (k: Splitter) => commit({ ...latest.current, [k]: DEFAULT_LAYOUT[k] }, true),
    [commit],
  );
  const toggle = useCallback(
    (k: "leftOpen" | "inspOpen", open?: boolean) =>
      commit({ ...latest.current, [k]: open ?? !latest.current[k] }, true),
    [commit],
  );
  /** Ctrl+\: hide both side panels to focus on the preview, or bring them back. */
  const toggleFocus = useCallback(() => {
    const open = !(latest.current.leftOpen || latest.current.inspOpen);
    commit({ ...latest.current, leftOpen: open, inspOpen: open }, true);
  }, [commit]);

  return { layout, startDrag, reset, toggle, toggleFocus };
}
