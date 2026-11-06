import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import { API_URL, CREDITS_ENFORCE, accountsConfigured } from "./config";
import { useEntitlements } from "./entitlements";

/** AI actions priced by the server (server/src/credits.ts). Editing and export are free. */
export type CreditAction =
  | "auto_cut"
  | "captions"
  | "speaker_reframe"
  | "dubbing"
  | "voiceover"
  | "background_removal"
  | "hook_generator"
  | "caption_writer"
  | "watch_time_predictor"
  | "enhance_audio";

export const ACTION_LABELS: Record<CreditAction, string> = {
  auto_cut: "Auto-cut",
  captions: "Captions",
  speaker_reframe: "Speaker reframe",
  dubbing: "Dubbing",
  voiceover: "Voiceover",
  background_removal: "Background removal",
  hook_generator: "Hook ideas",
  caption_writer: "Caption writer",
  watch_time_predictor: "Watch time check",
  enhance_audio: "Enhance audio",
};

export interface CreditPack {
  id: string;
  credits: number;
  amountInr: number;
  amountUsd: number | null;
  priceInr: string;
  priceUsd: string | null;
}

export interface CreditPricing {
  costs: Record<CreditAction, { unit: "minute" | "run"; credits: number }>;
  packs: CreditPack[];
  allowances: { free: number; pro: number };
  topUpsForFree: boolean;
  offlineBuffer: number;
  paymentsConfigured: boolean;
}

export interface CreditBalance {
  /** Null while offline: only the total is known then. */
  allowance: number | null;
  purchased: number | null;
  total: number;
  plan?: "free" | "pro";
  resetsAt: string | null;
  /** Credits that can still be spent offline. */
  offlineBuffer: number;
  offline: boolean;
  /** Offline spends waiting to sync. */
  pending: number;
}

export interface CreditHistoryItem {
  id: number;
  delta: number;
  bucket: "allowance" | "purchased";
  kind: "grant" | "debit" | "refund" | "reset" | "admin";
  reason: string | null;
  action: CreditAction | null;
  createdAt: number;
}

export type CreditsErrorCode = "insufficient" | "offline" | "signed_out" | "other";

/** Thrown by spend(). `message` is ready to show as is. */
export class CreditsError extends Error {
  constructor(
    public code: CreditsErrorCode,
    message: string,
  ) {
    super(message);
  }
}

function toCreditsError(e: unknown): CreditsError {
  const s = String(e);
  const m = /^(insufficient|offline): ([\s\S]*)$/.exec(s);
  return m ? new CreditsError(m[1] as CreditsErrorCode, m[2]) : new CreditsError("other", s);
}

/** A fresh idempotency key for one AI job. Reuse it for the matching refund. */
export const newSpendKey = (action: CreditAction) => `${action}-${crypto.randomUUID()}`;

/** Same formula as the server's costOf: minute actions round up, any use costs at least 1. */
export function estimateCredits(pricing: CreditPricing | null, action: CreditAction, units: number): number {
  const c = pricing?.costs[action];
  if (!c || c.credits === 0) return 0;
  return c.unit === "minute"
    ? Math.max(1, Math.ceil(units * c.credits - 1e-9))
    : c.credits * Math.max(1, Math.ceil(units));
}

interface CreditsContext {
  /** False without VITE_VERSO_API_URL: show "Credits aren't set up yet". */
  configured: boolean;
  /** True when spend() really charges (configured, enforced and signed in). */
  active: boolean;
  balance: CreditBalance | null;
  pricing: CreditPricing | null;
  error: string | null;
  /** Below 10% of this plan's monthly credits. */
  low: boolean;
  estimate: (action: CreditAction, units: number) => number;
  /** Charges once per key and returns the credits used. Throws CreditsError with a friendly message. */
  spend: (action: CreditAction, units: number, key: string) => Promise<number>;
  /** Gives back a spend whose job failed. Never throws. */
  refund: (key: string) => Promise<void>;
  refresh: () => Promise<void>;
  history: (cursor?: string | null) => Promise<{ items: CreditHistoryItem[]; nextCursor: string | null }>;
  /** Opens the hosted checkout for a pack in the browser and watches for the new balance. */
  buy: (packId: string) => Promise<void>;
  /** Shared dialogs, rendered by <CreditsHost />. */
  buyOpen: boolean;
  openBuy: () => void;
  closeBuy: () => void;
  outOfCredits: string | null;
  showOutOfCredits: (message: string) => void;
  closeOutOfCredits: () => void;
}

