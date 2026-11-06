# Verso: later tier (plan only)

These are planned but not built yet. Everything stays on-device and permissively licensed, like the rest of Verso.

## Multicam sync

- **What:** drop in 2–4 camera angles of the same podcast; Verso lines them up and cuts between them.
- **How:** align by audio. Cross-correlate short loudness envelopes (from the existing `media_waveform` peaks) and refine with a full-rate cross-correlation over the best window (FFT via the `rustfft` crate we already ship). Store per-angle offsets on a new `MultiClip { angles: [{ source, offset }] }`.
- **Cutting:** reuse reframe's speaker timeline: switch to the angle where the active speaker's face is largest, with the same minimum hold and hysteresis as "Switch to whoever's talking".
- **UI:** "Add angles" on a video clip; an angle strip in the inspector; manual angle switch at the playhead (keys 1–4).
- **Export:** angle switches become ordinary cuts in the existing graph.

## Screen recording

- **What:** record the screen, a window or a region with mic and optional webcam bubble, straight into a project.
- **How (Windows):** FFmpeg `ddagrab` (Desktop Duplication, in the LGPL build) with hardware encode (`h264_nvenc`/`h264_mf`); mic via `dshow`/WASAPI. **Mac:** ScreenCaptureKit through a small Swift helper (sidecar), since FFmpeg's `avfoundation` screen capture is limited.
- **Extras:** auto-zoom to the cursor on clicks (log cursor positions during recording; turn them into `zoomKeys`), click highlights, hide desktop icons.

## Generative media integrations

- **Principle:** on-device first. Local options (e.g. image models through ComfyUI on the same PC) are opt-in, run in a separate process, and are never required.
- **Planned:** AI B-roll suggestions from the transcript (search the user's own library by caption keywords and CLIP-style embeddings computed locally), background/scene images for the background-replace feature, thumbnail drafts.
- **Licence rule:** only models whose weights allow commercial use; the model card and licence are recorded in `docs/AI-MODELS.md` before shipping.

## Mac-native release

- **Build:** the GitHub Actions workflow already builds `aarch64` and `x86_64` macOS bundles. Missing pieces:
  - LGPL FFmpeg for macOS (build with `--disable-gpl`, `--enable-videotoolbox`, `--enable-libass`, `--enable-libvpx`), published as a release asset the build downloads with a checksum.
  - whisper.cpp with Metal (`metal` cargo feature), ONNX Runtime with CoreML (`coreml` feature).
  - Apple Developer ID signing and notarization (secrets listed in `docs/RELEASE.md`).
- **Polish:** native traffic-light window controls (keep `decorations: false` on Windows only; on macOS use `titleBarStyle: Overlay`), Mac shortcuts (⌘ instead of Ctrl in labels), VideoToolbox export.
