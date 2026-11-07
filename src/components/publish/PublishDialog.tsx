import { useEffect, useMemo, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Button, Progress } from "../ui";
import { writeCaptions, type CaptionDraft } from "../../lib/captionWriter";
import { useCharged } from "../../lib/credits";
import { useFilmstrip } from "../../lib/filmstrip";
import { probeMedia, type MediaInfo } from "../../lib/media";
import type { AspectRatio, Project } from "../../lib/project";
import { getSettings } from "../../lib/settings";
import {
  bestFrameIndex,
  captionsToSrt,
  enqueueSend,
  getSurecastUrl,
  listClients,
  onSendEvents,
  postPage,
  surecastStatus,
  transcriptOf,
  type SendProgress,
  type SurecastClient,
} from "../../lib/surecast";
import { Select } from "../Select";

interface PublishDialogProps {
  /** The exported MP4. */
  outputPath: string;
  project: Project;
  aspect: AspectRatio;
  /** Spoken text; taken from the caption track when left out. */
  transcript?: string;
  onClose: () => void;
}

type Phase =
  | { step: "loading" }
  | { step: "blocked"; text: string }
  | { step: "form"; error?: string }
  | { step: "sending"; jobId: string; progress?: SendProgress; waiting?: string }
  | { step: "sent"; postId: string | null };

const splitTags = (s: string) =>
  s
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : `#${t}`));

