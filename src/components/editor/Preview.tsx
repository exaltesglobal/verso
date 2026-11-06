import type { MutableRefObject } from "react";
import { Icon } from "../Icon";
import { VideoLayer } from "./VideoLayer";
import { MusicLayer, TextOverlays } from "./Overlays";
import { cropStyle, panelBoxes, sampleCropPath, sourceTimeFor } from "../../lib/reframe";
import type { CSSProperties } from "react";
import { CaptionText } from "./CaptionStylePreview";
import { captionStyle } from "../../lib/captionStyles";
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
  mediaClockRef: MutableRefObject<number | null>;
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
  mediaClockRef,
  onSeek,
  onImport,
  importing,
}: PreviewProps) {
  const captions = project.tracks.find((t) => t.kind === "captions")?.clips ?? [];
  const caption = captions.find((c) => time >= c.start && time < c.end);
  // Real word timings when the captions engine wrote them; otherwise spread evenly.
  const timed = caption?.words?.length ? caption.words : null;
  const words = timed ? timed.map((w) => w.text) : ((caption?.text ?? caption?.label)?.split(" ") ?? []);
  const active = !caption
    ? -1
    : timed
      ? timed.findIndex((w) => time >= w.start && time < w.end)
      : Math.min(
          words.length - 1,
          Math.floor(((time - caption.start) / (caption.end - caption.start)) * words.length),
        );
  const speaker = caption?.label.includes(": ") ? caption.label.split(": ")[0] : undefined;

  const clip = videoClipAt(project, time);
  const frames = useFilmstrip(clip?.source);
  const frame =
    clip?.source && frameAt(frames, clip.source.durationSec, (clip.inPoint ?? 0) + time - clip.start);
  const empty = duration === 0;

  // Reframe: one crop rect per panel (two when showing both speakers).
  const rects = clip?.cropPath ? sampleCropPath(clip.cropPath, sourceTimeFor(clip, time)) : [];
  const boxes = clip?.cropPath && rects.length ? panelBoxes(clip.cropPath) : [];
  const zoomStyle: CSSProperties | undefined =
    clip?.zoom && clip.zoom > 1 ? { transform: `scale(${clip.zoom})` } : undefined;
  const panels = boxes.length
    ? boxes.map((b, i) => ({ box: b, style: rects[i] ? cropStyle(rects[i]) : undefined }))
    : [{ box: { x: 0, y: 0, w: 1, h: 1 }, style: zoomStyle }];

  return (
    <section className="preview" aria-label="Preview">
      <div className="preview__stage">
        <div className={`frame ${RATIO_CLASS[aspect]}`}>
          {!frame && (
            <div className="frame__scene">
              <div className="frame__light" />
              {!empty && <div className="frame__subject" />}
            </div>
          )}
          {frame &&
            panels.map((p, i) => (
              <div
                key={i}
                className="frame__panel"
                style={{
                  left: `${p.box.x * 100}%`,
                  top: `${p.box.y * 100}%`,
                  width: `${p.box.w * 100}%`,
                  height: `${p.box.h * 100}%`,
                }}
              >
                {/* Real frame under the video: shows instantly while scrubbing. Centre crop = vertical cutout. */}
                <img className="frame__image" src={frame} alt="" draggable={false} style={p.style} />
                <VideoLayer
                  clip={clip}
                  time={time}
                  playing={playing}
                  mediaClockRef={mediaClockRef}
                  mediaStyle={p.style}
                  secondary={i > 0}
                />
              </div>
            ))}
          <TextOverlays project={project} time={time} />
          <MusicLayer project={project} time={time} playing={playing} />
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
            <div className="frame__caption-wrap" key={caption.id}>
              {speaker && <span className="frame__speaker">{speaker}</span>}
              <CaptionText
                style={captionStyle(project.captionStyle)}
                words={words}
                active={active}
                size={22}
              />
            </div>
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
