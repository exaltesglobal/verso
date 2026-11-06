# Verso — Editing model, `.verso` project format, and packaging

Spec for an engineer implementing timeline editing, undo/redo, autosave, the project file, and the release pipeline. It extends the existing code: `src/lib/project.ts` (flat `Project { name, tracks[] }`), `src/screens/Editor.tsx` (React state, playhead clock, Space key), `src-tauri/src/commands/{media,thumbnails}.rs` (ffprobe/ffmpeg sidecar via `tools.rs`, cache under `app_cache_dir()`). Nothing here needs the network except the updater and the opt-in reporting at the end.

Facts marked "verified" were checked on 2026-11-06 at the URL given. Everything else is design. Automated tests and debugging runs happen only when the owner asks; this document only describes them.

---

## 1. Editing model (`src/lib/project.ts`, split into `src/lib/model/*.ts`)

### 1.1 Units, frame rate, ids

- All times are **integer microseconds** (`type Us = number`). Convert at the UI boundary (`secToUs`, `usToSec`).
- **Frame rate is never chosen by the user.** On the first video import into an empty project, `project.fps` = the media's `avg_frame_rate` snapped to the nearest of `{24/1, 25/1, 30000/1001, 30/1, 50/1, 60000/1001, 60/1}`; audio-only or empty projects use `30/1`. Later clips of other rates are placed without conforming (the renderer resamples). `r_frame_rate` is **never** used for the project rate: VFR phone recordings report 90000/1 or 1000/1 there. Consequence: `MediaInfo` must return `avg_frame_rate: { num, den } | null` (raw ffprobe fraction) in addition to the existing rounded `fps: f64`; the current fallback to `r_frame_rate` in `media.rs` moves behind the new field. Checklist item 1.
- Frame snapping is **by frame index**, never by accumulating a frame length: `frameToUs(n) = Math.round(n * 1e6 * den / num)`, `usToFrame(t) = Math.round(t * num / (1e6 * den))`. (Adding 33366.67 µs repeatedly drifts a frame every ~30 s at 29.97.)
- Ids are UUID v4 strings (`crypto.randomUUID()`), never the current `Date.now()` counter.

### 1.2 Types

