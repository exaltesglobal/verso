# Verso spec: Local auto-captions pipeline

Status: implementation spec, Phase 4 ("Captions, templates and one-click edits"), revision 2 after review.
Fits the existing architecture: Tauri commands in `src-tauri/src/commands/*.rs` (today: `media.rs`, `thumbnails.rs`, `mod.rs`), heavy tools as sidecars located by `src-tauri/src/tools.rs` (two-variant `Tool` enum, `stem()`, `sidecar_path()`, `command()`), sidecar config in `src-tauri/tauri.sidecar.conf.json` (exists; `externalBin` + `resources`), project model in `src/lib/project.ts` (`AspectRatio = "9:16" | "1:1" | "16:9"`), preview in `src/components/editor/Preview.tsx`.

Everything runs on-device; the only network use is the model download (section 4).

---

## 1. Engine: whisper.cpp as a sidecar

### 1.1 What we ship

| Item | Choice | Licence | Verified at |
| --- | --- | --- | --- |
| STT engine | `whisper-cli` from **whisper.cpp v1.9.5** (tag ships source only; we build in CI) | MIT | https://github.com/ggml-org/whisper.cpp/releases/expanded_assets/v1.9.5 |
| Default model | `ggml-large-v3-turbo-q5_0.bin` (547 MiB) | MIT (OpenAI weights MIT, not gated; no training-data licence published, no use restriction) | https://huggingface.co/openai/whisper-large-v3-turbo , https://huggingface.co/ggerganov/whisper.cpp |
| Fast/low-RAM model | `ggml-small-q8_0.bin` (252 MiB) | MIT | same |
| Probe model (bundled) | `ggml-tiny-q5_1.bin` (31 MiB) | MIT | same |
| VAD model (bundled) | `ggml-silero-v5.1.2.bin` (885 kB) | MIT (repo tagged MIT; upstream `snakers4/silero-vad` LICENSE file is MIT, "Copyright (c) 2020-present Silero Team") | https://huggingface.co/ggml-org/whisper-vad , https://raw.githubusercontent.com/snakers4/silero-vad/master/LICENSE |
| Hinglish (Roman) model, optional download | **Oriserve/Whisper-Hindi2Hinglish-Prime**, large-v3 fine-tune, converted to ggml by us, q5_0 (~1.1 GiB) | Apache-2.0. Training data: Oriserve's proprietary ~550 h, labels "produced by a SOTA model and corrected by humans"; no data licence or use restriction stated. Legal to record which labelling model (some providers' ToS restrict training on outputs) and keep a screenshot of the card. | https://huggingface.co/Oriserve/Whisper-Hindi2Hinglish-Prime |
| Alternative Hinglish model | **Trelis/whisper-hinglish-preview** (Apache-2.0; "research preview" is a maturity label, not a licence term; CoSHE-500 CC-BY-NC is eval-only; starts from the ARTPARK-IISc Vaani checkpoint, so record the Vaani dataset licence before adopting) | https://huggingface.co/Trelis/whisper-hinglish-preview |
| Rejected | `udgamlabs/Shruti` (Apache-2.0, 55M, WER 19.9-35.2%): not a whisper/ggml architecture | https://huggingface.co/udgamlabs/Shruti |
| Transliteration | Rust crate **shlesha 0.5.7** (2026-07-06), MIT; `transliterate()` returns `Result` | https://docs.rs/crate/shlesha/latest |
| Subtitle rendering | **Not libass.** Captions are rasterised by the shared `OverlayRenderer` (templates spec §7/§9.3) into the export spec's captions overlay lane (§5.2 below), so preview and export are the same pixels. libass (ISC) is present in the BtbN lgpl build (`50-libass.sh` unguarded) but unused; `.srt` is the only subtitle file we write. | https://github.com/BtbN/FFmpeg-Builds/blob/master/scripts.d/50-libass.sh |
| Encoding | Owned by the export spec §3.8 (`encoder_capabilities`, NVENC → QSV → AMF → MF → `libopenh264`). This spec never picks an encoder. | `specs/export-and-render-pipeline.md` |
| Fonts | Defaults `latinFamily: "Manrope"`, `devanagariFamily: "Noto Sans Devanagari"`; the full bundled set (Manrope, Inter, Hind, Mukta, Baloo 2 family, Noto Sans Devanagari, Poppins), their OFL.txt files and `licenses/FONTS.txt` are owned by the templates spec §7 | `specs/templates-and-one-click-reels.md` §7 |

### 1.2 Binaries and bundling

Installer ships two whisper variants (CPU zip is ~8.5 MB; the CUDA variant needs `cublas64_12.dll` + `cublasLt64_12.dll`, ~600 MB, so it is **not** in the installer):