/** "Send to Surecast": packages the exported reel as a draft post, then opens it in Surecast to schedule. */
export function PublishDialog({ outputPath, project, aspect, transcript, onClose }: PublishDialogProps) {
  const [phase, setPhase] = useState<Phase>({ step: "loading" });
  const [clients, setClients] = useState<SurecastClient[]>([]);
  const [clientId, setClientId] = useState("");
  const [media, setMedia] = useState<MediaInfo>();
  const [cover, setCover] = useState<number | null>(null);
  const [title, setTitle] = useState(project.name);
  const [hook, setHook] = useState("");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [draft, setDraft] = useState<CaptionDraft | null>(null);
  const frames = useFilmstrip(media);
  const spoken = useMemo(() => transcript ?? transcriptOf(project), [transcript, project]);

  // Connection and brands.
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!getSurecastUrl())
        return setPhase({ step: "blocked", text: "Add your Surecast address in Settings first." });
      const s = await surecastStatus();
      if (!s.connected) return setPhase({ step: "blocked", text: "Connect Surecast in Settings first." });
      const list = await listClients();
      if (!alive) return;
      if (!list.length)
        return setPhase({ step: "blocked", text: "Add a brand in Surecast first, then come back." });
      setClients(list);
      setClientId(list[0].id);
      setPhase({ step: "form" });
    })().catch((e) => alive && setPhase({ step: "blocked", text: String(e) }));
    return () => {
      alive = false;
    };
  }, []);

  // The exported file, for cover frames.
  useEffect(() => {
    probeMedia(outputPath)
      .then(setMedia)
      .catch(() => {});
  }, [outputPath]);

  // Best cover frame, until the user picks one.
  useEffect(() => {
    if (!frames.length) return;
    let alive = true;
    void bestFrameIndex(frames).then((i) => alive && setCover((c) => c ?? i));
    return () => {
      alive = false;
    };
  }, [frames]);

  // Offline caption ideas from the transcript.
  const charge = useCharged();
  useEffect(() => {
    let alive = true;
    void charge("caption_writer", 1, () => writeCaptions({ transcript: spoken, title: project.name })).then(
      (d) => {
        if (!alive) return;
        setDraft(d);
        setHook((h) => h || d.options[0].hook);
        setCaption((c) => c || [d.options[0].summary, d.options[0].cta].filter(Boolean).join("\n\n"));
        setTags((t) => t || d.hashtags.join(" "));
      },
      () => {},
    ); // no credits: the fields stay empty for the user to write
    return () => {
      alive = false;
    };
  }, [spoken, project.name, charge]);

  // Progress and result for the job this dialog started.
  const jobId = phase.step === "sending" ? phase.jobId : null;
  useEffect(() => {
    if (!jobId) return;
    let off: (() => void) | undefined;
    let alive = true;
    void onSendEvents({
      progress: (p) =>
        p.jobId === jobId &&
        setPhase((ph) => (ph.step === "sending" ? { ...ph, progress: p, waiting: undefined } : ph)),
      done: (d) => {
        if (d.jobId !== jobId) return;
        setPhase({ step: "sent", postId: d.postId });
        if (d.postId) void openUrl(postPage(d.postId)).catch(() => {});
      },
      failed: (f) => f.jobId === jobId && setPhase({ step: "form", error: f.error }),
    }).then((u) => (alive ? (off = u) : u()));
    // No progress for a while usually means we're offline; the queue keeps trying.
    const t = window.setTimeout(
      () =>
        setPhase((ph) =>
          ph.step === "sending" && !ph.progress
            ? { ...ph, waiting: "Still waiting for Surecast. We'll keep trying, even if you close Verso." }
            : ph,
        ),
      15_000,
    );
    return () => {
      alive = false;
      off?.();
      window.clearTimeout(t);
    };
  }, [jobId]);

  const send = async () => {
    if (!title.trim()) return setPhase({ step: "form", error: "Give the reel a title." });
    const dur = media?.durationSec ?? 0;
    const coverTime = cover != null && frames.length && dur ? ((cover + 0.5) * dur) / frames.length : null;
    try {
      const id = await enqueueSend({
        projectId: project.id,
        projectName: project.name,
        videoPath: outputPath,
        coverPath: null,
        coverTimeSec: coverTime,
        clientId,
        title: title.trim(),
        hook: hook.trim(),
        caption: caption.trim(),
        hashtags: splitTags(tags),
        srt: captionsToSrt(project),
        language: draft?.language ?? getSettings().captionLanguage,
        durationSec: dur,
        aspect,
      });
      setPhase({ step: "sending", jobId: id });
    } catch (e) {
      setPhase({ step: "form", error: String(e) });
    }
  };

  const pct =
    phase.step === "sending" && phase.progress?.total
      ? Math.floor((phase.progress.sent / phase.progress.total) * 100)
      : 0;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="export publish" role="dialog" aria-modal="true" aria-labelledby="publish-title">
        {(phase.step === "loading" || phase.step === "blocked") && (
          <>
            <h2 id="publish-title" className="export__title">
              Send to Surecast
            </h2>
            <p className="export__hint">
              {phase.step === "loading" ? "Checking your Surecast connection…" : phase.text}
            </p>
            <div className="export__actions">
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}

        {phase.step === "form" && (
          <>
            <h2 id="publish-title" className="export__title">
              Send to Surecast
            </h2>
            <p className="export__hint">It arrives as a draft. You pick the accounts and time in Surecast.</p>

            {clients.length > 1 && (
              <>
                <span className="export__label">Brand</span>
                <Select
                  className="export__input"
                  value={clientId}
                  onChange={setClientId}
                  label="Surecast brand"
                  options={clients.map((c) => ({ value: c.id, label: c.name }))}
                />
              </>
            )}

            <span className="export__label">Cover</span>
            {frames.length ? (
              <div className="publish__frames" role="radiogroup" aria-label="Cover frame">
                {frames.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    role="radio"
                    aria-checked={cover === i}
                    aria-label={`Frame ${i + 1}`}
                    data-tip={`Use frame ${i + 1} as the cover`}
                    className={cover === i ? "publish__frame is-active" : "publish__frame"}
                    onClick={() => setCover(i)}
                  >
                    <img src={src} alt="" draggable={false} />
                  </button>
                ))}
              </div>
            ) : (
              <p className="export__hint publish__muted">Loading frames…</p>
            )}

            <span className="export__label">Title</span>
            <input
              className="export__input"
              value={title}
              maxLength={100}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Title"
            />

            <span className="export__label">Hook</span>
            <input
              className="export__input"
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              aria-label="Hook"
            />

            <span className="export__label">Caption</span>
            {draft && draft.options.length > 1 && (
              <div className="publish__ideas" aria-label="Caption ideas">
                {draft.options.map((o, i) => (
                  <button
                    key={o.hook}
                    type="button"
                    className="publish__idea"
                    title={o.text}
                    onClick={() => {
                      setHook(o.hook);
                      setCaption([o.summary, o.cta].filter(Boolean).join("\n\n"));
                    }}
                  >
                    Idea {i + 1}
                  </button>
                ))}
              </div>
            )}
            <textarea
              className="export__input publish__textarea"
              value={caption}
              rows={4}
              onChange={(e) => setCaption(e.target.value)}
              aria-label="Caption"
            />

            <span className="export__label">Hashtags</span>
            <input
              className="export__input"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              aria-label="Hashtags"
            />

            {phase.error && (
              <p className="export__error" role="alert">
                {phase.error}
              </p>
            )}

            <div className="export__actions">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" icon="export" onClick={() => void send()} disabled={!clientId}>
                Send to Surecast
              </Button>
            </div>
          </>
        )}

        {phase.step === "sending" && (
          <>
            <h2 id="publish-title" className="export__title">
              {phase.progress?.phase === "creating" ? "Creating the post…" : `Sending… ${pct}%`}
            </h2>
            <Progress
              value={phase.progress?.phase === "creating" ? undefined : pct}
              label={phase.progress?.phase === "creating" ? "Creating the post…" : "Sending your reel"}
            />
            <p className="export__hint">
              {phase.waiting ?? "You can close this. Sending carries on in the background."}
            </p>
            <div className="export__actions">
              <Button onClick={onClose}>Close</Button>
            </div>
          </>
        )}

        {phase.step === "sent" && (
          <>
            <h2 id="publish-title" className="export__title">
              Sent to Surecast
            </h2>
            <p className="export__hint">
              Your reel is a draft in Surecast. Pick the accounts and time there.
            </p>
            <div className="export__actions">
              <Button variant="ghost" onClick={onClose}>
                Done
              </Button>
              {phase.postId && (
                <Button onClick={() => void openUrl(postPage(phase.postId!)).catch(() => {})}>
                  Open in Surecast
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
