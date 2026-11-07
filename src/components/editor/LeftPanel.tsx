import { Fragment, useState, type ReactNode } from "react";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { ContextMenu } from "../ContextMenu";
import { Icon, type IconName } from "../Icon";
import { Button, IconButton, Segmented, type ToastMessage } from "../ui";
import type { PanelTab } from "../../screens/Editor";
import { useFilmstrip } from "../../lib/filmstrip";
import { formatDuration, formatSize, type MediaInfo } from "../../lib/media";
import type { Clip, Project, TextStyle } from "../../lib/project";
import { AutoCutPanel } from "./AutoCutPanel";
import { TemplatesPanel } from "../smart/TemplatesPanel";
import { SmartToolsPanel } from "../smart/SmartToolsPanel";
import { BoostPanel } from "../insights/BoostPanel";
import { BrandKitPanel } from "../brand/BrandKitPanel";
import { CaptionsPanel } from "./CaptionsPanel";
import { transcribeFile } from "../../lib/transcriber";
import { VoicePanel } from "../smart/VoicePanel";
import { SoundsPanel } from "../smart/SoundsPanel";
import { startMediaDrag } from "../../lib/mediaDrag";
import { EMOJI, SHAPES, addSticker, type Sticker } from "../../lib/stickers";
import { useVisibility } from "../../lib/modes";
import { MoreSettings } from "../MoreSettings";

/** Make tools first; the Smart group (tools that spend credits) after a divider. */
const TABS: { id: PanelTab; label: string; icon: IconName; smart?: boolean }[] = [
  { id: "media", label: "Media", icon: "folder" },
  { id: "templates", label: "Templates", icon: "templates" },
  { id: "text", label: "Text", icon: "text" },
  { id: "captions", label: "Captions", icon: "captions" },
  { id: "audio", label: "Audio", icon: "music" },
  { id: "voice", label: "Voice", icon: "voiceover" },
  { id: "autocut", label: "Auto-cut", icon: "auto-cut", smart: true },
  { id: "magic", label: "Magic", icon: "one-click", smart: true },
  { id: "boost", label: "Boost", icon: "boost", smart: true },
];

/** Quick's steps list: what each panel helps you do, in plain words. */
const STEPS: Partial<Record<PanelTab, { title: string; body: string }>> = {
  media: { title: "Add your video", body: "Bring in clips from your computer." },
  autocut: { title: "Make reels from a long video", body: "We find the best moments for you." },
  captions: { title: "Add captions", body: "Words on screen, written for you." },
  templates: { title: "Use a template", body: "A ready-made style. Drop your clips in." },
  text: { title: "Add text", body: "A title or a few words on screen." },
  audio: { title: "Add music", body: "Songs and sounds made for reels." },
};

/** Plain-language picture size for the media list: no codecs on the surface. */
function sizeLabel(m: MediaInfo): string | null {
  if (!m.width || !m.height) return null;
  const short = Math.min(m.width, m.height);
  const q = short >= 2160 ? "4K" : short >= 1440 ? "2K" : short >= 720 ? "HD" : "SD";
  return m.height > m.width ? `${q} vertical` : q;
}

interface LeftPanelProps {
  /** Playhead, in timeline seconds. */
  time: number;
  tab: PanelTab;
  onTab: (t: PanelTab) => void;
  /** Clicking the active tool collapses or opens the panel (Premiere/Figma pattern). */
  panelOpen: boolean;
  onTogglePanel: () => void;
  /** Quick: show the list of steps instead of a panel. */
  stepsList?: boolean;
  onStepsList?: () => void;
  /** Shown under the steps list (Quick's "Your reel" checklist). */
  stepsFooter?: ReactNode;
  media: MediaInfo[];
  importing: boolean;
  onImport: () => Promise<void>;
  onAddToTimeline: (m: MediaInfo) => void;
  onAddText: (preset: TextStyle["preset"], text: string) => void;
  captionClip: Clip | undefined;
  captionStyleId: string;
  onCaptionStyle: (id: string) => void;
  onCaptions: (captions: Clip[], clip: Clip) => void;
  onOpenProject: (p: Project) => void;
  onMakeAll: (projects: Project[]) => void;
  project: Project;
  onApply: (next: Project, message: string) => void;
  notify: (m: ToastMessage) => void;
}

