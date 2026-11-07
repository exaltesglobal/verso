import React, { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: IconName;
  size?: "md" | "lg";
  children?: ReactNode;
}

/** Primary is Ember and reserved for one action per screen (Export). */
export function Button({
  variant = "secondary",
  icon,
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps) {
  const cls = ["btn", `btn--${variant}`, size === "lg" && "btn--lg", className].filter(Boolean).join(" ");
  return (
    <button type="button" className={cls} {...rest}>
      {icon && <Icon name={icon} size={16} />}
      {children && <span>{children}</span>}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  /** Accessible name and tooltip. Icon-only buttons always need one. */
  label: string;
  active?: boolean;
  /** Shown as a key chip in the tooltip, e.g. "Ctrl+Z". */
  shortcut?: string;
  size?: 16 | 20;
}

export function IconButton({
  icon,
  label,
  active,
  shortcut,
  size = 20,
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={["icon-btn", active && "is-active", className].filter(Boolean).join(" ")}
      aria-label={label}
      aria-keyshortcuts={shortcut}
      data-tip={label}
      data-kbd={shortcut}
      {...rest}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={checked ? "toggle is-on" : "toggle"}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle__knob" />
    </button>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={o === value}
          className={o === value ? "segmented__item is-active" : "segmented__item"}
          onClick={() => onChange(o)}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export interface ToastMessage {
  tone: "success" | "danger" | "info";
  text: string;
  /** One action, e.g. Undo after a smart edit or Open folder after an export. */
  action?: { label: string; run: () => void };
}

const TOAST_ICON: Record<ToastMessage["tone"], IconName> = {
  success: "check-circle",
  danger: "alert",
  info: "info",
};

export function Toast({ message, onDone }: { message: ToastMessage; onDone: () => void }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    // Errors stay until dismissed; hovering pauses the timer.
    if (paused || message.tone === "danger") return;
    const t = window.setTimeout(onDone, message.action ? 6000 : 3500);
    return () => window.clearTimeout(t);
  }, [message, onDone, paused]);

  return (
    <div
      className={`toast toast--${message.tone}`}
      role={message.tone === "danger" ? "alert" : "status"}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <Icon name={TOAST_ICON[message.tone]} size={16} className="toast__icon" />
      <span className="toast__text">{message.text}</span>
      {message.action && (
        <button
          type="button"
          className="toast__action"
          onClick={() => {
            message.action?.run();
            onDone();
          }}
        >
          {message.action.label}
        </button>
      )}
      <IconButton icon="close" label="Dismiss" size={16} className="toast__close" onClick={onDone} />
    </div>
  );
}

/**
 * The one progress bar: Paper fill on a 4px track, a step label with percent,
 * and an ETA line. Without a value it shows a sliding indeterminate segment.
 */
export function Progress({
  value,
  label,
  eta,
  onCancel,
}: {
  /** 0..100, or undefined while the engine gives no percentage yet. */
  value?: number;
  label: string;
  eta?: string;
  onCancel?: () => void;
}) {
  const pct = value === undefined ? undefined : Math.max(0, Math.min(100, Math.floor(value)));
  return (
    <div className="progress">
      <div className="progress__row">
        <span className="progress__label" aria-live="polite">
          {label}
        </span>
        {pct !== undefined && <span className="progress__pct tc">{pct}%</span>}
      </div>
      <div
        className={pct === undefined ? "progress__track is-indeterminate" : "progress__track"}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={pct === undefined ? label : `${label}, ${pct}%`}
      >
        <span className="progress__fill" style={pct === undefined ? undefined : { width: `${pct}%` }} />
      </div>
      {(eta || onCancel) && (
        <div className="progress__row">
          <span className="progress__eta">{eta}</span>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Premiere-style number field: drag the label to scrub (1 step per 2px; Shift x10,
 * Alt x0.1), type a value (Enter commits, Esc reverts), arrows step, double-click
 * the label to reset. Changed values show the label in Paper.
 */
export function ScrubNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  defaultValue,
  disabled,
  slider,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  defaultValue: number;
  disabled?: boolean;
  /** Also show a slider under the row (beginner-friendly fields). */
  slider?: boolean;
  onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const decimals = step < 1 ? Math.max(0, -Math.floor(Math.log10(step))) : 0;
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  const shown = value.toFixed(decimals);
  const changed = Math.abs(value - defaultValue) > step / 2;

  const scrub = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (disabled || e.button !== 0) return;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    let last = e.clientX;
    let acc = value;
    const move = (ev: PointerEvent) => {
      const k = ev.shiftKey ? 10 : ev.altKey ? 0.1 : 1;
      acc += ((ev.clientX - last) / 2) * step * k;
      last = ev.clientX;
      onChange(clamp(acc));
    };
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
  };

  const commit = () => {
    const v = parseFloat(draft ?? "");
    if (Number.isFinite(v)) onChange(clamp(v));
    setDraft(null);
  };

  const pct = `${Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))}%`;
  // Spec 1.3: label (drag to scrub, double-click resets) | 72px field with the unit inside | slider | reset.
  return (
    <div
      className={["adv", changed && "is-changed", disabled && "is-disabled"].filter(Boolean).join(" ")}
      data-slider={slider ? "" : undefined}
    >
      <span
        className="adv__label"
        onPointerDown={scrub}
        onDoubleClick={() => !disabled && onChange(defaultValue)}
        data-tip={disabled ? undefined : "Drag to change. Double-click to reset."}
      >
        {label}
      </span>
      <span className="adv__field">
        <input
          className="tc"
          value={draft ?? shown}
          disabled={disabled}
          aria-label={label}
          inputMode="decimal"
          onFocus={(e) => {
            setDraft(shown);
            e.currentTarget.select();
          }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            else if (e.key === "Escape") {
              setDraft(null);
              e.currentTarget.blur();
            } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              const next = clamp(value + (e.key === "ArrowUp" ? 1 : -1) * step * (e.shiftKey ? 10 : 1));
              onChange(next);
              setDraft(next.toFixed(decimals));
            }
          }}
        />
        {unit && <span className="adv__unit">{unit}</span>}
      </span>
      <span className="adv__slider" style={{ "--p": pct } as React.CSSProperties}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-label={`${label} slider`}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <i />
      </span>
      <button
        type="button"
        className="adv__reset"
        aria-label={`Reset ${label}`}
        data-tip="Reset"
        disabled={disabled || !changed}
        onClick={() => onChange(defaultValue)}
      >
        <Icon name="reset" size={16} />
      </button>
    </div>
  );
}

const OPEN_KEY = "verso.inspector.open.v1";
const openState = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(OPEN_KEY) ?? "{}");
  } catch {
    return {};
  }
};

/** Collapsible section with a 32px header; open state is remembered per title. */
export function Section({
  title,
  defaultOpen = true,
  onReset,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  /** Shown on hover when something in the section differs from its default. */
  onReset?: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(() => openState()[title] ?? defaultOpen);
  const toggle = () => {
    localStorage.setItem(OPEN_KEY, JSON.stringify({ ...openState(), [title]: !open }));
    setOpen(!open);
  };
  return (
    <section className={open ? "insp-section is-open" : "insp-section"}>
      <div className="insp-section__head">
        <button type="button" className="insp-section__toggle" aria-expanded={open} onClick={toggle}>
          <Icon name="chevron-right" size={16} className="insp-section__chevron" />
          {title}
        </button>
        {onReset && (
          <IconButton icon="reset" label={`Reset ${title.toLowerCase()}`} size={16} onClick={onReset} />
        )}
      </div>
      {open && <div className="insp-section__body">{children}</div>}
    </section>
  );
}
