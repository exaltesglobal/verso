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
| Media    | FFmpeg / ffprobe (on PATH for now, sidecar later)       |
| Package  | pnpm                                                    |

## Dev setup

Prerequisites:

1. **Node.js 20+** and **pnpm** (`npm i -g pnpm`).
2. **Rust** via [rustup](https://rustup.rs) (stable).
3. **Windows:** Visual Studio Build Tools with the "Desktop development with C++" workload, plus the
   WebView2 runtime (preinstalled on Windows 11).
   **macOS:** Xcode Command Line Tools (`xcode-select --install`).
4. **FFmpeg** with `ffprobe` on your PATH (Windows: `winget install Gyan.FFmpeg`, macOS: `brew install ffmpeg`).

Then:

```bash
pnpm install
pnpm tauri dev
```

The first run compiles the Rust side and takes a few minutes. Later runs are fast.

## Scripts

| Command            | What it does                                     |
| ------------------ | ------------------------------------------------ |
| `pnpm tauri dev`   | Run the desktop app with hot reload              |
| `pnpm tauri build` | Build installers (`.msi`/`.exe`, `.dmg` on Mac)  |
| `pnpm dev`         | Run only the web UI in a browser (no Rust calls) |
| `pnpm typecheck`   | TypeScript check                                 |
| `pnpm lint`        | ESLint                                           |
| `pnpm format`      | Prettier (write)                                 |
| `pnpm test:rust`   | Rust unit tests                                  |
| `pnpm fmt:rust`    | rustfmt                                          |

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
│  │  └─ media.rs             probe_media: runs ffprobe, returns MediaInfo JSON
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

## Roadmap

1. **Foundation** (this phase): shell, design system, Rust command pipeline.
2. Media engine: real preview playback, thumbnails, waveform, timeline editing, FFmpeg sidecar.
3. Auto-cut and reframe: find moments in long videos, follow the speaker, 9:16 cutout.
4. Captions, templates and one-click edits.
5. Export, freemium licensing, auto-update, macOS build and signing.

---

© 2026 Exaltes Global Private Limited. All rights reserved.
