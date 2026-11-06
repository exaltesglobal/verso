import { useCallback, useEffect, useState } from "react";
import { About } from "./components/About";
import { Splash } from "./components/Splash";
import { Toast, type ToastMessage } from "./components/ui";
import { pickAndProbe, type MediaInfo } from "./lib/media";
import { Welcome } from "./screens/Welcome";
import { Editor, type PanelTab } from "./screens/Editor";

type Screen = "welcome" | "editor";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [screen, setScreen] = useState<Screen>("welcome");
  const [startTab, setStartTab] = useState<PanelTab>("media");
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

  /** Native file dialog -> Rust probe_media -> media bin. Returns true if anything was added. */
  const importMedia = useCallback(async () => {
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
      return items.length > 0;
    } catch (err) {
      notify({ tone: "danger", text: `That didn't work. ${String(err)}` });
      return false;
    } finally {
      setImporting(false);
    }
  }, [notify]);

  const openEditor = (tab: PanelTab) => {
    setStartTab(tab);
    setScreen("editor");
  };

  return (
    <>
      {screen === "welcome" ? (
        <Welcome
          importing={importing}
          onNewProject={() => openEditor("media")}
          onImport={async () => {
            if (await importMedia()) openEditor("media");
          }}
          onMakeClips={() => openEditor("autocut")}
          onAbout={openAbout}
        />
      ) : (
        <Editor
          key={startTab}
          initialTab={startTab}
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
