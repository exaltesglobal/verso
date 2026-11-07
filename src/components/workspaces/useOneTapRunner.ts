import { useCallback, useRef, useState } from "react";
import type { ToastMessage } from "../ui";
import { CreditsError, useCharged, useCredits } from "../../lib/credits";
import { doItAllPlan, CONTENT_LABEL, type OneTapAction, type OneTapId } from "../../lib/oneTap";
import { estimateMinutes, recordTimeSaved } from "../../lib/timeSaved";
import type { Clip, Project } from "../../lib/project";

export interface DoItAllSummary {
  kind: string;
  done: string[];
  skipped: string[];
}

/**
 * Runs one-tap actions: charges AI ones through the usual credits flow, applies
 * the result as ONE undo step, and records the time saved against that step
 * (so Undo, from the toast or Ctrl+Z, takes it back).
 *
 * While an action runs the editor is blocked by a progress overlay with Cancel
 * (see BusyBlock), so no newer edit can sit on top of the result. Cancel stops
 * waiting and drops the result; work already charged is not refunded.
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
  /** Bumped on every start and on Cancel; a run only applies if its token is still current. */
  const token = useRef(0);

  const fail = useCallback(
    (e: unknown) => {
      if (e instanceof CreditsError && e.code === "insufficient") showOutOfCredits(e.message);
      else notify({ tone: "danger", text: e instanceof Error ? e.message : String(e) });
    },
    [notify, showOutOfCredits],
  );

  const apply = useCallback(
    (next: Project, minutes: number) => {
      setProject(next);
      recordTimeSaved(next, minutes);
    },
    [setProject],
  );

  const run = useCallback(
    async (a: OneTapAction, clip?: Clip) => {
      const why = a.blocked(project);
      if (why) return notify({ tone: "info", text: why });
      const my = ++token.current;
      setBusy(a.id);
      setStep(a.label);
      try {
        const next = await a.run({ project, clip, charge });
        if (token.current !== my || next === project) return;
        apply(next, estimateMinutes(a.id, project));
        notify({ tone: "success", text: a.message, action: { label: "Undo", run: undo } });
      } catch (e) {
        if (token.current === my) fail(e);
      } finally {
        if (token.current === my) {
          setBusy(null);
          setStep(null);
        }
      }
    },
    [project, charge, apply, undo, notify, fail],
  );

  const runAll = useCallback(async () => {
    const { kind, steps } = doItAllPlan(project);
    if (!steps.length) return notify({ tone: "info", text: "Nothing left to do. Your reel already looks good." });
    const my = ++token.current;
    setBusy("all");
    setSummary(null);
    let next = project;
    let minutes = 0;
    const done: string[] = [];
    const skipped: string[] = [];
    try {
      for (const [i, a] of steps.entries()) {
        if (token.current !== my) return;
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
      if (token.current !== my) return;
      if (next !== project) {
        apply(next, minutes);
        setSummary({ kind: CONTENT_LABEL[kind], done, skipped });
        notify({ tone: "success", text: `Done: ${done.join(", ")}.`, action: { label: "Undo", run: undo } });
      } else if (skipped.length) {
        notify({ tone: "info", text: `That didn't change anything. Skipped: ${skipped.join(", ")}.` });
      }
    } catch (e) {
      if (token.current === my) fail(e);
    } finally {
      if (token.current === my) {
        setBusy(null);
        setStep(null);
      }
    }
  }, [project, charge, apply, undo, notify, fail]);

  const cancel = useCallback(() => {
    token.current++;
    setBusy(null);
    setStep(null);
    notify({ tone: "info", text: "Stopped. Nothing was changed." });
  }, [notify]);

  return {
    busy,
    step,
    run,
    runAll,
    cancel,
    summary,
    undoAll: () => {
      undo();
      setSummary(null);
    },
    clearSummary: () => setSummary(null),
  };
}

export type OneTapRunner = ReturnType<typeof useOneTapRunner>;