```
cmake -B build-vulkan -DGGML_VULKAN=1 -DBUILD_SHARED_LIBS=OFF -DWHISPER_BUILD_TESTS=OFF -DWHISPER_BUILD_SERVER=OFF
cmake -B build-cpu    -DGGML_NATIVE=OFF -DGGML_AVX2=ON -DBUILD_SHARED_LIBS=OFF ...
cmake -B build-cuda   -DGGML_CUDA=1 -DCMAKE_CUDA_ARCHITECTURES="61;75;86;89;120" -DBUILD_SHARED_LIBS=OFF ...   # CUDA toolkit 12.8 (sm_120 needs >= 12.8); ship cudart64_12 + cublas64_12 + cublasLt64_12 from that toolkit
```

- `src-tauri/binaries/whisper-vulkan-x86_64-pc-windows-msvc.exe` and `whisper-cpu-...exe` go in `tauri.sidecar.conf.json > externalBin` (alongside `binaries/ffmpeg`, `binaries/ffprobe`); `WHISPER-CPP-LICENSE.txt`, `SILERO-VAD-LICENSE.txt`, `OPENH264-LICENSE.txt` and the three OFL.txt go in `resources` next to `FFMPEG-LICENSE.txt`. Vulkan covers NVIDIA, AMD and Intel with only the user's driver.
- **CUDA pack** (`whisper-cuda.exe` + DLLs, zipped) is an optional download through the same `models.json` manifest flow (section 4), stored in `app_data_dir()/packs/cuda/`, offered inside the chip popover as "Faster on NVIDIA (600 MB)". `externalBin` cannot carry DLLs, which is another reason it is a download, not a bundle. Checklist item with an owner: verify NVIDIA CUDA EULA Attachment A redistributable list covers cublasLt before the pack is published.
- Pascal (GTX 1050/1060) is served by Vulkan by default and by sm_61 in the CUDA pack.
- `scripts/fetch-whisper.mjs` mirrors `fetch-ffmpeg.mjs` (download from our CI release, SHA-256 check, place).

### 1.3 `tools.rs` extension and backend selection

```rust
pub enum Tool { Ffmpeg, Ffprobe, WhisperVulkan, WhisperCpu, WhisperCuda }
// stem(): "whisper-vulkan" | "whisper-cpu" | "whisper-cuda". sidecar_path() unchanged for the first two;
// WhisperCuda resolves to app_data_dir()/packs/cuda/whisper-cuda.exe (Command::current_dir set there so the DLLs load).

pub enum SttBackend { Cuda, Vulkan, Cpu }
pub fn pick_stt_backend(app: &AppHandle) -> SttBackend;
```

Order: Cuda (if pack installed) -> Vulkan -> Cpu. A backend "works" if `<exe> -m tiny -f silence-1s.wav -np` exits 0 within **90 s** (first CUDA/Vulkan runs compile shaders and can take 20-60 s on laptops). Only **positive** results are persisted (`app_config_dir()/stt-backend.json`, keyed by GPU driver version string); a failure is remembered for the session only and re-probed on the next app start and whenever the user opens the captions chip. The probe runs asynchronously after startup so the first click never waits on it. Crash mid-job -> mark bad for session, re-run job on the next backend.

Threads: CPU `-t min(performance_cores, 8)` (on Windows read `GetLogicalProcessorInformationEx` and count cores with `EfficiencyClass == max`, falling back to physical cores); GPU `-t 4`.

### 1.4 Performance targets (all "to be measured", 60 s reel / 20 min source)

| Path | 60 s | 20 min |
| --- | --- | --- |
| CUDA pack, large-v3-turbo-q5_0 (RTX A4000 / RTX 3050) | < 4 s / < 8 s | < 1 / < 2.5 min |
| Vulkan dGPU (RTX 3050), large-v3-turbo-q5_0 | < 10 s | < 3 min |
| Vulkan iGPU (Iris Xe), small-q8_0 (auto-picked when VRAM < 2 GB) | < 25 s | < 8 min |
| CPU 4-8 threads (i5 laptop), small-q8_0 | < 60 s | chunked, background (section 2.6) |

Without a dGPU the UI says "Using the faster captions model because no graphics card was found. Quality is a little lower." VAD (2.3) skips silence and music, the main CPU saving on talk-head reels.

---

## 2. Pipeline

### 2.1 Audio extraction (FFmpeg sidecar)

Per chunk (section 2.6), extract only `[start, end]` of the source as 16 kHz mono s16 WAV:

