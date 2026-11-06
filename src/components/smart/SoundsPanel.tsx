import { useEffect, useRef, useState } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { Icon } from "../Icon";
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

  return (
    <>
      {group("music", "Music beds")}
      {group("sfx", "Sound effects")}
    </>
  );
}
