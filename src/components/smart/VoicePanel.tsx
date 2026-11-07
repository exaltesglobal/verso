import { useCallback, useEffect, useRef, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Icon } from "../Icon";
import { Button, IconButton, Segmented, type ToastMessage } from "../ui";
import { useCharged } from "../../lib/credits";
import { formatMegabytes } from "../../lib/captions";
import { useEntitlements } from "../../lib/entitlements";
import { formatDuration, probeMedia } from "../../lib/media";
import type { Project } from "../../lib/project";
import {
  SOURCE_LANGUAGES,
  VOICE_LANGUAGES,
  addVoiceover,
  applyDub,
  captionScript,
  captionSegments,
  dub,
  downloadVoiceModel,
  listVoiceModels,
  onVoiceProgress,
  packsFor,
  synthesize,
  translate,
  voiceLabel,
  voicesFor,
  type SourceLang,
  type Voice,
  type VoiceLang,
  type VoicePack,
  type VoiceProgress,
} from "../../lib/voice";
import { Listening, SmartCard } from "./parts";
import { MoreSettings } from "../MoreSettings";

export interface VoicePanelProps {
  project: Project;
  /** Playhead, in timeline seconds: where a voiceover lands. */
  playhead: number;
  /** Applies the change as one undoable step and shows `message`. */
  onApply: (next: Project, message: string) => void;
  /** Opens caption writing; dubbing follows the caption lines. */
  onNeedCaptions: () => void;
  notify?: (m: ToastMessage) => void;
}

const SAMPLE: Record<VoiceLang, string> = {
  en: "Hi! This is how I sound in your reel.",
  hi: "नमस्ते! आपकी रील में मेरी आवाज़ ऐसी लगेगी।",
  mr: "नमस्कार! तुमच्या रीलमध्ये माझा आवाज असा वाटेल.",
};

const SPEEDS = { Slow: 0.85, Normal: 1, Fast: 1.15 } as const;
type SpeedName = keyof typeof SPEEDS;

/** Live percent from `voice://progress` for one task. */
function useVoiceProgress(task: VoiceProgress["task"]) {
  const [percent, setPercent] = useState(0);
  useEffect(() => {
    let alive = true;
    let stop: (() => void) | undefined;
    void onVoiceProgress((p) => p.task === task && setPercent(p.percent)).then((un) =>
      alive ? (stop = un) : un(),
    );
    return () => {
      alive = false;
      stop?.();
    };
  }, [task]);
  return [percent, setPercent] as const;
}

