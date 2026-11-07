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

## Deferred from the spec audit (docs/specs/AUDIT.md)

Each item lists what ships today (the fallback) and what comes later.

- **Audio-master playback clock and preview proxies (audit 8).** Today: the playing `<video>` element drives
  the clock (the timeline clock carries on through gaps and buffering), the preview plays the source file
  scaled by CSS, and the filmstrip gives instant frames while scrubbing (scrub is silent). Later: a Web Audio
  clock as master with video slaved to it, and low-res proxy files for 4K sources.
- **Manual reframe override keyframes (audit 11).** Today: automatic follow / active speaker / split with spring
  smoothing and a dead zone; the user can switch mode or pick the speaker. Later: drag the crop at the playhead
  to add an override keyframe that the planner respects.
- **Roll trim and ripple trim (audit 7).** Today: trims change one clip; ripple delete (Shift+Delete) closes
  gaps. Later: roll (move a shared edit point) and ripple trim (shift everything after).
- **Two-pass loudnorm on the export mix (audit 9).** Today: voice clean-up already normalises the voice to
  -14 LUFS in two passes; the final mix is not normalised. Later: a measuring pass over the mixed audio, then
  `loudnorm` with the measured values in the export graph.
- **Quick content hash for media relinking (audit 6).** Today: `.verso` files store `relPath`, and open relinks
  through it when a file of the same size is there. Later: add a hash of size + mtime + first/last MB for
  stronger matching and a "find missing media" folder search.
- **Face presence in auto-cut scoring (audit 12).** Today: scores use hook words, questions, numbers, speech
  density, filler ratio and audio energy, with reasons shown. Later: feed YuNet face counts from the reframe
  analysis into the score.
- **Hinglish auto-detect (audit 10).** Today: "Detect automatically" lets Whisper pick EN/HI/MR; Hinglish
  (Latin-script Hindi) is chosen manually. Later: detect code-mixing from a first-pass transcript and switch.
- **Bundled Devanagari and serif fonts for burn-in (audit 2).** Today: libass loads only the bundled Manrope;
  Hindi/Marathi glyphs fall back to the system font (Nirmala UI on Windows), and serif title cards export in
  Manrope. Later: bundle Noto Sans Devanagari (OFL) and a static Fraunces TTF in `src-tauri/fonts/` and map the
  serif style to it in `ass.rs`.
- **Third-party notices bundle (audit 1).** Today: licences are listed in Settings, `docs/MODELS.md` and
  `src-tauri/licenses/` (fonts). Later: generate `THIRD-PARTY-NOTICES.txt` (crate and npm licences, ONNX
  Runtime, FFmpeg LGPL text, model MIT/Apache notices) at build time and ship it in `licenses/`.
## Template engine

Done in the template pass: photos in any slot (`Clip.still`), one-click language swap, letterbox picker, slot trimming ("Start at"), per-pack beat-snap tolerances, Min clip hints and the design rules in `src/templates/rules.ts`. A logo sticker is already covered by the brand kit logo. Still to build, in priority order, each with the fallback templates use until then:

- **Slot scale/position keyframes** (Ken Burns, punch, drift). Fallback: static framing plus the existing `push` and punch-in zooms.
- **Audio bus**: ducking under voice, LUFS target, J-cuts, an SFX track. Fallback: fixed music gain per slot, -3 dBFS peak normalise.
- **Shape primitives**: progress bar, gradient band, masks. Fallback: sticker sequences and PNG bands.
- **Background blur fill** behind an inset (Wide Shot Fit). Fallback: gradient or dark plate.
- **Source fps and frame blending** for slow motion. Fallback: manual 0.25x / 0.4x speed toggles.
- **Text stroke, outline, shadow.** Fallback: boxed and outline presets (plates).
- **Per-layer text rotation** and **keyframable text scale.** Fallback: entrance animations only.
- **Halation, bloom and anamorphic streak** (Print Stock). Fallback: warm-film grade plus grain; the existing flare.
- **Safe-zone hard lock** (drag can't enter the zones, right edge included). Fallback: template text is clamped at load and `SafeZoneOverlay` shows the zones.
- **Procedural backdrop generator** (Studio Cut). Fallback: a plain colour plate.
- **Cross-canvas reframe and relayout** (9:16 to 1:1 and 16:9 with text moved). Fallback: smart reframe crops the picture; text keeps its position.
- **Loop-check overlay** (last frame against first). Fallback: the user scrubs the ends.
- **Beat-snapped cuts** using `beatSnapTolerance(template)` when "Cut to the beat" moves slot edges. Fallback: slot times as authored.
- **Devanagari Hindi copy** for every template layer, next to Hinglish and English. Fallback: Hinglish default.
- **Noto Emoji (OFL)** bundled for stickers in preview and export. Fallback: the system emoji font.

## Import a Premiere sequence

- **What:** drag a Premiere/FCP7 XML (xmeml) sequence back into Verso to keep editing.
- **How:** parse the first video track's `clipitem`s (`start`/`end`/`in`/`out`, `rate`, `pathurl`), probe each file with `probe_media`, and rebuild video + linked sound clips through `appendMedia`-style construction. Speed from the Time Remap effect; Basic Motion back to `zoom`/`pos`.
- **Why later:** needs an XML parser in the frontend (DOMParser works in the webview) plus relinking for moved media; the export side (`src/lib/handoff.ts`) covers the main need first.

