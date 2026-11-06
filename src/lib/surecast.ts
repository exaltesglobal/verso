// Surecast handshake: connection, the persistent send queue (Rust, src-tauri/src/surecast.rs)
// and read-only status back. Scheduling happens in Surecast's web app.
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type { Clip, Project } from "./project";

const KEY = "verso.surecast.url";
const ENV_URL = (import.meta.env.VITE_SURECAST_URL ?? "").trim();
const listeners = new Set<() => void>();

const clean = (u: string) => u.trim().replace(/\/+$/, "");

/** Surecast address: the Settings value, else VITE_SURECAST_URL. Empty means not set up. */
export const getSurecastUrl = () => clean(localStorage.getItem(KEY) ?? ENV_URL);

export function setSurecastUrl(url: string) {
  localStorage.setItem(KEY, clean(url));
  listeners.forEach((l) => l());
}

export function useSurecastUrl(): string {
  return useSyncExternalStore((l) => {
    listeners.add(l);
    return () => listeners.delete(l);
  }, getSurecastUrl);
}

/** A page in Surecast's web app. */
export const surecastPage = (path: string) => `${getSurecastUrl()}${path}`;
export const postPage = (postId: string) => surecastPage(`/posts/${postId}/edit`);

export interface SurecastStatus {
  connected: boolean;
  email: string | null;
  workspace: string | null;
  chunkedUpload: boolean;
  error: string | null;
}

export interface SurecastClient {
  id: string;
  name: string;
  color?: string;
  channelCount?: number;
}

export interface PostPackage {
  projectId: string;
  projectName: string;
  videoPath: string;
  coverPath: string | null;
  coverTimeSec: number | null;
  clientId: string;
  title: string;
  hook: string;
  caption: string;
  hashtags: string[];
  srt: string;
  language: string;
  durationSec: number;
  aspect: string;
}

export type JobState = "queued" | "uploading" | "creating" | "sent" | "failed";

export interface SendJob {
  id: string;
  createdAt: number;
  package: PostPackage;
  state: JobState;
  attempts: number;
  nextAttemptAt: number;
  error: string | null;
  postId: string | null;
  remoteStatus: string | null;
  scheduledAt: string | null;
  links: string[];
}

export interface SendProgress {
  jobId: string;
  phase: "uploading" | "creating";
  sent: number;
  total: number;
}

export const surecastStatus = () => invoke<SurecastStatus>("surecast_status", { base: getSurecastUrl() });
export const connectSurecast = (token: string) =>
  invoke<SurecastStatus>("surecast_connect", { base: getSurecastUrl(), token });
export const disconnectSurecast = () => invoke<void>("surecast_disconnect");
export const listClients = () => invoke<SurecastClient[]>("surecast_clients", { base: getSurecastUrl() });
export const enqueueSend = (pkg: PostPackage) =>
  invoke<string>("surecast_enqueue", { base: getSurecastUrl(), package: pkg });
export const listJobs = () => invoke<SendJob[]>("surecast_jobs");
export const retryJob = (jobId: string) => invoke<void>("surecast_retry", { jobId });
export const removeJob = (jobId: string) => invoke<void>("surecast_remove", { jobId });
export const refreshJobs = () => invoke<SendJob[]>("surecast_refresh");

export async function onSendEvents(h: {
  progress?: (p: SendProgress) => void;
  done?: (d: { jobId: string; postId: string | null }) => void;
  failed?: (f: { jobId: string; error: string }) => void;
}): Promise<UnlistenFn> {
  const offs = await Promise.all([
    listen<SendProgress>("publish://progress", (e) => h.progress?.(e.payload)),
    listen<{ jobId: string; postId: string | null }>("publish://done", (e) => h.done?.(e.payload)),
    listen<{ jobId: string; error: string }>("publish://failed", (e) => h.failed?.(e.payload)),
  ]);
  return () => offs.forEach((off) => off());
}

const POLL_MS = 3 * 60_000;

/**
 * The send queue with status read back from Surecast: on mount, every few minutes
 * and when the window regains focus. Also resumes unsent jobs after a restart.
 */
