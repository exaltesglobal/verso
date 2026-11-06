import { useCallback, useEffect, useRef, useState } from "react";
import type { ToastMessage } from "../components/ui";
import { TopBar } from "../components/editor/TopBar";
import { LeftPanel } from "../components/editor/LeftPanel";
import { Preview } from "../components/editor/Preview";
import { Inspector } from "../components/editor/Inspector";
import { Timeline, type TimelineEdit } from "../components/editor/Timeline";
import { ExportDialog } from "../components/editor/ExportDialog";
import { ContextMenu } from "../components/ContextMenu";
import type { MediaInfo } from "../lib/media";
import {
  addTextClip,
  appendMedia,
  deleteClip,
  findClip,
  linkedIds,
  moveClip,
  projectDuration,
  splitAtPlayhead,
  trimClip,
  updateClip,
  type AspectRatio,
  type Clip,
  type Project,
  type TextStyle,
} from "../lib/project";
import { autosaveProject, saveProject, saveProjectAs } from "../lib/persist";
import { useHistory } from "../lib/useHistory";
import { replaceCaptions } from "../lib/captions";
import type { CropPath } from "../lib/reframe";

export type PanelTab =
  | "media"
  | "autocut"
  | "magic"
  | "boost"
  | "templates"
  | "text"
  | "captions"
  | "audio"
  | "voice";

