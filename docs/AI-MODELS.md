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

# Background (blur, remove, replace)

Background effects run **on-device and offline** with the same ONNX Runtime as reframing. Checked November 2026.

| Id           | Job                               | Model                                                  | Licence    | Size    |
| ------------ | --------------------------------- | ------------------------------------------------------ | ---------- | ------- |
| `seg_selfie` | Separate the person from the room | MediaPipe Selfie Segmentation (general, 256x256), ONNX | Apache-2.0 | 0.46 MB |

- Source: <https://huggingface.co/onnx-community/mediapipe_selfie_segmentation> (model card `license: apache-2.0`),
  pinned to commit `be49485c8e027524be38591817fc5cd31bd9d00e`, file `onnx/model.onnx`,
  SHA-256 `3241ac4ad8aa35bdaf33946776db29f7c283a413aa0b0dacb9483594b4531aad`, 462,352 bytes.
  Input `pixel_values` float32 `[1,3,256,256]` RGB 0..1; output `alphas` `[1,1,256,256]`.
- Upstream model: Google MediaPipe Selfie Segmentation, Apache-2.0
  (<https://ai.google.dev/edge/mediapipe/solutions/vision/image_segmenter>, model card linked there). Ship its
  Apache-2.0 notice in `licenses/`.
- Stored in `<app data>/models/background/`, downloaded with the same hash-verified downloader as reframe
  (`download_background_model`). Mirror on our CDN before launch.

## Pipeline

1. FFmpeg decodes the clip range at the **source fps** (CFR via `fps=`), scaled so the long edge is at most
   1920 px (rotation metadata respected), as `rawvideo rgb24` over a pipe.
2. The model runs on each frame at 256x256. The mask gets a **temporal EMA** (steady where little moves,
   follows fast motion) and a **guided filter** at ~480 px against the frame's luma so edges follow hair and
   shoulders, then a soft smoothstep when upsampled for compositing.
3. Composite per mode: `blur` (area-downscale + box blur, strength 0..1), `studio` (lighter blur, darker
   vignetted background, gentle lift on the person), `replace` (solid colour, two-colour gradient, or a photo
   scaled to cover), `remove` (alpha).
4. A second FFmpeg encodes into `<app cache>/background/<key>.mp4|webm` (key = file + size + mtime + range +
   mode + options). The original file is never written. Writes go to `.part.*` and are renamed when complete.

## Output formats (LGPL FFmpeg sidecar)

| Mode                    | File                                                                             | Why                                                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| blur / studio / replace | MP4, H.264 (best working encoder from `export::encoders`, High preset), AAC 192k | Plays in the WebView preview and is a high-bitrate intermediate for export. No libx264 in the LGPL build.                      |
| remove                  | WebM, VP9 `yuva420p` (`libvpx-vp9`, CRF 20), Opus 160k                           | VP9 alpha plays with transparency in Chromium/WebView2 and FFmpeg reads it back. ProRes 4444/QTRLE do not play in the WebView. |

FFmpeg's native VP9 decoder **drops alpha**: when export composites a `remove` copy over other layers it must
open it with `-c:v libvpx-vp9 -i <file>`.

## Rejected (and why)

| Option                      | Why not                                                                                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Robust Video Matting (RVM)  | Code is **GPL-3.0**; no separate permissive weight licence.                                                                                                                |
| BRIA RMBG-1.4 / 2.0         | Weights are **non-commercial** (commercial needs a paid BRIA agreement).                                                                                                   |
| BiRefNet                    | Code MIT, weight licence not stated separately; ~1 GB class model, far too slow per video frame.                                                                           |
| MODNet                      | Apache-2.0 for code **and** models (README "License"), good portrait matting. Weights only on Google Drive (no pinnable URL); candidate for a later "high quality" option. |
| PP-HumanSeg (PaddleSeg)     | Apache-2.0, fine licence, but needs a Paddle-to-ONNX conversion we'd have to host; MediaPipe is smaller.                                                                   |
| MediaPipe Selfie Multiclass | Apache-2.0, but 256x256 multiclass is slower and we only need person vs. background.                                                                                       |

# Voice and translation

Voiceover and dubbing run **on-device and offline** after three one-time downloads into
`<app data>/models/voice/<pack>/` (registry: `src-tauri/src/voice/models.rs`, same pinned-URL + SHA-256 +
`.part` rename flow as reframe; each file's hash is in the registry). Licences checked November 2026 against
each source; re-check before each release.

## What we ship

| Pack          | Job                               | Model / data                                                                                     | Licence    | Size    |
| ------------- | --------------------------------- | ------------------------------------------------------------------------------------------------ | ---------- | ------- |
| `voice`       | Text to speech (en, hi; mr\*)     | Kokoro-82M v1.0, ONNX int8 (`onnx-community/Kokoro-82M-v1.0-ONNX@1939ad2a`, `model_quantized`)    | Apache-2.0 | 92.4 MB |
| `voice`       | 8 voices (style vectors)          | `af_heart`, `am_michael`, `bf_emma`, `bm_george`, `hf_alpha`, `hf_beta`, `hm_omega`, `hm_psi`    | Apache-2.0 | 4.2 MB  |
| `voice`       | English pronunciations            | misaki `us_gold.json` + `us_silver.json` (`hexgrad/misaki@fba12365`)                             | Apache-2.0 | 6.1 MB  |
| `mt_en_indic` | English → Hindi/Marathi (+20 more) | IndicTrans2 en-indic distilled 200M, ONNX int8 (`hari31416/…-en-indic-dist-200M-ONNX-int8@1eaa43a3`) | MIT        | 304 MB  |
| `mt_indic_en` | Hindi/Marathi/Hinglish → English  | IndicTrans2 indic-en distilled 200M, ONNX int8 (`hari31416/…-indic-en-dist-200M-ONNX-int8@a7ecdc0b`) | MIT        | 260 MB  |
| library       | Translator tokenizers             | `tokenizers` crate 0.23 (+ Oniguruma via `onig`)                                                  | Apache-2.0 (Oniguruma BSD-2) | linked in |

\* No permissively licensed Marathi voice exists. Marathi is read by the Hindi voices with our Devanagari rules:
understandable, with a Hindi accent.

Licence sources:

- Kokoro-82M: <https://huggingface.co/hexgrad/Kokoro-82M> (Apache-2.0; voices included). ONNX export:
  <https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX> (Apache-2.0).
- misaki: <https://github.com/hexgrad/misaki/blob/main/LICENSE> (Apache-2.0).
- IndicTrans2: code <https://github.com/AI4Bharat/IndicTrans2/blob/main/LICENSE> (MIT); weights
  <https://huggingface.co/ai4bharat/indictrans2-en-indic-dist-200M> and
  <https://huggingface.co/ai4bharat/indictrans2-indic-en-dist-200M> (MIT). ONNX int8 exports by Hari31416
  (MIT, <https://github.com/Hari31416/indictrans2-onnx-export>).
- `tokenizers`: <https://github.com/huggingface/tokenizers/blob/main/LICENSE> (Apache-2.0).

### Attribution (ship in `licenses/` and the About screen)

> Speech: Kokoro-82M by hexgrad, Apache License 2.0. English pronunciations: misaki by hexgrad, Apache License 2.0.
> Translation: IndicTrans2 by AI4Bharat (Gala et al., 2023, "IndicTrans2: Towards High-Quality and Accessible
> Machine Translation Models for all 22 Scheduled Languages of India", TMLR), MIT License; ONNX conversion by
> Hari31416, MIT License. Tokenizers by Hugging Face, Apache License 2.0.

## How it works

- **Phonemes without espeak-ng.** Kokoro and Piper were trained on espeak-ng phonemes, but espeak-ng is
  **GPL-3**, so it is never linked or shipped. `src-tauri/src/voice/g2p.rs` replaces it:
  - English: misaki gold/silver dictionaries (~180k words, already in Kokoro's alphabet), suffix rules
    (-s, -ed, -ing, -ly), acronyms spelled out, numbers to words, and a crude letter-to-sound fallback.
  - Hindi/Marathi: our rule-based Devanagari reader: consonant/vowel tables, nukta, anusvara (homorganic
    nasal or nasal vowel), chandrabindu, visarga, and Hindi schwa deletion (final + VCəCV, kept after nasal
    codas). Hindi numbers are read digit by digit (shortcut).
  - Mixed text works: each word is read by its script, so Hinglish in Devanagari + English words is fine.
- **Speech.** Phoneme ids (≤ 510 per chunk; we split at sentences around 400) + voice style row + speed →
  24 kHz mono. Chunks are joined with a 0.12 s pause. Hindi voices reading English give an Indian accent.
- **Translation.** IndicTrans2 input is `"<src_tag> <tgt_tag> text"` (e.g. `eng_Latn hin_Deva …`), greedy
  decoding without KV cache (shortcut: fine for caption lines; add `decoder_with_past_model.onnx` for long
  text). Hinglish (Latin letters) is first transliterated to Devanagari by rules, keeping dictionary English
  words, then translated as Hindi. Hindi ↔ Marathi directly is not offered (would need the 320M indic-indic
  model, also MIT).
- **Dubbing.** Each caption line is translated, spoken, then fitted into its slot with FFmpeg `atempo`
  (0.8–1.25×). Longer lines are sped to 1.25× and may run into the following silence, then trimmed with a
  40 ms fade; shorter lines keep natural speed and are padded. One WAV is mixed, original Sound clips under
  it are muted (volume 0), caption text is replaced and timings kept.

## Quality notes (honest)

- English (misaki voices `af_heart`, `bf_emma`): very natural; unknown names can be mispronounced by the
  fallback rules.
- Hindi: Kokoro's Hindi voices are graded C by their author (fewer training hours) and our rules are simpler
  than espeak's, so expect clear but slightly flat, occasionally wrong stress/vowel length. Good enough for
  reels; not studio narration.
- Marathi: Hindi accent (see above).
- Translation: IndicTrans2 is the best open model for Indian languages; int8 keeps ~90 BLEU of FP32 on the
  exporter's fixtures. Slang and Hinglish are the weak spot: users should review captions after dubbing.
- Not runtime-smoke-tested in this branch (model downloads skipped); verify the first run on a dev machine.

## Rejected (and why)

| Option                                       | Why not                                                                                                   |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| espeak-ng (phonemizer for Piper/Kokoro)      | **GPL-3**.                                                                                                |
| Piper `hi_IN` pratham / priyamvada            | Voice data **CC BY-NC-SA 4.0** (non-commercial).                                                          |
| Piper `hi_IN` rohan                           | Trained on IIT Madras IndicTTS, custom licence requiring an agreement; not clearly commercial. Also needs espeak phonemes. |
| Piper (engine, MIT) in general               | Per-voice licences vary, no Marathi, quality below Kokoro; the newer piper1 repo is GPL-3.                |
| Coqui XTTS-v2                                | **CPML** (non-commercial).                                                                                |
| Meta NLLB-200 / SeamlessM4T                  | **CC BY-NC 4.0** (non-commercial).                                                                        |
| Opus-MT (Helsinki-NLP, CC-BY-4.0)            | Licence OK (attribution), but en↔hi/mr quality is far below IndicTrans2. Fallback candidate.              |
| AI4Bharat IndicF5 / Indic Parler-TTS         | Better Indian voices but large (>800 MB) and/or dataset terms unclear; revisit.                           |
