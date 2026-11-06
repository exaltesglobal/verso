# Verso spec audit

Audit of the merged `main` against the 19-point spec checklist, 7 November 2026.

**Summary: Kept 4 · Fixed 13 · N/A / Deferred 2** (19 points)

Product model used for every judgement (wins over older wording in the phase specs on
`origin/docs/phase3-5-specs`): Free = full editor, 1080p export, no watermark ever. Pro = Auto-cut / auto clips,
speaker reframe, premium caption styles and Pro templates, 4K and 60 fps. AI actions cost credits on both plans;
editing and export are free. Numbers come from server config.

Commits from this audit (local `main`, not pushed):

| Commit | What |
| --- | --- |
| `dcc5a6d` | Pricing page matches the product model; free auto-clip limit 0; token cleanup job + cron docs |
| `382ad7b` | Restore the Cargo `[features]` table lost in the merges (captions engine was compiled out) |
| `9b71e75` | Export: watermark path removed, 60 fps gated with 4K (UI + export side), xfade in yuv444p |
| `c64f079` | `VERSO_MODEL_MIRROR` override for every model download |
| `61cb3fe` | Project file: unknown keys preserved, `relPath` + relink, fsync before rename |
| `69ab7c2` | Frame-grid snapping, 2×42 caption cap, auto-cut sensitivity + reject, Batch cost line |
| `471a8b9` | Ember only on primary action and playhead; Fraunces licence bundled |
| docs commit | This file, MODELS, ASSET-MANIFEST, PRIVACY-NOTES, SHORTCUTS, ROADMAP-LATER additions |

Checks after the fixes: `cargo check` (with whisper now on), `tsc --noEmit`, `eslint .` and
`prettier --check src/styles/app.css` pass. All 71 templates were run through `applyTemplate` in every language
with three fake media sets by a throwaway script (not committed): 0 failures.

---

## 1. Licences: **Kept**

- Rust (Windows target, 375 crates via `cargo metadata`): all MIT / Apache-2.0 / BSD / ISC / MPL-2.0 / Zlib /
  Unlicense / Unicode-3.0 / BSL-1.0 / 0BSD / CC0 variants. No GPL, LGPL or AGPL crate. Outside the named
  allow-list but permissive: `webpki-roots` / `webpki-root-certs` (CDLA-Permissive-2.0, Mozilla CA list),
  Unicode-3.0 (ICU data), Zlib, BSL-1.0. Worth a line in the notices file, not a blocker.
- App npm (prod): React/scheduler MIT, Tauri packages MIT/Apache, Fraunces and Manrope OFL-1.1. Server npm
  (prod): 90 MIT, 3 BSD-3, 3 ISC, 1 Apache-2.0, Manrope OFL.
- FFmpeg: separate sidecar, BtbN LGPL build, checksum-verified (`scripts/fetch-ffmpeg.mjs`); no libx264/x265
  (`src-tauri/src/export/encoders.rs`).
- Absent: pyannote, NLLB / SeamlessM4T, espeak-ng (`src-tauri/src/voice/g2p.rs` is our own G2P), libx264/x265,
  GPL FFmpeg builds, CC-NC fonts or music. They appear only in the "Rejected" tables of `docs/AI-MODELS.md`.
- Deferred extra: a generated third-party notices file (see ROADMAP-LATER).

## 2. Fonts: **Fixed** (`471a8b9`)

- Bundled and OFL: Manrope 600/700/800 in `src-tauri/fonts/` with `src-tauri/licenses/Manrope-OFL.txt`;
  `@fontsource-variable/manrope` and `@fontsource-variable/fraunces` for the UI.
- Fixed: Fraunces' OFL text is now in `src-tauri/licenses/Fraunces-OFL.txt`, all of `licenses/*` ships as a
  resource (`tauri.conf.json`), and Fraunces is credited in Settings.
- Burn-in: libass gets `fontsdir=<resources>/fonts` (`src-tauri/src/commands/export.rs` `Fonts::find`,
  `src-tauri/src/export/mod.rs`). Only if Manrope is missing does it copy one system font (Segoe UI, then Arial)
  into a scratch folder.
