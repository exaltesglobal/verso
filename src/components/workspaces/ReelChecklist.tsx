import { Icon } from "../Icon";
import { formatMinutes, useTimeSaved } from "../../lib/timeSaved";
import { videoClips } from "../../lib/smart";
import type { Project } from "../../lib/project";

/**
 * "Your reel" under Quick's steps: the four things every reel needs, ticked
 * from the project itself, each one tap away. Plus today's time saved.
 */
export function ReelChecklist({
  project,
  exported,
  onAddVideo,
  onCaptions,
  onFit,
  onExport,
}: {
  project: Project;
  /** An export finished in this session. */
  exported: boolean;
  onAddVideo: () => void;
  onCaptions: () => void;
  onFit: () => void;
  onExport: () => void;
}) {
  const saved = useTimeSaved().today;
  const items = [
    { label: "Added video", done: videoClips(project).some((c) => c.source), run: onAddVideo },
    {
      label: "Captions",
      done: !!project.tracks.find((t) => t.kind === "captions")?.clips.length,
      run: onCaptions,
    },
    { label: `Fit to 9:16`, done: project.aspect === "9:16", run: onFit },
    { label: "Export", done: exported, run: onExport },
  ];
  return (
    <section className="reel-check" aria-label="Your reel">
      <h3 className="reel-check__title">Your reel</h3>
      <ul className="reel-check__list">
        {items.map((it) => (
          <li key={it.label}>
            <button
              type="button"
              className={it.done ? "reel-check__item is-done" : "reel-check__item"}
              onClick={it.run}
              aria-label={`${it.label}${it.done ? ", done" : ""}`}
            >
              <span className="reel-check__tick" aria-hidden="true">
                {it.done && <Icon name="check" size={16} />}
              </span>
              {it.label}
            </button>
          </li>
        ))}
      </ul>
      <p className="reel-check__saved">
        {saved >= 1
          ? `Saved about ${formatMinutes(saved)} of editing today`
          : "One-tap edits save you editing time"}
      </p>
    </section>
  );
}