```
ffmpeg -hide_banner -loglevel error -y -ss {start:.3} -t {dur:.3} -i "{source}"
  -vn -map 0:a:{idx} -ac 1 -ar 16000 -c:a pcm_s16le
  -af "highpass=f=80,speechnorm=e=6.25:r=0.0001:l=1"
  "{cache}/stt/{key}.wav.part"   # renamed to .wav on exit 0
```

- `speechnorm` replaces `loudnorm`: single-pass `loudnorm` ignores `linear=true` (filters.texi: linear mode needs all `measured_*` values, otherwise it reverts to dynamic) and upsamples internally, which is slow on long sources.
- Stream choice `{idx}`: if the Audio track clip references a stream, use it; otherwise probe each audio stream's first 10 s with `-af astats=metadata=1:measure_overall=RMS_level -f null -` and pick the loudest. Times are PTS-relative to container `start_time`, so VFR phone video is unaffected.
- Cache key = `cache_key(source, format!("stt-wav:{start:.3}:{end:.3}:{idx}"))` reusing `thumbnails.rs`. **All cache writes go to `.part` then rename**; a cancelled or crashed job leaves no entry. On read, a WAV with wrong RIFF size or a JSON that fails to parse is deleted and regenerated.
- Missing media: `cache_key` already errors "We couldn't find that file...". Captions stored in the Project still preview and export; re-transcribe shows "Relink the video first, then add captions again."
- No audio stream: "This clip has no sound, so there is nothing to caption."

### 2.2 Language detection (tiny model, two short passes)

Pick the detection window from VAD: run `whisper-cpu -m tiny -f probe-full.wav --vad -vm silero -dl` on the first 30 s **of speech** (the first VAD segments concatenated up to 30 s), **without `-np`**, because `-np` installs `whisper_log_set(cb_log_disable)` and the detected-language line is a `WHISPER_LOG_INFO` (`src/whisper.cpp` ~L7022: `auto-detected language: %s (p = %f)`); with `-dl` the library returns right after detection, so a `-dl` run produces no transcript. Parse stderr `auto-detected language: (\w+) \(p = ([0-9.]+)\)`. Then run a second tiny pass on the same 30 s without `-dl` (`-l {detected} -oj`) to get the probe transcript used for the ratios below (~1 s on CPU).

```ts
export type LanguageChoice = "auto" | "hi" | "mr" | "en" | "hinglish" | string; // ISO 639-1
```

Rules (no dialog, ever; one chip "Hindi · Roman letters · Change"):
- `p >= 0.6`: force `-l xx` for the real run.
- `hi` and Latin-token ratio in probe transcript > 25% -> `hinglish`.
- `hi` and the probe transcript contains >= 2 of Marathi function words `आहे, आणि, मी, आम्ही, तुम्ही, होता, नाही का` -> `mr` (tiny confuses `mr`/`hi` often).
- `p < 0.6`: real run with `-l auto`, chip shows "?" so the user corrects it with one tap; correction re-runs immediately.
- Marathi: `-l mr --prompt "नमस्कार, आज आपण"`.

### 2.3 Transcription

```
whisper -m {model} -f {wav} -l {lang} [-tr]
  --vad -vm {resources}/models/ggml-silero-v5.1.2.bin -vt 0.5 -vspd 250 -vsd 100 -vp 30
  -sns                       # suppress non-speech tokens ([Music] etc.) at decode time
  -ml 1 -sow -bs 5 -bo 5 -et 2.4 -nth 0.6 -wt 0.01
  [-dtw {preset}]            # GPU paths only; see below
  [-nfa]                     # flash attention is ON by default; pass -nfa only on the CPU build
  -pp -np -oj -of {cache}/stt/{key}.part   # produces {key}.part.json; renamed on success
  [--prompt "..."]           # language primer + "Words to spell right" (capped at 180 tokens; whisper's prompt window is ~224)
```

- `-dtw` accepts only `tiny, tiny.en, base, base.en, small, small.en, medium, medium.en, large.v1, large.v2, large.v3, large.v3.turbo` (anything else exits 3). Oriserve is a large-v3 fine-tune -> `-dtw large.v3`; small -> `-dtw small`.
- Progress: `-np` does not suppress `-pp` output. Regex `progress =\s*(\d+)%` on stderr, 5% granularity (`progress_step` default). Emit `captions:progress { jobId, chunkIndex, percent }`.
- Output: `-oj` JSON, `transcription[] { offsets.from/to (ms), text, tokens[] { text, p, offsets, t_dtw } }`; `result.language`. With `-ml 1` each segment is one word; `confidence = mean(p)` over non-special tokens.
- Cache key for the JSON = `cache_key(source, "stt-json:{start}:{end}:{idx}:{model}:{lang}:{translate}:{dtw}:{vad params}:{sha1(prompt)}")`.

