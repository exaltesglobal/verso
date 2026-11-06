import { Icon } from "../Icon";
import { Button, IconButton } from "../ui";
import { frameAt, useFilmstrip } from "../../lib/filmstrip";
import { formatDuration } from "../../lib/media";
import { videoClipAt, type AspectRatio, type Project } from "../../lib/project";

interface PreviewProps {
  project: Project;
  duration: number;
  aspect: AspectRatio;
  time: number;
  playing: boolean;
  onTogglePlay: () => void;
  onSeek: (t: number) => void;
  onImport: () => void;
  importing: boolean;
}

const RATIO_CLASS: Record<AspectRatio, string> = {
  "9:16": "is-vertical",
  "1:1": "is-square",
  "16:9": "is-wide",
};

export function Preview({
  project,
  duration,
  aspect,
  time,
  playing,
  onTogglePlay,
  onSeek,
  onImport,
  importing,
}: PreviewProps) {
  const captions = project.tracks.find((t) => t.kind === "captions")?.clips ?? [];
  const caption = captions.find((c) => time >= c.start && time < c.end);
  const words = caption?.label.split(" ") ?? [];
  // Highlight the word being "spoken" right now.
  const active = caption
    ? Math.min(
        words.length - 1,
        Math.floor(((time - caption.start) / (caption.end - caption.start)) * words.length),
      )
    : -1;

  const clip = videoClipAt(project, time);
  const frames = useFilmstrip(clip?.source);
  const frame =
    clip?.source && frameAt(frames, clip.source.durationSec, (clip.inPoint ?? 0) + time - clip.start);
  const empty = duration === 0;

  return (
    <section className="preview" aria-label="Preview">
      <div className="preview__stage">
        <div className={`frame ${RATIO_CLASS[aspect]}`}>
          {frame ? (
            // Real frame, centre-cropped to the chosen shape: the vertical cutout preview.
            <img className="frame__image" src={frame} alt="" draggable={false} />
          ) : (
            <div className="frame__scene">
              <div className="frame__light" />
              {!empty && <div className="frame__subject" />}
            </div>
          )}
          <div className="frame__safe" />
          {empty && (
            <div className="frame__empty">
              <Icon name="import" size={32} />
              <p>Add a video to start your reel.</p>
              <Button icon="import" onClick={onImport} disabled={importing}>
                {importing ? "Reading your file…" : "Import video"}
              </Button>
            </div>
          )}
          {caption && (
            <p className="frame__caption">
              {words.map((w, i) => (
                <span key={`${caption.id}-${i}`} className={i === active ? "is-spoken" : undefined}>
                  {w}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>

      <div className="transport">
        <span className="transport__time">
          {formatDuration(time)} / {formatDuration(duration)}
        </span>
        <div className="transport__buttons">
          <IconButton
            icon="undo"
            label="Back 5 seconds"
            disabled={empty}
            onClick={() => onSeek(Math.max(0, time - 5))}
          />
          <button
            type="button"
            className="play-btn"
            onClick={onTogglePlay}
            disabled={empty}
            aria-label={playing ? "Pause (Space)" : "Play (Space)"}
            title={playing ? "Pause (Space)" : "Play (Space)"}
          >
            <Icon name={playing ? "pause" : "play"} size={24} />
          </button>
          <IconButton
            icon="redo"
            label="Forward 5 seconds"
            disabled={empty}
            onClick={() => onSeek(Math.min(duration, time + 5))}
          />
        </div>
        <span className="transport__spec">{aspect} · 1080p</span>
      </div>
    </section>
  );
}
