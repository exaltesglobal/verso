//! Surecast handshake: connect with a workspace API key (kept in the OS keychain),
//! send a finished reel as a draft post through a persistent upload queue, and read
//! the post's status back. Scheduling happens in Surecast's web app.
//! See docs/SURECAST-INTEGRATION.md and docs/SURECAST-API-NEEDS.md.
//!
//! The queue lives in app data (`surecast-queue.json`) so uploads survive restarts
//! and offline periods. Jobs retry with backoff on network and server errors, and
//! resume chunked uploads from the last confirmed offset when Surecast supports it.

use std::fs::File;
use std::io::{Cursor, Read};
use std::path::PathBuf;
use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use tauri::{AppHandle, Emitter, Manager};

use crate::tools::{self, Tool};

const KEYRING_SERVICE: &str = "com.agapelabs.verso";
const KEYRING_USER: &str = "surecast-token";
/// Surecast's current single-request limit for videos (server/src/engine/content.ts MAX_VIDEO).
const MAX_DIRECT_UPLOAD: u64 = 100_000_000;
const MAX_ATTEMPTS: u32 = 8;

static QUEUE_LOCK: Mutex<()> = Mutex::new(());
static WORKER: AtomicBool = AtomicBool::new(false);

// ---------- types ----------

/// Everything Verso sends for one reel. Surecast stores what it understands today
/// (body + video); the rest rides along in `verso` for the proposed fields.
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Package {
    project_id: String,
    project_name: String,
    video_path: String,
    cover_path: Option<String>,
    cover_time_sec: Option<f64>,
    client_id: String,
    title: String,
    hook: String,
    caption: String,
    hashtags: Vec<String>,
    srt: String,
    language: String,
    duration_sec: f64,
    aspect: String,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Upload {
    id: String,
    offset: u64,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Job {
    id: String,
    base: String,
    created_at: u64,
    package: Package,
    /// queued | uploading | creating | sent | failed
    state: String,
    attempts: u32,
    next_attempt_at: u64,
    error: Option<String>,
    video_media_id: Option<String>,
    cover_media_id: Option<String>,
    upload: Option<Upload>,
    post_id: Option<String>,
    /// Read back from Surecast: post status, scheduled time, live links.
    remote_status: Option<String>,
    scheduled_at: Option<String>,
    links: Vec<String>,
    checked_at: Option<u64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Status {
    connected: bool,
    email: Option<String>,
    workspace: Option<String>,
    /// Surecast offers resumable chunked uploads (proposed `/media/uploads`).
    chunked_upload: bool,
    error: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Progress {
    job_id: String,
    phase: String,
    sent: u64,
    total: u64,
}

// ---------- helpers ----------

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn keyring() -> Result<keyring::Entry, String> {
    keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER)
        .map_err(|e| format!("We couldn't open the system keychain ({e})."))
}

fn token() -> Option<String> {
    keyring().ok()?.get_password().ok()
}

fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("We couldn't find the app data folder ({e})."))?;
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("We couldn't create the app data folder ({e})."))?;
    Ok(dir)
}

fn queue_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(data_dir(app)?.join("surecast-queue.json"))
}

