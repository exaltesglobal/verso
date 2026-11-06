# Verso spec: Auto clips from long video and one-click edits

Status: implementation spec for roadmap Phase 3 ("Auto-cut"), split so it can be built in order:

- **3a (no transcript):** analysis cache, VAD/energy/scenes, silence removal, punch-ins, audio enhance, beat sync, heuristic highlights from audio+visual signals.
- **3b (transcript-dependent):** sentence/filler/keyword signals, LLM re-ranking. Requires captions-spec checklist items 1-4 (`specs/captions-pipeline.md`: whisper sidecars, `pick_stt_backend`, `stt_transcribe`, `SttWord`, `model_download`), which the roadmap moves ahead of 3b; the rest of captions stays Phase 4.

This spec defines **no** timeline types of its own: it uses `specs/editing-model-and-project-format.md` (µs units, UUID ids, `Command`, `history.execute`, `split`/`delete(ripple)`/`setKeyframe`, keyframed `crop`, `speed`, relink), and every auto-edit is one coalesced history entry of those ops. Highlights reference a `MediaRef` id (today `Clip.source?: MediaInfo`). Reframe: `specs/speaker-detection-and-reframe.md`; export: `specs/export-and-render-pipeline.md`.

---

## 1. Licence-checked components

| Component | Choice | Licence / data | Verified |
| --- | --- | --- | --- |
| LLM runtime | `llama-server` (llama.cpp), one pinned `b####` tag in `scripts/fetch-llama.mjs`; CUDA, Vulkan, CPU builds as for whisper-cli. The CUDA build's `cudart64_12`/`cublas64_12`/`cublasLt64_12` ship **inside the same optional CUDA pack** as `whisper-cuda.exe` (`app_data_dir()/packs/cuda/`), downloaded once; EULA Attachment A redistribution sign-off is the captions spec's item 12. | MIT | https://github.com/ggml-org/llama.cpp , https://docs.nvidia.com/cuda/eula/index.html |
| LLM model (default) | `Qwen3-1.7B-Q4_K_M.gguf` (1.11 GB) from `unsloth/Qwen3-1.7B-GGUF`. The official `Qwen/Qwen3-1.7B-GGUF` repo ships **only** `Qwen3-1.7B-Q8_0.gguf` (1.83 GB); it is the fallback URL in `models.json`. SHA-256 computed by `scripts/pin-models.mjs`, never typed. Hindi is among the 119 listed languages. Training data unpublished; no use restriction. | Apache-2.0 | https://huggingface.co/unsloth/Qwen3-1.7B-GGUF , https://huggingface.co/Qwen/Qwen3-1.7B-GGUF/tree/main , https://qwenlm.github.io/blog/qwen3/ |
| LLM model (better, dedicated GPU ≥ 6 GB) | `Qwen3-4B-Q4_K_M.gguf` (2.5 GB) from `Qwen/Qwen3-4B-GGUF` | Apache-2.0 | https://huggingface.co/Qwen/Qwen3-4B-GGUF/tree/main |
| LLM alternative | **Phi-4-mini-instruct** (3.8B; 23 listed languages, Hindi absent, weaker on Hinglish). **SmolLM3-3B** (6 languages, no Hindi) for English-only. | MIT / Apache-2.0 | https://huggingface.co/microsoft/Phi-4-mini-instruct , https://huggingface.co/HuggingFaceTB/SmolLM3-3B |
| Rejected | Qwen2.5-3B (`qwen-research`); Llama 3.x (branding, AUP, MAU clause); Gemma (Prohibited Use Policy, remote restriction). | | https://huggingface.co/Qwen/Qwen2.5-3B/raw/main/README.md , https://ai.google.dev/gemma/terms |
| Voice activity | **Silero VAD**, pinned tag `v5.1.2`, file `src/silero_vad/data/silero_vad.onnx` (~2 MB, 16 kHz, 512-sample chunks only), in-process via `ort`. Training data **undisclosed**. The README badge alt-text reads "CC BY-NC 4.0", but the LICENSE file is MIT and governs. | MIT | https://raw.githubusercontent.com/snakers4/silero-vad/master/LICENSE , https://github.com/snakers4/silero-vad/wiki/Examples-and-Dependencies |
| ONNX runtime | `ort = "=2.0.0-rc.15"` with `load-dynamic` (the pin shared with the reframe spec; crates.io checked 2026-11-06); the ONNX Runtime 1.x release that `ort-sys` rc.15 targets is **vendored** by `scripts/fetch-ort.mjs` (`onnxruntime.dll` + `DirectML.dll`, no build-time download); `ONNXRUNTIME-LICENSE.txt` in `resources`. | MIT (ort: MIT OR Apache-2.0) | https://crates.io/api/v1/crates/ort , https://github.com/microsoft/onnxruntime/blob/main/LICENSE |
| FFT / onsets | Own code on **rustfft 6.4.1** (MIT OR Apache-2.0). aubio (GPL-3.0-or-later) and Essentia (AGPL) excluded. | | https://docs.rs/rustfft , https://github.com/piem/aubio |
| Analysis filters | FFmpeg 9 LGPL sidecar: `scdet, ebur128, silencedetect, afftdn, acompressor, highpass, deesser, scale, crop` | LGPL sidecar | README |

