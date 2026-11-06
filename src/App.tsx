import { useCallback, useEffect, useState } from "react";
import { About } from "./components/About";
import { Splash } from "./components/Splash";
import { Toast, type ToastMessage } from "./components/ui";
import { invoke } from "@tauri-apps/api/core";
import { pickAndProbe, probeMedia, type MediaInfo } from "./lib/media";
import { Welcome } from "./screens/Welcome";
import { Editor, type PanelTab } from "./screens/Editor";
import { sampleProject } from "./data/placeholder";
import { appendMedia, emptyProject, type Project } from "./lib/project";
import { listProjects, openAutosaved, openProjectFile, type ProjectSummary } from "./lib/persist";

type Screen = "welcome" | "editor";

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

  return (
    <>
      {screen === "welcome" ? (
        <Welcome
          importing={importing}
          onNewProject={() => openEditor("media", emptyProject())}
          onImport={async () => {
            const items = await importMedia();
            if (items.length) {
              const name = items[0].fileName.replace(/\.[^.]+$/, "");
              openEditor("media", appendMedia(emptyProject(name), items));
            }
          }}
          onMakeClips={() => openEditor("autocut", sampleProject())}
          onOpenSample={() => openEditor("media", sampleProject())}
          recents={recents}
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
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      {showSplash && <Splash />}
    </>
  );
}