fn load_jobs(app: &AppHandle) -> Vec<Job> {
    queue_path(app)
        .ok()
        .and_then(|p| std::fs::read_to_string(p).ok())
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save_jobs(app: &AppHandle, jobs: &[Job]) -> Result<(), String> {
    let path = queue_path(app)?;
    let tmp = path.with_extension("json.tmp");
    let text = serde_json::to_string_pretty(jobs).map_err(|e| e.to_string())?;
    std::fs::write(&tmp, text).map_err(|e| format!("We couldn't save the upload queue ({e})."))?;
    std::fs::rename(&tmp, &path).map_err(|e| format!("We couldn't save the upload queue ({e})."))
}

/// Read-modify-write one job under the queue lock.
fn update_job(app: &AppHandle, id: &str, f: impl FnOnce(&mut Job)) -> Option<Job> {
    let _g = QUEUE_LOCK.lock().unwrap();
    let mut jobs = load_jobs(app);
    let job = jobs.iter_mut().find(|j| j.id == id)?;
    f(job);
    let out = job.clone();
    let _ = save_jobs(app, &jobs);
    Some(out)
}

fn url(base: &str, path: &str) -> Result<String, String> {
    let b = base.trim().trim_end_matches('/');
    if !(b.starts_with("https://")
        || b.starts_with("http://localhost")
        || b.starts_with("http://127.0.0.1"))
    {
        return Err("Add your Surecast address in Settings (it starts with https://).".into());
    }
    Ok(format!("{b}{path}"))
}

/// HTTP failure: status 0 means Surecast couldn't be reached.
struct Fail {
    status: u16,
    message: String,
}

impl Fail {
    /// Worth retrying later: offline, rate limited or a server-side problem.
    fn temporary(&self) -> bool {
        self.status == 0 || self.status == 429 || self.status >= 500
    }
}

fn agent() -> ureq2::Agent {
    ureq2::AgentBuilder::new()
        .timeout_connect(Duration::from_secs(15))
        .timeout_read(Duration::from_secs(120))
        .timeout_write(Duration::from_secs(120))
        .build()
}

fn read(res: Result<ureq2::Response, ureq2::Error>) -> Result<Value, Fail> {
    match res {
        Ok(r) => Ok(r.into_json().unwrap_or(Value::Null)),
        Err(ureq2::Error::Status(status, r)) => {
            let v: Value = r.into_json().unwrap_or_default();
            let mut message = v["error"]
                .as_str()
                .unwrap_or("Surecast had a problem. Please try again.")
                .to_string();
            // Per-channel problems from POST /posts come back in `details`.
            if let Some(d) = v["details"].as_array() {
                let issues: Vec<String> = d
                    .iter()
                    .flat_map(|x| x["issues"].as_array().cloned().unwrap_or_default())
                    .filter_map(|i| i.as_str().map(String::from))
                    .collect();
                if !issues.is_empty() {
                    message = format!("{message} {}", issues.join(" "));
                }
            }
            if status == 401 {
                message = "Surecast didn't accept your key. Reconnect Surecast in Settings.".into();
            }
            Err(Fail { status, message })
        }
        Err(_) => Err(Fail {
            status: 0,
            message: "We couldn't reach Surecast. We'll keep trying when you're back online."
                .into(),
        }),
    }
}

fn request(method: &str, base: &str, path: &str) -> Result<ureq2::Request, Fail> {
    let key = token().ok_or(Fail {
        status: 401,
        message: "Connect Surecast in Settings first.".into(),
    })?;
    let u = url(base, path).map_err(|message| Fail {
        status: 400,
        message,
    })?;
    Ok(agent()
        .request(method, &u)
        .set("Authorization", &format!("Bearer {key}")))
}

fn get(base: &str, path: &str) -> Result<Value, Fail> {
    read(request("GET", base, path)?.call())
}

fn post_json(
    base: &str,
    path: &str,
    body: Value,
    idempotency: Option<&str>,
) -> Result<Value, Fail> {
    let mut req = request("POST", base, path)?;
    if let Some(k) = idempotency {
        // Proposed in SURECAST-API-NEEDS.md; ignored by Surecast today.
        req = req.set("Idempotency-Key", k);
    }
    read(req.send_json(body))
}

/// Paths Surecast lists in its OpenAPI document, for feature detection.
fn has_path(base: &str, path: &str) -> bool {
    let Ok(u) = url(base, "/v1/openapi.json") else {
        return false;
    };
    agent()
        .get(&u)
        .call()
        .ok()
        .and_then(|r| r.into_json::<Value>().ok())
        .is_some_and(|v| v["paths"].get(path).is_some())
}

async fn blocking<T: Send + 'static>(
    f: impl FnOnce() -> Result<T, String> + Send + 'static,
) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(f)
        .await
        .map_err(|e| e.to_string())?
}

// ---------- uploads ----------

