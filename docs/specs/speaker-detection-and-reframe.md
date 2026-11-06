# Verso spec: Speaker detection and smart vertical reframe

Status: implementation spec for Phase 3 ("Auto-cut and reframe"), revision 2 after licence/feasibility and product reviews. Fits the existing architecture: Rust Tauri commands in `src-tauri/src/commands/`, heavy tools as sidecars located via `tools.rs`, project model in `src/lib/project.ts`, React editor components in `src/components/editor/`.

Scope note: this spec covers analysis, solving, preview and a **per-clip export filter-chain builder**. Verso has no export command yet (`src-tauri/src/commands/` holds only `media.rs`, `thumbnails.rs`); section 8 defines the interface that export pipeline must call. Full multi-clip export is a separate spec.

## 1. What the user gets

A landscape (or square, or 4:3) talking video goes in. Verso finds the people on screen, works out who is speaking when, and produces a 9:16 (or 1:1) crop that follows the right person smoothly, with no settings to learn. Three modes, picked automatically with one-click override in the Inspector:

| Mode | Default when | Behaviour |
| --- | --- | --- |
| `follow` | one person on screen most of the time | Crop follows that face, auto-zoomed so the face is a good size. |
| `active` | 2+ people in one wide shot, interview style | Crop sits on whoever is talking; holds for a minimum time so it never flickers. |
| `split` | 2 people in one wide shot, both talk a lot (podcast) | Top/bottom split screen, each half locked to one person. |

**Trigger (one-click promise).** Analysis starts automatically, in the background, the moment a clip whose source aspect differs from the project aspect lands on the video track (import, or switching the project from 16:9 to 9:16/1:1). All clips are queued; the selected clip goes first. Until analysis finishes, preview and export use `center` mode; export while analysis is still running shows a non-blocking notice: "We're still finding people in {clip}. Export now with a centred crop, or wait?" with buttons "Wait" (default) and "Export anyway".

Users see a **People** strip (one thumbnail per detected person, renamable), the preview updates live, and export bakes the crop with FFmpeg. Nothing leaves the machine.

## 2. Models and licences (verified 2026-11-06)

Every shipped model is an `.onnx` file bundled as a Tauri resource (data, not a sidecar binary). Runtime: ONNX Runtime (MIT) via the `ort` crate.

