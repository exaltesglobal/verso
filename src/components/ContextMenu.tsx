import { useEffect, useRef } from "react";

export type MenuItem =
  { label: string; shortcut?: string; disabled?: boolean; onSelect: () => void } | { separator: true };

/** Verso's own right-click menu (the browser one is turned off app-wide). */
export function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e instanceof MouseEvent && ref.current?.contains(e.target as Node)) return;
      onClose();
    };
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", close);
    window.addEventListener("blur", onClose);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", close);
      window.removeEventListener("blur", onClose);
    };
  }, [onClose]);

  // Keep the menu on screen.
  const left = Math.min(x, window.innerWidth - 200);
  const top = Math.min(y, window.innerHeight - items.length * 32 - 16);

  return (
    <div ref={ref} className="ctx-menu" role="menu" style={{ left, top }}>
      {items.map((it, i) =>
        "separator" in it ? (
          <div key={i} className="ctx-menu__sep" role="separator" />
        ) : (
          <button
            key={i}
            type="button"
            role="menuitem"
            className="ctx-menu__item"
            disabled={it.disabled}
            onClick={() => {
              it.onSelect();
              onClose();
            }}
          >
            <span>{it.label}</span>
            {it.shortcut && <span className="ctx-menu__key">{it.shortcut}</span>}
          </button>
        ),
      )}
    </div>
  );
}