export function useSentPosts(): { jobs: SendJob[]; reload: () => void } {
  const [jobs, setJobs] = useState<SendJob[]>([]);
  const reload = useCallback(() => {
    refreshJobs()
      .then(setJobs)
      .catch(() =>
        listJobs()
          .then(setJobs)
          .catch(() => {}),
      );
  }, []);

  useEffect(() => {
    reload();
    const t = window.setInterval(reload, POLL_MS);
    window.addEventListener("focus", reload);
    let off: UnlistenFn | undefined;
    let alive = true;
    void onSendEvents({ done: reload, failed: reload }).then((u) => (alive ? (off = u) : u()));
    return () => {
      alive = false;
      window.clearInterval(t);
      window.removeEventListener("focus", reload);
      off?.();
    };
  }, [reload]);

  return { jobs, reload };
}

/** Plain-language state for a job: local queue first, then Surecast's post status. */
export function jobLabel(j: SendJob): { text: string; tone: "info" | "success" | "danger" } {
  if (j.state === "failed") return { text: "Didn't send", tone: "danger" };
  if (j.state !== "sent") return { text: j.attempts ? "Waiting to retry" : "Sending", tone: "info" };
  switch (j.remoteStatus) {
    case "published":
      return { text: "Posted", tone: "success" };
    case "partial":
      return { text: "Posted on some", tone: "success" };
    case "failed":
      return { text: "Failed in Surecast", tone: "danger" };
    case "publishing":
      return { text: "Posting", tone: "info" };
    case "scheduled":
      return { text: "Scheduled", tone: "info" };
    case "awaiting_approval":
    case "changes_requested":
      return { text: "Waiting for approval", tone: "info" };
    case "deleted":
    case "cancelled":
      return { text: "Removed in Surecast", tone: "danger" };
    default:
      return { text: "Draft in Surecast", tone: "info" };
  }
}

// ---------- package helpers ----------

const pad = (n: number, w = 2) => String(Math.floor(n)).padStart(w, "0");

function srtTime(sec: number) {
  const ms = Math.max(0, Math.round(sec * 1000));
  return `${pad(ms / 3_600_000)}:${pad((ms / 60_000) % 60)}:${pad((ms / 1000) % 60)},${pad(ms % 1000, 3)}`;
}

/** SRT from the project's caption track, on the reel's own timeline. */
export function captionsToSrt(project: Project): string {
  const clips: Clip[] = project.tracks.find((t) => t.kind === "captions")?.clips ?? [];
  return clips
    .filter((c) => (c.text ?? "").trim())
    .sort((a, b) => a.start - b.start)
    .map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text!.trim()}\n`)
    .join("\n");
}

/** Spoken text from the caption track, for the caption writer. */
export function transcriptOf(project: Project): string {
  return (project.tracks.find((t) => t.kind === "captions")?.clips ?? [])
    .map((c) => c.text ?? "")
    .join(" ")
    .trim();
}

/**
 * Picks the best cover from filmstrip frames: sharp (edge energy), well lit (not too dark
 * or blown out) and away from the very first and last frames. Returns the index.
 * shortcut: no face detection; add the reframe face model's score here when it is cheap to run.
 */
export async function bestFrameIndex(urls: string[]): Promise<number> {
  if (urls.length < 3) return 0;
  const last = urls.length - 1;
  const scores = await Promise.all(
    urls.map((u, i) =>
      frameScore(u).then(
        (s) => (i === 0 || i === last ? s * 0.6 : s),
        () => 0,
      ),
    ),
  );
  const best = scores.indexOf(Math.max(...scores));
  // Every frame unreadable (e.g. the canvas was blocked): a third of the way in is a safe guess.
  return scores[best] > 0 ? best : Math.floor(urls.length / 3);
}

function frameScore(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = 64;
      const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas"));
      ctx.drawImage(img, 0, 0, w, h);
      const d = ctx.getImageData(0, 0, w, h).data;
      const lum = new Float32Array(w * h);
      let sum = 0;
      for (let i = 0; i < w * h; i++) {
        lum[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
        sum += lum[i];
      }
      const mean = sum / (w * h);
      let edges = 0;
      for (let y = 1; y < h - 1; y++)
        for (let x = 1; x < w - 1; x++) {
          const i = y * w + x;
          edges += Math.abs(4 * lum[i] - lum[i - 1] - lum[i + 1] - lum[i - w] - lum[i + w]);
        }
      const sharp = edges / (w * h);
      // Brightness is best around mid-grey; very dark or white frames make poor covers.
      const light = 1 - Math.min(1, Math.abs(mean - 130) / 130);
      resolve(sharp * (0.3 + light));
    };
    img.onerror = () => reject(new Error("load"));
    img.src = url;
  });
}