**Hallucination filter** (Rust, after parse), applied per chunk:
1. Drop segments whose text is only `[...]`/`(...)`/`♪`.
2. Drop a run of >= 3 identical consecutive words, and any 4-gram repeated >= 3 times inside a 10 s window (keep the first).
3. Drop words with `confidence < 0.3` inside a VAD silence region (whisper.cpp maps timestamps back to the original audio).
4. Drop a trailing segment matching `resources/hallucinations.txt` (`thank you for watching`, `धन्यवाद देखने के लिए`, ...) if it sits > 2 s after the last VAD speech.
Test fixture: music-only and silence-only clips must yield 0 words.

**Hinglish decision (one-click, no modelling question):**
- `hinglish` detected -> base model `-l hi`, then transliterate (2.4) -> chip "Hindi · Roman letters". Pure `hi` -> Devanagari. `mr` -> Devanagari.
- The Oriserve model is offered only inside the chip popover: "Better Hinglish spelling (1.1 GB download)". Never auto-downloaded. When installed and script is Roman, it is used instead of transliteration (`-l hi`, output already Roman). Switching script re-runs only what is needed; reruns are cached per key above.
- Translation to English: base model, `-tr`, `-ml 0` (segment-level; word timestamps on reordered English are meaningless). Each segment becomes one `CaptionLine` with one synthetic `CaptionWord` spanning the segment; animation is forced to `none` or `boxed`; chip shows "Translated from Hindi". Stored as a second `CaptionTrackData` with `translatedFrom`.

### 2.4 Roman-script Hinglish (Rust `transliterate.rs`)

1. `Shlesha::new().transliterate(word, "devanagari", "iso15919")?` then strip diacritics with a fixed map: `ā->aa, ī->ee, ū->oo, ṛ->ri, ṁ/ṃ->n, ḥ->(drop), ñ->n, ṅ->n, ś/ṣ->sh, ṭ/ṭh/ḍ/ḍh/ṇ->t/th/d/dh/n, ch->ch (ISO `c`->`ch`, `ch`->`chh`)`. Do not hand-write the table from memory: the map is generated and checked against shlesha's real output on the golden file (`tests/hinglish-golden.tsv`, 500 pairs), which is the contract.
2. Schwa deletion, explicit algorithm: with the word as consonant/vowel string, delete an inherent `a` when (a) it is word-final after a consonant and the word has >= 2 syllables, or (b) it is in position `V C a C V` (vowel, consonant, a, consonant, vowel) and the following consonant is not the first of a conjunct. `karata -> karta`, `namaste` keeps `e`, `kamala -> kamal`.
3. Lowercase; capitalisation is done by layout.
4. Exceptions dictionary `src-tauri/resources/hinglish-exceptions.tsv`, **v0 = ~300 highest-frequency words** mined from the golden set (`hai, nahi, kya, kyun, mein, hoon, aur, bhi, tha, thi, acha, bahut, yaar, matlab, chalo, dekho ...`), hot-reloadable in dev (`VERSO_HINGLISH_TSV` env), grown later. Owner: whoever owns item 5 of the checklist.
5. Latin words pass through. Boundaries and timings are preserved 1:1 (per-word transliteration).

### 2.5 Post-replace "Words to spell right"

Whole-word, script-aware: Latin matches are case-insensitive and bounded by `\b`; Devanagari matches are exact token matches. Never substring.

### 2.6 Chunked jobs

A job is split per **timeline clip** and then into chunks of <= 10 min of source with 2 s overlap. Each chunk is its own whisper process (so cancel loses at most one chunk and progress is honest). Merge rule: in the overlap, keep words from the earlier chunk until the first word whose start >= overlapStart + 1.0 s, then take the later chunk's words; drop any later-chunk word whose `[start,end]` overlaps a kept word by > 50%. Chunks are merged into the Project incrementally (`captions:chunk-done`), so the user sees captions appear as they finish. For > 25 min sources on CPU only the clips on the timeline are captioned, never the whole file.

---

## 3. Caption data model

### 3.1 TypeScript (`src/lib/captions.ts`)

Words are stored in **source time** with the clip they came from; timeline time is derived on read, so trims, moves and splits never lose information. The saved types (`CaptionWord`, `CaptionLine`, `CaptionTrackData`, `Project.captions: CaptionTrackData[]`) are defined in the editing-model spec §1.2 and **imported** from `src/lib/model`; all times are integer microseconds (`Us`). Rust's `SttWord` (§3.2) is in source seconds and is converted with `secToUs` when a chunk is merged.