| Role | Choice | Licence (model) | Training data | Verified at |
| --- | --- | --- | --- | --- |
| Runtime | `ort = "=2.0.0-rc.15"` (published 2026-10-19, re-verified on crates.io 2026-11-06; no stable 2.0 yet), with `load-dynamic`; the ONNX Runtime 1.x build that `ort-sys` rc.15 pins is vendored by `scripts/fetch-ort.mjs` (one copy of `onnxruntime.dll` + `DirectML.dll`, shared with the auto-clips spec's VAD) | ort: MIT OR Apache-2.0; ONNX Runtime: MIT | n/a | https://crates.io/api/v1/crates/ort , https://github.com/pykeio/ort |
| GPU EP (Windows) | `DirectML.dll` (Microsoft.AI.DirectML NuGet, version pinned to what the chosen ORT release was built against) | **Proprietary, not open source**: "Microsoft Software License Terms – DirectX Machine Learning". §1(a) permits redistribution inside applications on Windows/Xbox only; §3(e) no standalone distribution; §3(b) no reverse engineering; §1(c)/§3(c) ThirdPartyNotices must ship unmodified. **Needs explicit legal sign-off**; without it, ship CPU-only on Windows. | n/a | https://www.nuget.org/packages/Microsoft.AI.DirectML/1.15.4/License |
| Face detection | **YuNet** `face_detection_yunet_2026may.onnx` (dynamic H/W) from OpenCV Zoo | MIT ("All files in this directory are licensed under MIT License"); training code libfacedetection.train BSD-3 | README cites WIDER Face for evaluation; no restriction stated | https://raw.githubusercontent.com/opencv/opencv_zoo/main/models/face_detection_yunet/README.md (lists 2026may as "the default model with dynamic input shape", plus 2023mar and 2023mar_int8bq) |
| Face detection fallback | YuNet `face_detection_yunet_2023mar.onnx` (fixed input; use if the dynamic graph fails under ort). MediaPipe BlazeFace short-range is **selfie/vlog only** (card: faces must span >= 20% of each image side), so it is not a general fallback. | MIT / Apache-2.0 | see model card | https://storage.googleapis.com/mediapipe-assets/MediaPipe%20BlazeFace%20Model%20Card%20(Short%20Range).pdf |
| **Excluded** | InsightFace SCRFD/RetinaFace/buffalo ("non-commercial research purposes only"); Ultralytics YOLO (AGPL) | | | https://raw.githubusercontent.com/deepinsight/insightface/master/README.md |
| Tracking | Own Rust ByteTrack-style IoU + Kalman tracker (algorithm only) | n/a | n/a | https://raw.githubusercontent.com/ifzhang/ByteTrack/main/LICENSE |
| Voice activity | **Silero VAD** v5 ONNX, 16 kHz | MIT (repo LICENSE, "Copyright (c) 2020-present Silero Team"). The README badge alt-text says "CC BY-NC 4.0" but the badge image and the text say MIT and the badge links to the MIT LICENSE file; the NC terms belong to other Silero models. Record this in MANIFEST.json. | not stated as restricted | https://raw.githubusercontent.com/snakers4/silero-vad/master/LICENSE , https://github.com/snakers4/silero-vad/blob/master/README.md |
| Speaker segmentation | **pyannote `segmentation-3.0`** ONNX (`model.int8.onnx` from sherpa-onnx's export; Apache-2.0 tooling) | MIT (card `license: mit`; HF repo is gated = access step, not a licence term) | AISHELL, AliMeeting, AMI, AVA-AVD, DIHARD, Ego4D, MSDWild, REPERE, VoxConverse. Some datasets have their own terms; the card imposes none. Carry the alternative below. | https://huggingface.co/pyannote/segmentation-3.0 , https://github.com/k2-fsa/sherpa-onnx/blob/master/scripts/pyannote/segmentation/export-onnx.py |
| Segmentation alternative | No model: VAD regions + embedding change-point split (6.3). | MIT | | |
| **Excluded** | `pyannote/speaker-diarization-3.1` (Python-only pipeline); Rev `reverb` (repo Apache-2.0 but README: "The license in this repository applies only to the code not the models"; model terms are separate on gated HF pages and not verified) | | | https://github.com/revdotcom/reverb/blob/main/README.md |
| Speaker embedding (primary) | NVIDIA **TitaNet-large** ONNX (`nemo_en_titanet_large.onnx` in the sherpa-onnx `speaker-recongition-models` release; tag typo is real) | CC-BY-4.0 (card metadata and text). Attribution in About panel. | VoxCeleb 1/2, Fisher, Switchboard, LibriSpeech, SRE 2004–2010 | https://huggingface.co/nvidia/speakerverification_en_titanet_large |
| Embedding alternative | 3D-Speaker **ERes2Net** ONNX (`3dspeaker_speech_eres2net_*_16k.onnx`) | **Unverified**: GitHub LICENSE covers code only; the ModelScope card has no licence field. Do not ship until Alibaba/ModelScope provides a written weight licence. If adopted later, it is faster than TitaNet and trained on 200k Mandarin speakers. | Alibaba internal, no published terms | https://github.com/modelscope/3D-Speaker , https://modelscope.cn/models/iic/speech_eres2net_base_200k_sv_zh-cn_16k-common |
| Active speaker (audio-visual) | **LR-ASD** (canonical repo Junhua-Liao/LR-ASD; airmeet/LR-ASD is a fork), exported by us to ONNX at dev time | MIT (LICENSE, "Copyright (c) 2025 Liao Junhua") | AVA-ActiveSpeaker (annotations CC BY 4.0; clips are films; flag to legal) | https://raw.githubusercontent.com/Junhua-Liao/LR-ASD/main/LICENSE , https://raw.githubusercontent.com/Junhua-Liao/LR-ASD/main/dataLoader.py |
| ASD alternative | TalkNet-ASD (`TaoRuijie/TalkNet-ASD`, LICENSE.md, MIT), ~15M params | MIT | AVA-ActiveSpeaker | https://github.com/TaoRuijie/TalkNet-ASD |
| ASD no-model fallback | Mouth-motion energy from YuNet mouth landmarks (6.4) | n/a | n/a | |

Embedding dimension is **read from the ONNX output shape at load time**, never hard-coded (TitaNet is 192-d; the sherpa ERes2Net family mixes 192-d and 512-d).

`models/MANIFEST.json` stores, per model: file, version, SHA-256, licence id, licence URL, **SHA-256 of the licence text at that URL**. `scripts/fetch-models.mjs` fails the build if either hash changes (gated HF repos and ModelScope cards can change terms without versioning). Hashes are verified once per install and a stamp (`models/.verified-<app-version>`) is written; startup does not re-hash. Installer budget: ORT ~15 MB + DirectML ~20 MB + models (YuNet 0.3, Silero 2, segmentation int8 ~2, TitaNet ~90, LR-ASD ~4) <= 140 MB total.

Hardware: `ort` with `load-dynamic`; `onnxruntime.dll` and `DirectML.dll` ship next to the executable, like the FFmpeg sidecars in `tools.rs`. EP order on Windows: DirectML then CPU; macOS: CoreML then CPU. `VERSO_ML_CPU_ONLY=1` forces CPU (used in tests). CUDA EP is not shipped.

## 3. Pipeline overview

```
reframe_analyze(sourcePath)                       -- whole source file, once
  ├─ A. ffmpeg → shot boundaries (scdet)
  ├─ B. ffmpeg → 640px bgr24 frames @ 10 fps CFR (pipe) → YuNet → tracker → FaceTrack[]
  ├─ C. ffmpeg → 16 kHz mono s16le (pipe) → Silero VAD → segmentation (VAD regions only) → TitaNet embeddings → clustering → VoiceSegment[]
  ├─ D. Audio-visual match: LR-ASD on 25 fps face crops of each track (second decode pass, shot ranges only) or mouth-motion fallback
  ├─ E. People: tracks → Person[] (voice cluster + shot continuity), thumbnails
  └─ emit ReframeAnalysis → <app_cache>/reframe/<analysis_id>.json + compact summary into the project
reframe_solve(summary, range, aspect, mode, zoom)  -- milliseconds, pure
  ├─ F. Mode choice + target selection per 0.1 s → raw crop centres
  └─ G. One-euro smoothing + shot snaps → CropKeyframe[]
```

A, B and C run in parallel `spawn_blocking` threads; D runs after B and C. Progress via Tauri `Channel<ReframeProgress>`. A shared `Arc<AtomicBool>` cancellation flag is checked per frame (B, D) and per window (C); cancelling also kills FFmpeg children.

**One clock.** Face time and audio time must agree. The video pipe uses `fps=10:round=near` (CFR) so frame i is at `i/10 s` relative to the video stream start; `ffprobe -show_entries stream=start_time` gives the video and audio `start_time`, and the audio pipe time is offset by `(audio_start - video_start)`. All times in the analysis are **source seconds relative to the video stream start**.

**Long sources.** Only video decoding/tracking is chunked (5-min chunks, split at the nearest shot cut so tracker state never has to cross a chunk edge). Audio embeddings are collected over the whole file and **clustered once**; `Person` ids are assigned once after clustering. A 90-min podcast therefore has the same two People throughout.

## 4. Data structures

### TypeScript (`src/lib/reframe.ts`, imported by `src/lib/model` for the two optional fields it adds)

```ts
export type ReframeMode = "follow" | "active" | "split" | "center";

/** One source media file's analysis. Lives in Project.analyses[mediaId] (editing-model §1.2); paths never enter the project. */
export interface SourceAnalysis {
  mediaId: string;           // MediaRef id; the Rust side receives the resolved path at call time
  analysisId: string;        // sha256(path, size, mtime, modelVersions)
  srcW: number; srcH: number; durationSec: number;
  speakers: Speaker[];
  summary: AnalysisSummary;  // compact: enough to re-solve without the cache (typ. 20-200 KB)
}
export interface Speaker {
  id: string;                // "p1", "p2" ... unique within a SourceAnalysis
  name: string;              // default "Person 1"; user-renamable
  thumbnailKey: string;      // cache-relative, e.g. "reframe/<analysisId>/p1.jpg"; resolve via appCacheDir()
  faceTrackIds: number[];
  voiceClusterId: number | null;
  speakingSec: number; onScreenSec: number;
}
export interface AnalysisSummary {
  shots: { start: number; end: number }[];
  /** Per track, boxes at 0.5 s (downsampled from 0.1 s), normalised, plus speaking score. */
  tracks: { id: number; shot: number; speakerId: string | null;
            samples: { t: number; cx: number; cy: number; w: number; h: number; speaking: number }[] }[];
  voice: { start: number; end: number; cluster: number }[];
  saliency: { t: number; cx: number; cy: number }[];   // 1 Hz, only for faceless spans
  suggestedMode: ReframeMode; modeConfidence: number;  // 0..1
}
/** Crop window in normalised source coordinates (0..1). `atUs` is CLIP-relative, like every other keyframe in the project. */
export interface CropKeyframe { atUs: Us; cx: number; cy: number; w: number; h: number; hold: boolean }
export interface SplitPane { speakerId: string; keyframes: CropKeyframe[] }
export interface Reframe {
  mode: ReframeMode; aspect: AspectRatio;
  followSpeakerId?: string; panes?: [SplitPane, SplitPane];
  keyframes: CropKeyframe[];      // follow/active/center
  zoom: number;                   // relative to auto zoom: 1.0 = auto; slider 100..200% → 1..2
  analysisId: string;
}
// Added to the editing model (its §1.2): MediaClip.reframe?: Reframe  and  Project.analyses: Record<string /*mediaId*/, SourceAnalysis>
```

Clip range in source seconds for the solver: `in = usToSec(clip.inUs)`, `out = in + usToSec(clip.durationUs) * clip.speed`. `Reframe.keyframes` cover that range only (the TS wrapper converts the solver's seconds to clip-relative `atUs`); solving is repeated on trim because it is cheap, analysis is not. `Reframe` is applied **before** `MediaClip.crop`, so auto-clips punch-ins zoom inside the reframed window. Changes are made with the editing-model `setReframe` op (undoable).

### Rust (`src-tauri/src/reframe/types.rs`, `serde(rename_all = "camelCase")`)

```rust
pub struct FaceBox { pub t: f32, pub x: f32, pub y: f32, pub w: f32, pub h: f32, pub score: f32,
                     pub mouth: [[f32; 2]; 2] }          // normalised; YuNet landmarks 3,4
pub struct FaceTrack { pub id: u32, pub shot: u32, pub boxes: Vec<FaceBox>, pub speaking: Vec<f32> }
pub struct Shot { pub start: f32, pub end: f32 }
pub struct VoiceSegment { pub start: f32, pub end: f32, pub cluster: i32 }    // -1 = unknown/off-camera
pub struct Person { pub id: String, pub face_track_ids: Vec<u32>, pub voice_cluster: Option<i32>,
                    pub thumbnail_key: String, pub speaking_sec: f32, pub on_screen_sec: f32 }
pub struct ReframeAnalysis { pub analysis_id: String, pub src_w: u32, pub src_h: u32, pub duration: f64,
    pub shots: Vec<Shot>, pub tracks: Vec<FaceTrack>, pub voice: Vec<VoiceSegment>,
    pub people: Vec<Person>, pub summary: AnalysisSummary, pub warnings: Vec<String> }
pub struct ReframeProgress { pub stage: &'static str, pub fraction: f32 } // "faces"|"voices"|"matching"|"done"
pub struct SolveRequest { pub summary: AnalysisSummary, pub src_w: u32, pub src_h: u32,
    pub in_sec: f64, pub out_sec: f64, pub aspect: String, pub mode: ReframeMode,
    pub follow_speaker: Option<String>, pub zoom: f32 }
```

Full analysis JSON: `<app_cache>/reframe/<analysis_id>.json` (deletable). The project keeps `SourceAnalysis.summary`, so **solving never needs the cache**. Paths inside the project are cache-relative keys.

## 5. Tauri commands (`src-tauri/src/commands/reframe.rs`, register in `lib.rs`)

```rust
#[tauri::command] pub async fn reframe_analyze(app: AppHandle, path: String,
        on_progress: Channel<ReframeProgress>) -> Result<ReframeAnalysis, String>;   // whole file, cached
#[tauri::command] pub fn reframe_solve(req: SolveRequest) -> Result<Reframe, String>; // pure, no I/O
#[tauri::command] pub async fn reframe_cancel(analysis_id: String) -> Result<(), String>;
#[tauri::command] pub async fn reframe_speaker_thumbnail(app: AppHandle, path: String, t: f64,
        face: [f32; 4]) -> Result<String, String>;      // returns cache-relative key
#[tauri::command] pub fn reframe_export_chain(clip: ExportClipSpec) -> Result<ExportChain, String>; // section 8
#[tauri::command] pub async fn ml_capabilities() -> Result<MlCapabilities, String>;
   // { provider: "directml"|"coreml"|"cpu", modelsPresent: bool }   (encoders come from the export spec's `encoder_capabilities`, the one probe)
```

If `reframe_analyze` finds `<analysis_id>.json` it returns it immediately. The analysis id depends on path+size+mtime: a moved file gets a new id, so the UI first tries the stored summary (works), and only when the user asks to "Find people again" does it need the file. Missing file message: "We can't find {file}. Locate it to re-analyse; your current framing still works."

## 6. Algorithms

### 6.1 Shot boundaries (A)

```
ffmpeg -hide_banner -loglevel error -i SRC -an
  -vf "scale=320:-2,scdet=threshold=10,metadata=mode=print:key=lavfi.scd.time:direct=1:file=-"
  -f null NUL        (/dev/null on macOS; stdout then carries only metadata lines)
```
`scdet` threshold default 10 (range 0–100). Parse `lavfi.scd.time=<sec>`. Merge cuts closer than 0.5 s. Zero cuts is normal.

### 6.2 Faces and tracks (B)

```
ffmpeg -hide_banner -loglevel error -hwaccel auto -i SRC -an
  -vf "fps=10:round=near,scale=640:-2" -pix_fmt bgr24 -f rawvideo -
```
`-hwaccel d3d11va` (`videotoolbox` on macOS) only when the export spec's `encoder_capabilities().hwDecode` is true, with one automatic retry without it on a non-zero exit (analysis may retry; export does not). Read `640*H*3` bytes per frame. **BGR**, because YuNet is trained for OpenCV's `blobFromImage` defaults (scale 1.0, no mean, `swapRB=false`). 15 fps for clips under 60 s.

**YuNet decode (raw ONNX, not the `cv::FaceDetectorYN` post-processed rows).** Source: https://raw.githubusercontent.com/opencv/opencv/4.x/modules/objdetect/src/face_detect.cpp.
1. Pad the frame bottom/right with zeros to `padW = ((W-1)/32+1)*32`, same for H. Input tensor NCHW float32, values 0–255, BGR.
2. Outputs (12 tensors): `cls_8, cls_16, cls_32, obj_8, obj_16, obj_32, bbox_8, bbox_16, bbox_32, kps_8, kps_16, kps_32`. For stride `s in {8,16,32}`: `cols = padW/s`, `rows = padH/s`, cell `idx = r*cols + c`.
3. `score = sqrt(clamp01(cls[idx]) * clamp01(obj[idx]))`; skip if `< 0.6` (lower than the demo's 0.9 because small podcast faces matter).
4. `cx = (c + bbox[4idx+0]) * s`, `cy = (r + bbox[4idx+1]) * s`, `w = exp(bbox[4idx+2]) * s`, `h = exp(bbox[4idx+3]) * s`, `x1 = cx - w/2`, `y1 = cy - h/2`.
5. Landmark n (0..4): `lx = (kps[10idx+2n] + c) * s`, `ly = (kps[10idx+2n+1] + r) * s`; order right eye, left eye, nose, right mouth corner, left mouth corner.
6. NMS, IoU 0.3, top-k 50. Keep boxes with `w >= 16 px` at 640 width. Normalise by the unpadded W/H.

Tracker (ByteTrack-style, per shot; tracks never cross a cut):
1. Kalman state `[cx, cy, w, h, vcx, vcy]`, constant velocity, dt = 0.1 s.
2. Hungarian match high-score boxes (>= 0.6) to predictions on 1-IoU (gate 0.3), then low-score boxes (0.3–0.6) to remaining tracks (gate 0.5).
3. Unmatched tracks survive 1.0 s then close; new tracks need 3 consecutive hits.
4. Drop tracks shorter than 0.7 s or mean area < 0.2% of frame unless they are the shot's only track.

### 6.3 Who speaks when (C)

Audio: `ffmpeg -i SRC -vn -ac 1 -ar 16000 -f s16le -` → f32, shifted by the start_time offset.

1. **VAD** (Silero v5, source https://github.com/snakers4/silero-vad/blob/master/src/silero_vad/utils_vad.py): chunks of exactly 512 samples; each call feeds `input` float32 `[1, 576]` = 64 context samples from the previous chunk (zeros at start) + 512 new; `state` float32 `[2,1,128]` (zeros at start, fed back from output); `sr` int64 scalar 16000. Outputs: `out` (speech prob), `state`. Speech if `out > 0.5`; merge gaps < 0.3 s; drop islands < 0.25 s.
2. **Segmentation** (primary) **only inside VAD-positive regions**: pyannote segmentation-3.0 int8 ONNX, input `x` `[1,1,160000]` (10 s), output `y` `[1,589,7]` powerset logits. Frame k is centred at `(991/2 + 270*k)/16000` s (receptive field 991, shift 270). Windows: 10 s with **5 s hop** (sherpa-onnx default). Argmax → {none, 1, 2, 3, 1+2, 1+3, 2+3}; stitch adjacent windows by Hungarian matching of local speakers over the 5 s overlap (cost 1 - overlap ratio); in the overlap, take the later window's labels after the midpoint.
   **Alternative (if legal rejects segmentation-3.0)**: split VAD regions at embedding change points (cosine distance of consecutive 1.5 s windows > 0.45). Loses overlapped speech.
3. **Embeddings**: TitaNet-large over every single-speaker segment >= 0.8 s (model input 80-bin log-mel fbank, 25/10 ms, as the NeMo preprocessor; features computed in Rust). Segments > 4 s split into 3 s pieces. Output dim read from the session.
4. **Clustering**: agglomerative complete linkage on cosine dissimilarity, threshold 0.5 (tunable, section 12). Cap 6 clusters; if the face count N is clear and 2 <= N <= 4, cut at N.
5. `VoiceSegment[]` at 0.1 s. Clusters with < 3 s speech → `-1`.

### 6.4 Audio-visual matching (D)

Primary: **LR-ASD** (TalkNet-style). Inputs per face track: **112x112 grayscale crops of the whole face at 25 fps** (verified in `dataLoader.py`: `cv2.resize(face,(112,112))`, `COLOR_BGR2GRAY`) and 13-dim MFCC at 100 Hz (25 ms window / 10 ms step, 4 audio frames per video frame). 10 fps frames are **not** enough for lip dynamics, so D runs a second decode pass **only over shot ranges that contain tracks**, at 25 fps, with a `crop` per track taken from the track's Kalman-smoothed box expanded 1.3x (one FFmpeg process per shot, `split` + N `crop,scale=112:112,format=gray` outputs). Run in 2 s chunks; sigmoid per frame → mean per 0.1 s bin. Time budget: if D would exceed 2x the B stage time, fall back.

Fallback (model missing, slow CPU, or low confidence): mouth-motion energy. `mouthWidth = |right mouth - left mouth| / faceWidth`; speaking score = normalised rolling variance over 0.5 s, gated by VAD. **Automatic switch**: if LR-ASD's mean margin between the top two tracks over speech time is < 0.15 (tunable; Hindi/Hinglish content is out of AVA's English film distribution), use the fallback for that source.

Person–voice binding: accumulate `sum(speaking * voice_active)` per (track, cluster); greedy maximum with >= 2 s co-activity. A cluster bound to no track is an **off-camera speaker** (interviewer behind the camera): it keeps cluster id but `Person.face_track_ids` is empty, it is excluded from `split` eligibility, and in `active` mode the crop **holds on the current on-screen person** while it speaks.

### 6.5 People (E)

Tracks merge into a `Person` when (a) they bind to the same voice cluster, or (b) they never overlap, sit in adjacent shots at similar normalised position (centre distance < 0.15) and size (ratio < 1.5x). Conservative by design; the UI allows "Same person" drag-merge and rename, both undoable (merge stores the pre-merge `Speaker[]` in the undo stack). People belong to one `SourceAnalysis`; clips from different files never merge. Thumbnail: box with highest `score*sqrt(area)` in the longest track, expanded 1.6x, cut by `reframe_speaker_thumbnail` using the `-ss`-before-`-i` pattern from `thumbnails.rs`.

Suggested mode (thresholds are **tunables** fitted on the tuning corpus, initial values):
- `follow` if one person covers >= 85% of on-screen face time.
- `split` if exactly two on-screen people are visible together >= 60% of the time and the quieter speaks >= 25% of speech.
- `active` if 2+ on-screen people otherwise.
- `center` if no faces for >= 70% of the duration.
`modeConfidence` = margin of the winning rule over its threshold, normalised to 0..1. When < 0.3 the Inspector shows once: "We picked Split. Change?" with the segmented control highlighted.

### 6.6 Target selection (F)

Crop size. Output aspect `a_out` (9/16 or 1), source `src_w x src_h`. Base crop (`zoomAuto = 1`): `h0 = min(src_h, src_w / a_out)`, `w0 = h0 * a_out` (covers 16:9, 4:3, 1:1 and vertical sources; if source aspect equals output aspect, no reframe). **Auto zoom** in `follow`/`active`: `zoomAuto = clamp(targetFaceFrac * h0 / medianFaceH, 1.0, 1.6)` with `targetFaceFrac = 0.22` (face height 22% of crop height); `center`/`split`: `zoomAuto = 1`. Effective `zoom = zoomAuto * reframe.zoom`; `h = h0 / zoom`, `w = w0 / zoom`. Inspector's current default of 112% is replaced by 100% = auto. **Rounding rule (shared by Rust solver and TS `cropAt`)**: in pixels, `w, h` rounded down to even; `x, y` rounded to nearest even; then clamped to `[0, src - w]`.

Target centre per 0.1 s:
- **follow**: followed person's box centre, `cy = faceCy + 0.10*h` (face at ~40% from top). Absent in shot: largest face; no face: saliency.
- **active** (hysteresis): candidate = highest speaking score over the last 0.6 s among on-screen people. Switch only if candidate beats holder by 0.25 for 0.4 s **and** holder held >= 1.5 s. Re-evaluate at shot cuts. If both fit (combined box width <= 0.9 w), frame both.
- **split**: two independent `follow` solves, one per pane, pane aspect 9:8 (`h = h0/zoom`, `w = h*9/8`, even-rounded: at 1080p → 1214x1080). First speaker on top. Pane person off screen: hold last keyframe.
- **saliency (no face)**: spectral-residual saliency (Hou & Zhang 2007) on a 64x36 grey frame, blended 50/50 with frame-difference centroid; unstable (std > 0.2 over 2 s) → frame centre.

### 6.7 Smoothing and keyframes (G)

Per shot, one-euro filter on `cx, cy` (`fc_min = 0.6 Hz`, `beta = 0.3`, d-cutoff 1 Hz), dead zone 1.5% of width, clamp inside frame. Shot cuts and `active` switches emit `hold: true` keyframes (hard jump, no pan). Keyframes at 10 Hz where motion exists, simplified with Ramer-Douglas-Peucker (tolerance 0.3% of width).

**Manual nudge (this phase, minimal)**: dragging the crop rectangle in the preview sets a `hold` keyframe at the current time with the dragged centre and a second `hold` keyframe at the end of the current shot; the segment between is constant. Undo supported through the existing project undo stack; re-analysis warns ("Re-analysing will replace your manual framing. Continue?").

## 7. Preview

The preview engine is the export spec's `src/lib/player/` (§5.2 there: `ClipPool` of `<video>` elements, `AudioContext` clock, canvas path for transitions and multi-clip frames). This spec adds one pure function, `cropAt(reframe, clipRelativeUs)`, which interpolates keyframes (linear unless the previous is `hold`) with the section 6.6 rounding; the player applies it as CSS `transform: translate(...) scale(...)`, `transform-origin: 0 0` on a bare element, or as the source draw-rect on the canvas path. Split mode is a canvas-path frame: two draws of the same element (same `currentTime`) into the two panes. Face boxes draw on an overlay `<canvas>` only while the People strip is hovered; the crop rectangle is draggable (6.7).

**Asset scope**: `tauri.conf.json` limits `assetProtocol.scope` to app-owned folders (`$APPCACHE/**`, `$APPDATA/packs/**`, `$RESOURCE/**` after the templates spec), so a user's file in Videos is refused. Decision: on import and on every successful `resolve_media`, `media.rs` calls `app.asset_protocol_scope().allow_file(path)` (per-file, runtime scope via `tauri::scope::fs`), never a wildcard; the allowed set is rebuilt on project load. This is an explicit security choice shared by all specs: only files the user imported become readable by the webview.

## 8. Export filter-chain builder

The export spec's compiler (`src/lib/render/compile.ts`, its §3.2–3.3) owns the filtergraph; this spec defines the reframe fragment it inserts per segment and the `.cmd` file format. The Rust `reframe_export_chain` below is the reference implementation and the test oracle; the compiler uses a pure TypeScript port (`src/lib/render/reframeChain.ts`) checked against the same JSON fixtures, so export needs no IPC round-trip per clip.

```rust
pub struct ExportClipSpec { pub reframe: Reframe, pub src_w: u32, pub src_h: u32, pub in_sec: f64, pub out_sec: f64,
                            pub out_w: u32, pub out_h: u32, pub label: String }   // label = unique per clip, e.g. "c3"
pub struct ExportChain { pub filter: String, pub sendcmd_file: Option<PathBuf>, pub in_label: String, pub out_label: String }
```

`reframe_export_chain` writes `app_cache_dir()/exports/<jobId>/reframe_<label>.cmd` (the export spec's job dir; the TS port returns the text for `ExportRequest.aux_files`) and returns a filter string that maps `[in_label]` → `[out_label]`; the caller inserts `-ss IN -to OUT` on that input and chains labels. The trailing `scale=1080:1920` is the export spec's own scale step: the fragment inserted into its per-segment chain is only `sendcmd,crop@…`. Crop `w/h/x/y` are runtime-settable commands (T flag in `ffmpeg -h filter=crop`); `x/y` expressions re-evaluate per frame with `t`.

Single-crop (instance named per clip):
```
[in]sendcmd=f=<label>.cmd,crop@<label>=w=608:h=1080:x=412:y=0:exact=1,scale=1080:1920:flags=lanczos,setsar=1[out]
```
Command file, one interval per keyframe pair `(k0,k1)` in pixels; **intervals must not overlap by any amount** (`[enter]` fires once per interval start, then `t` animates; times compared as doubles), so the writer emits `t0-t1` then `t1-t2` with the shared boundary belonging to the later interval (`t1` start is exclusive of the previous end by subtracting 0.001 from each end):
```
12.300-13.099 [enter] crop@c3 x 'clip(412+(486-412)*(t-12.3)/(13.1-12.3),0,iw-ow)', [enter] crop@c3 y '0';
```
Hold keyframes emit constants. Times are output-relative (shift by `-IN`, 3 decimals); `w/h` fixed per export (zoom re-solves rather than animating `w`); all pixel values even.

Split:
```
[in]split=2[a][b];
[a]sendcmd=f=<label>.cmd,crop@<label>t=w=1214:h=1080:x=0:y=0:exact=1,scale=1080:960[t];
[b]crop@<label>b=w=1214:h=1080:x=706:y=0:exact=1,scale=1080:960[u];
[t][u]vstack,setsar=1[out]
```

Encoders, audio mapping and the CI assertion that the lgpl build lists `h264_nvenc h264_qsv h264_amf libopenh264` belong to the export spec (§1, §3.8) and the editing-model spec (§5.3 LGPL CI gate); this spec adds nothing there.

Fallback if `sendcmd` misbehaves: per-segment static crops + concat demuxer behind `VERSO_REFRAME_SEGMENTED=1`.

## 9. UI

- **People strip** (new `LeftPanel.tsx` tab, icon `subject-track`): round thumbnails, name, "spoke 1:20 · on screen 2:05"; inline rename; drag-merge with confirm; hover shows boxes.
- **Inspector**: segmented control "Follow · Who's talking · Split · Centre", speaker picker for Follow, Zoom slider 100–200% (100 = auto). Changes call `reframe_solve` immediately. Low-confidence nudge (6.5) shown once per clip.
- **Status**: "Finding people… 40%" with Cancel; preview usable in centre crop meanwhile.
- Copy: sentence case, verbs on buttons, no jargon.

## 10. Failure handling (`Err(String)` messages)

| Condition | Behaviour / message |
| --- | --- |
| Models missing/corrupt | "Verso's people-finding tools are missing. Reinstalling Verso usually fixes this." → `center`. |
| GPU EP fails to load | silent CPU retry; provider shown in About. |
| No faces | "We couldn't find any faces, so we'll keep the action in the middle." (`center`, saliency) |
| No speech | "This clip has no speech, so we'll follow the person on screen." (`follow`) |
| No video stream | "Reframing needs a video, not just sound." |
| Source aspect equals output aspect | skip; "This video already fits a {9:16 / square} reel." |
| Source file moved/missing | solve from stored summary; re-analysis asks: "We can't find {file}. Locate it to re-analyse; your current framing still works." |
| Cache cleared | no effect on solving; thumbnails regenerate lazily if the file exists, else a neutral avatar. |
| Project opened on another PC | summary travels in the project; works. |
| > 30 min | chunked video (section 3), one clustering pass; never refuse. |
| Pipe ends early | "We couldn't read part of this video. The reframe may be rough near {m:ss}." Continue. |
| Export during analysis | notice in section 1. |
| Cancelled | set flag, kill children (`Mutex<HashMap<analysisId, Child>>`), remove partial cache. |

Never modify the source. Intermediates live in the app cache.

## 11. Performance targets (dev box RTX A4000; "laptop" = 4-core i5, iGPU, 16 GB)

| Stage, 10-min 1080p30 | dev box | laptop CPU-only |
| --- | --- | --- |
| A+B: decode + YuNet + tracker @10 fps | <= 60 s | <= 4 min (4K60 with d3d11va: <= 6 min; without hwaccel: <= 10 min, warn once) |
| C: VAD + segmentation (int8, 5 s hop, VAD regions only, ~120 windows) + TitaNet + clustering | <= 30 s | <= 3 min |
| D: LR-ASD 25 fps pass | <= 30 s | <= 2x stage B, else auto-fallback |
| `reframe_solve` | < 20 ms | < 50 ms |
| Preview | 60 fps transforms | 30 fps |
| Export overhead vs plain scale | < 5% | same |
| Peak RAM | < 1.5 GB | same |

Overall: analysis under 1.0x of clip duration on the laptop, visible progress. Models load lazily once per session (`OnceLock<Session>`).

## 12. Test plan

Unit (Rust, no media):
- YuNet grid decode on a recorded 12-tensor fixture (`cls/obj/bbox/kps` x 3 strides) against boxes produced by `cv::FaceDetectorYN` on the same padded image; landmark order.
- Silero wrapper: context carry (576-sample input), state round-trip.
- Tracker: 0.8 s occlusion keeps id; crossing faces keep ids.
- Powerset decode (7 classes); window stitching with 5 s hop on synthetic overlaps; frame-time formula.
- Clustering: 3 synthetic clusters (0.2 within / 0.7 between) → 3 at 0.5.
- One-euro: step settles within 1 s; dead zone yields zero motion.
- Crop size and even-rounding for 16:9, 4:3, 1:1, 9:16 sources into 9:16 and 1:1; shared JSON fixture checked from Rust and Vitest (`cropAt`).
- sendcmd writer: `-IN` shift, 3 decimals, non-overlapping intervals, `clip()` bounds, even pixels.
- Solve from `AnalysisSummary` alone (cache dir absent).

Integration (gated by `VERSO_SAMPLE_MEDIA` / `VERSO_TEST_CORPUS`):
- Gate corpus (16 clips): single vlogger, two-person podcast, three-person panel, Hindi interview, Hinglish talk, noisy street, screen recording, vertical source, 4:3 source, silent b-roll, music video, fast cuts, 4K60, **VFR phone clip with audio/video start offset**, **90-min podcast** (People stable across chunks, no pane swap), **off-camera interviewer**.
- Tuning corpus (separate, 8 clips incl. a Hindi two-speaker clip) for thresholds; never tune on the gate corpus.
- Ground truth: shot cuts (±0.3 s), person count, active speaker per second.
- Gates: shot F1 >= 0.9; person count exact on 14/16; active-speaker accuracy >= 85% on podcast/panel (both LR-ASD and fallback reported); crop centre within 10% of width of the labelled face >= 95%; zero out-of-frame crops; face/audio drift < 0.1 s on the VFR clip.
- Moved-source test: analyse, move the file, reopen project, change mode → solve works; "Find people again" shows the locate message.
- Export round trip per clip chain: `ffprobe` 1080x1920, duration within 1 frame, even dims, audio present only when source has it; sampled frames contain the labelled face.
- Provider matrix: CPU everywhere (`VERSO_ML_CPU_ONLY=1`); DirectML on a Windows runner; CoreML on macOS. `ffmpeg -encoders` assertion (section 8).

Manual: non-technical tester exports a podcast reel without touching settings; `active` switches < 1 per 4 s.

## 13. Implementation checklist (in order)

1. Legal: DirectML terms sign-off; TitaNet CC-BY attribution text; OpenH264 patent note. Add all to `licenses/THIRD-PARTY.md`.
2. `ort` (`load-dynamic`, `directml`, `coreml`) in `Cargo.toml`; `ml.rs` provider selection, `VERSO_ML_CPU_ONLY`, `ml_capabilities` incl. encoder probe.
3. `scripts/fetch-models.mjs`: YuNet 2026may + 2023mar, Silero VAD v5, segmentation-3.0 int8, TitaNet-large; pin SHA-256 of model and licence text; `MANIFEST.json`; verification stamp.
4. `reframe/decode.rs`: CFR rawvideo (bgr24, hwaccel with retry) and s16le readers, start_time offset, cancellation flag; `shots.rs`.
5. `faces.rs` (grid decode) + `track.rs`; unit tests with the FaceDetectorYN fixture.
6. `voice.rs`: fbank, Silero (context/state), segmentation in VAD regions with 5 s hop, TitaNet, clustering; chunk-safe single clustering.
7. Dev-only `tools/export_lrasd.py`; `asd.rs` with the 25 fps crop pass, margin-based auto-fallback, mouth-motion.
8. `people.rs` (binding, off-camera clusters, merging, mode + confidence, thumbnails); `solve.rs` (auto zoom, rounding, targets, hysteresis, split, saliency, one-euro, RDP); `AnalysisSummary` builder.
9. `commands/reframe.rs`; cache; progress; register in `lib.rs`; per-file asset-scope allow in `media.rs`.
10. Frontend: `reframe.ts` types + `cropAt`; `Project.analyses` / `MediaClip.reframe` via the editing-model `setReframe` op; analysis queue + trigger; People tab; Inspector; `cropAt` hooked into the export spec's player (bare-element transform and canvas split pane), drag-nudge; undo for rename/merge/nudge.
11. `reframe_export_chain` (Rust oracle) + `reframeChain.ts` port with shared fixtures; compiler insertion point in the export spec §3.2; segmented fallback; round-trip test.
12. Corpus gates in CI; tune thresholds on the tuning corpus; macOS CoreML pass; laptop timing pass.
