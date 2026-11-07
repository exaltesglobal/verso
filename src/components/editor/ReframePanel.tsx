import { useEntitlements } from "../../lib/entitlements";
import { useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Progress } from "../ui";
import { Icon } from "../Icon";
import { useCharged } from "../../lib/credits";
import type { AspectRatio, Clip } from "../../lib/project";
import {
  analyzeReframe,
  downloadReframeModel,
  planCrop,
  reframeModels,
  rememberAnalysis,
  type CropPath,
  type ReframeAnalysis,
  type ReframeMode,
  type ReframeModel,
} from "../../lib/reframe";

/** "auto" is the default: centred until speakers are found, then it follows whoever is talking. */
type Choice = ReframeMode | "auto";
const MODES: { mode: Choice; label: string; needsSpeakers: number }[] = [
  { mode: "auto", label: "Auto", needsSpeakers: 0 },
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
  const charge = useCharged();
  const source = clip.source;
  const [choice, setMode] = useState<Choice>("auto");
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

  const speakerCount = analysis?.speakers.length ?? 0;
  const mode: ReframeMode =
    choice !== "auto"
      ? choice
      : speakerCount > 1
        ? "active_speaker"
        : speakerCount === 1
          ? "follow_speaker"
          : "centre";

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
      // Model downloads are free; the analysis is charged per clip minute.
      for (const m of models.filter((x) => x.required && !x.installed)) {
        setBusy(`Getting the ${m.name.toLowerCase()}… 0%`);
        await downloadReframeModel(m.id, (p) =>
          setBusy(`Getting the ${m.name.toLowerCase()}… ${Math.round(p)}%`),
        );
      }
      setModels(await reframeModels());
      setBusy("Starting…");
      const a = await charge("speaker_reframe", (outPoint - inPoint) / 60, () =>
        analyzeReframe(source.path, inPoint, outPoint, (p, stage) =>
          setBusy(`${stage.replace(/…$/, "")}… ${Math.round(p)}%`),
        ),
      );
      setAnalysis(a);
      rememberAnalysis(a);
      if (a.speakers.length) setSpeakerId((id) => id ?? a.speakers[0].id);
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
  const pro = can("speaker_reframe");

  /** Follow me and Both speakers need speakers: find them first (Pro, credits), then switch. */
  const pick = async (t: Choice) => {
    const need = MODES.find((m) => m.mode === t)?.needsSpeakers ?? 0;
    if (need > speakers.length) {
      if (!pro) return openUpgrade("Following speakers and showing both people is part of Verso Pro.");
      if (analysis)
        return setError(
          need > 1 ? "We found only one person in this clip." : "We didn't find a person to follow.",
        );
      await findSpeakers();
    }
    setMode(t);
  };

  const help = busy
    ? busy
    : error
      ? null
      : analysis && speakers.length === 0
        ? "We didn't find any faces in this clip."
        : speakers.length > 1
          ? "Auto switches to whoever is talking"
          : speakers.length === 1
            ? "Auto follows the speaker"
            : "Auto finds who is talking";

  return (
    <div className="reframe" aria-label="Fit to shape">
      <div className="tiles" role="radiogroup" aria-label="How the camera follows">
        {TILES.map((t) => (
          <button
            key={t.mode}
            type="button"
            role="radio"
            aria-checked={choice === t.mode}
            className={choice === t.mode ? "tile is-selected" : "tile"}
            disabled={!!busy}
            data-tip={t.tip}
            onClick={() => void pick(t.mode)}
          >
            <Pictogram kind={t.mode} />
            <span className="tile__l">{t.label}</span>
            {t.pro && !pro && <span className="pro">Pro</span>}
          </button>
        ))}
      </div>
      {busy && (
        <Progress
          value={/(\d+)%/.test(busy) ? Number(/(\d+)%/.exec(busy)?.[1]) : undefined}
          label={busy.replace(/\s*\d+%$/, "")}
        />
      )}
      {!busy && help && <p className="help">{help}</p>}
      {error && (
        <p className="help reframe__error" role="alert">
          {error}
        </p>
      )}

      {speakers.length > 1 && (
        <div className="chips reframe__who" role="radiogroup" aria-label="Who to follow">
          {speakers.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={speakerId === s.id}
              className={speakerId === s.id ? "chip is-selected" : "chip"}
              data-tip={`${Math.round(s.talkTimeSec)} s talking`}
              onClick={() => {
                setSpeakerId(s.id);
                if (mode === "centre") setMode("follow_speaker");
              }}
            >
              {s.thumbnailPath && (
                <img src={convertFileSrc(s.thumbnailPath)} alt="" className="reframe__face" />
              )}
              {s.label}
            </button>
          ))}
        </div>
      )}
      {analysis && matcher && !busy && (
        <button
          type="button"
          className="chip reframe__matcher"
          onClick={() => getMatcher(matcher)}
          data-tip={`${mb(matcher.sizeBytes)} download`}
        >
          <Icon name="import" size={16} />
          Recognise people after camera cuts
        </button>
      )}
    </div>
  );
}

