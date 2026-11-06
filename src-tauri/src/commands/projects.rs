//! Saving, opening and autosaving projects.
//!
//! Projects are JSON produced by the frontend. Every project is autosaved to
//! `<app data>/projects/<id>.json`; "Save as" also writes a `.verso` file the
//! user can keep anywhere. Writes go to a temp file first, then rename, so a
//! crash never leaves a half-written project.

use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::Manager;

fn projects_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("We couldn't find the app data folder ({e})."))?
        .join("projects");
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("We couldn't create the projects folder ({e})."))?;
    Ok(dir)
}

fn write_atomic(path: &Path, contents: &str) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("We couldn't create that folder ({e})."))?;
    }
    let tmp = path.with_extension("tmp");
    std::fs::write(&tmp, contents).map_err(|e| format!("We couldn't save the project ({e})."))?;
    std::fs::rename(&tmp, path).map_err(|e| format!("We couldn't save the project ({e})."))
}

fn safe_id(id: &str) -> Result<&str, String> {
    if !id.is_empty()
        && id.len() < 64
        && id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        Ok(id)
    } else {
        Err("That project id isn't valid.".into())
    }
}

/// Lets the preview play the media files a project uses.
fn allow_sources(app: &tauri::AppHandle, json: &str) {
    #[derive(Deserialize)]
    struct Src {
        path: String,
    }
    #[derive(Deserialize)]
    struct C {
        source: Option<Src>,
    }
    #[derive(Deserialize)]
    struct T {
        clips: Vec<C>,
    }
    #[derive(Deserialize)]
    struct P {
        tracks: Vec<T>,
    }
    if let Ok(p) = serde_json::from_str::<P>(json) {
        let scope = app.asset_protocol_scope();
        for t in p.tracks {
            for c in t.clips {
                if let Some(s) = c.source {
                    if Path::new(&s.path).is_file() {
                        let _ = scope.allow_file(&s.path);
                    }
                }
            }
        }
    }
}

#[tauri::command]
pub fn autosave_project(app: tauri::AppHandle, id: String, json: String) -> Result<(), String> {
    let dir = projects_dir(&app)?;
    write_atomic(&dir.join(format!("{}.json", safe_id(&id)?)), &json)
}

#[tauri::command]
pub fn save_project_as(path: String, json: String) -> Result<(), String> {
    write_atomic(Path::new(&path), &json)
}

#[tauri::command]
pub fn open_project(app: tauri::AppHandle, path: String) -> Result<String, String> {
    let json = std::fs::read_to_string(&path).map_err(|_| {
        "We couldn't open that project. It may have been moved or deleted.".to_string()
    })?;
    allow_sources(&app, &json);
    Ok(json)
}

#[tauri::command]
pub fn open_autosaved_project(app: tauri::AppHandle, id: String) -> Result<String, String> {
    let path = projects_dir(&app)?.join(format!("{}.json", safe_id(&id)?));
    open_project(app, path.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn delete_autosaved_project(app: tauri::AppHandle, id: String) -> Result<(), String> {
    let path = projects_dir(&app)?.join(format!("{}.json", safe_id(&id)?));
    if path.is_file() {
        std::fs::remove_file(path)
            .map_err(|e| format!("We couldn't remove that project ({e})."))?;
    }
    Ok(())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSummary {
    id: String,
    name: String,
    updated_at: f64,
    duration_sec: f64,
    clip_count: usize,
    /// First video file in the project, for a cover picture.
    cover_source: Option<serde_json::Value>,
}

/// Recent projects, newest first.
#[tauri::command]
pub fn list_projects(app: tauri::AppHandle) -> Result<Vec<ProjectSummary>, String> {
    let dir = projects_dir(&app)?;
    let mut out = Vec::new();
    for entry in std::fs::read_dir(&dir)
        .map_err(|e| e.to_string())?
        .flatten()
    {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }
        let Ok(text) = std::fs::read_to_string(&path) else {
            continue;
        };
        let Ok(v) = serde_json::from_str::<serde_json::Value>(&text) else {
            continue;
        };
        let tracks = v["tracks"].as_array().cloned().unwrap_or_default();
        let clips: Vec<&serde_json::Value> = tracks
            .iter()
            .flat_map(|t| t["clips"].as_array().into_iter().flatten())
            .collect();
        let duration = clips
            .iter()
            .filter_map(|c| c["end"].as_f64())
            .fold(0.0, f64::max);
        let cover = tracks
            .iter()
            .find(|t| t["kind"] == "video")
            .and_then(|t| t["clips"].as_array())
            .and_then(|cs| cs.iter().find(|c| c["source"].is_object()))
            .map(|c| c["source"].clone());
        out.push(ProjectSummary {
            id: v["id"].as_str().unwrap_or_default().to_string(),
            name: v["name"].as_str().unwrap_or("Untitled").to_string(),
            updated_at: v["updatedAt"].as_f64().unwrap_or(0.0),
            duration_sec: duration,
            clip_count: clips.len(),
            cover_source: cover,
        });
    }
    out.sort_by(|a, b| b.updated_at.total_cmp(&a.updated_at));
    // Allow the cover videos of listed projects on the asset protocol.
    for p in &out {
        if let Some(src) = p.cover_source.as_ref().and_then(|s| s["path"].as_str()) {
            if Path::new(src).is_file() {
                let _ = app.asset_protocol_scope().allow_file(src);
            }
        }
    }
    Ok(out)
}
