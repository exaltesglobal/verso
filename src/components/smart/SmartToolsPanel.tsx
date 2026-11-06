import { useMemo, useState } from "react";
import { Icon } from "../Icon";
import { Button, Segmented, Toggle, type ToastMessage } from "../ui";
import type { Project } from "../../lib/project";
import {
  FALSE_START_KIND,
  FILLER_KINDS,
  PAUSE_PRESETS,
  REPEAT_KIND,
  applyPunchIns,
  captionEmphasisTimes,
  clearPunchIns,
  collectWords,
  countFillers,
  defaultFillerOptions,
  detectEmphasis,
  detectSilences,
  findFillers,
  hasPunchIns,
  removeFillers,
  removeSilences,
  totalLength,
  videoClips,
  type EmphasisMoment,
  type FillerLang,
  type PauseSensitivity,
  type Span,
} from "../../lib/smart";
import { CutToBeatToggle } from "./CutToBeatToggle";
import { plural, useAnalysisProgress } from "./hooks";
import { LevelSlider, Listening, SmartCard } from "./parts";

export interface SmartToolsPanelProps {
  project: Project;
  /** Applies a smart edit as one undoable change and shows `message`. */
  onApply: (next: Project, message: string) => void;
  /** Opens caption writing; filler removal needs caption words. */
  onNeedCaptions: () => void;
  notify?: (m: ToastMessage) => void;
}

/** The "Magic" tab: one-click smart edits. */
export function SmartToolsPanel({ project, onApply, onNeedCaptions, notify }: SmartToolsPanelProps) {
  return (
    <div className="panel__body smart-tools">
      <div className="panel__head">
        <h2 className="panel__title">
          <Icon name="one-click" size={20} />
          Magic
        </h2>
        <p className="panel__lede">One-click edits. Each one is a single step you can undo.</p>
      </div>
      <RemovePauses project={project} onApply={onApply} />
      <RemoveFillers project={project} onApply={onApply} onNeedCaptions={onNeedCaptions} />
      <PunchIns project={project} onApply={onApply} notify={notify} />
      <CutToBeat project={project} onApply={onApply} />
    </div>
  );
}

type ApplyProps = Pick<SmartToolsPanelProps, "project" | "onApply" | "notify">;

const fmtSec = (s: number) =>
  s < 60 ? `${Math.round(s)} s` : `${Math.floor(s / 60)} min ${Math.round(s % 60)} s`;

/** Runs `job` on each item in turn and turns per-item progress into one percent. */
function useSequence(task: Parameters<typeof useAnalysisProgress>[0]) {
  const [percent, setPercent] = useAnalysisProgress(task);
  const [step, setStep] = useState<{ i: number; n: number } | null>(null);
  const run = async <T, R>(items: T[], job: (item: T) => Promise<R>): Promise<R[]> => {
    const out: R[] = [];
    try {
      for (let i = 0; i < items.length; i++) {
        setPercent(0);
        setStep({ i, n: items.length });
        out.push(await job(items[i]));
      }
    } finally {
      setStep(null);
    }
    return out;
  };
  const overall = step ? (step.i * 100 + percent) / step.n : 0;
  return { run, busy: step !== null, overall };
}

