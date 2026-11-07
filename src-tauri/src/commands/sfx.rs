//! Built-in sound effects and music beds, made by Verso itself.
//!
//! Every sound is synthesised with FFmpeg's audio generators (no samples, no
//! third-party recordings), so the library is ours to ship with no licence
//! questions. Files are rendered once into `<app data>/sounds/` on first use.

use std::path::PathBuf;

use serde::Serialize;
use tauri::Manager;

use crate::tools::{self, Tool};

struct Recipe {
    id: &'static str,
    name: &'static str,
    kind: &'static str, // "sfx" | "music"
    mood: &'static str,
    seconds: f32,
    /// FFmpeg lavfi audio graph producing the sound.
    graph: &'static str,
}

const RECIPES: &[Recipe] = &[
    Recipe {
        id: "whoosh",
        name: "Whoosh",
        kind: "sfx",
        mood: "Transition",
        seconds: 0.8,
        graph: "anoisesrc=d=0.8:c=pink:a=0.6,bandpass=f=1200:w=900,afade=t=in:d=0.35,afade=t=out:st=0.4:d=0.4,aecho=0.6:0.5:40:0.3",
    },
    Recipe {
        id: "swoosh-up",
        name: "Swoosh up",
        kind: "sfx",
        mood: "Transition",
        seconds: 0.6,
        graph: "anoisesrc=d=0.6:c=white:a=0.4,highpass=f=800,lowpass=f=6000,afade=t=in:d=0.45,afade=t=out:st=0.45:d=0.15",
    },
    Recipe {
        id: "pop",
        name: "Pop",
        kind: "sfx",
        mood: "Text",
        seconds: 0.15,
        graph: "sine=f=880:d=0.15,volume='if(lt(t,0.01),t*100,exp(-30*t))':eval=frame,asetrate=44100*1.2,aresample=44100",
    },
    Recipe {
        id: "click",
        name: "Soft click",
        kind: "sfx",
        mood: "UI",
        seconds: 0.08,
        graph: "anoisesrc=d=0.08:c=white:a=0.8,highpass=f=2500,volume='exp(-80*t)':eval=frame",
    },
    Recipe {
        id: "ding",
        name: "Ding",
        kind: "sfx",
        mood: "Reveal",
        seconds: 1.2,
        graph: "sine=f=1318:d=1.2,volume='exp(-4*t)':eval=frame,aecho=0.8:0.6:120:0.25",
    },
    Recipe {
        id: "riser",
        name: "Riser",
        kind: "sfx",
        mood: "Build-up",
        seconds: 2.0,
        graph: "aevalsrc='0.3*sin(2*PI*(200+400*t*t)*t)+0.15*random(0)*t/2':d=2,highpass=f=150,afade=t=in:d=1.6",
    },
    Recipe {
        id: "boom",
        name: "Boom",
        kind: "sfx",
        mood: "Impact",
        seconds: 1.5,
        graph: "aevalsrc='0.9*sin(2*PI*(55-25*t)*t)*exp(-3*t)':d=1.5,lowpass=f=180",
    },
    Recipe {
        id: "typing",
        name: "Typing",
        kind: "sfx",
        mood: "Text",
        seconds: 1.6,
        graph: "aevalsrc='0.6*random(0)*lt(mod(t,0.13),0.012)':d=1.6,highpass=f=1800",
    },
    Recipe {
        id: "camera",
        name: "Camera shutter",
        kind: "sfx",
        mood: "Photo",
        seconds: 0.35,
        graph: "aevalsrc='0.7*random(0)*(lt(t,0.03)+between(t,0.18,0.21))':d=0.35,bandpass=f=3000:w=2500",
    },
    Recipe {
        id: "heartbeat",
        name: "Heartbeat",
        kind: "sfx",
        mood: "Tension",
        seconds: 2.0,
        graph: "aevalsrc='0.9*sin(2*PI*55*t)*(exp(-30*mod(t,1))+0.7*exp(-30*mod(t-0.25,1))*gte(mod(t,1),0.25))':d=2,lowpass=f=200",
    },
    Recipe {
        id: "bed-calm",
        name: "Calm pad",
        kind: "music",
        mood: "Calm",
        seconds: 60.0,
        graph: "aevalsrc='0.12*(sin(2*PI*220*t)+sin(2*PI*277.2*t)+sin(2*PI*329.6*t))*(0.7+0.3*sin(2*PI*0.1*t))':d=60,lowpass=f=1800,aecho=0.8:0.7:400:0.3,afade=t=in:d=2,afade=t=out:st=57:d=3",
    },
    Recipe {
        id: "bed-pulse",
        name: "Upbeat pulse",
        kind: "music",
        mood: "Upbeat",
        seconds: 60.0,
        graph: "aevalsrc='0.5*sin(2*PI*55*t)*exp(-12*mod(t,0.5))+0.12*(sin(2*PI*440*t)+sin(2*PI*554.4*t))*lt(mod(t,0.25),0.12)+0.08*random(0)*exp(-60*mod(t+0.25,0.5))':d=60,afade=t=in:d=1,afade=t=out:st=57:d=3",
    },
    Recipe {
        id: "bed-drive",
        name: "Night drive",
        kind: "music",
        mood: "Energetic",
        seconds: 60.0,
        graph: "aevalsrc='0.45*sin(2*PI*48*t)*exp(-9*mod(t,0.4))+0.1*sin(2*PI*(196+0*t)*t)*(0.5+0.5*sin(2*PI*2.5*t))+0.07*random(0)*exp(-80*mod(t+0.2,0.4))':d=60,lowpass=f=5000,afade=t=in:d=1,afade=t=out:st=57:d=3",
    },
    Recipe {
        id: "bed-warm",
        name: "Warm keys",
        kind: "music",
        mood: "Warm",
        seconds: 60.0,
        graph: "aevalsrc='0.14*(sin(2*PI*261.6*t)+0.6*sin(2*PI*329.6*t)+0.5*sin(2*PI*392*t))*exp(-1.2*mod(t,2))':d=60,aecho=0.8:0.6:300:0.35,lowpass=f=2500,afade=t=in:d=1,afade=t=out:st=57:d=3",
    },
];

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SoundItem {
    id: String,
    name: String,
    kind: String,
    mood: String,
    seconds: f32,
    path: String,
}