const TILES: { mode: Choice; label: string; tip: string; pro?: boolean }[] = [
  { mode: "auto", label: "Auto", tip: "Centred until speakers are found, then follows them" },
  { mode: "centre", label: "Centre", tip: "Keep the middle of the picture" },
  { mode: "follow_speaker", label: "Follow me", tip: "The frame moves with the speaker", pro: true },
  { mode: "split_two", label: "Both speakers", tip: "One person in each half", pro: true },
];

/** 48x32 pictograms: a muted source frame with the 9:16 frame and person in Paper (spec 1.5). */
function Pictogram({ kind }: { kind: Choice }) {
  const person = (x: number, y: number, s = 1) => (
    <g className="d-strong" fill="none" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={x} cy={y} r={2.6 * s} />
      <path d={`M${x - 5 * s} ${y + 10 * s} q0 -5.5 ${5 * s} -5.5 q${5 * s} 0 ${5 * s} 5.5`} />
    </g>
  );
  return (
    <svg className="tile__d" viewBox="0 0 48 32" aria-hidden="true">
      <rect x="2" y="4" width="44" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth={1.4} />
      {kind === "split_two" ? (
        <>
          <rect
            className="d-strong"
            x="17"
            y="1.5"
            width="14"
            height="29"
            rx="1.5"
            fill="none"
            strokeWidth={1.4}
          />
          <path className="d-strong" d="M17 16h14" strokeWidth={1.4} />
          {person(24, 6.5, 0.7)}
          {person(24, 20.5, 0.7)}
        </>
      ) : (
        <>
          {kind === "follow_speaker" && (
            <>
              <rect
                x="7"
                y="1.5"
                width="14"
                height="29"
                rx="1.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.2}
                strokeDasharray="2 2"
              />
              <path
                className="d-strong"
                d="M10 16h8m-3 -3l3 3l-3 3"
                fill="none"
                strokeWidth={1.4}
                strokeLinecap="round"
              />
            </>
          )}
          <rect
            className="d-strong"
            x={kind === "follow_speaker" ? 23 : 17}
            y="1.5"
            width="14"
            height="29"
            rx="1.5"
            fill="none"
            strokeWidth={1.4}
          />
          {person(kind === "follow_speaker" ? 30 : 24, 11)}
          {kind === "auto" && (
            <path
              className="d-strong"
              d="M40 7.5l1 2.5l2.5 1l-2.5 1l-1 2.5l-1 -2.5l-2.5 -1l2.5 -1z"
              fill="currentColor"
              strokeWidth={0.6}
            />
          )}
          {kind === "centre" && <path className="d-strong" d="M24 1.5v2.5M24 28v2.5" strokeWidth={1.4} />}
        </>
      )}
    </svg>
  );
}
