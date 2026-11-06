# Verso spec: Templates, one-click reels and transitions

Status: implementation spec, Phase 4 ("Captions, templates and one-click edits"), revision 2 after adversarial review.
Fits the existing architecture: Rust Tauri commands in `src-tauri/src/commands/`, FFmpeg sidecar via `crate::tools`, React state in `src/lib/project.ts`, the `templates` tab in `src/components/editor/LeftPanel.tsx` (currently a placeholder grid).

## 1. Goals and non-goals

Goals
- A creator drops one long video or a few clips on a template and gets a finished 9:16 reel without touching the timeline.
- Templates are plain JSON, designed by us, previewable offline, swappable one drag at a time.
- One pack ships inside the installer. Free vs Pro gating is a flag, not a different file format.
- Five transitions (cut, crossfade, dip to black, slide, zoom) with matching results in the live preview and in the FFmpeg export.

Non-goals (other specs): auto-cut moment finding (this spec exposes a hook for it, 4.1), speaker reframing, caption transcription, the export compiler and encoder (the export spec owns the one filtergraph builder; this spec contributes the `OverlayRenderer`, the transition maths and the scene-composition rules it compiles), the project model (editing-model spec), accounts and payments.

Hard rules carried from the brief: everything on-device and offline except accounts and payments. **Downloadable packs are therefore out of v1**; the catalog/download design is parked in Appendix A and needs a recorded product sign-off before it is built. All shipped assets permissively licensed; no imitation of CapCut or any other editor; CPU-only must work.

Legal entity: the owning company is **Exaltes Global Pvt. Ltd.**, trading as **Agape Labs**. `pack.json.publisher`, `licenses/FONTS.txt`, `licenses/AUDIO.csv` and the music work-for-hire all name "Exaltes Global Pvt. Ltd. (Agape Labs)". Confirm this with the founder once before the first pack is signed.

## 2. Template JSON format

```
packs/<packId>/
  pack.json                 manifest with per-file hashes (2.2)
  pack.json.sig             detached ed25519 signature over the exact bytes of pack.json
  templates/<templateId>/
    template.json
    thumb.jpg               1080x1920 poster; the grid shows it at 360x640
    preview.mp4             2-4 s, 540x960, H.264 via libopenh264 (BSD-2; BtbN LGPL build enables it unconditionally: https://raw.githubusercontent.com/BtbN/FFmpeg-Builds/master/scripts.d/50-openh264.sh), yuv420p, no audio
    assets/                 stickers (SVG/PNG), music stems, referenced by relative path
```

### 2.1 TypeScript types (new file `src/lib/templates.ts`)

```ts
export type TemplateTier = "free" | "pro";
export type SlotFit = "cover" | "contain";
export type Easing = "linear" | "hold" | "easeOut" | "easeInOut";   // = the editing-model `Ease` union; no `spring` (it has no closed form the FFmpeg expression compiler can emit)

export interface Template {
  schema: 1;
  id: string;                        // "agape.first-light"; namespaced, never reused
  name: string; tagline: string; tier: TemplateTier; tags: string[];
  canvas: { width: 1080; height: 1920; fps: 30; background: string };
  durationSec: number;               // nominal; recomputed after slots are filled
  variables: Record<string, TemplateVariable>;   // max 6
  scenes: Scene[];                   // ordered; transitions happen between scenes (9.2)
  layers: Layer[];                   // bottom to top; a layer with `scene` set is composited inside that scene
  transitions: TransitionSpec[];     // between consecutive scenes
  music?: MusicSpec;
  musicDefaultOn: boolean;           // one-click default; user can toggle later
  suggestFor?: { minClips: number; maxClips: number };   // used by suggestLook() (4.4)
  captionsStyle?: CaptionsStyle;
}

export interface Scene { id: string; background?: string; }   // background defaults to canvas.background

export type TemplateVariable =
  | { kind: "text"; label: string; default: string; maxGraphemes: number }   // counted with Intl.Segmenter
  | { kind: "color"; label: string; default: string }
  | { kind: "toggle"; label: string; default: boolean };

export interface Timing { startSec: number; durationSec: number }
export interface Rect { x: number; y: number; w: number; h: number }   // 0..1 of canvas
export interface Keyframe<T> { atSec: number; value: T; easing?: Easing }   // template-file form; applyTemplate converts to editing-model Keyframe<T> { atUs, value, ease }
export interface Animation {
  opacity?: Keyframe<number>[]; scale?: Keyframe<number>[];
  translate?: Keyframe<{ x: number; y: number }>[]; rotateDeg?: Keyframe<number>[];
}

interface LayerBase {
  id: string;
  timing: Timing | string;           // string = timing expression, 2.3
  frame: Rect;
  scene?: string;                    // scene id; absent = global layer (drawn above transitions)
  animation?: Animation;
  locked?: boolean;
}

export type Layer =
  | (LayerBase & { kind: "video"; slot: VideoSlot; mask?: string })   // mask = id of a shape layer in the same scene
  | (LayerBase & { kind: "text"; text: TextStyle & { content: string } })
  | (LayerBase & { kind: "shape"; shape: ShapeSpec })
  | (LayerBase & { kind: "sticker"; src: string })
  | (LayerBase & { kind: "captions" });

export interface VideoSlot {
  id: string; label: string;
  minSec: number; maxSec?: number;
  fit: SlotFit; loop: boolean; muted: boolean;
  cornerRadius?: number;             // px at 1080 width
  placeholder: "person" | "scene" | "product";
}

export interface TextStyle {
  fontFamily: string;                // must be in the bundled list, section 7
  weight: 400 | 500 | 600 | 700 | 800;
  sizePx: number; minSizePx: number; maxLines: number;   // auto-fit, 7.1
  color: string; align: "left" | "center" | "right";
  strokePx?: number; strokeColor?: string;
  shadow?: { x: number; y: number; blur: number; color: string };
  box?: { color: string; paddingPx: number; radiusPx: number };
  lineHeight?: number;
}

export type ShapeSpec =
  | { type: "rect"; fill: string; radiusPx?: number; strokePx?: number; strokeColor?: string }
  | { type: "ellipse"; fill: string }
  | { type: "line"; color: string; widthPx: number }
  | { type: "polygon"; fill: string; points: { x: number; y: number }[] };   // for diagonal masks

export type TransitionKind = "cut" | "crossfade" | "dip-black" | "slide" | "wipe" | "zoom";   // editing-model `TransitionKind` plus "cut" (= no Transition record)
export interface TransitionSpec {
  between: [string, string];         // scene ids
  kind: TransitionKind; durationSec: number;   // 0 for cut; 0.2–1.5 otherwise
  direction?: "left" | "right" | "up" | "down";
}

export interface MusicSpec { src: string; gainDb?: number; duckUnderVoice: boolean; fadeOutSec: number }
export interface CaptionsStyle extends TextStyle { position: Rect; highlightColor?: string }
```

