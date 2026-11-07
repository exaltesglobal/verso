import { useState } from "react";
import { Segmented } from "../ui";
import { Group } from "./InspectorGroups";
import { useEntitlements } from "../../lib/entitlements";
import { ASPECTS, ASPECT_NAME, ASPECT_SIZE, type Project } from "../../lib/project";

const RATES = ["24", "30", "60"] as const;
const RESOLUTIONS = ["720p", "1080p", "4K"] as const;
const QUALITY = { "720p": "draft", "1080p": "standard", "4K": "ultra" } as const;
const BACKGROUNDS = ["#000000", "#F5F4F0", "#16161C", "#1E3A8A", "#FF9466", "#2FD4A3"];

/** Inspector with nothing selected: the project's own settings, in the same group style (spec section 2). */
export function ProjectSettings({
  project,
  onApply,
}: {
  project: Project;
  onApply: (next: Project, message: string) => void;
}) {
  const { can, openUpgrade } = useEntitlements();
  // Typing edits a draft; blur or Enter commits it as one undo step.
  const [draft, setName] = useState<string | null>(null);
  const name = draft ?? project.name;
  const commitName = () => {
    const n = name.trim();
    if (n && n !== project.name) onApply({ ...project, name: n }, `Renamed to ${n}.`);
    setName(null);
  };
  const fps = String(project.fps ?? 30) as (typeof RATES)[number];
  const res = project.quality === "draft" ? "720p" : project.quality === "ultra" ? "4K" : ("1080p" as const);
  const [w, h] = ASPECT_SIZE[project.aspect];
  const bg = project.background ?? "#000000";

  return (
    <>
      <Group icon="folder" title="Project">
        <input
          className="field__input"
          aria-label="Project name"
          value={name}
          spellCheck={false}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setName(null);
              requestAnimationFrame(() => (e.target as HTMLInputElement).blur());
            }
          }}
        />
      </Group>
      <Group icon="vertical" title="Shape">
        <Segmented
          label="Reel shape"
          options={ASPECTS}
          value={project.aspect}
          onChange={(a) => onApply({ ...project, aspect: a }, `Shape set to ${a} ${ASPECT_NAME[a]}.`)}
        />
        <p className="help tc">
          {w} × {h} · {ASPECT_NAME[project.aspect]}
        </p>
      </Group>
      <Group icon="timeline" title="Frame rate and size">
        <div className="pset__row">
          <Segmented
            label="Frame rate"
            options={RATES}
            value={fps}
            onChange={(r) =>
              r === "60" && !can("export_4k")
                ? openUpgrade("60 fps export is part of Verso Pro.")
                : onApply({ ...project, fps: Number(r) }, `Frame rate set to ${r} fps.`)
            }
          />
          <span className="pset__unit">fps</span>
        </div>
        <Segmented
          label="Resolution"
          options={RESOLUTIONS}
          value={res}
          onChange={(r) =>
            r === "4K" && !can("export_4k")
              ? openUpgrade("4K export is part of Verso Pro.")
              : onApply({ ...project, quality: QUALITY[r] }, `Export size set to ${r}.`)
          }
        />
        <p className="help">Export starts with these. You can change them there too.</p>
      </Group>
      <Group icon="filters" title="Background">
        <div className="swatches" role="radiogroup" aria-label="Background colour">
          {BACKGROUNDS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={c.toLowerCase() === bg.toLowerCase()}
              aria-label={`Background ${c}`}
              className={c.toLowerCase() === bg.toLowerCase() ? "swatch is-active" : "swatch"}
              style={{ background: c }}
              onClick={() =>
                onApply(
                  { ...project, background: c === "#000000" ? undefined : c },
                  "Background colour changed.",
                )
              }
            />
          ))}
          <label className="swatch swatch--pick" data-tip="Pick any colour">
            <input
              type="color"
              aria-label="Pick a background colour"
              key={bg}
              defaultValue={bg}
              // Commit once the picker closes, not on every drag step (one undo entry).
              onBlur={(e) =>
                e.currentTarget.value !== bg &&
                onApply({ ...project, background: e.currentTarget.value }, "Background colour changed.")
              }
            />
          </label>
        </div>
        <p className="help">Shows where no clip covers the frame.</p>
      </Group>
    </>
  );
}
