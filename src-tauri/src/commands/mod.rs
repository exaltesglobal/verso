//! Tauri commands exposed to the React frontend via `invoke()`.
//! One file per area (media, project, export, ...). Register new commands in `lib.rs`.

pub mod analysis;
pub mod export;
pub mod captions;
pub mod media;
pub mod projects;
pub mod reframe;
pub mod thumbnails;
pub mod waveform;