Only ONNX Runtime is linked in.

---

## 2. Analysis cache

One pass per source file, cached under `app_cache_dir()/analysis/<cache_key>/` (key as `thumbnails.rs::cache_key`: path, size, mtime, `ANALYSIS_VERSION`). **Each stage writes its own file** (`audio16k.wav`, `vad.json`, `energy.json`, `scenes.json`, `transcript.json`, `onsets.json`, `done.json`), so cancel or crash keeps finished stages and the next run resumes. LRU eviction at 2 GB (16 kHz mono PCM is 1.9 MB/min).

```rust
// src-tauri/src/commands/analysis.rs
#[derive(Serialize, Deserialize)] #[serde(rename_all = "camelCase")]
pub struct Analysis {
    pub version: u32, pub duration_sec: f64,
    pub words: Vec<SttWord>,            // SOURCE seconds (captions spec); empty if skipped/failed
    pub language: Option<String>, pub transcript_quality: TranscriptQuality,
    pub speech: Vec<Span>, pub silences: Vec<Span>,     // VAD, merged; silences >= 0.25 s
    pub energy: Vec<f32>,               // RMS dBFS per 100 ms, len = ceil(duration*10)
    pub loudness: Loudness,             // ebur128 I / LRA / true peak
    pub scene_cuts: Vec<f64>, pub onsets: Vec<f64>, pub beats: Option<Beats>,
    pub laughter: Vec<Span>, pub voice: Vec<VoiceSegment>,   // VoiceSegment from reframe spec when its cache exists
}
pub struct Span { pub start: f64, pub end: f64 }
pub struct Loudness { pub i: f32, pub lra: f32, pub true_peak: f32 }
pub struct Beats { pub bpm: f32, pub times: Vec<f64>, pub downbeats: Vec<f64>, pub confidence: f32 }
pub enum TranscriptQuality { None, Coarse /* CPU or no DTW */, WordAccurate /* GPU + -dtw */ }

#[tauri::command] pub async fn analyze_media(app: AppHandle, path: String, job_id: String,
    want_transcript: bool) -> Result<Analysis, String>;   // emits analysis:progress {jobId, stage, percent, etaSec}
#[tauri::command] pub async fn analysis_estimate(app: AppHandle, path: String) -> Result<Estimate, String>; // {seconds, usesCpu}
#[tauri::command] pub async fn analysis_cancel(job_id: String) -> Result<(), String>;
```

**Timestamps.** All times are source PTS seconds relative to container `start_time` (`scdet` `lavfi.scd.time`, whisper offsets, decoded-PCM indices). VFR needs no remapping; VFR→CFR happens only in export (`fps=` per segment).

**Audio stream.** Captions-spec rule: probe each stream's first 10 s with `astats`, take the loudest (OBS puts the mic on stream 2). Then:

