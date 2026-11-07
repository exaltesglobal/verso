import { useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { useMode, useVisibility } from "../lib/modes";

/**
 * The single "More settings" row a panel keeps its advanced controls behind.
 * Collapsed in Quick, open in Craft and Studio; switching mode resets it.
 */
export function MoreSettings({ children, label = "More settings" }: { children: ReactNode; label?: string }) {
  const mode = useMode();
  return (
    <MoreSettingsInner key={mode} label={label} defaultOpen={useVisibility().moreSettingsOpen}>
      {children}
    </MoreSettingsInner>
  );
}

function MoreSettingsInner({
  children,
  label,
  defaultOpen,
}: {
  children: ReactNode;
  label: string;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={open ? "more-settings is-open" : "more-settings"}>
      <button
        type="button"
        className="more-settings__toggle"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Icon name="chevron-right" size={16} className="more-settings__chevron" />
        {label}
      </button>
      {open && <div className="more-settings__body">{children}</div>}
    </div>
  );
}
