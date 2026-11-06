import { useEffect, useState } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Icon } from "../Icon";
import { Button, IconButton, Segmented } from "../ui";
import { CAPTION_STYLES } from "../../lib/captionStyles";
import {
  applyBrandKit,
  loadKits,
  newKit,
  removeBrand,
  saveKits,
  type BrandKit,
  type LogoCorner,
} from "../../lib/brandkit";
import { probeMedia, type MediaInfo } from "../../lib/media";
import type { Project } from "../../lib/project";
import { Select } from "../Select";

const ACCENTS = ["#FFB547", "#F472B6", "#5B8CFF", "#2FD4A3", "#C084FC", "#F5F4F0"];
const CORNERS = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;
const CORNER_LABEL: Record<LogoCorner, string> = {
  "top-left": "Top left",
  "top-right": "Top right",
  "bottom-left": "Bottom left",
  "bottom-right": "Bottom right",
};

interface BrandKitPanelProps {
  project: Project;
  onApply: (next: Project, message: string) => void;
}

/** One brand kit per channel: logo, colours, caption look, intro and outro. */
export function BrandKitPanel({ project, onApply }: BrandKitPanelProps) {
  const [kits, setKits] = useState<BrandKit[]>(loadKits);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => saveKits(kits), [kits]);

  const kit = kits.find((k) => k.id === editing);
  const update = (id: string, patch: Partial<BrandKit>) =>
    setKits((ks) => ks.map((k) => (k.id === id ? { ...k, ...patch } : k)));

  const pick = async (title: string, extensions: string[]): Promise<MediaInfo | undefined> => {
    const path = await open({ title, multiple: false, filters: [{ name: title, extensions }] });
    if (!path || Array.isArray(path)) return undefined;
    return probeMedia(path);
  };

  if (kit) {
    return (
      <div className="brand-edit">
        <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>
          <span>‹ All brand kits</span>
        </button>
        <label className="field">
          <span className="field__label">Channel name</span>
          <input
            className="field__input"
            value={kit.name}
            onChange={(e) => update(kit.id, { name: e.target.value })}
          />
        </label>
        <label className="field">
          <span className="field__label">Handle (optional)</span>
          <input
            className="field__input"
            placeholder="@yourchannel"
            value={kit.handle ?? ""}
            onChange={(e) => update(kit.id, { handle: e.target.value })}
          />
        </label>

        <h3 className="section-label">Logo</h3>
        <div className="brand-logo-row">
          <span className="brand-logo-box">
            {kit.logo ? <img src={convertFileSrc(kit.logo.path)} alt="" /> : <Icon name="add" size={24} />}
          </span>
          <Button
            onClick={async () => {
              const logo = await pick("Choose your logo", ["png", "jpg", "jpeg", "webp"]);
              if (logo) update(kit.id, { logo });
            }}
          >
            {kit.logo ? "Change logo" : "Add logo"}
          </Button>
        </div>
        {kit.logo && (
          <>
            <Segmented
              label="Logo corner"
              options={CORNERS.map((c) => CORNER_LABEL[c])}
              value={CORNER_LABEL[kit.logoCorner]}
              onChange={(label) =>
                update(kit.id, { logoCorner: CORNERS.find((c) => CORNER_LABEL[c] === label) ?? "top-right" })
              }
            />
            <label className="slider">
              <span className="slider__top">
                <span className="slider__label">Size</span>
                <span className="slider__value">{Math.round(kit.logoSize * 100)}%</span>
              </span>
              <input
                type="range"
                min={6}
                max={40}
                value={Math.round(kit.logoSize * 100)}
                onChange={(e) => update(kit.id, { logoSize: Number(e.target.value) / 100 })}
              />
            </label>
          </>
        )}

        <h3 className="section-label">Accent colour</h3>
        <div className="swatches">
          {ACCENTS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Accent ${c}`}
              className={c === kit.accent ? "swatch is-active" : "swatch"}
              style={{ background: c }}
              onClick={() => update(kit.id, { accent: c })}
            />
          ))}
        </div>

        <label className="field">
          <span className="field__label">Caption look</span>
          <Select
            className="field__input"
            value={kit.captionStyleId ?? ""}
            onChange={(v) => update(kit.id, { captionStyleId: v || undefined })}
            options={[
              { value: "", label: "Keep the reel's choice" },
              ...CAPTION_STYLES.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
        </label>

        <h3 className="section-label">Intro and outro</h3>
        {(["intro", "outro"] as const).map((role) => (
          <div key={role} className="brand-clip-row">
            <span>{role === "intro" ? "Intro" : "Outro"}</span>
            <span className="muted small">{kit[role]?.fileName ?? "None"}</span>
            <Button
              onClick={async () => {
                const m = await pick(`Choose your ${role}`, ["mp4", "mov", "m4v", "webm"]);
                if (m) update(kit.id, { [role]: m });
              }}
            >
              {kit[role] ? "Change" : "Add"}
            </Button>
            {kit[role] && (
              <IconButton
                icon="delete"
                label={`Remove ${role}`}
                onClick={() => update(kit.id, { [role]: undefined })}
              />
            )}
          </div>
        ))}

        <Button
          icon="one-click"
          size="lg"
          className="btn--block"
          onClick={() => onApply(applyBrandKit(project, kit), `${kit.name} brand kit applied.`)}
        >
          Apply to this reel
        </Button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            setKits((ks) => ks.filter((k) => k.id !== kit.id));
            setEditing(null);
          }}
        >
          <span>Delete this brand kit</span>
        </button>
      </div>
    );
  }

  return (
    <div className="brand-list">
      <p className="muted small">
        Set up your logo, colours and intro once. Apply them to any reel in one click.
      </p>
      {kits.map((k) => (
        <div key={k.id} className={project.brand?.kitId === k.id ? "brand-card is-applied" : "brand-card"}>
          <span className="brand-logo-box" style={{ borderColor: k.accent }}>
            {k.logo ? (
              <img src={convertFileSrc(k.logo.path)} alt="" />
            ) : (
              <span style={{ color: k.accent }}>{k.name[0]}</span>
            )}
          </span>
          <span className="brand-card__text">
            <span className="brand-card__name">{k.name}</span>
            <span className="muted small">
              {project.brand?.kitId === k.id ? "On this reel" : k.handle || "Brand kit"}
            </span>
          </span>
          <Button onClick={() => onApply(applyBrandKit(project, k), `${k.name} brand kit applied.`)}>
            Apply
          </Button>
          <IconButton icon="settings" label={`Edit ${k.name}`} onClick={() => setEditing(k.id)} />
        </div>
      ))}
      <Button
        icon="add"
        className="btn--block"
        onClick={() => {
          const k = newKit(kits.length ? `Channel ${kits.length + 1}` : "My channel");
          setKits((ks) => [...ks, k]);
          setEditing(k.id);
        }}
      >
        New brand kit
      </Button>
      {project.brand && (
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => onApply(removeBrand(project), "Brand logo removed from this reel.")}
        >
          <span>Remove brand from this reel</span>
        </button>
      )}
    </div>
  );
}