/// Counts bytes as they leave, and reports progress about four times a second.
struct Counting<R> {
    inner: R,
    sent: u64,
    total: u64,
    last: std::time::Instant,
    report: Box<dyn FnMut(u64, u64) + Send>,
}

impl<R: Read> Read for Counting<R> {
    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        let n = self.inner.read(buf)?;
        self.sent += n as u64;
        if self.last.elapsed() > Duration::from_millis(250) || self.sent == self.total {
            self.last = std::time::Instant::now();
            (self.report)(self.sent, self.total);
        }
        Ok(n)
    }
}

fn mime_for(path: &str) -> &'static str {
    let p = path.to_ascii_lowercase();
    if p.ends_with(".mov") {
        "video/quicktime"
    } else if p.ends_with(".webm") {
        "video/webm"
    } else if p.ends_with(".jpg") || p.ends_with(".jpeg") {
        "image/jpeg"
    } else if p.ends_with(".png") {
        "image/png"
    } else {
        "video/mp4"
    }
}

fn file_name(path: &str) -> String {
    std::path::Path::new(path)
        .file_name()
        .map(|n| n.to_string_lossy().replace('"', ""))
        .unwrap_or_else(|| "video.mp4".into())
}

/// `POST /v1/media` (multipart), streamed from disk so large files never sit in memory.
fn upload_direct(
    base: &str,
    path: &str,
    report: Box<dyn FnMut(u64, u64) + Send>,
) -> Result<String, Fail> {
    let file = File::open(path).map_err(|e| Fail {
        status: 400,
        message: format!("We couldn't open the exported file ({e})."),
    })?;
    let size = file.metadata().map(|m| m.len()).unwrap_or(0);
    if size > MAX_DIRECT_UPLOAD {
        return Err(Fail { status: 413, message: "Surecast takes videos up to 100 MB. Export at Standard quality or make the reel shorter.".into() });
    }
    let boundary = format!("verso{:x}", rand::random::<u64>());
    let head = format!(
        "--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{}\"\r\nContent-Type: {}\r\n\r\n",
        file_name(path),
        mime_for(path)
    );
    let tail = format!("\r\n--{boundary}--\r\n");
    let total = head.len() as u64 + size + tail.len() as u64;
    let body = Cursor::new(head.into_bytes())
        .chain(file)
        .chain(Cursor::new(tail.into_bytes()));
    let reader = Counting {
        inner: body,
        sent: 0,
        total,
        last: std::time::Instant::now(),
        report,
    };
    let res = request("POST", base, "/v1/media")?
        .set(
            "Content-Type",
            &format!("multipart/form-data; boundary={boundary}"),
        )
        .set("Content-Length", &total.to_string())
        .send(reader);
    let v = read(res)?;
    v["media"]["id"].as_str().map(String::from).ok_or(Fail {
        status: 0,
        message: "Surecast didn't confirm the upload.".into(),
    })
}

