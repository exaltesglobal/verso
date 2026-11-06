import { useCallback, useEffect, useState } from "react";
import { About } from "./components/About";
import { Splash } from "./components/Splash";
import { Toast, type ToastMessage } from "./components/ui";
import { pickAndProbe, type MediaInfo } from "./lib/media";
import { Welcome } from "./screens/Welcome";
import { Editor, type PanelTab } from "./screens/Editor";
import { sampleProject } from "./data/placeholder";
import { appendMedia, emptyProject, type Project } from "./lib/project";

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
  const openAbout = useCallback(() => setShowAbout(true), []);
  const closeAbout = useCallback(() => setShowAbout(false), []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => setShowSplash(false), reduce ? 600 : 1500);
    return () => window.clearTimeout(t);
  }, []);

  const notify = useCallback((message: ToastMessage) => setToast(message), []);

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
          notify={notify}
        />
      )}
      {showAbout && <About onClose={closeAbout} />}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      {showSplash && <Splash />}
    </>
  );
}
