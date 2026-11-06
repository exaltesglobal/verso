import { useCallback, useState } from "react";

const LIMIT = 200;
/** Repeated `set`s with the same merge key this close together are one undo step. */
const MERGE_MS = 1000;

interface History<T> {
  past: T[];
  present: T;
  future: T[];
  /** State when the current gesture (drag) began, or null. */
  base: T | null;
  /** Key and time of the last `set` that passed a merge key. */
  mergeKey: string | null;
  mergeAt: number;
}

type Next<T> = T | ((prev: T) => T);
const resolve = <T>(next: Next<T>, prev: T) =>
  typeof next === "function" ? (next as (p: T) => T)(prev) : next;

/**
 * Undo/redo for immutable state, with pure updaters (safe under StrictMode).
 * `set` records a step. `replace` updates live during a gesture without a
 * step; `commit` then records the whole gesture as one step.
 */
export function useHistory<T>(initial: T) {
  const [h, setH] = useState<History<T>>({
    past: [],
    present: initial,
    future: [],
    base: null,
    mergeKey: null,
    mergeAt: 0,
  });

  /** Records a step. Pass `mergeKey` (e.g. per slider) so a drag of many changes undoes at once. */
  const set = useCallback((next: Next<T>, mergeKey?: string) => {
    const now = Date.now();
    setH((s) => {
      const value = resolve(next, s.present);
      if (value === s.present) return s;
      const key = mergeKey ?? null;
      if (key && key === s.mergeKey && now - s.mergeAt < MERGE_MS && s.past.length)
        return { ...s, present: value, future: [], base: null, mergeAt: now };
      return {
        past: [...s.past.slice(-LIMIT + 1), s.present],
        present: value,
        future: [],
        base: null,
        mergeKey: key,
        mergeAt: now,
      };
    });
  }, []);

  const replace = useCallback((next: Next<T>) => {
    setH((s) => ({ ...s, present: resolve(next, s.present), base: s.base ?? s.present }));
  }, []);

  const commit = useCallback(() => {
    setH((s) => {
      if (s.base === null) return s;
      if (s.base === s.present) return { ...s, base: null };
      return { ...s, past: [...s.past.slice(-LIMIT + 1), s.base], future: [], base: null, mergeKey: null };
    });
  }, []);

  const undo = useCallback(() => {
    setH((s) => {
      if (!s.past.length) return s;
      return {
        ...s,
        past: s.past.slice(0, -1),
        present: s.past[s.past.length - 1],
        future: [s.present, ...s.future],
        base: null,
        mergeKey: null,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setH((s) => {
      if (!s.future.length) return s;
      return {
        ...s,
        past: [...s.past, s.present],
        present: s.future[0],
        future: s.future.slice(1),
        base: null,
        mergeKey: null,
      };
    });
  }, []);

  return {
    state: h.present,
    set,
    replace,
    commit,
    undo,
    redo,
    canUndo: h.past.length > 0,
    canRedo: h.future.length > 0,
  };
}
