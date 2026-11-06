import type { TemplateSlot } from "../types";

type SlotSpec = [
  seconds: number,
  hint: string,
  extra?: Partial<Omit<TemplateSlot, "start" | "end" | "hint">>,
];

/** Lays slots end to end: `seq("hook", [[3, "Your hook"], [5, "The answer"]])`. */
export function seq(prefix: string, specs: SlotSpec[]): TemplateSlot[] {
  let t = 0;
  return specs.map(([seconds, hint, extra], i) => {
    const slot: TemplateSlot = {
      id: `${prefix}-${i + 1}`,
      kind: "video",
      start: t,
      end: t + seconds,
      hint,
      ...extra,
    };
    t += seconds;
    return slot;
  });
}

export const total = (slots: TemplateSlot[]) => slots[slots.length - 1]?.end ?? 0;
