# Test log

## Debug pass, 7 Nov 2026

Windows 11, NVIDIA GPU, `pnpm tauri dev` with the bundled LGPL FFmpeg, `server/` in dev (SQLite, console mailer).
Test media: generated TTS podcast (16:9, two box "faces"), a 30 s clip with a real face (public-domain NASA
astronaut photo) for reframe, and the B-roll sample. Checks ran through the real app: UI driven over the WebView2
DevTools protocol, and the app's own TS modules and Tauri commands called inside the webview.

| # | Item | Result | What was fixed | Commit |
| --- | --- | --- | --- | --- |
| A | "Verso closed unexpectedly last time" prompt | Fixed | The original report was already discarded (empty `crashes/`, nothing on the server, `Verso.log` empty), so it can't be read. Fixed what could produce it: captions always failing (item 6), editor shortcuts throwing when the key event target isn't an element. The prompt also fires for JS errors that didn't close the app, so it now says "Verso ran into a problem last time". Crash and frontend errors now also go to `Verso.log`, so the next one can still be traced after "Don't send". | `e765237`, `720bb94`, `512d4a8` |
| B | Sign-in page Google button and Pricing link | Fixed | "Continue with Google" now sits above the email form with an "or" divider on sign-in and sign-up. Without Google keys it shows disabled with "Google sign-in isn't set up yet." The Pricing link already goes to the server's `/pricing` (200, Free and Pro plans), so it needed no change. | `7292371` |
| 1 | Frameless title bar, v2 logo | Pass | | |
| 2 | Import, filmstrips, waveforms | Pass | | |
| 3 | Playback with audio | Pass | `<video>` loads through `asset.localhost` (file allowed at import), advances while playing and decodes audio. | |
| 4 | Split, trim, ripple delete, undo, redo | Pass | | |
| 5 | Save and reopen `.verso` | Pass | `relPath` relinks after moving the folder. Unknown keys survive at project, clip and source level. | |
| 6 | Captions, English and Hindi | Fixed | Every run failed with "Generic whisper error ... -6". whisper-rs 0.16's `set_abort_callback_safe` hands whisper.cpp a `Box<Box<dyn FnMut>>` but its trampoline reads it as the closure type, so the abort check read garbage and stopped the encoder. Now a plain callback reads the cancel flag. English: 198 words, correct text. Hindi mode completes. Cancel still works. | `e765237` |
| 7 | Speaker reframe | Pass | Box faces: analysis finishes, 0 faces (expected: they aren't faces). Real face: 1 speaker, 13 speech segments, the follow crop is centred on the face. | |
| 8 | Auto-cut candidates | Pass | 3 moments (hook scores 81, 80, 51) and a project for each. | |
| 9 | One template per pack | Pass | Every template (71) applies in every language with no errors. In the UI, one per pack (Trending, Cinematic, Podcast, Creator, Festive, Business) applies and the preview renders. Note: some template texts carry fill-in tokens such as `₹{price}` that show as typed until the user edits them. | |
| 10 | Export 1080p NVENC, burned captions, transition | Pass | h264 1080x1920 + AAC, 31.9 s, `ffmpeg -v error ... -f null -` clean. Captions visible in the frames. | |
| 11 | Export fallback, NVENC off | Pass | Added `VERSO_DISABLE_NVENC=1`. With it set, the export picks `h264_mf`: h264 1080x1920 + AAC, decodes clean. | `125d1fa` |
| 12 | Sign-in in browser, loopback | Pass | `start_sign_in` opened the system browser at `/desktop/sign-in`. Completing it with a dev account returned through the loopback ("You're signed in"), and the token exchange gave the app a signed-in Free session. | |
| 13 | Credits badge and deduction | Pass | With `VITE_VERSO_CREDITS_ENFORCE=true`, the badge showed 30 credits. Writing captions for the 92 s clip took it to 26. | |
| 14 | `/admin` for a dev admin | Pass | Returns 404 until the email is confirmed (as designed). After confirming, it goes to `/admin/users` and lists users. | |
| 15 | Send to Surecast with no key | Pass | Fails cleanly: the dialog says "Add your Surecast address in Settings first." or "Connect Surecast in Settings first.", and `surecast_enqueue` refuses with the same message. | |
| 16 | Static checks | Pass | `cargo clippy`: 24 style lints only (collapsible if, `is_multiple_of`, `chunks_exact`), none point to a bug. `cargo test`: 12 passed. `tsc --noEmit`, `eslint .`, `server` `pnpm build`: clean. `server` `pnpm test`: no test files. | |

Dev admin account for local testing: the email and password are in `server/.dev-keys/dev-admin.txt` (git-ignored).
Start the server with `ADMIN_EMAILS=admin@verso.test`.

## Release check (ux/simple-flow merged to main), 7 Nov 2026

Windows 11, `pnpm tauri dev` from the `C:\vt\ux` worktree: port 1430, its own Cargo target folder and app
identity, so the owner's running copy was untouched. FFmpeg came from PATH (WinGet build); the installers
bundle the LGPL sidecar. The captions and face AI packs were copied in from this machine. Media:
`scratchpad\media\podcast-16x9.mp4` (92 s TTS podcast), `face-16x9.mp4`, plus 75 s and 40 s screen clips.
Checks ran through the real app over the WebView2 DevTools protocol, calling the app's own modules and Tauri
commands. Output files are in `C:\vt\ux-tests\`.

**Totals: 20 pass, 0 fail, 5 not run** (11–15 need an env-var restart, the local server or a Surecast setup).

| # | Item | Result | Notes |
| --- | --- | --- | --- |
| 1 | Frameless title bar, logo | Pass | Premium 48px title bar; screenshots in `docs/screenshots/review/`. |
| 2 | Import, filmstrips, waveforms | Pass | Both clips show filmstrips and waveforms. |
| 3 | Playback with audio | Pass | `<video>` readyState 4, playhead advanced 12.0 → 13.4 s in 2 s. |
| 4 | Split, ripple delete, undo, redo | Pass | Clip count 2 → 3 (S) → 2 (Shift+Del) → 3 → 2 (undo twice) → 3 (redo). The Studio razor also splits, and undo restores. |
| 5 | Save and reopen `.verso` | Pass | Unknown keys survive. The new track `locked` flag and `markers` round-trip. |
| 6 | Captions, English and Hindi | Pass | Base AI pack: English, first 30 s gave 28 segments and 70 words ("Why do most podcasts never…"). Hindi mode completes (13 segments). |
| 7 | Speaker reframe | Pass | Real face clip: 1 speaker, 9 speech segments, the follow plan has keyframes. |
| 8 | Auto-cut candidates | Pass | Full podcast: 3 moments, each makes a project. |
| 9 | Every template, every language | Pass | 71 templates, 125 template/language combinations applied, 0 errors. |
| 10 | Export 1080p, burned captions, transition | Pass | h264 1080x1920 + AAC, 8.0 s, decodes with no errors. The caption "HELLO FROM VERSO" is visible in the frame at 2 s, and the fade at 4 s exports. |
| 11 | Export fallback, NVENC off | Not run | Needs a restart with `VERSO_DISABLE_NVENC=1`. The export code didn't change in this release. |
| 12 | Sign-in in browser, loopback | Not run | Needs the local server. |
| 13 | Credits badge and deduction | Not run | Needs the local server with credits enforced. The badge renders, and AI one-tap actions show the cost chip. |
| 14 | `/admin` for a dev admin | Not run | Needs the local server. |
| 15 | Send to Surecast with no key | Not run | Calling the command directly needs a full package. The UI path didn't change. |
| 16 | Static checks | Pass | `tsc`, `eslint .`, `vite build`, `pnpm test:handoff` clean. `cargo test`: 12 passed. `cargo fmt --check` flagged CRLF line endings in `sfx.rs`; fixed. |
| 17 | Position and opacity in an export | Pass | Scale 150 %, X +30 %, opacity 50 %: the frame at 2 s is zoomed and panned, and mean luma drops from 59 to 23 against the plain export. |
| 18 | Hand-off export | Pass | Premiere (`.xml` xmeml + `.fcpxml` + read-me) and Resolve (`.fcpxml` + read-me) written. The XML parses and media paths are `file:///` URLs. |
| 19 | Muted track in an export | Pass | Sound track muted: max volume −91 dB (silent), against −5.3 dB for the plain export. |
| 20 | Hidden / locked tracks | Pass | Mute silences the preview video. Locked tracks block move, trim, split and delete with a plain message. Flags save in the project. |
| 21 | Audio panel | Pass (fixed) | It showed "os error 2": two panel requests rendered the same sound into one temp file at once. Builds now run one at a time and errors read in plain words. The library and mix presets load. |
| 22 | Quick / Craft / Studio switch | Pass | Project, history and selection survive every switch. The first move up shows the one-line hint. Studio has drag handles, the second tool row and track toggles. |
| 23 | One-tap edits and time saved | Pass | Add end card +5 min. Ctrl+Z takes the minutes back and Ctrl+Y adds them again (17 → 22 → 17 → 22). Remove pauses on the podcast removed the gaps. |
| 24 | Studio tools | Pass | Razor splits at the click point. Markers add at the playhead, draw on the ruler and jump. Track mute and lock toggle from the headers. |
