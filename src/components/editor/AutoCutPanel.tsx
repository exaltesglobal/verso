import { useState } from "react";
import { Icon } from "../Icon";
import { Button } from "../ui";
import { frameAt, useFilmstrip } from "../../lib/filmstrip";
import { loadWaveform } from "../../lib/waveform";
import { formatDuration, type MediaInfo } from "../../lib/media";
import { findMoments, projectForMoment, type Moment, type TranscriptWord } from "../../lib/autoclips";
import type { Project } from "../../lib/project";

export type Transcriber = (
  media: MediaInfo,
  onProgress: (percent: number, stage: string) => void,
) => Promise<TranscriptWord[]>;

interface AutoCutPanelProps {
  media: MediaInfo[];
  importing: boolean;
  onImport: () => Promise<void>;
  /** Supplied once the on-device captions engine is available. */
  transcribe?: Transcriber;
  /** Opens one reel in the editor. */
  onOpenProject: (p: Project) => void;
  /** Saves several reels (e.g. autosave) and opens the first. */
  onMakeAll: (projects: Project[]) => void;
}

type Phase =
  | { kind: "idle" }
  | { kind: "working"; percent: number; stage: string }
  | { kind: "done"; moments: Moment[] }
  | { kind: "error"; message: string };

export function AutoCutPanel({
  media,
  importing,
  onImport,
  transcribe,
  onOpenProject,
  onMakeAll,
}: AutoCutPanelProps) {
  const videos = media.filter((m) => m.hasVideo && m.hasAudio);
  const [path, setPath] = useState<string | undefined>(videos[0]?.path);
  const source = videos.find((m) => m.path === path) ?? videos[0];
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [picked, setPicked] = useState<string | undefined>();

  const run = async () => {
    if (!source || !transcribe) return;
    setPhase({ kind: "working", percent: 0, stage: "Listening to your video…" });
    try {
      const [words, peaks] = await Promise.all([
        transcribe(source, (percent, stage) => setPhase({ kind: "working", percent, stage })),
        loadWaveform(source).catch(() => [] as number[]),
      ]);
      setPhase({ kind: "working", percent: 98, stage: "Picking the best moments…" });
      const count = Math.max(3, Math.min(10, Math.round(source.durationSec / 300)));
      const moments = findMoments(words, { peaks, durationSec: source.durationSec, count });
      setPhase(
        moments.length
          ? { kind: "done", moments }
          : { kind: "error", message: "We couldn't find clear moments. Try a video with more talking." },
      );
      setPicked(moments[0]?.id);
    } catch (err) {
      setPhase({ kind: "error", message: `That didn't work. ${String(err)}` });
    }
  };

  const projects = (moments: Moment[]) =>
    source ? moments.map((m, i) => projectForMoment(source, m, i, moments.length)) : [];

  return (
    <div className="panel__body">
      <div className="panel__head">
        <h2 className="panel__title">
          <Icon name="auto-cut" size={20} />
          Auto-cut
        </h2>
        <p className="panel__lede">
          {phase.kind === "done"
            ? `We found ${phase.moments.length} moments in your ${formatDuration(source?.durationSec ?? 0)} video that work as reels. Pick one to start editing.`
            : "Give us a long video. We'll find the moments that work best as reels."}
        </p>
      </div>

      {!videos.length ? (
        <>
          <div className="empty">
            <Icon name="import" size={32} />
            <p>Import a podcast, interview or vlog to begin.</p>
          </div>
          <Button
            icon="import"
            size="lg"
            className="btn--block"
            onClick={() => void onImport()}
            disabled={importing}
          >
            {importing ? "Reading your file…" : "Import a long video"}
          </Button>
        </>
      ) : (
        phase.kind !== "done" && (
          <>
            {videos.length > 1 && (
              <label className="field">
                <span className="field__label">Video</span>
                <select
                  className="field__input"
                  value={source?.path}
                  onChange={(e) => setPath(e.target.value)}
                >
                  {videos.map((v) => (
                    <option key={v.path} value={v.path}>
                      {v.fileName} · {formatDuration(v.durationSec)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {phase.kind === "working" ? (
              <div className="progress-card" role="status">
                <span className="progress-card__stage">
                  {phase.stage} {Math.round(phase.percent)}%
                </span>
                <span className="progress-bar">
                  <span style={{ width: `${phase.percent}%` }} />
                </span>
              </div>
            ) : (
              <Button
                icon="auto-cut"
                size="lg"
                className="btn--block"
                onClick={() => void run()}
                disabled={!transcribe}
              >
                Find my best moments
              </Button>
            )}
            {!transcribe && (
              <p className="muted small">The on-device captions engine is still being set up.</p>
            )}
            {phase.kind === "error" && <p className="form-error">{phase.message}</p>}
          </>
        )
      )}

      {phase.kind === "done" && source && (
        <>
          <ul className="moment-list">
            {phase.moments.map((m, i) => (
              <li key={m.id}>
                <MomentCard
                  moment={m}
                  media={source}
                  selected={m.id === picked}
                  onPick={() => setPicked(m.id)}
                  onOpen={() => onOpenProject(projectForMoment(source, m, i, phase.moments.length))}
                />
              </li>
            ))}
          </ul>
          <Button
            icon="one-click"
            size="lg"
            className="btn--block"
            onClick={() => onMakeAll(projects(phase.moments))}
          >
            Make all {phase.moments.length} reels
          </Button>
          <button type="button" className="btn btn--ghost" onClick={() => setPhase({ kind: "idle" })}>
            <span>Start over</span>
          </button>
        </>
      )}
    </div>
  );
}

function MomentCard({
  moment: m,
  media,
  selected,
  onPick,
  onOpen,
}: {
  moment: Moment;
  media: MediaInfo;
  selected: boolean;
  onPick: () => void;
  onOpen: () => void;
}) {
  const frames = useFilmstrip(media);
  const thumb = frameAt(frames, media.durationSec, (m.start + m.end) / 2);
  return (
    <div
      className={selected ? "moment is-selected" : "moment"}
      onClick={onPick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
    >
      <span className="moment__thumb">{thumb && <img src={thumb} alt="" />}</span>
      <span className="moment__text">
        <span className="moment__title">{m.title}</span>
        <span className="moment__meta">
          <span className="score">{m.hookScore}</span>
          Hook score · {formatDuration(m.end - m.start)}
        </span>
        {selected && (
          <>
            <span className="moment__why">{m.reasons.join(" · ") || "Clear, complete thought"}</span>
            <button
              type="button"
              className="btn btn--secondary moment__open"
              onClick={(e) => (e.stopPropagation(), onOpen())}
            >
              <span>Edit this reel</span>
            </button>
          </>
        )}
      </span>
    </div>
  );
}
