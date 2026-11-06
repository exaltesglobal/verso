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
