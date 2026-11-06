import { invoke } from "@tauri-apps/api/core";

export interface UpdateInfo {
  /** False until a signing key is set in tauri.conf.json (plugins.updater.pubkey). */
  configured: boolean;
  /** New version available, or null when up to date. */
  version: string | null;
  notes: string | null;
}

export const checkForUpdates = () => invoke<UpdateInfo>("check_for_update");

/** Downloads, installs and restarts Verso. */
export const installUpdate = () => invoke<void>("install_update");
