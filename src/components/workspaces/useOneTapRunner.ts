import { useCallback, useState } from "react";
import type { ToastMessage } from "../ui";
import { CreditsError, useCharged, useCredits } from "../../lib/credits";
import { doItAllPlan, CONTENT_LABEL, type OneTapAction, type OneTapId } from "../../lib/oneTap";
import { estimateMinutes, recordTimeSaved } from "../../lib/timeSaved";
import type { Clip, Project } from "../../lib/project";

export interface DoItAllSummary {
  kind: string;
  done: string[];
  skipped: string[];
  undo: () => void;
}

/**
 * Runs one-tap actions: charges AI ones through the usual credits flow, applies
 * the result as ONE undo step, records the time saved, and offers Undo (which
 * also takes the time saved back).
 */
export function useOneTapRunner({
  project,
  setProject,
  undo,
  notify,
}: {
  project: Project;
  setProject: (p: Project) => void;
  undo: () => void;
  notify: (m: ToastMessage) => void;
}) {
  const charge = useCharged();
  const { showOutOfCredits } = useCredits();
  const [busy, setBusy] = useState<OneTapId | "all" | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const [summary, setSummary] = useState<DoItAllSummary | null>(null);

  const fail = useCallback(
    (e: unknown) => {
      if (e instanceof CreditsError && e.code === "insufficient") showOutOfCredits(e.message);
      else notify({ tone: "danger", text: e instanceof Error ? e.message : String(e) });
    },
    [notify, showOutOfCredits],
  );

  const run = useCallback(
    async (a: OneTapAction, clip?: Clip) => {
      const why = a.blocked(project);
      if (why) return notify({ tone: "info", text: why });
      setBusy(a.id);
      try {
        const next = await a.run({ project, clip, charge });
        if (next === project) return;
        setProject(next);
        const revert = recordTimeSaved(estimateMinutes(a.id, project));
        notify({
          tone: "success",
          text: a.message,
          action: {
            label: "Undo",
            run: () => {
              undo();
              revert();
            },
          },
        });
      } catch (e) {
        fail(e);
      } finally {
        setBusy(null);
      }
    },
    [project, charge, setProject, undo, notify, fail],
  );

  const runAll = useCallback(async () => {
    const { kind, steps } = doItAllPlan(project);
    if (!steps.length)
      return notify({ tone: "info", text: "Nothing left to do. Your reel already looks good." });
    setBusy("all");
    setSummary(null);
    let next = project;
    let minutes = 0;
    const done: string[] = [];
    const skipped: string[] = [];
    try {
      for (const [i, a] of steps.entries()) {
        // Earlier steps can unblock later ones (captions before the hook title), so check as we go.
        if (a.blocked(next)) {
          skipped.push(a.label);
          continue;
        }
        setStep(`Step ${i + 1} of ${steps.length}: ${a.label}`);
        try {
          const out = await a.run({ project: next, charge });
          minutes += estimateMinutes(a.id, next);
          next = out;
          done.push(a.label);
        } catch (e) {
          // Running out of credits stops the run; other failures skip the step.
          if (e instanceof CreditsError && e.code === "insufficient") throw e;
          skipped.push(a.label);
        }
      }
      if (next !== project) {
        setProject(next);
        const revert = recordTimeSaved(minutes);
        const undoAll = () => {
          undo();
          revert();
          setSummary(null);
        };
        setSummary({ kind: CONTENT_LABEL[kind], done, skipped, undo: undoAll });
        notify({
          tone: "success",
          text: `Done: ${done.join(", ")}.`,
          action: { label: "Undo", run: undoAll },
        });
      } else if (skipped.length) {
        notify({ tone: "info", text: `That didn't change anything. Skipped: ${skipped.join(", ")}.` });
      }
    } catch (e) {
      fail(e);
    } finally {
      setBusy(null);
      setStep(null);
    }
  }, [project, charge, setProject, undo, notify, fail]);

  return { busy, step, run, runAll, summary, clearSummary: () => setSummary(null) };
}

export type OneTapRunner = ReturnType<typeof useOneTapRunner>;
