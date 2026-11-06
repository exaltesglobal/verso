# Privacy notes: every network call the app makes

Editing, captions, reframe, voice, export and templates run on-device. The app touches the network only for the
calls below. Found by searching `src/` and `src-tauri/src/` for `fetch(`, `ureq`, `openUrl`/`open_url` and
`http(s)://` URLs.

`API` = the Verso server (`VITE_VERSO_API_URL`). With no API URL configured the app makes none of the API calls
and runs on the Free plan.

## Accounts (`src-tauri/src/account.rs`, `src/lib/entitlements.ts`)

| Call | When | Sends |
| --- | --- | --- |
| Opens `API/desktop/sign-in?...` in the system browser | User clicks Sign in | PKCE challenge, state, device id, device name, OS |
| Local loopback listener on `127.0.0.1:<random port>/callback` | During sign-in (5 min max) | Nothing outbound; receives the one-time code |
| `POST API/v1/auth/token` | Code exchange and token refresh | Code + verifier, or refresh token |
| `GET API/v1/me`, `GET API/v1/me/entitlements` | After sign-in, on focus (30 s throttle) | Access token |
| `GET API/.well-known/jwks.json` | Debug builds only, when no key is pinned | Nothing |
| `POST API/v1/auth/logout` | Sign out | Refresh token |
| Opens account/pricing pages in the browser (`openServerPage`) | User clicks | Nothing from the app |
| `POST API/v1/beta/redeem` (`src/screens/BetaGate.tsx`) | Closed beta only, once | Invite code |

## Credits (`src-tauri/src/credits.rs`)

| Call | When | Sends |
| --- | --- | --- |
| `GET API/v1/credits/pricing`, `/balance`, `/history` | Credits UI, before AI actions | Access token |
| `POST API/v1/credits/debit`, `/refund`, `/reconcile` | AI action starts / fails / offline spends sync | Action id, units, idempotency key |
| Opens `API/credits/buy?pack=...` in the browser | User buys credits | Nothing from the app |

## Surecast (`src-tauri/src/surecast.rs`, `src/components/publish/*`)

Only after the user connects Surecast (API key kept in the OS keychain).

| Call | When | Sends |
| --- | --- | --- |
| `GET <surecast>/v1/me`, `/v1/clients`, `/v1/openapi.json` | Connect, settings | API key |
| `POST /v1/media` or `/v1/media/uploads` (+ `PUT`, `/complete`) | Send to Surecast | The exported video and cover image |
| `POST /v1/posts` | Send to Surecast | Client id, post text, media ids, title, hook, caption, hashtags, SRT, language, project id/name, duration, aspect |
| `GET /v1/posts/<id>` | Status refresh | API key |
| Opens Surecast pages in the browser | User clicks | Nothing from the app |

## Updates (`src-tauri/src/updates.rs`, `tauri.conf.json`)

| Call | When | Sends |
| --- | --- | --- |
| Tauri updater manifest (`plugins.updater.endpoints`) | Update check | Target, arch, current version (in the URL) |

The endpoint is still the placeholder `https://api.example.com/...` and `pubkey` is empty: set both before release.

## Model downloads (first use of a feature)

| Source | Feature |
| --- | --- |
| huggingface.co/ggerganov/whisper.cpp | Captions |
| github.com/opencv/opencv_zoo, github.com/snakers4/silero-vad | Reframe |
| huggingface.co/onnx-community/mediapipe_selfie_segmentation | Background |
| raw.githubusercontent.com/GregorR/rnnoise-models | Voice clean-up |
| huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX, raw.githubusercontent.com/hexgrad/misaki | Voiceover |
| huggingface.co/hari31416/indictrans2-* | Translation / dubbing |

Plain GET requests, no identifiers. All can be redirected to our own server with `VERSO_MODEL_MIRROR` (see
[MODELS.md](MODELS.md)).

## Crash reports (`src-tauri/src/crash.rs`, opt-in)

Crashes are written locally. Nothing is sent until the user agrees on the next launch; then
`POST API/v1/crash-reports` with app version, OS and a stack trace with the home folder scrubbed.

## Links the user clicks

Settings licence links (GitHub, ffmpeg.org) open in the browser only on click.

## Not on the network

Fonts are bundled (`@fontsource`, `src-tauri/fonts`), no web fonts or analytics, no telemetry. The webview CSP
is currently `null`; tightening it to the API and Surecast origins is a hardening item for release.
