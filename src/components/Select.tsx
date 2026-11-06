import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
}

interface SelectProps<T extends string | number> {
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (v: T) => void;
  /** Accessible name when no visible <label> wraps the select. */
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Verso's own dropdown (no native <select>): a button plus a listbox in a portal,
 * so it never clips inside scrolling panels. Keyboard: arrows, Home/End,
 * typeahead, Enter/Space to pick, Esc to close (focus returns to the button).
 */
export function Select<T extends string | number>({
  value,
  options,
  onChange,
  label,
  placeholder,
  className,
  disabled,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<CSSProperties>({});
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const listId = useId();
  const current = options.find((o) => o.value === value);

  const show = () => {
    if (disabled || !options.length) return;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) btn.current?.focus();
  };
  const pick = (i: number) => {
    const o = options[i];
    if (o) onChange(o.value);
    close();
  };

  // Measure after the list renders, then place it below the button (or above if it would not fit).
  useLayoutEffect(() => {
    if (!open || !btn.current || !list.current) return;
    const r = btn.current.getBoundingClientRect();
    const h = list.current.offsetHeight;
    const below = window.innerHeight - r.bottom - 8;
    const top = h <= below || r.top < h ? r.bottom + 4 : r.top - h - 4;
    setPos({ top: Math.round(top), left: Math.round(r.left), minWidth: Math.round(r.width) });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!list.current?.contains(t) && !btn.current?.contains(t)) close(false);
    };
    const onScroll = (e: Event) => {
      if (!list.current?.contains(e.target as Node)) close(false);
    };
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", () => close(false), { once: true });
    return () => {
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const onKey = (e: KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        show();
      }
      return;
    }
    e.stopPropagation();
    const n = options.length;
    if (e.key === "ArrowDown") setActive((i) => (i + 1) % n);
    else if (e.key === "ArrowUp") setActive((i) => (i - 1 + n) % n);
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(n - 1);
    else if (e.key === "Enter" || e.key === " ") pick(active);
    else if (e.key === "Escape" || e.key === "Tab") return close(e.key === "Escape");
    else if (e.key.length === 1) {
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 600 ? typed.current.text : "") + e.key.toLowerCase(), at: now };
      const i = options.findIndex((o) => o.label.toLowerCase().startsWith(typed.current.text));
      if (i >= 0) setActive(i);
      return;
    } else return;
    e.preventDefault();
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        className={["select", className].filter(Boolean).join(" ")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={label}
        disabled={disabled}
        onClick={() => (open ? close() : show())}
        onKeyDown={onKey}
      >
        <span className={current ? "select__value" : "select__value is-placeholder"}>
          {current?.label ?? placeholder ?? "Choose"}
        </span>
        <Icon name="chevron-down" size={16} className="select__chevron" />
      </button>
      {open &&
        createPortal(
          <ul
            ref={list}
            id={listId}
            role="listbox"
            className="menu select__list"
            style={pos}
            aria-activedescendant={`${listId}-${active}`}
          >
            {options.map((o, i) => (
              <li
                key={String(o.value)}
                id={`${listId}-${i}`}
                data-i={i}
                role="option"
                aria-selected={o.value === value}
                className={i === active ? "menu__item is-active" : "menu__item"}
                onPointerEnter={() => setActive(i)}
                onClick={() => pick(i)}
              >
                <span className="menu__check">{o.value === value && <Icon name="check" size={16} />}</span>
                <span className="menu__label">{o.label}</span>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  );
}
