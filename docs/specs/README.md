# Verso implementation specs: index

Verso is a reels-first desktop video editor by Agape Labs (legal entity Exaltes Global Pvt. Ltd.): Tauri 2, Rust backend, React/TypeScript UI, FFmpeg 9 LGPL as a sidecar, Windows first then macOS. Everything runs on-device and offline except accounts and payments. These seven specs were written independently, then reconciled on 2026-11-06; the contradictions found and the decisions taken are recorded in "Shared architecture decisions" below so nobody re-litigates them by accident. Test plans are written in every spec; they are **run only when the owner says so**.

Read in this order: editing model → export → the feature spec you are implementing → accounts.

## The specs

**[editing-model-and-project-format.md](editing-model-and-project-format.md)** — the source of truth for the saved project. Integer-microsecond `Us` times, `Fraction` frame rate snapped from the first import's `avg_frame_rate`, UUID ids, a normalised v2 `Project` (`media`, `tracks`, `clips`, `captions[]`, `transitions`, `markers`, `audio`, `analyses`, `template`), the `Command`/`invert()` history with coalescing, one ripple rule, the `.verso` ZIP container with Rust-side posters, atomic save with Windows rename retry, autosave and crash recovery, media relink (`resolve_media`, `sha1Head` fingerprint), and the release pipeline (updater, NSIS, LGPL CI gate, opt-in crash reporting via Sentry SDK + self-hosted GlitchTip). Every other spec adds optional fields **here** rather than inventing its own.

**[export-and-render-pipeline.md](export-and-render-pipeline.md)** — the source of truth for FFmpeg facts and the one filtergraph compiler. `buildRenderGraph` → `compileFilterGraph` (`-filter_complex_script`, `-ss/-to` input seeking, per-segment `fps/settb`, HDR tone-map with `zscale`, transitions as symmetric handles with freeze fallback, `yuv444p` into xfade), parallel audio lanes with roles, ducking and two-pass `loudnorm` to −14 LUFS, `encoder_capabilities` smoke-tested encoder chain (NVENC → QSV → AMF → MF → `libopenh264`), platform presets by project aspect, chunking, verification (`elst` walker), the `.part`-then-rename job in `export.rs`, the real-time preview engine (`src/lib/player/`, `<video>` pool + canvas path) and the proxy pipeline (`media_proxy`).

**[speaker-detection-and-reframe.md](speaker-detection-and-reframe.md)** — landscape talking video to 9:16/1:1 with follow / who's-talking / split modes. ONNX Runtime via `ort` (DirectML → CPU): YuNet faces, ByteTrack-style tracker, Silero VAD, pyannote segmentation-3.0, TitaNet embeddings, LR-ASD audio-visual matching with a mouth-motion fallback, one clustering pass per file, a pure `reframe_solve` that works from a compact `AnalysisSummary` stored in the project (no cache dependency), one-euro smoothing, and the `sendcmd` + `crop@label` export fragment the compiler inserts per segment.

