import { useEffect, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Button } from "../ui";
import { newSpendKey, useCredits } from "../../lib/credits";
import { ProBadge } from "../account/ProBadge";
import { useEntitlements } from "../../lib/entitlements";
import type { Clip } from "../../lib/project";
import type { ReframeModel } from "../../lib/reframe";
import {
  backgroundModels,
  cancelBackground,
  clearOverridePatch,
  downloadBackgroundModel,
  needsPro,
  overridePatch,
  renderBackground,
  type BackgroundMode,
  type BackgroundOptions,
} from "../../lib/background";
import { LevelSlider, Listening, SmartCard } from "./parts";
import { MoreSettings } from "../MoreSettings";

const MODES: { mode: BackgroundMode; title: string; hint: string }[] = [
  { mode: "blur", title: "Blur the background", hint: "Keeps you sharp" },
  { mode: "remove", title: "Remove it", hint: "See-through behind you" },
  { mode: "replace", title: "Swap for a colour or photo", hint: "Your brand, your backdrop" },
  { mode: "studio", title: "Studio look", hint: "Soft light, darker edges" },
];

const NAMES: Record<string, string> = {
  blur: "Blurred",
  remove: "Removed",
  replace: "Swapped",
  studio: "Studio look",
};

/** Brand-friendly picks; the last one is a gradient. */
const SWATCHES: { label: string; color?: string; gradient?: [string, string] }[] = [
  { label: "Ink", color: "#111116" },
  { label: "Paper", color: "#F5F4F0" },
  { label: "Ember", color: "#FF4A2B" },
  { label: "Sky", color: "#5B8CFF" },
  { label: "Ember glow", gradient: ["#FF9466", "#111116"] },
];

const PREVIEW_SECONDS = 3;

interface BackgroundPanelProps {
  clip: Clip;
  /** Timeline playhead, for "Preview a few seconds". Defaults to the clip's middle. */
  playhead?: number;
  /** Applies a clip patch (one undoable change). */
  onChange: (patch: Partial<Clip>) => void;
}

