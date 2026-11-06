import { useState, type CSSProperties } from "react";
import { Icon } from "../Icon";
import { Button } from "../ui";
import { frameAt, useFilmstrip } from "../../lib/filmstrip";
import { formatDuration, type MediaInfo } from "../../lib/media";
import type { Project } from "../../lib/project";
import { TEMPLATE_PACKS, TEMPLATES, applyTemplate, type Template, type TemplateSlot } from "../../templates";
import type { PackId } from "../../templates/types";

export interface TemplatesPanelProps {
  /** Imported media; video files can fill slots. */
  media: MediaInfo[];
  /** Current project: its music is kept, its clips are replaced. */
  project?: Project;
  /** Applies the filled template as one undoable change and shows `message`. */
  onApply: (next: Project, message: string) => void;
}

/** Templates tab: browse packs, then fill a template's slots with your clips. */
export function TemplatesPanel({ media, project, onApply }: TemplatesPanelProps) {
  const [pack, setPack] = useState<PackId | "all">("all");
  const [picked, setPicked] = useState<Template | null>(null);

  if (picked) {
    return (
      <SlotFiller
        key={picked.id}
        template={picked}
        media={media.filter((m) => m.hasVideo)}
        onBack={() => setPicked(null)}
        onUse={(chosen) => {
          onApply(
            applyTemplate(picked, chosen, project),
            `"${picked.name}" is ready. Tap a clip to change it.`,
          );
          setPicked(null);
        }}
      />
    );
  }

  const shown = pack === "all" ? TEMPLATES : TEMPLATES.filter((t) => t.pack === pack);
  return (
    <div className="panel__body">
      <div className="panel__head">
        <h2 className="panel__title">
          <Icon name="templates" size={20} />
          Templates
        </h2>
        <p className="panel__lede">Ready-made reels. Pick one and drop in your own clips.</p>
      </div>
      <div className="chips" role="group" aria-label="Template packs">
        {[{ id: "all" as const, name: "All" }, ...TEMPLATE_PACKS].map((p) => (
          <button
            key={p.id}
            type="button"
            className={p.id === pack ? "chip is-active" : "chip"}
            aria-pressed={p.id === pack}
            onClick={() => setPack(p.id)}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div className="tpl-grid">
        {shown.map((t) => (
          <button key={t.id} type="button" className="tpl-card" onClick={() => setPicked(t)}>
            <TemplatePreview template={t} />
            <span className="tpl-card__name">
              {t.name}
              {t.pro && <span className="tpl-badge">Pro</span>}
            </span>
            <span className="tpl-card__meta">
              {Math.round(t.duration)} s · {t.slots.length} clips
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** A tiny animated phone: slots play across a progress strip, text layers at their heights. */
function TemplatePreview({ template: t }: { template: Template }) {
  return (
    <span
      className="tpl-preview"
      style={
        {
          "--a1": t.accents[0],
          "--a2": t.accents[1],
          "--dur": `${Math.max(4, t.duration / 2)}s`,
        } as CSSProperties
      }
    >
      <span className="tpl-preview__glow" />
      {t.texts.slice(0, 3).map((x, i) => (
        <span
          key={x.id}
          className={`tpl-preview__text tpl-preview__text--${x.preset}`}
          style={{ top: `${Math.min(86, x.y * 100)}%`, animationDelay: `${i * 0.4}s` }}
        />
      ))}
      <span className="tpl-preview__strip">
        {t.slots.map((s) => (
          <span key={s.id} className="tpl-preview__slot" style={{ flexGrow: s.end - s.start }} />
        ))}
        <span className="tpl-preview__head" />
      </span>
    </span>
  );
}

function SlotFiller({
  template: t,
  media,
  onBack,
  onUse,
}: {
  template: Template;
  media: MediaInfo[];
  onBack: () => void;
  onUse: (chosen: MediaInfo[]) => void;
}) {
  const [chosen, setChosen] = useState<string[]>(() =>
    t.slots.map((_, i) => (media.length ? media[i % media.length].path : "")),
  );
  const byPath = new Map(media.map((m) => [m.path, m]));

  return (
    <div className="panel__body">
      <button type="button" className="tpl-back" onClick={onBack}>
        ‹ All templates
      </button>
      <div className="panel__head">
        <h2 className="panel__title">
          {t.name}
          {t.pro && <span className="tpl-badge">Pro</span>}
        </h2>
        <p className="panel__lede">
          {t.blurb} Music idea: {t.musicMood.toLowerCase()}.
        </p>
      </div>
      {media.length === 0 ? (
        <div className="empty">
          <Icon name="import" size={32} />
          <p>Import a few videos first. They fill the template in order.</p>
        </div>
      ) : (
        <>
          <ol className="slot-list">
            {t.slots.map((s, i) => (
              <SlotRow
                key={s.id}
                index={i}
                slot={s}
                media={media}
                value={byPath.get(chosen[i])}
                onChange={(path) => setChosen((c) => c.map((p, j) => (j === i ? path : p)))}
              />
            ))}
          </ol>
          <Button
            icon="templates"
            size="lg"
            className="btn--block"
            onClick={() => onUse(chosen.map((p) => byPath.get(p)).filter((m): m is MediaInfo => !!m))}
          >
            Make my reel
          </Button>
        </>
      )}
    </div>
  );
}

function SlotRow({
  index,
  slot,
  media,
  value,
  onChange,
}: {
  index: number;
  slot: TemplateSlot;
  media: MediaInfo[];
  value: MediaInfo | undefined;
  onChange: (path: string) => void;
}) {
  const frames = useFilmstrip(value);
  const len = slot.end - slot.start;
  const thumb = value && frameAt(frames, value.durationSec, Math.min(value.durationSec, len) / 2);
  return (
    <li className="slot-row">
      <span className="slot-row__thumb">
        {thumb ? <img src={thumb} alt="" /> : <span className="slot-row__num">{index + 1}</span>}
        <span className="slot-row__len">{len.toFixed(len % 1 ? 1 : 0)} s</span>
      </span>
      <span className="slot-row__text">
        <span className="slot-row__hint">
          {slot.hint}
          {slot.kind === "photo" && <span className="slot-row__kind"> · still moment</span>}
        </span>
        <select
          className="slot-row__select"
          aria-label={`Clip for ${slot.hint}`}
          value={value?.path ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          {media.map((m) => (
            <option key={m.path} value={m.path}>
              {m.fileName} ({formatDuration(m.durationSec)})
            </option>
          ))}
        </select>
      </span>
    </li>
  );
}