```ts
import type { CaptionWord, CaptionTrackData, MediaClip, Project, Us } from "./model";
// CaptionWord { id, clipId, sourceStartUs, sourceEndUs, text, asrText, confidence, roman?, speaker? }
// CaptionTrackData { version: 1, language, translatedFrom?, script: "native" | "roman", model, visible, words, lines, style: CaptionStyle,
//                    coverage: Record<mediaId, { startUs, endUs, model, lang }[]> }

/** Derived, never stored. Returns null when the word is outside the clip's trimmed range (hidden, not deleted). */
export function timelineRange(w: CaptionWord, p: Project): { startUs: Us; endUs: Us } | null {
  const c = p.clips[w.clipId] as MediaClip | undefined; if (!c || c.kind !== "video") return null;
  const outUs = c.inUs + c.durationUs * c.speed;
  if (w.sourceEndUs <= c.inUs || w.sourceStartUs >= outUs) return null;
  return { startUs: c.startUs + Math.round((w.sourceStartUs - c.inUs) / c.speed),
           endUs:   c.startUs + Math.round((w.sourceEndUs   - c.inUs) / c.speed) };
}
```

- `Project.captions` holds 0, 1 or 2 tracks: the primary and, optionally, the English translation (`translatedFrom` set). Exactly one has `visible: true` at a time.
- Split clip: words with `sourceStartUs >= splitPointUs` are re-pointed to the new clip id (`captions.rebindOnSplit`, called by the editing-model `split` op). Deleted clip: words keep `clipId`, are hidden, and return on undo. Lines show only their visible words; fully hidden lines are not drawn. The ripple rule never touches captions (editing-model §1.4).
- Timeline drawing: `clipsFromCaptions()` makes one **display-only** bar per visible line in the caption band under the text tracks (captions are not a track and these bars are not `Clip`s); the transcript list is virtualised (`@tanstack/react-virtual`, MIT) because `-ml 1` on a podcast yields ~15k words.
- Undo: every change goes through the editing-model `editCaptions` op; word text edits are coalesced per word within 1 s (`coalesceKey = "caption:" + wordId`); chunk merges are one entry per chunk.

### 3.2 Rust (`src-tauri/src/commands/captions.rs`)

```rust
#[derive(Serialize)] #[serde(rename_all = "camelCase")]
pub struct SttWord { pub start: f64, pub end: f64, pub text: String, pub confidence: f32 }   // SOURCE seconds
#[derive(Serialize)] #[serde(rename_all = "camelCase")]
pub struct SttChunkResult { pub chunk_index: u32, pub start_sec: f64, pub end_sec: f64, pub language: String, pub words: Vec<SttWord>, pub elapsed_ms: u64 }
#[derive(Deserialize)] #[serde(rename_all = "camelCase")]
pub struct SttRequest { pub source: String, pub ranges: Vec<(f64, f64)>, pub language: String, pub translate: bool,
  pub model_id: Option<String>, pub prompt_terms: Vec<String>, pub job_id: String }

#[tauri::command] pub async fn stt_detect_language(app: AppHandle, source: String) -> Result<LangGuess, String>; // {lang, prob, latinRatio, marathiHits}
#[tauri::command] pub async fn stt_transcribe(app: AppHandle, req: SttRequest) -> Result<(), String>;   // emits captions:progress, captions:chunk-done {SttChunkResult}, captions:done, captions:error
#[tauri::command] pub async fn stt_cancel(job_id: String) -> Result<(), String>;
#[tauri::command] pub async fn transliterate_words(words: Vec<String>) -> Result<Vec<String>, String>;
#[tauri::command] pub async fn stt_status(app: AppHandle) -> Result<SttStatus, String>;  // backend, gpu name, installed models/packs; triggers a re-probe if last probe failed
```

Children live in `AppState.jobs: Mutex<HashMap<String, Vec<Child>>>`; cancel kills the current chunk and stops scheduling.

### 3.3 Lines: automatic layout, aspect-aware

Input: words (timeline-visible), `frame: {w, h}` (logical frame from `AspectRatio`: 1080x1920, 1080x1080, 1920x1080), style. Scale factor `s = h / 1920` for 9:16 and 1:1, `s = h / 1080` for 16:9; all px in the style are at this logical size and multiplied by `s` only at render (so a 2160x3840 export scales everything 2x; PlayRes stays logical).

