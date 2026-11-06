import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import { Button, IconButton } from "../components/ui";
import { WindowControls } from "../components/WindowControls";
import type { ToastMessage } from "../components/ui";
import { findMoments, projectForMoment } from "../lib/autoclips";
import { useEntitlements } from "../lib/entitlements";
import { formatDuration, pickAndProbe, probeMedia, type MediaInfo } from "../lib/media";
import { autosaveProject } from "../lib/persist";
import { transcribeFile } from "../lib/transcriber";
import { CreditsError, useCharged } from "../lib/credits";
import { CostConfirm } from "../components/credits/CostConfirm";
import { loadWaveform } from "../lib/waveform";

/** One long video in the queue. Saved to localStorage so the queue survives restarts. */
interface Job {
  id: string;
  path: string;
  fileName: string;
  durationSec: number;
  status: "waiting" | "working" | "done" | "failed";
  percent: number;
  stage: string;
  reels: { id: string; title: string; hookScore: number }[];
  error?: string;
}

const KEY = "verso.batch.v1";
const load = (): Job[] => {
  try {
    const jobs = JSON.parse(localStorage.getItem(KEY) ?? "[]") as Job[];
    // Anything that was mid-way when the app closed starts again.
    return jobs.map((j) => (j.status === "working" ? { ...j, status: "waiting", percent: 0, stage: "" } : j));
  } catch {
    return [];
  }
};

interface BatchProps {
  onClose: () => void;
  onOpenReels: () => void;
  notify: (m: ToastMessage) => void;
}

