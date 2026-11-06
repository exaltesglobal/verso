//! Tauri commands exposed to the React frontend via `invoke()`.
//! One file per area (media, project, export, ...). Register new commands in `lib.rs`.

pub mod analysis;
pub mod background;
pub mod captions;
pub mod color;
pub mod enhance;
pub mod export;
pub mod media;
pub mod projects;
pub mod reframe;
pub mod sfx;
pub mod thumbnails;
pub mod voice;
pub mod waveform;