function RemovePauses({ project, onApply }: Pick<ApplyProps, "project" | "onApply">) {
  const [sensitivity, setSensitivity] = useState<PauseSensitivity>("Normal");
  const [found, setFound] = useState<{ clipId: string; spans: Span[] }[] | null>(null);
  const [error, setError] = useState<string>();
  const { run, busy, overall } = useSequence("silences");
  const targets = videoClips(project).filter((c) => c.source?.hasAudio);

  const find = async (s: PauseSensitivity) => {
    setError(undefined);
    setFound(null);
    try {
      const spans = await run(targets, (c) => detectSilences(c, PAUSE_PRESETS[s]));
      setFound(targets.map((c, i) => ({ clipId: c.id, spans: spans[i] })));
    } catch (e) {
      setError(String(e));
    }
  };

  const all = found?.flatMap((f) => f.spans) ?? [];
  const apply = () => {
    const next = (found ?? []).reduce((p, f) => removeSilences(p, f.clipId, f.spans), project);
    onApply(next, `Removed ${plural(all.length, "pause")} (${fmtSec(totalLength(all))}).`);
    setFound(null);
  };

  return (
    <SmartCard icon="auto-cut" title="Remove pauses" lede="Cut the quiet gaps between your sentences.">
      {targets.length === 0 ? (
        <p className="smart-note">Add a video with sound to use this.</p>
      ) : (
        <>
          <Segmented
            label="Sensitivity"
            options={["Gentle", "Normal", "Tight"] as const}
            value={sensitivity}
            onChange={(s) => {
              setSensitivity(s);
              if (found) void find(s);
            }}
          />
          {busy && <Listening percent={overall} />}
          {!busy && found && (
            <p className="smart-result">
              {all.length
                ? `We found ${plural(all.length, "pause")} (${fmtSec(totalLength(all))}).`
                : sensitivity === "Tight"
                  ? "No pauses to remove. Your reel is already tight."
                  : "No long pauses found. Try Tight."}
            </p>
          )}
          {error && <p className="smart-note smart-note--error">{error}</p>}
          <div className="smart-actions">
            {found && all.length > 0 ? (
              <Button icon="split" onClick={apply} disabled={busy}>
                Remove {plural(all.length, "pause")}
              </Button>
            ) : (
              <Button onClick={() => void find(sensitivity)} disabled={busy}>
                Find pauses
              </Button>
            )}
          </div>
        </>
      )}
    </SmartCard>
  );
}

const LANGS = { English: ["en"], Hindi: ["hi"], Both: ["en", "hi"] } as const satisfies Record<
  string,
  readonly FillerLang[]
>;
type LangChoice = keyof typeof LANGS;

