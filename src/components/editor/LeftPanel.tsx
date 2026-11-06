import { Fragment, useState, type ReactNode } from "react";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { ContextMenu } from "../ContextMenu";
import { Icon, type IconName } from "../Icon";
import { Button, Segmented, type ToastMessage } from "../ui";
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
  { id: "boost", label: "Boost", icon: "auto-reel", smart: true },
];

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
  return (
    <>
      <nav className="rail" aria-label="Tools">
        {TABS.map((t, i) => (
          <Fragment key={t.id}>
            {t.smart && !TABS[i - 1]?.smart && <span className="rail__sep" role="separator" />}
            <button
              type="button"
              className={t.id === tab && panelOpen ? "rail__item is-active" : "rail__item"}
              aria-current={t.id === tab ? "page" : undefined}
              aria-expanded={t.id === tab ? panelOpen : undefined}
              data-tip={t.id === tab && panelOpen ? `Hide ${t.label}` : t.label}
              onClick={() => {
                if (t.id === tab) onTogglePanel();
                else {
                  onTab(t.id);
                  if (!panelOpen) onTogglePanel();
                }
              }}
            >
              <Icon name={t.icon} size={20} />
              <span>{t.label}</span>
            </button>
          </Fragment>
        ))}
      </nav>
      <aside className="panel" aria-label={TABS.find((t) => t.id === tab)?.label} hidden={!panelOpen}>
        {tab === "media" && (
          <MediaTab
            media={media}
            importing={importing}
            onImport={onImport}
            onAddToTimeline={onAddToTimeline}
          />
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
      </aside>
    </>
  );
}

function PanelHead({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="panel__head">
      <h2 className="panel__title">
        <Icon name={icon} size={20} />
        {title}
      </h2>
      {children && <p className="panel__lede">{children}</p>}
    </div>
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
  return (
    <div className="panel__body">
      <PanelHead icon="folder" title="Media">
        Your videos and sounds. Originals are never changed.
      </PanelHead>
      <Button
        icon="import"
        size="lg"
        className="btn--block"
        onClick={() => void onImport()}
        disabled={importing}
      >
        {importing ? "Reading your file…" : "Import video"}
      </Button>

      {media.length === 0 ? (
        <div className="empty">
          <Icon name="import" size={32} />
          <p className="empty__title">No media yet</p>
          <p>Imported videos and sounds show up here.</p>
        </div>
      ) : (
        <ul className="media-list">
          {media.map((m) => (
            <MediaItem key={m.path} media={m} onAdd={() => onAddToTimeline(m)} />
          ))}
        </ul>
      )}
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
    formatSize(m.sizeBytes),
  ];
  // Codecs stay off the surface (brand rule); the tooltip has them for the curious.
  const details = [
    m.fileName,
    m.width && m.height ? `${m.width}×${m.height}` : null,
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
        {cover ? <img src={cover} alt="" /> : <Icon name={m.hasVideo ? "play" : "music"} size={20} />}
        <span className="media-item__dur tc">{formatDuration(m.durationSec)}</span>
      </span>
      <span className="media-item__text">
        <span className="media-item__name">{m.fileName}</span>
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
      <div className="stack">
        {presets.map((p) => (
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
      <h3 className="section-label">Looks</h3>
      <div className="style-grid">
        {looks.map((s) => (
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
            title={s.label}
          >
            <img src={s.svg} alt="" draggable={false} />
          </button>
        ))}
      </div>
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
