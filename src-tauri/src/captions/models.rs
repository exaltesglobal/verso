//! Speech model manager: which Whisper models exist, which are on disk, and
//! downloading them (resumable, cancellable, SHA-256 verified).
//!
//! Models are OpenAI Whisper weights (MIT) converted to ggml by the whisper.cpp
//! project and hosted at huggingface.co/ggerganov/whisper.cpp. They are never
//! bundled with the app or committed to git: users download the one they pick,
//! once, into the app data folder. After that captions work offline.

use std::fs::{File, OpenOptions};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};

use serde::Serialize;
use sha2::{Digest, Sha256};

pub struct ModelSpec {
    pub id: &'static str,
    pub file: &'static str,
    pub label: &'static str,
    /// Exact file size in bytes, from the Hugging Face repo.
    pub size_bytes: u64,
    /// SHA-256 of the file (the Git LFS object id on Hugging Face).
    pub sha256: &'static str,
}

/// All multilingual (Hindi/Marathi capable). `.en` models are left out on purpose.
pub const MODELS: &[ModelSpec] = &[
    ModelSpec {
        id: "base-q5_1",
        file: "ggml-base-q5_1.bin",
        label: "Base (fast)",
        size_bytes: 59_707_625,
        sha256: "422f1ae452ade6f30a004d7e5c6a43195e4433bc370bf23fac9cc591f01a8898",
    },
    ModelSpec {
        id: "base-q8_0",
        file: "ggml-base-q8_0.bin",
        label: "Base",
        size_bytes: 81_768_585,
        sha256: "c577b9a86e7e048a0b7eada054f4dd79a56bbfa911fbdacf900ac5b567cbb7d9",
    },
    ModelSpec {
        id: "small-q5_1",
        file: "ggml-small-q5_1.bin",
        label: "Small (balanced)",
        size_bytes: 190_085_487,
        sha256: "ae85e4a935d7a567bd102fe55afc16bb595bdb618e11b2fc7591bc08120411bb",
    },
    ModelSpec {
        id: "small-q8_0",
        file: "ggml-small-q8_0.bin",
        label: "Small",
        size_bytes: 264_464_607,
        sha256: "49c8fb02b65e6049d5fa6c04f81f53b867b5ec9540406812c643f177317f779f",
    },
    ModelSpec {
        id: "medium-q5_0",
        file: "ggml-medium-q5_0.bin",
        label: "Medium",
        size_bytes: 539_212_467,
        sha256: "19fea4b380c3a618ec4723c3eef2eb785ffba0d0538cf43f8f235e7b3b34220f",
    },
    ModelSpec {
        id: "medium-q8_0",
        file: "ggml-medium-q8_0.bin",
        label: "Medium (high quality)",
        size_bytes: 823_369_779,
        sha256: "42a1ffcbe4167d224232443396968db4d02d4e8e87e213d3ee2e03095dea6502",
    },
    ModelSpec {
        id: "large-v3-turbo-q5_0",
        file: "ggml-large-v3-turbo-q5_0.bin",
        label: "Large v3 Turbo (best)",
        size_bytes: 574_041_195,
        sha256: "394221709cd5ad1f40c46e6031ca61bce88931e6e088c188294c6d5a55ffa7e2",
    },
];

const BASE_URL: &str = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/";

pub fn find(id: &str) -> Result<&'static ModelSpec, String> {
    MODELS
        .iter()
        .find(|m| m.id == id)
        .ok_or_else(|| format!("We don't know the speech model \"{id}\"."))
}

pub fn url(spec: &ModelSpec) -> String {
    crate::reframe::models::mirrored(&format!("{BASE_URL}{}", spec.file))
}

pub fn model_path(dir: &Path, spec: &ModelSpec) -> PathBuf {
    dir.join(spec.file)
}

fn part_path(dir: &Path, spec: &ModelSpec) -> PathBuf {
    dir.join(format!("{}.part", spec.file))
}