export function LeftPanel({
  time,
  tab,
  onTab,
  panelOpen,
  onTogglePanel,
  stepsList,
  onStepsList,
  stepsFooter,
  media,
  importing,
  onImport,
  onAddToTimeline,
  onAddText,
  captionClip,
  captionStyleId,
  onCaptionStyle,
  onCaptions,
  onOpenProject,
  onMakeAll,
  project,
  onApply,
  notify,
}: LeftPanelProps) {
  const vis = useVisibility();
  const tabs = vis.tabs.flatMap((id) => TABS.filter((t) => t.id === id));
  const content = (
    <>
      {tab === "media" && (
        <MediaTab media={media} importing={importing} onImport={onImport} onAddToTimeline={onAddToTimeline} />
      )}
      {tab === "autocut" && (
        <AutoCutPanel
          media={media}
          importing={importing}
          onImport={onImport}
          transcribe={transcribeFile}
          onOpenProject={onOpenProject}
          onMakeAll={onMakeAll}
        />
      )}
      {tab === "templates" && <TemplatesTab media={media} project={project} onApply={onApply} />}
      {tab === "boost" && (
        <BoostPanel
          project={project}
          onApply={onApply}
          onFix={(fix) => {
            if (fix === "captions") onTab("captions");
            else if (fix === "pauses") onTab("magic");
            else if (fix === "music") onTab("audio");
            else if (fix === "aspect")
              onApply({ ...project, aspect: "9:16" }, "Switched to full-screen vertical.");
            else if (fix === "trim")
              notify({ tone: "info", text: "Trim the slow parts: drag a clip edge or split with S." });
          }}
        />
      )}
      {tab === "magic" && (
        <SmartToolsPanel
          project={project}
          onApply={onApply}
          onNeedCaptions={() => onTab("captions")}
          notify={notify}
        />
      )}
      {tab === "text" && (
        <TextTab
          onAdd={onAddText}
          onSticker={(s) => onApply(addSticker(project, time, s).project, `${s.label} sticker added.`)}
        />
      )}
      {tab === "captions" && (
        <CaptionsPanel
          clip={captionClip}
          styleId={captionStyleId}
          onStyleChange={onCaptionStyle}
          onApply={onCaptions}
          notify={notify}
          onAddVideo={() => void onImport()}
        />
      )}
      {tab === "audio" && <AudioTab project={project} time={time} onApply={onApply} />}
      {tab === "voice" && (
        <VoicePanel
          project={project}
          playhead={time}
          onApply={onApply}
          onNeedCaptions={() => onTab("captions")}
          notify={notify}
        />
      )}
    </>
  );

  if (vis.left === "steps") {
    const showList = stepsList || !vis.tabs.includes(tab);
    return (
      <aside
        className="panel panel--steps"
        aria-label={showList ? "Steps" : TABS.find((t) => t.id === tab)?.label}
      >
        {showList ? (
          <div className="panel__body">
            <div className="panel__head">
              <h2 className="panel__title">What do you want to do?</h2>
              <p className="panel__lede">Pick one. You can come back here any time.</p>
            </div>
            <div className="steps">
              {tabs.map((t) => (
                <button key={t.id} type="button" className="step-card" onClick={() => onTab(t.id)}>
                  <span className="step-card__icon">
                    <Icon name={t.icon} size={24} />
                  </span>
                  <span className="step-card__text">
                    <span className="step-card__title">{STEPS[t.id]?.title ?? t.label}</span>
                    <span className="step-card__body">{STEPS[t.id]?.body}</span>
                  </span>
                  <Icon name="chevron-right" size={16} className="step-card__go" />
                </button>
              ))}
            </div>
            {stepsFooter}
          </div>
        ) : (
          <>
            <button type="button" className="steps__back" onClick={onStepsList}>
              <Icon name="chevron-right" size={16} className="steps__back-icon" />
              All steps
            </button>
            {content}
          </>
        )}
      </aside>
    );
  }

  return (
    <>
      <nav className="rail" aria-label="Tools">
        {tabs.map((t, i) => (
          <Fragment key={t.id}>
            {t.smart && !tabs[i - 1]?.smart && <span className="rail__sep" role="separator" />}
            <button
              type="button"
              className={t.id === tab && panelOpen ? "rail__item is-active" : "rail__item"}
              aria-current={t.id === tab ? "page" : undefined}
              aria-expanded={t.id === tab ? panelOpen : undefined}
              data-tip={t.id === tab && panelOpen ? `Hide ${t.label}` : t.label}
              onClick={() => (t.id === tab ? onTogglePanel() : onTab(t.id))}
            >
              <Icon name={t.icon} size={20} />
              <span>{t.label}</span>
            </button>
          </Fragment>
        ))}
      </nav>
      <aside className="panel" aria-label={TABS.find((t) => t.id === tab)?.label} hidden={!panelOpen}>
        {content}
      </aside>
    </>
  );
}

