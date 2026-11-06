import { useEffect, useRef, useState } from "react";
import { basename, dirname, join, videoDir } from "@tauri-apps/api/path";
import { save } from "@tauri-apps/plugin-dialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { Button, Progress, Segmented } from "../ui";
import { HandoffPanel } from "./HandoffPanel";
import { Modal } from "../Modal";
import { ProBadge } from "../account/ProBadge";
import { PublishDialog } from "../publish/PublishDialog";
import { useEntitlements } from "../../lib/entitlements";
import { getSettings } from "../../lib/settings";
import type { ToastMessage } from "../ui";
import type { AspectRatio, Project } from "../../lib/project";
import {
  buildExportRequest,
  cancelExport,
  onExportEvents,
  startExport,
  type ExportQuality,
} from "../../lib/export";

const TABS = ["Video", "Hand off to a pro editor"] as const;

const QUALITIES: { value: ExportQuality; title: string; hint: string }[] = [
  { value: "draft", title: "Quick preview", hint: "Smaller file, made fast. Good for checking your edit." },
  {
    value: "standard",
    title: "Best for posting",
    hint: "Sharp on every phone. Right for Reels, Shorts and TikTok.",
  },
  { value: "high", title: "Extra sharp", hint: "Bigger file. Best for keeping a master copy." },
  { value: "ultra", title: "4K", hint: "Four times the detail. Big file, takes longer." },
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
}