```
ffmpeg -hide_banner -loglevel error -y -threads N -i IN \
  -map 0:a:{idx} -ac 1 -ar 16000 -c:a pcm_s16le CACHE/audio16k.wav \
  -map 0:a:{idx} -af "ebur128=peak=true:metadata=1,ametadata=mode=print:file=CACHE/ebur.txt" -f null -
```

`-loglevel error` suppresses the ebur128 summary, so parse the **last** `lavfi.r128.I`, `lavfi.r128.LRA` and max `lavfi.r128.true_peaks_ch*` from `ebur.txt`. `N` = performance cores (as in `tools.rs`). No audio stream → skip audio stages; visual signals only.

**VAD.** Silero, 512-sample chunks: on 0.5, off 0.35, min speech 0.25 s, min silence 0.30 s, pad 0.08 s. **Energy**: RMS per 100 ms in Rust, clamped [-70, 0] dBFS.

**Scenes.**

```
ffmpeg [-hwaccel d3d11va] -i IN -vf "scale=320:-2,scdet=threshold=10:sc_pass=0,metadata=mode=print:key=lavfi.scd.time:file=CACHE/scenes.txt" -an -f null -
```

`-hwaccel d3d11va` only when the export spec's `encoder_capabilities().hwDecode` is true (same gate as the reframe spec). On non-zero exit (10-bit HEVC on some Intel drivers) retry once without `-hwaccel`, with `-threads N`. HLG/PQ sources use `threshold=14`.

**Transcript (3b).** `want_transcript` is true when a caption model is installed. Call shape: the captions spec's `SttRequest { ranges, ... }`, ranges = speech-covering 10-minute chunks with 2 s overlap, merged by its overlap rule; chunks stream into `transcript.json` on `captions:chunk-done`, so a cancelled 3 h job keeps its first 15 minutes. GPU backends use the caption model; **CPU uses `ggml-small-q8_0`** (large-v3-turbo on CPU over hours is not viable). `transcript_quality` is `WordAccurate` only with `-dtw`. `analysis_estimate` = `duration × realtime factor` from a 20 s probe; the UI shows "About 25 minutes on this computer. Keep editing, or continue later." with **Start** / **Continue later** (cache kept; tab shows "Resume analysis").

**Performance.** 60-min 1080p, dev box: extract < 20 s, VAD < 10 s, scenes < 60 s hwaccel / < 150 s software (4 cores). 3 h 4K HEVC: scenes ≤ 12 min software, with ETA. Whole analysis without transcript ≤ 4 min (GPU laptop) / ≤ 12 min (CPU-only, 60-min source).

---

## 3. Transcript features (3b)

Text is lowercased and NFC-normalised; lexicons in `src-tauri/resources/lexicon/{en,hi}.json` carry Devanagari and Roman forms.

**3.1 Sentences.** End at `. ? ! ।`, a gap ≥ 0.6 s, or a silence ≥ 0.4 s between words; cap 25 words (split at the largest gap). `isQuestion` = 1.0 if it ends with `?`; 0.5 if it starts with a question word (`what why how…`, `kya kyun kaise kab kahan kaun`, Devanagari forms) **and** the last 0.5 s RMS rises ≥ 2 dB over the sentence mean; `kya` alone never scores (also a particle: "kya baat hai"). Whisper Hindi often omits `।`, so gaps are the primary splitter for `hi`.

**3.2 Per-window signals.** Windows: 20 s, hop 5 s, aligned to the first sentence start ≥ t. Each signal is normalised to [0,1] by 5th/95th-percentile min-max **over this file's windows**; with < 5 windows, raw values are clamped instead.

- `hook`: hook/emotion lexicon hits ÷ words (incl. `\d+(%|x|k|lakh|crore)`).
- `question`: mean `isQuestion` of sentences in the window.
- `density`: words/s ÷ file median, clipped at 1.6.
- `keyword`: TF-IDF where **documents = scoring windows**; a window scores by the sum of TF-IDF of the file's top-5 terms (stopwords removed, en/hi/hinglish lists). Skipped if < 5 windows.
- `turns`: speaker changes from the reframe spec's `VoiceSegment[]` when cached for this file; fallback: gap > 0.7 s followed by a > 25 % mean-F0 change (autocorrelation, 40 ms frames).
- `laughter`: overlap with 3.3 spans ÷ window, clipped at 0.3.
- `energy`, `energyPeak`, `scene`, `pace`: audio/visual signals, available in 3a.