/// Proposed resumable upload (`/v1/media/uploads`): start or resume, send chunks, complete.
fn upload_chunked(
    app: &AppHandle,
    job_id: &str,
    base: &str,
    path: &str,
    resume: Option<Upload>,
) -> Result<String, Fail> {
    let mut file = File::open(path).map_err(|e| Fail {
        status: 400,
        message: format!("We couldn't open the exported file ({e})."),
    })?;
    let size = file.metadata().map(|m| m.len()).unwrap_or(0);
    let (id, mut offset, chunk) = match resume {
        Some(u) => {
            // Ask Surecast how much it already has; the local offset may be ahead of what it kept.
            let v = get(base, &format!("/v1/media/uploads/{}", u.id))?;
            (
                u.id,
                v["upload"]["offset"].as_u64().unwrap_or(0),
                v["upload"]["chunkSize"].as_u64().unwrap_or(8_000_000),
            )
        }
        None => {
            let v = post_json(
                base,
                "/v1/media/uploads",
                json!({ "filename": file_name(path), "size": size, "mime": mime_for(path) }),
                Some(job_id),
            )?;
            let id = v["upload"]["id"].as_str().unwrap_or_default().to_string();
            (
                id,
                0,
                v["upload"]["chunkSize"].as_u64().unwrap_or(8_000_000),
            )
        }
    };
    if id.is_empty() {
        return Err(Fail {
            status: 0,
            message: "Surecast didn't start the upload.".into(),
        });
    }
    let chunk = chunk.clamp(256 * 1024, 64 * 1024 * 1024);
    use std::io::{Seek, SeekFrom};
    while offset < size {
        let len = chunk.min(size - offset);
        file.seek(SeekFrom::Start(offset)).map_err(|e| Fail {
            status: 400,
            message: e.to_string(),
        })?;
        let mut buf = vec![0u8; len as usize];
        file.read_exact(&mut buf).map_err(|e| Fail {
            status: 400,
            message: e.to_string(),
        })?;
        let v = read(
            request("PUT", base, &format!("/v1/media/uploads/{id}"))?
                .set("Content-Type", "application/octet-stream")
                .set(
                    "Content-Range",
                    &format!("bytes {}-{}/{}", offset, offset + len - 1, size),
                )
                .send_bytes(&buf),
        )?;
        offset = v["upload"]["offset"].as_u64().unwrap_or(offset + len);
        let (jid, uid) = (job_id.to_string(), id.clone());
        update_job(app, &jid, |j| j.upload = Some(Upload { id: uid, offset }));
        let _ = app.emit(
            "publish://progress",
            Progress {
                job_id: job_id.into(),
                phase: "uploading".into(),
                sent: offset,
                total: size,
            },
        );
    }
    let v = post_json(
        base,
        &format!("/v1/media/uploads/{id}/complete"),
        json!({}),
        None,
    )?;
    v["media"]["id"].as_str().map(String::from).ok_or(Fail {
        status: 0,
        message: "Surecast didn't confirm the upload.".into(),
    })
}

// ---------- cover ----------

/// One JPEG frame from the exported video, cropped to the reel's shape.
fn make_cover(app: &AppHandle, video: &str, time_sec: f64, aspect: &str) -> Result<String, String> {
    let (w, h) = match aspect {
        "16:9" => (1280, 720),
        "1:1" => (1080, 1080),
        "4:5" => (1080, 1350),
        _ => (1080, 1920),
    };
    let dir = app
        .path()
        .app_cache_dir()
        .map_err(|e| e.to_string())?
        .join("surecast-covers");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let out = dir.join(format!("cover-{:x}.jpg", rand::random::<u64>()));
    let status = tools::command(Tool::Ffmpeg)
        .args([
            "-y",
            "-loglevel",
            "error",
            "-ss",
            &format!("{:.3}", time_sec.max(0.0)),
            "-i",
            video,
            "-frames:v",
            "1",
            "-vf",
        ])
        .arg(format!(
            "scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}"
        ))
        .args(["-q:v", "3"])
        .arg(&out)
        .status()
        .map_err(|_| tools::missing_message())?;
    if !status.success() || !out.is_file() {
        return Err("We couldn't make the cover image.".into());
    }
    Ok(out.to_string_lossy().into_owned())
}

// ---------- worker ----------

fn body_text(p: &Package) -> String {
    // YouTube uses the first line as the title, so the title always leads.
    let mut parts = vec![p.title.trim().to_string()];
    let text = [p.hook.trim(), p.caption.trim()]
        .iter()
        .filter(|s| !s.is_empty())
        .cloned()
        .collect::<Vec<_>>()
        .join("\n");
    if !text.is_empty() {
        parts.push(text);
    }
    if !p.hashtags.is_empty() {
        parts.push(p.hashtags.join(" "));
    }
    parts.retain(|s| !s.is_empty());
    parts.join("\n\n")
}

