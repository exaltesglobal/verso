//! Speech audio for Whisper: 16 kHz mono 32-bit float PCM, streamed from the
//! FFmpeg sidecar's stdout (no temp WAV file).

use std::ffi::OsString;
use std::io::{ErrorKind, Read};
use std::path::Path;
use std::process::{Child, ChildStdout, Stdio};

use crate::tools::{self, Tool};

pub const SAMPLE_RATE: usize = 16_000;

pub fn pcm_args(src: &Path, in_point: f64, out_point: f64) -> Vec<OsString> {
    let mut a: Vec<OsString> = ["-hide_banner", "-loglevel", "error", "-nostdin", "-ss"]
        .map(OsString::from)
        .to_vec();
    a.push(format!("{:.3}", in_point.max(0.0)).into());
    a.push("-i".into());
    a.push(src.as_os_str().to_owned());
    if out_point > in_point {
        a.push("-t".into());
        a.push(format!("{:.3}", out_point - in_point).into());
    }
    for s in [
        "-vn", "-sn", "-dn", "-ac", "1", "-ar", "16000", "-f", "f32le", "pipe:1",
    ] {
        a.push(s.into());
    }
    a
}

pub struct PcmStream {
    child: Child,
    stdout: ChildStdout,
}

impl PcmStream {
    pub fn open(src: &Path, in_point: f64, out_point: f64) -> Result<Self, String> {
        if !src.is_file() {
            return Err("We couldn't find that file. It may have been moved or deleted.".into());
        }
        let mut child = tools::command(Tool::Ffmpeg)
            .args(pcm_args(src, in_point, out_point))
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|e| match e.kind() {
                ErrorKind::NotFound => tools::missing_message(),
                _ => format!("We couldn't start reading the sound ({e})."),
            })?;
        let stdout = child.stdout.take().expect("piped stdout");
        Ok(Self { child, stdout })
    }

    /// Next block of up to `max` samples; empty at the end of the audio.
    pub fn next_chunk(&mut self, max: usize) -> Result<Vec<f32>, String> {
        let mut bytes = vec![0u8; max * 4];
        let mut filled = 0;
        while filled < bytes.len() {
            match self.stdout.read(&mut bytes[filled..]) {
                Ok(0) => break,
                Ok(n) => filled += n,
                Err(e) if e.kind() == ErrorKind::Interrupted => {}
                Err(e) => return Err(format!("We couldn't read the sound ({e}).")),
            }
        }
        bytes.truncate(filled - filled % 4);
        Ok(bytes
            .as_chunks::<4>()
            .0
            .iter()
            .map(|b| f32::from_le_bytes(*b))
            .collect())
    }
}

impl Drop for PcmStream {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}