const cleanName = (s: string) => s.replace(/[<>:"/\\|?*]+/g, "").trim();

function formatEta(sec: number | null) {
  if (sec == null) return "Working out how long this takes…";
  if (sec < 60) return "Less than a minute left";
  const m = Math.round(sec / 60);
  return m === 1 ? "About 1 minute left" : `About ${m} minutes left`;
}

export function ExportDialog({ project, aspect, onClose, notify }: ExportDialogProps) {
  const { can, openUpgrade } = useEntitlements();
  const [name, setName] = useState(() => cleanName(project.name) || "My reel");
  const [folder, setFolder] = useState(() => getSettings().exportFolder);
  const [quality, setQuality] = useState<ExportQuality>(() => {
    const q = getSettings().exportQuality;
    return q === "ultra" && !can("export_4k") ? "high" : q;
  });
  const [fps, setFps] = useState(30);
  const [phase, setPhase] = useState<Phase>({ step: "setup" });
  const [publishing, setPublishing] = useState(false);
  const [background, setBackground] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Video");
  const handoff = tab === TABS[1];
  const jobId = useRef<string | null>(null);
  const running = phase.step === "running";

  useEffect(() => {
    if (getSettings().exportFolder) return;
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
        notify({
          tone: "success",
          text: "Your reel is ready.",
          action: {
            label: "Open folder",
            run: () => void revealItemInDir(d.outputPath).catch(() => undefined),
          },
        });
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
      jobId.current = await startExport(buildExportRequest(project, aspect, { quality, outputPath, fps }));
    } catch (err) {
      jobId.current = null;
      setPhase({ step: "setup", error: String(err) });
    }
  };

  const cancel = () => {
    if (jobId.current) void cancelExport(jobId.current);
  };

  const title =
    phase.step === "setup"
      ? "Export reel"
      : phase.step === "running"
        ? phase.preparing
          ? "Getting ready…"
          : "Exporting your reel"
        : "Your reel is ready";

  // Running in the background: the dialog steps aside for a progress toast with Cancel.
  if (background && phase.step === "running")
    return (
      <div className="toast toast--job" role="status">
        <div className="toast__job">
          <Progress
            value={phase.preparing ? undefined : phase.percent}
            label={phase.preparing ? "Getting your reel ready…" : "Exporting your reel"}
            eta={phase.preparing ? undefined : formatEta(phase.etaSec)}
          />
        </div>
        <button type="button" className="toast__action" onClick={() => setBackground(false)}>
          Show
        </button>
        <button type="button" className="toast__action" onClick={cancel}>
          Cancel
        </button>
      </div>
    );

  const footer =
    phase.step === "setup" && handoff ? (
      <Button variant="ghost" onClick={onClose}>
        Close
      </Button>
    ) : phase.step === "setup" ? (
      <>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" icon="export" onClick={() => void begin()}>
          Export
        </Button>
      </>
    ) : phase.step === "running" ? (
      <>
        <Button variant="ghost" onClick={cancel}>
          Cancel export
        </Button>
        <Button onClick={() => setBackground(true)}>Keep editing</Button>
      </>
    ) : (
      <>
        <Button variant="ghost" onClick={onClose} className="modal__dismiss">
          Done
        </Button>
        <Button icon="share" onClick={() => setPublishing(true)}>
          Send to Surecast
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
      </>
    );

  return (
    <>
      <Modal
        title={title}
        onClose={onClose}
        dismissable={!running && !publishing}
        footer={footer}
        className="export"
      >
        {phase.step === "setup" && (
          <Segmented options={TABS} value={tab} onChange={setTab} label="Export as" />
        )}
        {phase.step === "setup" && handoff && (
          <HandoffPanel project={project} notify={notify} onPickVideo={() => setTab("Video")} />
        )}
        {phase.step === "setup" && !handoff && (
          <>
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
              <span className="export__path" data-tip={folder || undefined}>
                {folder || "Choose a folder"}
              </span>
              <Button icon="folder" onClick={() => void chooseLocation()}>
                Change
              </Button>
            </div>

            <span className="export__label" id="export-quality">
              Quality
            </span>
            <div
              className="export__qualities export__qualities--4"
              role="radiogroup"
              aria-labelledby="export-quality"
            >
              {QUALITIES.map((q) => (
                <button
                  key={q.value}
                  type="button"
                  role="radio"
                  aria-checked={quality === q.value}
                  className={quality === q.value ? "export__quality is-active" : "export__quality"}
                  onClick={() =>
                    q.value === "ultra" && !can("export_4k")
                      ? openUpgrade("4K export is part of Verso Pro.")
                      : setQuality(q.value)
                  }
                >
                  <span className="export__quality-title">
                    {q.title} {q.value === "ultra" && <ProBadge />}
                  </span>
                  <span className="export__quality-hint">{q.hint}</span>
                </button>
              ))}
            </div>

            <span className="export__label" id="export-fps">
              Smoothness
            </span>
            <div className="export__qualities" role="radiogroup" aria-labelledby="export-fps">
              {[
                { value: 30, title: "30 fps", hint: "Standard for Reels and Shorts." },
                { value: 60, title: "60 fps", hint: "Smoother motion. Bigger file." },
              ].map((f) => (
                <button
                  key={f.value}
                  type="button"
                  role="radio"
                  aria-checked={fps === f.value}
                  className={fps === f.value ? "export__quality is-active" : "export__quality"}
                  onClick={() =>
                    f.value > 30 && !can("export_4k")
                      ? openUpgrade("60 fps export is part of Verso Pro.")
                      : setFps(f.value)
                  }
                >
                  <span className="export__quality-title">
                    {f.title} {f.value > 30 && <ProBadge />}
                  </span>
                  <span className="export__quality-hint">{f.hint}</span>
                </button>
              ))}
            </div>

            {phase.error && (
              <p className="export__error" role="alert">
                {phase.error}
              </p>
            )}
          </>
        )}

        {phase.step === "running" && (
          <Progress
            value={phase.preparing ? undefined : phase.percent}
            label={phase.preparing ? "Checking your clips…" : "Putting your reel together…"}
            eta={phase.preparing ? undefined : formatEta(phase.etaSec)}
          />
        )}

        {phase.step === "done" && (
          <p className="export__hint export__done-path" data-tip={phase.outputPath}>
            {phase.outputPath}
          </p>
        )}
      </Modal>
      {publishing && phase.step === "done" && (
        <PublishDialog
          outputPath={phase.outputPath}
          project={project}
          aspect={aspect}
          onClose={() => setPublishing(false)}
        />
      )}
    </>
  );
}
