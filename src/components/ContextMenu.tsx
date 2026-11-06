import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "./Icon";

export type MenuItem =
  | {
      label: string;
      shortcut?: string;
      icon?: IconName;
      danger?: boolean;
      disabled?: boolean;
      onSelect: () => void;
    }
  | { separator: true };

/**
 * Verso's own right-click menu (the browser one is turned off app-wide).
 * Opens with focus on the first item; arrows, Home/End and typeahead move;
 * Enter/Space picks; Esc closes and returns focus to whatever had it before.
 */
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
  const opener = useRef<Element | null>(document.activeElement);
  const [pos, setPos] = useState({ left: x, top: y, ready: false });

  const close = (refocus = true) => {
    onClose();
    if (refocus && opener.current instanceof HTMLElement) opener.current.focus();
  };

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("blur", onClose);
    window.addEventListener("resize", onClose);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("blur", onClose);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  // Measure after the first paint and flip at the window edges.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const left = x + width > window.innerWidth - 8 ? Math.max(8, x - width) : x;
    const top = y + height > window.innerHeight - 8 ? Math.max(8, y - height) : y;
    setPos({ left, top, ready: true });
    el.querySelector<HTMLButtonElement>(".menu__item:not(:disabled)")?.focus();
  }, [x, y]);

  const onKey = (e: KeyboardEvent) => {
    const buttons = [
      ...(ref.current?.querySelectorAll<HTMLButtonElement>(".menu__item:not(:disabled)") ?? []),
    ];
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const focus = (n: number) => buttons[(n + buttons.length) % buttons.length]?.focus();
    e.stopPropagation();
    if (e.key === "ArrowDown") focus(i + 1);
    else if (e.key === "ArrowUp") focus(i - 1);
    else if (e.key === "Home") focus(0);
    else if (e.key === "End") focus(buttons.length - 1);
    else if (e.key === "Escape") close();
    else if (e.key === "Tab") close(false);
    else if (e.key.length === 1 && /\S/.test(e.key)) {
      const k = e.key.toLowerCase();
      const order = [...buttons.slice(i + 1), ...buttons.slice(0, i + 1)];
      order.find((b) => b.textContent?.trim().toLowerCase().startsWith(k))?.focus();
    } else return;
    e.preventDefault();
  };

  return createPortal(
    <div
      ref={ref}
      className="menu ctx-menu"
      role="menu"
      style={{ left: pos.left, top: pos.top, visibility: pos.ready ? "visible" : "hidden" }}
      onKeyDown={onKey}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((it, i) =>
        "separator" in it ? (
          <div key={i} className="menu__sep" role="separator" />
        ) : (
          <button
            key={i}
            type="button"
            role="menuitem"
            className={it.danger ? "menu__item is-danger" : "menu__item"}
            disabled={it.disabled}
            onClick={() => {
              it.onSelect();
              close();
            }}
          >
            <span className="menu__check">{it.icon && <Icon name={it.icon} size={16} />}</span>
            <span className="menu__label">{it.label}</span>
            {it.shortcut && <kbd className="kbd">{it.shortcut}</kbd>}
          </button>
        ),
      )}
    </div>,
    document.body,
  );
}
