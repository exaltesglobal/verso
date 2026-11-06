import { useCallback, useEffect, useRef, useState } from "react";
import type { ToastMessage } from "../components/ui";
import { TopBar } from "../components/editor/TopBar";
import { LeftPanel } from "../components/editor/LeftPanel";
import { Preview } from "../components/editor/Preview";
import { Inspector } from "../components/editor/Inspector";
import { Timeline } from "../components/editor/Timeline";
import type { MediaInfo } from "../lib/media";
import { appendMedia, findClip, projectDuration, type AspectRatio, type Project } from "../lib/project";

export type PanelTab = "media" | "autocut" | "templates" | "text" | "captions" | "audio";

interface EditorProps {
  initialTab: PanelTab;
  initialProject: Project;
  media: MediaInfo[];
  importing: boolean;
  /** Opens the file picker; resolves with the files that were read. */
  onImport: () => Promise<MediaInfo[]>;
  onHome: () => void;
  onAbout: () => void;
  notify: (m: ToastMessage) => void;
}

export function Editor({
  initialTab,
  initialProject,
  media,
  importing,
  onImport,
  onHome,
  onAbout,
  notify,
}: EditorProps) {
  const [tab, setTab] = useState<PanelTab>(initialTab);
  const [project, setProject] = useState<Project>(initialProject);
  const [aspect, setAspect] = useState<AspectRatio>("9:16");
  const [time, setTime] = useState(() => Math.min(12, projectDuration(initialProject) * 0.4));
  const [playing, setPlaying] = useState(false);
  const [selectedClip, setSelectedClip] = useState(
    () => initialProject.tracks.find((t) => t.kind === "video")?.clips[0]?.id ?? "",
  );
  const [zoom, setZoom] = useState(1);
  const last = useRef<number | null>(null);

  const duration = projectDuration(project);

  // Playback clock. The preview shows the nearest real frame until full
  // video playback lands.
  useEffect(() => {
    if (!playing) {
      last.current = null;
      return;
    }
    let raf = 0;
    const step = (now: number) => {
      const dt = last.current == null ? 0 : (now - last.current) / 1000;
      last.current = now;
      setTime((t) => (t + dt >= duration ? 0 : t + dt));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration]);

  // Space plays and pauses, unless the user is typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, [contenteditable='true']")) return;
      if (e.code === "Space" && duration > 0) {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [duration]);

  const addToTimeline = useCallback(
    (items: MediaInfo[]) => {
      if (!items.length) return;
      setProject((p) => appendMedia(p, items));
      notify({
        tone: "success",
        text:
          items.length === 1
            ? `Added ${items[0].fileName} to your timeline.`
            : `Added ${items.length} clips to your timeline.`,
      });
    },
    [notify],
  );

  const importAndAdd = useCallback(async () => {
    const items = await onImport();
    addToTimeline(items);
  }, [onImport, addToTimeline]);

  return (
    <div className="editor">
      <TopBar
        projectName={project.name}
        subtitle={project.subtitle}
        onRename={(name) => setProject((p) => ({ ...p, name }))}
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
        onImport={importAndAdd}
        onAddToTimeline={(m) => addToTimeline([m])}
        notify={notify}
      />
      <Preview
        project={project}
        duration={duration}
        aspect={aspect}
        time={time}
        playing={playing}
        onTogglePlay={() => duration > 0 && setPlaying((p) => !p)}
        onSeek={setTime}
        onImport={importAndAdd}
        importing={importing}
      />
      <Inspector clip={findClip(project, selectedClip)} aspect={aspect} />
      <Timeline
        project={project}
        duration={duration}
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
