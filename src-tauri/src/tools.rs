//! Locates the FFmpeg tools.
//!
//! Release builds ship `ffmpeg` and `ffprobe` as Tauri sidecars (LGPL build,
//! see scripts/fetch-ffmpeg.mjs). Tauri copies sidecars next to the app
//! executable without the target-triple suffix, so we look there first and fall
//! back to PATH for development machines that haven't fetched the sidecars.

use std::path::PathBuf;
use std::process::Command;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Tool {
    Ffmpeg,
    Ffprobe,
}

impl Tool {
    fn stem(self) -> &'static str {
        match self {
            Tool::Ffmpeg => "ffmpeg",
            Tool::Ffprobe => "ffprobe",
        }
    }
}

/// Path of the bundled sidecar, if present.
///
/// Installed app: next to the executable (Tauri strips the triple suffix).
/// Debug builds (`pnpm tauri dev`): also `src-tauri/binaries/<tool>-<triple>`,
/// so development uses the same LGPL build users get.
pub fn sidecar_path(tool: Tool) -> Option<PathBuf> {
    let exe = std::env::consts::EXE_SUFFIX;
    if let Some(dir) = std::env::current_exe()
        .ok()
        .and_then(|p| p.parent().map(PathBuf::from))
    {
        let candidate = dir.join(format!("{}{exe}", tool.stem()));
        if candidate.is_file() {
            return Some(candidate);
        }
    }
    #[cfg(debug_assertions)]
    {
        let candidate = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("binaries")
            .join(format!(
                "{}-{}{exe}",
                tool.stem(),
                env!("VERSO_TARGET_TRIPLE")
            ));
        if candidate.is_file() {
            return Some(candidate);
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Holds once `pnpm fetch:ffmpeg` has run; skips silently otherwise.
    #[test]
    fn prefers_bundled_sidecar_when_fetched() {
        let fetched = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("binaries")
            .join(format!(
                "ffprobe-{}{}",
                env!("VERSO_TARGET_TRIPLE"),
                std::env::consts::EXE_SUFFIX
            ));
        if fetched.is_file() {
            assert_eq!(resolve(Tool::Ffprobe), fetched);
        }
    }
}

/// Where the tool will be run from. Used by the About/diagnostics UI later.
pub fn resolve(tool: Tool) -> PathBuf {
    sidecar_path(tool).unwrap_or_else(|| PathBuf::from(tool.stem()))
}

/// A `Command` for the tool that never flashes a console window on Windows.
pub fn command(tool: Tool) -> Command {
    #[allow(unused_mut)]
    let mut cmd = Command::new(resolve(tool));
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    cmd
}

/// Plain-language message when the tool can't be started.
pub fn missing_message() -> String {
    "Verso needs FFmpeg to read videos, and we couldn't find it. Reinstalling Verso usually fixes this."
        .to_string()
}