fn fail_job(app: &AppHandle, id: &str, f: Fail) {
    let job = update_job(app, id, |j| {
        j.attempts += 1;
        j.error = Some(f.message.clone());
        if f.temporary() && j.attempts < MAX_ATTEMPTS {
            // 30 s, 1 min, 2 min ... up to an hour.
            let wait = (30_000u64 << j.attempts.min(7)).min(3_600_000);
            j.next_attempt_at = now_ms() + wait;
            j.state = "queued".into();
        } else {
            j.state = "failed".into();
        }
    });
    if job.is_some_and(|j| j.state == "failed") {
        let _ = app.emit(
            "publish://failed",
            json!({ "jobId": id, "error": f.message }),
        );
    }
}

fn process(app: &AppHandle, job: Job) {
    let id = job.id.clone();
    let base = job.base.clone();
    let p = job.package.clone();
    let emit = |phase: &str| {
        let _ = app.emit(
            "publish://progress",
            Progress {
                job_id: id.clone(),
                phase: phase.into(),
                sent: 0,
                total: 0,
            },
        );
    };

    // 1. Cover: make one now if the dialog didn't (failure here never blocks the video).
    let mut cover = p
        .cover_path
        .clone()
        .filter(|c| std::path::Path::new(c).is_file());
    if cover.is_none() {
        cover = make_cover(
            app,
            &p.video_path,
            p.cover_time_sec.unwrap_or(0.0),
            &p.aspect,
        )
        .ok();
        if let Some(c) = &cover {
            let c = c.clone();
            update_job(app, &id, |j| j.package.cover_path = Some(c));
        }
    }

    // 2. Video.
    let mut video_id = job.video_media_id.clone();
    if video_id.is_none() {
        update_job(app, &id, |j| j.state = "uploading".into());
        emit("uploading");
        let res = if has_path(&base, "/media/uploads") {
            upload_chunked(app, &id, &base, &p.video_path, job.upload.clone())
        } else {
            let (app2, jid) = (app.clone(), id.clone());
            upload_direct(
                &base,
                &p.video_path,
                Box::new(move |sent, total| {
                    let _ = app2.emit(
                        "publish://progress",
                        Progress {
                            job_id: jid.clone(),
                            phase: "uploading".into(),
                            sent,
                            total,
                        },
                    );
                }),
            )
        };
        match res {
            Ok(m) => {
                let m2 = m.clone();
                update_job(app, &id, |j| {
                    j.video_media_id = Some(m2);
                    j.upload = None;
                });
                video_id = Some(m);
            }
            Err(f) => return fail_job(app, &id, f),
        }
    }

    // 3. Cover into the media library (best effort): Surecast won't mix it into a video post yet.
    let mut cover_id = job.cover_media_id.clone();
    if cover_id.is_none() {
        if let Some(c) = &cover {
            if let Ok(m) = upload_direct(&base, c, Box::new(|_, _| {})) {
                let m2 = m.clone();
                update_job(app, &id, |j| j.cover_media_id = Some(m2));
                cover_id = Some(m);
            }
        }
    }

    // 4. The draft post. The user schedules it in Surecast.
    update_job(app, &id, |j| j.state = "creating".into());
    emit("creating");
    let body = json!({
        "clientId": p.client_id,
        "body": body_text(&p),
        "mediaIds": [video_id],
        "action": "draft",
        // Proposed fields (SURECAST-API-NEEDS.md); Surecast ignores them today.
        "coverMediaId": cover_id,
        "externalRef": format!("verso:{}", p.project_id),
        "verso": {
            "projectId": p.project_id,
            "projectName": p.project_name,
            "title": p.title,
            "hook": p.hook,
            "caption": p.caption,
            "hashtags": p.hashtags,
            "captionsSrt": p.srt,
            "language": p.language,
            "durationSec": p.duration_sec,
            "aspect": p.aspect,
        },
    });
    match post_json(&base, "/v1/posts", body, Some(&id)) {
        Ok(v) => {
            let post_id = v["post"]["id"].as_str().map(String::from);
            let status = v["post"]["status"].as_str().map(String::from);
            update_job(app, &id, |j| {
                j.state = "sent".into();
                j.error = None;
                j.post_id = post_id.clone();
                j.remote_status = status;
                j.checked_at = Some(now_ms());
            });
            let _ = app.emit("publish://done", json!({ "jobId": id, "postId": post_id }));
        }
        Err(f) => fail_job(app, &id, f),
    }
}

