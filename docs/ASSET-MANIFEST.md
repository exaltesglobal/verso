# Asset manifest

Every media asset that ships with Verso or is produced by it, with its source and licence. Rule: CC0 or made by
Agape Labs only, plus OFL/Apache fonts. No stock music, samples or third-party stickers.

## Built-in sound library (`src-tauri/src/commands/sfx.rs`)

Synthesised by Verso with FFmpeg's audio generators (`sine`, `anoisesrc`, filters) from recipes in the code. No
samples or recordings. Rendered on first use into `<app data>/sounds/`. Source: Agape Labs (self-made). Licence:
ours, no third-party rights.

| Id | Name | Kind |
| --- | --- | --- |
| whoosh | Whoosh | SFX |
| swoosh-up | Swoosh up | SFX |
| pop | Pop | SFX |
| click | Soft click | SFX |
| ding | Ding | SFX |
| riser | Riser | SFX |
| boom | Boom | SFX |
| typing | Typing | SFX |
| camera | Camera shutter | SFX |
| heartbeat | Heartbeat | SFX |
| bed-calm | Calm pad | Music bed |
| bed-pulse | Upbeat pulse | Music bed |
| bed-drive | Night drive | Music bed |
| bed-warm | Warm keys | Music bed |

## Stickers (`src/lib/stickers.ts`)

| Asset | Source | Licence |
| --- | --- | --- |
| Shapes: arrow, circle, burst, bubble, underline, follow, spark, check | Original inline SVGs written for Verso | Agape Labs (self-made) |
| Emoji (the `EMOJI` list) | Plain Unicode characters. Drawn by the operating system's emoji font at display time (Segoe UI Emoji on Windows, Apple Color Emoji on macOS). No emoji artwork ships with Verso. | Unicode characters are not copyrightable; the glyph artwork belongs to the OS vendor and is used through the OS. Exported emoji are rendered by libass with whatever emoji/fallback font the system provides. |

## Fonts

| Font | Where | Licence file |
| --- | --- | --- |
| Manrope 600/700/800 (TTF) | `src-tauri/fonts/`, used by libass for burned captions and text | `src-tauri/licenses/Manrope-OFL.txt` (SIL OFL 1.1) |
| Manrope Variable (woff2) | `@fontsource-variable/manrope`, UI | OFL 1.1 (package LICENSE) |
| Fraunces Variable (woff2) | `@fontsource-variable/fraunces`, serif title cards in the editor | `src-tauri/licenses/Fraunces-OFL.txt` (SIL OFL 1.1) |

## Brand assets, splash and icons

| Asset | Path | Source | Licence |
| --- | --- | --- | --- |
| Verso logo, mark | `src/assets/brand/verso-*.svg` | Verso brand kit (Agape Labs) | Agape Labs, all rights reserved |
| Agape Labs lockup and symbol | `src/assets/brand/agape-labs-*.svg` | Agape Labs brand kit | Agape Labs, all rights reserved |
| Splash | `src/assets/brand/splash.png` | Verso brand kit | Agape Labs, all rights reserved |
| UI icons | `src/assets/icons/*.svg` | Verso brand kit (drawn for Verso) | Agape Labs, all rights reserved |
| App icons | `src-tauri/icons/*` | Generated from the Verso mark | Agape Labs, all rights reserved |
| Favicon | `public/favicon.png` | Verso mark | Agape Labs, all rights reserved |

## Templates

Templates (`src/templates/`) are pure data: slots, text, colours and look settings. They contain no images,
video or music. "Music mood" is a text hint only.

## User content

Brand-kit logos and media are the user's own files and never leave the machine except through Send to Surecast.
