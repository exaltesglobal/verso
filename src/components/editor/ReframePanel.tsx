import { useEntitlements } from "../../lib/entitlements";
import { ProBadge } from "../account/ProBadge";
import { useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Button } from "../ui";
import type { AspectRatio, Clip } from "../../lib/project";
import {
  analyzeReframe,
  downloadReframeModel,
  planCrop,
  reframeModels,
  type CropPath,
  type ReframeAnalysis,
  type ReframeMode,
  type ReframeModel,
} from "../../lib/reframe";

const MODES: { mode: ReframeMode; label: string; needsSpeakers: number }[] = [
  { mode: "centre", label: "Keep it centred", needsSpeakers: 0 },
  { mode: "follow_speaker", label: "Follow the speaker", needsSpeakers: 1 },
  { mode: "active_speaker", label: "Switch to whoever's talking", needsSpeakers: 1 },
  { mode: "split_two", label: "Show both speakers", needsSpeakers: 2 },
];

const mb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1e6))} MB`;

interface ReframePanelProps {
  clip: Clip;
  aspect: AspectRatio;
  /** Called with the planned crop path (or null when there is none yet). */
  onCropPath?: (path: CropPath | null) => void;
}

/** Inspector section: find speakers in the clip, pick how the camera follows them. */
export function ReframePanel({ clip, aspect, onCropPath }: ReframePanelProps) {
  const { can, openUpgrade } = useEntitlements();
  const source = clip.source;
  const [mode, setMode] = useState<ReframeMode>("centre");
  const [speakerId, setSpeakerId] = useState<number | undefined>();
  const [found, setAnalysis] = useState<ReframeAnalysis | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<ReframeModel[]>([]);

  const inPoint = clip.inPoint ?? 0;
  const outPoint = inPoint + (clip.end - clip.start);

  useEffect(() => {
    reframeModels()
      .then(setModels)
      .catch(() => setModels([]));
  }, []);

  // A different clip or range means old speakers no longer apply.
  const analysis =
    found &&
    found.sourcePath === source?.path &&
    Math.abs(found.inPoint - inPoint) < 1e-3 &&
    Math.abs(found.outPoint - Math.min(outPoint, source.durationSec)) < 1e-3
      ? found
      : null;

  useEffect(() => {
    if (!analysis && mode !== "centre") return;
    if (!analysis) {
      onCropPath?.(null);
      return;
    }
    let alive = true;
    planCrop(analysis.analysisId, aspect, mode, { speakerId })
      .then((p) => alive && onCropPath?.(p))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, [analysis, aspect, mode, speakerId, onCropPath]);

  if (!source?.hasVideo) return null;

  async function findSpeakers() {
    if (!source) return;
    if (!can("speaker_reframe")) {
      openUpgrade("Following speakers and showing both people is part of Verso Pro.");
      return;
    }
    setError(null);
    try {
      for (const m of models.filter((x) => x.required && !x.installed)) {
        setBusy(`Getting the ${m.name.toLowerCase()}… 0%`);
        await downloadReframeModel(m.id, (p) =>
          setBusy(`Getting the ${m.name.toLowerCase()}… ${Math.round(p)}%`),
        );
      }
      setModels(await reframeModels());
      setBusy("Starting…");
      const a = await analyzeReframe(source.path, inPoint, outPoint, (p, stage) =>
        setBusy(`${stage.replace(/…$/, "")}… ${Math.round(p)}%`),
      );
      setAnalysis(a);
      if (a.speakers.length) {
        setSpeakerId((id) => id ?? a.speakers[0].id);
        setMode((m) => (m === "centre" ? (a.speakers.length > 1 ? "active_speaker" : "follow_speaker") : m));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function getMatcher(m: ReframeModel) {
    setError(null);
    try {
      await downloadReframeModel(m.id, (p) =>
        setBusy(`Getting the ${m.name.toLowerCase()}… ${Math.round(p)}%`),
      );
      setModels(await reframeModels());
      setAnalysis(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  const speakers = analysis?.speakers ?? [];
  const matcher = models.find((m) => !m.required && !m.installed);

  return (
    <section className="inspector__section reframe" aria-label="Reframe">
      <h3 className="section-label">Reframe for {aspect}</h3>

      <div className="reframe__modes" role="radiogroup" aria-label="How the camera follows">
        {MODES.map((m) => {
          const disabled = speakers.length < m.needsSpeakers;
          return (
            <button
              key={m.mode}
              type="button"
              role="radio"
              aria-checked={mode === m.mode}
              className={mode === m.mode ? "reframe__mode is-active" : "reframe__mode"}
              disabled={disabled || !!busy}
              title={disabled ? "Find speakers first" : undefined}
              onClick={() => setMode(m.mode)}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {speakers.length > 0 && (
        <div className="reframe__speakers" role="radiogroup" aria-label="Who to follow">
          {speakers.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={speakerId === s.id}
              className={speakerId === s.id ? "reframe__speaker is-active" : "reframe__speaker"}
              onClick={() => {
                setSpeakerId(s.id);
                if (mode === "centre") setMode("follow_speaker");
              }}
            >
              {s.thumbnailPath ? (
                <img src={convertFileSrc(s.thumbnailPath)} alt="" className="reframe__face" />
              ) : (
                <span className="reframe__face reframe__face--empty" aria-hidden />
              )}
              <span className="reframe__speaker-name">{s.label}</span>
              <span className="muted small">{Math.round(s.talkTimeSec)}s talking</span>
            </button>
          ))}
        </div>
      )}

      {analysis && speakers.length === 0 && (
        <p className="muted small">We didn't find any faces in this clip.</p>
      )}

      {busy ? (
        <div className="reframe__progress" role="status" aria-live="polite">
          <span>{busy}</span>
          <span className="reframe__bar">
            <span style={{ width: `${Number(/(\d+)%/.exec(busy)?.[1] ?? 0)}%` }} />
          </span>
        </div>
      ) : (
        <Button icon="subject-track" onClick={findSpeakers}>
          {analysis ? "Find speakers again" : "Find speakers"}
          {!can("speaker_reframe") && <ProBadge />}
        </Button>
      )}

      {matcher && !busy && (
        <button type="button" className="reframe__link" onClick={() => getMatcher(matcher)}>
          Recognise people after camera cuts ({mb(matcher.sizeBytes)} download)
        </button>
      )}

      {error && (
        <p className="reframe__error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
