//! Saving, opening and autosaving projects.
//!
//! Projects are JSON produced by the frontend. Every project is autosaved to
//! `<app data>/projects/<id>.json`; "Save as" also writes a `.verso` file the
//! user can keep anywhere. Writes go to a temp file first (flushed to disk),
//! then rename, so a crash never leaves a half-written project.
//!
//! A `.verso` file also stores each media file's path relative to the project
//! (`source.relPath`), so a project folder can be moved or copied to another PC:
//! on open, a missing absolute path is relinked through `relPath` when a file of
//! the same size is there.

use std::io::Write;
use std::path::{Component, Path, PathBuf};

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
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
    let fail = |e: std::io::Error| format!("We couldn't save the project ({e}).");
    let tmp = path.with_extension("tmp");
    let mut f = std::fs::File::create(&tmp).map_err(fail)?;
    f.write_all(contents.as_bytes()).map_err(fail)?;
    f.sync_all().map_err(fail)?;
    drop(f);
    std::fs::rename(&tmp, path).map_err(fail)
}

/// Calls `f` on every clip's `source` object.
fn for_each_source(v: &mut Value, mut f: impl FnMut(&mut Map<String, Value>)) {
    let Some(tracks) = v.get_mut("tracks").and_then(Value::as_array_mut) else {
        return;
    };
    for t in tracks {
        let Some(clips) = t.get_mut("clips").and_then(Value::as_array_mut) else {
            continue;
        };
        for c in clips {
            if let Some(src) = c.get_mut("source").and_then(Value::as_object_mut) {
                f(src);
            }
        }
    }
}

/// `to` relative to the folder `from`, with forward slashes. None across drives.
fn relative(from: &Path, to: &Path) -> Option<String> {
    let a: Vec<Component> = from.components().collect();
    let b: Vec<Component> = to.components().collect();
    if a.first() != b.first() {
        return None;
    }
    let common = a.iter().zip(&b).take_while(|(x, y)| x == y).count();
    let mut out = PathBuf::new();
    for _ in common..a.len() {
        out.push("..");
    }
    for c in &b[common..] {
        out.push(c);
    }
    Some(out.to_string_lossy().replace('\\', "/"))
}

/// Adds `relPath` to every media source, relative to the `.verso` file's folder.
fn with_rel_paths(project_file: &Path, json: &str) -> String {
    let (Some(dir), Ok(mut v)) = (project_file.parent(), serde_json::from_str::<Value>(json))
    else {
        return json.to_string();
    };
    for_each_source(&mut v, |src| {
        match src
            .get("path")
            .and_then(Value::as_str)
            .and_then(|p| relative(dir, Path::new(p)))
        {
            Some(rel) => src.insert("relPath".into(), rel.into()),
            None => src.remove("relPath"),
        };
    });
    serde_json::to_string(&v).unwrap_or_else(|_| json.to_string())
}

/// Points missing media back at the copy next to the project (same relative path, same size).
fn relink(project_file: &Path, json: String) -> String {
    let (Some(dir), Ok(mut v)) = (project_file.parent(), serde_json::from_str::<Value>(&json))
    else {
        return json;
    };
    let mut changed = false;
    for_each_source(&mut v, |src| {
        let missing = src
            .get("path")
            .and_then(Value::as_str)
            .is_some_and(|p| !Path::new(p).is_file());
        let Some(rel) = src
            .get("relPath")
            .and_then(Value::as_str)
            .filter(|_| missing)
        else {
            return;
        };
        let candidate = dir.join(rel);
        let size_ok = match (
            src.get("sizeBytes").and_then(Value::as_u64),
            std::fs::metadata(&candidate),
        ) {
            (_, Err(_)) => false,
            (Some(want), Ok(m)) => m.len() == want,
            (None, Ok(m)) => m.is_file(),
        };
        if size_ok {
            src.insert(
                "path".into(),
                candidate.to_string_lossy().into_owned().into(),
            );
            changed = true;
        }
    });
    if changed {
        serde_json::to_string(&v).unwrap_or(json)
    } else {
        json
    }
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
    let file = Path::new(&path);
    write_atomic(file, &with_rel_paths(file, &json))
}

#[tauri::command]
pub fn open_project(app: tauri::AppHandle, path: String) -> Result<String, String> {
    let json = std::fs::read_to_string(&path).map_err(|_| {
        "We couldn't open that project. It may have been moved or deleted.".to_string()
    })?;
    let json = relink(Path::new(&path), json);
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