/// Starts the background worker if it isn't running. It exits when nothing is due soon.
fn kick(app: &AppHandle) {
    if WORKER.swap(true, Ordering::SeqCst) {
        return;
    }
    let app = app.clone();
    std::thread::spawn(move || {
        loop {
            let next = {
                let _g = QUEUE_LOCK.lock().unwrap();
                let jobs = load_jobs(&app);
                let pending: Vec<&Job> = jobs
                    .iter()
                    .filter(|j| j.state != "sent" && j.state != "failed")
                    .collect();
                if pending.is_empty() {
                    None
                } else {
                    let now = now_ms();
                    Some(match pending.iter().find(|j| j.next_attempt_at <= now) {
                        Some(j) => Ok((*j).clone()),
                        None => Err(pending
                            .iter()
                            .map(|j| j.next_attempt_at)
                            .min()
                            .unwrap_or(now)
                            .saturating_sub(now)),
                    })
                }
            };
            match next {
                None => break,
                Some(Ok(job)) => process(&app, job),
                // Sleep until the next retry, but wake regularly in case a retry was requested.
                Some(Err(wait)) => std::thread::sleep(Duration::from_millis(wait.min(30_000))),
            }
        }
        WORKER.store(false, Ordering::SeqCst);
    });
}

// ---------- commands ----------

/// Checks the key against Surecast, then keeps it in the OS keychain.
#[tauri::command]
pub async fn surecast_connect(base: String, token: String) -> Result<Status, String> {
    blocking(move || {
        let token = token.trim().to_string();
        if !token.starts_with("sc_live_") {
            return Err("That doesn't look like a Surecast API key. It starts with sc_live_.".into());
        }
        let u = url(&base, "/v1/me")?;
        let me = read(agent().get(&u).set("Authorization", &format!("Bearer {token}")).call()).map_err(|f| {
            if f.status == 401 { "Surecast didn't recognise that key. Copy it again from Surecast > Settings > API keys.".to_string() } else { f.message }
        })?;
        keyring()?.set_password(&token).map_err(|e| format!("We couldn't save the key to the system keychain ({e})."))?;
        Ok(status_from(&base, Some(me)))
    })
    .await
}

#[tauri::command]
pub async fn surecast_disconnect() -> Result<(), String> {
    blocking(|| {
        if let Ok(e) = keyring() {
            let _ = e.delete_credential();
        }
        Ok(())
    })
    .await
}

fn status_from(base: &str, me: Option<Value>) -> Status {
    let mut s = Status {
        connected: token().is_some(),
        email: None,
        workspace: None,
        chunked_upload: false,
        error: None,
    };
    if !s.connected {
        return s;
    }
    let me = match me {
        Some(v) => Ok(v),
        None => get(base, "/v1/me"),
    };
    match me {
        Ok(v) => {
            s.email = v["user"]["email"].as_str().map(String::from);
            let ws = v["workspaceId"].as_str().unwrap_or_default();
            s.workspace = v["workspaces"]
                .as_array()
                .and_then(|a| a.iter().find(|w| w["id"] == ws))
                .and_then(|w| w["name"].as_str())
                .map(String::from);
            s.chunked_upload = has_path(base, "/media/uploads");
        }
        Err(f) => s.error = Some(f.message),
    }
    s
}

#[tauri::command]
pub async fn surecast_status(base: String) -> Result<Status, String> {
    blocking(move || Ok(status_from(&base, None))).await
}

/// Brands in the workspace (a Surecast post belongs to one), archived ones left out.
#[tauri::command]
pub async fn surecast_clients(base: String) -> Result<Value, String> {
    blocking(move || {
        let v = get(&base, "/v1/clients").map_err(|f| f.message)?;
        let list: Vec<Value> = v["clients"]
            .as_array()
            .cloned()
            .unwrap_or_default()
            .into_iter()
            .filter(|c| c["archivedAt"].is_null())
            .collect();
        Ok(Value::Array(list))
    })
    .await
}