fn sounds_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("We couldn't find the app data folder ({e})."))?
        .join("sounds");
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("We couldn't create the sounds folder ({e})."))?;
    Ok(dir)
}

fn render(recipe: &Recipe, out: &PathBuf) -> Result<(), String> {
    let tmp = out.with_extension("part.m4a");
    let status = tools::command(Tool::Ffmpeg)
        .args([
            "-hide_banner",
            "-loglevel",
            "error",
            "-y",
            "-f",
            "lavfi",
            "-i",
        ])
        .arg(recipe.graph)
        .args([
            "-t",
            &recipe.seconds.to_string(),
            "-ac",
            "2",
            "-ar",
            "44100",
            "-c:a",
            "aac",
            "-b:a",
            "160k",
        ])
        .arg(&tmp)
        .status()
        .map_err(|_| tools::missing_message())?;
    if !status.success() {
        let _ = std::fs::remove_file(&tmp);
        return Err(format!("We couldn't make the {} sound.", recipe.name));
    }
    match std::fs::rename(&tmp, out) {
        Ok(()) => Ok(()),
        // Another call finished the same sound first: that file is just as good.
        Err(_) if out.is_file() => {
            let _ = std::fs::remove_file(&tmp);
            Ok(())
        }
        Err(_) => Err(format!(
            "We couldn't save the {} sound. Check there is free space on your drive and try again.",
            recipe.name
        )),
    }
}

/// One library build at a time: the panel can ask twice at once (React StrictMode,
/// quick tab switches), and two renders racing on the same temp file used to fail.
static LIBRARY_LOCK: std::sync::Mutex<()> = std::sync::Mutex::new(());

/// Lists the built-in sounds, rendering any that aren't on disk yet.
/// Files are allowed on the asset protocol so the app can preview them.
#[tauri::command]
pub async fn sound_library(app: tauri::AppHandle) -> Result<Vec<SoundItem>, String> {
    let dir = sounds_dir(&app)?;
    let handle = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let _guard = LIBRARY_LOCK.lock().unwrap_or_else(|e| e.into_inner());
        let mut out = Vec::new();
        for r in RECIPES {
            let path = dir.join(format!("{}.m4a", r.id));
            if !path.is_file() {
                render(r, &path)?;
            }
            let _ = handle.asset_protocol_scope().allow_file(&path);
            out.push(SoundItem {
                id: r.id.into(),
                name: r.name.into(),
                kind: r.kind.into(),
                mood: r.mood.into(),
                seconds: r.seconds,
                path: path.to_string_lossy().into_owned(),
            });
        }
        Ok(out)
    })
    .await
    .map_err(|_| "We couldn't get the sound library ready. Try again.".to_string())?
}