1. `maxWidthPx = frame.w * style.maxWidthPct/100`. `maxChars` is derived, not fixed: measure the average glyph advance of the font at `sizePx` (Devanagari ~0.62 em, Latin ~0.52 em) and set `maxChars = floor(maxWidthPx / (sizePx * avgAdvance))`, which gives ~18/22 on 9:16, ~18/22 on 1:1, ~34/40 on 16:9. `maxWords = 5` (8 on 16:9), `maxDuration = 2.4 s`, `gapBreak = 0.6 s`.
2. Break when the next word would exceed maxChars/maxWords/maxDuration, when the gap >= gapBreak, or after `. ? ! ।`.
3. Orphan rule: a final word <= 3 chars that is not sentence-final is pulled into the previous line if it fits.
4. `pinned` lines are untouched; relayout runs only across unpinned regions.
5. Display time: `start = first.start - 0.08`, `end = max(last.end + 0.15, start + 0.7)`, clamped so lines never overlap; snapped to 10 ms.

Low-confidence (`< 0.55`) words are underlined amber in the editor.

### 3.4 Speaker id

Not in Phase 4 (`-tdrz` is English-only). Field reserved; nothing promised in the UI.

---

## 4. Model and pack download flow

`src-tauri/resources/models.json` lists models and the CUDA pack:

```json
{ "id": "large-v3-turbo-q5_0", "kind": "model", "file": "ggml-large-v3-turbo-q5_0.bin",
  "bytes": 0, "sha256": "<computed by scripts/pin-models.mjs from the downloaded file; never typed>",
  "urls": ["https://models.verso.app/stt/ggml-large-v3-turbo-q5_0.bin",
           "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q5_0.bin"],
  "licence": "MIT", "label": "Captions (best)", "sizeLabel": "550 MB", "autoOffer": true }
```

`bytes` and `sha256` are filled by a build script that downloads the file and hashes it (we do not rely on Hugging Face checksums). `autoOffer: false` for the Hinglish model and the CUDA pack: they appear only in the popover.

```rust
#[tauri::command] pub async fn model_list() -> Result<Vec<ModelStatus>, String>;
#[tauri::command] pub async fn model_download(app: AppHandle, id: String) -> Result<(), String>;  // emits model:progress {id, received, total, bytesPerSec}
#[tauri::command] pub async fn model_cancel(id: String) -> Result<(), String>;
#[tauri::command] pub async fn model_delete(id: String) -> Result<(), String>;
```

Algorithm: `reqwest` (MIT/Apache-2.0) to `{file}.part` with `Range: bytes={len}-` resume; the `.part` survives app restarts and resumes on the next request. Connection drop: retry with backoff 2/4/8/16 s up to 5 times, then "Download paused. We'll continue when you're back online." and auto-resume on `online` event. On completion stream SHA-256 (`sha2`); mismatch -> delete, retry once, then "The download was damaged. Try again?" button. Rename atomically. One download at a time. Disk check: require `bytes * 1.2` free; message "Not enough space for the captions model (needs about 660 MB free)."

First "Add captions" click: sheet "Captions work fully offline. We download the captions model once (550 MB; a few minutes on most connections)." Buttons: **Download and caption** / "Use the smaller model (250 MB)". Progress lives in the Captions tab; editing continues. Offline: "You're offline and the captions model isn't downloaded yet. Connect once to download it; after that captions work without internet."

---

## 5. Caption styles

### 5.1 Style schema (`src/lib/captionStyle.ts`), shared by preview and export

```ts
export type CaptionAnimation = "none" | "pop" | "karaoke" | "boxed" | "outline";
export interface CaptionStyle {
  version: 1; presetId: string;   // Verso originals: "Studio", "Chalk", "Ember Pop", "Tape", "Mono"
  animation: CaptionAnimation;
  font: { latinFamily: string; devanagariFamily: string; weight: 400|600|700|800; sizePx: number; letterSpacingPx: number; uppercase: boolean };
  colors: { text: string; activeText: string; stroke: string; shadow: string; box: string; activeBox: string }; // #RRGGBBAA
  strokePx: number; shadow: { x: number; y: number; blurPx: number };
  box: { paddingX: number; paddingY: number; radiusPx: number } | null;
  position: { anchor: 1|2|3|4|5|6|7|8|9; marginBottomPx: number; marginSidePx: number };
  maxWidthPct: number; lineHeight: number;
  pop: { scaleFrom: number; scaleTo: number; durationMs: number };
  karaoke: { mode: "fill" | "jump" };
}
```

Font selection is **per word by script** (Unicode block of the first letter): Devanagari -> `devanagariFamily`, else `latinFamily`. The renderer receives the family explicitly (Canvas `ctx.font`), never relying on fallback. Fonts ship in `resources/fonts/` (templates spec §7).

