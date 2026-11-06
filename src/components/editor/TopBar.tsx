import logo from "../../assets/brand/verso-logo-horizontal-dark-bg.svg";
import { Button, IconButton, Segmented } from "../ui";
import { AccountButton } from "../account/AccountButton";
import { CreditsBadge } from "../credits/CreditsBadge";
import { WindowControls } from "../WindowControls";
import type { AspectRatio } from "../../lib/project";

const RATIOS = ["9:16", "1:1", "16:9"] as const;

interface TopBarProps {
  projectName: string;
  subtitle?: string;
  onRename: (name: string) => void;
  onRenameDone: () => void;
  aspect: AspectRatio;
  onAspect: (a: AspectRatio) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onHome: () => void;
  onAbout: () => void;
  onExport: () => void;
  onSave: () => void;
}

export function TopBar(props: TopBarProps) {
  const { projectName, subtitle, onRename, onRenameDone, aspect, onAspect } = props;
  return (
    <header className="topbar" data-tauri-drag-region>
      <div className="topbar__left" data-tauri-drag-region>
        <button
          type="button"
          className="topbar__home"
          onClick={props.onHome}
          aria-label="Back to start"
          title="Back to start"
        >
          <img src={logo} alt="" className="topbar__logo" />
        </button>
        <span className="topbar__divider" />
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
      </div>

      <div className="topbar__center" data-tauri-drag-region>
        <Segmented label="Aspect ratio" options={RATIOS} value={aspect} onChange={onAspect} />
      </div>

      <div className="topbar__right" data-tauri-drag-region>
        <IconButton icon="undo" label="Undo (Ctrl+Z)" onClick={props.onUndo} disabled={!props.canUndo} />
        <IconButton
          icon="redo"
          label="Redo (Ctrl+Shift+Z)"
          onClick={props.onRedo}
          disabled={!props.canRedo}
        />
        <IconButton icon="help" label="About Verso" onClick={props.onAbout} />
        <CreditsBadge />
        <AccountButton />
        <Button icon="save" onClick={props.onSave} title="Save (Ctrl+S)">
          Save
        </Button>
        <Button variant="primary" icon="export" onClick={props.onExport}>
          Export reel
        </Button>
        <span className="topbar__sep" />
        <WindowControls />
      </div>
    </header>
  );
}
