# Surecast API needs (proposals for the Surecast team)

What the Verso to Surecast handshake (connect, send a reel as a draft, read status back) needs and Surecast doesn't have yet. These are proposals only; nothing here is built in Surecast. Verso already sends the proposed fields (Surecast ignores unknown JSON today) and feature-detects new endpoints from `GET /v1/openapi.json`, so each item starts working on Verso's side as soon as it ships and is listed there.

Priority: **P1** blocks a good experience, **P2** removes a workaround, **P3** nice to have.

## P1. Video on Instagram and Facebook

Reels go to Instagram first, but only the YouTube and TikTok adapters have `videoTypes`. Instagram, Facebook (and Threads) need video support:

- Instagram: Reels via `POST /{ig-user-id}/media` with `media_type=REELS`, `video_url` (Surecast's public `/m/{key}` URL works), `caption`, `cover_url` or `thumb_offset`, `share_to_feed`; poll `status_code` until `FINISHED`, then `media_publish`.
- Facebook Pages: `POST /{page-id}/video_reels` (upload phase start / transfer / finish).
- Set `limits.videoTypes = ['video/mp4','video/quicktime']`, `maxVideoBytes` per Meta's limits (Reels: up to 1 GB, 90 s for feed sharing).

## P1. Larger and resumable uploads

`POST /v1/media` reads the whole body in one request and caps videos at 100 MB. A 1080p minute at high quality is often over that, and a dropped connection restarts from zero.

```
POST /v1/media/uploads
  { "filename": "reel.mp4", "size": 248000000, "mime": "video/mp4", "sha256"?: "hex" }
  Idempotency-Key: <client id>          (same key returns the same upload)
→ 201 { "upload": { "id": "upl_…", "offset": 0, "size": 248000000, "chunkSize": 8000000, "expiresAt": "ISO" } }

PUT /v1/media/uploads/{id}
  Content-Type: application/octet-stream
  Content-Range: bytes 0-7999999/248000000
  <raw bytes>
→ 200 { "upload": { "id", "offset": 8000000, "size" } }     (409 with the current offset if the range doesn't start at it)

GET /v1/media/uploads/{id}
→ 200 { "upload": { "id", "offset", "size", "chunkSize", "expiresAt" } }

POST /v1/media/uploads/{id}/complete
→ 201 { "media": { "id": "med_…", "filename", "mime", "size", "url", "storage" } }   (verifies size, sniffs type, checks sha256 if given)
```

Chunks can reuse the existing `media_chunks` table. Keep the per-network `maxVideoBytes` checks at post validation. Verso uses this automatically when `/media/uploads` appears in `openapi.json`.

## P1. Desktop sign-in instead of pasted keys

API keys can only be made by workspace owners and admins, have no expiry, and act as editor for the whole workspace. Pasting one is awkward for editors and freelancers. Proposal, mirroring Verso's own accounts flow (loopback + PKCE, RFC 8252):

```
Browser: GET /desktop/connect?port=53682&code_challenge=…&code_challenge_method=S256&state=…&client=verso&device_name=…
  → user signs in (email code), picks a workspace, approves "Verso can upload and create drafts"
  → redirect http://127.0.0.1:{port}/callback?code=…&state=…
POST /v1/auth/token { grant_type: "authorization_code", code, code_verifier }
  → { access_token, refresh_token, expires_in, workspace: { id, name } }
POST /v1/auth/token { grant_type: "refresh_token", refresh_token }   (rotating)
POST /v1/auth/logout { refresh_token }
```

Tokens should carry a scope such as `media:write posts:draft posts:read`, and show up (revocable) next to API keys in Settings. Verso's `surecast.rs` would swap the pasted key for this flow; the rest of the integration stays the same.

## P2. Post package fields on `POST /v1/posts` and `PATCH /v1/posts/{id}`

| Field | Type | Why |
|---|---|---|
| `externalRef` | string ≤ 120, e.g. `verso:p…` | Link the post to the Verso project; find it again; show "From Verso" in the composer |
| `title` | string ≤ 100 | YouTube title without forcing it into the first body line; TikTok title |
| `coverMediaId` | media id (image) | Thumbnail per post: YouTube `thumbnails.set`, Instagram `cover_url`, TikTok cover. Today a video post rejects any image in `mediaIds` |
| `captionsSrt` | string (SRT) or `captionsMediaId` | YouTube `captions.insert`; burn-in is already done by Verso, but platform captions help reach and accessibility |
| `language` | BCP 47 (`en`, `hi`, `hi-Latn` for Hinglish) | YouTube `defaultLanguage`/`defaultAudioLanguage`; caption track language |
| `verso` | object `{ projectId, projectName, hook, caption, hashtags[], durationSec, aspect }` | Kept as metadata, shown read-only in the composer so the editor sees the source |

Also accept `.srt`/`.vtt` in `POST /v1/media` (text sniff) if a file is preferred over a field.

## P2. Find posts by reference

```
GET /v1/posts?externalRef=verso:p…
→ { posts: [ …postsJson… ] }
```

Lets Verso recover the post id if a create response was lost, and avoid sending the same reel twice.

## P2. Idempotent create

Honour `Idempotency-Key` on `POST /v1/posts` and `POST /v1/media` (store key + response for 24 h per workspace; same key returns the first response). Verso already sends its queue job id. Without it, a create whose response is lost on a flaky connection can make a duplicate draft when the queue retries.

## P3. Lighter status polling

Verso polls `GET /v1/posts/{id}` per sent post every 3 minutes (max 20). A batch call would cut that to one request:

```
GET /v1/posts?ids=pst_a,pst_b,…     (or ?externalRef=verso:*&updatedSince=ISO)
→ { posts: [ { id, status, scheduledAt, updatedAt, targets: [{ platform, status, remoteUrl, publishedAt, error }] } ] }
```

## P3. Status push for desktop apps

Webhooks (`post.published`, `post.failed`) need a public HTTPS receiver, which a desktop app doesn't have. Options, in order of preference:

1. `GET /v1/events?since=<cursor>` (long-poll, 30 s) returning `{ events: [{ id, type, postId, at, data }], cursor }`.
2. Server-Sent Events at `GET /v1/events/stream`.

Useful event types for Verso: `post.scheduled`, `post.rescheduled`, `post.published`, `post.failed`, `post.cancelled`, `post.deleted`. The same types would help existing webhook users.

## P3. Capability endpoint

Verso feature-detects by looking for paths in `/v1/openapi.json`. Fields can't be detected that way. A tiny public endpoint would make it exact:

```
GET /v1/capabilities
→ { apiVersion: "1.1", uploads: { resumable: true, maxVideoBytes: 1000000000 },
    posts: { externalRef: true, coverMediaId: true, captionsSrt: true, title: true },
    video: { instagram: true, facebook: true, youtube: true, tiktok: true } }
```
