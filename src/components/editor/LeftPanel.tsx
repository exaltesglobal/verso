import { useState, type ReactNode } from "react";
import { Icon, type IconName } from "../Icon";
import { Button, type ToastMessage } from "../ui";
import type { PanelTab } from "../../screens/Editor";
import { audioTracks, moments, templates } from "../../data/placeholder";
import { useFilmstrip } from "../../lib/filmstrip";
import { formatDuration, formatResolution, formatSize, type MediaInfo } from "../../lib/media";

const TABS: { id: PanelTab; label: string; icon: IconName }[] = [
  { id: "media", label: "Media", icon: "folder" },
  { id: "autocut", label: "Auto-cut", icon: "auto-cut" },
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
  notify: (m: ToastMessage) => void;
}

export function LeftPanel({
  tab,
  onTab,
  media,
  importing,
  onImport,
  onAddToTimeline,
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
        {tab === "autocut" && <AutoCutTab notify={notify} />}
        {tab === "templates" && <TemplatesTab />}
        {tab === "text" && <TextTab />}
        {tab === "captions" && <CaptionsTab />}
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
function AutoCutTab({ notify }: { notify: (m: ToastMessage) => void }) {
  const [picked, setPicked] = useState(moments[0].id);
  return (
    <div className="panel__body">
      <PanelHead icon="auto-cut" title="Auto-cut">
        We found 4 moments in your 42-minute video that work as reels. Pick one to start editing.
      </PanelHead>
      <ul className="moment-list">
        {moments.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              className={m.id === picked ? "moment is-selected" : "moment"}
              onClick={() => setPicked(m.id)}
              aria-pressed={m.id === picked}
            >
              <span
                className="moment__thumb"
                style={{ background: `linear-gradient(160deg, ${m.tint[0]}, ${m.tint[1]})` }}
              />
              <span className="moment__text">
                <span className="moment__title">{m.title}</span>
                <span className="moment__meta">
                  <span className="score">{m.hookScore}</span>
                  Hook score · {m.duration}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Button
        icon="one-click"
        size="lg"
        className="btn--block"
        onClick={() => notify({ tone: "info", text: "Making all 4 reels arrives with the auto-cut engine." })}
      >
        Make all 4 reels
      </Button>
    </div>
  );
}

function TemplatesTab() {
  return (
    <div className="panel__body">
      <PanelHead icon="templates" title="Templates">
        Ready-made looks. Apply one and swap in your own clips.
      </PanelHead>
      <div className="template-grid">
        {templates.map((t) => (
          <button key={t.id} type="button" className="template">
            <span
              className="template__thumb"
              style={{ background: `linear-gradient(170deg, ${t.tint[0]}, ${t.tint[1]})` }}
            >
              <span className="template__bar" />
              <span className="template__bar template__bar--short" />
            </span>
            <span className="template__name">{t.name}</span>
            <span className="template__uses">{t.uses}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TextTab() {
  const presets = [
    { label: "Add a title", cls: "text-preset--title" },
    { label: "Add a subtitle", cls: "text-preset--subtitle" },
    { label: "Add body text", cls: "text-preset--body" },
  ];
  return (
    <div className="panel__body">
      <PanelHead icon="text" title="Text">
        Add words on screen. Drag them onto the timeline.
      </PanelHead>
      <div className="stack">
        {presets.map((p) => (
          <button key={p.label} type="button" className={`text-preset ${p.cls}`}>
            {p.label}
          </button>
        ))}
      </div>
      <h3 className="section-label">Styles</h3>
      <div className="style-grid">
        {["Bold", "Outline", "Neon", "Boxed", "Serif", "Mono"].map((s) => (
          <button key={s} type="button" className={`style-tile style-tile--${s.toLowerCase()}`}>
            Aa
            <span>{s}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CaptionsTab() {
  const [style, setStyle] = useState("Bold");
  return (
    <div className="panel__body">
      <PanelHead icon="captions" title="Captions">
        Words appear as you speak. Most people watch reels with the sound off.
      </PanelHead>
      <div className="callout">
        <Icon name="voiceover" size={20} />
        <div>
          <strong>Auto captions are on</strong>
          <p>We'll write them from your voice when you import a video.</p>
        </div>
      </div>
      <h3 className="section-label">Caption style</h3>
      <div className="caption-styles">
        {["Bold", "Clean", "Pop"].map((s) => (
          <button
            key={s}
            type="button"
            className={
              s === style
                ? `caption-style caption-style--${s.toLowerCase()} is-selected`
                : `caption-style caption-style--${s.toLowerCase()}`
            }
            onClick={() => setStyle(s)}
            aria-pressed={s === style}
          >
            {s}
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
