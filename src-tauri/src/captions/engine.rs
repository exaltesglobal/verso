//! The speech engine boundary. With the `whisper` feature this is whisper.cpp
//! (via whisper-rs); without it, a stub that explains captions are unavailable,
//! so the rest of the app still builds on machines without CMake.

use std::path::Path;
use std::sync::Arc;
use std::sync::atomic::AtomicBool;

use super::Language;

/// One raw token: UTF-8 bytes (may be part of a character) and start/end
/// seconds relative to the chunk.
pub type RawToken = (Vec<u8>, f64, f64);

pub trait SpeechEngine {
    fn transcribe(
        &mut self,
        pcm: &[f32],
        language: Language,
        on_progress: Box<dyn FnMut(i32)>,
        cancel: Arc<AtomicBool>,
    ) -> Result<Vec<RawToken>, String>;
}

#[cfg(feature = "whisper")]
pub fn load(model: &Path) -> Result<Box<dyn SpeechEngine>, String> {
    whisper_rs::install_logging_hooks(); // keeps whisper.cpp quiet on stderr
    let ctx = whisper_rs::WhisperContext::new_with_params(
        model,
        whisper_rs::WhisperContextParameters::default(),
    )
    .map_err(|e| {
        format!("We couldn't load the captions AI pack ({e}). Try downloading it again.")
    })?;
    Ok(Box::new(Whisper { ctx }))
}

#[cfg(not(feature = "whisper"))]
pub fn load(_model: &Path) -> Result<Box<dyn SpeechEngine>, String> {
    Err("This build of Verso doesn't include the captions engine.".into())
}

#[cfg(feature = "whisper")]
struct Whisper {
    ctx: whisper_rs::WhisperContext,
}

#[cfg(feature = "whisper")]
impl SpeechEngine for Whisper {
    fn transcribe(
        &mut self,
        pcm: &[f32],
        language: Language,
        on_progress: Box<dyn FnMut(i32)>,
        cancel: Arc<AtomicBool>,
    ) -> Result<Vec<RawToken>, String> {
        use std::sync::atomic::Ordering;
        use whisper_rs::{FullParams, SamplingStrategy};

        let mut state = self
            .ctx
            .create_state()
            .map_err(|e| format!("We couldn't start the speech engine ({e})."))?;
        // shortcut: greedy decoding for speed on CPU; switch to BeamSearch{beam_size:5} for "Best" if quality needs it.
        let mut p = FullParams::new(SamplingStrategy::Greedy { best_of: 2 });
        let threads = std::thread::available_parallelism().map_or(4, |n| n.get().min(8));
        p.set_n_threads(threads as i32);
        p.set_language(Some(language.whisper_code()));
        p.set_translate(false);
        p.set_token_timestamps(true);
        p.set_suppress_blank(true);
        p.set_print_progress(false);
        p.set_print_realtime(false);
        p.set_print_special(false);
        p.set_print_timestamps(false);
        if let Some(prompt) = language.prompt() {
            p.set_initial_prompt(prompt);
        }
        p.set_progress_callback_safe(on_progress);
        // whisper-rs 0.16's set_abort_callback_safe casts its boxed closure to the wrong type, so it
        // reads garbage and aborts the encoder (error -6). Point the callback at the flag directly.
        unsafe extern "C" fn should_abort(flag: *mut std::ffi::c_void) -> bool {
            unsafe { (*(flag as *const AtomicBool)).load(Ordering::Relaxed) }
        }
        // SAFETY: `cancel` outlives `state.full` below, and the callback only reads the atomic.
        unsafe {
            p.set_abort_callback(Some(should_abort));
            p.set_abort_callback_user_data(Arc::as_ptr(&cancel) as *mut std::ffi::c_void);
        }

        let result = state.full(p, pcm);
        if cancel.load(Ordering::Relaxed) {
            return Err(super::CANCELLED.into());
        }
        result.map_err(|e| format!("The speech engine stopped unexpectedly ({e})."))?;

        let eot = self.ctx.token_eot();
        let mut tokens = Vec::new();
        for i in 0..state.full_n_segments() {
            let Some(seg) = state.get_segment(i) else {
                continue;
            };
            for t in 0..seg.n_tokens() {
                let Some(tok) = seg.get_token(t) else {
                    continue;
                };
                // Special and timestamp tokens all sit at or above end-of-text.
                if tok.token_id() >= eot {
                    continue;
                }
                let data = tok.token_data();
                let bytes = tok.to_bytes().unwrap_or_default().to_vec();
                // whisper.cpp times are in centiseconds.
                tokens.push((bytes, data.t0 as f64 / 100.0, data.t1 as f64 / 100.0));
            }
        }
        Ok(tokens)
    }
}
