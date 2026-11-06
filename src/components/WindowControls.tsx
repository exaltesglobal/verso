import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * Minimise / maximise / close for the frameless window. The OS title bar is
 * off (`decorations: false`), so every screen's top bar hosts these and marks
 * its empty space with `data-tauri-drag-region` (drag to move, double-click
 * to maximise).
 */
export function WindowControls() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    let win: ReturnType<typeof getCurrentWindow>;
    try {
      win = getCurrentWindow();
    } catch {
      return; // plain browser (pnpm dev)
    }
    let off: (() => void) | undefined;
    void win
      .isMaximized()
      .then(setMaximized)
      .catch(() => {});
    void win
      .onResized(() => {
        void win
          .isMaximized()
          .then(setMaximized)
          .catch(() => {});
      })
      .then((u) => (off = u))
      .catch(() => {});
    return () => off?.();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("is-maximized", maximized);
  }, [maximized]);

  const act = (fn: (w: ReturnType<typeof getCurrentWindow>) => Promise<void>) => () => {
    try {
      void fn(getCurrentWindow()).catch(() => {});
    } catch {
      /* not in Tauri */
    }
  };

  return (
    <div className="winctl" role="group" aria-label="Window">
      <button type="button" className="winctl__btn" aria-label="Minimise" onClick={act((w) => w.minimize())}>
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2 6.5h8" />
        </svg>
      </button>
      <button
        type="button"
        className="winctl__btn"
        aria-label={maximized ? "Restore" : "Maximise"}
        onClick={act((w) => w.toggleMaximize())}
      >
        {maximized ? (
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3.5 4.5h4v4h-4zM5 4.5V3h4v4H7.5" />
          </svg>
        ) : (
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <rect x="2.5" y="2.5" width="7" height="7" rx="1" />
          </svg>
        )}
      </button>
      <button
        type="button"
        className="winctl__btn winctl__btn--close"
        aria-label="Close"
        onClick={act((w) => w.close())}
      >
        <svg viewBox="0 0 12 12" aria-hidden="true">
          <path d="M3 3l6 6M9 3l-6 6" />
        </svg>
      </button>
    </div>
  );
}
