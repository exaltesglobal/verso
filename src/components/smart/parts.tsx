import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "../Icon";

export function SmartCard({
  icon,
  title,
  lede,
  aside,
  children,
}: {
  icon: IconName;
  title: string;
  lede: string;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="smart-card">
      <header className="smart-card__head">
        <span className="smart-card__icon">
          <Icon name={icon} size={20} />
        </span>
        <span className="smart-card__text">
          <h3 className="smart-card__title">{title}</h3>
          <p className="smart-card__lede">{lede}</p>
        </span>
        {aside}
      </header>
      {children && <div className="smart-card__body">{children}</div>}
    </section>
  );
}

/** "Listening… 40%" with a thin bar. */
export function Listening({ percent, label = "Listening…" }: { percent: number; label?: string }) {
  return (
    <div className="smart-progress" role="status">
      <span>
        {label} {Math.round(percent)}%
      </span>
      <span className="smart-progress__bar">
        <span style={{ width: `${percent}%` }} />
      </span>
    </div>
  );
}

/** 0..1 slider with words at each end. `onCommit` fires when the user lets go. */
export function LevelSlider({
  label,
  low,
  high,
  value,
  onChange,
  onCommit,
}: {
  label: string;
  low: string;
  high: string;
  value: number;
  onChange: (v: number) => void;
  onCommit?: () => void;
}) {
  return (
    <label className="smart-level">
      <span className="smart-level__label">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
        style={{ "--fill": `${value * 100}%` } as CSSProperties}
      />
      <span className="smart-level__ends">
        <span>{low}</span>
        <span>{high}</span>
      </span>
    </label>
  );
}
