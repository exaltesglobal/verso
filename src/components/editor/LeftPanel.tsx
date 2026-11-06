import type { ReactNode } from "react";
import { Icon, type IconName } from "../Icon";
import { Button, type ToastMessage } from "../ui";
import type { PanelTab } from "../../screens/Editor";
import { audioTracks } from "../../data/placeholder";
import { useFilmstrip } from "../../lib/filmstrip";
import { formatDuration, formatResolution, formatSize, type MediaInfo } from "../../lib/media";
import type { Clip, Project, TextStyle } from "../../lib/project";
import { AutoCutPanel } from "./AutoCutPanel";
import { TemplatesPanel } from "../smart/TemplatesPanel";
import { SmartToolsPanel } from "../smart/SmartToolsPanel";
import { BoostPanel } from "../insights/BoostPanel";
import { CaptionsPanel } from "./CaptionsPanel";
import { transcribeFile } from "../../lib/transcriber";

const TABS: { id: PanelTab; label: string; icon: IconName }[] = [
  { id: "media", label: "Media", icon: "folder" },
  { id: "autocut", label: "Auto-cut", icon: "auto-cut" },
  { id: "magic", label: "Magic", icon: "one-click" },
  { id: "boost", label: "Boost", icon: "auto-reel" },
  { id: "templates", label: "Templates", icon: "templates" },
  { id: "text", label: "Text", icon: "text" },
  { id: "captions", label: "Captions", icon: "captions" },
  { id: "audio", label: "Audio", icon: "music" },
];

interface LeftPanelProps {
  tab: PanelTab;
  onTab: (t: PanelTab) => void;
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
  tab,
  onTab,
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
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={t.id === tab ? "rail__item is-active" : "rail__item"}
            aria-current={t.id === tab ? "page" : undefined}
            onClick={() => onTab(t.id)}
          >
            <Icon name={t.icon} size={24} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
      <aside className="panel" aria-label={TABS.find((t) => t.id === tab)?.label}>
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
        {tab === "templates" && <TemplatesPanel media={media} project={project} onApply={onApply} />}
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
        {tab === "text" && <TextTab onAdd={onAddText} />}
        {tab === "captions" && (
          <CaptionsPanel
            clip={captionClip}
            styleId={captionStyleId}
            onStyleChange={onCaptionStyle}
            onApply={onCaptions}
            notify={notify}
          />
        )}
        {tab === "audio" && <AudioTab />}
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
          <p>Import a video to get started. We'll put it on your timeline.</p>
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
  // Middle frame makes a better cover than the first, which is often black.
  const cover = frames[Math.floor(frames.length / 2)];
  return (
    <li className="media-item" title={m.path}>
      <span className="media-item__thumb">
        {cover ? <img src={cover} alt="" /> : <Icon name={m.hasVideo ? "play" : "music"} size={20} />}
        <span className="media-item__dur">{formatDuration(m.durationSec)}</span>
      </span>
      <span className="media-item__text">
        <span className="media-item__name">{m.fileName}</span>
        <span className="media-item__meta">
          {[formatResolution(m), m.fps ? `${m.fps} fps` : null].filter(Boolean).join(" · ") || "Audio"}
        </span>
        <span className="media-item__meta muted">
          {[m.videoCodec?.toUpperCase(), m.audioCodec?.toUpperCase(), formatSize(m.sizeBytes)]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
      <button
        type="button"
        className="media-item__add"
        onClick={onAdd}
        aria-label={`Add ${m.fileName} to timeline`}
        title="Add to timeline"
      >
        <Icon name="add" size={20} />
      </button>
    </li>
  );
}
function TextTab({ onAdd }: { onAdd: (preset: TextStyle["preset"], text: string) => void }) {
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
    </div>
  );
}
function AudioTab() {
  return (
    <div className="panel__body">
      <PanelHead icon="music" title="Audio">
        Music that fits your reel. Beat-synced music lines cuts up with the beat.
      </PanelHead>
      <ul className="audio-list">
        {audioTracks.map((a) => (
          <li key={a.id}>
            <button type="button" className="audio-item">
              <span className="audio-item__play">
                <Icon name="play" size={16} />
              </span>
              <span className="audio-item__text">
                <span className="audio-item__name">{a.name}</span>
                <span className="audio-item__meta">{a.mood}</span>
              </span>
              <span className="audio-item__dur">{a.duration}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