const Ctx = createContext<CreditsContext | null>(null);
const FOCUS_REFRESH_MS = 15_000;
const BUY_POLL_MS = 5_000;
const BUY_POLL_FOR_MS = 3 * 60_000;

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { ent } = useEntitlements();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [pricing, setPricing] = useState<CreditPricing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [outOfCredits, setOutOfCredits] = useState<string | null>(null);
  const lastFetch = useRef(0);
  const poll = useRef<number | undefined>(undefined);
  const signedIn = accountsConfigured && ent.signedIn;
  const active = signedIn && CREDITS_ENFORCE;

  const refresh = useCallback(async () => {
    if (!signedIn) return;
    lastFetch.current = Date.now();
    try {
      setBalance(await invoke<CreditBalance>("credits_balance", { api: API_URL }));
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }, [signedIn]);

  useEffect(() => {
    if (!accountsConfigured) return;
    invoke<CreditPricing>("credits_pricing", { api: API_URL })
      .then(setPricing)
      .catch(() => {
        /* offline with nothing cached, or a plain browser: estimates show 0 */
      });
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    void Promise.resolve().then(refresh);
    const onFocus = () => {
      if (Date.now() - lastFetch.current > FOCUS_REFRESH_MS) void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [signedIn, ent.plan, refresh]);

  useEffect(() => () => window.clearInterval(poll.current), []);

  const estimate = useCallback(
    (action: CreditAction, units: number) => estimateCredits(pricing, action, units),
    [pricing],
  );

  const spend = useCallback(
    async (action: CreditAction, units: number, key: string) => {
      if (!accountsConfigured || !CREDITS_ENFORCE) return 0;
      if (!ent.signedIn) {
        throw new CreditsError(
          "signed_out",
          "Sign in to use AI tools. Every account gets free credits each month.",
        );
      }
      try {
        const r = await invoke<{ charged: number; balance: Partial<CreditBalance> & { total: number } }>(
          "credits_debit",
          {
            api: API_URL,
            action,
            units,
            idempotencyKey: key,
          },
        );
        setBalance((b) => ({
          ...(b as CreditBalance),
          ...r.balance,
          offline: r.balance.offline ?? false,
          pending: r.balance.pending ?? b?.pending ?? 0,
        }));
        return r.charged;
      } catch (e) {
        const err = toCreditsError(e);
        if (err.code === "insufficient") setOutOfCredits(err.message);
        throw err;
      }
    },
    [ent.signedIn],
  );

  const refund = useCallback(
    async (key: string) => {
      if (!active) return;
      try {
        await invoke("credits_refund", { api: API_URL, idempotencyKey: key });
      } catch {
        /* no charge under that key, or offline: nothing to give back now */
      }
      void refresh();
    },
    [active, refresh],
  );

  const history = useCallback(
    (cursor?: string | null) =>
      invoke<{ items: CreditHistoryItem[]; nextCursor: string | null }>("credits_history", {
        api: API_URL,
        cursor: cursor ?? null,
      }),
    [],
  );

  const buy = useCallback(
    async (packId: string) => {
      await invoke("credits_buy", { api: API_URL, packId });
      // Watch for the webhook to land; focus also refreshes when they come back.
      const before = balance?.total ?? 0;
      const started = Date.now();
      window.clearInterval(poll.current);
      poll.current = window.setInterval(async () => {
        if (Date.now() - started > BUY_POLL_FOR_MS) return window.clearInterval(poll.current);
        try {
          const b = await invoke<CreditBalance>("credits_balance", { api: API_URL });
          setBalance(b);
          if (b.total > before) window.clearInterval(poll.current);
        } catch {
          /* keep trying until the time is up */
        }
      }, BUY_POLL_MS);
    },
    [balance?.total],
  );

  // Signed out: hide the last account's balance.
  const shown = signedIn ? balance : null;
  const plan = shown?.plan ?? ent.plan;
  const monthly = pricing ? pricing.allowances[plan] : 0;
  const low = shown !== null && monthly > 0 && shown.total < monthly * 0.1;

  const value = useMemo<CreditsContext>(
    () => ({
      configured: accountsConfigured,
      active,
      balance: shown,
      pricing,
      error,
      low,
      estimate,
      spend,
      refund,
      refresh,
      history,
      buy,
      buyOpen,
      openBuy: () => setBuyOpen(true),
      closeBuy: () => setBuyOpen(false),
      outOfCredits,
      showOutOfCredits: setOutOfCredits,
      closeOutOfCredits: () => setOutOfCredits(null),
    }),
    [
      active,
      shown,
      pricing,
      error,
      low,
      estimate,
      spend,
      refund,
      refresh,
      history,
      buy,
      buyOpen,
      outOfCredits,
    ],
  );

  // eslint-disable-next-line react-hooks/refs -- refs are only read inside the callbacks, never during render
  return createElement(Ctx.Provider, { value }, children);
}

export function useCredits(): CreditsContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCredits needs <CreditsProvider> (see src/main.tsx).");
  return ctx;
}
