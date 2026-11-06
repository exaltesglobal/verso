// Looks: colour grade presets (as plain parameter sets for Clip.color) and the
// geometry shared by the preview overlay and the export filters.
import type { AspectRatio, Clip, ClipColor, Look } from "./project";
import { NEUTRAL_COLOR } from "./color";

/** How grades are authored: neutral = 0, contrast/saturation are multipliers (neutral 1). */
export interface GradeParams {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  temperature?: number;
  tint?: number;
  vibrance?: number;
  lut?: string;
  lutStrength?: number;
  preset?: string;
}

/** Original Verso grades. Values are small nudges: -1..1 except contrast/saturation (multipliers). */
export const GRADES: Record<string, { name: string; params: GradeParams }> = {
  "teal-ember": {
    name: "Teal and ember",
    params: { contrast: 1.12, saturation: 1.05, temperature: 0.12, tint: -0.06, vibrance: 0.15 },
  },
  "night-blue": { name: "Night blue", params: { brightness: -0.05, contrast: 1.15, saturation: 0.85, temperature: -0.25 } },
  "golden-hour": {
    name: "Golden hour",
    params: { brightness: 0.03, contrast: 1.05, saturation: 1.1, temperature: 0.18, tint: 0.04 },
  },
  // Grades named in docs/templates/TEMPLATE-BRIEF.md (parametric approximations; LUTs can replace them).
  "clean-pop": { name: "Clean pop", params: { brightness: 0.02, contrast: 1.08, saturation: 1.15, vibrance: 0.15 } },
  "teal-orange": {
    name: "Teal and orange",
    params: { contrast: 1.1, saturation: 1.05, temperature: 0.1, tint: -0.06, vibrance: 0.12 },
  },
  "warm-film": {
    name: "Warm film",
    params: { brightness: 0.03, contrast: 0.92, saturation: 0.92, temperature: 0.12, tint: -0.02 },
  },
  "bleach-bypass": { name: "Bleach bypass", params: { brightness: 0.02, contrast: 1.25, saturation: 0.55 } },
  "cool-night": {
    name: "Cool night",
    params: { brightness: -0.04, contrast: 1.1, saturation: 0.9, temperature: -0.15 },
  },
  "monsoon-green": {
    name: "Monsoon green",
    params: { contrast: 1.05, saturation: 1.05, temperature: -0.06, tint: -0.1 },
  },
  "mono-silver": { name: "Mono silver", params: { contrast: 1.15, saturation: 0 } },
  "pastel-fade": {
    name: "Pastel fade",
    params: { brightness: 0.05, contrast: 0.9, saturation: 0.85, tint: 0.04 },
  },
  "faded-film": { name: "Faded film", params: { brightness: 0.04, contrast: 0.88, saturation: 0.8, temperature: 0.06 } },
  "moody-mono": { name: "Moody mono", params: { contrast: 1.2, saturation: 0 } },
  "soft-pastel": { name: "Soft pastel", params: { brightness: 0.06, contrast: 0.92, saturation: 0.9, tint: 0.05 } },
  "punchy-pop": { name: "Punchy pop", params: { contrast: 1.1, saturation: 1.25, vibrance: 0.2 } },
  "festive-warm": { name: "Festive warm", params: { contrast: 1.06, saturation: 1.18, temperature: 0.18, tint: 0.03 } },
  "clean-bright": { name: "Clean bright", params: { brightness: 0.05, contrast: 1.04, saturation: 1.05 } },
  "green-forest": { name: "Deep forest", params: { contrast: 1.1, saturation: 0.95, temperature: -0.05, tint: -0.12 } },
};

const NEUTRAL_ONE = new Set(["contrast", "saturation"]);

/** Grade blended toward neutral by `amount` (1 = as designed), as Clip.color (see lib/color.ts). */
export function gradeParams(gradeId: string, amount = 1): ClipColor | undefined {
  const g = GRADES[gradeId];
  if (!g) return undefined;
  const v = (k: keyof GradeParams) => {
    const raw = g.params[k];
    if (typeof raw !== "number") return 0;
    const n = NEUTRAL_ONE.has(k) ? 1 : 0;
    return n + (raw - n) * amount - n;
  };
  const r = (x: number) => Math.round(x * 1000) / 1000;
  // color.ts: contrast factor = 1 + ct / 2, saturation factor = 1 + sat.
  return {
    ...NEUTRAL_COLOR,
    brightness: r(v("brightness")),
    contrast: r(v("contrast") * 2),
    saturation: r(v("saturation")),
    temperature: r(v("temperature")),
    tint: r(v("tint")),
    vibrance: r(v("vibrance")),
    preset: gradeId,
  };
}

/** `clip` with the grade applied, or unchanged for an unknown id. */
export function withGrade(clip: Clip, gradeId: string | undefined, amount = 1): Clip {
  const color = gradeId ? gradeParams(gradeId, amount) : undefined;
  return color ? { ...clip, color } : clip;
}

/** Light-leak opacity at `time`: flashes (~1 s bells) at `at` times, or a slow breathing drift. Mirrored in export/look.rs. */
export function leakOpacity(leak: NonNullable<Look["leak"]>, time: number): number {
  if (leak.at?.length) {
    return leak.strength * Math.max(0, ...leak.at.map((a) => Math.exp(-(((time - a) / 0.35) ** 2))));
  }
  return leak.strength * (0.55 + 0.45 * Math.sin((Math.PI * 2 * time) / 5));
}

/** Light-leak colours (two stops each). */
export const LEAK_COLORS: Record<NonNullable<Look["leak"]>["style"], [string, string]> = {
  warm: ["#FF7A2F", "#FFD27A"],
  rose: ["#FF4F8B", "#FFB3A1"],
  cool: ["#4FB3FF", "#B58CFF"],
  gold: ["#FFB547", "#FFF1B8"],
};

/**
 * Height of each letterbox bar as a fraction of frame height. Wide and square
 * frames use the true ratio; vertical frames use a stylised bar (a true 2.39
 * strip would leave a sliver of picture). Mirrored in export/look.rs.
 */
export function letterboxBar(ratio: Look["letterbox"], aspect: AspectRatio): number {
  if (!ratio) return 0;
  const r = ratio === "2.39" ? 2.39 : ratio === "2.00" ? 2 : 1.85;
  if (aspect === "9:16") return ratio === "2.39" ? 0.12 : ratio === "2.00" ? 0.1 : 0.08;
  const a = aspect === "1:1" ? 1 : 16 / 9;
  return Math.max(0, (1 - a / r) / 2);
}

/** 0..1 black amount for the dip at the start and end of the timeline. */
export function dipAmount(look: Look | undefined, time: number, duration: number): number {
  const d = look?.dip ?? 0;
  if (d <= 0 || duration <= 0) return 0;
  return Math.max(0, 1 - time / d, 1 - (duration - time) / d);
}
