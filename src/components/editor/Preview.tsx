import { Icon } from "../Icon";
import { IconButton } from "../ui";
import { REEL_DURATION, tracks, type AspectRatio } from "../../data/placeholder";
import { formatDuration } from "../../lib/media";

interface PreviewProps {
  aspect: AspectRatio;
  time: number;
  playing: boolean;
  onTogglePlay: () => void;
  onSeek: (t: number) => void;
}

const captions = tracks.find((t) => t.kind === "captions")?.clips ?? [];
const RATIO_CLASS: Record<AspectRatio, string> = {
  "9:16": "is-vertical",
  "1:1": "is-square",
  "16:9": "is-wide",
};

export function Preview({ aspect, time, playing, onTogglePlay, onSeek }: PreviewProps) {
  const caption = captions.find((c) => time >= c.start && time < c.end);
  const words = caption?.label.split(" ") ?? [];
  // Highlight the word being "spoken" right now.
  const active = caption
    ? Math.min(
        words.length - 1,
        Math.floor(((time - caption.start) / (caption.end - caption.start)) * words.length),
      )
    : -1;

  return (
    <section className="preview" aria-label="Preview">
      <div className="preview__stage">
        <div className={`frame ${RATIO_CLASS[aspect]}`}>
          <div className="frame__scene">
            <div className="frame__light" />
            <div className="frame__subject" />
          </div>
          <div className="frame__safe" />
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
          {formatDuration(time)} / {formatDuration(REEL_DURATION)}
        </span>
        <div className="transport__buttons">
          <IconButton icon="undo" label="Back 5 seconds" onClick={() => onSeek(Math.max(0, time - 5))} />
          <button
            type="button"
            className="play-btn"
            onClick={onTogglePlay}
            aria-label={playing ? "Pause (Space)" : "Play (Space)"}
            title={playing ? "Pause (Space)" : "Play (Space)"}
          >
            <Icon name={playing ? "pause" : "play"} size={24} />
          </button>
          <IconButton
            icon="redo"
            label="Forward 5 seconds"
            onClick={() => onSeek(Math.min(REEL_DURATION, time + 5))}
          />
        </div>
        <span className="transport__spec">{aspect} · 1080p</span>
      </div>
    </section>
  );
}
