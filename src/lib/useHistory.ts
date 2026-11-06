import { useCallback, useState } from "react";

const LIMIT = 200;

interface History<T> {
  past: T[];
  present: T;
  future: T[];
  /** State when the current gesture (drag) began, or null. */
  base: T | null;
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
  const [h, setH] = useState<History<T>>({ past: [], present: initial, future: [], base: null });

  const set = useCallback((next: Next<T>) => {
    setH((s) => {
      const value = resolve(next, s.present);
      if (value === s.present) return s;
      return { past: [...s.past.slice(-LIMIT + 1), s.present], present: value, future: [], base: null };
    });
  }, []);

  const replace = useCallback((next: Next<T>) => {
    setH((s) => ({ ...s, present: resolve(next, s.present), base: s.base ?? s.present }));
  }, []);

  const commit = useCallback(() => {
    setH((s) => {
      if (s.base === null) return s;
      if (s.base === s.present) return { ...s, base: null };
      return { past: [...s.past.slice(-LIMIT + 1), s.base], present: s.present, future: [], base: null };
    });
  }, []);

  const undo = useCallback(() => {
    setH((s) => {
      if (!s.past.length) return s;
      return {
        past: s.past.slice(0, -1),
        present: s.past[s.past.length - 1],
        future: [s.present, ...s.future],
        base: null,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setH((s) => {
      if (!s.future.length) return s;
      return { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1), base: null };
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