/// Adds a reel to the persistent queue and starts sending it.
#[tauri::command]
pub async fn surecast_enqueue(
    app: AppHandle,
    base: String,
    package: Package,
) -> Result<String, String> {
    blocking(move || {
        if token().is_none() {
            return Err("Connect Surecast in Settings first.".into());
        }
        url(&base, "")?;
        if !std::path::Path::new(&package.video_path).is_file() {
            return Err("We couldn't find the exported video. Export it again.".into());
        }
        let id = format!("job{:x}{:x}", now_ms(), rand::random::<u16>());
        let job = Job {
            id: id.clone(),
            base,
            created_at: now_ms(),
            package,
            state: "queued".into(),
            attempts: 0,
            next_attempt_at: 0,
            error: None,
            video_media_id: None,
            cover_media_id: None,
            upload: None,
            post_id: None,
            remote_status: None,
            scheduled_at: None,
            links: vec![],
            checked_at: None,
        };
        {
            let _g = QUEUE_LOCK.lock().unwrap();
            let mut jobs = load_jobs(&app);
            jobs.push(job);
            save_jobs(&app, &jobs)?;
        }
        kick(&app);
        Ok(id)
    })
    .await
}

/// The queue, newest first. Also restarts sending after a restart or going offline.
#[tauri::command]
pub async fn surecast_jobs(app: AppHandle) -> Result<Vec<Job>, String> {
    blocking(move || {
        kick(&app);
        let mut jobs = load_jobs(&app);
        jobs.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        Ok(jobs)
    })
    .await
}

#[tauri::command]
pub async fn surecast_retry(app: AppHandle, job_id: String) -> Result<(), String> {
    blocking(move || {
        update_job(&app, &job_id, |j| {
            if j.state != "sent" {
                j.state = "queued".into();
                j.attempts = 0;
                j.next_attempt_at = 0;
                j.error = None;
            }
        });
        kick(&app);
        Ok(())
    })
    .await
}

/// Forgets a job locally. The post in Surecast is left alone.
#[tauri::command]
pub async fn surecast_remove(app: AppHandle, job_id: String) -> Result<(), String> {
    blocking(move || {
        let _g = QUEUE_LOCK.lock().unwrap();
        let mut jobs = load_jobs(&app);
        jobs.retain(|j| j.id != job_id);
        save_jobs(&app, &jobs)
    })
    .await
}

/// Reads status back for sent posts (read-only). Surecast owns schedule and status.
#[tauri::command]
pub async fn surecast_refresh(app: AppHandle) -> Result<Vec<Job>, String> {
    blocking(move || {
        kick(&app);
        let sent: Vec<Job> = load_jobs(&app)
            .into_iter()
            .filter(|j| j.state == "sent" && j.post_id.is_some())
            .take(20)
            .collect();
        for j in sent {
            let pid = j.post_id.clone().unwrap_or_default();
            match get(&j.base, &format!("/v1/posts/{pid}")) {
                Ok(v) => {
                    let post = &v["post"];
                    let links: Vec<String> = post["targets"]
                        .as_array()
                        .cloned()
                        .unwrap_or_default()
                        .iter()
                        .filter_map(|t| t["remoteUrl"].as_str().map(String::from))
                        .collect();
                    update_job(&app, &j.id, |x| {
                        x.remote_status = post["status"].as_str().map(String::from);
                        x.scheduled_at = post["scheduledAt"].as_str().map(String::from);
                        x.links = links;
                        x.checked_at = Some(now_ms());
                    });
                }
                Err(f) if f.status == 404 => {
                    update_job(&app, &j.id, |x| x.remote_status = Some("deleted".into()));
                }
                Err(_) => {}
            }
        }
        let mut jobs = load_jobs(&app);
        jobs.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        Ok(jobs)
    })
    .await
}
