import { useEffect, useRef, useState } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { Icon, type IconName } from "../Icon";
import { MoreSettings } from "../MoreSettings";
import { probeMedia } from "../../lib/media";
import { uid, type Project } from "../../lib/project";

interface SoundItem {
  id: string;
  name: string;
  kind: "sfx" | "music";
  mood: string;
  seconds: number;
  path: string;
}

interface SoundsPanelProps {
  project: Project;
  /** Where new sounds land. */
  time: number;
  onApply: (next: Project, message: string) => void;
}

/** One-tap mixes: voice (video + its Sound) against music, both as clip volume 0..1. */
const MIXES: { id: string; label: string; icon: IconName; voice: number; music: number }[] = [
  { id: "louder", label: "Louder", icon: "volume", voice: 1, music: 0.6 },
  { id: "balanced", label: "Balanced", icon: "headphones", voice: 0.9, music: 0.35 },
  { id: "under", label: "Music under voice", icon: "voiceover", voice: 1, music: 0.15 },
];

function applyMix(project: Project, voice: number, music: number): Project {
  return {
    ...project,
    updatedAt: Date.now(),
    tracks: project.tracks.map((t) =>
      t.kind === "music"
        ? { ...t, clips: t.clips.map((c) => ({ ...c, volume: music })) }
        : t.kind === "video" || t.kind === "audio"
          ? { ...t, clips: t.clips.map((c) => (c.source?.hasAudio ? { ...c, volume: voice } : c)) }
          : t,
    ),
  };
}

/** Built-in sound effects and music beds, made by Verso (no licences to worry about). */
export function SoundsPanel({ project, time, onApply }: SoundsPanelProps) {
  const [items, setItems] = useState<SoundItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    invoke<SoundItem[]>("sound_library")
      .then(setItems)
      .catch((e) => setError(String(e)));
    return () => audio.current?.pause();
  }, []);

  const preview = (s: SoundItem) => {
    audio.current?.pause();
    if (playing === s.id) {
      setPlaying(null);
      return;
    }
    const a = new Audio(convertFileSrc(s.path));
    a.volume = 0.8;
    a.onended = () => setPlaying(null);
    void a.play();
    audio.current = a;
    setPlaying(s.id);
  };

  const add = async (s: SoundItem) => {
    const media = await probeMedia(s.path);
    const clip = {
      id: uid("m"),
      label: s.name,
      start: time,
      end: time + media.durationSec,
      inPoint: 0,
      source: media,
      volume: s.kind === "music" ? 0.5 : 0.9,
      fadeIn: s.kind === "music" ? 1 : 0,
      fadeOut: s.kind === "music" ? 2 : 0,
    };
    onApply(
      {
        ...project,
        updatedAt: Date.now(),
        tracks: project.tracks.map((t) =>
          t.kind === "music" ? { ...t, clips: [...t.clips, clip].sort((a, b) => a.start - b.start) } : t,
        ),
      },
      `Added ${s.name} at the playhead.`,
    );
  };

  if (error) return <p className="form-error">{error}</p>;
  if (!items) return <p className="muted small">Getting your sounds ready…</p>;

  const group = (kind: SoundItem["kind"], title: string) => (
    <>
      <h3 className="section-label">{title}</h3>
      <ul className="audio-list">
        {items
          .filter((s) => s.kind === kind)
          .map((s) => (
            <li key={s.id}>
              <div className="audio-item">
                <button
                  type="button"
                  className="audio-item__play"
                  aria-label={playing === s.id ? `Stop ${s.name}` : `Play ${s.name}`}
                  data-tip={playing === s.id ? "Stop" : "Listen"}
                  onClick={() => preview(s)}
                >
                  <Icon name={playing === s.id ? "pause" : "play"} size={16} />
                </button>
                <span className="audio-item__text">
                  <span className="audio-item__name">{s.name}</span>
                  <span className="audio-item__meta">{s.mood}</span>
                </span>
                <button
                  type="button"
                  className="media-item__add"
                  aria-label={`Add ${s.name}`}
                  data-tip="Add at playhead"
                  onClick={() => void add(s)}
                >
                  <Icon name="add" size={20} />
                </button>
              </div>
            </li>
          ))}
      </ul>
    </>
  );

  const hasSound = project.tracks.some((t) => t.kind !== "text" && t.kind !== "captions" && t.clips.length);
  return (
    <>
      <h3 className="section-label">Mix in one tap</h3>
      <div className="mix-presets" role="group" aria-label="Mix">
        {MIXES.map((m) => (
          <button
            key={m.id}
            type="button"
            className="mix-preset"
            disabled={!hasSound}
            data-tip={hasSound ? undefined : "Add a video or music first"}
            onClick={() => onApply(applyMix(project, m.voice, m.music), `${m.label} mix on.`)}
          >
            <Icon name={m.icon} size={20} />
            {m.label}
          </button>
        ))}
      </div>
      {group("music", "Music beds")}
      <MoreSettings label="Sound effects">{group("sfx", "Sound effects")}</MoreSettings>
    </>
  );
}
