import { useEffect, useRef, useState } from "react";
import type { ToastMessage } from "../components/ui";
import { TopBar } from "../components/editor/TopBar";
import { LeftPanel } from "../components/editor/LeftPanel";
import { Preview } from "../components/editor/Preview";
import { Inspector } from "../components/editor/Inspector";
import { Timeline } from "../components/editor/Timeline";
import { REEL_DURATION, tracks, type AspectRatio } from "../data/placeholder";
import type { MediaInfo } from "../lib/media";

export type PanelTab = "media" | "autocut" | "templates" | "text" | "captions" | "audio";

interface EditorProps {
  initialTab: PanelTab;
  media: MediaInfo[];
  importing: boolean;
  onImport: () => Promise<boolean>;
  onHome: () => void;
  onAbout: () => void;
  notify: (m: ToastMessage) => void;
}

export function Editor({ initialTab, media, importing, onImport, onHome, onAbout, notify }: EditorProps) {
  const [tab, setTab] = useState<PanelTab>(initialTab);
  const [projectName, setProjectName] = useState("Podcast Ep. 42");
  const [aspect, setAspect] = useState<AspectRatio>("9:16");
  const [time, setTime] = useState(12);
  const [playing, setPlaying] = useState(false);
  const [selectedClip, setSelectedClip] = useState("v1");
  const [zoom, setZoom] = useState(1);
  const last = useRef<number | null>(null);

  // Simulated playback until the media engine lands.
  useEffect(() => {
    if (!playing) {
      last.current = null;
      return;
    }
    let raf = 0;
    const step = (now: number) => {
      const dt = last.current == null ? 0 : (now - last.current) / 1000;
      last.current = now;
      setTime((t) => (t + dt >= REEL_DURATION ? 0 : t + dt));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // Space plays and pauses, unless the user is typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, [contenteditable='true']")) return;
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const clip = tracks
    .flatMap((t) => t.clips.map((c) => ({ ...c, kind: t.kind })))
    .find((c) => c.id === selectedClip);

  return (
    <div className="editor">
      <TopBar
        projectName={projectName}
        onRename={setProjectName}
        aspect={aspect}
        onAspect={setAspect}
        onHome={onHome}
        onAbout={onAbout}
        onExport={() => notify({ tone: "info", text: "Export is coming in the next beta build." })}
        onShare={() => notify({ tone: "info", text: "Sharing is coming soon." })}
      />
      <LeftPanel
        tab={tab}
        onTab={setTab}
        media={media}
        importing={importing}
        onImport={onImport}
        notify={notify}
      />
      <Preview
        aspect={aspect}
        time={time}
        playing={playing}
        onTogglePlay={() => setPlaying((p) => !p)}
        onSeek={setTime}
      />
      <Inspector clip={clip} aspect={aspect} />
      <Timeline
        time={time}
        onSeek={setTime}
        zoom={zoom}
        onZoom={setZoom}
        selectedClip={selectedClip}
        onSelectClip={setSelectedClip}
      />
    </div>
  );
}
