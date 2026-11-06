import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import { Button, type ToastMessage } from "../ui";
import { CaptionStylePreview } from "./CaptionStylePreview";
import { CAPTION_STYLES } from "../../lib/captionStyles";
import {
  ACCURACY,
  CAPTION_LANGUAGES,
  cancelDownload,
  cancelTranscription,
  downloadModel,
  editSegmentText,
  formatMegabytes,
  listModels,
  onModelProgress,
  segmentsToClips,
  transcribe,
  type Accuracy,
  type CaptionLanguage,
  type CaptionSegment,
  type ModelStatus,
} from "../../lib/captions";
import type { Clip } from "../../lib/project";

interface CaptionsPanelProps {
  /** The video clip to caption. Needs a real `source` file. */
  clip: Clip | undefined;
  styleId: string;
  onStyleChange: (id: string) => void;
  /** Called with fresh caption clips for `clip`; the editor swaps them in (see `replaceCaptions`). */
  onApply: (captions: Clip[], clip: Clip) => void;
  notify: (m: ToastMessage) => void;
}

type Phase =
  | { kind: "idle" }
  | { kind: "downloading"; modelId: string; percent: number }
  | { kind: "listening"; jobId: string | null; percent: number; stage: string };

const fmt = (t: number) => {
  const m = Math.floor(t / 60);
  const s = (t % 60).toFixed(1).padStart(4, "0");
  return `${m}:${s}`;
};

