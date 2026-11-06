import { invoke } from "@tauri-apps/api/core";
import { API_URL } from "./config";

const seen = new Set<string>();

function report(message: string, stack?: string) {
  // Once per message per session, so a render loop can't fill the disk.
  if (seen.has(message) || seen.size > 20) return;
  seen.add(message);
  invoke("report_frontend_error", { message, stack: stack ?? null }).catch(() => {});
}

/** Writes uncaught frontend errors to <app log dir>/crashes (sent only if the user agrees later). */
export function installCrashHandlers() {
  window.addEventListener("error", (e) =>
    report(String(e.message), e.error instanceof Error ? e.error.stack : undefined),
  );
  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason;
    report(r instanceof Error ? r.message : String(r), r instanceof Error ? r.stack : undefined);
  });
}

export const pendingCrashReports = () => invoke<number>("pending_crash_reports");
export const sendCrashReports = () => invoke<number>("send_crash_reports", { api: API_URL });
export const discardCrashReports = () => invoke<void>("discard_crash_reports");