**3.3 Laughter.** 0.4–2.5 s region where (a) VAD speech-like, (b) no word with confidence above 0.5 (en) / 0.35 (hi, mr, hinglish, where ASR confidence is systematically lower), **(c, required)** envelope periodicity 4–7 Hz, (d) spectral centroid 300–1500 Hz; or tokens `[laughter] (laughs) haha+`. Weight stays small until measured on the QA set.

---

## 4. Highlight scoring and selection

### 4.1 Heuristic score

```
score_h = 0.22*hook + 0.14*question + 0.10*keyword + 0.10*density + 0.14*energy
        + 0.08*energyPeak + 0.08*laughter + 0.06*turns + 0.05*scene + 0.03*pace      // sums to 1.00
```

Static camera (`scene_cuts.len() < 3`): `turns 0.10, scene 0.02, pace 0.02` (still 1.00). No transcript: text weights redistribute proportionally onto the audio/visual signals. Penalties: speech coverage < 60 % (−0.2, unless no transcript), first 15 s (−0.1), mean ASR confidence < 0.5 (−0.1).

### 4.2 Optional LLM re-ranking

Runs only when a model is installed and "Smart ranking" is on (default once installed). The offer is **non-blocking**: heuristic results show immediately with an in-panel line "Better picks: download the 1.1 GB smart-ranking model (works offline)". GPU choice via `DXGIAdapter.DedicatedVideoMemory` (`windows` crate): ≥ 6 GB → offer Qwen3-4B, else 1.7B; `-ngl 99` on CUDA/Vulkan builds (Intel iGPU Vulkan uses shared memory, still faster than CPU); CPU build `-ngl 0 -c 4096`.

Launch: Rust binds `127.0.0.1:0`, reads the port, drops the socket, spawns

```
llama-server -m MODEL --host 127.0.0.1 --port PORT -c 8192 -ngl 99 --jinja --reasoning-budget 0 --temp 0.1 --no-webui
```