export function CaptionsPanel({ clip, styleId, onStyleChange, onApply, notify }: CaptionsPanelProps) {
  const [language, setLanguage] = useState<CaptionLanguage>("hinglish");
  const [accuracy, setAccuracy] = useState<Accuracy>("balanced");
  const [models, setModels] = useState<ModelStatus[]>([]);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [segments, setSegments] = useState<CaptionSegment[]>([]);
  const [captioned, setCaptioned] = useState<Clip | null>(null);
  const stopListening = useRef<(() => void) | null>(null);

  const refreshModels = useCallback(() => {
    listModels()
      .then(setModels)
      .catch(() => setModels([]));
  }, []);

  useEffect(() => {
    refreshModels();
    const off = onModelProgress((p) =>
      setPhase((ph) =>
        ph.kind === "downloading" && ph.modelId === p.id
          ? { ...ph, percent: Math.floor((p.downloaded / Math.max(1, p.total)) * 100) }
          : ph,
      ),
    );
    return () => {
      off.then((u) => u());
      stopListening.current?.();
    };
  }, [refreshModels]);

  const choice = ACCURACY.find((a) => a.id === accuracy)!;
  const model = models.find((m) => m.id === choice.modelId);
  const busy = phase.kind !== "idle";

  async function write() {
    if (!clip?.source) {
      notify({ tone: "info", text: "Add a video to the timeline first, then we'll write its captions." });
      return;
    }
    const target = clip;
    const source = clip.source;
    const modelId = choice.modelId;

    if (!model?.present) {
      setPhase({ kind: "downloading", modelId, percent: 0 });
      try {
        await downloadModel(modelId);
        refreshModels();
      } catch (e) {
        setPhase({ kind: "idle" });
        refreshModels();
        const text = String(e);
        notify({ tone: text.startsWith("Download paused") ? "info" : "danger", text });
        return;
      }
    }

    setPhase({ kind: "listening", jobId: null, percent: 0, stage: "loading" });
    const inPoint = target.inPoint ?? 0;
    try {
      const { jobId, stop } = await transcribe(
        { path: source.path, inPoint, outPoint: inPoint + (target.end - target.start), language, modelId },
        {
          onProgress: (p) =>
            setPhase((ph) => (ph.kind === "listening" ? { ...ph, percent: p.percent, stage: p.stage } : ph)),
          onDone: (segs) => {
            stopListening.current?.();
            setPhase({ kind: "idle" });
            setSegments(segs);
            setCaptioned(target);
            onApply(segmentsToClips(segs, target), target);
            notify({
              tone: segs.length ? "success" : "info",
              text: segs.length
                ? `Wrote ${segs.length} captions.`
                : "We didn't hear any speech in this clip.",
            });
          },
          onError: (message, cancelled) => {
            stopListening.current?.();
            setPhase({ kind: "idle" });
            notify({ tone: cancelled ? "info" : "danger", text: message });
          },
        },
      );
      stopListening.current = stop;
      setPhase((ph) => (ph.kind === "listening" ? { ...ph, jobId } : ph));
    } catch (e) {
      setPhase({ kind: "idle" });
      notify({ tone: "danger", text: String(e) });
    }
  }

  function stop() {
    if (phase.kind === "downloading") cancelDownload(phase.modelId);
    if (phase.kind === "listening" && phase.jobId) cancelTranscription(phase.jobId);
  }

  function editText(i: number, text: string) {
    setSegments((segs) => segs.map((s, j) => (j === i ? { ...s, text } : s)));
  }

  function commitText(i: number) {
    if (!captioned) return;
    const next = segments.map((s, j) => (j === i ? editSegmentText(s, s.text) : s));
    setSegments(next);
    onApply(segmentsToClips(next, captioned), captioned);
  }

  const status =
    phase.kind === "downloading"
      ? `Downloading the speech model… ${phase.percent}%`
      : phase.kind === "listening"
        ? phase.stage === "loading"
          ? "Getting ready…"
          : phase.stage === "writing"
            ? "Writing captions…"
            : `Listening… ${phase.percent}%`
        : null;
  const percent = phase.kind === "idle" ? 0 : phase.percent;
  const shift = captioned ? captioned.start - (captioned.inPoint ?? 0) : 0;

  return (
    <div className="panel__body captions-panel">
      <div className="panel__head">
        <h2 className="panel__title">
          <Icon name="captions" size={20} />
          Captions
        </h2>
        <p className="panel__lede">Words appear as you speak. Most people watch reels with the sound off.</p>
      </div>

      <h3 className="section-label">Language</h3>
      <div className="cap-choices" role="radiogroup" aria-label="Language">
        {CAPTION_LANGUAGES.map((l) => (
          <button
            key={l.id}
            type="button"
            role="radio"
            aria-checked={language === l.id}
            className={language === l.id ? "cap-choice is-selected" : "cap-choice"}
            onClick={() => setLanguage(l.id)}
            disabled={busy}
          >
            <span className="cap-choice__label">{l.label}</span>
            <span className="cap-choice__hint">{l.hint}</span>
          </button>
        ))}
      </div>

      <h3 className="section-label">Accuracy</h3>
      <div className="cap-choices cap-choices--three" role="radiogroup" aria-label="Accuracy">
        {ACCURACY.map((a) => {
          const m = models.find((x) => x.id === a.modelId);
          return (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={accuracy === a.id}
              className={accuracy === a.id ? "cap-choice is-selected" : "cap-choice"}
              onClick={() => setAccuracy(a.id)}
              disabled={busy}
            >
              <span className="cap-choice__label">{a.label}</span>
              <span className="cap-choice__hint">{a.hint}</span>
              <span className={m?.present ? "cap-choice__meta is-ready" : "cap-choice__meta"}>
                {m?.present ? "Ready offline" : m ? formatMegabytes(m.sizeBytes) : ""}
              </span>
            </button>
          );
        })}
      </div>
      {!model?.present && (
        <p className="cap-note">
          <Icon name="import" size={16} />
          {model ? `${formatMegabytes(model.sizeBytes)} · ` : ""}Download once, works offline.
          {model && model.partialBytes > 0 ? " We'll resume where it stopped." : ""}
        </p>
      )}

      {busy ? (
        <div className="cap-progress" role="status" aria-live="polite">
          <div className="cap-progress__row">
            <span>{status}</span>
            <button type="button" className="cap-progress__stop" onClick={stop}>
              Stop
            </button>
          </div>
          <div className="cap-progress__track">
            <div className="cap-progress__bar" style={{ width: `${percent}%` }} />
          </div>
        </div>
      ) : (
        <Button variant="primary" icon="captions" size="lg" className="btn--block" onClick={write}>
          Write captions
        </Button>
      )}

      {segments.length > 0 && (
        <>
          <h3 className="section-label">Your captions</h3>
          <ol className="cap-segments">
            {segments.map((s, i) => (
              <li key={i} className="cap-segment">
                <span className="cap-segment__time">{fmt(s.start + shift)}</span>
                <input
                  className="cap-segment__text"
                  value={s.text}
                  aria-label={`Caption at ${fmt(s.start + shift)}`}
                  onChange={(e) => editText(i, e.target.value)}
                  onBlur={() => commitText(i)}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                />
              </li>
            ))}
          </ol>
        </>
      )}

      <h3 className="section-label">Caption style</h3>
      <div className="cap-styles">
        {CAPTION_STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            className={s.id === styleId ? "cap-style is-selected" : "cap-style"}
            onClick={() => onStyleChange(s.id)}
            aria-pressed={s.id === styleId}
          >
            <CaptionStylePreview style={s} playing={s.id === styleId} />
            <span className="cap-style__name">{s.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