### 5.2 Decision: one renderer for preview and export

Captions are drawn by the shared `OverlayRenderer` (templates spec §7/§9.3, an OffscreenCanvas in a Web Worker) in **both** places: live in the preview and, at export, into the export spec's **captions overlay lane** (§3.4 there: one box-sized PNG per visual state plus an `ffconcat` list, streamed to Rust with `overlay_begin/frame/end`, two overlay inputs regardless of caption count). There is no second text engine (no libass, no `drawtext`), so preview and export are the same pixels and the Devanagari shaping question disappears. Cost is accepted and already budgeted by the export spec (≈20 k PNGs for a 2 h podcast, written and deleted per chunk). An earlier revision chose ASS/libass; it was dropped because three specs would otherwise ship two font engines with a parity test between them.

### 5.3 Rendering

The preview Canvas is sized to the logical frame and CSS-scaled; the export lane is rendered at the output resolution with scale `s` (§3.3).

1. One geometry function `layoutLine(style, frame, line, words, nowUs) -> Glyph[]` gives per-word x/y/scale/colour/alpha/family. It is pure and is the whole contract: the renderer draws glyphs, nothing else decides positions.
2. **State changes** (the moments a new PNG is emitted): line start/end, each word start (karaoke, boxed, pop), and animation frames of `pop` (12 one-frame states at `1/fps`). Static animations (`none`, `outline`) emit one PNG per line.
3. Timing snapped to 10 ms. Blur: `ctx.filter = blur(px)`. Stroke: round joins, `lineWidth = 2*strokePx` under the fill.
4. Karaoke `fill`: the active word is drawn twice, `text` colour then `activeText` under a clip-rect whose width grows linearly over `[word.start, word.end]`; emitted as 6 states per word (≤ 60 ms steps). `jump`: one state per word boundary.

| animation | States per line |
| --- | --- |
| none / outline | 1 |
| pop | 12 at line start |
| karaoke | one per word (`jump`) or 6 per word (`fill`) |
| boxed | one per word (box colour follows the active word) |

### 5.4 Export integration

Captions contribute **data, not filters**: `buildRenderGraph` (export spec §2.3) collects the visible track's words via `timelineRange`, the export job asks the `OverlayRenderer` for the captions lane, and the export spec's compiler composites it after transitions. Encoder, chunking, job directory (`app_cache_dir()/exports/{jobId}/`) and progress are the export spec's. Captions hidden by trims are simply absent from the lane; a word split across a chunk boundary appears in both chunks (export §3.7). Sidecar `{export}.srt`: UTF-8 **with BOM**, one cue per `CaptionLine` display time, `-->` timestamps, text as shown (Roman or native), not written for translated tracks unless the user ticks "Include English subtitles file".

---

## 6. Editing UX

- **Entry point**: the Inspector's "Auto captions" toggle (`Inspector.tsx:44`, currently dead) becomes **Add captions** (button when none exist; afterwards a toggle that hides/shows the track). `LeftPanel.tsx > CaptionsTab` loses "Auto captions are on" and becomes the transcript + chip + style cards.
- **Correct a word**: click -> inline input; Enter commits, Esc reverts, "Reset" restores `asrText`. Space inside a word splits time by character count.
- **Merge / split lines**: "Join" affordance between lines; "Break here" between words. Results `pinned`.
- **Delete a word**: Delete key; neighbours unchanged.
- **Nudge timing** (Timeline): dragging a caption bar **edge** rescales the line's word times linearly within the line and marks it pinned; dragging the **body** shifts all words by the same offset. Snap 10 ms. These edits write `sourceStartUs/sourceEndUs` through `editCaptions`.
- **Language chip**: "Hindi · Roman letters · Change" -> popover: detected language first, script toggle Native/Roman, "Translate to English", "Better Hinglish spelling (1.1 GB)", "Faster on NVIDIA (600 MB)" when an NVIDIA GPU is present without the pack. Instant for transliteration, progress for re-transcription.
- **Style**: five preset cards previewed with the user's first line; four controls: Size S/M/L, Position Low/Middle/High, Colour pair, Animation.
- Failure messages: GPU crash -> silent fallback, then "Captions couldn't run on this computer. Try closing other apps and clicking Add captions again." Corrupt model -> "The captions model is damaged. Download it again?" No speech -> "We couldn't hear any speech in this clip." Missing media -> "Relink the video first, then add captions again." Cancel -> no toast.

---

## 7. Test plan

