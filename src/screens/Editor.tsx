import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ToastMessage } from "../components/ui";
import { TopBar } from "../components/editor/TopBar";
import { LeftPanel } from "../components/editor/LeftPanel";
import { Preview } from "../components/editor/Preview";
import { Inspector } from "../components/editor/Inspector";
import {
  Timeline,
  type TimelineEdit,
  type TimelineTool,
  type TrackFlag,
} from "../components/editor/Timeline";
import { ShortcutSheet } from "../components/ShortcutSheet";
import { IconButton } from "../components/ui";
import { clampZoom, useLayout } from "../lib/layout";
import { FPS } from "../lib/timecode";
import { ExportDialog } from "../components/editor/ExportDialog";
import { ContextMenu } from "../components/ContextMenu";
import type { MediaInfo } from "../lib/media";
import {
  addTextClip,
  appendMedia,
  deleteClip,
  findClip,
  linkedIds,
  isLocked,
  moveClip,
  playableProject,
  projectDuration,
  splitClip,
  splitAtPlayhead,
  trimClip,
  updateClip,
  type AspectRatio,
  type Clip,
  type Project,
  type TextStyle,
  type TrackKind,
} from "../lib/project";
import { autosaveProject, saveProject, saveProjectAs } from "../lib/persist";
import { useHistory } from "../lib/useHistory";
import { replaceCaptions } from "../lib/captions";
import type { CropPath } from "../lib/reframe";
import { setMode, useMode, VISIBILITY, type Mode } from "../lib/modes";
import { actionsFor, oneTap } from "../lib/oneTap";
import { redoTimeSaved, undoTimeSaved } from "../lib/timeSaved";
import { useOneTapRunner } from "../components/workspaces/useOneTapRunner";
import { OneTapPanel } from "../components/workspaces/OneTapPanel";
import { MakeItBetter } from "../components/workspaces/MakeItBetter";
import { BusyBlock } from "../components/workspaces/BusyBlock";
import { ReelChecklist } from "../components/workspaces/ReelChecklist";
import { CraftWorkspace, QuickWorkspace, StudioWorkspace } from "../components/workspaces/Workspaces";

const WORKSPACE = { quick: QuickWorkspace, craft: CraftWorkspace, studio: StudioWorkspace } as const;

