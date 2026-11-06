/**
 * App config from Vite env vars (see .env.example at the repo root).
 * An empty API URL means accounts aren't set up: the app runs offline on the Free plan.
 */
const rawApi = import.meta.env.VITE_VERSO_API_URL;

/** Verso accounts API base URL, without a trailing slash. Empty when not configured. */
export const API_URL = (rawApi ?? (import.meta.env.DEV ? "http://localhost:8787" : ""))
  .trim()
  .replace(/\/+$/, "");

export const accountsConfigured = API_URL !== "";

/** Closed beta: ask for an invite code before the app opens. */
export const BETA_GATE = import.meta.env.VITE_VERSO_BETA_GATE === "true";

/**
 * Charge AI credits before AI features run. Defaults to on in release builds and off in `pnpm dev`,
 * so AI features stay usable locally. Without an API URL nothing is charged either way.
 */
const rawEnforce = import.meta.env.VITE_VERSO_CREDITS_ENFORCE;
export const CREDITS_ENFORCE = rawEnforce ? rawEnforce === "true" : !import.meta.env.DEV;

/** A page on the accounts server, for opening in the system browser. */
export const serverPage = (path: string) => `${API_URL}${path}`;
