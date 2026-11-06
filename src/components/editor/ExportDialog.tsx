import { useEffect, useRef, useState } from "react";
import { basename, dirname, join, videoDir } from "@tauri-apps/api/path";
import { save } from "@tauri-apps/plugin-dialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { Button } from "../ui";
import type { ToastMessage } from "../ui";
import type { AspectRatio, Project } from "../../lib/project";
import {
  buildExportRequest,
  cancelExport,
  onExportEvents,
  startExport,
  type ExportQuality,
} from "../../lib/export";

const QUALITIES: { value: ExportQuality; title: string; hint: string }[] = [
  { value: "draft", title: "Quick preview", hint: "Smaller file, made fast. Good for checking your edit." },
  {
    value: "standard",
    title: "Best for posting",
    hint: "Sharp on every phone. Right for Reels, Shorts and TikTok.",
  },
  { value: "high", title: "Extra sharp", hint: "Bigger file. Best for keeping a master copy." },
];

type Phase =
  | { step: "setup"; error?: string }
  | { step: "running"; percent: number; etaSec: number | null; preparing: boolean }
  | { step: "done"; outputPath: string };

interface ExportDialogProps {
  project: Project;
  aspect: AspectRatio;
  onClose: () => void;
  notify: (m: ToastMessage) => void;
  /** Free plan adds a small "Made with Verso" mark. */
  watermark?: boolean;
}

const cleanName = (s: string) => s.replace(/[<>:"/\\|?*]+/g, "").trim();

function formatEta(sec: number | null) {
  if (sec == null) return "Working out how long this takes…";
  if (sec < 60) return "Less than a minute left";
  const m = Math.round(sec / 60);
  return m === 1 ? "About 1 minute left" : `About ${m} minutes left`;
}

export function ExportDialog({ project, aspect, onClose, notify, watermark = true }: ExportDialogProps) {
  const [name, setName] = useState(() => cleanName(project.name) || "My reel");
  const [folder, setFolder] = useState("");
  const [quality, setQuality] = useState<ExportQuality>("standard");
  const [phase, setPhase] = useState<Phase>({ step: "setup" });
  const jobId = useRef<string | null>(null);
  const running = phase.step === "running";

  useEffect(() => {
    videoDir()
      .then(setFolder)
      .catch(() => setFolder(""));
  }, []);

  // Events for our job only; the job id is set once start_export returns.
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let alive = true;
    onExportEvents({
      progress: (p) =>
        p.jobId === jobId.current &&
        setPhase({
          step: "running",
          percent: p.percent,
          etaSec: p.etaSec,
          preparing: p.stage === "preparing",
        }),
      done: (d) => {
        if (d.jobId !== jobId.current) return;
        jobId.current = null;
        setPhase({ step: "done", outputPath: d.outputPath });
        notify({ tone: "success", text: "Your reel is ready." });
      },
      error: (e) => {
        if (e.jobId !== jobId.current) return;
        jobId.current = null;
        setPhase({ step: "setup", error: e.cancelled ? undefined : e.message });
        if (e.cancelled) notify({ tone: "info", text: "Export cancelled." });
      },
    }).then((u) => (alive ? (unlisten = u) : u()));
    return () => {
      alive = false;
      unlisten?.();
    };
  }, [notify]);

  // Escape closes, except mid-export (Cancel is explicit).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !running && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, onClose]);

  const chooseLocation = async () => {
    const picked = await save({
      title: "Save reel as",
      defaultPath: folder ? await join(folder, `${name}.mp4`) : `${name}.mp4`,
      filters: [{ name: "Video", extensions: ["mp4"] }],
    });
    if (!picked) return;
    setFolder(await dirname(picked));
    setName(cleanName(await basename(picked, ".mp4")) || name);
  };

  const begin = async () => {
    const file = cleanName(name);
    if (!file || !folder) {
      setPhase({ step: "setup", error: "Choose a file name and a folder first." });
      return;
    }
    try {
      const outputPath = await join(folder, `${file}.mp4`);
      setPhase({ step: "running", percent: 0, etaSec: null, preparing: true });
      jobId.current = await startExport(
        buildExportRequest(project, aspect, { quality, outputPath, watermark }),
      );
    } catch (err) {
      jobId.current = null;
      setPhase({ step: "setup", error: String(err) });
    }
  };

  const cancel = () => {
    if (jobId.current) void cancelExport(jobId.current);
  };

  return (
    <div className="modal-backdrop" onMouseDown={() => !running && onClose()}>
      <div
        className="export"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {phase.step === "setup" && (
          <>
            <h2 id="export-title" className="export__title">
              Export reel
            </h2>

            <label className="export__label" htmlFor="export-name">
              File name
            </label>
            <input
              id="export-name"
              className="export__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              spellCheck={false}
              autoFocus
            />

            <span className="export__label">Save to</span>
            <div className="export__folder">
              <span className="export__path" title={folder}>
                {folder || "Choose a folder"}
              </span>
              <Button icon="folder" onClick={() => void chooseLocation()}>
                Change
              </Button>
            </div>

            <span className="export__label" id="export-quality">
              Quality
            </span>
            <div className="export__qualities" role="radiogroup" aria-labelledby="export-quality">
              {QUALITIES.map((q) => (
                <button
                  key={q.value}
                  type="button"
                  role="radio"
                  aria-checked={quality === q.value}
                  className={quality === q.value ? "export__quality is-active" : "export__quality"}
                  onClick={() => setQuality(q.value)}
                >
                  <span className="export__quality-title">{q.title}</span>
                  <span className="export__quality-hint">{q.hint}</span>
                </button>
              ))}
            </div>

            {phase.error && (
              <p className="export__error" role="alert">
                {phase.error}
              </p>
            )}

            <div className="export__actions">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              <Button variant="primary" icon="export" onClick={() => void begin()}>
                Export
              </Button>
            </div>
          </>
        )}

        {phase.step === "running" && (
          <>
            <h2 id="export-title" className="export__title">
              {phase.preparing ? "Getting ready…" : `Exporting… ${Math.floor(phase.percent)}%`}
            </h2>
            <div
              className="export__bar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.floor(phase.percent)}
            >
              <span className="export__bar-fill" style={{ width: `${phase.percent}%` }} />
            </div>
            <p className="export__hint">
              {phase.preparing ? "Checking your clips." : formatEta(phase.etaSec)}
            </p>
            <div className="export__actions">
              <Button onClick={cancel}>Cancel</Button>
            </div>
          </>
        )}

        {phase.step === "done" && (
          <>
            <h2 id="export-title" className="export__title">
              Your reel is ready
            </h2>
            <p className="export__hint export__done-path" title={phase.outputPath}>
              {phase.outputPath}
            </p>
            <div className="export__actions">
              <Button variant="ghost" onClick={onClose}>
                Done
              </Button>
              <Button
                variant="primary"
                icon="folder"
                onClick={() =>
                  void revealItemInDir(phase.outputPath).catch(() =>
                    notify({ tone: "danger", text: "We couldn't open that folder." }),
                  )
                }
              >
                Open folder
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