export type PanelTab =
  "media" | "autocut" | "magic" | "boost" | "templates" | "text" | "captions" | "audio" | "voice";

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
  const mode = useMode();
  const vis = VISIBILITY[mode];
  /** Quick shows a list of steps until one is picked. */
  const [stepsList, setStepsList] = useState(initialTab === "media");
  const [switching, setSwitching] = useState(false);
  const switchMode = useCallback(
    (m: Mode) => {
      if (m === mode) return;
      const hint = setMode(m);
      if (hint) notify({ tone: "info", text: hint });
      setSwitching(true);
      window.setTimeout(() => setSwitching(false), 200);
    },
    [mode, notify],
  );
  const history = useHistory<Project>(initialProject);
  const project = history.state;
  const { set: setProject, replace: livePatch, commit, undo: undoStep, redo: redoStep, redoTarget } = history;
  // One-tap edits record time saved against their history entry; undo and redo keep the total honest.
  const undo = useCallback(() => {
    if (history.canUndo) undoTimeSaved(project);
    undoStep();
  }, [history.canUndo, project, undoStep]);
  const redo = useCallback(() => {
    redoTimeSaved(redoTarget);
    redoStep();
  }, [redoTarget, redoStep]);
  const [time, setTime] = useState(() => Math.min(12, projectDuration(initialProject) * 0.4));
  const [playing, setPlaying] = useState(false);
  const [selectedClip, setSelectedClip] = useState(
    () => initialProject.tracks.find((t) => t.kind === "video")?.clips[0]?.id ?? "",
  );
  const [zoom, setZoom] = useState(1);
  const [fitSignal, setFitSignal] = useState(0);
  const [snapping, setSnapping] = useState(() => localStorage.getItem("verso.snap") !== "0");
  const toggleSnap = useCallback(
    () =>
      setSnapping((s) => {
        localStorage.setItem("verso.snap", s ? "0" : "1");
        return !s;
      }),
    [],
  );
  const [tool, setTool] = useState<TimelineTool>("select");
  const toggleTrack = useCallback(
    (kind: TrackKind, flag: TrackFlag) =>
      setProject((p) => ({
        ...p,
        tracks: p.tracks.map((t) => (t.kind === kind ? { ...t, [flag]: !t[flag] } : t)),
      })),
    [setProject],
  );
  const addMarker = useCallback(() => {
    const at = Math.round(time * FPS) / FPS;
    setProject((p) => {
      const ms = p.markers ?? [];
      // A second press on the same frame removes the marker.
      const next = ms.some((m) => Math.abs(m - at) < 0.5 / FPS)
        ? ms.filter((m) => Math.abs(m - at) >= 0.5 / FPS)
        : [...ms, at].sort((a, b) => a - b);
      return { ...p, markers: next };
    });
  }, [time, setProject]);
  const jumpMarker = useCallback(
    (dir: -1 | 1) => {
      const ms = project.markers ?? [];
      const t = dir > 0 ? ms.find((m) => m > time + 1e-3) : [...ms].reverse().find((m) => m < time - 1e-3);
      if (t !== undefined) setTime(t);
    },
    [project.markers, time],
  );
  const razor = useCallback(
    (id: string, at: number) => {
      const { project: next, rightId } = splitClip(project, id, Math.round(at * FPS) / FPS);
      if (next === project) return;
      setProject(next);
      if (rightId) setSelectedClip(rightId);
    },
    [project, setProject],
  );
  const [exporting, setExporting] = useState(false);
  /** An export finished in this session (ticks "Export" in Quick's checklist). */
  const [exported, setExported] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [trackMenu, setTrackMenu] = useState<{ kind: TrackKind; x: number; y: number } | null>(null);
  const { layout, startDrag, reset: resetSplit, toggle: togglePanel, toggleFocus } = useLayout();
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
  /** What plays and exports: hidden tracks drop out, muted tracks go silent. */
  const playable = useMemo(() => playableProject(project), [project]);
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
  /** The last project autosave finished with; the top bar shows "Saving…" until it catches up. */
  const [savedProject, setSavedProject] = useState<Project>(initialProject);
  const [saveFailed, setSaveFailed] = useState(false);
  useEffect(() => {
    if (firstSave.current) {
      firstSave.current = false;
      return;
    }
    const empty = project.tracks.every((tr) => tr.clips.length === 0);
    if (!empty) unsaved.current = project;
    const t = window.setTimeout(() => {
      if (empty) return setSavedProject(project);
      unsaved.current = null;
      autosaveProject(project)
        .then(() => {
          setSaveFailed(false);
          setSavedProject(project);
        })
        .catch(() => {
          /* plain browser: nowhere to save */
          setSaveFailed(!!(window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
          setSavedProject(project);
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
  const lockedNote = useCallback(
    () => notify({ tone: "info", text: "That track is locked. Unlock it in the track header to change it." }),
    [notify],
  );

  const split = useCallback(() => {
    const target = selectedClip && findClip(project, selectedClip) ? selectedClip : undefined;
    if (
      target
        ? isLocked(project, target)
        : project.tracks.some((t) => t.locked && (t.kind === "video" || t.kind === "audio"))
    )
      return lockedNote();
    const { project: next, rightId } = splitAtPlayhead(project, time, selectedClip || undefined);
    if (next === project) {
      notify({ tone: "info", text: "Move the playhead over a clip to split it." });
      return;
    }
    setProject(next);
    if (rightId) setSelectedClip(rightId);
  }, [project, time, selectedClip, setProject, notify, lockedNote]);

  const remove = useCallback(
    (ripple = false) => {
      if (!selectedClip || !findClip(project, selectedClip)) return;
      if (isLocked(project, selectedClip)) return lockedNote();
      setProject((p) => deleteClip(p, selectedClip, ripple));
      setSelectedClip("");
    },
    [project, selectedClip, setProject, lockedNote],
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

  const startExport = useCallback(() => {
    setPlaying(false);
    if (duration > 0) setExporting(true);
    else notify({ tone: "info", text: "Add a video before exporting." });
  }, [duration, notify]);

  const onTimelineEdit = useCallback(
    (edit: TimelineEdit) => {
      switch (edit.type) {
        case "move":
          livePatch((p) => moveClip(p, edit.id, edit.delta));
          break;
        case "trim":
          livePatch((p) => trimClip(p, edit.id, edit.edge, edit.time));
          break;
        case "slip":
          // Slip: the clip stays put; which part of its file shows moves (linked sound too).
          livePatch((p) => {
            const c = findClip(p, edit.id);
            if (!c?.source) return p;
            const len = c.end - c.start;
            const inPoint = Math.min(
              Math.max(0, (c.inPoint ?? 0) - edit.delta),
              Math.max(0, c.source.durationSec - len),
            );
            let next = p;
            for (const id of linkedIds(p, edit.id)) next = updateClip(next, id, { inPoint });
            return next;
          });
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
          for (const other of linkedIds(p, id))
            if (other !== id) next = updateClip(next, other, { volume: patch.volume });
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
  // Tooltips show shortcut keys in Studio only (premium.css reads this).
  useEffect(() => {
    document.documentElement.dataset.mode = mode;
    return () => {
      delete document.documentElement.dataset.mode;
    };
  }, [mode]);
  const proShortcuts = vis.proShortcuts;
  /** Studio extras: timeline tools, markers, track toggles. */
  const studio = vis.keyframes;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // The target can be the window or document (not an Element) when nothing has focus.
      const el = e.target;
      if (el instanceof Element && el.closest("input, textarea, select, [contenteditable='true']")) return;
      // Export, Settings, About and account dialogs own the keyboard while open.
      if (document.querySelector("[aria-modal='true']")) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      // Quick keeps the everyday keys; pro transport, zoom and ripple keys belong to Craft and Studio.
      const pro =
        (!mod &&
          ["k", "l", "j", "n", "arrowleft", "arrowright", "home", "end", "=", "+", "-", "_"].includes(key)) ||
        e.code === "Backslash" ||
        ((key === "delete" || key === "backspace") && e.shiftKey);
      if (pro && !proShortcuts) return;
      if (studio && !mod && ["v", "c", "y", "m"].includes(key)) {
        if (key === "v") setTool("select");
        else if (key === "c") setTool("razor");
        else if (key === "y") setTool("slip");
        else if (e.shiftKey) jumpMarker(-1);
        else addMarker();
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (!mod && key === "k") {
        setPlaying(false);
      } else if (!mod && key === "l") {
        if (!playing) togglePlay();
      } else if (!mod && key === "j") {
        // No reverse playback yet: J pauses and steps back a second per press (hold to repeat).
        setPlaying(false);
        setTime((t) => Math.max(0, Math.round((t - 1) * FPS) / FPS));
      } else if (mod && key === "e") {
        e.preventDefault();
        startExport();
      } else if (mod && e.code === "Backslash") {
        e.preventDefault();
        toggleFocus();
      } else if (!mod && e.code === "Backslash") {
        setFitSignal((n) => n + 1);
      } else if (!mod && (e.key === "=" || e.key === "+")) {
        setZoom((z) => clampZoom(z * 1.5));
      } else if (!mod && (e.key === "-" || e.key === "_")) {
        setZoom((z) => clampZoom(z / 1.5));
      } else if (!mod && key === "n") {
        toggleSnap();
      } else if (e.key === "?") {
        setShowShortcuts(true);
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
        // One frame, or a second with Shift; always land on the frame grid.
        const step = e.shiftKey ? 1 : 1 / FPS;
        setTime((t) =>
          Math.min(duration, Math.max(0, Math.round((t + (key === "arrowleft" ? -step : step)) * FPS) / FPS)),
        );
      } else if (key === "home") {
        setTime(0);
      } else if (key === "end") {
        setTime(duration);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    togglePlay,
    undo,
    redo,
    save,
    split,
    remove,
    duration,
    playing,
    startExport,
    toggleFocus,
    toggleSnap,
    proShortcuts,
    studio,
    addMarker,
    jumpMarker,
  ]);

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
      // Every smart edit is one undo step; the toast makes "undo everything" visible.
      notify({ tone: "success", text: message, action: { label: "Undo", run: undo } });
    },
    [setProject, notify, undo],
  );
  const runner = useOneTapRunner({ project, setProject, undo, notify });
  const openTab = useCallback(
    (t: PanelTab) => {
      setTab(t);
      setStepsList(false);
      togglePanel("leftOpen", true);
    },
    [togglePanel],
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

  // Studio sizes come from the drag handles; Craft uses the spec's fixed sizes (premium.css).
  const editorStyle = (
    vis.resizable
      ? {
          "--left-w": layout.leftOpen ? `${layout.left}px` : "0px",
          "--insp-w": layout.inspOpen ? `${layout.insp}px` : "0px",
          "--tl-h": `${layout.tl}px`,
        }
      : {
          ...(layout.leftOpen ? {} : { "--left-w": "0px" }),
          ...(layout.inspOpen ? {} : { "--insp-w": "0px" }),
        }
  ) as CSSProperties;

  const clipMenu = menu ? findClip(project, menu.id) : undefined;
  const menuKind = menu ? project.tracks.find((t) => t.clips.some((c) => c.id === menu.id))?.kind : undefined;
  const Workspace = WORKSPACE[mode];
  const quick = vis.right === "oneTap";

  return (
    <Workspace
      style={editorStyle}
      switching={switching}
      topBar={
        <TopBar
          projectName={project.name}
          subtitle={project.subtitle}
          onRename={(name) => livePatch((p) => ({ ...p, name }))}
          onRenameDone={commit}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onUndo={undo}
          onRedo={redo}
          onHome={onHome}
          onAbout={onAbout}
          onShortcuts={() => setShowShortcuts(true)}
          onExport={startExport}
          saveState={saveFailed ? "error" : savedProject === project ? "saved" : "saving"}
          onSave={() => void save(false)}
          mode={mode}
          onMode={switchMode}
        />
      }
      left={
        <LeftPanel
          time={time}
          tab={tab}
          onTab={openTab}
          panelOpen={quick || layout.leftOpen}
          onTogglePanel={() => togglePanel("leftOpen")}
          stepsList={stepsList}
          onStepsList={() => setStepsList(true)}
          stepsFooter={
            <ReelChecklist
              project={project}
              exported={exported}
              onAddVideo={() => openTab("media")}
              onCaptions={() => openTab("captions")}
              onFit={() => void runner.run(oneTap("fit-9-16"))}
              onExport={startExport}
            />
          }
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
      }
      makeItBetter={vis.makeItBetter ? <MakeItBetter project={project} runner={runner} /> : undefined}
      preview={
        <Preview
          project={playable}
          duration={duration}
          aspect={aspect}
          onAspect={(a: AspectRatio) => setProject((p) => ({ ...p, aspect: a }))}
          time={time}
          playing={playing}
          onTogglePlay={togglePlay}
          mediaClockRef={mediaClockRef}
          onSeek={setTime}
          onImport={importAndAdd}
          importing={importing}
          bar={vis.previewBar}
        />
      }
      right={
        quick ? (
          <OneTapPanel
            project={project}
            clip={selected}
            runner={runner}
            onChange={(patch) => selected && patchClip(selected.id, patch)}
            onDelete={() => remove(false)}
          />
        ) : layout.inspOpen ? (
          <Inspector
            clip={selected}
            aspect={aspect}
            onChange={(patch) => selected && patchClip(selected.id, patch)}
            onDelete={() => remove(false)}
            onCropPath={setCropPath}
            project={project}
            onApply={applySmart}
            time={time}
            onCollapse={() => togglePanel("inspOpen", false)}
          />
        ) : (
          <IconButton
            icon="chevron-right"
            label="Show properties"
            shortcut="Ctrl+\"
            className="inspector-reopen"
            onClick={() => togglePanel("inspOpen", true)}
          />
        )
      }
      timeline={
        <Timeline
          project={project}
          duration={duration}
          time={time}
          playing={playing}
          onSeek={setTime}
          zoom={zoom}
          onZoom={setZoom}
          fitSignal={fitSignal}
          selectedClip={selectedClip}
          onSelectClip={setSelectedClip}
          onEdit={onTimelineEdit}
          onSplit={split}
          onDelete={() => remove(false)}
          snapping={snapping}
          onToggleSnap={toggleSnap}
          onClipMenu={(id, x, y) => setMenu({ id, x, y })}
          onTrackMenu={(kind, x, y) => setTrackMenu({ kind, x, y })}
          onEmptyTrack={(kind) => {
            if (kind === "text") addText("title", "Your big idea");
            else openTab(kind === "captions" ? "captions" : "audio");
          }}
          tracks={vis.tracks}
          thinTracks={quick ? ["text", "music"] : undefined}
          headers={vis.trackHeaders}
          tools={vis.timelineTools}
          onMute={
            quick
              ? () => selected && patchClip(selected.id, { volume: (selected.volume ?? 1) === 0 ? 1 : 0 })
              : undefined
          }
          selectedMuted={selected?.volume === 0}
          trackToggles={studio}
          onTrackFlag={toggleTrack}
          toolRow={studio}
          tool={studio ? tool : "select"}
          onTool={setTool}
          onRazor={razor}
          markers={project.markers}
          onAddMarker={addMarker}
          onJumpMarker={jumpMarker}
        />
      }
      splitters={
        vis.resizable ? (
          <>
            {/* Drag handles between panels: 1px line, 6px hit area; double-click resets. */}
            {layout.leftOpen && (
              <div
                className="splitter splitter--v splitter--left"
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize tools panel"
                onPointerDown={(e) => startDrag("left", e)}
                onDoubleClick={() => resetSplit("left")}
              />
            )}
            {layout.inspOpen && (
              <div
                className="splitter splitter--v splitter--insp"
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize properties panel"
                onPointerDown={(e) => startDrag("insp", e)}
                onDoubleClick={() => resetSplit("insp")}
              />
            )}
            <div
              className="splitter splitter--h splitter--tl"
              role="separator"
              aria-orientation="horizontal"
              aria-label="Resize timeline"
              onPointerDown={(e) => startDrag("tl", e)}
              onDoubleClick={() => resetSplit("tl")}
            />
          </>
        ) : undefined
      }
      overlays={
        <>
          {menu && (
            <ContextMenu
              x={menu.x}
              y={menu.y}
              onClose={() => setMenu(null)}
              items={[
                { label: "Split at playhead", icon: "split", shortcut: "S", onSelect: split },
                {
                  label: "Add fade in",
                  icon: "transitions",
                  disabled: menuKind !== "video",
                  onSelect: () => patchClip(menu.id, { transitionIn: { kind: "fade", duration: 0.5 } }),
                },
                ...(menuKind
                  ? [
                      { separator: true as const },
                      ...actionsFor(menuKind).map((a) => ({
                        label: a.label,
                        icon: a.icon,
                        disabled: !!a.blocked(project) || !!runner.busy,
                        onSelect: () => void runner.run(a, clipMenu),
                      })),
                    ]
                  : []),
                { separator: true },
                {
                  label: "Delete",
                  icon: "delete",
                  shortcut: "Del",
                  danger: true,
                  onSelect: () => remove(false),
                },
                {
                  label: "Delete and close the gap",
                  shortcut: "Shift+Del",
                  danger: true,
                  onSelect: () => remove(true),
                },
              ]}
            />
          )}
          {trackMenu && (
            <ContextMenu
              x={trackMenu.x}
              y={trackMenu.y}
              onClose={() => setTrackMenu(null)}
              items={[
                trackMenu.kind === "text"
                  ? {
                      label: "Add text at playhead",
                      icon: "text",
                      onSelect: () => addText("title", "Your big idea"),
                    }
                  : trackMenu.kind === "captions"
                    ? {
                        label: "Make captions",
                        icon: "captions",
                        onSelect: () => openTab("captions"),
                      }
                    : trackMenu.kind === "music"
                      ? {
                          label: "Browse music",
                          icon: "music",
                          onSelect: () => openTab("audio"),
                        }
                      : { label: "Import media", icon: "import", onSelect: () => void importAndAdd() },
                { separator: true },
                {
                  label: "Zoom to fit",
                  icon: "zoom-fit",
                  shortcut: "\\",
                  onSelect: () => setFitSignal((n) => n + 1),
                },
                {
                  label: snapping ? "Turn snapping off" : "Turn snapping on",
                  icon: "magnet",
                  shortcut: "N",
                  onSelect: toggleSnap,
                },
              ]}
            />
          )}
          {exporting && (
            <ExportDialog
              project={playable}
              aspect={aspect}
              notify={notify}
              onClose={() => setExporting(false)}
              onExported={() => setExported(true)}
            />
          )}
          {showShortcuts && <ShortcutSheet onClose={() => setShowShortcuts(false)} />}
          <BusyBlock runner={runner} />
        </>
      }
    />
  );
}
