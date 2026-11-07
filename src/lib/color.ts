// Per-clip colour: presets, the CSS preview approximation, auto colour-correct
// and custom .cube LUTs. Export applies the exact maths in
// src-tauri/src/export/color.rs (brightness/contrast via lutrgb match the CSS).
import type { CSSProperties } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { Clip, ClipColor } from "./project";
import { sourceSpan } from "./speed";

export const NEUTRAL_COLOR: ClipColor = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
  vibrance: 0,
  lutStrength: 1,
};

type Look = Pick<ClipColor, "brightness" | "contrast" | "saturation" | "temperature" | "tint" | "vibrance">;
const look = (
  brightness: number,
  contrast: number,
  saturation: number,
  temperature: number,
  tint: number,
  vibrance: number,
): Look => ({
  brightness,
  contrast,
  saturation,
  temperature,
  tint,
  vibrance,
});

/** Ten original looks, as slider settings. */
export const COLOR_PRESETS: { id: string; label: string; look: Look }[] = [
  { id: "warm-sunset", label: "Warm sunset", look: look(0.05, 0.1, 0.15, 0.5, 0.1, 0.2) },
  { id: "clean-bright", label: "Clean bright", look: look(0.15, 0.05, 0.05, 0.05, 0, 0.15) },
  { id: "moody-teal", label: "Moody teal", look: look(-0.1, 0.25, -0.15, -0.35, -0.1, 0) },
  { id: "film-fade", label: "Film fade", look: look(0.05, -0.3, -0.25, 0.15, 0.05, 0) },
  { id: "mono-punch", label: "Mono punch", look: look(0, 0.4, -1, 0, 0, 0) },
  { id: "vivid-food", label: "Vivid food", look: look(0.05, 0.15, 0.35, 0.2, 0, 0.4) },
  { id: "soft-skin", label: "Soft skin", look: look(0.1, -0.15, -0.05, 0.15, 0.1, -0.1) },
  { id: "night-neon", label: "Night neon", look: look(-0.05, 0.3, 0.4, -0.4, 0.3, 0.3) },
  { id: "desert-gold", label: "Desert gold", look: look(0.05, 0.1, 0.1, 0.6, -0.05, 0.1) },
  { id: "cool-office", label: "Cool office", look: look(0.1, 0.05, -0.1, -0.3, 0, 0) },
];

export function applyPreset(current: ClipColor | undefined, id: string): ClipColor {
  const p = COLOR_PRESETS.find((x) => x.id === id);
  return { ...NEUTRAL_COLOR, ...current, ...(p?.look ?? {}), preset: p?.id };
}

/** Sliders plus the LUT's rough look, scaled by its strength. */
function effective(c: ClipColor) {
  const l = c.lut && c.lutLook ? c.lutLook : undefined;
  const s = l ? c.lutStrength : 0;
  return {
    b: c.brightness + (l?.brightness ?? 0) * s,
    ct: c.contrast + (l?.contrast ?? 0) * s,
    sat: c.saturation + (l?.saturation ?? 0) * s,
    t: c.temperature + (l?.temperature ?? 0) * s,
  };
}

/** CSS `filter` for the preview <video>/<img>. Same brightness/contrast maths as export. */
export function colorFilter(c: ClipColor | undefined): string | undefined {
  if (!c) return undefined;
  const { b, ct, sat } = effective(c);
  const parts = [
    // Look grades are an SVG filter with the export's exact maths (LookFilters.tsx).
    ...(c.curve && c.preset ? [`url(#vs-${c.preset})`] : []),
    `brightness(${(1 + b / 2).toFixed(3)})`,
    `contrast(${(1 + ct / 2).toFixed(3)})`,
    `saturate(${(Math.max(0, 1 + sat) * (1 + c.vibrance * 0.5)).toFixed(3)})`,
  ];
  return parts.join(" ");
}

/**
 * Temperature and tint have no CSS filter, so the preview lays a soft-light
 * wash over the frame: orange for warm, blue for cool, magenta/green for tint.
 */
export function colorWashStyle(c: ClipColor | undefined): CSSProperties | undefined {
  if (!c) return undefined;
  const { t } = effective(c);
  const layers: string[] = [];
  if (Math.abs(t) > 0.01)
    layers.push(
      t > 0 ? `rgba(255,140,40,${(t * 0.35).toFixed(3)})` : `rgba(60,140,255,${(-t * 0.35).toFixed(3)})`,
    );
  if (Math.abs(c.tint) > 0.01)
    layers.push(
      c.tint > 0
        ? `rgba(255,60,200,${(c.tint * 0.25).toFixed(3)})`
        : `rgba(60,220,90,${(-c.tint * 0.25).toFixed(3)})`,
    );
  if (!layers.length) return undefined;
  return {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    mixBlendMode: "soft-light",
    background: layers.map((l) => `linear-gradient(${l},${l})`).join(","),
  };
}

/** Proposes brightness/contrast/saturation/temperature from sampled frames. */
export async function autoColor(clip: Clip): Promise<ClipColor> {
  if (!clip.source?.hasVideo) throw new Error("Pick a video clip first.");
  const inPoint = clip.inPoint ?? 0;
  const fix = await invoke<Pick<ClipColor, "brightness" | "contrast" | "saturation" | "temperature">>(
    "auto_color",
    {
      path: clip.source.path,
      inPoint,
      outPoint: inPoint + sourceSpan(clip),
    },
  );
  return { ...NEUTRAL_COLOR, ...clip.color, ...fix, preset: undefined };
}

export interface ImportedLut {
  path: string;
  title: string;
  size: number;
  approx: NonNullable<ClipColor["lutLook"]>;
}

/** Opens a file picker for a .cube LUT. Rust checks it (3D, size up to 65) and keeps a copy. */
export async function importLut(): Promise<ImportedLut | null> {
  const path = await open({
    title: "Import a colour file",
    multiple: false,
    filters: [{ name: "Colour file (.cube)", extensions: ["cube"] }],
  });
  if (!path || Array.isArray(path)) return null;
  return invoke<ImportedLut>("import_lut", { path });
}

export function withLut(current: ClipColor | undefined, lut: ImportedLut): ClipColor {
  return { ...NEUTRAL_COLOR, ...current, lut: lut.path, lutLook: lut.approx, lutStrength: 1 };
}
