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

/** A page on the accounts server, for opening in the system browser. */
export const serverPage = (path: string) => `${API_URL}${path}`;
