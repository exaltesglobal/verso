# Verso

**Long videos in. Reels out.**

Verso is a reels-first desktop video editor by Agape Labs, a brand of Exaltes Global Private Limited.
It's built for creators who have never opened a timeline. Verso finds the best moments in a long video,
turns them vertical, and finishes them in one click.

> Status: **Phase 1, Foundation (beta).** This phase is the app shell: Welcome screen, editor layout, and
> a working frontend-to-Rust pipeline that reads real files with ffprobe. It has no media engine yet:
> the preview and timeline use placeholder data.

![Phase 1 shell](docs/screenshots/phase1-shell.png)

## Stack

| Layer    | Tech                                                    |
| -------- | ------------------------------------------------------- |
| Shell    | [Tauri 2](https://tauri.app) (Windows now, macOS ready) |
| Backend  | Rust (stable, MSVC toolchain on Windows)                |
| Frontend | React 19 + TypeScript + Vite                            |
| Styling  | Plain CSS on the Verso design tokens (brand kit)        |
| Media    | FFmpeg 9.0 LGPL build, bundled as Tauri sidecars        |
| Package  | pnpm                                                    |

## Dev setup

Prerequisites:

1. **Node.js 20+** and **pnpm** (`npm i -g pnpm`).
2. **Rust** via [rustup](https://rustup.rs) (stable).
3. **Windows:** Visual Studio Build Tools with the "Desktop development with C++" workload, plus the
   WebView2 runtime (preinstalled on Windows 11).
   **macOS:** Xcode Command Line Tools (`xcode-select --install`).
4. **FFmpeg sidecars:** run `pnpm fetch:ffmpeg` once. It downloads the LGPL build into `src-tauri/binaries/` (see [FFmpeg and licensing](#ffmpeg-and-licensing)). Until then, dev builds fall back to `ffmpeg`/`ffprobe` on your PATH.

Then:

```bash
pnpm install
pnpm tauri dev
```

The first run compiles the Rust side and takes a few minutes. Later runs are fast.

## Scripts

| Command             | What it does                                     |
| ------------------- | ------------------------------------------------ |
| `pnpm tauri dev`    | Run the desktop app with hot reload              |
| `pnpm tauri build`  | Build installers (`.msi`/`.exe`, `.dmg` on Mac)  |
| `pnpm dev`          | Run only the web UI in a browser (no Rust calls) |
| `pnpm typecheck`    | TypeScript check                                 |
| `pnpm lint`         | ESLint                                           |
| `pnpm format`       | Prettier (write)                                 |
| `pnpm test:rust`    | Rust unit tests                                  |
| `pnpm fmt:rust`     | rustfmt                                          |
| `pnpm fetch:ffmpeg` | Download the LGPL FFmpeg sidecars (once)         |
| `pnpm build:app`    | Fetch sidecars, then build installers with them  |

## Architecture

```
verso/
├─ src/                       React UI
│  ├─ main.tsx                Entry: Manrope font, design tokens, app styles
│  ├─ App.tsx                 Splash, Welcome ↔ Editor, import flow, toasts
│  ├─ screens/
│  │  ├─ Welcome.tsx          Big actions: Make clips, Import video, New project
│  │  └─ Editor.tsx           Editor state (tab, aspect, playhead, zoom, selection)
│  ├─ components/
│  │  ├─ editor/              TopBar, LeftPanel (rail + tabs), Preview, Inspector, Timeline
│  │  ├─ Icon.tsx             Brand-kit SVG icons (currentColor)
│  │  ├─ Splash.tsx           Launch splash
│  │  └─ ui.tsx               Button, IconButton, Toggle, Segmented, Toast
│  ├─ lib/media.ts            File dialog + invoke("probe_media") + formatters
│  ├─ data/placeholder.ts     Sample project data until the engine lands
│  ├─ styles/
│  │  ├─ verso-tokens.css     Brand kit tokens: the single source of styling
│  │  └─ app.css              App styles, built only from tokens
│  └─ assets/                 Icons, logo, splash (from Verso-Brand-Kit)
├─ src-tauri/                 Rust backend
│  ├─ src/lib.rs              Builder: plugins (dialog, opener) + command registry
│  ├─ src/commands/
│  │  ├─ mod.rs               One module per area
│  │  ├─ media.rs             probe_media: runs ffprobe, returns MediaInfo JSON
│  │  └─ thumbnails.rs        media_filmstrip: cached frames for the media bin and timeline
│  ├─ src/tools.rs            Finds the FFmpeg sidecar (falls back to PATH in dev)
│  ├─ binaries/               FFmpeg sidecars from `pnpm fetch:ffmpeg` (git-ignored)
│  ├─ capabilities/           Tauri permissions (core, dialog, opener)
│  ├─ icons/                  App icons from the brand kit
│  └─ tauri.conf.json         Window, bundle and identifier config
└─ docs/screenshots/
```

### Frontend ↔ Rust

```
Import button ─► @tauri-apps/plugin-dialog open()
              ─► invoke("probe_media", { path })
              ─► Rust: ffprobe -show_format -show_streams (blocking thread)
              ─► MediaInfo { durationSec, width, height, fps, videoCodec, audioCodec, ... }
              ─► media bin card
```

Error messages from Rust are written in plain language and shown directly in a toast.

### Design rules (from the brand kit)

- Dark-first "Studio dark": Ink `#0B0B0F` background, Manrope everywhere (bundled, no CDN).
- **Ember `#FF4A2B` is used only for the primary action (Export) and the playhead.**
- Icons come from `03-Iconography` and take the colour of their text.
- Plain language, sentence case, verbs on buttons. Undo everything; never touch the original file.

## FFmpeg and licensing

Verso uses FFmpeg to read, preview and (later) export video. FFmpeg runs as a separate program (a Tauri
**sidecar**); it is never linked into Verso's own code.

- **Build:** [BtbN/FFmpeg-Builds](https://github.com/BtbN/FFmpeg-Builds), release branch **n9.0**, **LGPL**
  variant (`ffmpeg-n9.0-latest-win64-lgpl-9.0.zip`).
- **Why LGPL, not GPL:** the "full"/GPL builds include GPL-only encoders (x264, x265 and others). Shipping
  them would put Verso itself under GPL obligations. The LGPL build lets Verso stay closed source and
  freemium, as long as we:
  1. ship FFmpeg as its own replaceable executable (the sidecar does this),
  2. include the FFmpeg licence text (`licenses/FFMPEG-LICENSE.txt` in the installer), and
  3. credit FFmpeg and point to its source code (planned for the About panel).
- **H.264 export:** the LGPL build has no x264. Export (a later phase) will use hardware encoders (NVENC,
  Quick Sync, AMF, and VideoToolbox on Mac), which the LGPL build includes. Check H.264/HEVC patent
  licensing separately before a paid launch.
- **Download step:** `pnpm fetch:ffmpeg` (`scripts/fetch-ffmpeg.mjs`) downloads the archive, verifies it
  against the release's `checksums.sha256`, and installs `ffmpeg-<target-triple>.exe` and
  `ffprobe-<target-triple>.exe` in `src-tauri/binaries/`. That folder is git-ignored, so binaries are never
  committed.
- **Release builds:** `pnpm build:app` fetches the sidecars, then runs `tauri build` with
  `src-tauri/tauri.sidecar.conf.json`, which adds them as `externalBin` and bundles the licence.
- **macOS:** BtbN has no Mac builds. Before the Mac release, build FFmpeg with `--disable-gpl` (and without
  `--enable-nonfree`), then place `ffmpeg-<mac-triple>` and `ffprobe-<mac-triple>` in `src-tauri/binaries/`.

At runtime, `src-tauri/src/tools.rs` looks for the sidecar next to the Verso executable first, then falls
back to PATH (development only).

## Captions engine (offline)

Auto-captions run fully on the device with [whisper.cpp](https://github.com/ggml-org/whisper.cpp) (MIT) through
the [`whisper-rs`](https://crates.io/crates/whisper-rs) crate (Unlicense), pinned to `=0.16.0` (whisper-rs-sys
0.15.0). Pipeline: FFmpeg sidecar streams 16 kHz mono PCM over a pipe (no temp WAV) → whisper.cpp with token
timestamps, in 5-minute blocks → words → reel-sized captions (max 4 words / 1.6 s, break on punctuation and
pauses), each with word timings for karaoke highlight. Code: `src-tauri/src/captions/`, commands in
`src-tauri/src/commands/captions.rs`, UI in `src/components/editor/CaptionsPanel.tsx`.

### Build requirements (Windows)

whisper.cpp is C++ built by CMake, and its Rust bindings are generated with bindgen. Besides the C++ build tools:

1. **CMake on PATH.** Visual Studio ships one; no separate install is needed:
   `C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin`
   (use the `2022` folder on VS 2022). Use the CMake from the newest VS you have: the build picks the newest
   VS generator, and an older CMake doesn't know it.
2. **libclang** for bindgen. Set `LIBCLANG_PATH` to a folder with `libclang.dll`: either LLVM
   (`winget install LLVM.LLVM`, then `C:\Program Files\LLVM\bin`), or the "C++ Clang tools" VS component, or
   extract it from the `libclang` wheel on PyPI (Apache-2.0 WITH LLVM-exception). whisper-rs-sys's bundled
   bindings are generated on Linux and don't compile on MSVC, so this step can't be skipped.
3. **Short build path.** MSBuild still has the 260-character path limit. If the repo lives deep (e.g. a git
   worktree under a long folder), CMake fails with "No CMAKE_C_COMPILER could be found". Point cargo at a short
   target folder: `set CARGO_TARGET_DIR=C:\vt`.

PowerShell example:

```powershell
$env:PATH = "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin;$env:PATH"
$env:LIBCLANG_PATH = "C:\Program Files\LLVM\bin"
pnpm tauri dev
```

CPU flags live in `src-tauri/.cargo/config.toml` (`GGML_NATIVE=OFF` + AVX2/FMA/F16C) so release builds run on any
x86-64 PC from about 2013 on, not just the build machine.

**Cargo features:** `whisper` (default, CPU), `cuda` (NVIDIA; needs the CUDA toolkit at build time), `metal`
(macOS GPU). Build without the engine (no CMake/libclang needed; the captions commands then return a plain
"not included in this build" error): `cargo check --no-default-features`.

### Speech models

Models are never bundled or committed. The user picks an accuracy, and Verso downloads that model once from the
official [`ggerganov/whisper.cpp`](https://huggingface.co/ggerganov/whisper.cpp) Hugging Face repo into the app
data folder (`<appData>/models/whisper/`), with resume, cancel, progress events and a SHA-256 + size check. After
that, captions work offline. Weights are OpenAI Whisper (MIT), converted to ggml by the whisper.cpp project
(MIT). All are multilingual.

| Id                    | Size   | UI choice |
| --------------------- | ------ | --------- |
| `base-q5_1`           | 60 MB  | Fast      |
| `base-q8_0`           | 82 MB  |           |
| `small-q5_1`          | 190 MB | Balanced  |
| `small-q8_0`          | 264 MB |           |
| `medium-q5_0`         | 539 MB |           |
| `medium-q8_0`         | 823 MB |           |
| `large-v3-turbo-q5_0` | 574 MB | Best      |

### Languages and Hinglish

English (`en`), Hindi (`hi`, Devanagari), Marathi (`mr`, Devanagari), auto-detect (`auto`), and **Hinglish**.
Reels write Hinglish in Latin script ("kya baat hai"), but Whisper with `language=hi` writes Devanagari. Verso's
Hinglish mode decodes with the **English language token** (`translate=false`), which keeps output in Latin
script, plus a **romanized Hinglish initial prompt** that nudges Whisper to transliterate Hindi words instead of
translating them. Any word that still comes out in Devanagari is romanized by a small rule-based transliterator
(`captions/segment.rs`). Trade-off: the English token sometimes translates a Hindi phrase to English instead of
transliterating it, mostly on the small models; `language=hi` + transliteration would keep every word but gives
mechanical spellings ("bahut" vs "bohot") for the whole caption. Use "Best" for Hindi-heavy audio.

## Roadmap

1. **Foundation** (done): shell, design system, Rust command pipeline.
2. Media engine (in progress): FFmpeg sidecar, real thumbnails and filmstrips, real clips on the timeline,
   preview playback, waveforms, timeline editing.
3. Auto-cut and reframe: find moments in long videos, follow the speaker, 9:16 cutout.
4. Captions, templates and one-click edits.
5. Export, freemium licensing, auto-update, macOS build and signing.

## Backend

Accounts, entitlements and payments live in [`server/`](server/), a standalone Node.js 20+ package
(Fastify, TypeScript, Knex). It serves the hosted sign-in, account and pricing pages, the desktop
sign-in flow (system browser to `127.0.0.1` loopback with PKCE), `GET /v1/me/entitlements` with a signed
offline token, and Razorpay subscription webhooks.

```bash
cd server
pnpm install
pnpm dev        # http://localhost:8787, SQLite, emails printed to the console, no keys needed
pnpm build      # compile to dist/
pnpm start      # run dist/index.js
pnpm migrate    # apply database migrations (dev auto-migrates SQLite on start)
pnpm test
```

Copy `server/.env.example` to `server/.env` to change settings. Where each production key comes from, and how
to deploy to Hostinger Cloud Economy with MySQL, is in [docs/SETUP-KEYS.md](docs/SETUP-KEYS.md).

---

© 2026 Exaltes Global Private Limited. All rights reserved.
