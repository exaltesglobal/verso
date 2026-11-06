import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import type { MediaInfo } from "./media";
import { normalizeProject, type Project } from "./project";

export interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: number;
  durationSec: number;
  clipCount: number;
  coverSource: MediaInfo | null;
}

const FILE_FILTER = [{ name: "Verso project", extensions: ["verso"] }];

/** Schema version of the .verso JSON. Unknown keys are kept on load and written back on save. */
export const PROJECT_VERSION = 1;

export function serializeProject(p: Project): string {
  return JSON.stringify({ ...p, format: "verso-project", version: PROJECT_VERSION });
}

export function parseProject(json: string): Project {
  const raw = JSON.parse(json);
  if (!raw || !Array.isArray(raw.tracks)) throw new Error("That file isn't a Verso project.");
  return normalizeProject(raw);
}

export function autosaveProject(p: Project): Promise<void> {
  return invoke("autosave_project", { id: p.id, json: serializeProject(p) });
}

/** Asks where to save, writes a .verso file, and returns the project with its path. */
export async function saveProjectAs(p: Project): Promise<Project | null> {
  const path = await save({
    title: "Save project",
    defaultPath: `${p.name || "My reel"}.verso`,
    filters: FILE_FILTER,
  });
  if (!path) return null;
  const next = { ...p, filePath: path, updatedAt: Date.now() };
  await invoke("save_project_as", { path, json: serializeProject(next) });
  return next;
}

/** Saves to the existing file, or asks where if it has never been saved. */
export async function saveProject(p: Project): Promise<Project | null> {
  if (!p.filePath) return saveProjectAs(p);
  const next = { ...p, updatedAt: Date.now() };
  await invoke("save_project_as", { path: p.filePath, json: serializeProject(next) });
  return next;
}

export async function openProjectFile(): Promise<Project | null> {
  const path = await open({ title: "Open project", multiple: false, filters: FILE_FILTER });
  if (!path || Array.isArray(path)) return null;
  const json = await invoke<string>("open_project", { path });
  return { ...parseProject(json), filePath: path };
}

export async function openAutosaved(id: string): Promise<Project> {
  return parseProject(await invoke<string>("open_autosaved_project", { id }));
}

export function listProjects(): Promise<ProjectSummary[]> {
  return invoke<ProjectSummary[]>("list_projects");
}

export function deleteAutosaved(id: string): Promise<void> {
  return invoke("delete_autosaved_project", { id });
}

export function timeAgo(ms: number): string {
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? "yesterday" : `${d} days ago`;
}
