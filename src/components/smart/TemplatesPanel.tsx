import { useEntitlements } from "../../lib/entitlements";
import { useState, type CSSProperties } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import "@fontsource-variable/fraunces"; // serif shown on cinematic cards
import { Icon } from "../Icon";
import { Button } from "../ui";
import { frameAt, useFilmstrip } from "../../lib/filmstrip";
import { LEAK_COLORS, letterboxBar } from "../../lib/looks";
import { startMediaDrag, useMediaDrop, useOsFileDrops } from "../../lib/mediaDrag";
import { formatDuration, isImage, type MediaInfo } from "../../lib/media";
import type { Clip, Look, Project } from "../../lib/project";
import {
  TEMPLATE_PACKS,
  TEMPLATES,
  applyTemplate,
  defaultLang,
  limitLook,
  projectLangs,
  setSlotInPoint,
  swapProjectLanguage,
  swapSlotMedia,
  templateLangs,
  type Template,
  type TemplateLang,
  type TemplateSlot,
} from "../../templates";
import type { PackId } from "../../templates/types";

export interface TemplatesPanelProps {
  /** Imported media; video files can fill slots. */
  media: MediaInfo[];
  /** Current project: its music is kept, its clips are replaced. */
  project?: Project;
  /** Applies the filled template as one undoable change and shows `message`. */
  onApply: (next: Project, message: string) => void;
}

const LANG_NAMES: Record<TemplateLang, string> = {
  en: "English",
  hi: "Hinglish",
  ta: "தமிழ்",
  ml: "മലയാളം",
  bn: "বাংলা",
  mr: "मराठी",
};

const matches = (t: Template, q: string) =>
  !q || `${t.name} ${t.blurb} ${t.musicMood} ${t.pack}`.toLowerCase().includes(q);