export function Batch({ onClose, onOpenReels, notify }: BatchProps) {
  const [jobs, setJobs] = useState<Job[]>(load);
  const [running, setRunning] = useState(false);
  const [reelsPerVideo, setReelsPerVideo] = useState(5);
  const stopRef = useRef(false);
  const { can, openUpgrade } = useEntitlements();
  const charge = useCharged();

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(jobs));
  }, [jobs]);

  const patch = (id: string, p: Partial<Job>) =>
    setJobs((js) => js.map((j) => (j.id === id ? { ...j, ...p } : j)));

  const add = async () => {
    const { items, errors } = await pickAndProbe();
    const fresh = items.filter((m) => m.hasAudio && !jobs.some((j) => j.path === m.path));
    setJobs((js) => [
      ...js,
      ...fresh.map((m) => ({
        id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        path: m.path,
        fileName: m.fileName,
        durationSec: m.durationSec,
        status: "waiting" as const,
        percent: 0,
        stage: "",
        reels: [],
      })),
    ]);
    if (errors.length) notify({ tone: "danger", text: errors[0].message });
  };

  const runOne = useCallback(
    async (job: Job) => {
      patch(job.id, { status: "working", percent: 0, stage: "Opening…", error: undefined });
      const media: MediaInfo = await probeMedia(job.path);
      const [words, peaks] = await charge("auto_cut", media.durationSec / 60, () =>
        Promise.all([
          transcribeFile(media, (percent, stage) => patch(job.id, { percent, stage })),
          loadWaveform(media).catch(() => [] as number[]),
        ]),
      );
      patch(job.id, { percent: 98, stage: "Picking the best moments…" });
      const moments = findMoments(words, { peaks, durationSec: media.durationSec, count: reelsPerVideo });
      const projects = moments.map((m, i) => projectForMoment(media, m, i, moments.length));
      await Promise.all(projects.map((p) => autosaveProject(p)));
      patch(job.id, {
        status: "done",
        percent: 100,
        stage: "",
        reels: projects.map((p, i) => ({ id: p.id, title: p.name, hookScore: moments[i].hookScore })),
      });
    },
    [reelsPerVideo, charge],
  );

  const start = async () => {
    if (!can("auto_clips")) {
      openUpgrade("Batch mode makes reels from many long videos at once. It is part of Verso Pro.");
      return;
    }
    stopRef.current = false;
    setRunning(true);
    let made = 0;
    const tried = new Set<string>();
    // Work through the queue one video at a time; the list may grow while running.
    for (;;) {
      if (stopRef.current) break;
      const next = load().find((j) => j.status === "waiting" && !tried.has(j.id));
      if (!next) break;
      tried.add(next.id);
      try {
        await runOne(next);
        made += 1;
      } catch (err) {
        patch(next.id, {
          status: "failed",
          stage: "",
          error: err instanceof Error ? err.message : String(err),
        });
        // Out of credits or signed out: the rest would fail the same way.
        if (err instanceof CreditsError && err.code !== "other") break;
      }
    }
    setRunning(false);
    if (made)
      notify({
        tone: "success",
        text: `Finished ${made} ${made === 1 ? "video" : "videos"}. Your reels are in Recent projects.`,
      });
  };

  const waitingJobs = jobs.filter((j) => j.status === "waiting");
  const waiting = waitingJobs.length;
  const waitingMinutes = waitingJobs.reduce((n, j) => n + j.durationSec / 60, 0);
  const totalReels = jobs.reduce((n, j) => n + j.reels.length, 0);

  return (
    <div className="batch">
      <header className="batch__bar" data-tauri-drag-region>
        <IconButton icon="undo" label="Back" onClick={onClose} />
        <h1 className="batch__title">Batch mode</h1>
        <span className="muted">
          Queue long videos, get ranked reels for all of them. Leave it running overnight.
        </span>
        <span className="batch__spacer" data-tauri-drag-region />
        <WindowControls />
      </header>

      <main className="batch__main">
        <div className="batch__controls">
          <Button icon="import" onClick={() => void add()} disabled={running}>
            Add videos
          </Button>
          <label className="batch__count">
            Reels per video
            <select
              className="field__input"
              value={reelsPerVideo}
              onChange={(e) => setReelsPerVideo(Number(e.target.value))}
            >
              {[3, 5, 8, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <span className="batch__spacer" />
          {running ? (
            <Button onClick={() => (stopRef.current = true)}>Stop after this video</Button>
          ) : (
            <CostConfirm
              action="auto_cut"
              units={waitingMinutes}
              continueLabel={`Make reels for ${waiting} ${waiting === 1 ? "video" : "videos"}`}
              onContinue={() => void start()}
              disabled={!waiting}
            />
          )}
        </div>

        {jobs.length === 0 ? (
          <div className="empty batch__empty">
            <Icon name="folder" size={32} />
            <p>
              Add podcasts, interviews or vlogs. We'll go through them one by one and save the best reels.
            </p>
          </div>
        ) : (
          <ul className="batch__list">
            {jobs.map((j) => (
              <li key={j.id} className={`batch-job is-${j.status}`}>
                <div className="batch-job__top">
                  <span className="batch-job__name">{j.fileName}</span>
                  <span className="muted small">{formatDuration(j.durationSec)}</span>
                  <span className="batch-job__status">
                    {j.status === "waiting" && "Waiting"}
                    {j.status === "working" && `${j.stage} ${Math.round(j.percent)}%`}
                    {j.status === "done" && `${j.reels.length} reels ready`}
                    {j.status === "failed" && "Didn't work"}
                  </span>
                  {!running && j.status !== "working" && (
                    <IconButton
                      icon="delete"
                      label="Remove from queue"
                      onClick={() => setJobs((js) => js.filter((x) => x.id !== j.id))}
                    />
                  )}
                </div>
                {j.status === "working" && (
                  <span className="progress-bar">
                    <span style={{ width: `${j.percent}%` }} />
                  </span>
                )}
                {j.error && <p className="form-error">{j.error}</p>}
                {j.reels.length > 0 && (
                  <ul className="batch-job__reels">
                    {j.reels.map((r) => (
                      <li key={r.id}>
                        <span className="score">{r.hookScore}</span> {r.title}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}

        {totalReels > 0 && (
          <Button icon="folder" onClick={onOpenReels}>
            See all {totalReels} reels
          </Button>
        )}
      </main>
    </div>
  );
}
