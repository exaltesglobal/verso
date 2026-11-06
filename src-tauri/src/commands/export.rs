//! Export commands: run the FFmpeg plan from `crate::export` in the
//! background, report progress as events, support cancel.
//!
//! Events: `export://progress` `{ jobId, percent, etaSec, stage }`,
//! `export://done` `{ jobId, outputPath }`,
//! `export://error` `{ jobId, message, cancelled }`.

use std::collections::HashMap;
use std::io::{BufRead, BufReader, ErrorKind, Read};
use std::path::{Path, PathBuf};
use std::process::{Child, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{LazyLock, Mutex};
use std::time::Instant;

use serde::Serialize;
use tauri::{AppHandle, Emitter};

use crate::export::{self, ExportRequest, encoders};
use crate::tools::{self, Tool};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EncoderInfo {
    /// Working encoders, best first. Internal names; not shown to users.
    pub available: Vec<String>,
    pub chosen: String,
    /// True when only the low-quality MPEG-4 fallback works.
    pub fallback: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Progress<'a> {
    job_id: &'a str,
    percent: f64,
    eta_sec: Option<f64>,
    stage: &'a str,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Done<'a> {
    job_id: &'a str,
    output_path: &'a str,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Failed<'a> {
    job_id: &'a str,
    message: &'a str,
    cancelled: bool,
}

struct Job {
    child: Option<Child>,
    cancelled: bool,
}

static JOBS: LazyLock<Mutex<HashMap<String, Job>>> = LazyLock::new(Default::default);
static NEXT_ID: AtomicU64 = AtomicU64::new(1);

fn is_cancelled(id: &str) -> bool {
    JOBS.lock().unwrap().get(id).is_some_and(|j| j.cancelled)
}

fn same_file(a: &Path, b: &Path) -> bool {
    match (a.canonicalize(), b.canonicalize()) {
        (Ok(x), Ok(y)) => x == y,
        _ => a
            .to_string_lossy()
            .eq_ignore_ascii_case(&b.to_string_lossy()),
    }
}

/// Runs one export to completion. Returns the error message, if any.
fn run(app: &AppHandle, id: &str, req: &ExportRequest) -> Result<(), String> {
    let emit = |percent: f64, eta: Option<f64>, stage: &str| {
        let _ = app.emit(
            "export://progress",
            Progress {
                job_id: id,
                percent,
                eta_sec: eta,
                stage,
            },
        );
    };
    emit(0.0, None, "preparing");

    let out = PathBuf::from(&req.output_path);
    let dir = out
        .parent()
        .filter(|d| d.is_dir())
        .ok_or("We couldn't find the folder you chose. Pick another one and try again.")?;
    let sources = req
        .video_clips
        .iter()
        .map(|c| &c.path)
        .chain(req.audio_clips.iter().map(|c| &c.path));
    for src in sources {
        if !Path::new(src).is_file() {
            return Err(format!(
                "We couldn't find {}. It may have been moved or deleted.",
                Path::new(src)
                    .file_name()
                    .map(|n| n.to_string_lossy().into_owned())
                    .unwrap_or_else(|| src.clone())
            ));
        }
        if same_file(Path::new(src), &out) {
            return Err("That name is already used by one of your clips. Pick a different name so we don't overwrite it.".into());
        }
    }

    let encoder = encoders::detect()?.remove(0);
    let font = match &req.font_path {
        Some(f) if Path::new(f).is_file() => f.clone(),
        _ => export::default_font().unwrap_or_default(),
    };
    let needs_font = req.watermark || !req.text_overlays.is_empty() || !req.captions.is_empty();
    if needs_font && font.is_empty() {
        return Err(
            "We couldn't find a font for your text. Reinstalling Verso usually fixes this.".into(),
        );
    }

    let stem = out
        .file_stem()
        .map(|s| s.to_string_lossy().into_owned())
        .unwrap_or_else(|| "export".into());
    let tmp = dir.join(format!(".{stem}.verso-{id}.part.mp4"));
    let (args, total) = export::build_args(req, &encoder, &font, &tmp.to_string_lossy())?;

    let mut child = tools::command(Tool::Ffmpeg)
        .args(&args)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| match e.kind() {
            ErrorKind::NotFound => tools::missing_message(),
            _ => format!("We couldn't start the export ({e})."),
        })?;
    let stdout = child.stdout.take().expect("piped stdout");
    let mut stderr = child.stderr.take().expect("piped stderr");
    {
        let mut jobs = JOBS.lock().unwrap();
        let job = jobs.get_mut(id).expect("job registered");
        if job.cancelled {
            let _ = child.kill();
        }
        job.child = Some(child);
    }
    let errors = std::thread::spawn(move || {
        let mut s = String::new();
        let _ = stderr.read_to_string(&mut s);
        s
    });

    let started = Instant::now();
    let mut last_sent = -1.0;
    for line in BufReader::new(stdout).lines().map_while(Result::ok) {
        if let Some(sec) = export::parse_progress_time(&line) {
            let p = (sec / total).clamp(0.0, 1.0);
            let percent = (p * 1000.0).round() / 10.0;
            if percent - last_sent >= 0.5 {
                last_sent = percent;
                let eta = (p > 0.02).then(|| started.elapsed().as_secs_f64() * (1.0 - p) / p);
                emit(percent, eta, "encoding");
            }
        }
    }

    let child = JOBS
        .lock()
        .unwrap()
        .get_mut(id)
        .and_then(|j| j.child.take());
    let ok = child
        .map(|mut c| c.wait().map(|s| s.success()).unwrap_or(false))
        .unwrap_or(false);
    let detail = errors.join().unwrap_or_default();

    if is_cancelled(id) {
        let _ = std::fs::remove_file(&tmp);
        return Err("Export cancelled.".into());
    }
    if !ok || !tmp.is_file() {
        let _ = std::fs::remove_file(&tmp);
        let last = detail
            .lines()
            .rev()
            .find(|l| !l.trim().is_empty())
            .unwrap_or("");
        return Err(if last.is_empty() {
            "We couldn't finish the export. Please try again.".into()
        } else {
            format!("We couldn't finish the export. ({})", last.trim())
        });
    }

    emit(100.0, Some(0.0), "finishing");
    std::fs::rename(&tmp, &out).map_err(|e| {
        let _ = std::fs::remove_file(&tmp);
        format!(
            "We made the video but couldn't save it there. Is the file open in another app? ({e})"
        )
    })?;
    Ok(())
}

/// `invoke("detect_encoders")`.
#[tauri::command]
pub async fn detect_encoders() -> Result<EncoderInfo, String> {
    let available = tauri::async_runtime::spawn_blocking(encoders::detect)
        .await
        .map_err(|e| format!("Something went wrong while checking this computer ({e})."))??;
    let chosen = available[0].clone();
    Ok(EncoderInfo {
        fallback: chosen == "mpeg4",
        chosen,
        available,
    })
}

/// `invoke("start_export", { request })`. Returns the job id right away;
/// follow the job through the `export://*` events.
#[tauri::command]
pub fn start_export(app: AppHandle, request: ExportRequest) -> Result<String, String> {
    if export::total_duration(&request) <= 0.0 {
        return Err("Add a clip to your timeline before exporting.".into());
    }
    let id = format!(
        "exp{}-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis())
            .unwrap_or(0),
        NEXT_ID.fetch_add(1, Ordering::Relaxed)
    );
    JOBS.lock().unwrap().insert(
        id.clone(),
        Job {
            child: None,
            cancelled: false,
        },
    );
    let job_id = id.clone();
    std::thread::spawn(move || {
        let result = run(&app, &job_id, &request);
        let cancelled = JOBS
            .lock()
            .unwrap()
            .remove(&job_id)
            .is_some_and(|j| j.cancelled);
        match result {
            Ok(()) => {
                let _ = app.emit(
                    "export://done",
                    Done {
                        job_id: &job_id,
                        output_path: &request.output_path,
                    },
                );
            }
            Err(message) => {
                let _ = app.emit(
                    "export://error",
                    Failed {
                        job_id: &job_id,
                        message: &message,
                        cancelled,
                    },
                );
            }
        }
    });
    Ok(id)
}

/// `invoke("cancel_export", { jobId })`. Unknown or finished jobs are a no-op.
#[tauri::command]
pub fn cancel_export(job_id: String) {
    if let Some(job) = JOBS.lock().unwrap().get_mut(&job_id) {
        job.cancelled = true;
        if let Some(child) = job.child.as_mut() {
            let _ = child.kill();
        }
    }
}