function PanelHead({
  icon,
  title,
  actions,
  children,
}: {
  icon: IconName;
  title: string;
  /** Icon buttons on the right of the 36px header. */
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <>
      <div className="panel__head">
        <h2 className="panel__title">
          <Icon name={icon} size={20} />
          {title}
        </h2>
        {actions}
      </div>
      {children && <p className="panel__lede">{children}</p>}
    </>
  );
}

function MediaTab({
  media,
  importing,
  onImport,
  onAddToTimeline,
}: {
  media: MediaInfo[];
  importing: boolean;
  onImport: () => Promise<void>;
  onAddToTimeline: (m: MediaInfo) => void;
}) {
  const quick = useVisibility().left === "steps";
  const [q, setQ] = useState("");
  const shown = q ? media.filter((m) => m.fileName.toLowerCase().includes(q.toLowerCase())) : media;
  return (
    <div className="panel__body panel__body--media">
      <PanelHead
        icon="folder"
        title="Media"
        actions={
          <IconButton
            icon="import"
            label="Import video"
            size={16}
            onClick={() => void onImport()}
            disabled={importing}
          />
        }
      />
      {(quick || media.length === 0) && (
        <Button
          icon="import"
          size="lg"
          className="btn--block"
          onClick={() => void onImport()}
          disabled={importing}
        >
          {importing ? "Reading your file…" : "Import video"}
        </Button>
      )}

      {media.length === 0 ? (
        <div className="empty">
          <Icon name="import" size={32} />
          <p className="empty__title">No media yet</p>
          <p>Imported videos and sounds show up here. Originals are never changed.</p>
        </div>
      ) : (
        <>
          <label className="media-search">
            <Icon name="search" size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search media"
              aria-label="Search media"
              spellCheck={false}
            />
          </label>
          <ul className="media-list">
            {shown.map((m) => (
              <MediaItem key={m.path} media={m} onAdd={() => onAddToTimeline(m)} />
            ))}
          </ul>
        </>
      )}
      <p className="panel__foot">
        <Icon name="add" size={16} />
        Double-click a video to add it to the timeline
      </p>
    </div>
  );
}