Rust: JSON fixture -> `SttWord[]`; hallucination filter (music-only and silence-only fixtures -> 0 words; repeated 4-gram fixture); chunk merge de-dup across a 2 s overlap; transliteration golden file (500 pairs) + schwa cases + Latin passthrough; manifest parse, SHA mismatch -> delete+retry (`httpmock`, MIT), resume from `.part`; backend picker falls Cuda -> Vulkan -> Cpu, negative result not persisted, probe timeout path; cancel mid-chunk leaves no `.json`/`.wav` without `.part`; gated real run (`VERSO_SAMPLE_MEDIA`) asserts > 5 words, monotonic times, and VFR phone clip timing within 60 ms of a hand-marked word.

TypeScript (Vitest): `layoutLines` for 9:16, 1:1, 16:9 snapshots, orphan, pinned, no-overlap; `timelineRange` across moved/trimmed/split/deleted clips at speed 1 and 2 (hidden not deleted); state-change enumeration per animation (counts in §5.3 table); `.srt` with BOM; missing-media render still produces a lane.

Lane rendering (CI: Playwright Chromium): for each preset x animation x {Latin line, Devanagari line "क्ष त्र ज्ञ", mixed Hinglish line, karaoke mid-word}, render the state at t = 1.23 s through the `OverlayRenderer`; assert the PNG is non-blank inside the caption box, blank outside it, that the active-word box matches `layoutLine` within 1 px, and that Devanagari conjuncts render as single glyph clusters (bounding boxes of consecutive words do not overlap). Lane `ffconcat` durations sum to the timeline length (export spec test). No cross-engine parity test exists because there is one engine.

Quality baseline (`docs/stt-quality.md`): 10 clips each of Hindi, Marathi, Hinglish, Indian English; WER targets Hindi <= 20%, Hinglish Roman (Oriserve) <= 30%, Marathi <= 30% (try `medium-q5_0` if missed), English <= 10%. Performance: section 1.4 on the dev box, an RTX 3050 laptop, an Iris Xe laptop, and CPU-only via `VERSO_FORCE_STT_BACKEND=cpu`.

---

## 8. Ordered implementation checklist

1. CI `build-whisper.yml`: v1.9.5 vulkan + cpu for Windows (cuda built too, packaged as a zip pack with DLLs); `fetch-whisper.mjs`; `tauri.sidecar.conf.json` externalBin + licence resources; bundle `ggml-tiny-q5_1.bin` and `ggml-silero-v5.1.2.bin` in `resources/models/`.
2. `tools.rs`: `Tool::WhisperVulkan/WhisperCpu/WhisperCuda`, `pick_stt_backend` (async, 90 s, positive-only persistence), performance-core thread count.
3. `models.rs`: manifest with `kind: model|pack`, `pin-models.mjs`, download/resume/retry/checksum, disk check, first-run sheet.
4. `captions.rs`: WAV extraction (stream pick, speechnorm, `.part` + rename), language detection (two tiny passes), chunked `stt_transcribe` with VAD, `-sns`, progress, cancel, hallucination filter, keyed cache.
5. `transliterate.rs`: shlesha iso15919 + generated strip map + schwa algorithm + exceptions TSV v0 (300 words, hot-reload); golden tests.
6. `src/lib/captions.ts`: `timelineRange` (Us), `rebindOnSplit` hooked into the editing-model `split` op, `coverage` keyed by `mediaId`, `clipsFromCaptions` display bars, `editCaptions` coalescing; `Project.captions: CaptionTrackData[]` (types live in editing-model §1.2).
7. Captions tab: virtualised transcript editor, chip, "Words to spell right" (whole-word replace), Add captions entry point replaces the dead toggle.
8. `captionStyle.ts`, five presets, aspect-aware `layoutLines`/`layoutLine`, caption drawing inside the shared `OverlayRenderer` (templates checklist 6) with per-word font.
9. Captions overlay lane for export (state enumeration, PNG + ffconcat through `overlay_begin/frame/end`), lane rendering tests with Devanagari cases.
10. Export integration: `buildRenderGraph` reads the visible caption track; `.srt` with BOM; "Include English subtitles file" option.
11. Hinglish model: convert Oriserve with `models/convert-h5-to-ggml.py` (needs a clone of openai/whisper with `openai-whisper >= 20231117` for the 128-mel filters), quantise q5_0 with `whisper-quantize` from the same build, validate WER, add to manifest (`autoOffer: false`); translation path (`-tr -ml 0`).
12. CUDA pack: legal confirms NVIDIA EULA Attachment A redistribution of cudart/cublas/cublasLt (owner: legal, before publishing the pack); publish pack; popover offer.
13. Quality + performance baselines on dev box, RTX 3050, Iris Xe and CPU-only; macOS Metal build deferred to Phase 5.