```ts
export type Fraction = { num: number; den: number };
export type AspectRatio = "9:16" | "1:1" | "16:9";
export type TrackKind = "text" | "overlay" | "video" | "audio";   // top to bottom; captions are not a track
export type Ease = "linear" | "hold" | "easeOut" | "easeInOut";     // the only easings; every spec and the export compiler use this union

export interface MediaRef {                 // one per imported file, in project.media
  id: string;
  absPathHint: string;                      // last known absolute path; relPath is NOT stored here (see §3.3)
  fileName: string; sizeBytes: number; mtimeMs: number;
  sha1Head: string;                         // non-cryptographic fingerprint: SHA-1 of first 1 MiB + size. The ONLY media fingerprint in Verso.
  durationUs: Us; width: number | null; height: number | null; fps: Fraction | null;
  hasVideo: boolean; hasAudio: boolean;
  analysisKey?: string;                     // auto-clips spec: thumbnails.rs::cache_key of the last analysis, so reopening never re-analyses
}
export type MediaStatus = "ok" | "missing";  // runtime map in Editor state: Record<mediaId, MediaStatus>, never saved

export interface Keyframe<T> { atUs: Us; value: T; ease: Ease }                          // atUs is CLIP-relative
export interface Transform { x: number; y: number; scale: number; rotateDeg: number }  // x,y: fraction of canvas size, 0 = centre
export interface CropRect { l: number; t: number; r: number; b: number }                 // fractions of source

export interface ClipBase {
  id: string; trackId: string; startUs: Us; durationUs: Us; label: string; locked?: boolean;
  opacity?: Keyframe<number>[];              // 0..1; absent = 1
  slotId?: string; sceneId?: string;         // templates spec: which template slot/scene produced this clip
}

export interface MediaClip extends ClipBase {
  kind: "video" | "audio";
  mediaId: string;
  inUs: Us;                                  // source in-point; out = inUs + durationUs * speed
  speed: number;                             // 0.1 .. 10
  volume: number; muted: boolean;            // 0 .. 2 linear
  transform: Keyframe<Transform>[];          // length >= 1
  crop: Keyframe<CropRect>[];                // clip-relative; punch-ins (auto-clips spec) are crop keyframes
  linkedId?: string;                         // the audio clip split from the same file (mutual)
  // audio clips only
  role?: "voice" | "music" | "sfx";          // set by the entry point (import = voice, Add music = music, Add sound effect = sfx), never by probing
  fadeInUs?: Us; fadeOutUs?: Us;
  enhance?: AudioEnhance;                    // auto-clips spec §8
  // video clips only
  reframe?: Reframe;                         // speaker-detection-and-reframe spec §4; applied before `crop`
  maskClipId?: string;                       // templates spec: id of a ShapeClip in the same scene used as a luma mask
}
export interface TextClip extends ClipBase {
  kind: "text"; text: string;                // rendered text; Devanagari is plain UTF-8
  template?: string;                         // raw "{{var}}" form kept by the templates spec
  style: TextStyle;                          // templates spec §2.1; stored inline so a project never depends on an installed pack
  animation?: "none" | "pop" | "slideUp";
  transform: Keyframe<Transform>[];
}
export interface ShapeClip   extends ClipBase { kind: "shape";   shape: ShapeSpec; transform: Keyframe<Transform>[] }   // overlay tracks; ShapeSpec in templates spec
export interface StickerClip extends ClipBase { kind: "sticker"; src: string;      transform: Keyframe<Transform>[] }   // src relative to the pack, copied into the project folder on save
export type Clip = MediaClip | TextClip | ShapeClip | StickerClip;

// Captions (owned by the captions spec; types reproduced here because they are part of the saved project).
// Words are stored in SOURCE time, bound to the clip they were heard in; timeline time is derived (captions spec §3.1),
// so trims, moves and splits never lose caption data and the ripple rule never touches them.
export interface CaptionWord { id: string; clipId: string; sourceStartUs: Us; sourceEndUs: Us; text: string; asrText: string;
  confidence: number; roman?: string; speaker?: number }
export interface CaptionLine { id: string; wordIds: string[]; pinned?: boolean }
export interface CaptionTrackData {
  version: 1; language: string /* ISO 639-1: "hi", "mr", "en" */; translatedFrom?: string; script: "native" | "roman"; model: string;
  visible: boolean;
  words: CaptionWord[]; lines: CaptionLine[]; style: CaptionStyle;      // CaptionStyle: captions spec §5.1
  coverage: Record<string /* mediaId */, { startUs: Us; endUs: Us; model: string; lang: string }[]>;
}

export type TransitionKind = "crossfade" | "dip-black" | "slide" | "wipe" | "zoom";   // "cut" = no Transition record
export interface Transition { id: string; trackId: string; leftClipId: string; rightClipId: string;
  kind: TransitionKind; direction?: "left" | "right" | "up" | "down"; durationUs: Us }   // video tracks only, MediaClip pairs only
export interface Marker { id: string; atUs: Us; label: string; colour: "ember" | "mint" | "sky" | "sand" }
export interface Track { id: string; kind: TrackKind; label: string; muted: boolean; hidden: boolean; clipIds: string[] }

export interface Project {
  schemaVersion: 2;
  id: string; name: string; subtitle?: string;
  fps: Fraction; aspect: AspectRatio; width: number; height: number;
  media: Record<string, MediaRef>;
  tracks: Track[];                           // top to bottom: text..., overlay..., video..., audio...; captions are not a track
  clips: Record<string, Clip>;
  captions: CaptionTrackData[];              // 0..2 entries: the primary track and, optionally, one with `translatedFrom`
  transitions: Record<string, Transition>;
  markers: Marker[];
  audio: { duck: boolean; duckDb: number };  // music-under-voice ducking (export spec §3.6); default { duck: true, duckDb: -12 }
  analyses: Record<string, SourceAnalysis>;  // keyed by mediaId; reframe spec §4 (compact summary only, no cache dependency)
  template?: { packId: string; templateId: string; packVersion: string; variables: Record<string, string | boolean> };
  view: { playheadUs: Us; zoom: number };    // saved, never undoable
}
```

**Ownership.** This file is the single source of truth for the saved project. Types referenced but defined elsewhere are imported from the owning spec, never redefined: `TextStyle`, `ShapeSpec` (templates spec §2.1), `CaptionStyle` (captions spec §5.1), `AudioEnhance` (auto-clips spec §8), `Reframe`, `SourceAnalysis` (reframe spec §4). Other specs may **add optional fields** only by amending this block. Anything a spec needs in seconds (FFmpeg arguments, Rust solvers) is converted at the boundary with `usToSec`/`secToUs`; nothing in `Project` is in seconds.

Caption text and `TextClip.text` are UTF-8 JSON (Devanagari is fine); rendering needs a bundled Devanagari-capable font; the bundled font set is defined in the templates spec §7. `Record<string, Clip>` spreads are O(n) per op; at the 500-clip target that is well under 1 ms, so no immer.

`toSerializable(project): Project` is the single function that produces what goes to disk: it strips nothing from the type above (status lives outside the project) and normalises key order so round-trip diffs are stable. `toRust` boundary: Rust mirrors only `MediaRef` and the header; the rest is `serde_json::Value`.

```rust
#[derive(Serialize, Deserialize)] #[serde(rename_all = "camelCase")]
pub struct MediaRef { pub id: String, pub abs_path_hint: String, pub file_name: String, pub size_bytes: u64, pub mtime_ms: i64,
  pub sha1_head: String, pub duration_us: i64, pub width: Option<u32>, pub height: Option<u32>, pub fps: Option<Fraction>,
  pub has_video: bool, pub has_audio: bool }
#[derive(Serialize, Deserialize)] pub struct Fraction { pub num: u32, pub den: u32 }
#[derive(Serialize)] #[serde(rename_all = "camelCase")] pub struct Fingerprint { pub size_bytes: u64, pub mtime_ms: i64, pub sha1_head: String }
#[derive(Serialize)] #[serde(rename_all = "camelCase")] pub struct SaveReceipt { pub bytes: u64, pub saved_at_ms: i64 }
#[derive(Serialize)] #[serde(rename_all = "camelCase")] pub struct ResolvedMedia { pub id: String, pub path: Option<String>, pub how: String /* rel|abs|search|missing */ }
#[derive(Serialize)] #[serde(rename_all = "camelCase")] pub struct RecoverEntry { pub project_id: String, pub name: String, pub original_path: Option<String>, pub saved_at_ms: i64, pub app_version: String }
```