/// Quick presence check: the file exists with the exact expected size.
/// The full hash is checked once, when the download finishes.
pub fn is_present(dir: &Path, spec: &ModelSpec) -> bool {
    std::fs::metadata(model_path(dir, spec)).is_ok_and(|m| m.len() == spec.size_bytes)
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelStatus {
    pub id: &'static str,
    pub label: &'static str,
    pub size_bytes: u64,
    pub present: bool,
    /// Bytes of an unfinished download, so the UI can say "Resume".
    pub partial_bytes: u64,
}

pub fn statuses(dir: &Path) -> Vec<ModelStatus> {
    MODELS
        .iter()
        .map(|m| ModelStatus {
            id: m.id,
            label: m.label,
            size_bytes: m.size_bytes,
            present: is_present(dir, m),
            partial_bytes: std::fs::metadata(part_path(dir, m)).map_or(0, |x| x.len()),
        })
        .collect()
}

pub fn sha256_file(path: &Path) -> Result<String, String> {
    let mut f = File::open(path).map_err(|e| format!("We couldn't open the model file ({e})."))?;
    let mut h = Sha256::new();
    let mut buf = vec![0u8; 1 << 20];
    loop {
        let n = f
            .read(&mut buf)
            .map_err(|e| format!("We couldn't read the model file ({e})."))?;
        if n == 0 {
            break;
        }
        h.update(&buf[..n]);
    }
    Ok(format!("{:x}", h.finalize()))
}

/// Checks a finished download. Returns a plain-language error on mismatch.
pub fn verify(path: &Path, spec: &ModelSpec) -> Result<(), String> {
    let len = std::fs::metadata(path).map(|m| m.len()).unwrap_or(0);
    if len != spec.size_bytes {
        return Err("The speech model download was incomplete. Please try again.".into());
    }
    if sha256_file(path)? != spec.sha256 {
        return Err(
            "The speech model download was damaged, so we removed it. Please try again.".into(),
        );
    }
    Ok(())
}

pub const CANCELLED: &str = "Download paused. Pick it again to carry on where it stopped.";

/// Downloads `spec` into `dir`, resuming a previous `.part` file if there is one.
/// `progress(done, total)` is called as bytes arrive.
pub fn download(
    dir: &Path,
    spec: &ModelSpec,
    cancel: &AtomicBool,
    mut progress: impl FnMut(u64, u64),
) -> Result<PathBuf, String> {
    let dest = model_path(dir, spec);
    if is_present(dir, spec) {
        return Ok(dest);
    }
    std::fs::create_dir_all(dir)
        .map_err(|e| format!("We couldn't create the models folder ({e})."))?;
    let part = part_path(dir, spec);
    let mut have = std::fs::metadata(&part).map_or(0, |m| m.len());
    if have > spec.size_bytes {
        let _ = std::fs::remove_file(&part);
        have = 0;
    }

    if have < spec.size_bytes {
        let mut req = ureq2::get(&url(spec));
        if have > 0 {
            req = req.set("Range", &format!("bytes={have}-"));
        }
        let resp = req.call().map_err(|e| match e {
            ureq2::Error::Status(code, _) => {
                format!("The model server said no (error {code}). Please try again later.")
            }
            ureq2::Error::Transport(_) => {
                "We couldn't reach the internet to download the speech model. Check your connection and try again.".to_string()
            }
        })?;
        // 206 = server honoured the range; anything else restarts from zero.
        let append = have > 0 && resp.status() == 206;
        if !append {
            have = 0;
        }
        let mut out = OpenOptions::new()
            .create(true)
            .write(true)
            .append(append)
            .truncate(!append)
            .open(&part)
            .map_err(|e| format!("We couldn't save the speech model ({e})."))?;
        let mut reader = resp.into_reader();
        let mut buf = vec![0u8; 256 * 1024];
        progress(have, spec.size_bytes);
        loop {
            if cancel.load(Ordering::Relaxed) {
                return Err(CANCELLED.into());
            }
            let n = reader.read(&mut buf).map_err(|_| {
                "The download stopped part-way. Pick the model again to resume.".to_string()
            })?;
            if n == 0 {
                break;
            }
            out.write_all(&buf[..n])
                .map_err(|e| format!("We couldn't save the speech model ({e})."))?;
            have += n as u64;
            progress(have, spec.size_bytes);
        }
        out.flush()
            .map_err(|e| format!("We couldn't save the speech model ({e})."))?;
    }

    if let Err(e) = verify(&part, spec) {
        let _ = std::fs::remove_file(&part);
        return Err(e);
    }
    std::fs::rename(&part, &dest)
        .map_err(|e| format!("We couldn't finish saving the speech model ({e})."))?;
    Ok(dest)
}