- Noted / deferred: Manrope has no Devanagari, so Hindi/Marathi burned captions use the system fallback
  (Nirmala UI on Windows); serif title cards export in Manrope, not Fraunces. Fallback and plan in ROADMAP-LATER.

## 3. Music / SFX / stickers: **Fixed** (docs commit)

- Created `docs/ASSET-MANIFEST.md`: 14 FFmpeg-synthesised sounds (`src-tauri/src/commands/sfx.rs`), 8 original
  SVG stickers (`src/lib/stickers.ts`), emoji drawn by the OS emoji font at display time, fonts, brand assets,
  splash and icons (Agape Labs brand kit). Nothing third-party or CC-licensed is bundled.

## 4. Models: **Fixed** (`c64f079`, docs commit)

- Already: every model is SHA-256 pinned with exact size, downloaded on first use, verified, and kept in app data
  (`captions/models.rs`, `reframe/models.rs`, `background/mod.rs`, `commands/enhance.rs`, `voice/models.rs`).
- Fixed: one `mirrored()` function routes all downloads; `VERSO_MODEL_MIRROR` (build or run time) maps
  `https://host/path` to `<mirror>/host/path`.
- Created `docs/MODELS.md`: register with file, size, SHA-256 and licence per model. YuNet verified as **MIT**
  (OpenCV Zoo's YuNet directory), SFace Apache-2.0, Silero MIT, Whisper/ggml MIT, Kokoro Apache-2.0, IndicTrans2
  MIT, MediaPipe Selfie Apache-2.0, RNNoise model public domain + BSD-3 code.
- Notes: whisper.cpp URLs use `main` rather than a commit (hash still pinned); IndicTrans2 ONNX is a personal
  third-party conversion. Totals: 712.5 MB without Whisper, 902.5 MB with Whisper Small.

## 5. GPU: **Fixed** (`382ad7b`)

- Found: the `[features]` table was lost in the merges, so the default `whisper` feature was gone and **the
  captions engine was compiled out**. `directml`/`coreml` were undeclared.
- Fixed: `default = ["whisper"]`; `cuda`, `metal`, `directml`, `coreml` are opt-in. No CUDA toolkit is shipped
  by default. Hardware video encoding is FFmpeg only (NVENC/QSV/AMF/MF in `export/encoders.rs`).
- DirectML for ONNX: owner decision (below).

## 6. Project file `.verso`: **Fixed** (`61cb3fe`)

- Already: JSON with `format: "verso-project"` and `version` (`src/lib/persist.ts`); autosave to
  `<app data>/projects/<id>.json`; temp file + rename (`src-tauri/src/commands/projects.rs`).
- Fixed: unknown top-level and track keys are preserved on load and written back (`normalizeProject`); the
  writer stamps `format`/`version` last (`PROJECT_VERSION`). Save As stores `source.relPath` relative to the
  `.verso` file; open relinks a missing path through `relPath` when the file size matches. The temp file is
  `sync_all`ed before the rename.
- Deferred: the quick content hash (size + mtime + first/last MB); size match is the fallback.

## 7. Edit model: **Fixed** (`69ab7c2`)

- Already: non-destructive clips (in point + range over the source), undo/redo with gesture commit and merge keys
  for drags (`src/lib/useHistory.ts`, 200 steps), snapping to clip edges and playhead (`Timeline.tsx`), ripple
  delete (`deleteClip(..., ripple)`).
- Fixed: when no edge is near, moves and trims snap to whole frames of a 30 fps grid (also whole frames at
  60 fps). Time stays float seconds in the model.
- Deferred: roll trim and ripple trim (ROADMAP-LATER).

## 8. Playback: **Deferred**

- Already: muted scrub (the video is paused and seeked while scrubbing), filmstrip frame cache
  (`src/lib/filmstrip.ts`) shown under the video for instant frames.
- Not met: the `<video>` element is the master clock (`VideoLayer.tsx` writes `mediaClockRef`), not audio; no
  preview downscale/proxies (CSS scaling only). Both need a playback-engine change. Fallback and plan in
  ROADMAP-LATER.

## 9. Export: **Fixed** (`9b71e75`)

- Already: encoder probe order `h264_nvenc → h264_qsv → h264_amf → h264_mf → libopenh264 → mpeg4`, each
  test-encoded once (`export/encoders.rs`); captions/text burned via ASS + libass with bundled fonts.
- Fixed: the unused "Made with Verso" drawtext watermark and its request field are removed, so no export path can
  add one. 60 fps is now Pro in the export dialog alongside 4K, and `start_export` refuses 4K or >30 fps without
  the `export_4k` entitlement. xfade inputs are converted to yuv444p and the result back to yuv420p.
- Deferred: two-pass loudnorm on the final mix (voice clean-up already does two-pass loudnorm to -14 LUFS).

## 10. Captions: **Fixed** (`382ad7b`, `69ab7c2`)

- Already: whisper.cpp via whisper-rs with token timestamps (`captions/engine.rs`), languages auto / EN / HI / MR
  / Hinglish (romanised prompt, Devanagari transliterated), word timings for karaoke, 7 styles as TS data objects
  (`src/lib/captionStyles.ts`, acceptable as data; premium ones gated by `caption_styles_pro`).
- Fixed: the engine was compiled out (see 5). Segments now also break before 84 characters (2 lines × 42), on top
  of the 4-word / 1.6 s / pause / punctuation rules (`captions/segment.rs`).
- Noted: "Detect automatically" picks EN/HI/MR; Hinglish is a manual choice (ROADMAP-LATER).

## 11. Reframe: **Deferred**

- Already: YuNet faces + Silero VAD + optional SFace re-identification (`reframe/analyze.rs`); modes centre,
  follow subject, follow speaker, active speaker (min hold + hysteresis), split two (`reframe/planner.rs`);
  dead zone 0.06 then a critically damped spring per axis.
- Not met: manual override keyframes. Fallback and plan in ROADMAP-LATER.

## 12. Auto-cut: **Fixed** (`69ab7c2`)

- Already: explainable scoring with reasons shown (hook words EN/HI/Hinglish, questions, numbers, speech density,
  filler ratio, audio energy) in `src/lib/autoclips.ts`; each moment opens as its own project to trim.
- Fixed: a sensitivity slider (lowest hook score shown, filters without re-running or re-charging) and a
  "Not this one" reject per moment in `AutoCutPanel.tsx`.
- Noted: face presence is not in the score yet (ROADMAP-LATER).

## 13. Templates: **Kept**

- Pure data, no code per template (`src/templates/packs/*.ts`, `types.ts`); one generic `applyTemplate`.
- 71 templates in 6 packs (trending 13, cinematic 12, podcast 10, creator 12, festive 15, business 9). Each has
  placeholder slots with hints, a data-drawn preview card (`TemplatesPanel.tsx`, accents/look), and language
  variants (en, hi, plus ta/ml/bn/mr where written). Pro templates gated by `templates_pro`.
- Throwaway load test: every template × every language × {no media, one short clip, three mixed clips}: no
  throws, no zero-length or negative clips, no empty text, no duplicate ids, slot totals match durations.

## 14. Credits: **Fixed** (`69ab7c2`)

- Already: append-only `credit_ledger` with idempotent debits and refunds and a cached balance row
  (`server/src/credits.ts`); signed offline grant of `CREDITS_OFFLINE_BUFFER` (default 50) via the Ed25519 key
  (`routes-credits.ts`, `src-tauri/src/credits.rs` offline queue + reconcile); `CostConfirm` cost lines with
  "Get more credits"; out-of-credits dialog; all costs, packs, allowances and buffer from server env
  (`server/src/config.ts`, `GET /v1/credits/pricing`).
- Fixed: Batch now shows the cost line (total minutes of waiting videos) before it starts.

## 15. Accounts: **Kept**

- Desktop sign-in: system browser + loopback `127.0.0.1:<random>` with PKCE S256 and state
  (`src-tauri/src/account.rs`, `server/src/routes-pages.ts`, `auth.ts`). Google OAuth runs server-side as a
  confidential client with state (`server/src/google.ts`); PKCE protects the app-to-server leg.
- Passwords: Argon2id (`@node-rs/argon2`, `server/src/crypto.ts`).
- Ed25519 (EdDSA) offline entitlement tokens, `OFFLINE_ENTITLEMENT_DAYS=7`, device-bound; public key pinned at
  build (`VERSO_ENTITLEMENT_PUBLIC_KEY`).
- Refresh token only in the OS keychain (`keyring`), rotated with family reuse detection.

## 16. Server: **Fixed** (`dcc5a6d`)

- Already: `server/server.cjs` CommonJS entry that imports the ESM build; Knex with MySQL (prod) / SQLite (dev)
  (`db.ts`); Razorpay webhook HMAC over the raw body with timing-safe compare (`routes-webhooks.ts`,
  `billing.ts`); Resend mail (`mailer.ts`, console fallback); `credits-reset.js` for cron.
- Fixed: added `tokens-cleanup` (expired sessions, refresh tokens, sign-in codes, email links; kept 7 days;
  revoked refresh tokens kept until expiry for reuse detection) and documented both Hostinger cron jobs in
  `docs/SETUP-KEYS.md`. The pricing page advertised a free-plan watermark and 10 free auto clips; it now matches
  the product model, with device counts read from `PLANS`. Free `auto_clips_per_month` is 0 in all three plan
  mirrors (server, `entitlements.ts`, `account.rs`).

## 17. Surecast: **Kept**

- API key in the OS keychain (`src-tauri/src/surecast.rs`). Send to Surecast uploads the video and cover and
  creates a draft post with title, hook, caption, hashtags, SRT, language and project id (under `verso`, plus
  `externalRef`). Read-only job/status list with refresh (`surecast_jobs`, `surecast_refresh`). Gaps in
  `docs/SURECAST-API-NEEDS.md`.

## 18. Privacy: **Fixed** (docs commit)

- Created `docs/PRIVACY-NOTES.md` listing every network call: accounts, beta invite, credits, Surecast, updates,
  model downloads, opt-in crash reports, and user-clicked links. Nothing else goes out.
- Release items noted there: updater endpoint is still `api.example.com` with an empty pubkey; CSP is `null`.

## 19. UI: **Fixed** (`471a8b9`, docs commit)

- Already: custom frameless title bar (`decorations: false`, `WindowControls.tsx`); macOS uses the same custom
  bar for now (native traffic lights planned in ROADMAP-LATER). Ember on `.btn--primary` and the playhead.
- Fixed: removed Ember/glow from the welcome hero text and backdrop, Pro badge, link hover, text selection and the
  replace-background tile. The peach focus ring stays on purpose (accessibility, not decoration).
- Spacing: tokens step in 4 px (`--vs-space-*`); layouts mostly land on 8 px, with 4 px half-steps. Noted, not
  changed.
- Created `docs/SHORTCUTS.md` from the real handlers (`src/screens/Editor.tsx` and dialogs).

---

## Decisions for Anup

1. **DirectML** for the ONNX models on Windows: sign off on shipping `onnxruntime` with DirectML (MIT, but the
   DirectML redistributable has Microsoft terms). Currently opt-in, CPU by default.
2. **CUDA EULA position**: we don't ship CUDA (feature off). Confirm we never will, or accept the NVIDIA EULA
   redistribution terms for a GPU build.
3. **H.264 patents** for commercial distribution: we rely on OS/GPU encoders (NVENC/QSV/AMF/MediaFoundation) and
   Cisco's OpenH264 as a fallback. Confirm the position (and whether to fetch Cisco's binary for its patent
   licence) with counsel.
4. **Final public hostnames**: proposed `verso.agapelabs.com` (site) and `api.verso.agapelabs.com` (API, updates,
   model mirror path). Also fill the updater endpoint and pubkey.
5. **GST place of supply** for Indian buyers (Razorpay orders and invoices: state of supply, IGST vs CGST/SGST).
6. **Marathi TTS** falls back to Hindi Kokoro voices: there is no permissively licensed Marathi voice.
7. **Model mirror before launch**: all model files (712.5 MB without Whisper, about 2.5 GB with all Whisper
   sizes; the 666 MB planning figure is out of date) must be on our own server, then set `VERSO_MODEL_MIRROR`.
8. **Native-speaker review** of Hindi, Tamil, Malayalam and Bengali template text.