function MediaItem({ media: m, onAdd }: { media: MediaInfo; onAdd: () => void }) {
  const frames = useFilmstrip(m);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  // Middle frame makes a better cover than the first, which is often black.
  const cover = frames[Math.floor(frames.length / 2)];
  const meta = [
    sizeLabel(m) ?? (m.hasVideo ? null : "Audio"),
    m.fps ? `${Math.round(m.fps)} fps` : null,
    formatDuration(m.durationSec),
  ];
  // Codecs stay off the surface (brand rule); the tooltip has them for the curious.
  const details = [
    m.fileName,
    m.width && m.height ? `${m.width}×${m.height}` : null,
    formatSize(m.sizeBytes),
    m.videoCodec?.toUpperCase(),
    m.audioCodec?.toUpperCase(),
  ];
  return (
    <li
      className="media-item"
      data-tip={details.filter(Boolean).join(" · ")}
      onPointerDown={(e) => startMediaDrag(e, m)}
      onDoubleClick={onAdd}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      <span className="media-item__thumb">
        {cover ? <img src={cover} alt="" /> : <Icon name={m.hasVideo ? "video" : "music"} size={20} />}
      </span>
      <span className="media-item__text">
        <span className="media-item__name">{m.fileName.replace(/\.[^.]+$/, "")}</span>
        <span className="media-item__meta">{meta.filter(Boolean).join(" · ")}</span>
      </span>
      <button
        type="button"
        className="media-item__add"
        onClick={onAdd}
        aria-label={`Add ${m.fileName} to timeline`}
      >
        <Icon name="add" size={16} />
        Add
      </button>
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          items={[
            { label: "Add to timeline", icon: "add", onSelect: onAdd },
            {
              label: "Show in folder",
              icon: "folder",
              onSelect: () => void revealItemInDir(m.path).catch(() => undefined),
            },
            {
              label: "Copy file path",
              onSelect: () => void navigator.clipboard?.writeText(m.path).catch(() => undefined),
            },
          ]}
        />
      )}
    </li>
  );
}
function TextTab({
  onAdd,
  onSticker,
}: {
  onAdd: (preset: TextStyle["preset"], text: string) => void;
  onSticker: (s: Sticker) => void;
}) {
  const presets: { label: string; cls: string; preset: TextStyle["preset"]; text: string }[] = [
    { label: "Add a title", cls: "text-preset--title", preset: "title", text: "Your big idea" },
    {
      label: "Add a subtitle",
      cls: "text-preset--subtitle",
      preset: "subtitle",
      text: "Say it in a few words",
    },
    { label: "Add body text", cls: "text-preset--body", preset: "body", text: "Add more detail here" },
  ];
  const looks: { label: string; preset: TextStyle["preset"] }[] = [
    { label: "Bold", preset: "title" },
    { label: "Outline", preset: "outline" },
    { label: "Neon", preset: "neon" },
    { label: "Boxed", preset: "boxed" },
    { label: "Subtitle", preset: "subtitle" },
    { label: "Body", preset: "body" },
  ];
  return (
    <div className="panel__body">
      <PanelHead icon="text" title="Text">
        Add words on screen. They start at the playhead; drag them on the timeline.
      </PanelHead>
      <Button icon="text" size="lg" className="btn--block" onClick={() => onAdd("title", "Your big idea")}>
        Add a title
      </Button>
      <h3 className="section-label">Looks</h3>
      <div className="style-grid">
        {looks.slice(0, 4).map((s) => (
          <button
            key={s.label}
            type="button"
            className={`style-tile text-look--${s.preset}`}
            onClick={() => onAdd(s.preset, s.label)}
          >
            Aa
            <span>{s.label}</span>
          </button>
        ))}
      </div>
      <MoreSettings>
        <div className="stack">
          {presets.slice(1).map((p) => (
            <button
              key={p.label}
              type="button"
              className={`text-preset ${p.cls}`}
              onClick={() => onAdd(p.preset, p.text)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="style-grid">
          {looks.slice(4).map((s) => (
            <button
              key={s.label}
              type="button"
              className={`style-tile text-look--${s.preset}`}
              onClick={() => onAdd(s.preset, s.label)}
            >
              Aa
              <span>{s.label}</span>
            </button>
          ))}
        </div>
        <h3 className="section-label">Stickers</h3>
        <div className="sticker-grid">
          {EMOJI.map((e) => (
            <button
              key={e}
              type="button"
              className="sticker-tile sticker-tile--emoji"
              onClick={() => onSticker({ id: e, label: e, emoji: e })}
              aria-label={`Add ${e}`}
            >
              {e}
            </button>
          ))}
          {SHAPES.map((s) => (
            <button
              key={s.id}
              type="button"
              className="sticker-tile"
              onClick={() => onSticker(s)}
              aria-label={`Add ${s.label}`}
              data-tip={s.label}
            >
              <img src={s.svg} alt="" draggable={false} />
            </button>
          ))}
        </div>
      </MoreSettings>
    </div>
  );
}
function AudioTab({
  project,
  time,
  onApply,
}: {
  project: Project;
  time: number;
  onApply: (next: Project, message: string) => void;
}) {
  return (
    <div className="panel__body">
      <PanelHead icon="music" title="Audio">
        Music and sound effects made for reels. Beat-synced music lines cuts up with the beat.
      </PanelHead>
      <SoundsPanel project={project} time={time} onApply={onApply} />
    </div>
  );
}

/** Templates and brand kits share one tab. */
function TemplatesTab({
  media,
  project,
  onApply,
}: {
  media: MediaInfo[];
  project: Project;
  onApply: (next: Project, message: string) => void;
}) {
  const [view, setView] = useState<"Templates" | "Brand kit">("Templates");
  return (
    <>
      <div className="panel__switch">
        <Segmented
          label="Templates or brand kit"
          options={["Templates", "Brand kit"] as const}
          value={view}
          onChange={setView}
        />
      </div>
      {view === "Templates" ? (
        <TemplatesPanel media={media} project={project} onApply={onApply} />
      ) : (
        <div className="panel__body">
          <BrandKitPanel project={project} onApply={onApply} />
        </div>
      )}
    </>
  );
}