SHA-1 is used only as a fingerprint (`sha1` crate, MIT OR Apache-2.0); it is not a security control.

### 1.3 Invariants (`validate(project): string[]`)

1. Clips on one track never overlap (`prev.start + prev.duration <= next.start`).
2. `durationUs >= 1 frame`; `inUs >= 0`; `inUs + durationUs*speed <= media.durationUs + 1 frame`.
3. Every `clipId` in a track exists in `clips` with matching `trackId`; every clip is in exactly one track.
4. Transitions join two `MediaClip`s on the same **video** track, adjacent (`left.end == right.start`), `durationUs <= min(left.durationUs, right.durationUs)`. Timeline positions never move for a transition: the renderer extends each side by `durationUs/2` into spare source footage ("handles") and, where a side has none, freezes its edge frame (export spec §3.5), telling the user once. Linked audio clips crossfade for the same duration.
5. Keyframes sorted by `atUs`, unique, within `[0, durationUs]`.
6. Every `MediaClip.mediaId` exists in `project.media`; `linkedId` is mutual and the linked clip has identical `startUs`, `durationUs`, `speed`.

`validate` runs in tests and **after** every op in dev builds. Before a save it runs but **never blocks**: a failure logs, is attached to crash telemetry if opted in, and the save proceeds. Blocking autosave on an invariant bug is how users lose work.

### 1.4 Operations (`src/lib/model/ops.ts`)

```ts
export interface Command {
  type: string; label: string;               // "Move clip" -> Edit menu "Undo Move clip"
  apply(p: Project): OpResult;
  invert(before: Project): Command;          // MANDATORY on every op; used by undo and by the inverse-law tests
  coalesceKey?: string;                      // same key within 400 ms -> merge (drags, sliders, typing)
}
type OpResult = { ok: true; project: Project } | { ok: false; project: Project; reason: "overlap" | "locked" | "no-handle" | "too-short" | "out-of-source" | "in-use" };
```

**One ripple rule, applied everywhere.** When an op has `ripple: true` and changes the timeline length by `delta` at point `cutUs`:
- every clip on **every** track with `startUs >= cutUs` shifts by `delta` (locked tracks included; a locked track refuses only edits to its own clips);
- markers at `>= cutUs` shift by `delta`. Caption words are **not** shifted: they are bound to a clip and stored in source time, so they move, trim, split (`captions.rebindOnSplit`) and hide with their clip; a word whose clip range no longer covers it is hidden, not deleted, and returns on undo;
- linked clips (`linkedId`) move, trim, split, delete and change speed together until explicitly unlinked (`unlink` op).
Law (§7): after a ripple edit, everything that was `k` µs after `cutUs` is still `k` µs after it.

**Transitions and length.** A transition never changes timeline positions (invariant 4): templates and auto-edits that want a crossfade place the clips **adjacent** and add a `Transition` record; the total duration of a track is the sum of its clip durations regardless of transitions.

| Op | Inputs | Behaviour |
|---|---|---|
| `move` | clipIds[], deltaUs, targetTrackId?, ripple, snap | Snap candidates: clip edges on all tracks, playhead, markers, 0; nearest within `thresholdUs` (8 px / pps). Non-ripple: fail `overlap` if the result overlaps. Ripple: apply the ripple rule with `cutUs = min(start)`, `delta = deltaUs` (push-down only; moving earlier is non-ripple). Fail `locked` on a locked track. |
| `trimStart` / `trimEnd` | clipId, newEdgeUs, ripple | Start: adjust `startUs`, `inUs`, `durationUs`; end: `durationUs`. Clamp to source (`out-of-source`) and to neighbours (non-ripple). Transitions on the edge shorten, then drop if `< 1 frame`. |
| `split` | atUs, trackIds? | For each unlocked clip strictly containing `atUs`: `a.durationUs = atUs - start`; `b = {...clip, id: new, startUs: atUs, inUs: inUs + (atUs-start)*speed, durationUs: rest}`; keyframes split with an interpolated keyframe at the cut. Linked clips split together. Inverse `join` restores ids. |
| `delete` | clipIds[], ripple | Remove clips and their transitions. Ripple: per contiguous removed range, apply the ripple rule with `delta = -rangeLength`. |
| `lift` | clipIds[] | `delete` with `ripple:false`. |
| `duplicate` | clipIds[] | Insert copies right after the last selected clip on the same track; ripple-push if there is no room. |
| `overwrite` | mediaId, inUs, durationUs, atUs, trackId | Place; clips under it are trimmed/split, covered material gone. |
| `insert` | same | Ripple rule with `cutUs = atUs`, `delta = +durationUs`, then place. |
| `setSpeed` | clipId, speed, keepDuration | `durationUs' = durationUs * speed/speed'` unless `keepDuration`; clamp to source; linked clip follows. |
| `setVolume` / `setMuted` / `setKeyframe` / `removeKeyframe` | | trivial upserts |
| `addTransition` / `removeTransition` / `setTransitionDuration` | | invariant 4; `no-handle` on failure |
| `addMarker` / `moveMarker` / `removeMarker` / `editCaptions` | | `words`/`lines` of one caption track replaced wholesale (word-text edits coalesce per word within 1 s) |
| `setReframe` / `setEnhance` / `setRole` | clipId, value | trivial upserts of the optional fields owned by the reframe and auto-clips specs |
| `addMedia` / `removeMedia` | MediaRef / mediaId | Media bin only (matches `LeftPanel.onAddToTimeline` separation). `removeMedia` with dependants fails `in-use`; toast "This file is used in 3 clips. Remove those clips first?" with one-click **Remove all** (runs `delete` ripple:false then `removeMedia`). |
| `setAspect` | aspect | Undoable. Sets `width/height` to the preset (1080x1920, 1080x1080, 1920x1080). `Transform.x/y` are canvas fractions, so they keep their relative place; `scale` is unchanged, so a clip framed for 9:16 shows pillar/letter-boxing until the user re-frames (the one-click "Fit" button in the Inspector does that). |
| `renameProject` / `setSubtitle` | string | `coalesceKey = "rename"` so TopBar per-keystroke calls undo as one step. |
| `addTrack` / `removeTrack` | kind, index / trackId | Second video track for B-roll/PiP. `removeTrack` with clips fails `in-use`. |
| `unlink` | clipId | Clears `linkedId` on both sides. |

