// One-drag media: drag a clip from any list (or a file from the OS) onto an
// element marked `data-media-drop`. Uses pointer events, not HTML5 drag and
// drop, because Tauri's file-drop handling blocks HTML5 drag events on Windows.
import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { probeMedia, type MediaInfo } from "./media";

const DROP_EVENT = "verso:media-drop";
const OVER = "is-drop-over";

let over: HTMLElement | null = null;

function targetAt(x: number, y: number): HTMLElement | null {
  return document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-media-drop]") ?? null;
}

function highlight(el: HTMLElement | null) {
  if (el === over) return;
  over?.classList.remove(OVER);
  el?.classList.add(OVER);
  over = el;
}

function deliver(el: HTMLElement | null, media: MediaInfo) {
  highlight(null);
  el?.dispatchEvent(new CustomEvent<MediaInfo>(DROP_EVENT, { detail: media }));
}

/** Spread on a media tile: `onPointerDown={(e) => startMediaDrag(e, m)}`. A click still works as a click. */
export function startMediaDrag(e: ReactPointerEvent, media: MediaInfo) {
  if (e.button !== 0) return;
  const x0 = e.clientX;
  const y0 = e.clientY;
  let ghost: HTMLElement | null = null;
  const move = (ev: PointerEvent) => {
    if (!ghost) {
      if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < 6) return;
      ghost = document.createElement("div");
      ghost.className = "media-ghost";
      ghost.textContent = media.fileName;
      document.body.append(ghost);
    }
    ghost.style.transform = `translate(${ev.clientX + 12}px, ${ev.clientY + 12}px)`;
    highlight(targetAt(ev.clientX, ev.clientY));
  };
  const up = (ev: PointerEvent) => {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", up);
    if (!ghost) return;
    ghost.remove();
    deliver(ev.type === "pointerup" ? targetAt(ev.clientX, ev.clientY) : null, media);
  };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
}

/** Calls `onDrop` when media is dropped on the returned ref's element (also marks it as a drop target). */
export function useMediaDrop<T extends HTMLElement>(onDrop: (m: MediaInfo) => void) {
  const ref = useRef<T>(null);
  const latest = useRef(onDrop);
  useEffect(() => {
    latest.current = onDrop;
  }, [onDrop]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.dataset.mediaDrop = "";
    const handler = (e: Event) => latest.current((e as CustomEvent<MediaInfo>).detail);
    el.addEventListener(DROP_EVENT, handler);
    return () => el.removeEventListener(DROP_EVENT, handler);
  }, []);
  return ref;
}

/**
 * While mounted, video files dropped from the OS onto a drop target are read
 * and delivered like an in-app drag. `onError` gets a friendly message.
 */
export function useOsFileDrops(onError: (message: string) => void) {
  const latest = useRef(onError);
  useEffect(() => {
    latest.current = onError;
  }, [onError]);
  useEffect(() => {
    let off: (() => void) | undefined;
    let alive = true;
    const at = (p: { x: number; y: number }) =>
      targetAt(p.x / window.devicePixelRatio, p.y / window.devicePixelRatio);
    getCurrentWebview()
      .onDragDropEvent((e) => {
        const p = e.payload;
        if (p.type === "over") highlight(at(p.position));
        else if (p.type === "leave") highlight(null);
        else if (p.type === "drop") {
          const el = at(p.position);
          highlight(null);
          if (!el || !p.paths.length) return;
          probeMedia(p.paths[0])
            .then((m) => (m.hasVideo ? deliver(el, m) : latest.current("That file has no picture. Drop a video.")))
            .catch(() => latest.current("Couldn't read that file. Try another video."));
        }
      })
      .then((u) => (alive ? (off = u) : u()))
      .catch(() => {}); // not running inside Tauri (e.g. plain browser preview)
    return () => {
      alive = false;
      off?.();
    };
  }, []);
}
