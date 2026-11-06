import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
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
      {icon && <Icon name={icon} size={20} />}
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

export function IconButton({ icon, label, active, shortcut, size = 20, className, ...rest }: IconButtonProps) {
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
}

export function Toast({ message, onDone }: { message: ToastMessage; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, message.tone === "danger" ? 6000 : 3500);
    return () => window.clearTimeout(t);
  }, [message, onDone]);

  return (
    <div className={`toast toast--${message.tone}`} role={message.tone === "danger" ? "alert" : "status"}>
      <span className="toast__dot" />
      <span>{message.text}</span>
      <button type="button" className="toast__close" onClick={onDone} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
