import mark from "../../assets/brand/verso-mark.svg";
import { Button, IconButton, Segmented } from "../ui";
import type { AspectRatio } from "../../data/placeholder";

const RATIOS = ["9:16", "1:1", "16:9"] as const;

interface TopBarProps {
  projectName: string;
  onRename: (name: string) => void;
  aspect: AspectRatio;
  onAspect: (a: AspectRatio) => void;
  onHome: () => void;
  onAbout: () => void;
  onExport: () => void;
  onShare: () => void;
}

export function TopBar({
  projectName,
  onRename,
  aspect,
  onAspect,
  onHome,
  onAbout,
  onExport,
  onShare,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          type="button"
          className="topbar__home"
          onClick={onHome}
          aria-label="Back to start"
          title="Back to start"
        >
          <img src={mark} alt="" width={26} height={26} />
          <span className="topbar__wordmark">verso</span>
        </button>
        <span className="topbar__divider" />
        <input
          className="topbar__name"
          value={projectName}
          onChange={(e) => onRename(e.target.value)}
          aria-label="Project name"
          spellCheck={false}
        />
        <span className="topbar__crumb">› Reel 1 of 4</span>
      </div>

      <div className="topbar__center">
        <Segmented label="Aspect ratio" options={RATIOS} value={aspect} onChange={onAspect} />
      </div>

      <div className="topbar__right">
        <IconButton icon="undo" label="Undo (Ctrl+Z)" />
        <IconButton icon="redo" label="Redo (Ctrl+Shift+Z)" />
        <IconButton icon="help" label="About Verso" onClick={onAbout} />
        <Button icon="share" onClick={onShare}>
          Share
        </Button>
        <Button variant="primary" icon="export" onClick={onExport}>
          Export reel
        </Button>
      </div>
    </header>
  );
}