function useVoiceModels() {
  const [packs, setPacks] = useState<VoicePack[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [error, setError] = useState<string>();
  const reload = useCallback(
    () =>
      listVoiceModels()
        .then((m) => {
          setPacks(m.packs);
          setVoices(m.voices);
        })
        .catch((e) => setError(String(e))),
    [],
  );
  useEffect(() => {
    void reload();
  }, [reload]);
  return { packs, voices, error, reload };
}

/** "Download once, works offline" for each missing pack. Renders nothing when all are in. */
function Downloads({ packs, need, onDone }: { packs: VoicePack[]; need: string[]; onDone: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [percent, setPercent] = useVoiceProgress("download");
  const missing = packs.filter((p) => need.includes(p.id) && !p.installed);
  if (!missing.length) return null;

  const get = async (id: string) => {
    setError(undefined);
    setPercent(0);
    setBusy(id);
    try {
      await downloadVoiceModel(id);
      onDone();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="voice-downloads">
      <p className="smart-note">
        Get the voice AI pack once and it works offline. Nothing you type leaves your computer.
      </p>
      {missing.map((p) => (
        <div key={p.id} className="voice-download">
          <span className="voice-download__text">
            <strong>{p.name}</strong>
            <span>{p.purpose}</span>
          </span>
          {busy === p.id ? (
            <Listening percent={percent} label="Downloading…" />
          ) : (
            <Button icon="import" onClick={() => void get(p.id)} disabled={busy !== null}>
              Download {formatMegabytes(p.sizeBytes)}
            </Button>
          )}
        </div>
      ))}
      {error && <p className="smart-note smart-note--error">{error}</p>}
    </div>
  );
}

function LanguageChips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="voice-field">
      <span className="voice-field__label">{label}</span>
      <div className="chips" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={o.id === value}
            className={o.id === value ? "chip is-active" : "chip"}
            onClick={() => onChange(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Voice list with a play button that speaks a short sample (made on-device, cached). */
function VoicePicker({
  voices,
  lang,
  value,
  onChange,
  ready,
}: {
  voices: Voice[];
  lang: VoiceLang;
  value: string;
  onChange: (id: string) => void;
  ready: boolean;
}) {
  const samples = useRef(new Map<string, string>());
  const audio = useRef<HTMLAudioElement | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  useEffect(() => () => audio.current?.pause(), []);

  const play = async (v: Voice) => {
    setError(undefined);
    audio.current?.pause();
    const key = `${v.id}:${lang}`;
    try {
      let path = samples.current.get(key);
      if (!path) {
        setLoading(v.id);
        path = await synthesize(SAMPLE[lang], v.id, 1);
        samples.current.set(key, path);
      }
      audio.current = new Audio(convertFileSrc(path));
      await audio.current.play();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="voice-field">
      <span className="voice-field__label">Voice</span>
      <div className="voice-list" role="radiogroup" aria-label="Voice">
        {voicesFor(voices, lang).map((v) => (
          <div key={v.id} className={v.id === value ? "voice-row is-active" : "voice-row"}>
            <button
              type="button"
              role="radio"
              aria-checked={v.id === value}
              className="voice-row__pick"
              onClick={() => onChange(v.id)}
            >
              {voiceLabel(v, lang)}
            </button>
            <IconButton
              icon="play"
              label={loading === v.id ? `Making a sample of ${v.name}…` : `Hear ${v.name}`}
              disabled={!ready || loading !== null}
              onClick={() => void play(v)}
            />
          </div>
        ))}
      </div>
      {error && <p className="smart-note smart-note--error">{error}</p>}
    </div>
  );
}

/** The "Voice" panel: type a script and get a voiceover, or dub the whole reel. */
export function VoicePanel(props: VoicePanelProps) {
  const [tab, setTab] = useState<"Voiceover" | "Dub">("Voiceover");
  const models = useVoiceModels();
  return (
    <div className="panel__body voice-panel">
      <div className="panel__head">
        <h2 className="panel__title">
          <Icon name="voiceover" size={20} />
          Voice
        </h2>
        <p className="panel__lede">Natural voices made on your computer. Works offline after one download.</p>
      </div>
      <Segmented label="Voice tool" options={["Voiceover", "Dub"] as const} value={tab} onChange={setTab} />
      {models.error && <p className="smart-note smart-note--error">{models.error}</p>}
      {tab === "Voiceover" ? (
        <VoiceoverTab {...props} models={models} />
      ) : (
        <DubTab {...props} models={models} />
      )}
    </div>
  );
}

type TabProps = VoicePanelProps & { models: ReturnType<typeof useVoiceModels> };

const installed = (packs: VoicePack[], ids: string[]) =>
  ids.every((id) => packs.find((p) => p.id === id)?.installed);

function VoiceoverTab({ project, playhead, onApply, models }: TabProps) {
  const charge = useCharged();
  const [lang, setLang] = useState<VoiceLang>("en");
  const [voiceId, setVoiceId] = useState("hf_alpha");
  const [speed, setSpeed] = useState<SpeedName>("Normal");
  const [script, setScript] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [percent, setPercent] = useVoiceProgress("synthesize");
  const ready = installed(models.packs, packsFor(lang, lang));
  const fromCaptions = captionScript(project);

  const pickLang = (l: VoiceLang) => {
    setLang(l);
    const list = voicesFor(models.voices, l);
    if (!list.some((v) => v.id === voiceId) && list[0]) setVoiceId(list[0].id);
  };

  const make = async () => {
    setError(undefined);
    setPercent(0);
    setBusy(true);
    try {
      // Output length isn't known before synthesis: estimate ~150 spoken words a minute.
      const minutes = script.trim().split(/\s+/).length / 150 / SPEEDS[speed];
      const media = await charge("voiceover", minutes, async () =>
        probeMedia(await synthesize(script, voiceId, SPEEDS[speed])),
      );
      const { project: next } = addVoiceover(project, media, playhead);
      onApply(next, `Voiceover added at ${formatDuration(playhead)}.`);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SmartCard
      icon="voiceover"
      title="Voiceover"
      lede="Type or paste a script. We add the voice at the playhead."
    >
      <Downloads packs={models.packs} need={packsFor(lang, lang)} onDone={() => void models.reload()} />
      <VoicePicker voices={models.voices} lang={lang} value={voiceId} onChange={setVoiceId} ready={ready} />
      <label className="voice-field">
        <span className="voice-field__label">Script</span>
        <textarea
          className="voice-script"
          rows={5}
          value={script}
          placeholder={lang === "en" ? "Write what the voice should say…" : SAMPLE[lang]}
          onChange={(e) => setScript(e.target.value)}
        />
      </label>
      {fromCaptions && (
        <button type="button" className="voice-link" onClick={() => setScript(fromCaptions)}>
          Use my caption text
        </button>
      )}
      <MoreSettings>
        <LanguageChips label="Language" options={VOICE_LANGUAGES} value={lang} onChange={pickLang} />
        <Segmented
          label="Speed"
          options={Object.keys(SPEEDS) as SpeedName[]}
          value={speed}
          onChange={setSpeed}
        />
      </MoreSettings>
      {busy && <Listening percent={percent} label="Making the voice…" />}
      {error && <p className="smart-note smart-note--error">{error}</p>}
      <div className="smart-actions">
        <Button icon="voiceover" onClick={() => void make()} disabled={!ready || busy || !script.trim()}>
          Make voiceover
        </Button>
      </div>
    </SmartCard>
  );
}

function DubTab({ project, onApply, onNeedCaptions, models }: TabProps) {
  const { can, openUpgrade } = useEntitlements();
  const charge = useCharged();
  const [from, setFrom] = useState<SourceLang>("en");
  const [to, setTo] = useState<VoiceLang>("hi");
  const [voiceId, setVoiceId] = useState("hf_alpha");
  const [stage, setStage] = useState<"translating" | "speaking" | null>(null);
  const [error, setError] = useState<string>();
  const [tPercent, setTPercent] = useVoiceProgress("translate");
  const [dPercent, setDPercent] = useVoiceProgress("dub");
  const segments = captionSegments(project);
  const targets = VOICE_LANGUAGES.filter((l) => (from === "en" ? l.id !== "en" : l.id === "en"));
  const need = packsFor(from, to);
  const ready = installed(models.packs, need);
  const pro = can("dubbing");

  const pickFrom = (f: SourceLang) => {
    setFrom(f);
    const nextTo = f === "en" ? (to === "en" ? "hi" : to) : "en";
    pickTo(nextTo);
  };
  const pickTo = (t: VoiceLang) => {
    setTo(t);
    const list = voicesFor(models.voices, t);
    if (!list.some((v) => v.id === voiceId) && list[0]) setVoiceId(list[0].id);
  };

  const run = async () => {
    if (!pro) {
      openUpgrade("Dubbing your reel into another language is part of Verso Pro.");
      return;
    }
    setError(undefined);
    setTPercent(0);
    setDPercent(0);
    try {
      const minutes = segments.length ? (segments[segments.length - 1].end - segments[0].start) / 60 : 0;
      const { lines, media } = await charge("dubbing", minutes, async () => {
        setStage("translating");
        const lines = await translate(
          segments.map((s) => s.text),
          from,
          to,
        );
        setStage("speaking");
        const path = await dub(
          segments.map((s, i) => ({ start: s.start, end: s.end, text: lines[i] })),
          to,
          to,
          voiceId,
        );
        return { lines, media: await probeMedia(path) };
      });
      const next = applyDub(project, media, segments[0].start, lines, to);
      const name = VOICE_LANGUAGES.find((l) => l.id === to)?.label ?? to;
      onApply(next, `Dubbed into ${name}. The original sound is muted and captions show the translation.`);
    } catch (e) {
      setError(String(e));
    } finally {
      setStage(null);
    }
  };

  return (
    <SmartCard
      icon="voiceover"
      title="Dub your reel"
      lede="Translate your captions and speak them in a new voice, timed to the original."
      aside={pro ? undefined : <span className="tpl-badge">Pro</span>}
    >
      {segments.length === 0 ? (
        <>
          <p className="smart-note">Dubbing follows your caption lines. Write captions first.</p>
          <div className="smart-actions">
            <Button icon="captions" onClick={onNeedCaptions}>
              Write captions
            </Button>
          </div>
        </>
      ) : (
        <>
          {pro && <Downloads packs={models.packs} need={need} onDone={() => void models.reload()} />}
          <LanguageChips label="Dub into" options={targets} value={to} onChange={pickTo} />
          <p className="smart-note">
            {segments.length} caption {segments.length === 1 ? "line" : "lines"}. Check the translation in
            Captions afterwards: automatic translation can miss slang.
          </p>
          <MoreSettings>
            <LanguageChips
              label="My captions are in"
              options={SOURCE_LANGUAGES}
              value={from}
              onChange={pickFrom}
            />
            <VoicePicker
              voices={models.voices}
              lang={to}
              value={voiceId}
              onChange={setVoiceId}
              ready={ready}
            />
          </MoreSettings>
          {stage === "translating" && <Listening percent={tPercent} label="Translating…" />}
          {stage === "speaking" && <Listening percent={dPercent} label="Making the voice…" />}
          {error && <p className="smart-note smart-note--error">{error}</p>}
          <div className="smart-actions">
            <Button icon="voiceover" onClick={() => void run()} disabled={(pro && !ready) || stage !== null}>
              Dub reel
            </Button>
          </div>
        </>
      )}
    </SmartCard>
  );
}