Every video layer must name a `scene`; a scene holds one or more slots on screen at the same time (template 11 has two). Text/shape/sticker layers may be in-scene (they go through the transition with the slots) or global (they stay put while the scene changes underneath, e.g. template 10's panel).

### 2.2 Pack manifest and integrity

```ts
export interface PackManifest {
  schema: 1; id: string; name: string;
  version: string; minAppVersion: string;              // semver
  publisher: "Exaltes Global Pvt. Ltd. (Agape Labs)";  // only value accepted in v1
  templates: string[];
  files: Record<string, string>;                       // relative path -> sha256 hex, every file in the zip except pack.json and pack.json.sig
}
```

`pack.json.sig` is 64 bytes raw: ed25519 over the exact stored bytes of `pack.json` (no canonicalisation step; the build script writes the file, then signs that file). Verification order in `pack_install`: (1) read `pack.json` and `pack.json.sig` from the zip, verify with the compiled-in public key (`ed25519-dalek = "=3.0.0"`, BSD-3-Clause, https://docs.rs/ed25519-dalek/latest/ed25519_dalek/; note 3.x changed the `VerifyingKey` API from 2.x, use `VerifyingKey::from_bytes` + `verify_strict`); (2) every zip entry's `ZipFile::enclosed_name()` is `Some` (`zip = "=9.4.1"`, MIT, https://crates.io/crates/zip; `None` catches `..`, absolute paths and Windows drive letters); (3) every entry other than the two manifest files is in `files` with a matching sha256, and every `files` key exists; (4) `pack.json.id` matches the install folder; (5) `semver = "=1.0.28"` check of `minAppVersion`. Extract into `<root>/<id>/<version>.part/`, rename to `<version>/` only after all checks pass; a `.part` directory found at startup is deleted. Any failure: "This template pack didn't pass its safety check, so we didn't install it."

### 2.3 Timing expressions

`timing` may be a string: `"slot:slot2:start+0.3 for 2.0"`, `"slot:slot2:start for slot:slot2:duration"`, `"end-3 for 3"`. Grammar: `<anchor>(+|-<number>)? for (<number>|slot:<id>:duration)`; `<anchor>` is `0`, `end`, `slot:<id>:start`, `slot:<id>:end`. Resolved in `resolveTemplate()` after slots are filled. Unknown slot id rejects the template at load time (log line), never at apply time.

## 3. Project model (owned by `specs/editing-model-and-project-format.md` §1.2)

This spec adds no project types of its own. The editing-model's v2 `Project` already carries everything a template needs, and this is how template concepts map onto it:

| Template concept | Project representation |
| --- | --- |
| canvas 1080×1920 @ 30 | `project.aspect = "9:16"`, `width/height` via the `setAspect` op; `project.fps` stays whatever the first import set (templates are rate-agnostic, `canvas.fps` is only the nominal rate of the design); the background colour is the `color=` base the export compiler already draws per scene (9.2 rule 1), read from `scene.background` in the template copy kept under `project.template`, so no clip is needed |
| video layer / slot | `MediaClip` (kind `video`) on a video track, `slotId`/`sceneId` set, `frame: Rect` → first `Transform` keyframe (`x,y` = frame centre as canvas fractions, `scale` = frame width / canvas width) plus a `CropRect` for `cover` (centre crop to the slot's aspect) or none for `contain`; `cornerRadius` and `mask` → `maskClipId` pointing at a `ShapeClip` on an overlay track |
| unmuted slot sound | linked `MediaClip` (kind `audio`), `role: "voice"` |
| text layer | `TextClip { text, template, style, animation, transform }` on the text track |
| shape / sticker layer | `ShapeClip` / `StickerClip` on an overlay track (multiple overlay tracks are allowed, bottom-up) |
| layer `animation` | `opacity`, `transform` keyframes (`translate/scale/rotateDeg` fold into `Transform`), `atSec` → `atUs`, `easing` → `ease` |
| transition between scenes | **adjacent** clips plus a `Transition` record (`leftClipId` = last video clip of scene k, `rightClipId` = first of scene k+1, `kind`, `direction`, `durationUs`); timeline positions never overlap (editing-model invariant 4); `cut` = no record |
| music | `MediaClip` (kind `audio`) `role: "music"`, `volume` from `gainDb`, `fadeOutUs`; `duckUnderVoice` → `project.audio.duck` |
| captions layer | `project.captions[*].style` position from `CaptionsStyle.position`; the captions spec owns the rest |
| template provenance | `project.template { packId, templateId, packVersion, variables }` |

Adding `"overlay"` to `TrackKind` is part of the editing-model migration (its checklist 1–2); the two call sites in today's `project.ts` (`appendMedia`'s `added` literal and `TRACK_ORDER`) are rewritten there. Applying a 9:16 template to a 16:9 project runs `setAspect("9:16")` as the first command of the coalesced apply (toast "Switched to portrait for this look"). The `variant: "effect"` placeholder clips in `src/data/placeholder.ts` go away with the v2 types.

Timeline rendering of a transition: a small chevron is drawn across the shared edge of the two adjacent clips; dragging it edits `durationUs` (clamped 0.2–1.5 s) through `setTransitionDuration`. Because clips never overlap, `videoClipAt` needs no special rule.

## 4. One-click flow

### 4.1 Apply a template

`applyTemplate(project, template, media: MediaRef[], opts?: { moments?: Moment[] }): Command[]`, pure, in `src/lib/templates.ts`, returns editing-model commands (`setAspect`, `addMedia`, `insert`, `addTrack`, `addTransition`, `setKeyframe`, …) that the caller runs through `history.execute` under one `coalesceKey = "template:" + templateId`, so Apply is a single undo step labelled "Applied {name}". `Moment = { mediaId: string; startUs: Us; score: number }` is the hook for the auto-cut spec's `Highlight` (same fields); this spec never computes moments.

1. Partition media: images and videos (`hasVideo`) are slot candidates; audio-only files are kept aside for the music row.
2. **One long file** (exactly one video candidate, duration > sum of slot `minSec`): the file is split across slots. With `moments` supplied, take the top-N by score, sort by time, assign in order, each slot's `inUs = moment.startUs`, duration = `min(slot.maxSec ?? 5, slot.minSec * 1.5)`. Without moments: skip the first `LEAD_IN_SEC = 2` s, divide the remainder into N equal windows and take the start of each. If the file is shorter than every slot's `maxSec`, play it sequentially: slot k gets `inUs = sum(dur_0..dur_{k-1})`.
3. **Several files**: fill slots in order, one file per slot, `inUs 0`. More files than slots: the last scene is repeated (its slot layers, in-scene layers and transition copied) until files run out or total duration exceeds `MAX_AUTO_REEL_SEC = 90` (constant with rationale: Instagram allows longer Reels, but auto-filled reels above 90 s are rarely what the user meant; they can extend by hand). Fewer files: remaining slots keep placeholder art and still preview and export.
4. Images: a still is a 5 s video slot; export input is `-loop 1 -framerate 30 -t 5 -i img.jpg`. HEIC is not decodable by the LGPL build (libheif absent); `probe_media` rejects it with "iPhone HEIC photos aren't supported yet. Export it as JPEG from Photos and try again."
5. Media shorter than `minSec` with `loop` off: use it, mark `underfilled` ("This clip is shorter than this slot, so we tightened the reel").
6. Resolve timing expressions; build clips per the §3 table: video layers → `MediaClip`s (second and later slots of a scene on additional video tracks via `addTrack`); unmuted slots → linked audio clips; text → `TextClip`s with `{{var}}` substituted and `template` kept; shape/sticker → overlay-track clips; `music` → `role: "music"` clip if `musicDefaultOn`.
7. Scenes are laid out **adjacent** (scene k+1 starts exactly at scene k's end); each `TransitionSpec` other than `cut` becomes an `addTransition` between the last video clip of k and the first of k+1 (the export spec renders the overlap from handles or freeze frames, never by moving clips).
8. `setAspect("9:16")` first (if needed), `project.template` last; return the command list.

### 4.2 Pro gate at Apply (not at Export)

When a Pro template is applied on a free licence the project opens normally, with a persistent banner "This look is part of Verso Pro. Try it free, or switch to a free look" and the Export button rendered in its locked state from that moment, so there is no surprise 20 minutes later. "Switch to a free look" calls `retargetTemplate(project, newTemplate)`: slots are mapped `slotN -> slotN`, keeping `mediaId`, `inUs`, `Transform` offsets within the new slot and variable text; extra slots are dropped, missing slots get placeholders. Licence state comes from `invoke("account_state")` (accounts spec §6.2; `AccountState.entitlements.features.includes("templates_premium")`). When the command is unregistered or the account backend is not configured (dev builds, unit tests) the app treats the tier as `free` and logs once. Offline: the cached licence is honoured until its `exp` (14 days, accounts spec §6.1), after which the tier reverts to `free`; **free looks always export**, offline or not. All bundled fonts are free; only templates and library music carry `tier`, so no asset-level gate exists beyond those two.

### 4.3 One-drag media swap

Drop targets: a slot `frame` on the Preview canvas (hit-test at the playhead) or a slot row in the Inspector. `swapSlotMedia(project, slotId, media: MediaRef, inUs = 0)`: find clips with `slotId`, replace `mediaId`, keep `startUs`/`transform`/`crop`, set `inUs`; if the media is shorter than the slot and `loop` is off, `trimEnd` with `ripple: true` so later scenes close up and transitions stay attached (`setTransitionDuration` clamps if a clip became shorter than its transition). Hover outline is ink, not Ember (Ember stays reserved for Export/playhead). Toast "Swapped into Your hook" with Undo. Audio-only on a video slot: "That file has no picture. Drop it on the music row instead." Drop while playing: pause, swap, stay paused.

### 4.4 Media before look

If the user drops media with no template chosen, `suggestLook(media)` picks by count using `suggestFor` (1 → Just talk, 2 → Before and after, 3 → Three things, 4 → Quick recipe, 5+ → Mini vlog; a single file over 60 s → Three things with the long-file split). One button, "Make my reel", applies it; the grid stays one click away.

### 4.5 Preview proxies

Proxies are the export spec's §5.1 pipeline, nothing template-specific: Rust `media_proxy(path, on_progress: Channel<f32>) -> Result<String, String>` renders a 720p-height H.264 proxy **keeping the source aspect** (never padded to the canvas, since the same proxy serves reframe and ordinary editing) with the export spec's encoder chain (NVENC → QSV → AMF → MF → `libopenh264`) and its `-hwaccel` gate; it runs only for media that `needsProxy` (HEVC without the Windows extension, 10-bit, HDR, ProRes, > 4K). Cache `$APPCACHE/proxies/<cache_key>.mp4` (already inside the asset scope), LRU eviction above 10 GB, index in `proxies/index.json`. Preview always uses the proxy when present; export always uses the original. Progress: a thin bar on the bin card ("Preparing smooth preview…"); the clip is usable immediately with the filmstrip until the proxy lands. This removes the HEVC/4K problem: iPhone HEVC has no WebView2 decoder without the paid Windows extension, but the sidecar decodes it and the proxy is H.264.

### 4.6 Missing media and missing pack versions

On project open, the editing-model's `resolve_media` runs over `project.media`. Missing file: the slot renders placeholder art with a small "missing" badge on top of the editing-model's hatched Missing clip; the editing-model **Locate…** / **Remove from project** flow applies unchanged (one pick relinks every file found in the same folder). Missing `packVersion`: use the newest installed version of the same pack, toast "This look was updated; your clips are untouched"; if the pack is gone entirely, the project keeps rendering from the clips' stored `frame/text/shape` data (templates are copied into the project at apply time, so nothing depends on the pack after that) and the Templates inspector shows "This look is no longer installed".

## 5. Pack storage and commands

- Bundled: `src-tauri/resources/packs/agape.core.versopack` (Tauri `bundle.resources`); extracted on first launch to `<app_data_dir>/packs/agape.core/<version>/`. Several versions may coexist; projects pin `packVersion`.
- Index: `<app_data_dir>/packs/index.json`.
- `.versopack` is a plain zip.

```rust
#[derive(Serialize)] #[serde(rename_all = "camelCase")]
pub struct InstalledPack { pub id: String, pub version: String, pub name: String, pub root: String, pub templates: Vec<TemplateSummary> }
#[derive(Serialize)] #[serde(rename_all = "camelCase")]
pub struct TemplateSummary { pub id: String, pub name: String, pub tagline: String, pub tier: String, pub tags: Vec<String>, pub thumb_path: String, pub preview_path: Option<String>, pub duration_sec: f64, pub slot_count: u32 }

#[tauri::command] pub async fn packs_list(app: AppHandle) -> Result<Vec<InstalledPack>, String>;
#[tauri::command] pub async fn packs_ensure_bundled(app: AppHandle) -> Result<Vec<InstalledPack>, String>;   // idempotent
#[tauri::command] pub async fn pack_install(app: AppHandle, zip_path: String) -> Result<InstalledPack, String>; // local file; used by QA and by Appendix A later
#[tauri::command] pub async fn template_load(app: AppHandle, pack_id: String, version: String, template_id: String) -> Result<serde_json::Value, String>; // validated in TS with zod
#[tauri::command] pub async fn audio_envelope(app: AppHandle, path: String, in_sec: f64, dur_sec: f64) -> Result<Vec<f32>, String>;   // §8
#[tauri::command] pub async fn overlay_begin(app: AppHandle, job_id: String, lane: String) -> Result<(), String>;                   // §9.2
#[tauri::command] pub async fn overlay_frame(app: AppHandle, job_id: String, lane: String, png: tauri::ipc::Request<'_>, duration_sec: f64) -> Result<(), String>;
#[tauri::command] pub async fn overlay_end(app: AppHandle, job_id: String, lane: String) -> Result<String /* ffconcat path */, String>;
// media_proxy is defined in the export spec §4.1 (the one proxy pipeline, §4.5 above).
```

Paths are absolute and converted with `convertFileSrc()`. `tauri.conf.json` asset scope becomes `["$APPCACHE/**", "$APPDATA/packs/**", "$RESOURCE/**"]` (the current value is `$APPCACHE/**` only; `$RESOURCE` is a valid scope variable, https://v2.tauri.app/reference/config/). Without `$RESOURCE/**` every `@font-face` request for the bundled fonts is refused. User media is never covered by a wildcard: the reframe spec §7 per-file `allow_file` rule applies.

## 6. Thumbnails and animated previews

`scripts/build-pack.mjs` (Node, dev machine) renders each template with our own CC0 placeholder footage through the real export path (section 9) at 540x960, 2–4 s, then writes `thumb.jpg` (frame at 35 %) and `preview.mp4` (libopenh264, or `h264_nvenc` on the dev box, both yuv420p). The grid plays `preview.mp4` muted on hover/focus, falling back to `thumb.jpg`. Placeholder artwork for empty slots: three neutral vector illustrations drawn by us (person silhouette, landscape, product plinth), bundled as SVG.

## 7. Fonts and text rendering

Bundle only SIL OFL 1.1 fonts with their OFL.txt and copyright lines in `licenses/FONTS.txt` and the About panel (OFL-FAQ 1.1-update7, question 1.20: "At a minimum you must include the copyright statement, the license notice and the license text", https://openfontlicense.org/ofl-faq/). Fonts ship under original names (Reserved Font Name rule), as static TTF/OTF under `src-tauri/resources/fonts/`, loaded via `@font-face` + `convertFileSrc`.

| Family | Scripts | Use | Licence (verified) |
| --- | --- | --- | --- |
| Manrope | Latin | UI, default titles | OFL-1.1, https://github.com/googlefonts/manrope |
| Inter | Latin, Cyrillic, Greek | captions, body | OFL-1.1, https://github.com/rsms/inter |
| Hind (ITF) | Devanagari + Latin | Hindi/Marathi titles | OFL-1.1, https://fontsource.org/fonts/hind/about |
| Mukta (Ek Type) | Devanagari, Gujarati, Gurmukhi, Tamil, Latin | regional captions | OFL-1.1, https://github.com/EkType/Mukta |
| Baloo 2 family (Ek Type) | Baloo 2 Devanagari, Baloo Thambi 2 Tamil, Baloo Bhai 2 Gujarati, Baloo Da 2 Bengali | playful display, per-language | OFL-1.1, https://github.com/EkType/Baloo2 |
| Noto Sans Devanagari | Devanagari | fallback | OFL-1.1, https://fontsource.org/fonts/noto-sans-devanagari/about |
| Poppins (ITF) | Devanagari + Latin | geometric display | OFL-1.1, repo ships OFL.txt, https://github.com/itfoundry/Poppins |

**Single text renderer.** All text, shape, sticker **and caption** layers are rasterised by one renderer, the `OverlayRenderer` (9.3), in both preview and export (export uses it to produce the overlay lanes of the export spec §3.4). Neither FFmpeg `drawtext` nor libass is used anywhere in Verso, so there is no second font engine, no escaping table, and preview/export text is pixel-identical. The BtbN LGPL build does include freetype/harfbuzz/fribidi/libass unconditionally; they stay unused, and the former `drawtext` CI guard is dropped.

### 7.1 Grapheme limits and auto-fit

`maxGraphemes` is enforced with `new Intl.Segmenter(undefined, { granularity: "grapheme" })`, never `string.length`. Layout rule, shared because there is one renderer: measure the string at `sizePx` with `CanvasRenderingContext2D.measureText`; while width > `frame.w * 1080 - 2 * box.paddingPx`, reduce size by 4 px down to `minSizePx`; if still too wide, wrap on word boundaries (Intl.Segmenter word granularity, works for Devanagari spaces) up to `maxLines`; beyond that, truncate with an ellipsis and show a warning icon in the Inspector ("This title is long; shorten it so it fits").

## 8. Music and SFX starter library

Policy: only CC0 or own-produced audio. No Pixabay (prohibits standalone distribution, https://pixabay.com/service/license-summary/), no YouTube Audio Library, nothing CC-BY-NC.

- Own-produced: 10 instrumental beds (15–60 s, loop points marked) under a written work-for-hire/assignment to Exaltes Global Pvt. Ltd.; 48 kHz Opus in `assets/music/`.
- CC0 SFX: Kenney packs, recorded per asset with the specific free pack page on https://kenney.nl/assets (not the paid bundle page), plus Freesound sounds filtered to CC0 only (https://freesound.org/help/faq/); each row of `licenses/AUDIO.csv`: file, source URL, uploader, licence, retrieval date.
- Library metadata `{ id, title, bpm, mood[], durationSec, tier, licence: "CC0" | "Own", source }`.
- Mix defaults, no user setting: music `gainDb` defaults to −14 when any unmuted video slot has audio ("voice present"), −8 otherwise (stored as linear `volume`). Loudness and ducking are the export spec's §3.6 (two-pass `loudnorm I=-14:TP=-1:LRA=11`, `sidechaincompress` on the voice bus with `project.audio.duckDb`); this spec adds no filter parameters of its own, and single-pass `loudnorm` is never used (it silently ignores `linear=true`, captions spec §2.1).
- Preview ducking: Rust `audio_envelope(path, in_sec, dur_sec) -> Vec<f32>` decodes with `-f f32le -ac 1 -ar 8000` and returns RMS at 20 ms hops, cached next to filmstrips (`$APPCACHE/envelopes/`); the export spec's player uses it as a fallback for its `AnalyserNode` follower when Web Audio is unavailable (its CORS gate), applying a one-pole ramp (attack 20 ms, release 400 ms) to the music `GainNode`.

## 9. Transitions and render

### 9.1 Set

| Kind | FFmpeg xfade `transition=` | Preview (shared module) |
| --- | --- | --- |
| cut | none (`concat`) | immediate switch |
| crossfade | `fade` | A opacity 1→0, B 0→1 |
| dip-black | `fadeblack` | A to black first half, B from black second half |
| slide | `slideleft/slideright/slideup/slidedown` | translate A out, B in, by one canvas dimension, linear (matches xfade) |
| wipe | `wipeleft/wiperight/wipeup/wipedown` | B revealed behind a hard edge moving across the canvas, linear |
| zoom | `zoomin` | port of `zoomin_transition` from vf_xfade.c: both frames sampled at zoom `1 + 0.03*sin(P*PI)` about centre, mixed by P |

This is the complete transition set of Verso (editing-model `TransitionKind`); the export spec §3.5 compiles exactly these names.

Facts verified in https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/libavfilter/vf_xfade.c: all six transition names exist; `duration` default 1 s, max 60 s; `offset` is relative to the first input, default 0. The custom-expression zoom from revision 1 is dropped (per-pixel `av_expr_eval` is far too slow on CPU). On the chroma question raised by Reviewer 1: `values[VAR_W]/[VAR_H]` are indeed full-frame, but xfade's `pix_fmts` contains **only 4:4:4, planar RGB and gray formats** (no `yuv420p`), so planes are never subsampled inside xfade; the real consequence is the next paragraph.

### 9.2 Export: what this spec contributes to the export compiler

There is **one** filtergraph builder, `src/lib/render/compile.ts` (export spec §3), fed by `buildRenderGraph`. A template-made project is an ordinary project (§3 table), so most of it compiles with no template knowledge: slots are video segments with a `Transform` (general transform path, export §2.1), scene transitions are `Transition` records (export §3.5 handles model, `OFF_k = t1_k − T0 − d_k/2`; timeline length never changes), music and slot sound are audio lanes (export §3.6). Three rules are template-specific and are specified here for the compiler:

1. **Scene background.** The black `color=` base of the export chain takes the scene's `background` colour for the span of that scene (from the copied template in `project.template`, defaulting to the canvas background). Several video tracks compose bottom-up with `overlay` onto that base (export §2.1).
2. **Masks.** A `MediaClip.maskClipId` names a `ShapeClip`; the `OverlayRenderer` emits that shape's animated luma as a gray PNG sequence (a `mask` lane with `format=gray`), and the compiler applies `[slot][mask] alphamerge` before the slot's `overlay`.
3. **In-scene vs global overlays.** Text/shape/sticker clips with `sceneId` set are overlaid onto their scene's composited segments **before** the xfade, so they travel with the scene; clips without `sceneId` go into the global lanes after all transitions (export §3.4).

All xfade inputs are `yuv444p` and the graph ends with one `format=yuv420p` (export spec §1: xfade's `pix_fmts` has no 4:2:0 entry, verified in `vf_xfade.c`).

**Overlay lanes.** The `OverlayRenderer` (OffscreenCanvas in a Web Worker, at output resolution, same code as preview) renders every text/shape/sticker/caption layer of a lane to transparent PNG frames at project fps, but only emits a new file when the rendered lane changes (static text yields one frame; a 2 s opacity reveal yields 60). Frames stream to Rust `overlay_begin(job, lane) / overlay_frame(job, lane, png, durationSec) / overlay_end(job, lane)` (§5), which writes `app_cache_dir()/exports/<jobId>/<lane>/f%05d.png` and an `ffconcat` list (`file 'f00001.png'` / `duration 0.5`; filenames are ours, so no escaping issue). Input: `-f concat -safe 0 -i <lane>.ffconcat` then `fps={fps},settb=AVTB,format=rgba` (masks: `format=gray`). Cost: PNG encode ≈ 25 ms per 1080x1920 frame on the i5; the worst template (Quote on film, ~20 s of animation) is ≈ 600 frames ≈ 15 s, done while the first scenes already encode. The job directory is the export spec's and is deleted with it.

Stills (template slots filled with photos) are the export spec's `still` segments (`-loop 1 -framerate {fps} -t {dur}`).

### 9.3 Preview: `OverlayRenderer` and `transitionAt`

The preview engine is the export spec's `src/lib/player/` (§5.2 there: `ClipPool`, `AudioContext` clock, bare `<video>` for a single full-frame clip, a 2D `<canvas>` path whenever a frame has several video clips, a mask or a transition). This spec contributes two modules the player calls:

- `src/lib/render/transitions.ts`:
  ```ts
  export interface TransitionFrame { aOpacity: number; bOpacity: number; aTransform: Transform; bTransform: Transform; wipe?: Rect; black: number }
  export function transitionAt(kind: TransitionKind, direction: string | undefined, p: number): TransitionFrame
  ```
  evaluated over the export window `[C−d/2, C+d/2]`.
- `src/lib/render/OverlayRenderer.ts`: one class that draws text (auto-fit, 7.1), shapes, stickers, masks and captions (captions spec `layoutLine`) onto a 2D context; the preview draws it live into a DOM `<canvas>` layer above the video, the export worker drives the same class to produce the overlay lanes (9.2). Text therefore matches exactly; video pixels differ only by scaler and codec, acceptance PSNR ≥ 30 dB against export at three timestamps per template.

## 10. Design brief: the first 12 originals (pack `agape.core` 1.0.0)

Rules: layouts, names, copy, shapes, motion and music are ours. Nobody opens CapCut, InShot, VN or another editor's template library while designing; moodboards come from print, signage and Indian poster typography. Brand voice: warm, direct, sentence case.

| # | Name | Tier | Scenes / layout |
| --- | --- | --- | --- |
| 1 | Just talk | Free | 1 scene, full-bleed slot, captions band at 72 % in Inter 600 on 40 % ink box; music off |
| 2 | First light | Free | Scene 1 (3 s hook, slow 1.05→1 scale on the slot) with Manrope 800 title sliding up; slide-left to scene 2; bed "Dawn walk" |
| 3 | Three things | Free | 3 scenes, each with graphite numeral chip + one line of Hind/Inter; crossfades 0.4 s |
| 4 | Before and after | Free | 2 scenes, dip-black 0.5 s; global thin rule wipes at the cut; {{labelA}}/{{labelB}} chips |
| 5 | Quick recipe | Free | 4 scenes, cover fit, 24 px corners inset 4 %, step text in Baloo 2; cuts; SFX pop per step |
| 6 | Say it in Hindi | Free | 1 scene, Devanagari title Hind 700 + Mukta subtitle; {{title}} maxGraphemes 24, minSizePx 56, maxLines 2 |
| 7 | Product in hand | Pro | Scene 1: slot framed 86 % over a {{brandColor}} in-scene rect; price chip; slide-up to scene 2; bed "Shopfront" |
| 8 | Mini vlog | Pro | 5 scenes, slides alternating left/right, {{place}} in Manrope 600 with underline; bed "Side street" |
| 9 | Quote on film | Pro | 1 scene, slot under a 35 % ink in-scene rect, Inter 500 lines reveal by opacity keyframes, author bottom-right |
| 10 | Teach one thing | Pro | Scene 1 slot in top 60 %, **global** chalk-grey panel with 3 bullets appearing every 2 s stays through the zoom to scene 2 |
| 11 | Day to night | Pro | 1 scene, two slots, slot 2 masked by an animated polygon shape (translate keyframes) |
| 12 | Festival greeting | Pro | 1 scene, {{accent}} stroked rect frame, greeting in Baloo 2 / Baloo Thambi 2 (Pongal, Tamil) / Baloo Bhai 2 (Gujarati) / Baloo Da 2 (Bengali) per language variable; slow zoom; bed "Lamps" |

Originality review (two sign-offs per template, recorded in `packs/agape.core/REVIEW.md`): name and copy not used by another editor (search galleries by name only, after design freeze); no stock motifs or traced decorations; every asset path resolves to an own-made or CC0-logged file; side-by-side with the three most popular templates in the category shows no shared composition.

## 11. Failure handling

| Situation | Behaviour | Message |
| --- | --- | --- |
| template.json fails schema | hidden, pack still loads | log only |
| pack signature / hash invalid | `.part` deleted | "This template pack didn't pass its safety check, so we didn't install it." |
| pack needs newer app | greyed | "Update Verso to use this pack." |
| font file missing | Inter/Hind by script | "We used a standard font because {{font}} is missing." |
| media shorter than slot | slot shortened | "{{clip}} is shorter than this slot, so we tightened the reel." |
| source file missing | placeholder + relink dialog | "We can't find {{file}}. Locate it or keep the slot empty." |
| HEIC still | rejected at probe | "iPhone HEIC photos aren't supported yet. Export it as JPEG from Photos and try again." |
| proxy render fails | filmstrip at 4 fps for that clip | "Smooth preview isn't available for this file; the export will be smooth." |
| overlay renderer throws mid-export | export aborted, job dir deleted | "Something went wrong drawing the titles. Nothing was saved; try exporting again." |
| Pro look, free licence | banner at Apply, Export locked | "This look is part of Verso Pro. Try it free, or switch to a free look." |

## 12. Performance targets (dev box and i5-1135G7, 16 GB, no dGPU)

- Grid first paint < 150 ms with 24 templates; hover preview starts < 200 ms.
- `applyTemplate` with 5 clips < 50 ms; swap visible < 300 ms; filtergraph build < 20 ms.
- Proxy render: ≥ 4x realtime for 1080p HEVC on the i5 with d3d11va; ≥ 1.5x CPU-only.
- Preview: 30 fps at 540x960 display with two overlapping proxies on the i5.
- Export: xfade adds < 25 % wall time versus straight concat at 1080x1920 on the i5; "Mini vlog" (5 clips, 30 s) CPU-only end-to-end ≤ 2x realtime including overlay rendering.
- Bundled pack ≤ 60 MB.

## 13. Test plan

Unit (Vitest, `src/lib/**`): schema fixtures (unknown `schema`, bad font, unknown slot/scene refs rejected); 20 timing expressions; `applyTemplate` with 0/fewer/more files, one 60-minute file (segments spaced, lead-in skipped), moments input, images, audio-only aside, scenes adjacent with one `Transition` record per non-cut `TransitionSpec`, `cut` yields no record, 90 s cap, result passes the editing-model `validate()` and undoes in one step; `retargetTemplate` 5→3 and 3→5 slots; `swapSlotMedia` shorter/longer, undo exact; Devanagari grapheme counting (24 graphemes with conjuncts and matras passes, 25 fails); auto-fit shrink then wrap; export-compiler golden files for all 12 templates (in the export spec's snapshot suite: offsets per §3.5, yuv444p before every xfade, `format=yuv420p` once at the end, in-scene overlays before xfade, masks via `alphamerge`); `transitionAt` endpoints and monotonicity.

Rust (`cargo test`): `pack_install` on a signed fixture, tampered byte, `../` entry, absolute/drive-letter entry (`enclosed_name` None), wrong publisher, `.part` cleanup; `packs_ensure_bundled` idempotence; proxy cache key and eviction.

Sidecar smoke (CI, Windows runner): golden graph for "First light" on two `testsrc2` clips (exit 0, duration = sum of scene lengths, transitions do not shorten it); VFR Android fixture asserting A/V offset < 40 ms at end via `ffprobe` packet timestamps; HEVC 4K iPhone fixture through `media_proxy`; HEIC rejected; overlay ffconcat with a Windows path containing a space, a colon and a Devanagari folder name.

Visual (manual per pack release): preview vs export PSNR at three timestamps per template; strings "श्री गणेशाय नमः", "क्ष त्र ज्ञ", "ਪੰਜਾਬੀ", "பொங்கல்" in the overlay renderer; Pro gate with cached licence expired offline (free look still exports); CPU-only "Mini vlog" export within budget.

Licensing gate (CI): every file under `packs/**/assets` and `resources/fonts/` must appear in `AUDIO.csv`/`FONTS.txt` with licence OFL-1.1, CC0 or Own.

## 14. Implementation checklist (ordered)

0. `pnpm add -D vitest zod`; add `"test": "vitest run"` to package.json (neither exists today; the editing-model spec adds `fast-check` at the same time).
1. Depends on editing-model checklist 1–3 (v2 types incl. `overlay` tracks, `ShapeClip`/`StickerClip`, `TextClip.style`, `Transition`, ops). Nothing template-specific remains in `project.ts`.
2. `templates.ts`: zod schema, timing parser, `resolveTemplate`, `applyTemplate` → `Command[]` (long-file split, moments hook, adjacent scenes + `addTransition`), `retargetTemplate`, `swapSlotMedia`, `suggestLook`, grapheme utils. Tests incl. `validate()` on the result.
3. `render/transitions.ts` (incl. zoomin port) and the three compiler rules of 9.2 contributed to the export spec's `compile.ts` with golden tests.
4. Rust `commands/packs.rs` (zip, sha256 per file, ed25519 over pack.json, `.part` rename, index.json, `packs_list`, `packs_ensure_bundled`, `pack_install`, `template_load`); extend asset scope with `$APPDATA/packs/**` and `$RESOURCE/**`; tests.
5. Rust `audio_envelope`, `overlay_begin/frame/end` (job dir shared with the export spec); `media_proxy` is export checklist 11.
6. Fonts vendored + `FONTS.txt` + `@font-face`; `OverlayRenderer` (text auto-fit, shapes, stickers, masks; captions drawing added by captions checklist 8) shared by preview and export worker.
7. Hook into the export spec's player (canvas path for multi-slot scenes and masks, overlay layer); filmstrip fallback; Timeline chevron handle on transitions.
8. Templates tab: grid from `packs_list`, hover previews, Pro tags and Apply-time gate banner, "Make my reel", Inspector slots/variables, drop targets; missing-media relink dialog.
9. Music/SFX library, `AUDIO.csv`, music clips with `role: "music"` and `project.audio.duck`, preview ducking ramp fallback.
10. Design the 12 templates; `scripts/build-pack.mjs` renders previews through the export path; originality review; sign; bundle.
11. Exporter hooks: licence check, overlay job lifecycle, plain-language messages.
12. CI gates (licensing, sidecar smoke), i5 performance pass, release `agape.core` 1.0.0.

## Appendix A: downloadable packs (not in v1; needs product sign-off)

Catalog `https://packs.verso.agapelabs.in/v1/catalog.json`, entries `{ id, version, minAppVersion, tier, name, bytes, sha256, url }`. Download in Rust with `reqwest` against a hard-coded host allowlist (no `tauri-plugin-http` capability needed since the UI never fetches), stream to `<id>-<version>.versopack.part`, verify sha256 against the catalog, then run `pack_install`. One attempt per session, "Check again" button, offline shows installed packs only. If approved, add it to the hard-rules paragraph as the third permitted network use.
