import { useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { useMode, useVisibility } from "../lib/modes";

/**
 * The single "More settings" row a panel keeps its advanced controls behind.
 * Collapsed in Quick, open in Craft and Studio; switching mode resets it.
 */
export function MoreSettings({
  children,
  label = "More settings",
  defaultOpen,
  persistKey,
}: {
  children: ReactNode;
  label?: string;
  /** Overrides the mode default (the inspector's row is always closed at first). */
  defaultOpen?: boolean;
  /** localStorage key that remembers the open state across sessions. */
  persistKey?: string;
}) {
  const mode = useMode();
  const vis = useVisibility();
  const saved = persistKey ? localStorage.getItem(persistKey) : null;
  return (
    <MoreSettingsInner
      key={mode}
      label={label}
      defaultOpen={saved !== null ? saved === "1" : (defaultOpen ?? vis.moreSettingsOpen)}
      persistKey={persistKey}
    >
      {children}
    </MoreSettingsInner>
  );
}

function MoreSettingsInner({
  children,
  label,
  defaultOpen,
  persistKey,
}: {
  children: ReactNode;
  label: string;
  defaultOpen: boolean;
  persistKey?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = () => {
    if (persistKey) localStorage.setItem(persistKey, open ? "0" : "1");
    setOpen(!open);
  };
  return (
    <div className={open ? "more-settings is-open" : "more-settings"}>
      <button
        type="button"
        className="more-settings__toggle"
        aria-expanded={open}
        onClick={toggle}
      >
        <Icon name="chevron-right" size={16} className="more-settings__chevron" />
        {label}
      </button>
      {open && <div className="more-settings__body">{children}</div>}
    </div>
  );
}