and polls `GET /health` until 200 (max 60 s); `--port 0` logs the bound port (PR #10590) but log formats are not an API. Kill after the job or 5 min idle. Top-40 windows at sentence bounds go to `POST /v1/chat/completions` in batches of **8 (GPU) / 4 (CPU)** with `response_format: {type:"json_schema", json_schema:{schema}}` (converted to a grammar) and `chat_template_kwargs: {"enable_thinking": false}` as a second guard against thinking. Timeout per batch `30 s + 15 s × segments`. Schema: per segment `id`, `hook/payoff/standalone` 0–10, `score` 0–100, `title` ≤ 60 chars in the segment's language; prompt in `resources/prompts/highlight.txt`. Rust validates ranges and ignores unknown ids.

`score = 0.55*score_h + 0.45*llm/100`; unrated windows keep `score_h`. Any LLM failure (missing binary, crash, CUDA OOM → relaunch CPU build once, timeout, bad JSON) falls back silently with "Smart ranking unavailable this time".

### 4.3 Boundary snapping

For window `[s, e]` and target `L ∈ {15, 30, 60, 90}` (Reels allow 90 s, Shorts 3 min; 90 is offered only for sources > 10 min), tolerance −20 %/+15 %:

1. Start: nearest sentence start within ±4 s, preferring one after a silence ≥ 0.3 s; set `silence.end − 0.12 s`.
2. End: nearest sentence end within tolerance of `s+L`, preferring one before a silence ≥ 0.3 s; set `min(silence.start + 0.25, nextWord.start − 0.05)`.
3. No sentences → silence edges → scene cuts → `s+L`.
4. `WordAccurate`: never cut inside a word (nudge outward). `Coarse`: snap only to VAD/silence edges.
5. Reject if length ∉ [0.7 L, 1.3 L] or < 8 s.

### 4.4 Ranking and dedupe

Sort by `score`; accept greedily, rejecting > 20 % time overlap or > 50 % shared words with an accepted clip. Lists per `L` come from the same windows and are deduped together. Default view: best 6 with a 15/30/60/90 filter. **Grades are ranks, not quality** (`best` top 3, `good` next 5, `also` rest), since per-file normalisation cannot judge absolute quality. Source < 60 s → skip analysis, offer "This video is already short. Want to tighten it?" (silence removal only); 60 s–2 min → one clip at the best `L ≤ duration`; ≥ 2 min → at least 3 clips.

```ts
// src/lib/highlights.ts
export interface Highlight {
  id: string; mediaId: string;           // MediaRef id (project.media); sourcePath only inside Rust
  startUs: Us; endUs: Us;                // SOURCE time
  targetLength: 15 | 30 | 60 | 90; score: number; grade: "best" | "good" | "also";
  title: string; reasons: ("hook"|"question"|"laughter"|"energy"|"keyword"|"visual")[]; transcript: string;
}
```

```rust
#[tauri::command] pub async fn find_highlights(app: AppHandle, path: String, job_id: String,
    lengths: Vec<u32>, use_llm: bool) -> Result<Vec<Highlight>, String>;   // runs analyze_media if not cached
```

### 4.5 Panel and landing

`AutoCutTab` copy: "We found {n} moments in your {duration} video that work as reels." Primary button **Make my best reel**: top clip, 30 s, 9:16, full chain (section 10), opens in the editor; Welcome "Make clips" lands here. Secondary: per-row "Make this reel", **Make all N reels**, then **Export all**. Rows: title, length, grade, reason chips, filmstrip (`media_filmstrip`).

**Make all N reels** writes one `.verso` per clip to `<source folder>/Verso Reels/<source name>/Reel 01 of 06 - <title>.verso` (read-only → "Where should the reels go?"), `subtitle: "Reel i of N"`, media as `relPath`. A **Reel switcher** in `TopBar` ("Reel 2 of 6 ▾") opens siblings; **Export all** queues them. Reopening uses the editing-model relink flow; a stale `analysisKey` asks "This video changed since we analysed it. Analyse again?".

### 4.6 Edge cases

No speech → visual-only, "This video has little talking, so we picked moments by sound and motion." > 3 h → 30-min analysis chunks. Unsupported lexicon language → weights redistribute as in 4.1.

---

## 5. Silence and filler removal

### 5.1 Detection

Silences come from VAD, cross-checked with `ffmpeg -i audio16k.wav -af silencedetect=noise=-35dB:d=0.35 -f null -`: removable when both agree, or VAD alone ≥ 0.5 s. `pad = 0.12 s` each side; never remove gaps < 0.35 s; cap 1.2 s per gap ("tight" 0.2 s, "natural" 0.5 s).

Fillers (`resources/lexicon/fillers.json`): duration < 0.8 s, not alone in the sentence. English: `um uh umm uhh er erm hmm mm`, plus `like, you know, so, basically, actually, right?` only sentence-initial or flanked by gaps ≥ 0.25 s. Hindi/Hinglish: `aa aaa hmm आ हम्म` auto-eligible; `matlab wo woh toh haan achha yaani hain na kya bolte hain` and Devanagari forms are **review-only** (common content words), never auto-applied. Stutters: identical adjacent tokens within 0.4 s → remove the first.

**Accuracy gate.** Filler/stutter cuts auto-apply only when `transcript_quality == WordAccurate`, language `en`, sentence mean confidence ≥ 0.6. Otherwise they snap to VAD/silence edges (becoming silence cuts) or appear as "Review 7 more" in the Inspector. One click never clips real words in Hindi speech.

```ts
export interface Cut { startUs: Us; endUs: Us; kind: "silence" | "filler" | "stutter"; text?: string }  // SOURCE time
```

### 5.2 Applying

`removeCuts(project, clipId, cuts)` maps each source range to timeline µs through `inUs`/`speed`, then emits editing-model ops `split(a)`, `split(b)`, `delete([middle], ripple: true)` on the video clip and its `linkedId` audio, from the last cut backwards so earlier positions stay valid. All go through `history.execute` under one `coalesceKey = "autocut:" + jobId`, label "Removed pauses and fillers"; the Inspector's per-cut undo re-inserts one range (`insert`). Export avoids clicks because every audio lane already carries `afade=t=in:d=0.01` / `afade=t=out:st=len-0.01:d=0.01` (export spec §3.6; lanes are parallel with `adelay`, there is no audio `concat` and no `acrossfade`); preview ramps the `GainNode` 10 ms. Message: "Removed 2 min 14 s of pauses and 38 filler words. Your video is now 11:02." with Undo.

---

## 6. Auto punch-ins

A punch-in is **crop keyframes on the clip** (`MediaClip.crop: Keyframe<CropRect>[]`), not an effect clip (`variant: "effect"` is removed by the templates spec). It zooms **inside the reframe window**: with reframe keyframes present it shrinks that rect around its centre by `1/scale`, otherwise around the anchor. Times are **clip-relative µs**, so ripple edits elsewhere never move them and `split` interpolates them.

```ts
export interface PunchIn { startUs: Us; endUs: Us; scale: 1.08 | 1.15 | 1.25; anchor: { x: number; y: number }; easeInUs: 120_000; easeOutUs: 200_000 }
```

Placement (from the cache): emphasis = word ≥ 6 dB over median energy and ≥ 0.25 s, hook-word sentence, or first word after silence ≥ 0.8 s; questions zoom through the sentence. Scale 1.15 default, 1.25 at ≥ 9 dB, 1.08 for sections > 6 s. Rules: ≥ 2.5 s apart, ≤ one per 8 s, release 0.1 s before any scene cut, hold ≥ 1.2 s, release at the next sentence end or after 4 s. Anchor: reframe face box when present, else the rule-of-thirds point nearest the brightest motion in filmstrip frame differences; clamp inside the source. Each punch-in emits four `setKeyframe` ops (start, start+easeIn, end−easeOut, end; `ease: "easeInOut"`), coalesced into "Added 9 punch-ins".

**Export compilation (export spec §3.3, "changing size").** FFmpeg's `crop` evaluates `w`/`h` **once at configuration**; only `x`/`y` are per-frame (`libavfilter/vf_crop.c`: `filter_frame` re-evaluates only `x_pexpr`/`y_pexpr`; `t` in `w` fails with "Error when evaluating the expression", verified locally). A keyframed crop whose **size** changes therefore compiles to an animated upscale plus a fixed crop:

```
scale=w='trunc(iw*S(t)/2)*2':h='trunc(ih*S(t)/2)*2':eval=frame,
crop=W:H:x='clip(CX(t)*iw-W/2,0,iw-W)':y='clip(CY(t)*ih-H/2,0,ih-H)',setsar=1
```

where `S(t) = W / (cw(t)·srcW)` (`cw(t)` = piecewise-linear crop width from the keyframes) and `CX/CY` are the rect-centre expressions. `scale` with `eval=frame` accepts `t` and resizes per frame (verified with `showinfo`). Constant-size crops keep plain `crop` with animated `x/y`. Preview uses the same maths in CSS `transform`.

---

## 7. Beat sync to music

**7.1 Onsets** (Rust, rustfft) on the same 16 kHz WAV (nothing useful for onsets lives above 8 kHz): STFT Hann 1024, hop 256; log-compressed spectral flux over 30 Hz–8 kHz plus a 30–200 Hz kick band; 1 s local-median normalisation; peaks > local mean + 0.3·std, ±50 ms local max, ≥ 60 ms apart.

**7.2 Tempo.** Autocorrelation of the onset envelope at 60–200 BPM lags, preferring 85–165 unless the other octave is 1.5× stronger; beat phase by Ellis-style DP; downbeats every 4th beat maximising kick-band flux; `confidence` = peak ÷ mean, below 1.8 → onsets only. Target < 2 s for a 3-min track on one core.

**7.3 Cut placement** (`beatSync(project, musicClipId, grid)`), only when a music clip exists; never in the one-click chain otherwise. Grid = downbeats ("Every bar", default), beats, or every 2 bars. The operation **splits video clips** at grid points: for each grid time `g` inside the music clip's range, `split` at the nearest scene cut or sentence end within ±0.4 s, else at `g`. No reordering. If the last clip ends before the last grid point, `trimEnd` extends it while source remains, else it is left. Optional 1.08 × 0.25 s punch-ins on downbeats. Music is trimmed to project length with `fadeOut` 1.5 s. One entry: "Cut 14 clips to the beat (124 BPM)".

---

## 8. Audio auto-enhance

Export already applies two-pass `loudnorm I=-14:TP=-1:LRA=11` to the mix, so enhance **never includes loudnorm**. Chain from measurements:

1. Measure: `loudness` from cache; noise floor = 10th-percentile RMS during `silences`; speech RMS = median during `speech`; 5–9 kHz share of speech energy.
2. Decide: `highpass=f=80` (60 with music). `afftdn=nf={clamp(noiseFloor+6, -80, -20)}:nr={12 if SNR<20 dB else 8}:tn=1` only if `noiseFloor > -55 dBFS`, never on music-only clips. `deesser=i=0.3` if the 5–9 kHz share > 18 %. `acompressor=threshold={10^((speechRMS+3)/20)}:ratio=2.5:attack=8:release=150:knee=4` when LRA > 9 LU (ratio 3.5 above 15); `threshold` is **linear amplitude** (0.000976563–1, default 0.125 = −18 dBFS) and `makeup` is omitted (range 1–64; `makeup=0` fails filter init, verified).

```ts
export interface AudioEnhance { highpassHz: number; denoise?: { nf: number; nr: number }; deesser?: number; compressor?: { thresholdLin: number; ratio: number } }
```

Stored as `MediaClip.enhance?: AudioEnhance` (editing-model §1.2; one `setEnhance` op); the export spec §3.6 inserts the chain on that clip's lane after `aformat`, before the mix. **Preview**: Web Audio has no `afftdn`/`deesser`, so Rust renders `enhanced-<clipId>.wav` (48 kHz, ~1 s per 60 s clip) into the cache and the preview plays it instead of the element's audio; until then a `BiquadFilter(highpass)` + `DynamicsCompressor` approximation plays with "Preparing cleaner sound…". Message: "Cleaned up the sound: less background noise and an even volume." or, when `noiseFloor < -60` and LRA < 7, "Your sound already sounds good; we left it alone."

---

## 9. Undo and persistence

No new history mechanism. Each auto-edit in `src/lib/autoedit/*.ts` returns a `Command[]`; `runAutoEdit(dispatch, label, cmds)` executes them under one `coalesceKey`, collapsing them into one plainly labelled entry. The one-click chain thus creates six undoable entries. `media[id].analysisKey` is persisted so reopening does not re-analyse.

---

## 10. One-click chain

Fixed order: (1) create clip from highlight (`insert`, `inUs = startUs`), (2) silence and fillers ("natural", gated per 5.1), (3) audio enhance, (4) punch-ins, (5) captions (Phase 4; skipped until it exists), (6) reframe (`setReframe` with the solver's suggested mode). Free accounts count one `autoCutRunsPerDay` per chain (accounts spec §1); the fourth run of the day shows the upgrade sheet instead of running. Punch-ins follow cuts so they land on final speech; being clip-relative, later edits, captions or reframe do not move them. Budget: < 25 s for a 60 s clip on a GPU laptop excluding captions, with per-step progress text.

---

## 11. Failure handling

| Situation | What we do | Message |
| --- | --- | --- |
| FFmpeg missing | abort | `tools::missing_message()` |
| No audio stream | visual-only | "This video has no sound, so we picked moments by what's on screen." |
| Transcript failed/cancelled | audio+visual scoring | "We couldn't transcribe this video, so moments are picked by sound and motion. You can still add captions later." |
| Long source on CPU | estimate first | "About {n} minutes on this computer. Start now, or continue later?" |
| llama-server crash/timeout; model absent | heuristic | inline note / download link (section 4.2) |
| CUDA OOM | relaunch CPU build once | none unless that fails too |
| No steady beat | onsets only | "We couldn't find a steady beat in this track, so cuts follow the sound hits instead." |
| Zero highlights | 3 "also" clips | "Nothing stood out strongly, so here are three steady moments to start from." |
| Disk full | abort stage, keep finished stages | "Verso needs about {ceil(duration_min×2+50)} MB of free space to analyse this video." |
| Source moved | relink flow | editing-model messages, then "Analyse again?" |
| Cancel | kill children, keep finished stages | toast "Stopped. We'll pick up where we left off next time." |

Rust errors are plain-language `Result<_, String>`.

---

## 12. Test plan

Rust unit (`pnpm test:rust`): sentences (danda, question words in three scripts, `kya` particle, 25-word cap, gap split); both weight sets sum to 1; percentile normalisation on constant input and < 5 windows; snapping never inside a word (`WordAccurate`), only VAD edges (`Coarse`); dedupe; fillers (English `like`; Hindi review-only list never auto-applied); ebur128 metadata parsing; onsets/beats on synthetic clicks at 100/128/174 BPM (±1 BPM, phase ≤ 20 ms, octave case, noise → low confidence); acompressor dB→linear; LLM JSON validation and timeout fallback; chunk merge; stage-file resume after cancel.

Frontend (add **Vitest** and **Playwright** to `package.json`, currently absent): `removeCuts` emits split/split/delete in reverse order and round-trips through undo; punch-in keyframes survive a later ripple delete; size-changing crop compiles to `scale=…:eval=frame` + fixed `crop` (snapshot); Playwright: "Make my best reel" creates a project, Ctrl+Z ×6 restores, reel switcher lists siblings.

Integration (gated on `VERSO_SAMPLE_MEDIA`): 10-min English talking head (speech 50–95 %, ≥ 3 highlights, 5–30 % shortening, export −14 ± 1 LUFS); **10-min Hinglish podcast** (word timing vs hand labels, auto-applied filler precision ≥ 0.9, zero Hindi fillers auto-applied); **VFR phone clip** (analysis times within 60 ms of export output); **4K HEVC 10-bit** (hwaccel retry); **CPU-only** via `VERSO_FORCE_CPU=1` (small model, section 2 budgets); **moved-media relink**. Manual QA set in `qa/media`: music montage, noisy vlog, 3-hour stream, OBS recording with mic on stream 2.

---

## 13. Implementation checklist

1. `analysis.rs` (3a): per-stage cache files, LRU, audio stream pick, extraction + ebur128 metadata parse, Silero via vendored `ort`/ORT 1.28 (`fetch-ort.mjs`, licence files), energy, `scdet` with retry, progress/ETA, cancel keeps stages.
2. Editing-model dependency (its checklist 1-4): `Us`, UUID ids, `Command`, `history.execute`, `split/delete/insert/setKeyframe`, `crop: Keyframe<CropRect>[]`. Export compiler: size-changing crop → `scale eval=frame` + fixed crop.
3. `edits.rs` + `src/lib/autoedit/removeCuts.ts`: silence detection, gated fillers, ops, Inspector "Review more", per-segment `afade` in export.
4. Audio enhance: measurement, chain builder, `enhance` field, enhanced proxy WAV.
5. Punch-ins: emphasis detection, scheduling, keyframe ops, CSS preview.
6. Onsets + beat tracker; `beatSync` ops; "Sync to music" in the Audio tab.
7. `highlights.rs` 3a signals, snapping, dedupe, grades, `find_highlights`; `AutoCutTab` on real data; "Make my best reel", "Make all N", output folder, reel switcher, "Export all".
8. (3b, after captions items 1-4) chunked transcript with resume and estimate, CPU `small` choice, lexicons, text signals, `VoiceSegment` consumption.
9. llama-server builds (shared CUDA pack), `fetch-llama.mjs`, `models.json` entries (unsloth Q4_K_M default, official Q8_0 fallback, 4B), free-port launch + `/health`, schema call, thinking guards, timeouts, non-blocking offer.
10. One-click chain; Vitest/Playwright setup; section 12 fixtures; performance runs on dev box, RTX 3050, Iris Xe and CPU-only; weight tuning on the QA set.