**[auto-clips-and-one-click-edits.md](auto-clips-and-one-click-edits.md)** — long video in, ranked reel candidates out, plus the one-click chain. Per-stage analysis cache (VAD, energy, `ebur128`, `scdet`, onsets/beats on `rustfft`, optional transcript), heuristic highlight scoring with optional local LLM re-ranking (`llama-server` + Qwen3), boundary snapping, silence/filler removal gated by transcript quality (never auto-cuts Hindi content words), punch-ins as crop keyframes, beat sync, measured audio auto-enhance, and "Make all N reels" writing sibling `.verso` files. Split into 3a (no transcript) and 3b (needs the captions spec's whisper plumbing).

**[captions-pipeline.md](captions-pipeline.md)** — offline captions with whisper.cpp sidecars (Vulkan/CPU bundled, optional CUDA pack), model download with resume and checksums, two-pass tiny-model language detection, Hindi/Marathi/Hinglish/English handling with a rule-based Devanagari→Roman transliterator (`shlesha` + schwa deletion + exceptions), hallucination filter, chunked jobs, source-time word storage bound to clips (`timelineRange`), aspect-aware line layout, five original caption styles, and rendering through the shared `OverlayRenderer` into the export's captions lane (no libass).

**[templates-and-one-click-reels.md](templates-and-one-click-reels.md)** — JSON template packs (signed `.versopack`, sha256 per file, ed25519), `applyTemplate` producing editing-model commands (long-file split, moments hook, one-drag swap, retarget), the bundled OFL font set, the `OverlayRenderer` (text auto-fit with `Intl.Segmenter`, shapes, stickers, masks, captions) used by both preview and export, `transitionAt` for the five transitions, the CC0/own-produced music library, and the design brief for the first twelve original templates.

**[accounts-and-payments-backend.md](accounts-and-payments-backend.md)** — the only online part: Fastify 5 + MariaDB on Hostinger (stateless, 120 s request cap, cron via HTTP), email/password and Google sign-in through PKCE + loopback, Ed25519 licence tokens verified in Rust with clock-offset handling and 14-day offline grace, 3-device limit, Razorpay subscriptions with idempotent ordered webhooks and dunning, GST invoices as frozen snapshots, DPDP obligations, and the `account_state` command every other spec reads for entitlements.

## Shared architecture decisions

These were contradictions between specs; each line is now the rule everywhere.

1. **Project model**: editing-model §1.2 is the only definition. Times are integer `Us`; seconds appear only in FFmpeg arguments, Rust solvers and template JSON, converted at the boundary. Keyframes are clip-relative `{ atUs, value, ease }` with `Ease = linear | hold | easeOut | easeInOut` (no `spring`). `AspectRatio` is `9:16 | 1:1 | 16:9` (no 4:5 until the union grows). Fields other specs needed were added there: `MediaClip.role/fadeInUs/fadeOutUs/enhance/reframe/maskClipId`, `ClipBase.opacity/slotId/sceneId`, `TextClip.style/template/animation`, `ShapeClip`, `StickerClip`, `overlay` tracks, `Project.audio/analyses/template`, `MediaRef.analysisKey`.
2. **Captions**: words in source time bound to a `clipId` (`sourceStartUs/EndUs`), timeline time derived; `Project.captions: CaptionTrackData[]` (primary + optional translation). The ripple rule never touches them. The earlier `CaptionCue` list and the export spec's `Clip.caption` are gone.
3. **Transitions**: a `Transition` record between **adjacent** clips, kinds `crossfade | dip-black | slide | wipe | zoom` (+ `direction`), `cut` = no record. Timeline positions never move; the renderer extends into source handles and freezes edge frames where none exist. The templates' overlap model (`transitionOut`, clips starting at `A.end − d`) is gone. xfade inputs are `yuv444p` (verified in `vf_xfade.c`; it has no 4:2:0 path), one `format=yuv420p` at the end.
4. **One text engine**: the `OverlayRenderer` (Canvas, templates §9.3) draws text, shapes, stickers, masks and captions in preview and into the export's PNG overlay lanes. No `drawtext`, no libass burn-in (libass stays in the FFmpeg build, unused). `.srt` is the only subtitle file.
5. **One filtergraph compiler**: `src/lib/render/compile.ts` (export spec). Templates contribute three composition rules (scene background, masks, in-scene overlays before xfade); reframe contributes a `sendcmd` fragment via a TS port of its Rust writer, checked against shared fixtures; auto-clips' size-changing crop compiles to `scale=…:eval=frame` + fixed crop because `crop` cannot animate `w/h`.
6. **One preview engine**: `src/lib/player/` (export §5.2). Reframe's `cropAt`, templates' `transitionAt` and `OverlayRenderer`, and captions' `layoutLine` plug into it; nobody else owns `<video>` elements.
7. **One encoder/hwaccel probe**: `encoder_capabilities` (export §3.8, cached per launch). `ml_capabilities` reports only the ML provider. Analysis pipelines use `-hwaccel d3d11va` only when `hwDecode` is true and may retry without it; export never retries mid-job.
8. **One proxy pipeline**: `media_proxy` (export §5.1): 720p-height, source aspect kept, gated by `needsProxy`. Nothing pads a proxy to the canvas.
9. **One fingerprint, one cache key**: `MediaRef.sha1Head` (+ size, mtime) for relink/preflight via `resolve_media`/`media_fingerprint`; `thumbnails.rs::cache_key(path, stage)` for proxies, filmstrips, analysis. `quick_hash`/xxh3 and `relink_media` are gone.
10. **Audio**: ducking and loudness parameters live only in export §3.6 (two-pass `loudnorm`; single-pass is never used because it ignores `linear=true`). Every lane carries 10 ms `afade` in/out. `enhance` chains insert per lane.
11. **Job directory**: `app_cache_dir()/exports/{jobId}/` for scripts, PNGs, `.cmd` files, logs; everything else under `app_cache_dir()/{stt,analysis,reframe,proxies,filmstrips,envelopes}`; downloaded models and packs under `app_data_dir()/{models,packs}`; autosaves under `app_data_dir()/autosave/`.
12. **Asset protocol scope**: static `$APPCACHE/**`, `$APPDATA/packs/**`, `$RESOURCE/**`; user media is allowed per file at import and relink (`allow_file`), never by wildcard.
13. **Processes**: `tools::command()` (std `Command`, `CREATE_NO_WINDOW | BELOW_NORMAL_PRIORITY_CLASS`) wrapped in tokio for async readers; no `tauri-plugin-shell`. Progress goes over `tauri::ipc::Channel<T>` when one caller consumes it, over `app.emit` with a `jobId` filter when several UI parts listen (export, captions, analysis).
14. **Entitlements**: Free = all editing features (captions and reframe included), 1080p with Verso end-card, 3 auto-cut runs/day, free templates and music. Pro = `auto_cut_unlimited | templates_premium | export_4k | no_endcard`. The one command is `account_state`; `license_state` never existed. Unconfigured backend → Free, no network call, no dialog.
15. **FFmpeg build**: BtbN `lgpl` variant of FFmpeg 9 (LGPL v3 because of `--enable-version3`); contains `libopenh264`, `libvpx`, `libaom`, `libsvtav1`, `zimg`, `libplacebo` (win), `libass` (unused), hardware encoder wrappers; no x264/x265/GPL. CI gate: `ffmpeg -L` prints LGPL, `-encoders` lists no `libx26*` and does list `h264_nvenc h264_qsv h264_amf libopenh264`. HEVC export is hardware-only.
16. **ML runtime**: `ort = "=2.0.0-rc.15"` with `load-dynamic`; one vendored copy of `onnxruntime.dll` + `DirectML.dll` (`scripts/fetch-ort.mjs`) shared by reframe and auto-clips. Silero VAD ships twice on purpose: ggml for whisper.cpp's `--vad`, ONNX for in-process use.
17. **Manifests**: `src-tauri/resources/models.json` = things downloaded at runtime (whisper models, Hinglish model, LLM GGUFs, CUDA pack), hashes computed by `scripts/pin-models.mjs`; `models/MANIFEST.json` = ONNX models bundled at build time, with the SHA-256 of each licence text pinned.
18. **Tooling to add**: `vitest`, `fast-check`, `zod`, `playwright` (none exist today); package manager is `pnpm`.
19. **Open owner decisions** (not engineering): DirectML redistribution terms sign-off; NVIDIA CUDA EULA Attachment A for the CUDA pack; H.264/HEVC patent-pool position and the fact that from-source OpenH264 is not covered by Cisco; analytics (Aptabase server is AGPL, deferred); the public hostnames (`verso.app` vs `agapelabs.in` appear in different specs; pick one before the updater endpoint and account `PUBLIC_URL` are baked in); CA sign-off on GST place-of-supply.

## Licence register

Every third-party component any spec ships or links. "Shipped" = inside the installer or a download we serve; "server" = runs on our backend only; "dev" = build/test only. Model licences are the weights' licence; training-data notes are in the owning spec.

| Component | Role | Licence | Shipped? | Verified at |
| --- | --- | --- | --- | --- |
| FFmpeg 9 (BtbN `lgpl` build) | sidecar | LGPL v3 (`--enable-version3`) | shipped sidecar | https://raw.githubusercontent.com/BtbN/FFmpeg-Builds/master/variants/defaults-lgpl.sh |
| OpenH264 (`libopenh264`) | CPU H.264 fallback | BSD-2-Clause; Cisco patent cover does **not** apply to source builds | shipped (in FFmpeg) | https://github.com/cisco/openh264/blob/master/LICENSE , https://www.openh264.org/faq.html |
| libvpx, libaom, SVT-AV1 | VP9/AV1 encoders | BSD-3 / BSD-2 / BSD-3-Clause-Clear | shipped (in FFmpeg) | https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/configure |
| zimg | HDR tone-map (`zscale`) | WTFPL | shipped (in FFmpeg) | https://raw.githubusercontent.com/BtbN/FFmpeg-Builds/master/scripts.d/50-zimg.sh |
| libplacebo | alternative tone-map | LGPL-2.1 | shipped (in FFmpeg, win) | https://raw.githubusercontent.com/BtbN/FFmpeg-Builds/master/scripts.d/50-libplacebo.sh |
| libass, freetype, harfbuzz, fribidi | present in build, unused | ISC / FTL / MIT / LGPL-2.1 | shipped (in FFmpeg) | https://github.com/BtbN/FFmpeg-Builds/blob/master/scripts.d/50-libass.sh |
| NVENC / QSV (libvpl) / AMF / Media Foundation wrappers | hardware encoders | header-only SDKs (MIT/BSD), MF is an inbox Windows component | shipped (in FFmpeg) | https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/configure |
| whisper.cpp v1.9.5 (`whisper-cli`) | STT sidecar | MIT | shipped (Vulkan, CPU) + CUDA pack download | https://github.com/ggml-org/whisper.cpp/releases/expanded_assets/v1.9.5 |
| Whisper ggml models (large-v3-turbo-q5_0, small-q8_0, tiny-q5_1) | STT models | MIT | tiny bundled; others downloaded | https://huggingface.co/ggerganov/whisper.cpp , https://huggingface.co/openai/whisper-large-v3-turbo |
| Silero VAD v5.1.2 (ggml + ONNX) | voice activity | MIT (LICENSE file governs; README badge alt-text is wrong) | shipped | https://raw.githubusercontent.com/snakers4/silero-vad/master/LICENSE , https://huggingface.co/ggml-org/whisper-vad |
| Oriserve/Whisper-Hindi2Hinglish-Prime | Hinglish STT (optional) | Apache-2.0; training data proprietary, no restriction stated | download, opt-in | https://huggingface.co/Oriserve/Whisper-Hindi2Hinglish-Prime |
| Trelis/whisper-hinglish-preview | Hinglish alternative | Apache-2.0 (check Vaani dataset terms first) | not shipped | https://huggingface.co/Trelis/whisper-hinglish-preview |
| shlesha 0.5.7 | transliteration | MIT | shipped (Rust) | https://docs.rs/crate/shlesha/latest |
| CUDA runtime, cuBLAS, cuBLASLt 12.x DLLs | CUDA pack | NVIDIA CUDA EULA Attachment A (legal to confirm) | download, opt-in | https://docs.nvidia.com/cuda/eula/index.html |
| llama.cpp (`llama-server`) | LLM runtime | MIT | download (with CUDA pack / Vulkan / CPU) | https://github.com/ggml-org/llama.cpp |
| Qwen3-1.7B-Q4_K_M, Qwen3-1.7B-Q8_0, Qwen3-4B-Q4_K_M (GGUF) | highlight re-ranking | Apache-2.0 | download, opt-in | https://huggingface.co/unsloth/Qwen3-1.7B-GGUF , https://huggingface.co/Qwen/Qwen3-4B-GGUF/tree/main |
| Phi-4-mini-instruct, SmolLM3-3B | LLM alternatives | MIT / Apache-2.0 | not shipped | https://huggingface.co/microsoft/Phi-4-mini-instruct , https://huggingface.co/HuggingFaceTB/SmolLM3-3B |
| `ort` 2.0.0-rc.15 | ONNX Runtime bindings | MIT OR Apache-2.0 | shipped (Rust) | https://crates.io/api/v1/crates/ort |
| ONNX Runtime 1.x (`onnxruntime.dll`) | ML runtime | MIT | shipped | https://github.com/microsoft/onnxruntime/blob/main/LICENSE |
| DirectML.dll (Microsoft.AI.DirectML) | GPU execution provider | **Proprietary** Microsoft terms; redistribution inside Windows apps permitted, legal sign-off required; else CPU-only | shipped pending sign-off | https://www.nuget.org/packages/Microsoft.AI.DirectML/1.15.4/License |
| YuNet 2026may / 2023mar | face detection | MIT | shipped | https://raw.githubusercontent.com/opencv/opencv_zoo/main/models/face_detection_yunet/README.md |
| pyannote segmentation-3.0 (int8 ONNX via sherpa-onnx export) | speaker segmentation | MIT (gated repo = access step) | shipped | https://huggingface.co/pyannote/segmentation-3.0 |
| NVIDIA TitaNet-large (ONNX) | speaker embeddings | CC-BY-4.0 (attribution in About) | shipped | https://huggingface.co/nvidia/speakerverification_en_titanet_large |
| 3D-Speaker ERes2Net | embedding alternative | **unverified** weight licence; do not ship | not shipped | https://github.com/modelscope/3D-Speaker |
| LR-ASD (our ONNX export) | active speaker | MIT; trained on AVA-ActiveSpeaker (flag to legal) | shipped | https://raw.githubusercontent.com/Junhua-Liao/LR-ASD/main/LICENSE |
| TalkNet-ASD | ASD alternative | MIT | not shipped | https://github.com/TaoRuijie/TalkNet-ASD |
| rustfft 6.4.1 | onsets/beats | MIT OR Apache-2.0 | shipped (Rust) | https://docs.rs/rustfft |
| `zip` 9.4.1 | `.verso`, `.versopack` | MIT | shipped (Rust) | https://crates.io/api/v1/crates/zip |
| `sha1`, `sha2`, `reqwest` + `rustls`, `semver` 1.0.28, `proptest` 1.12.0 (dev) | fingerprints, downloads, versions, tests | MIT OR Apache-2.0 | shipped / dev | crates.io |
| `ed25519-dalek` 3.0.0 | pack and licence signatures | BSD-3-Clause | shipped (Rust) | https://crates.io/api/v1/crates/ed25519-dalek |
| `keyring` 4.2.0 | refresh token storage | MIT OR Apache-2.0 | shipped (Rust) | https://docs.rs/keyring/latest/keyring/ |
| Tauri 2 plugins: store, updater, process, dialog, opener, deep-link 2.6.3, single-instance 2.5.5 | app plumbing | Apache-2.0 OR MIT | shipped | https://github.com/tauri-apps/plugins-workspace |
| `sentry` 0.49.5 (minidump feature), `@sentry/browser` 11.11.0 | opt-in crash reports | MIT | shipped | https://crates.io/api/v1/crates/sentry-minidump , https://github.com/getsentry/sentry-javascript/blob/develop/LICENSE |
| `tauri-plugin-sentry` 0.9.0 | optional transport | MIT OR Apache-2.0 (verify licence files in tarball) | optional | https://crates.io/api/v1/crates/tauri-plugin-sentry |
| GlitchTip | crash-report server | MIT | server | https://gitlab.com/glitchtip/glitchtip-backend |
| `tauri-plugin-aptabase` / Aptabase server | analytics | MIT / **AGPL-3.0** server | deferred, owner decision | https://github.com/aptabase/aptabase |
| Fonts: Manrope, Inter, Hind, Mukta, Baloo 2 / Thambi 2 / Bhai 2 / Da 2, Noto Sans Devanagari, Poppins | UI, titles, captions | SIL OFL 1.1 (ship OFL.txt + copyright lines; confirm Manrope's OFL.txt in the bundled copy) | shipped | https://github.com/googlefonts/manrope , https://github.com/rsms/inter , https://github.com/EkType/Mukta , https://github.com/EkType/Baloo2 , https://raw.githubusercontent.com/notofonts/devanagari/main/OFL.txt , https://github.com/itfoundry/Poppins , https://fontsource.org/fonts/hind/about |
| Music beds (10, own-produced) | template music | work-for-hire to Exaltes Global Pvt. Ltd. | shipped | `licenses/AUDIO.csv` |
| Kenney SFX, Freesound CC0 sounds | template SFX | CC0 | shipped | https://kenney.nl/assets , https://freesound.org/help/faq/ |
| `ajv` 8.20.0, `ts-json-schema-generator` 2.9.0 (dev), `zod`, `@tanstack/react-virtual`, `fast-check` 4.10.2 (dev), `vitest` (dev) | schema, UI, tests | MIT | shipped / dev | https://ajv.js.org/json-schema.html , https://github.com/dubzzz/fast-check/blob/main/LICENSE |
| Playwright (dev) | E2E tests | Apache-2.0 | dev | https://github.com/microsoft/playwright |
| `httpmock` (dev, Rust) | download tests | MIT | dev | crates.io |
| `cargo-about` 0.9.3, `license-checker-rseidelsohn` 5.0.1 | licence page generation | MIT OR Apache-2.0 / BSD-3-Clause | dev | crates.io, npm |
| Server: `fastify` 5.12.8, `fastify-raw-body` 6.0.3, `@fastify/helmet` 13.2.0, `@fastify/cookie` 11.1.5, `kysely` 0.29, `mysql2` 3.24, `jose` 6, `resend` 6.37, `@node-rs/argon2` 2.2.2, `razorpay` 2.9.8, `@zxcvbn-ts/core` 4.2.0, `pdfkit` 0.20.2 | accounts backend | MIT | server | registry.npmjs.org/<pkg>/latest |
| `google-auth-library` 11.3.3 | Google sign-in (server side) | Apache-2.0 | server | registry.npmjs.org |
| MariaDB 11.x | database | GPL-2.0 server software operated by Hostinger; nothing GPL ships to users | server (hosted) | https://www.hostinger.com/support/how-to-check-your-database-version-in-phpmyadmin-at-hostinger/ |
| Razorpay Checkout (`checkout.js`) | payments | Razorpay terms; loaded only on our hosted checkout page | server page | https://razorpay.com/docs/payments/subscriptions/integration-guide/ |
| **Excluded** | | InsightFace (non-commercial), Ultralytics YOLO (AGPL), aubio (GPL), Essentia (AGPL), libx264/libx265/fdk-aac, Qwen2.5-3B (`qwen-research`), Llama 3.x, Gemma, Pixabay audio, YouTube Audio Library, anything CC-BY-NC | | owning specs |

## Recommended build order (Phases 3–5)

Dependencies run strictly downward; items in the same step can be built in parallel by different engineers. "EM n" = editing-model checklist item n, "EX n" = export, "RF" = reframe, "AC" = auto-clips, "CP" = captions, "TP" = templates, "AP" = accounts.

**Phase 3 — foundation, reframe, auto-cut without transcript**

1. EM 1–3: v2 types, `avg_frame_rate: Fraction` in `media.rs`, frame maths, `validate`, ops with `invert()`, ripple rule, fast-check laws. Everything else imports these types. Add `vitest`, `fast-check`, `zod` now (TP 0).
2. EM 4–5 (history, reducer, timeline interactions) ‖ EX 1 (extended `MediaInfo`, `elst` walker) ‖ RF 1–3 (legal sign-offs, `ort` + vendored ORT/DirectML, model fetch + MANIFEST) ‖ AC 1 (analysis cache, VAD, energy, `scdet`, `ebur128`; needs the same `ort` setup as RF 2).
3. EM 6–8 (`.verso` save/load, autosave, recovery, relink, recent) ‖ EX 2–3 (`buildRenderGraph`, `encoder_capabilities`; RF and AC hwaccel gates depend on this) ‖ RF 4–8 (decode, faces, tracker, voices, ASD, people, solver).
4. EX 4–7 (compiler with crop rules and `yuv444p`, `export.rs`, preflight, audio lanes with ducking/loudnorm; end-card hook left behind a constant until AP). First exportable reel. ‖ RF 9–10 (`reframe.rs`, People tab, Inspector, `cropAt` into the player stub).
5. EX 10 (player `ClipPool`, Web Audio gate) ‖ RF 11 (`reframeChain.ts` + compiler insertion) ‖ AC 2–7 (removeCuts, enhance, punch-ins, beat sync, highlights 3a, AutoCutTab, "Make all N reels").
6. EX 8 part 1 (transitions with handles/freeze, audio fades) ‖ EX 11 (`media_proxy`) ‖ RF 12 / AC 10 performance passes on dev box and laptop.

**Phase 4 — captions, templates, one-click edits**

7. CP 1–4 (whisper builds, `tools.rs` backends, `models.rs` download flow, `captions.rs` with VAD/chunking/hallucination filter) ‖ TP 2 (`templates.ts` → commands) ‖ TP 4 (`packs.rs`, asset scope).
8. CP 5–7 (transliteration, `captions.ts` on the editing-model types, Captions tab) ‖ TP 6 (`OverlayRenderer`, fonts, FONTS.txt) ‖ TP 3 (`transitionAt`, the three compiler rules) — TP 6 is the gate for everything that draws text.
9. EX 8 part 2 (overlay lanes via `overlay_begin/frame/end`, TP 5) ‖ CP 8–9 (caption styles, `layoutLine` inside `OverlayRenderer`, captions lane) ‖ TP 7 (player canvas path for scenes/masks, chevron handle).
10. CP 10 (`.srt`, render-graph integration) ‖ TP 8–9 (Templates tab, swap, music library) ‖ AC 8 (3b: transcript signals; needs CP 1–4) ‖ AC 9 (llama-server, LLM manifest entries, CUDA pack shared with CP 12).
11. CP 11–13 (Hinglish model conversion, CUDA pack after legal, quality baselines) ‖ TP 10–12 (design the 12 templates, `build-pack.mjs`, originality review, CI gates) ‖ AC 10 (one-click chain end to end, Playwright).

**Phase 5 — accounts, packaging, export completeness, macOS**

12. AP 1–6 (server scaffold, schema, auth, licence signing, sign-in page, portal) — independent of the desktop; can start any time an engineer is free, but ships here.
13. AP 7–8 (Rust `account.rs`, React `useAccount`, export gate) → EX 3.7 end-card + `maxExportHeight` and TP 4.2 Pro gate switch from constants to `account_state`; AC 10 run counter.
14. AP 9–12 (Razorpay, invoices, cron, DPDP endpoints) ‖ EX 9 (encoder fallback loop, chunking, HEVC/AV1 opt-ins) ‖ EM 9–11 (updater, NSIS, licence page, LGPL CI gate, crash reporting).
15. EX 12 (macOS VideoToolbox, `canPlayType` measurement) ‖ CP 13 macOS Metal whisper build ‖ RF 12 CoreML pass ‖ AP 13–15 (docs, staging, launch) ‖ EM 12 + EX 13 release gates and legal sign-offs.

Hard gates before any public build: LGPL banner CI check (EM 10), licence register complete in About (EM 10 / RF 1), DirectML decision (RF 1), originality review signed for the shipped pack (TP 10), −14 LUFS and no-`elst` verification on every preset (EX 8 test plan).
