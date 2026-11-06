//! Tauri commands exposed to the React frontend via `invoke()`.
//! One file per area (media, project, export, ...). Register new commands in `lib.rs`.

pub mod captions;
pub mod media;
pub mod thumbnails;