/** Inspector section: blur, remove or replace the background of a talking-head clip. */
export function BackgroundPanel({ clip, playhead, onChange }: BackgroundPanelProps) {
  const { can, openUpgrade } = useEntitlements();
  const { spend, refund } = useCredits();
  const source = clip.source;
  const [mode, setMode] = useState<BackgroundMode>("blur");
  const [strength, setStrength] = useState(0.6);
  const [fill, setFill] = useState<Pick<BackgroundOptions, "color" | "gradient" | "imagePath">>({
    color: "#111116",
  });
  const [busy, setBusy] = useState<{ label: string; percent: number } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<ReframeModel[]>([]);
  const job = useRef<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    backgroundModels()
      .then(setModels)
      .catch(() => setModels([]));
  }, []);

  // Stop a running job if the panel goes away.
  useEffect(
    () => () => {
      if (job.current) void cancelBackground(job.current);
    },
    [],
  );

  if (!source?.hasVideo) return null;

  const inPoint = clip.inPoint ?? 0;
  const outPoint = Math.min(inPoint + (clip.end - clip.start), source.durationSec);
  const options: BackgroundOptions =
    mode === "replace" ? fill : mode === "remove" ? {} : { strength: Math.round(strength * 100) / 100 };
  const locked = needsPro(mode) && !can("background_pro");

  async function run(range: [number, number], label: string) {
    if (!source) return null;
    if (locked) {
      openUpgrade("Removing or swapping your background is part of Verso Pro. Blur stays free.");
      return null;
    }
    setError(null);
    try {
      for (const m of models.filter((x) => !x.installed)) {
        setBusy({ label: `Getting the ${m.name.toLowerCase()}…`, percent: 0 });
        await downloadBackgroundModel(m.id, (p) =>
          setBusy({ label: `Getting the ${m.name.toLowerCase()}…`, percent: p }),
        );
      }
      if (models.some((m) => !m.installed)) setModels(await backgroundModels());
      setBusy({ label, percent: 0 });
      return await renderBackground(
        source.path,
        range[0],
        range[1],
        mode,
        options,
        (p, stage) => setBusy({ label: stage === "Done" ? label : stage, percent: p }),
        (id) => {
          job.current = id;
          setJobId(id);
        },
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg !== "Cancelled.") setError(msg);
      return null;
    } finally {
      job.current = null;
      setJobId(null);
      setBusy(null);
    }
  }

  async function previewFew() {
    const at = playhead !== undefined ? inPoint + (playhead - clip.start) : (inPoint + outPoint) / 2;
    const start = Math.max(inPoint, Math.min(at - PREVIEW_SECONDS / 2, outPoint - PREVIEW_SECONDS));
    const r = await run([start, Math.min(outPoint, start + PREVIEW_SECONDS)], "Making a quick preview…");
    if (r) setPreview(convertFileSrc(r.path));
  }

  async function applyAll() {
    // Gate first (run shows the upgrade), then credits.
    const key = locked ? null : newSpendKey("background_removal");
    if (key) {
      try {
        await spend("background_removal", (outPoint - inPoint) / 60, key);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return;
      }
    }
    const r = await run([inPoint, outPoint], "Separating you from the background…");
    if (!r && key) void refund(key);
    if (r) {
      setPreview(null);
      onChange(overridePatch(r));
    }
  }

  async function pickPhoto() {
    const picked = await open({
      multiple: false,
      filters: [{ name: "Pictures", extensions: ["jpg", "jpeg", "png", "webp", "bmp"] }],
    });
    if (typeof picked === "string") setFill({ imagePath: picked });
  }

  const current = clip.videoOverride?.kind === "background" ? clip.videoOverride : undefined;

  return (
    <SmartCard
      icon="effects"
      title="Background"
      lede="Blur, remove or swap what's behind you. Your original video stays untouched."
    >
      {current && (
        <div className="bg-current">
          <span>
            Background: <strong>{NAMES[current.mode] ?? current.mode}</strong>
          </span>
          <Button variant="ghost" onClick={() => onChange(clearOverridePatch())} disabled={!!busy}>
            Turn off
          </Button>
        </div>
      )}

      <div className="bg-modes" role="radiogroup" aria-label="What to do with the background">
        {MODES.map((m) => (
          <button
            key={m.mode}
            type="button"
            role="radio"
            aria-checked={mode === m.mode}
            className={mode === m.mode ? "bg-mode is-active" : "bg-mode"}
            disabled={!!busy}
            onClick={() => {
              setMode(m.mode);
              setPreview(null);
            }}
          >
            <span className={`bg-mode__art bg-mode__art--${m.mode}`} aria-hidden>
              <span className="bg-mode__person" />
            </span>
            <span className="bg-mode__title">
              {m.title}
              {needsPro(m.mode) && !can("background_pro") && <ProBadge />}
            </span>
            <span className="bg-mode__hint">{m.hint}</span>
          </button>
        ))}
      </div>

      {mode === "replace" && (
        <div className="bg-fill">
          <div className="bg-swatches" role="radiogroup" aria-label="New background">
            {SWATCHES.map((s) => {
              const active = s.gradient
                ? fill.gradient?.[0] === s.gradient[0] && fill.gradient?.[1] === s.gradient[1]
                : fill.color === s.color;
              return (
                <button
                  key={s.label}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={s.label}
                  data-tip={s.label}
                  className={active ? "bg-swatch is-active" : "bg-swatch"}
                  style={{
                    background: s.gradient ? `linear-gradient(${s.gradient[0]}, ${s.gradient[1]})` : s.color,
                  }}
                  onClick={() => setFill(s.gradient ? { gradient: s.gradient } : { color: s.color })}
                />
              );
            })}
            <label className="bg-swatch bg-swatch--custom" title="Pick any colour">
              <input
                type="color"
                aria-label="Pick any colour"
                value={fill.color ?? "#111116"}
                onChange={(e) => setFill({ color: e.target.value })}
              />
            </label>
          </div>
          <Button variant="ghost" icon="import" onClick={() => void pickPhoto()} disabled={!!busy}>
            {fill.imagePath ? "Change photo" : "Use a photo"}
          </Button>
          {fill.imagePath && (
            <p className="muted small bg-fill__file">{fill.imagePath.split(/[\\/]/).pop()}</p>
          )}
        </div>
      )}

      {preview && !busy && (
        <video
          className="bg-preview"
          src={preview}
          autoPlay
          loop
          muted
          playsInline
          aria-label="Quick preview"
        />
      )}

      {busy ? (
        <div className="bg-busy">
          <Listening percent={busy.percent} label={busy.label} />
          {jobId && (
            <Button variant="ghost" onClick={() => void cancelBackground(jobId)}>
              Stop
            </Button>
          )}
        </div>
      ) : (
        <div className="smart-actions">
          <Button onClick={() => void previewFew()}>Preview a few seconds</Button>
          <Button variant="primary" onClick={() => void applyAll()}>
            {current ? "Apply again" : "Apply to clip"}
            {locked && <ProBadge />}
          </Button>
        </div>
      )}

      {error && (
        <p className="smart-note smart-note--error" role="alert">
          {error}
        </p>
      )}
      {(mode === "blur" || mode === "studio") && (
        <MoreSettings>
          <LevelSlider
            label={mode === "blur" ? "How much blur" : "How soft"}
            low="A little"
            high="A lot"
            value={strength}
            onChange={setStrength}
          />
        </MoreSettings>
      )}
    </SmartCard>
  );
}
