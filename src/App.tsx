import { useCallback, useEffect, useRef, useState } from "react";
import { About } from "./components/About";
import { Splash } from "./components/Splash";
import { Settings } from "./screens/Settings";
import { Batch } from "./screens/Batch";
import { Toast, type ToastMessage } from "./components/ui";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { pickAndProbe, probeMedia, type MediaInfo } from "./lib/media";
import { Welcome } from "./screens/Welcome";
import { Editor, type PanelTab } from "./screens/Editor";
import { sampleProject } from "./data/placeholder";
import { appendMedia, emptyProject, type Project } from "./lib/project";
import { listProjects, openAutosaved, openProjectFile, type ProjectSummary } from "./lib/persist";

type Screen = "welcome" | "editor" | "batch";

/** Videos longer than this (and wider than tall) start in Auto-cut. */
const LONG_VIDEO_SEC = 120;

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [screen, setScreen] = useState<Screen>("welcome");
  const [startTab, setStartTab] = useState<PanelTab>("media");
  const [startProject, setStartProject] = useState<Project>(() => emptyProject());
  const [session, setSession] = useState(0);
  const [media, setMedia] = useState<MediaInfo[]>([]);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [recents, setRecents] = useState<ProjectSummary[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const openAbout = useCallback(() => setShowAbout(true), []);
  const closeAbout = useCallback(() => setShowAbout(false), []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => setShowSplash(false), reduce ? 600 : 1500);
    return () => window.clearTimeout(t);
  }, []);

  const notify = useCallback((message: ToastMessage) => setToast(message), []);

  // Refresh recent projects whenever the Welcome screen shows.
  useEffect(() => {
    if (screen !== "welcome") return;
    listProjects()
      .then(setRecents)
      .catch(() => setRecents([]));
  }, [screen]);

  /** Media files a project uses, so the Media panel shows them. */
  const mediaOf = (p: Project) => {
    const seen = new Map<string, MediaInfo>();
    for (const t of p.tracks) for (const c of t.clips) if (c.source) seen.set(c.source.path, c.source);
    return [...seen.values()];
  };

  const openExisting = (p: Project) => {
    setMedia(mediaOf(p));
    setStartTab("media");
    setStartProject(p);
    setSession((s) => s + 1);
    setScreen("editor");
  };

  // Dev only: open files listed in VERSO_DEV_OPEN straight into a new project.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    let cancelled = false;
    invoke<string[]>("dev_startup_media")
      .then((paths) => Promise.all(paths.map(probeMedia)))
      .then((items) => {
        if (cancelled || !items.length) return;
        setMedia(items);
        setStartTab("media");
        setStartProject(appendMedia(emptyProject("Dev project"), items));
        setSession((s) => s + 1);
        setScreen("editor");
      })
      .catch(() => {
        /* plain browser or no dev files */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Native file dialog -> Rust probe_media -> media bin. Resolves with the files that were read. */
  const importMedia = useCallback(async (): Promise<MediaInfo[]> => {
    setImporting(true);
    try {
      const { items, errors } = await pickAndProbe();
      if (items.length) {
        setMedia((prev) => {
          const known = new Set(prev.map((m) => m.path));
          return [...items.filter((m) => !known.has(m.path)), ...prev];
        });
        notify({
          tone: "success",
          text:
            items.length === 1
              ? `${items[0].fileName} is ready to edit.`
              : `${items.length} files are ready to edit.`,
        });
      }
      if (errors.length) notify({ tone: "danger", text: errors[0].message });
      return items;
    } catch (err) {
      notify({ tone: "danger", text: `That didn't work. ${String(err)}` });
      return [];
    } finally {
      setImporting(false);
    }
  }, [notify]);

  const openEditor = (tab: PanelTab, project: Project) => {
    setStartTab(tab);
    setStartProject(project);
    setSession((s) => s + 1);
    setScreen("editor");
  };

  /** Picks the right flow for new files: a long landscape video goes to Auto-cut, anything else to editing. */
  const startWith = (items: MediaInfo[], forceAutoCut = false) => {
    if (!items.length) return;
    const first = items[0];
    const name = first.fileName.replace(/\.[^.]+$/, "");
    const longWide = first.durationSec > LONG_VIDEO_SEC && (first.width ?? 0) > (first.height ?? 0);
    if (forceAutoCut || longWide) openEditor("autocut", emptyProject(name));
    else openEditor("media", appendMedia(emptyProject(name), items));
  };

  // Dropping a file anywhere on the start screen starts the right flow.
  const [dropping, setDropping] = useState(false);
  const startRef = useRef(startWith);
  useEffect(() => {
    startRef.current = startWith;
  });
  useEffect(() => {
    if (screen !== "welcome") return;
    let off: (() => void) | undefined;
    let alive = true;
    getCurrentWebview()
      .onDragDropEvent((e) => {
        const p = e.payload;
        if (p.type === "over" || p.type === "enter") setDropping(true);
        else if (p.type === "leave") setDropping(false);
        else if (p.type === "drop") {
          setDropping(false);
          Promise.allSettled(p.paths.map(probeMedia)).then((rs) => {
            const items = rs.flatMap((r) =>
              r.status === "fulfilled" && (r.value.hasVideo || r.value.hasAudio) ? [r.value] : [],
            );
            if (!items.length)
              return notify({ tone: "danger", text: "Couldn't read that file. Try a video." });
            setMedia((prev) => [...items, ...prev.filter((m) => !items.some((i) => i.path === m.path))]);
            startRef.current(items);
          });
        }
      })
      .then((u) => (alive ? (off = u) : u()))
      .catch(() => {}); // plain browser preview
    return () => {
      alive = false;
      off?.();
    };
  }, [screen, notify]);

  return (
    <>
      {screen === "batch" ? (
        <Batch
          onClose={() => setScreen("welcome")}
          onOpenReels={() => setScreen("welcome")}
          notify={notify}
        />
      ) : screen === "welcome" ? (
        <Welcome
          importing={importing}
          dropping={dropping}
          onNewProject={() => openEditor("media", emptyProject())}
          onImport={async () => {
            const items = await importMedia();
            if (items.length)
              openEditor(
                "media",
                appendMedia(emptyProject(items[0].fileName.replace(/\.[^.]+$/, "")), items),
              );
          }}
          onMakeClips={async () => startWith(await importMedia(), true)}
          onTemplate={() => openEditor("templates", emptyProject())}
          onOpenSample={() => openEditor("media", sampleProject())}
          recents={recents}
          onSettings={() => setShowSettings(true)}
          onBatch={() => setScreen("batch")}
          onOpenRecent={(id) =>
            openAutosaved(id)
              .then(openExisting)
              .catch((e) => notify({ tone: "danger", text: String(e) }))
          }
          onOpenFile={() =>
            openProjectFile()
              .then((p) => p && openExisting(p))
              .catch((e) => notify({ tone: "danger", text: String(e) }))
          }
          onAbout={openAbout}
        />
      ) : (
        <Editor
          key={session}
          initialTab={startTab}
          initialProject={startProject}
          media={media}
          importing={importing}
          onImport={importMedia}
          onHome={() => setScreen("welcome")}
          onAbout={openAbout}
          onOpenProject={openExisting}
          notify={notify}
        />
      )}
      {showAbout && <About onClose={closeAbout} />}
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      {showSplash && <Splash />}
    </>
  );
}
