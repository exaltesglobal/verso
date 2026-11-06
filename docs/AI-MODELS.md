# AI models (smart reframing)

Verso's reframing runs **on-device and offline**. Every model and library below is permissively licensed
for commercial, closed-source use. Licences were checked against each source repository (November 2026);
re-check the links before each release.

## What we ship

| Id           | Job                                  | Model                                     | Licence                 | Size      | Required |
| ------------ | ------------------------------------ | ----------------------------------------- | ----------------------- | --------- | -------- |
| `face_yunet` | Find faces + 5 landmarks             | YuNet 2023mar (OpenCV Zoo)                | MIT                     | 0.23 MB   | yes      |
| `vad_silero` | Hear when someone talks              | Silero VAD v5.1.2                         | MIT                     | 2.3 MB    | yes\*    |
| `face_sface` | Recognise a person after camera cuts | SFace 2021dec (OpenCV Zoo)                | Apache-2.0              | 38.7 MB   | optional |
| runtime      | Run the models                       | ONNX Runtime via the `ort` crate 2.0-rc15 | MIT / MIT OR Apache-2.0 | linked in | yes      |

\* If the voice model is missing, a loudness-based fallback is used (worse with music beds).

Licence sources:

- YuNet: <https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet> ("All files in this
  directory are licensed under MIT License").
- SFace: <https://github.com/opencv/opencv_zoo/blob/main/models/face_recognition_sface/LICENSE> (Apache-2.0).
- Silero VAD: <https://github.com/snakers4/silero-vad/blob/master/LICENSE> (MIT).
- `ort`: <https://crates.io/crates/ort> (MIT OR Apache-2.0); ONNX Runtime:
  <https://github.com/microsoft/onnxruntime/blob/main/LICENSE> (MIT).
- Downloader deps: `ureq` (MIT OR Apache-2.0), `sha2` (MIT OR Apache-2.0).

Ship the licence texts (MIT/Apache notices for the three models, ONNX Runtime and `ort`) in the installer's
`licenses/` folder next to the FFmpeg licence.

### Speed (rough, 640 px frames)

| Model      | CPU (4-core laptop)  | DirectML / CUDA |
| ---------- | -------------------- | --------------- |
| YuNet      | 3–8 ms / frame       | 1–3 ms          |
| SFace      | 10–20 ms / face      | 2–4 ms          |
| Silero VAD | < 1 ms / 32 ms chunk | not worth it    |

At 8 sampled fps, a 1-hour podcast is ~29k frames: about 2–4 minutes on CPU, dominated by video decode and
YuNet. SFace runs at most 5 times per face track, so it barely adds time.

## Rejected (and why)

| Option                                         | Why not                                                                                                                                                                                                     |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SCRFD / RetinaFace / ArcFace (InsightFace zoo) | Code is MIT, but InsightFace states its pretrained models are for **non-commercial research only**.                                                                                                         |
| Ultralytics YOLO (face/person)                 | **AGPL-3.0**.                                                                                                                                                                                               |
| BlazeFace (MediaPipe, Apache-2.0)              | Fine licence, but short-range model is tuned for selfie distance; YuNet is better on wide podcast shots and gives landmarks in the same pass. Kept as a fallback candidate behind the `FaceDetector` trait. |
| Light-ASD (code MIT) / TalkNet (code MIT)      | Weights are trained on AVA-ActiveSpeaker (YouTube-derived; dataset terms unclear for commercial redistribution). Also needs face-crop clips + MFCC plumbing. Revisit with our own trained weights.          |
| pyannote segmentation-3.0 (MIT)                | Licence is fine, but the weights are **gated** on Hugging Face (account + terms), so we can't pin a public download URL.                                                                                    |
| WeSpeaker ResNet34 (Apache-2.0)                | Good choice for audio diarization of **off-screen** voices. Not needed for v1 (voices are matched to visible faces); planned next.                                                                          |

## How speakers are found (v1 pipeline)

1. **Sample** with the FFmpeg sidecar: 8 fps, scaled to 640 px wide, `rawvideo rgb24` over a pipe; audio as
   16 kHz mono `s16le` over a pipe. Nothing is written to disk except the result.
2. **Faces**: YuNet per frame → our own tracker (constant-velocity prediction + greedy IoU, survives ~1 s
   without a detection).
3. **Voice**: Silero VAD per 32 ms chunk → speech segments with hysteresis (on > 0.5, off < 0.35 for 0.3 s).
4. **Who is talking** (heuristic active-speaker detection): for each ~1 s window of speech, the visible face
   whose mouth region (from YuNet's mouth-corner landmarks) changes most, relative to that face's own baseline.
5. **Identity**: tracks that never overlap in time are merged into one speaker if their SFace embeddings match
   (cosine > 0.4) or, without SFace, if they sit in the same place (box IoU > 0.3, i.e. same seat on a fixed camera).
6. **Planner**: crop path at 9:16 / 1:1 / 16:9 with a dead zone, a critically damped spring, a minimum hold
   (1.6 s) and switch delay (0.4 s) for speaker changes, and cut or pan transitions. `split_two` gives each of
   two speakers its own rect (stacked for portrait/square, side by side for landscape).

Results are cached in `<app cache>/reframe/<analysisId>.json` (key: file path + size + mtime + range +
installed models). Speaker thumbnails sit next to it.

## Runtime and execution providers

- `ort` with its default `download-binaries` feature: Cargo downloads a prebuilt ONNX Runtime **at build time**
  and links it **statically** into Verso. Nothing is downloaded at runtime and no extra DLL ships.
  Build machines need network access once (or set `ORT_LIB_LOCATION` to a local ONNX Runtime build).
- GPU is opt-in at build time via Cargo features on `verso`:
  - `--features directml` (Windows, any DX12 GPU; uses pyke's DirectML-enabled build),
  - `--features coreml` (macOS).
    If the provider fails to start, ONNX Runtime falls back to CPU automatically.
- CUDA is deliberately not a feature: it needs the multi-GB CUDA/cuDNN runtime on the user's machine.
  DirectML covers NVIDIA, AMD and Intel GPUs on Windows.

## Model distribution

Models are **not in git**. `src-tauri/src/reframe/models.rs` holds the registry: pinned URL (GitHub commit /
release tag), SHA-256 and size. `download_reframe_model(id)` streams to `<app data>/models/reframe/<file>.part`,
hashes while downloading, and only renames into place if the SHA-256 matches.

| Id           | Pinned URL                                                                                                     | SHA-256                                                            |
| ------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `face_yunet` | `github.com/opencv/opencv_zoo/raw/48b10fa5…/models/face_detection_yunet/face_detection_yunet_2023mar.onnx`     | `8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4` |
| `vad_silero` | `github.com/snakers4/silero-vad/raw/v5.1.2/src/silero_vad/data/silero_vad.onnx`                                | `2623a2953f6ff3d2c1e61740c6cdb7168133479b267dfef114a4a3cc5bdd788f` |
| `face_sface` | `github.com/opencv/opencv_zoo/raw/48b10fa5…/models/face_recognition_sface/face_recognition_sface_2021dec.onnx` | `0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79` |

Before launch, mirror the three files on our own CDN and point the URLs there (same hashes).

## Voice clean-up

| Id              | Job                          | Model                                                  | Licence                                     | Size    | Required |
| --------------- | ---------------------------- | ------------------------------------------------------ | ------------------------------------------- | ------- | -------- |
| `voice_rnnoise` | Remove noise behind speech   | RNNoise "somnolent-hogwash" (`sh.rnnn`), FFmpeg arnndn | Not copyrightable (per repo); RNNoise BSD-3 | 0.3 MB  | no\*     |

\* Downloaded once on first "Clean up voice" from a pinned commit of
<https://github.com/GregorR/rnnoise-models> and checked with SHA-256. The repo README states the trained
models are not creative work and not subject to copyright. If the download fails, FFmpeg's `afftdn` is used.