function RemoveFillers({
  project,
  onApply,
  onNeedCaptions,
}: Pick<SmartToolsPanelProps, "project" | "onApply" | "onNeedCaptions">) {
  const words = useMemo(() => collectWords(project), [project]);
  const [lang, setLang] = useState<LangChoice>("Both");
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const languages = [...LANGS[lang]];
  const counts = useMemo(() => countFillers(words, [...LANGS[lang]]), [words, lang]);
  const defaults = new Set(defaultFillerOptions(languages).enabled);
  const rows = [...FILLER_KINDS, REPEAT_KIND, FALSE_START_KIND].filter((k) => counts.get(k.id));
  const isOn = (id: string) => picked[id] ?? defaults.has(id);
  const enabled = rows.filter((k) => isOn(k.id)).map((k) => k.id);
  const total = enabled.reduce((s, id) => s + (counts.get(id) ?? 0), 0);

  if (!words.length) {
    return (
      <SmartCard icon="captions" title="Remove filler words" lede="Um, uh, matlab and repeated words, gone.">
        <p className="smart-note">We read your captions to find filler words.</p>
        <div className="smart-actions">
          <Button icon="captions" onClick={onNeedCaptions}>
            Write captions first
          </Button>
        </div>
      </SmartCard>
    );
  }

  return (
    <SmartCard icon="captions" title="Remove filler words" lede="Um, uh, matlab and repeated words, gone.">
      <Segmented
        label="Language"
        options={["English", "Hindi", "Both"] as const}
        value={lang}
        onChange={setLang}
      />
      {rows.length === 0 ? (
        <p className="smart-result">No filler words found. Nicely said.</p>
      ) : (
        <ul className="filler-list">
          {rows.map((k) => (
            <li key={k.id}>
              <label className="filler-row">
                <input
                  type="checkbox"
                  checked={isOn(k.id)}
                  onChange={(e) => setPicked((p) => ({ ...p, [k.id]: e.target.checked }))}
                />
                <span className="filler-row__label">{k.label}</span>
                <span className="filler-row__count">{counts.get(k.id)}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      {rows.length > 0 && (
        <div className="smart-actions">
          <Button
            icon="delete"
            disabled={total === 0}
            onClick={() => {
              const opts = { languages, enabled };
              const n = findFillers(words, opts).length;
              onApply(removeFillers(project, words, opts), `Removed ${plural(n, "filler word")}.`);
            }}
          >
            Remove {plural(total, "word")}
          </Button>
        </div>
      )}
    </SmartCard>
  );
}

function PunchIns({ project, onApply, notify }: ApplyProps) {
  const [intensity, setIntensity] = useState(0.75);
  // Moments per source file (source seconds), so they survive cuts and splits.
  const [moments, setMoments] = useState<Record<string, EmphasisMoment[]>>({});
  const { run, busy, overall } = useSequence("emphasis");
  const on = hasPunchIns(project);
  const clips = videoClips(project).filter((c) => c.source?.hasAudio);

  const apply = (byPath: Record<string, EmphasisMoment[]>, level: number) => {
    const perClip = Object.fromEntries(clips.map((c) => [c.id, byPath[c.source!.path] ?? []]));
    const next = applyPunchIns(project, perClip, level, captionEmphasisTimes(collectWords(project)));
    const n = videoClips(next).reduce((s, c) => s + (c.zoomKeys?.length ?? 0), 0);
    onApply(
      next,
      n ? `Added ${plural(n, "punch-in")} on your big moments.` : "We didn't find any big moments.",
    );
  };

  const turnOn = async () => {
    const missing = [...new Map(clips.map((c) => [c.source!.path, c.source!])).values()].filter(
      (m) => !moments[m.path],
    );
    try {
      const found = await run(missing, (m) =>
        detectEmphasis({
          id: m.path,
          label: m.fileName,
          start: 0,
          end: m.durationSec,
          inPoint: 0,
          source: m,
        }),
      );
      const all = { ...moments, ...Object.fromEntries(missing.map((m, i) => [m.path, found[i]])) };
      setMoments(all);
      apply(all, intensity);
    } catch (e) {
      notify?.({ tone: "danger", text: String(e) });
    }
  };

  return (
    <SmartCard
      icon="zoom-in"
      title="Punch in on big moments"
      lede="A quick zoom when your voice lifts or a caption shouts."
      aside={
        <Toggle
          checked={on}
          label="Punch in on big moments"
          onChange={(v) => (v ? void turnOn() : onApply(clearPunchIns(project), "Punch-ins removed."))}
        />
      }
    >
      {clips.length === 0 && <p className="smart-note">Add a video with sound to use this.</p>}
      {busy && <Listening percent={overall} />}
      {on && !busy && (
        <LevelSlider
          label="Intensity"
          low="Subtle"
          high="Strong"
          value={intensity}
          onChange={setIntensity}
          onCommit={() => apply(moments, intensity)}
        />
      )}
    </SmartCard>
  );
}

function CutToBeat({ project, onApply }: Pick<SmartToolsPanelProps, "project" | "onApply">) {
  const music = (project.tracks.find((t) => t.kind === "music")?.clips ?? []).filter((c) => c.source);
  const cuts = Math.max(0, videoClips(project).length - 1);
  return (
    <SmartCard icon="music" title="Cut to the beat" lede="Line your cuts up with the music.">
      {music.length === 0 ? (
        <p className="smart-note">Add music to your reel first.</p>
      ) : (
        <>
          {cuts === 0 && (
            <p className="smart-note">Split your video into a few clips so there are cuts to move.</p>
          )}
          {music.map((c) => (
            <CutToBeatToggle key={c.id} project={project} clip={c} onApply={onApply} />
          ))}
        </>
      )}
    </SmartCard>
  );
}