interface EditorProps {
  initialTab: PanelTab;
  initialProject: Project;
  media: MediaInfo[];
  importing: boolean;
  /** Opens the file picker; resolves with the files that were read. */
  onImport: () => Promise<MediaInfo[]>;
  onHome: () => void;
  onAbout: () => void;
  /** Opens another project (e.g. a reel picked in Auto-cut) in a fresh editor. */
  onOpenProject: (p: Project) => void;
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
  onOpenProject,
  notify,
}: EditorProps) {
  const [tab, setTab] = useState<PanelTab>(initialTab);
  const history = useHistory<Project>(initialProject);
  const project = history.state;
  const { set: setProject, replace: livePatch, commit, undo, redo } = history;
  const [time, setTime] = useState(() => Math.min(12, projectDuration(initialProject) * 0.4));
  const [playing, setPlaying] = useState(false);
  const [selectedClip, setSelectedClip] = useState(
    () => initialProject.tracks.find((t) => t.kind === "video")?.clips[0]?.id ?? "",
  );
  const [zoom, setZoom] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const last = useRef<number | null>(null);
  /**
   * Timeline time reported by the playing <video>, or null when no real media
   * is playing (gaps, sample clips). When set, the video is the master clock,
   * so picture, sound and playhead never drift apart.
   */
  const mediaClockRef = useRef<number | null>(null);
  // Keep the clock in step with seeks made while paused or playing.
  const timeRef = useRef(time);
  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  const duration = projectDuration(project);
  const aspect = project.aspect;

  // ---------- Playback clock ----------
  useEffect(() => {
    if (!playing) {
      last.current = null;
      return;
    }
    let raf = 0;
    const step = (now: number) => {
      const dt = last.current == null ? 0 : (now - last.current) / 1000;
      last.current = now;
      const next = Math.min(duration, mediaClockRef.current ?? timeRef.current + dt);
      timeRef.current = next;
      setTime(next);
      // Stop at the end instead of looping; Play starts again from 0.
      if (next >= duration) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration]);

  const togglePlay = useCallback(() => {
    if (duration <= 0) return;
    if (!playing && time >= duration - 0.05) setTime(0);
    setPlaying((p) => !p);
  }, [duration, playing, time]);

  // ---------- Autosave (debounced) ----------
  const firstSave = useRef(true);
  /** Edit not yet autosaved; flushed when the editor closes (Home, opening a reel). */
  const unsaved = useRef<Project | null>(null);
  useEffect(() => {
    if (firstSave.current) {
      firstSave.current = false;
      return;
    }
    if (project.tracks.every((t) => t.clips.length === 0)) return;
    unsaved.current = project;
    const t = window.setTimeout(() => {
      unsaved.current = null;
      autosaveProject(project).catch(() => {
        /* plain browser: nowhere to save */
      });
    }, 800);
    return () => window.clearTimeout(t);
  }, [project]);
  useEffect(
    () => () => {
      if (unsaved.current) autosaveProject(unsaved.current).catch(() => undefined);
    },
    [],
  );

  // ---------- Editing ----------
  const split = useCallback(() => {
    const { project: next, rightId } = splitAtPlayhead(project, time, selectedClip || undefined);
    if (next === project) {
      notify({ tone: "info", text: "Move the playhead over a clip to split it." });
      return;
    }
    setProject(next);
    if (rightId) setSelectedClip(rightId);
  }, [project, time, selectedClip, setProject, notify]);

  const remove = useCallback(
    (ripple = false) => {
      if (!selectedClip || !findClip(project, selectedClip)) return;
      setProject((p) => deleteClip(p, selectedClip, ripple));
      setSelectedClip("");
    },
    [project, selectedClip, setProject],
  );

  const save = useCallback(
    async (asNew = false) => {
      try {
        const saved = asNew ? await saveProjectAs(project) : await saveProject(project);
        if (saved) {
          setProject(saved);
          notify({ tone: "success", text: `Saved ${saved.name}.` });
        }
      } catch (err) {
        notify({ tone: "danger", text: `That didn't save. ${String(err)}` });
      }
    },
    [project, setProject, notify],
  );

  const onTimelineEdit = useCallback(
    (edit: TimelineEdit) => {
      switch (edit.type) {
        case "move":
          livePatch((p) => moveClip(p, edit.id, edit.delta));
          break;
        case "trim":
          livePatch((p) => trimClip(p, edit.id, edit.edge, edit.time));
          break;
        case "end":
          commit();
          break;
      }
    },
    [livePatch, commit],
  );

  const patchClip = useCallback(
    (id: string, patch: Partial<Clip>) =>
      setProject(
        (p) => {
          // Preview plays sound from the video clip, export from the Sound clip: keep the pair's volume equal.
          if (patch.volume === undefined) return updateClip(p, id, patch);
          let next = updateClip(p, id, patch);
          for (const other of linkedIds(p, id)) if (other !== id) next = updateClip(next, other, { volume: patch.volume });
          return next;
        },
        // Slider drags and typing become one undo step per field.
        `clip:${id}:${Object.keys(patch).join(",")}`,
      ),
    [setProject],
  );

  const addText = useCallback(
    (preset: TextStyle["preset"], text: string) => {
      const { project: next, id } = addTextClip(project, time, preset, text);
      setProject(next);
      setSelectedClip(id);
    },
    [project, time, setProject],
  );

  // ---------- Keyboard ----------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable='true']")) return;
      // Export, Settings, About and account dialogs own the keyboard while open.
      if (document.querySelector("[aria-modal='true']")) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (mod && key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (mod && (key === "y" || (key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (mod && key === "s") {
        e.preventDefault();
        void save(e.shiftKey);
      } else if (!mod && key === "s") {
        split();
      } else if (key === "delete" || key === "backspace") {
        e.preventDefault();
        remove(e.shiftKey);
      } else if (key === "arrowleft" || key === "arrowright") {
        e.preventDefault();
        const step = e.shiftKey ? 1 : 1 / 30;
        setTime((t) => Math.min(duration, Math.max(0, t + (key === "arrowleft" ? -step : step))));
      } else if (key === "home") {
        setTime(0);
      } else if (key === "end") {
        setTime(duration);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, undo, redo, save, split, remove, duration]);

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
    [setProject, notify],
  );

  const importAndAdd = useCallback(async () => {
    const items = await onImport();
    addToTimeline(items);
  }, [onImport, addToTimeline]);

  const selected = findClip(project, selectedClip);

  const applySmart = useCallback(
    (next: Project, message: string) => {
      setProject(next);
      notify({ tone: "success", text: message });
    },
    [setProject, notify],
  );
  // Captions go on the selected video clip, or the first one with a real file.
  const captionClip =
    (selected?.kind === "video" && selected.source ? selected : undefined) ??
    project.tracks.find((t) => t.kind === "video")?.clips.find((c) => c.source);

  const makeAll = useCallback(
    async (projects: Project[]) => {
      await Promise.all(projects.map((p) => autosaveProject(p).catch(() => undefined)));
      notify({ tone: "success", text: `${projects.length} reels are ready. Opening the first one.` });
      if (projects[0]) onOpenProject(projects[0]);
    },
    [notify, onOpenProject],
  );

  const setCropPath = useCallback(
    (path: CropPath | null) => {
      // ReframePanel sends null whenever it mounts without fresh speaker results (selecting,
      // splitting or reopening a clip). That must not wipe a crop the clip already has.
      if (!selectedClip || !path) return;
      setProject((p) => {
        const c = findClip(p, selectedClip);
        if (!c || c.kind !== "video" || path === c.cropPath) return p;
        return updateClip(p, selectedClip, { cropPath: path });
      });
    },
    [selectedClip, setProject],
  );

  return (
    <div className="editor">
      <TopBar
        projectName={project.name}
        subtitle={project.subtitle}
        onRename={(name) => livePatch((p) => ({ ...p, name }))}
        onRenameDone={commit}
        aspect={aspect}
        onAspect={(a: AspectRatio) => setProject((p) => ({ ...p, aspect: a }))}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onUndo={undo}
        onRedo={redo}
        onHome={onHome}
        onAbout={onAbout}
        onExport={() => {
          setPlaying(false);
          if (duration > 0) setExporting(true);
          else notify({ tone: "info", text: "Add a video before exporting." });
        }}
        onSave={() => void save(false)}
      />
      <LeftPanel
        time={time}
        tab={tab}
        onTab={setTab}
        media={media}
        importing={importing}
        onImport={importAndAdd}
        onAddToTimeline={(m) => addToTimeline([m])}
        onAddText={addText}
        captionClip={captionClip}
        captionStyleId={project.captionStyle ?? "bold-pop"}
        onCaptionStyle={(id) => setProject((p) => ({ ...p, captionStyle: id }))}
        onCaptions={(caps, clip) => setProject((p) => replaceCaptions(p, clip, caps))}
        onOpenProject={onOpenProject}
        onMakeAll={(ps) => void makeAll(ps)}
        project={project}
        onApply={applySmart}
        notify={notify}
      />
      <Preview
        project={project}
        duration={duration}
        aspect={aspect}
        time={time}
        playing={playing}
        onTogglePlay={togglePlay}
        mediaClockRef={mediaClockRef}
        onSeek={setTime}
        onImport={importAndAdd}
        importing={importing}
      />
      <Inspector
        clip={selected}
        aspect={aspect}
        onChange={(patch) => selected && patchClip(selected.id, patch)}
        onDelete={() => remove(false)}
        onCropPath={setCropPath}
        project={project}
        onApply={applySmart}
        time={time}
      />
      <Timeline
        project={project}
        duration={duration}
        time={time}
        onSeek={setTime}
        zoom={zoom}
        onZoom={setZoom}
        selectedClip={selectedClip}
        onSelectClip={setSelectedClip}
        onEdit={onTimelineEdit}
        onSplit={split}
        onDelete={() => remove(false)}
        onClipMenu={(id, x, y) => setMenu({ id, x, y })}
      />
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          items={[
            { label: "Split at playhead", shortcut: "S", onSelect: split },
            {
              label: "Add fade in",
              disabled: findClip(project, menu.id)?.kind !== "video",
              onSelect: () => patchClip(menu.id, { transitionIn: { kind: "fade", duration: 0.5 } }),
            },
            { separator: true },
            { label: "Delete", shortcut: "Del", onSelect: () => remove(false) },
            { label: "Delete and close the gap", shortcut: "Shift+Del", onSelect: () => remove(true) },
          ]}
        />
      )}
      {exporting && (
        <ExportDialog
          project={project}
          aspect={aspect}
          notify={notify}
          onClose={() => setExporting(false)}
        />
      )}
    </div>
  );
}
