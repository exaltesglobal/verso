import { useState } from "react";
import mark from "../../assets/brand/verso-mark-small.svg";
import { Button, IconButton } from "../ui";
import { Icon } from "../Icon";
import { ContextMenu } from "../ContextMenu";
import { AccountButton } from "../account/AccountButton";
import { CreditsBadge } from "../credits/CreditsBadge";
import { WindowControls } from "../WindowControls";
import { MODES, type Mode } from "../../lib/modes";
import { formatMinutes, useTimeSaved } from "../../lib/timeSaved";

export type SaveState = "saved" | "saving" | "error";

interface TopBarProps {
  projectName: string;
  subtitle?: string;
  onRename: (name: string) => void;
  onRenameDone: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onHome: () => void;
  onAbout: () => void;
  onShortcuts: () => void;
  onExport: () => void;
  /** Autosave status, shown instead of a Save button. Ctrl+S still saves a file. */
  saveState: SaveState;
  onSave: () => void;
  mode: Mode;
  onMode: (m: Mode) => void;
}

export function TopBar(props: TopBarProps) {
  const { projectName, subtitle, onRename, onRenameDone, saveState } = props;
  const [help, setHelp] = useState<{ x: number; y: number } | null>(null);
  const saved = useTimeSaved().today;
  return (
    <header className="topbar" data-tauri-drag-region>
      <div className="topbar__left" data-tauri-drag-region>
        <button
          type="button"
          className="topbar__home"
          onClick={props.onHome}
          aria-label="Back to start"
          data-tip="Back to start"
        >
          <img src={mark} alt="" className="topbar__logo" />
        </button>
        <input
          className="topbar__name"
          value={projectName}
          onChange={(e) => onRename(e.target.value)}
          onBlur={onRenameDone}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          aria-label="Project name"
          spellCheck={false}
        />
        {subtitle && <span className="topbar__crumb">› {subtitle}</span>}
        {saveState === "error" ? (
          <button
            type="button"
            className="topbar__status is-error"
            onClick={props.onSave}
            data-tip="Save to a file"
            data-kbd="Ctrl+S"
          >
            <Icon name="alert" size={16} />
            Not saved, retry
          </button>
        ) : (
          <span
            className="topbar__status"
            role="status"
            data-tip="Changes save on their own"
            data-kbd="Ctrl+S"
          >
            {saveState === "saving" ? (
              "Saving…"
            ) : (
              <>
                <Icon name="check" size={16} />
                Saved
              </>
            )}
          </span>
        )}
        {saved >= 1 && (
          <span className="topbar__saved" data-tip="Editing time one-tap edits saved you today">
            Saved about {formatMinutes(saved)} today
          </span>
        )}
      </div>

      <div className="topbar__modes segmented" role="radiogroup" aria-label="Workspace">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={props.mode === m.id}
            className={props.mode === m.id ? "segmented__item is-active" : "segmented__item"}
            data-tip={m.hint}
            onClick={() => props.onMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="topbar__right" data-tauri-drag-region>
        <IconButton
          icon="undo"
          label="Undo"
          shortcut="Ctrl+Z"
          onClick={props.onUndo}
          disabled={!props.canUndo}
        />
        <IconButton
          icon="redo"
          label="Redo"
          shortcut="Ctrl+Shift+Z"
          onClick={props.onRedo}
          disabled={!props.canRedo}
        />
        <IconButton
          icon="help"
          label="Help"
          aria-haspopup="menu"
          aria-expanded={!!help}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setHelp(help ? null : { x: r.left, y: r.bottom + 4 });
          }}
        />
        <CreditsBadge />
        <AccountButton />
        <Button
          variant="primary"
          icon="export"
          onClick={props.onExport}
          data-tip="Export your reel"
          data-kbd="Ctrl+E"
        >
          Export reel
        </Button>
        <WindowControls />
      </div>
      {help && (
        <ContextMenu
          x={help.x}
          y={help.y}
          onClose={() => setHelp(null)}
          items={[
            { label: "Keyboard shortcuts", icon: "help", shortcut: "?", onSelect: props.onShortcuts },
            { separator: true },
            { label: "About Verso", icon: "info", onSelect: props.onAbout },
          ]}
        />
      )}
    </header>
  );
}
