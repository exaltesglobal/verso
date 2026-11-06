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
import { openUrl } from "@tauri-apps/plugin-opener";
import { API_URL, accountsConfigured, serverPage } from "./config";

/** Feature flags from server/src/plans.ts. */
export type Feature =
  | "export_4k"
  | "auto_clips"
  | "speaker_reframe"
  | "caption_styles_pro"
  | "templates_pro"
  /** Remove or swap the background (blur stays free). */
  | "background_pro"
  | "dubbing"
  /** Kept for compatibility: every plan exports without a watermark. */
  | "watermark_free";

export interface Entitlements {
  plan: "free" | "pro";
  features: Record<string, boolean>;
  limits: Record<string, number>;
  signedIn: boolean;
  email: string | null;
  /** Epoch ms until which the plan holds offline. */
  offlineUntil: number | null;
}

export const FREE: Entitlements = {
  plan: "free",
  // Free = full editor, 1080p export, no watermark. Pro adds the features below.
  features: {
    export_4k: false,
    auto_clips: false,
    speaker_reframe: false,
    caption_styles_pro: false,
    templates_pro: false,
    background_pro: false,
    dubbing: false,
    watermark_free: true,
  },
  limits: { auto_clips_per_month: 0, max_devices: 1, max_export_height: 1080 },
  signedIn: false,
  email: null,
  offlineUntil: null,
};

interface EntitlementsContext {
  ent: Entitlements;
  /** False when VITE_VERSO_API_URL is empty: show "Sign-in isn't set up yet". */
  configured: boolean;
  signingIn: boolean;
  /** Last network problem, in plain words. Cleared on the next success. */
  error: string | null;
  /** The server said an admin paused this account. The app is signed out and on Free. */
  blocked: boolean;
  can: (feature: Feature) => boolean;
  signIn: () => Promise<void>;
  cancelSignIn: () => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  /** Shared dialogs, rendered by <AccountHost />. */
  accountOpen: boolean;
  openAccount: () => void;
  closeAccount: () => void;
  upgradeReason: string | null | undefined;
  openUpgrade: (reason?: string) => void;
  closeUpgrade: () => void;
  openServerPage: (path: string) => void;
}

const Ctx = createContext<EntitlementsContext | null>(null);
/** Window focus re-checks the plan at most this often. */
const REFRESH_EVERY_MS = 60_000;
/** Exact message the server sends with 403 account_blocked (ACCOUNT_PAUSED in server/src/auth.ts). */
export const ACCOUNT_PAUSED = "Your account is paused. Contact support.";

export function EntitlementsProvider({ children }: { children: ReactNode }) {
  const [ent, setEnt] = useState<Entitlements>(FREE);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  // undefined = closed, null = open without a reason
  const [upgradeReason, setUpgradeReason] = useState<string | null | undefined>(undefined);
  const attempt = useRef(0);
  const lastFetch = useRef(0);
  const signedInRef = useRef(false);
  useEffect(() => {
    signedInRef.current = ent.signedIn;
  }, [ent.signedIn]);

  const refresh = useCallback(async () => {
    if (!accountsConfigured || !signedInRef.current) return;
    lastFetch.current = Date.now();
    try {
      setEnt(await invoke<Entitlements>("fetch_entitlements", { api: API_URL }));
      setError(null);
    } catch (e) {
      setError(String(e));
      // Signed out remotely (device removed, session revoked) or just offline: re-read the local state.
      invoke<Entitlements>("get_entitlements")
        .then(setEnt)
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    invoke<Entitlements>("get_entitlements")
      .then((cached) => {
        setEnt(cached);
        signedInRef.current = cached.signedIn;
        return refresh();
      })
      .catch(() => {
        /* plain browser (pnpm dev): stay on Free */
      });
    const onFocus = () => {
      if (Date.now() - lastFetch.current > REFRESH_EVERY_MS) void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const signIn = useCallback(async () => {
    if (!accountsConfigured) {
      setAccountOpen(true);
      return;
    }
    const id = ++attempt.current;
    setSigningIn(true);
    setError(null);
    try {
      const next = await invoke<Entitlements>("start_sign_in", { api: API_URL });
      if (id === attempt.current) setEnt(next);
    } catch (e) {
      if (id === attempt.current) setError(String(e));
    } finally {
      if (id === attempt.current) setSigningIn(false);
    }
  }, []);

  // The loopback listener times out on its own; we just stop waiting for it.
  const cancelSignIn = useCallback(() => {
    attempt.current++;
    setSigningIn(false);
  }, []);

  const signOut = useCallback(async () => {
    try {
      setEnt(await invoke<Entitlements>("sign_out", { api: API_URL }));
    } catch (e) {
      setError(String(e));
    }
  }, []);

  const openServerPage = useCallback((path: string) => {
    if (accountsConfigured) openUrl(serverPage(path)).catch((e) => setError(String(e)));
  }, []);

  const value = useMemo<EntitlementsContext>(
    () => ({
      ent,
      configured: accountsConfigured,
      signingIn,
      error,
      blocked: error === ACCOUNT_PAUSED,
      can: (f) => ent.features[f] === true,
      signIn,
      cancelSignIn,
      signOut,
      refresh,
      accountOpen,
      openAccount: () => setAccountOpen(true),
      closeAccount: () => setAccountOpen(false),
      upgradeReason,
      openUpgrade: (reason) => setUpgradeReason(reason ?? null),
      closeUpgrade: () => setUpgradeReason(undefined),
      openServerPage,
    }),
    [
      ent,
      signingIn,
      error,
      signIn,
      cancelSignIn,
      signOut,
      refresh,
      accountOpen,
      upgradeReason,
      openServerPage,
    ],
  );

  // eslint-disable-next-line react-hooks/refs -- refs are only read inside the callbacks, never during render
  return createElement(Ctx.Provider, { value }, children);
}

export function useEntitlements(): EntitlementsContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useEntitlements needs <EntitlementsProvider> (see src/main.tsx).");
  return ctx;
}
