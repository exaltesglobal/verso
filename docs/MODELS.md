# Model register

Every on-device model Verso can download. None of them ship with the installer or live in git. Each file is
downloaded on first use, checked against the SHA-256 below, and kept in the app data folder
(`<app data>/models/...`). After that the feature works offline. Background and licence research:
[AI-MODELS.md](AI-MODELS.md).

## Download source and our own mirror

Today the files come from the upstream URLs in the code (Hugging Face, GitHub, pinned to fixed commits where the
host allows it). Every download goes through one function, `reframe::models::mirrored`
(`src-tauri/src/reframe/models.rs`):

- Set `VERSO_MODEL_MIRROR` (at build time to bake it in, or at run time to override) to the mirror's base URL,
  for example `https://models.verso.agapelabs.com`.
- `https://host/path/file` is then fetched from `<mirror>/host/path/file`. Copy the files to the mirror with
  the same `host/path` layout.
- The SHA-256 pins don't change, so a mirror can't swap a file: a mismatch is rejected and deleted.

Before launch, every file below must be on our own server (see "Decisions for Anup" in
[specs/AUDIT.md](specs/AUDIT.md)).

## Register

Sizes are exact bytes from the code; MB = 10^6 bytes.

### Captions (whisper.cpp, `src-tauri/src/captions/models.rs`)

OpenAI Whisper weights (MIT) converted to ggml by the whisper.cpp project (MIT). Source:
`https://huggingface.co/ggerganov/whisper.cpp/resolve/main/<file>`. The user picks one.

| Id | File | Size | SHA-256 | Licence |
| --- | --- | --- | --- | --- |
| base-q5_1 | ggml-base-q5_1.bin | 59,707,625 (59.7 MB) | `422f1ae452ade6f30a004d7e5c6a43195e4433bc370bf23fac9cc591f01a8898` | MIT |
| base-q8_0 | ggml-base-q8_0.bin | 81,768,585 (81.8 MB) | `c577b9a86e7e048a0b7eada054f4dd79a56bbfa911fbdacf900ac5b567cbb7d9` | MIT |
| small-q5_1 | ggml-small-q5_1.bin | 190,085,487 (190.1 MB) | `ae85e4a935d7a567bd102fe55afc16bb595bdb618e11b2fc7591bc08120411bb` | MIT |
| small-q8_0 | ggml-small-q8_0.bin | 264,464,607 (264.5 MB) | `49c8fb02b65e6049d5fa6c04f81f53b867b5ec9540406812c643f177317f779f` | MIT |
| medium-q5_0 | ggml-medium-q5_0.bin | 539,212,467 (539.2 MB) | `19fea4b380c3a618ec4723c3eef2eb785ffba0d0538cf43f8f235e7b3b34220f` | MIT |
| medium-q8_0 | ggml-medium-q8_0.bin | 823,369,779 (823.4 MB) | `42a1ffcbe4167d224232443396968db4d02d4e8e87e213d3ee2e03095dea6502` | MIT |
| large-v3-turbo-q5_0 | ggml-large-v3-turbo-q5_0.bin | 574,041,195 (574.0 MB) | `394221709cd5ad1f40c46e6031ca61bce88931e6e088c188294c6d5a55ffa7e2` | MIT |

Note: the whisper.cpp URLs use the `main` branch, not a fixed commit. The SHA-256 pin still protects users; pin
the commit (or mirror) before launch.

### Reframe (`src-tauri/src/reframe/models.rs`)

| Id | Model | File | Size | SHA-256 | Licence |
| --- | --- | --- | --- | --- | --- |
| face_yunet | YuNet face detector (OpenCV Zoo, commit 48b10fa) | face_detection_yunet_2023mar.onnx | 232,589 (0.2 MB) | `8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4` | MIT (the OpenCV Zoo YuNet directory states MIT, not Apache-2.0) |
| vad_silero | Silero VAD v5.1.2 | silero_vad_v5.1.2.onnx | 2,327,524 (2.3 MB) | `2623a2953f6ff3d2c1e61740c6cdb7168133479b267dfef114a4a3cc5bdd788f` | MIT |
| face_sface | SFace face recogniser (OpenCV Zoo, commit 48b10fa) | face_recognition_sface_2021dec.onnx | 38,696,353 (38.7 MB) | `0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79` | Apache-2.0 |

### Background (`src-tauri/src/background/mod.rs`)

| Id | Model | File | Size | SHA-256 | Licence |
| --- | --- | --- | --- | --- | --- |
| selfie | MediaPipe Selfie Segmentation (onnx-community, commit be49485) | mediapipe_selfie_segmentation_256.onnx | 462,352 (0.5 MB) | `3241ac4ad8aa35bdaf33946776db29f7c283a413aa0b0dacb9483594b4531aad` | Apache-2.0 |

### Voice clean-up (`src-tauri/src/commands/enhance.rs`)

| Id | Model | File | Size | SHA-256 | Licence |
| --- | --- | --- | --- | --- | --- |
| voice_rnnoise | RNNoise model "somnolent-hogwash" (GregorR/rnnoise-models, commit 3eee541), run by FFmpeg `arnndn` | sh.rnnn | 297,646 (0.3 MB) | `70bb6685eb0c2a1d18e2918dca3fbfbd39317010b1802eb1b6ea73a92f3fdec0` | Model weights: public domain (not copyrightable); RNNoise code: BSD-3-Clause |

### Voice and translation packs (`src-tauri/src/voice/models.rs`)

Each pack is a set of files, all pinned to a fixed commit. SHA-256 per file is in the code.

| Pack | Contents | Total size | Licence |
| --- | --- | --- | --- |
| voice | Kokoro-82M v1.0 ONNX, int8 (onnx-community, commit 1939ad2): `model_quantized.onnx` (92,361,116), 8 voice files (522,240 each: af_heart, am_michael, bf_emma, bm_george, hf_alpha, hf_beta, hm_omega, hm_psi), misaki `us_gold.json` / `us_silver.json` (hexgrad/misaki, commit fba1236) | 102.6 MB | Apache-2.0 (Kokoro weights and misaki) |
| mt_en_indic | IndicTrans2 en-indic distilled 200M, ONNX int8 (hari31416 conversion, commit 1eaa43a): encoder, decoder, shared weights, tokenizers | 307.5 MB | MIT (IndicTrans2) |
| mt_indic_en | IndicTrans2 indic-en distilled 200M, ONNX int8 (hari31416 conversion, commit a7ecdc0) | 260.3 MB | MIT (IndicTrans2) |

The IndicTrans2 ONNX files are a third-party conversion of AI4Bharat's MIT weights. Mirroring them on our own
server removes the dependency on that personal Hugging Face account.

### Totals

| Set | Size |
| --- | --- |
| Everything except Whisper (reframe, background, RNNoise, voice, both translation packs) | 712.5 MB |
| Plus the recommended Whisper "Small (balanced)" | 902.5 MB |
| All seven Whisper models | 2,532.6 MB |

(The planning figure of about 666 MB in the owner notes predates the final pack list; these numbers are computed
from the pinned sizes in the code.)

## Not used (licence)

pyannote (gated weights), NLLB-200 / SeamlessM4T (CC BY-NC), espeak-ng (GPL-3), Piper Hindi voices (CC BY-NC-SA
or unclear), Coqui XTTS-v2 (CPML), InsightFace models (non-commercial), Ultralytics YOLO (AGPL-3.0), BRIA RMBG
(non-commercial). Details in [AI-MODELS.md](AI-MODELS.md).
