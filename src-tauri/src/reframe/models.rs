//! Reframe model manager. Models are never in git: they are downloaded once from
//! pinned URLs, verified with SHA-256, and kept in `<app data>/models/reframe/`.
//! See docs/AI-MODELS.md for licences.

use std::io::{Read, Write};
use std::path::{Path, PathBuf};

use serde::Serialize;
use sha2::{Digest, Sha256};

pub struct ModelSpec {
    pub id: &'static str,
    pub name: &'static str,
    pub purpose: &'static str,
    pub file: &'static str,
    pub url: &'static str,
    pub sha256: &'static str,
    pub size_bytes: u64,
    pub licence: &'static str,
    /// Needed before "Find speakers" can run at all.
    pub required: bool,
}

pub const YUNET: &str = "face_yunet";
pub const SILERO: &str = "vad_silero";
pub const SFACE: &str = "face_sface";

pub const MODELS: &[ModelSpec] = &[
    ModelSpec {
        id: YUNET,
        name: "Face finder",
        purpose: "Finds faces in each frame",
        file: "face_detection_yunet_2023mar.onnx",
        url: "https://github.com/opencv/opencv_zoo/raw/48b10fa505aeb51fbd127fc60a5c660040e823b7/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
        sha256: "8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4",
        size_bytes: 232_589,
        licence: "MIT",
        required: true,
    },
    ModelSpec {
        id: SILERO,
        name: "Voice finder",
        purpose: "Hears when someone is talking",
        file: "silero_vad_v5.1.2.onnx",
        url: "https://github.com/snakers4/silero-vad/raw/v5.1.2/src/silero_vad/data/silero_vad.onnx",
        sha256: "2623a2953f6ff3d2c1e61740c6cdb7168133479b267dfef114a4a3cc5bdd788f",
        size_bytes: 2_327_524,
        licence: "MIT",
        required: true,
    },
    ModelSpec {
        id: SFACE,
        name: "Face matcher",
        purpose: "Recognises the same person after a camera cut",
        file: "face_recognition_sface_2021dec.onnx",
        url: "https://github.com/opencv/opencv_zoo/raw/48b10fa505aeb51fbd127fc60a5c660040e823b7/models/face_recognition_sface/face_recognition_sface_2021dec.onnx",
        sha256: "0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79",
        size_bytes: 38_696_353,
        licence: "Apache-2.0",
        required: false,
    },
];

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelStatus {
    pub id: String,
    pub name: String,
    pub purpose: String,
    pub size_bytes: u64,
    pub licence: String,
    pub required: bool,
    pub installed: bool,
}

pub fn spec(id: &str) -> Result<&'static ModelSpec, String> {
    MODELS
        .iter()
        .find(|m| m.id == id)
        .ok_or_else(|| format!("We don't know the model \"{id}\"."))
}

/// Path of an installed model, if present.
pub fn installed(dir: &Path, id: &str) -> Option<PathBuf> {
    let p = dir.join(spec(id).ok()?.file);
    p.is_file().then_some(p)
}

pub fn status(dir: &Path) -> Vec<ModelStatus> {
    MODELS
        .iter()
        .map(|m| ModelStatus {
            id: m.id.into(),
            name: m.name.into(),
            purpose: m.purpose.into(),
            size_bytes: m.size_bytes,
            licence: m.licence.into(),
            required: m.required,
            installed: dir.join(m.file).is_file(),
        })
        .collect()
}

/// Download, verify and install one model. `progress` gets 0..=100.
pub fn download(dir: &Path, id: &str, mut progress: impl FnMut(f64)) -> Result<PathBuf, String> {
    let m = spec(id)?;
    let dest = dir.join(m.file);
    if dest.is_file() {
        return Ok(dest);
    }
    std::fs::create_dir_all(dir)
        .map_err(|e| format!("We couldn't create the models folder ({e})."))?;
    let part = dest.with_extension("part");

    let resp = ureq::get(m.url).call().map_err(|e| {
        format!(
            "We couldn't download the {} ({e}). Check your internet connection and try again.",
            m.name.to_lowercase()
        )
    })?;
    let mut body = resp.into_body();
    let mut reader = body.as_reader();
    let mut file =
        std::fs::File::create(&part).map_err(|e| format!("We couldn't save the model ({e})."))?;
    let mut hasher = Sha256::new();
    let mut buf = vec![0u8; 64 * 1024];
    let mut done: u64 = 0;
    let mut last_pct = -1.0;
    loop {
        let n = reader
            .read(&mut buf)
            .map_err(|e| format!("The download stopped ({e}). Please try again."))?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
        file.write_all(&buf[..n])
            .map_err(|e| format!("We couldn't save the model ({e})."))?;
        done += n as u64;
        let pct = (done as f64 / m.size_bytes as f64 * 100.0)
            .min(100.0)
            .floor();
        if pct > last_pct {
            last_pct = pct;
            progress(pct);
        }
    }
    drop(file);
    let hash = format!("{:x}", hasher.finalize());
    if hash != m.sha256 {
        let _ = std::fs::remove_file(&part);
        return Err(format!(
            "The {} we downloaded doesn't match what we expected, so we didn't use it. Please try again.",
            m.name.to_lowercase()
        ));
    }
    std::fs::rename(&part, &dest).map_err(|e| format!("We couldn't install the model ({e})."))?;
    Ok(dest)
}
