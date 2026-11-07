import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { join, videoDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { Button } from "../ui";
import type { ToastMessage } from "../ui";
import { getSettings } from "../../lib/settings";
import { handoffFiles, type HandoffTarget } from "../../lib/handoff";
import type { Project } from "../../lib/project";

type Choice = HandoffTarget | "video";

const CHOICES: { value: Choice; title: string; hint: string }[] = [
  {
    value: "premiere",
    title: "Open in Premiere Pro",
    hint: "Saves a project file Premiere Pro can open, with your cuts, speed and framing. Captions come as a subtitle file.",
  },
  {
    value: "resolve",
    title: "Open in DaVinci Resolve",
    hint: "Saves a timeline Resolve (or Final Cut Pro) can open, with your cuts, framing, text and captions.",
  },
  { value: "video", title: "Just the video (MP4)", hint: "One finished video file that any editor can use." },
];

interface HandoffPanelProps {
  project: Project;
  notify: (m: ToastMessage) => void;
  /** "Just the video": go back to the normal video export. */
  onPickVideo: () => void;
}

const cleanName = (s: string) => s.replace(/[<>:"/\\|?*]+/g, "").trim();

/** "Hand off to a pro editor" tab of the export dialog. */
export function HandoffPanel({ project, notify, onPickVideo }: HandoffPanelProps) {
  const [target, setTarget] = useState<HandoffTarget>("premiere");
  const [folder, setFolder] = useState(() => getSettings().exportFolder);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string[] | null>(null);
  const [error, setError] = useState<string>();
  const hasVideo = project.tracks.some((t) => t.kind === "video" && t.clips.some((c) => c.source?.hasVideo));

  useEffect(() => {
    if (getSettings().exportFolder) return;
    videoDir()
      .then(setFolder)
      .catch(() => setFolder(""));
  }, []);

  const chooseFolder = async () => {
    const picked = await open({
      directory: true,
      title: "Save the project files in",
      defaultPath: folder || undefined,
    });
    if (typeof picked === "string") setFolder(picked);
  };

  const save = async () => {
    if (!folder) return setError("Choose a folder first.");
    setBusy(true);
    setError(undefined);
    try {
      const files = handoffFiles(project, target, cleanName(project.name) || "My reel");
      const paths: string[] = [];
      for (const [name, contents] of Object.entries(files)) {
        const path = await join(folder, name);
        // save_project_as writes any text atomically (it only rewrites JSON).
        await invoke("save_project_as", { path, json: contents });
        paths.push(path);
      }
      setSaved(paths);
      notify({ tone: "success", text: "Project files saved." });
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  const showFolder = (path: string) =>
    void revealItemInDir(path).catch(() => notify({ tone: "danger", text: "We couldn't open that folder." }));

  if (saved)
    return (
      <>
        <p className="export__hint">
          Saved {saved.length} files. Open the folder and follow the "read me" file to open it in{" "}
          {target === "premiere" ? "Premiere Pro" : "DaVinci Resolve"}. Keep your original videos where they
          are.
        </p>
        <ul className="export__hint">
          {saved.map((p) => (
            <li key={p} className="export__done-path" data-tip={p}>
              {p.split(/[\\/]/).pop()}
            </li>
          ))}
        </ul>
        <div className="export__folder">
          <Button variant="primary" icon="folder" onClick={() => showFolder(saved[0])}>
            Show in folder
          </Button>
          <Button variant="ghost" onClick={() => setSaved(null)}>
            Save again
          </Button>
        </div>
      </>
    );

  return (
    <>
      <span className="export__label" id="handoff-choice">
        Where do you want to keep editing?
      </span>
      <div className="export__qualities" role="radiogroup" aria-labelledby="handoff-choice">
        {CHOICES.map((c) => (
          <button
            key={c.value}
            type="button"
            role="radio"
            aria-checked={target === c.value}
            className={target === c.value ? "export__quality is-active" : "export__quality"}
            onClick={() => (c.value === "video" ? onPickVideo() : setTarget(c.value))}
          >
            <span className="export__quality-title">{c.title}</span>
            <span className="export__quality-hint">{c.hint}</span>
          </button>
        ))}
      </div>

      <span className="export__label">Save to</span>
      <div className="export__folder">
        <span className="export__path" data-tip={folder || undefined}>
          {folder || "Choose a folder"}
        </span>
        <Button icon="folder" onClick={() => void chooseFolder()}>
          Change
        </Button>
      </div>

      <p className="export__hint">
        Looks, colour, transitions and animations stay in Verso; the read-me file lists anything left out.
      </p>
      {error && (
        <p className="export__error" role="alert">
          {error}
        </p>
      )}
      <div className="export__folder">
        <Button variant="primary" icon="export" onClick={() => void save()} disabled={busy || !hasVideo}>
          {busy ? "Saving…" : "Save project files"}
        </Button>
      </div>
      {!hasVideo && <p className="export__hint">Add a video to the timeline first.</p>}
    </>
  );
}