Toasts: *overlap* → "There's already a clip there. Turn on Ripple to push the later clips along."; *locked* → "That track is locked. Unlock it from the track header."; *no-handle* → "That transition is longer than one of the clips. Pick a shorter one."; *too-short* → "Clips can't be shorter than one frame."

**Ripple control.** One visible **Ripple** toggle button in the timeline toolbar (default **on**: creators expect "cut it out" to close the gap). Modifier keys are secondary and only invert the toggle for the duration of one gesture: hold `Shift` while pressing Delete or while dragging. `Alt` is **not** used (a bare Alt press focuses the Windows menu bar). Toast copy says "Shift" on Windows and "Shift" on macOS too, so no platform branch is needed.

### 1.5 History (`src/lib/model/history.ts`)

```ts
interface Entry { cmd: Command; inverse: Command; before: Project; at: number }
interface History { past: Entry[]; future: Entry[]; limit: 200 }
export function execute(h, p, cmd): [History, Project]   // apply; on ok push {cmd, inverse: cmd.invert(p), before: p}; clear future
export function undo(h, p): [History, Project]           // pop past; project = entry.inverse.apply(p).project; push to future
export function redo(h, p)                               // pop future; re-apply entry.cmd
```

Undo **uses `invert()`**; the `before` snapshot is kept only as a safety net: if `inverse.apply` fails or `validate` reports errors in dev builds, restore `before` and log. Structural sharing keeps 200 snapshots cheap. Coalescing: a drag emits `move` with `coalesceKey = "move:" + sortedIds + ":" + gestureId`; `execute` merges into `past[last]` when the key matches and `at` is within 400 ms, keeping the first entry's `inverse`/`before` and replacing `cmd` with the composed command. `gestureId` changes on `pointerup`.

React wiring: `useReducer` in `Editor.tsx` with actions `{type:"exec", cmd} | {type:"undo"} | {type:"redo"} | {type:"load", project} | {type:"view", ...}`. View actions bypass history.

### 1.6 Keyboard map (`src/lib/shortcuts.ts`)

Ignored while focus is in `input, textarea, [contenteditable]`. `Mod` = Ctrl on Windows, Cmd on macOS; `Alt` is shown as Option on macOS.

| Key | Action |
|---|---|
| Space | Play/pause |
| J / K / L | **Reserved**: implemented with the preview engine (reverse HEVC decode is not trivial); no-op until then |
| ← / → | Step one frame; Shift = 1 s; Home / End |
| ↑ / ↓ | Previous / next clip edge |
| S | Split at playhead |
| Delete / Backspace | Delete selected using the Ripple toggle; Shift inverts the toggle for this press |
| Mod+Z / Mod+Y / Mod+Shift+Z | Undo / Redo |
| Mod+D, Mod+S, Mod+Shift+S | Duplicate, Save, Save as |
| M | Add marker |
| I / O | Trim start / end of selected clip to playhead |
| Mod+A, Esc | Select all on track / clear |
| = / − / Shift+Z | Zoom in / out / fit |
| Shift while dragging | Invert the Ripple toggle for this drag; `Mod` while dragging disables snap |

---

## 2. Autosave and crash recovery