/** Templates tab: browse packs, then fill a template's slots with your clips. */
export function TemplatesPanel({ media, project, onApply }: TemplatesPanelProps) {
  const { can, openUpgrade } = useEntitlements();
  const [pack, setPack] = useState<PackId | "all">("all");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Template | null>(null);
  const [dropError, setDropError] = useState("");
  useOsFileDrops(setDropError);

  if (picked) {
    return (
      <SlotFiller
        key={picked.id}
        template={picked}
        media={media.filter((m) => m.hasVideo)}
        dropError={dropError}
        onBack={() => setPicked(null)}
        onUse={(chosen, lang) => {
          onApply(
            applyTemplate(picked, chosen, project, lang),
            `"${picked.name}" is ready. Drag a clip onto a slot to change it.`,
          );
          setPicked(null);
        }}
      />
    );
  }

  const q = query.trim().toLowerCase();
  const shown = TEMPLATES.filter((t) => (pack === "all" || t.pack === pack) && matches(t, q));
  // One row per slot (split layouts put several pieces of one slot on the track).
  const slotted = (project?.tracks.find((t) => t.kind === "video")?.clips ?? []).filter(
    (c, i, all) => c.slotId && all.findIndex((x) => x.slotId === c.slotId) === i,
  );
  return (
    <div className="panel__body">
      <div className="panel__head">
        <h2 className="panel__title">
          <Icon name="templates" size={20} />
          Templates
        </h2>
        <p className="panel__lede">Ready-made reels. Pick one and drop in your own clips.</p>
      </div>
      {project && slotted.length > 0 && (
        <SwapSlots project={project} clips={slotted} media={media} dropError={dropError} onApply={onApply} />
      )}
      {project && <LetterboxPicker project={project} onApply={onApply} />}
      <input
        className="tpl-search"
        type="search"
        placeholder="Search templates"
        aria-label="Search templates"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
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
      {shown.length === 0 ? (
        <p className="tpl-none">No templates match “{query}”. Try another word.</p>
      ) : (
        <div className="tpl-grid">
          {shown.map((t) => (
            <button
              key={t.id}
              type="button"
              className="tpl-card"
              title={t.blurb}
              onClick={() =>
                t.pro && !can("templates_pro")
                  ? openUpgrade(`The "${t.name}" template is part of Verso Pro.`)
                  : setPicked(t)
              }
            >
              <TemplatePreview template={t} />
              <span className="tpl-card__name">
                {t.name}
                {t.isNew && <span className="tpl-badge tpl-badge--new">New</span>}
                {t.pro && <span className="tpl-badge">Pro</span>}
              </span>
              <span className="tpl-card__meta">
                {Math.round(t.duration)} s · {t.slots.length} clips · {t.musicMood}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** A tiny animated phone: slots play across a progress strip, text layers at their heights, plus the look. */
function TemplatePreview({ template: t }: { template: Template }) {
  const look = t.look;
  const bar = letterboxBar(look?.letterbox, t.aspect);
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
      {look?.leak && (
        <span
          className="tpl-preview__leak"
          style={
            {
              "--l1": LEAK_COLORS[look.leak.style][0],
              "--l2": LEAK_COLORS[look.leak.style][1],
            } as CSSProperties
          }
        />
      )}
      {look?.flare && (
        <span className="tpl-preview__flare" style={{ "--fc": look.flare.color } as CSSProperties} />
      )}
      {t.texts.slice(0, 3).map((x, i) =>
        x.font === "serif" ? (
          <span
            key={x.id}
            className="tpl-preview__serif"
            style={{ top: `${Math.min(86, x.y * 100)}%`, animationDelay: `${i * 0.4}s` }}
          >
            {x.text.split(" ").slice(0, 3).join(" ")}
          </span>
        ) : (
          <span
            key={x.id}
            className={`tpl-preview__text tpl-preview__text--${x.preset} tpl-anim--${x.animation ?? "pop"}`}
            style={{ top: `${Math.min(86, x.y * 100)}%`, animationDelay: `${i * 0.4}s` }}
          />
        ),
      )}
      {!!look?.vignette && <span className="tpl-preview__vignette" style={{ opacity: look.vignette }} />}
      {!!look?.grain && <span className="tpl-preview__grain" style={{ opacity: 0.25 + look.grain * 0.5 }} />}
      {bar > 0 && (
        <>
          <span className="tpl-preview__bar" style={{ top: 0, height: `${bar * 100}%` }} />
          <span className="tpl-preview__bar" style={{ bottom: 0, height: `${bar * 100}%` }} />
        </>
      )}
      <span className="tpl-preview__strip">
        {t.slots.map((s) => (
          <span key={s.id} className="tpl-preview__slot" style={{ flexGrow: s.end - s.start }} />
        ))}
        <span className="tpl-preview__head" />
      </span>
    </span>
  );
}

/** Draggable clip chips: drag one onto a slot. */
function ClipTray({ media }: { media: MediaInfo[] }) {
  return (
    <div className="clip-tray" aria-label="Your clips. Drag one onto a slot.">
      {media.map((m) => (
        <TrayChip key={m.path} media={m} />
      ))}
    </div>
  );
}

/** A photo is its own thumbnail; videos use a filmstrip frame. */
function useThumb(m: MediaInfo | undefined, at: (m: MediaInfo) => number) {
  const photo = !!m && isImage(m);
  const frames = useFilmstrip(photo ? undefined : m);
  if (!m) return undefined;
  return photo ? convertFileSrc(m.path) : frameAt(frames, m.durationSec, at(m));
}

function TrayChip({ media: m }: { media: MediaInfo }) {
  const thumb = useThumb(m, (x) => x.durationSec / 2);
  return (
    <span className="clip-tray__chip" title={m.fileName} onPointerDown={(e) => startMediaDrag(e, m)}>
      {thumb ? <img src={thumb} alt="" draggable={false} /> : <Icon name="import" size={16} />}
      <span className="clip-tray__len">{isImage(m) ? "Photo" : formatDuration(m.durationSec)}</span>
    </span>
  );
}

/** After a template is applied: drop new clips onto its slots (one undoable change each). */
function SwapSlots({
  project,
  clips,
  media,
  dropError,
  onApply,
}: {
  project: Project;
  clips: Clip[];
  media: MediaInfo[];
  dropError: string;
  onApply: (next: Project, message: string) => void;
}) {
  const videos = media.filter((m) => m.hasVideo);
  const langs = projectLangs(project);
  const swap = (slotId: string, m: MediaInfo) =>
    onApply(swapSlotMedia(project, slotId, m), `Swapped in ${m.fileName}.`);
  return (
    <section className="tpl-swap" aria-label="Your reel's slots">
      <h3 className="tpl-swap__title">Your reel's slots</h3>
      <p className="tpl-swap__hint">
        Drag a clip or photo here, or a file from your computer, to swap it in.
      </p>
      {langs.length > 1 && (
        <div className="chips" role="group" aria-label="Switch all text to">
          {langs.map((l) => (
            <button
              key={l}
              type="button"
              className="chip"
              onClick={() =>
                onApply(swapProjectLanguage(project, l), `All text switched to ${LANG_NAMES[l]}.`)
              }
            >
              {LANG_NAMES[l]}
            </button>
          ))}
        </div>
      )}
      {videos.length > 0 && <ClipTray media={videos} />}
      <ol className="slot-list">
        {clips.map((c, i) => (
          <SlotRow
            key={c.id}
            index={i}
            slot={{ id: c.slotId!, kind: "video", start: c.start, end: c.end, hint: c.label }}
            media={videos}
            value={c.source ?? videos.find((m) => m.path === c.still?.path)}
            onChange={(m) => swap(c.slotId!, m)}
            trim={
              c.source && c.source.durationSec > c.end - c.start + 0.5
                ? {
                    value: c.inPoint ?? 0,
                    max: c.source.durationSec - (c.end - c.start),
                    onCommit: (t) => onApply(setSlotInPoint(project, c.slotId!, t), "Slot trimmed."),
                  }
                : undefined
            }
          />
        ))}
      </ol>
      {dropError && <p className="form-error">{dropError}</p>}
    </section>
  );
}

function SlotFiller({
  template: t,
  media,
  dropError,
  onBack,
  onUse,
}: {
  template: Template;
  media: MediaInfo[];
  dropError: string;
  onBack: () => void;
  onUse: (chosen: MediaInfo[], lang: TemplateLang) => void;
}) {
  const langs = templateLangs(t);
  const [lang, setLang] = useState<TemplateLang>(() => defaultLang(t));
  const [chosen, setChosen] = useState<(MediaInfo | undefined)[]>(() =>
    t.slots.map((_, i) => (media.length ? media[i % media.length] : undefined)),
  );
  const filled = chosen.filter((m): m is MediaInfo => !!m);

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
        {t.layout && (
          <p className="tpl-swap__hint">Made for a split screen: for now your clips take turns on screen.</p>
        )}
      </div>
      {langs.length > 1 && (
        <div className="chips" role="group" aria-label="Text language">
          {langs.map((l) => (
            <button
              key={l}
              type="button"
              className={l === lang ? "chip is-active" : "chip"}
              aria-pressed={l === lang}
              onClick={() => setLang(l)}
            >
              {LANG_NAMES[l]}
            </button>
          ))}
        </div>
      )}
      {media.length > 0 ? (
        <ClipTray media={media} />
      ) : (
        <div className="empty">
          <Icon name="import" size={32} />
          <p>Import a few videos, or drop one from your computer onto a slot.</p>
        </div>
      )}
      <ol className="slot-list">
        {t.slots.map((s, i) => (
          <SlotRow
            key={s.id}
            index={i}
            slot={s}
            media={media}
            value={chosen[i]}
            onChange={(m) => setChosen((c) => c.map((p, j) => (j === i ? m : p)))}
          />
        ))}
      </ol>
      {dropError && <p className="form-error">{dropError}</p>}
      <Button
        icon="templates"
        size="lg"
        className="btn--block"
        disabled={filled.length === 0}
        onClick={() => onUse(filled, lang)}
      >
        Make my reel
      </Button>
    </div>
  );
}

function SlotRow({
  index,
  slot,
  media,
  value,
  onChange,
  trim,
}: {
  index: number;
  slot: TemplateSlot;
  media: MediaInfo[];
  value: MediaInfo | undefined;
  onChange: (m: MediaInfo) => void;
  /** Slot trimming: where in the file the slot starts (seconds). */
  trim?: { value: number; max: number; onCommit: (t: number) => void };
}) {
  const ref = useMediaDrop<HTMLLIElement>(onChange);
  const len = slot.end - slot.start;
  const thumb = useThumb(value, (m) => Math.min(m.durationSec, len) / 2);
  const minClip = slot.minClip ?? Math.ceil(len * 10) / 10;
  // A dropped OS file may not be in the media list yet: offer it in the picker too.
  const options = value && !media.some((m) => m.path === value.path) ? [value, ...media] : media;
  return (
    <li className="slot-row" ref={ref}>
      <span className="slot-row__thumb">
        {thumb ? <img src={thumb} alt="" /> : <span className="slot-row__num">{index + 1}</span>}
        <span className="slot-row__len">{len.toFixed(len % 1 ? 1 : 0)} s</span>
      </span>
      <span className="slot-row__text">
        <span className="slot-row__hint">
          {slot.hint}
          {slot.kind === "photo" && <span className="slot-row__kind"> · still moment</span>}
          <span className="slot-row__min"> · Min clip {minClip} s</span>
        </span>
        {trim && <SlotTrim key={trim.value} {...trim} />}
        {options.length > 0 ? (
          <select
            className="slot-row__select"
            aria-label={`Clip for ${slot.hint}`}
            value={value?.path ?? ""}
            onChange={(e) => {
              const m = options.find((x) => x.path === e.target.value);
              if (m) onChange(m);
            }}
          >
            {!value && <option value="">Drop a clip here</option>}
            {options.map((m) => (
              <option key={m.path} value={m.path}>
                {m.fileName} ({isImage(m) ? "photo" : formatDuration(m.durationSec)})
              </option>
            ))}
          </select>
        ) : (
          <span className="slot-row__drop">Drop a clip here</span>
        )}
      </span>
    </li>
  );
}

/** "Start at" slider; commits once on release so a drag is one undo step. */
function SlotTrim({ value, max, onCommit }: { value: number; max: number; onCommit: (t: number) => void }) {
  const [t, setT] = useState(value);
  const commit = () => t !== value && onCommit(t);
  return (
    <label className="slot-trim">
      <span>Start at {t.toFixed(1)} s</span>
      <input
        type="range"
        min={0}
        max={max}
        step={0.1}
        value={t}
        onChange={(e) => setT(Number(e.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
      />
    </label>
  );
}

const LETTERBOX: { id: Look["letterbox"]; name: string }[] = [
  { id: null, name: "None" },
  { id: "2.39", name: "2.39" },
  { id: "2.00", name: "2.00" },
  { id: "1.85", name: "1.85" },
];

/** Letterbox ratio for the whole reel (a grade plus at most two of grain, vignette, letterbox). */
function LetterboxPicker({
  project,
  onApply,
}: {
  project: Project;
  onApply: (next: Project, message: string) => void;
}) {
  const current = project.look?.letterbox ?? null;
  return (
    <div className="chips tpl-letterbox" role="group" aria-label="Letterbox">
      <span className="tpl-letterbox__label">Letterbox</span>
      {LETTERBOX.map((o) => (
        <button
          key={o.name}
          type="button"
          className={o.id === current ? "chip is-active" : "chip"}
          aria-pressed={o.id === current}
          onClick={() =>
            onApply(
              { ...project, updatedAt: Date.now(), look: limitLook({ ...project.look, letterbox: o.id }) },
              o.id ? `Letterbox ${o.name}:1.` : "Letterbox off.",
            )
          }
        >
          {o.name}
        </button>
      ))}
    </div>
  );
}
