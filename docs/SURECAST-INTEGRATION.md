# Surecast integration

Verso hands finished reels to **Surecast** (Agape Labs' social scheduler, `https://app.surecast.live`). The handshake is deliberately small:

1. **Connect** in Verso Settings with a Surecast workspace API key. The key is kept in the OS keychain.
2. **Send to Surecast** after export: Verso uploads the video and a cover, and creates a **draft** post. It then opens the post in Surecast's web app, where the user picks accounts and a time.
3. **Status back**, read-only: the Welcome screen lists sent reels with their Surecast status (draft, scheduled, posted, failed) and links.

Scheduling, calendars, best times, brand kits and analytics stay in Surecast. Gaps are listed in [SURECAST-API-NEEDS.md](SURECAST-API-NEEDS.md).

Studied from the Surecast source (main branch, Oct 2026 bundle), read-only. Surecast is one Node 22 app: Hono API under `/v1`, React web app, MySQL. Errors are JSON `{ "error": "plain message", "details"?: [...] }`.

## Auth

Surecast has two kinds of auth:

| Kind | How | Fit for Verso |
|---|---|---|
| Session | 6-digit email code, opaque token in an httpOnly `sc_session` cookie (same-origin web app only) | No: cookie-bound, no token endpoint |
| API key | `Authorization: Bearer sc_live_...`, created in Surecast > Settings > API keys (owner/admin only). Acts for one workspace with **editor** rights. Stored hashed; no expiry; revocable | **Yes**, used by Verso |

There is no OAuth/PKCE authorization server, so Verso can't do a loopback sign-in like its own accounts (`src-tauri/src/account.rs`). The user pastes a key once; Verso checks it with `GET /v1/me` and saves it with the `keyring` crate (service `com.agapelabs.verso`, user `surecast-token`). The key never reaches JavaScript after it is entered: every request is made in Rust.

## Endpoints Verso uses

All paths are relative to the Surecast address (Settings field, default from `VITE_SURECAST_URL`).

| Use | Request | Response (fields Verso reads) |
|---|---|---|
| Check key, show who's connected | `GET /v1/me` | `{ user: { id, email, name }, workspaces: [{ id, name, timezone, role }], workspaceId }` |
| Feature detection (public) | `GET /v1/openapi.json` | OpenAPI 3.1, `paths` keyed without `/v1` (e.g. `"/clients/{id}/queue"`) |
| Brands to post for | `GET /v1/clients` | `{ clients: [{ id, name, timezone, color, archivedAt, channelCount, ... }] }` |
| Upload video and cover | `POST /v1/media`, `multipart/form-data`, field `file` (+ optional `alt`) | `201 { media: { id, filename, mime, size, alt, url, storage } }` |
| Create the draft | `POST /v1/posts` JSON `{ clientId, body, mediaIds: [videoId], action: "draft" }` | `201 { post: { id, status, ... } }` |
| Read status back | `GET /v1/posts/{id}` | `{ post: { id, status, scheduledAt, targets: [{ platform, status, remoteUrl, publishedAt, error }] } }` |
| Open in the web app | browser `GET {base}/posts/{id}/edit` | Surecast composer for the draft |

### Upload limits and formats

- Single request only: the server reads the whole multipart body, sniffs the bytes and stores videos in 4 MB DB chunks (or the workspace's Google Drive).
- **Videos: MP4, MOV, WebM, up to 100 MB. Images: JPEG, PNG, GIF, WebP, up to 10 MB.** File type comes from magic bytes, not the name.
- No presigned URLs, no chunked or resumable upload. Verso streams the multipart body from disk in Rust (`ureq`, `Content-Length` set) so large files never sit in JS memory, and refuses files over 100 MB with a plain message.

### Post model (relevant parts)

- A post belongs to one **client** (brand) and targets channels of that client (`post_targets`, one per channel). `body` is shared; `overrides[channelId]` can replace it per channel.
- `action`: `draft` (no validation, no channels needed) · `now` · `schedule` (+ `scheduledAt` ISO) · `queue` (next weekly slot).
- Post `status` (rolled up from targets): `draft`, `awaiting_approval`, `changes_requested`, `scheduled`, `publishing`, `published`, `partial`, `failed`, `paused`, `held`, `removed`, `cancelled`.
- Unknown JSON fields are ignored, so Verso's extra package fields (below) are safe to send today.

### How Surecast publishes video

Each network is an adapter with limits (`server/src/platforms/*`). Today **only YouTube and TikTok accept video** (`videoTypes` MP4/MOV/WebM, 100 MB). YouTube uses the **first line of the body as the title**. TikTok posts are private until TikTok audits the app. **Instagram, Facebook, Threads, LinkedIn and X have no video support yet**, so a reel draft can't be scheduled to Instagram Reels until Surecast adds it. A video post takes exactly one video and no images.

## What Verso sends

`POST /v1/posts` body:

```json
{
  "clientId": "cli_…",
  "body": "Title\n\nHook\nCaption\n\n#tag #tag",
  "mediaIds": ["med_video"],
  "action": "draft",
  "coverMediaId": "med_cover",
  "externalRef": "verso:<project.id>",
  "verso": {
    "projectId": "…", "projectName": "…", "title": "…", "hook": "…", "caption": "…",
    "hashtags": ["#…"], "captionsSrt": "1\n00:00:00,000 --> …", "language": "hinglish",
    "durationSec": 31.4, "aspect": "9:16"
  }
}
```

Surecast stores `clientId`, `body` and `mediaIds` today. The cover is uploaded to the media library (it can't be attached to a video post yet) and `coverMediaId`, `externalRef` and `verso` are ignored until Surecast adds them. The job id is sent as `Idempotency-Key` for the same reason.

## Verso side

| Piece | File |
|---|---|
| Keychain, HTTP, persistent queue, worker, cover frame (FFmpeg), status read-back | `src-tauri/src/surecast.rs` |
| Frontend API, polling hook, SRT from caption clips, best-frame scoring, status labels | `src/lib/surecast.ts` |
| Offline caption + hashtag writer (EN / HI / Hinglish, TF-IDF, niche tag sets, pluggable) | `src/lib/captionWriter.ts` |
| Settings section | `src/components/publish/SurecastSettings.tsx` |
| Send dialog | `src/components/publish/PublishDialog.tsx` |
| Welcome list | `src/components/publish/SentToSurecast.tsx` |

**Queue.** Jobs live in `<app data>/surecast-queue.json` (atomic write). Steps are saved as they finish (cover, video media id, cover media id, post id), so a restart resumes where it stopped. Offline, 429 and 5xx errors retry with backoff (30 s doubling to 1 h, 8 tries); other 4xx fail at once with Surecast's own message. If Surecast lists `/media/uploads` in its OpenAPI, Verso uses the proposed resumable upload and resumes from the server's offset.

**Events.** `publish://progress` `{ jobId, phase: "uploading" | "creating", sent, total }`, `publish://done` `{ jobId, postId }`, `publish://failed` `{ jobId, error }`.

**Status.** `surecast_refresh` reads `GET /v1/posts/{id}` for up to 20 sent jobs. The list polls every 3 minutes and on window focus. Surecast owns schedule and status; Verso only displays them.

**Cover.** Frames come from `useFilmstrip` on the exported file. Verso picks the sharpest, best-lit frame (edge energy on a 64 px canvas, brightness near mid-grey, first/last frames down-weighted); the user can click another. Rust grabs that moment with FFmpeg at 1080x1920 (9:16), 1080x1080 (1:1) or 1280x720 (16:9). No face scoring yet.

## Wiring (files this branch does not edit)

ExportDialog done state, next to "Open folder" (`src/components/editor/ExportDialog.tsx`):

```tsx
import { PublishDialog } from "../publish/PublishDialog";
const [publishing, setPublishing] = useState(false);
// in the phase.step === "done" actions:
<Button onClick={() => setPublishing(true)}>Send to Surecast</Button>
// after the dialog markup:
{publishing && phase.step === "done" && (
  <PublishDialog outputPath={phase.outputPath} project={project} aspect={aspect} onClose={() => setPublishing(false)} />
)}
```

Keep "Open folder" as the one Ember button there, or make "Send to Surecast" primary and demote "Open folder"; only one should be Ember.

Welcome (`src/screens/Welcome.tsx`), under the recent projects:

```tsx
import { SentToSurecast } from "../components/publish/SentToSurecast";
<SentToSurecast />
```

It renders nothing until something has been sent, and mounting it also restarts any unsent jobs after a restart.