- Editor state is the source of truth; Rust owns the disk. Two commands (§4): `save_project` (user's `.verso`) and `autosave_project` (app data). Both return `SaveReceipt` so the TopBar can show "Saved 2 s ago".
- **Autosave target**: `<app_data_dir>/autosave/<projectId>.json` (plain `project.json`, compact JSON, no ZIP, no posters) plus `<projectId>.meta.json { originalPath: string|null, savedAtMs, appVersion, schemaVersion }`. Trigger: debounce 2 s after the last history change, max 30 s while dirty, on window blur, and on `CloseRequested`. Serialisation runs in a Web Worker (`toSerializable` + `JSON.stringify`), never on the React render path. Budget: < 50 ms for 500 clips (~1 MB); < 250 ms for a 3-hour podcast with word cues (~4 MB). Manual save pretty-prints; autosave does not.
- **Close handling**: the JS `onCloseRequested` handler calls `event.preventDefault()`, awaits `autosave_project`, then shows the dirty prompt if needed, and finally calls `getCurrentWindow().destroy()`. Without the `preventDefault` the process exits mid-write.
- **Atomic write (both commands)**: write `<target>.tmp` in the **same directory** (same volume, so rename is a move), `fsync` the file, `rename` over the target, and on macOS/Linux `fsync` the parent directory. On Windows `std::fs::rename` maps to `MoveFileExW(MOVEFILE_REPLACE_EXISTING)` and fails with `ERROR_SHARING_VIOLATION`/`ERROR_ACCESS_DENIED` while Defender, OneDrive/Dropbox or an Explorer preview holds the target: retry up to 10 x 100 ms, then fail with "We couldn't save because another program is using the file. Close any app that has it open (OneDrive or antivirus can hold it for a moment) and try again." Never truncate the real file first. `Cargo.toml` sets `panic = "abort"`, so the whole save path is `unwrap`-free; every error is a `String`.
- Manual save (Mod+S) writes the user's path, then deletes `<projectId>.json` + `.meta.json`.
- **Autosave cleanup**: deleted on manual save, on *Don't save* in the dirty-close prompt, on a clean exit of a non-dirty project, and on *Discard* in recovery.
- **Crash recovery**: on launch `list_recoverable()` returns entries whose `meta.savedAtMs` is newer than the original's mtime (or whose original is missing). Entries whose `meta.schemaVersion` is newer than the running app are listed with `tooNew: true`; the sheet shows "This was saved by a newer Verso. Update Verso to restore it." instead of parsing. Otherwise: "Verso closed unexpectedly while you were editing **Reel 3**. Restore your unsaved work?" *Restore* / *Discard*. Restore loads the autosave, marks dirty, keeps `originalPath`. History is not recovered.
- Dirty-close prompt: "Save changes to Reel 3 before closing?" *Save* / *Don't save* / *Cancel*.

---

## 3. `.verso` project file

### 3.1 Container

A `.verso` file is a **ZIP** (store-only) with:

```
project.json          Project (toSerializable output), UTF-8, pretty-printed
thumbs/<mediaId>.jpg  one 320 px poster per media item, produced by Rust (never round-tripped through the webview)
README.txt            "This is a Verso project. Open it with Verso. Your videos are not inside this file."
```

`zip` crate 9.4.1, licence **MIT** (verified https://crates.io/api/v1/crates/zip). Reading `project.json` from a 10 MB `.verso` must take < 100 ms. Filmstrips stay in `app_cache_dir()/filmstrips`. The ZIP is not git-diffable; a dev-only `verso-cli dump <file.verso>` prints `project.json` for diffs.

Schema: `schemas/verso-project-v2.schema.json`, **JSON Schema draft-07**, generated with `ts-json-schema-generator` 2.9.0 (MIT; it hard-codes `$schema: "http://json-schema.org/draft-07/schema#"`, verified https://raw.githubusercontent.com/vega/ts-json-schema-generator/next/src/SchemaGenerator.ts) and validated on load with the default `Ajv` class from `ajv` 8.20.0 (MIT; draft-2020-12 would need `ajv/dist/2020`, verified https://ajv.js.org/json-schema.html). Root schema sets `additionalProperties: true` and Ajv runs with `removeAdditional: false`, so unknown top-level keys from a newer Verso survive a load/save round trip. Older Verso warns: "This project was made with a newer Verso. Some things may not show. Update Verso to see everything."

### 3.2 Versioning and migrations

`schemaVersion` is an integer. `src/lib/model/migrate.ts` exports `MIGRATIONS: Record<number, (raw: unknown) => unknown>` keyed by the version upgraded *from*. Load = parse → migrate until current → validate schema → fix-ups. **`MIGRATIONS` starts empty**: v1 was never written to disk, so the only "v1 data" is in-memory placeholder state; `appendMedia` and the placeholder project are rewritten directly against v2. The fixture harness (`tests/fixtures/migrations/`) ships with the empty map so the first real migration has a home. Never write an older version.

### 3.3 Media paths and relink

- `relPath` is **not stored in React state**. `toSerializable(project, targetDir: string | null)` computes `relPath` per media item from `absPathHint` against the folder of the file being written (POSIX separators; `""` when `targetDir` is null, the media is on another drive/volume, or the project has never been saved). For autosave `targetDir` is `originalPath`'s folder or null. On disk `MediaRef` therefore has one extra field `relPath: string`; on load it is consumed by `resolve_media` and dropped.
- **Save As** recomputes every `relPath` against the new folder and assigns a **new `project.id`** so two files never share one autosave slot or recovery entry.
- `resolve_media(projectDir, refs)`: 1. `projectDir/relPath` exists with matching size → `rel`; 2. `absPathHint` exists with matching size → `abs`; 3. search `projectDir` depth 3, max 20 000 entries, 2 s budget, for `fileName` + size, confirm `sha1Head` → `search`; 4. `missing`.
- Missing media UI: hatched "Missing" clips, preview "Can't find **ep42.mp4**", Inspector **Locate…** (after one pick, re-run step 3 in that folder for all others: "Found 3 more files in the same folder") and **Remove from project** (`removeMedia` flow). Size mismatch: "That file looks different from the one used in this project. Use it anyway?" then re-probe and clamp clips.
- Each resolved path is added to the asset-protocol scope, as `probe_media` does now.

### 3.4 Recent projects

`<app_data_dir>/recent.json` via `tauri-plugin-store` 2.x (Apache-2.0 OR MIT, verified https://github.com/tauri-apps/plugins-workspace; pin major `2`, 3.0.0-alpha exists): `{ entries: [{ path, name, lastOpenedMs, durationUs }] }`, max 12, de-duplicated by path. The poster shown on Welcome is read from the `.verso` ZIP by `load_project_preview`. Missing files show greyed "Moved or deleted" with *Remove from list*.

---

## 4. Tauri commands (`src-tauri/src/commands/project.rs`)

```rust
#[tauri::command] async fn save_project(app: AppHandle, path: String, project_json: String, poster_sources: Vec<PosterSource>) -> Result<SaveReceipt, String>;
//  PosterSource { media_id: String, path: String, at_sec: f64 }: Rust grabs each poster (thumbnails::grab_frame, height 320) in parallel
//  with a 3 s total budget, writes the ZIP, never sends bytes to the webview. Missing/unreadable media -> no thumb, save still succeeds.
#[tauri::command] async fn autosave_project(app: AppHandle, project_id: String, original_path: Option<String>, project_json: String) -> Result<SaveReceipt, String>;
#[tauri::command] async fn load_project(app: AppHandle, path: String) -> Result<String /* project_json */, String>;
#[tauri::command] async fn load_project_preview(app: AppHandle, path: String) -> Result<tauri::ipc::Response, String>;   // first poster JPEG as raw bytes
#[tauri::command] async fn list_recoverable(app: AppHandle) -> Result<Vec<RecoverEntry>, String>;
#[tauri::command] async fn load_recoverable(app: AppHandle, project_id: String) -> Result<String, String>;
#[tauri::command] async fn discard_recoverable(app: AppHandle, project_id: String) -> Result<(), String>;
#[tauri::command] async fn resolve_media(app: AppHandle, project_dir: Option<String>, refs: Vec<MediaRef>) -> Result<Vec<ResolvedMedia>, String>;
#[tauri::command] async fn media_fingerprint(path: String) -> Result<Fingerprint, String>;
```

`at_sec` for a poster = the in-point of the first clip using that media, else 10 % of duration, clamped to `duration - 0.05` as `frame_times` already does. Byte payloads never cross IPC as `Vec<u8>` (JSON arrays, 4-5x inflation); use `tauri::ipc::Response`.

Error strings: "We couldn't save your project. Check that the folder still exists and you have space on the drive." / "This file isn't a Verso project." / "This project is damaged and can't be opened. Try the backup Verso keeps: Help → Open recovery folder." `fs` scopes only for `$APPDATA/**` and `$APPCACHE/**`; user paths come through the dialog plugin.

---

## 5. Packaging

### 5.1 Updater (verified https://v2.tauri.app/plugin/updater/)

- `tauri-plugin-updater` 2.x and `tauri-plugin-process` 2.x (Apache-2.0 OR MIT; pin major `2`). Capabilities `updater:default`, `process:allow-restart`.
- Keys: `pnpm tauri signer generate -w ~/.tauri/verso.key`. Public key content in `plugins.updater.pubkey` of **both** `tauri.conf.json` and `tauri.sidecar.conf.json` (the `pnpm build:app` override config), together with `endpoints`. Private key + password only in GitHub secrets `TAURI_SIGNING_PRIVATE_KEY(_PASSWORD)`, with an offline copy in the company password manager (losing it strands every install).
- `bundle.createUpdaterArtifacts: true`. Endpoint `https://github.com/agapelabs/verso/releases/latest/download/latest.json`; `tauri-action` with `uploadUpdaterJson: true` (default, verified https://github.com/tauri-apps/tauri-action) builds `latest.json` from the release's assets. Releases are created as drafts; `latest.json` points at the published release only once a human publishes it, which is the "go live" step. If MSI is ever re-enabled, set `updaterJsonPreferNsis: true`. The release repo must be public (or mirror the JSON to GitHub Pages).
- `installMode: "passive"`. Check 10 s after launch and every 24 h; banner "Verso 1.2 is ready. Restart to update." *Restart now* / *Later*. Never force mid-edit. Toggle on by default, explained in one line. Failure: "We couldn't check for updates right now. We'll try again later."

### 5.2 Windows NSIS (verified https://v2.tauri.app/distribute/windows-installer/ and https://v2.tauri.app/reference/config/)

`bundle.targets: ["nsis"]`. `bundle.windows.nsis`: `installMode: "currentUser"`, `languages: ["English"]` — Tauri ships translated installer strings only for the languages in `tauri-bundler/.../nsis/languages/`; `English.nsh` exists there, `Hindi.nsh` does not (404 at https://raw.githubusercontent.com/tauri-apps/tauri/dev/crates/tauri-bundler/src/bundle/windows/nsis/languages/Hindi.nsh). Hindi is a valid NSIS language, so adding it means supplying our own translation via `customLanguageFiles: { "Hindi": "nsis/Hindi.nsh" }` and adding it to `languages`; until then English only. `displayLanguageSelector: false`, brand-kit `installerIcon`/`headerImage`/`sidebarImage` (original art). Tauri's uninstaller already shows its own "Delete the application data" checkbox (string `deleteAppData` in `English.nsh`); our `NSIS_HOOK_PREUNINSTALL` in `nsis/hooks.nsh` removes only the cache and **never** `autosave/`, whatever the checkbox says. `webviewInstallMode: { type: "embedBootstrapper" }`. Authenticode signing via `certificateThumbprint` with placeholder secrets. Bundle `licenses/FFMPEG-LICENSE.txt` and an About → Open source licences page generated with `cargo-about` 0.9.3 (MIT OR Apache-2.0) and `license-checker-rseidelsohn` 5.0.1 (BSD-3-Clause).

### 5.3 LGPL FFmpeg sidecar and macOS CI (verified https://v2.tauri.app/distribute/sign/macos/)

`--disable-gpl` alone is not enough: the build must also omit `libx264`, `libx265`, `libxvid`, `libvidstab`, `frei0r` and every other GPL component, and never `--enable-nonfree`. CI gate on every platform: `ffmpeg -L` must print the LGPL banner, `ffmpeg -encoders` must not list `libx264`/`libx265`. Product consequence: H.264 export uses `h264_nvenc` / `h264_qsv` / `h264_amf` when present, else `libopenh264` (BSD-2-Clause) as the CPU fallback; HEVC export is hardware-only and hidden when no encoder is found. Sidecars are cached as workflow artifacts keyed on the FFmpeg commit and sha256-verified before bundling.

Matrix in `.github/workflows/release.yml`: `windows-latest`, `macos-latest` for `aarch64-apple-darwin` and `x86_64-apple-darwin`. Secrets (placeholders until the Apple account exists): `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `KEYCHAIN_PASSWORD`, plus `APPLE_ID`/`APPLE_PASSWORD`/`APPLE_TEAM_ID` or `APPLE_API_ISSUER`/`APPLE_API_KEY`/`APPLE_API_KEY_PATH`. Until then the mac job signs ad-hoc (`APPLE_SIGNING_IDENTITY="-"`) with `continue-on-error`. Draft release; a human smoke-tests the installer on a clean VM and publishes.

### 5.4 Crash reporting (opt-in)

| Component | Licence | Verified |
|---|---|---|
| `sentry` 0.49.5 (Rust) with `minidump` feature → `sentry::minidump::MinidumpIntegration` | MIT | https://crates.io/api/v1/crates/sentry-minidump (official `getsentry/sentry-rust` workspace) |
| `sentry-rust-minidump` | deprecated: "use `sentry-minidump` instead … will get no more updates" | https://docs.rs/sentry-rust-minidump/latest/sentry_rust_minidump/ — **not used** |
| `@sentry/browser` 11.11.0 | MIT | https://github.com/getsentry/sentry-javascript/blob/develop/LICENSE |
| `tauri-plugin-sentry` 0.9.0 | MIT OR Apache-2.0 per crates.io metadata; the GitHub listing shows no LICENSE file | https://crates.io/api/v1/crates/tauri-plugin-sentry — optional |
| GlitchTip server (self-hosted) | MIT, Sentry-SDK compatible | https://gitlab.com/glitchtip/glitchtip-backend |

Default plan: `sentry` (Rust, minidump feature) + `@sentry/browser` with a custom transport that `invoke`s Rust, so one opt-in flag controls both and all traffic leaves through one scrubbed path. Windows minidump capture must be proven in CI (a deliberate `abort()` test build produces an event). `tauri-plugin-sentry` may replace the custom transport only after vendor-checking that the crate tarball contains the licence texts. Server: one self-hosted GlitchTip in an India-region VPS; nothing GPL/FSL ships to users.

Privacy: **off by default**; first-run sentence "Send anonymous crash reports to help fix Verso" with a toggle. `send_default_pii: false`, `server_name` stripped, `before_send` replaces drive/home paths with `<path>`, no project or media names. Payload: app version, OS, GPU vendor string, FFmpeg version, panic/stack, last 20 log lines. "Delete my crash data" sends the random, regenerable install id.

### 5.5 Analytics

Second, separate toggle "Share anonymous usage (which features are used)". `tauri-plugin-aptabase` is MIT (verified https://github.com/aptabase/tauri-plugin-aptabase) but the Aptabase server is **AGPL-3.0** (verified https://github.com/aptabase/aptabase). Whether self-hosting it satisfies the "NO GPL/AGPL" rule is the owner's call, not this spec's, and it adds a second Postgres service. Recommended: **defer analytics out of this milestone**; when picked up, choose GlitchTip custom events on the server we already run or self-hosted PostHog (MIT core). Events, if adopted: `app_opened`, `project_created`, `export_started {aspect, durationBucket}`, `export_finished {ok, seconds}`, `feature_used {name}`; no text, filenames or fine durations. Both toggles live in Settings → Privacy with "What we send" in plain words.

---

## 6. Performance targets

- Any single op on a 500-clip, 4-track project: < 2 ms (Vitest, `performance.now()`).
- Drag at 60 fps: coalesced `move` + render ≤ 16 ms; Timeline virtualised by `startUs`.
- Undo/redo via `invert()`: same bound as the op itself (< 2 ms).
- Autosave: budgets in §2, serialisation off the render path; `.verso` load → first paint < 400 ms excluding media resolve, which runs in parallel with "Finding your files…" after 300 ms.
- Memory: 200 history entries with structural sharing.

---

## 7. Test plan (written now, run when the owner says so)

**Property-based (Vitest + `fast-check` 4.10.2, MIT, https://github.com/dubzzz/fast-check/blob/main/LICENSE):**
- Arbitrary `Project`: 1–4 tracks, 0–40 clips, non-overlapping, speeds in {0.5,1,2}, random keyframes, valid transitions, linked pairs, cues, markers.
- For every op and random args: `ok` ⇒ `validate` passes; `!ok` ⇒ project unchanged.
- Inverse law: `cmd.invert(p).apply(cmd.apply(p).project).project` deep-equals `p` (ids preserved; view ignored). Undo/redo stack law for sequences ≤ 50.
- **Ripple law**: for ripple `delete`/`insert`/`move`/`trim`, every clip (all tracks) and marker that was `k` µs after `cutUs` is still `k` µs after it; every caption word's derived `timelineRange` moves with its clip; linked pairs stay identical in `startUs`/`durationUs`/`speed`.
- `join(split(p, t)) == p`; non-ripple ops leave total track duration unchanged; ripple delete preserves clip order.
- Frame math: `frameToUs(usToFrame(frameToUs(n))) == frameToUs(n)` for n up to 3 h at every supported rate; `snapFps` maps 29.970029 → 30000/1001 and 90000/1 (VFR) is rejected in favour of `avg_frame_rate`.
- Round trip: `parse(stringify(toSerializable(p, dir))) == p` after `relPath` is dropped; `resolveRel(dir, makeRel(dir, abs)) == abs` for Windows and POSIX paths on the same drive; `""` across drives.

**Rust (`cargo test` + `proptest` 1.12.0, MIT OR Apache-2.0):** atomic save survives a simulated kill between write and rename; rename retry succeeds after a transient `ERROR_SHARING_VIOLATION` (mock); ZIP round-trip for random `project.json` + posters; `resolve_media` with fixtures moved into sibling folders; `sha1Head` equal for identical content with different names; `MediaInfo.avg_frame_rate` parses `30000/1001`, `0/0` → null.

**Manual release checklist:** import → split → ripple delete → audio, captions and markers still aligned → undo all → identical; Task-Manager kill 5 s after an edit → Restore sheet → match; *Don't save* on close → no Restore sheet; move media folder → relink one → others found; per-user NSIS install without admin → signed update via test `latest.json` → relaunch; `ffmpeg -L` shows LGPL on the bundled sidecar.

---

## 8. Implementation checklist (ordered)

1. `media.rs`: add `avg_frame_rate: Option<Fraction>` to `MediaInfo`; stop using `r_frame_rate` for anything but display. TS: `Us`, `Fraction`, `frameToUs/usToFrame`, `snapFps`, UUID ids, v2 types, `validate()`, `toSerializable()`.
2. Adapt `appendMedia` and the placeholder project to v2; empty `MIGRATIONS` map + fixture harness.
3. Ops with mandatory `invert()`: move, trim, split, delete/lift, duplicate, overwrite/insert, setSpeed/Volume/Muted, keyframes, transitions, markers, captions, addMedia/removeMedia, setAspect, renameProject/setSubtitle, addTrack/removeTrack, unlink — with the ripple rule and fast-check laws written alongside.
4. `History` (invert-based undo, snapshot safety net, coalescing); `useReducer`; Undo/Redo in TopBar.
5. Timeline toolbar Ripple toggle, shortcut map, drag/snap/trim/split interactions, Inspector bindings.
6. Rust `project.rs`: atomic write with retry, ZIP, Rust-side posters, fingerprints, `load_project_preview` via `ipc::Response`; File menu + Mod+S/Save As (new id).
7. Autosave worker + `autosave_project`, `CloseRequested` flow, recovery sheet incl. `tooNew`, dirty-close prompt, cleanup rules.
8. `resolve_media`, relink UI, Recent projects.
9. Updater: keys, both config files, `createUpdaterArtifacts`, draft-release workflow.
10. NSIS settings (English only, hooks), installer art, licence page, Authenticode placeholder; LGPL CI gate; mac matrix with ad-hoc placeholders.
11. Privacy settings; crash reporting (`sentry` + minidump, `@sentry/browser`, custom transport, scrubbing tests) → GlitchTip. Analytics deferred pending the owner's AGPL decision.
12. Performance pass against §6; manual release checklist.
