# Verso: Export and render pipeline (and real-time preview)

Status: implementation spec, revision 2 (after adversarial review). Fits the Phase 1 architecture: React owns the project model (`src/lib/project.ts`), Rust owns processes (`src-tauri/src/commands/*.rs`, `tools.rs`), FFmpeg 9 LGPL runs as a sidecar. Nothing here links FFmpeg into Verso or needs the network.

## 1. Verified facts this design relies on

| Fact | Verified at |
| --- | --- |
| BtbN `lgpl` variant excludes only GPL scripts (`x264, x265, xvid, xavs2, davs2, frei0r, vidstab, rubberband, avisynth`). `openh264` is built for every target (`ffbuild_enabled() { return 0; }`); `zimg` likewise (`--enable-libzimg`); `libplacebo` only for ffmpeg > 6 on win/linux. `variants/defaults-lgpl.sh` = `--enable-version3 --disable-debug`, LICENSE_FILE `COPYING.LGPLv3`, so the sidecar is **LGPL v3** (say so in About). | https://raw.githubusercontent.com/BtbN/FFmpeg-Builds/master/scripts.d/50-openh264.sh, `…/50-zimg.sh`, `…/50-libplacebo.sh`, `variants/defaults-lgpl.sh` |
| Windows LGPL sidecar encoders: `h264/hevc_nvenc, h264/hevc_qsv (libvpl), h264/hevc_amf, h264/hevc_mf, libopenh264, libvpx-vp9, libaom-av1, libsvtav1`, native `aac`; `fdk-aac` is nonfree and absent. | https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/configure |
| OpenH264 is BSD-2-Clause (Copyright 2013 Cisco). FAQ: "Cisco is only covering the licensing fees for its own binary module"; a source-compiled copy is **not** covered. | https://github.com/cisco/openh264/blob/master/LICENSE, https://www.openh264.org/faq.html |
| `-ss` placed before `-i` seeks the input and **rebases timestamps so the seek point becomes 0**; `-accurate_seek` is the default and discards decoded frames up to the exact position. `-to` is also valid as an input option. | https://ffmpeg.org/ffmpeg.html (`-ss`, `-to`, `-accurate_seek`), fftools/ffmpeg_demux.c (`ts_offset`) |
| mov/mp4 muxer: `use_editlist` defaults to `auto` and writes an `elst` when the first pts ≠ dts (any `-bf > 0`) and for AAC priming; `negative_cts_offsets` "reduces the need for edit lists for some cases such as video tracks with B-frames". | https://ffmpeg.org/ffmpeg-formats.html (mov/mp4), libavformat/movenc.c |
| `loudnorm print_format=json` is printed at log level **info** at filter uninit. | libavfilter/af_loudnorm.c |
| `-progress url` writes `key=value` lines ending `progress=continue\|end`; `-stats_period` default 0.5 s. | https://ffmpeg.org/ffmpeg.html |
| `xfade` needs equal size, pixel format, frame rate **and timebase**; `fps=` does not change the timebase. `atempo` range [0.5, 100]. `loudnorm` upsamples to 192 kHz. | `ffmpeg -h filter=xfade/atempo/loudnorm` |
| YouTube: MP4, moov first, **no edit lists**, H.264 High, **closed GOP of half the frame rate**, 2 B-frames, 4:2:0, BT.709, AAC-LC 48 kHz stereo **384 kbps**; 1080p SDR 8 Mbps (24–30) / 12 Mbps (48–60); 2160p 35–45 / 53–68. | https://support.google.com/youtube/answer/1722171 |
| Meta Reels API: MP4, H.264/H.265, 1080×1920 (min 540×960), 24–60 fps **fixed**, progressive 4:2:0, closed GOP 2–5 s, AAC-LC 48 kHz stereo ≥128 kbps, 3–90 s (the app accepts longer; API doc still says 90). | https://developers.facebook.com/docs/video-api/guides/reels-publishing |
| TikTok Content Posting API: MP4 (recommended)/WebM/MOV, H.264 recommended, 23–60 fps, 360–4096 px per side, ≤4 GB, up to 10 min via API. The 287 MB figure found earlier is a **browser-upload** limit, not an API one. | https://developers.tiktok.com/doc/content-posting-api-media-transfer-guide |
| Edge/WebView2: HEVC "Conditionally supported … Requires a valid HEVC Video Extension"; AV1 supported; ProRes never. | https://learn.microsoft.com/troubleshoot/microsoft-edge/development/video-playback-issues |
| Windows N/KN editions ship without media technologies until the Media Feature Pack is installed, so `h264_mf` is **not** guaranteed present. | https://support.microsoft.com/en-us/windows/media-feature-pack-list-for-windows-n-editions-c1c6fffa-d052-8338-7a79-a4bb980a700a |
| `tauri_plugin_shell::process::Command` has no `creation_flags`/priority API (methods: arg, args, current_dir, env, envs, env_clear, set_raw_out, set_process_group, kill_on_drop, spawn, status, output). | https://docs.rs/tauri-plugin-shell/latest/tauri_plugin_shell/process/struct.Command.html |
| Fonts: Noto Sans Devanagari is SIL OFL 1.1 (Copyright 2022 The Noto Project Authors). Manrope is distributed under SIL OFL 1.1 on Google Fonts; **confirm the OFL.txt in the bundled copy before release** (repo fetch blocked from this sandbox). zimg is WTFPL. The full bundled font set is the templates spec §7 table. | https://raw.githubusercontent.com/notofonts/devanagari/main/OFL.txt |
| `xfade` accepts **only 4:4:4 planar YUV, planar RGB and gray** pixel formats (`pix_fmts[]` = YUVA444P, YUVJ444P, YUV444P, GBRP, GBRAP, GRAY8 and their 9–16-bit variants; no 4:2:0). Feeding it `yuv420p` makes FFmpeg insert two hidden `scale` conversions per transition, so transition inputs are `format=yuv444p` and the graph ends with one `format=yuv420p`. | https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/libavfilter/vf_xfade.c (checked 2026-11-06) |

Everything used is LGPL (FFmpeg, lame, libplacebo), BSD/MIT/WTFPL (openh264, libvpx, aom, svt-av1, zimg, SDK headers) or OFL (fonts). **Legal items, not engineering:** H.264/HEVC patent-pool royalties for a paid product; openh264-from-source does not shift that to Cisco; whether the inbox Media Foundation encoder's patent coverage extends to Verso's use is for counsel, not this spec.

## 2. Scope and model

Export turns a `Project` into one MP4. Preview plays the same `Project` live. Both read one derived structure, the **Render Graph**, built in TypeScript so UI and export cannot disagree.

### 2.1 Project model (owned by `specs/editing-model-and-project-format.md` §1.2)

This spec defines **no** project types. It reads the v2 `Project` (integer-µs `Us`, `MediaRef`, `MediaClip`, `TextClip`, `ShapeClip`, `StickerClip`, `Transition`, `CaptionTrackData[]`, `Project.audio`, `Project.fps: Fraction`). The compiler converts to seconds only when writing FFmpeg arguments. Mapping used throughout this document:

| This document says | Project field |
| --- | --- |
| `start`, `end` (timeline s) | `startUs`, `startUs + durationUs` |
| `inPoint`, `outPoint` | `inUs`, `inUs + durationUs * speed` |
| `linkId` | `linkedId` (mutual) |
| `role`, `gain`, `fadeIn/fadeOut`, `muted` | `MediaClip.role`, `volume` (linear; `volume={v}` filter, not dB), `fadeInUs/fadeOutUs`, `muted` |
| `crop {x,y,w,h}` (normalised) | `CropRect {l,t,r,b}`: `x=l, y=t, w=1-l-r, h=1-t-b`; keyframed via `MediaClip.crop: Keyframe<CropRect>[]` (clip-relative `atUs`) |
| `fit: "fill" \| "fit"` | not stored. Derived from the first `Transform` keyframe: identity (`scale 1`, `x=y=0`, `rotate 0`) with an empty crop = **fill** (centre crop, the common case); anything else compiles to the general transform path below |
| `transitionIn` | `Project.transitions[*]` joining `leftClipId`/`rightClipId` (adjacent clips; §3.5 handles) |
| `music.duck/duckDb` | `Project.audio.duck/duckDb` |
| caption words | `Project.captions[i].words` with `timelineRange()` (captions spec §3.1) |

`TransitionKind` is the editing-model union (`crossfade | dip-black | slide | wipe | zoom`, with `direction` for slide/wipe); the compiler maps it to xfade `fade | fadeblack | slide{left,right,up,down} | wipe{left,right,up,down} | zoomin`. A cut is simply the absence of a `Transition`. `appendMedia` sets `role: "voice"` on the sound clip; **Add music** → `music`, **Add sound effect** → `sfx`. `buildRenderGraph` asserts linked pairs stay aligned (identical `startUs`, `durationUs`, `speed`) and reports "Sound is out of step with its video" otherwise. Ducking applies only music ↔ voice; `sfx` is mixed flat.

**General transform path.** When a video clip's `Transform` is not the identity (templates' slots, PiP on a second video track, a user "Fit"), the segment is scaled by `scale`, rotated by `rotateDeg` (`rotate=…:fillcolor=none`) and overlaid onto a `color=black` canvas at `x,y` (canvas fractions, 0 = centre). Several video tracks compose bottom-up with `overlay`; a `maskClipId` (templates) becomes `alphamerge` with the shape lane's gray PNG sequence. Keyframed transforms compile like crop keyframes (§3.3). `opacity` keyframes compile to `format=yuva444p,colorchannelmixer=aa='…'` on that segment before the overlay.

Track order (top to bottom): `text`, `overlay`, `video` (one or more), `audio`.

### 2.2 Extended `MediaInfo` (`commands/media.rs`)

Add to the existing struct (all `Option`/default so old projects load):

```rust
pub rotation: i32,                 // from side_data_list[displaymatrix].rotation, else stream_tags rotate; width/height stay as coded,
pub display_width: u32, pub display_height: u32,   // swapped when |rotation| == 90
pub pix_fmt: Option<String>, pub profile: Option<String>, pub level: Option<i32>,
pub color_transfer: Option<String>, pub color_primaries: Option<String>, pub color_space: Option<String>,
pub is_hdr: bool,                  // color_transfer in {smpte2084, arib-std-b67}
pub r_frame_rate: Option<Fraction>, pub avg_frame_rate: Option<Fraction>,   // raw ffprobe fractions (editing-model §1.1 owns `avg_frame_rate`; `fps: f64` stays for display)
pub is_vfr: bool,                  // |r-avg|/avg > 1 %, computed from the two fractions
pub time_base: Option<String>, pub start_time: f64, pub nb_frames: Option<u64>,
pub sample_rate: Option<u32>, pub channels: Option<u32>, pub channel_layout: Option<String>,
pub has_edit_list: bool,           // parsed by scanning moov for an elst box (see §4.3)
pub kind: MediaKind,               // Video | Audio | Still | AnimatedImage (gif/apng/webp with nb_frames > 1)
```

There is no second fingerprint: relink and preflight use `MediaRef { sizeBytes, mtimeMs, sha1Head }` through the editing-model's `media_fingerprint` / `resolve_media` commands. Cache keys for proxies, analysis and filmstrips all use `thumbnails.rs::cache_key(path, extra)` (path + size + mtime + a stage string).

ffprobe: `-v error -print_format json -show_format -show_streams -show_entries stream=…,stream_tags=rotate:stream_side_data=rotation -count_packets` (only for files < 200 MB; otherwise skip `-count_packets`). Rust unit fixtures: iPhone HEVC HLG `.mov` (rotation 90), Samsung PQ, Android VFR screen recording (`1/1000` timebase), ProRes, GIF, mono 44.1 kHz MP3.

### 2.3 Render Graph (`src/lib/render/graph.ts`)

```ts
export interface RenderGraph {
  width: number; height: number; fps: Fraction; duration: number;   // fps = project.fps, written as "{num}/{den}" everywhere below
  video: VideoSegment[];      // contiguous, sorted, gaps filled with black segments; timeline positions are the clips' own
  overlayLanes: { lane: "text" | "captions"; box: {x:number;y:number;w:number;h:number} /* px */; frames: OverlayFrame[] }[];
  audio: AudioLane[];         // one per audio clip, role voice|music|sfx, parallel (never sequential)
  transitions: { afterSegment: number; kind: TransitionKind; d: number; handles: "source" | "freeze" }[];
}
export interface VideoSegment {
  clipId: string; src: string | null; kind: "video" | "still" | "animated" | "black";
  inPoint: number; outPoint: number;   // after handle extension (§3.5)
  speed: number; crop: Keyframe<CropRect>[]; transform: Keyframe<Transform>[]; opacity: Keyframe<number>[];
  reframe: Reframe | null;             // reframe spec §8: compiled to sendcmd + crop@label before `crop`
  t0: number; t1: number;              // timeline range after handle extension
  info: MediaInfo | null;
}
export interface OverlayFrame { png: string /* file name in job dir */; t0: number; t1: number } // timeline s, contiguous per lane
```

`buildRenderGraph(project): RenderGraph` is pure and unit-tested: clamps to source duration, rejects overlaps ("Two clips overlap at 0:12"), derives transition handles, converts caption words to timeline time with the captions spec's `timelineRange(word, clips)` (hidden words are skipped), and lays out overlay lanes with blank frames for gaps.

## 3. Export compiler (`src/lib/render/compile.ts` + Rust `commands/export.rs`)

One FFmpeg process, one filtergraph in a script file (`-filter_complex_script`), never argv. Single-graph limits: **≤ 16 video inputs with `-hwaccel`, ≤ 24 without** (every `-filter_complex` input is opened and its decoder initialised at once; NVIDIA consumer parts and iGPUs cannot hold dozens of D3D11 decoder surface pools), overlays are two inputs regardless of count (§3.4). Above the limit → chunking (§3.7).

### 3.1 Inputs

```
[-hwaccel d3d11va] -ss {inPoint} -to {outPoint} -i "{src}"        # per video segment; -hwaccel is per-input and must precede each -i
-i "{src}"                                                       # audio clips (atrim in-graph, §3.6)
-loop 1 -framerate {fps} -t {dur} -i still.jpg                   # stills (image2 demuxer)
-stream_loop -1 -t {dur} -i anim.gif                             # GIF / animated WebP / APNG
-f concat -safe 0 -i "{job}/lane_text.txt"                       # overlay lanes, §3.4
```

Because `-ss` is an input option the decoded stream starts at PTS≈0 and is already frame-accurate (`-accurate_seek` default), so **no `trim` filter**; only `setpts=PTS-STARTPTS` to zero residual offsets. `-hwaccel` is only used when `encoder_capabilities.hwDecode` (a launch-time smoke test: `ffmpeg -hwaccel d3d11va -i probe.mp4 -f null NUL` on a bundled 1 s clip) is true; there is no mid-job retry. macOS: `-hwaccel videotoolbox`.

### 3.2 Per-segment video chain

```
[i:v] setpts=PTS-STARTPTS,
      {hdr}                                           # §3.3, only if info.is_hdr
      fps={fps}:round=near, settb=AVTB,               # VFR→CFR per segment; identical timebase for concat/xfade
      setpts=PTS/{speed}, fps={fps},                  # omitted when speed == 1
      {prescale}                                      # scale=-2:2160:flags=bicubic when display height > 2160
      {reframe}                                       # sendcmd=f=reframe_{k}.cmd,crop@r{k}=…:exact=1 (reframe spec §8), only when clip.reframe is set
      {crop}                                          # §3.3: punch-ins / user crop keyframes
      scale={W}:{H}:flags={lanczos|bicubic}:force_original_aspect_ratio=increase, crop={W}:{H},
      {freeze}                                        # tpad=…:clone when transition handles are "freeze"
      format={yuv444p|yuv420p}, setsar=1 [v{k}]       # yuv444p when the segment takes part in an xfade (§1), else yuv420p
```

A non-identity `Transform` replaces the scale/crop pair with the general transform path of §2.1 (`scale=…:force_original_aspect_ratio=decrease` + `overlay` onto a black canvas; a plain "Fit" is `scale=W:H:force_original_aspect_ratio=decrease,pad=W:H:(ow-iw)/2:(oh-ih)/2`). Black: `color=c=black:s={W}x{H}:r={fps}:d={t1-t0},settb=AVTB,format=yuv420p[v{k}]`. Stills/animated: same chain without the seek. Output also gets `-fps_mode cfr` as a guard for Meta's fixed-rate rule.

### 3.3 Crop, keyframes, HDR

Crop values are normalised against the **display** size (rotation applied by FFmpeg's auto-rotate) and converted by the compiler to pixels of the **post-prescale** frame, rounded to even. Keyframe times are clip-relative `atUs` → seconds of the segment's own `t` (which starts at 0 thanks to `setpts=PTS-STARTPTS`); the `Ease` union compiles as `linear` → `p`, `hold` → step, `easeOut` → `1-(1-p)²`, `easeInOut` → `3p²-2p³`.

FFmpeg's `crop` evaluates `w`/`h` **once at configuration**; only `x`/`y` are re-evaluated per frame (`libavfilter/vf_crop.c`; `t` inside `w` fails with "Error when evaluating the expression"). Therefore:

- **Constant size** (all keyframes share `w,h`): plain `crop=W:H:x='…':y='…'` with piecewise-linear `t` expressions, `x='if(lt(t,2.0), 120+(380-120)*t/2.0, 380)'`, clamped `0 ≤ x ≤ srcW-w`.
- **Changing size** (punch-ins, auto-clips spec §6): animated upscale plus fixed crop, `scale=w='trunc(iw*S(t)/2)*2':h='trunc(ih*S(t)/2)*2':eval=frame, crop=W:H:x='clip(CX(t)*iw-W/2,0,iw-W)':y='clip(CY(t)*ih-H/2,0,ih-H)'` where `S(t) = W / (cw(t)·srcW)`, `cw(t)` is the piecewise-linear crop width and `CX/CY` the rect-centre expressions. `scale` with `eval=frame` accepts `t`.
- **> 24 keyframes** of either kind → `sendcmd=f=crop_{k}.cmd` with one interval per keyframe pair, using the reframe spec's non-overlapping interval writer.
- **Reframe** (`MediaClip.reframe`): compiled first, as its own `sendcmd` + `crop@r{k}` instance per the reframe spec §8; the `.cmd` text is produced by the TS compiler (`src/lib/render/reframeChain.ts`, a pure port of the Rust writer, both checked against the shared fixture) and shipped in `ExportRequest.aux_files`. Punch-in crops then apply inside the reframed window.

HDR (`smpte2084` PQ or `arib-std-b67` HLG; default on recent Samsung/iPhone): `{hdr}` = `zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p`. `zscale` (libzimg, WTFPL) and `tonemap` (native) are in the LGPL build (§1). Alternative if quality is insufficient: `libplacebo=tonemapping=bt.2390:colorspace=bt709:color_primaries=bt709:color_trc=bt709` (LGPL-2.1, GPU, present in BtbN win64 ≥ ffmpeg 7). Without a tone-map, HDR footage exports grey; this is a release blocker for the India-first audience.

### 3.4 Text and captions (overlay lanes)

Rasterised in the WebView by the **one** `OverlayRenderer` (templates spec §7/§9.3: OffscreenCanvas in a Web Worker, same code as the live preview, fonts from the bundled set with per-word script selection as in the captions spec §5.1). This renderer is the only text engine in Verso: no `drawtext`, no libass burn-in, so preview and export text are pixel-identical. Lanes: `text` (TextClips), `overlay` (shape/sticker clips, plus gray mask sequences), `captions` (from `project.captions` through the captions spec's `layoutLine()`). Each lane has a fixed **box** (text/overlay: tight union of its items, captions: the caption band, e.g. 1080×400) and emits one PNG per *state*, box-sized, with fully transparent `blank.png` for gaps. The React layer writes a concat list per lane:

```
ffconcat version 1.0
file 'blank.png'
duration 1.200
file 'cap_0001.png'
duration 0.350
file 'pop_0001_00.png'      # animated states are 12 one-frame entries, duration 1/fps each
duration 0.033333
…
```

Graph: `[L:v] fps={fps},settb=AVTB,format=rgba[ov_text]; [v_all][ov_text] overlay=x={box.x}:y={box.y}:eof_action=pass:shortest=0[v_t]`, then the overlay and captions lanes. Each PNG decodes once; the `fps` filter duplicates frames, which is cheap. No `enable=`, no per-PNG inputs, no timing shift problems. A 2 h podcast with word captions ≈ 20 k box-sized PNGs (≈ 1–2 GB on disk; written and deleted per chunk, §3.7). Global lanes are composited after all transitions so text never cross-fades; a templates **in-scene** layer (`sceneId` set) is instead overlaid onto its scene's segments before the xfade, so it travels with the scene. PNGs stream to Rust through `overlay_begin(job, lane) / overlay_frame(job, lane, png, durationSec) / overlay_end(job, lane)` (templates spec §9.2) into the job dir, so the webview never holds a whole lane in memory. Optional subtitle sidecar: the captions spec's `.srt` writer, not a burn-in path.

### 3.5 Transitions (handles model; timeline positions never move)

A transition of duration `d` between segments `k` and `k+1` overlaps them symmetrically around the cut `C = t1_k = t0_{k+1}`:

1. Extend `k`: `outPoint_k += d/2`, `t1_k += d/2`. Extend `k+1`: `inPoint_{k+1} -= d/2`, `t0_{k+1} -= d/2`. Handles exist when `outPoint_k + d/2 ≤ srcDur_k` and `inPoint_{k+1} ≥ d/2` (stills always have handles).
2. If a side has no source handle, use a **freeze** handle: `tpad=stop_mode=clone:stop_duration={d/2}` on `k` or `tpad=start_mode=clone:start_duration={d/2}` on `k+1`, and warn once ("The clip is too short for a smooth transition, so Verso held its last frame"). Timeline length never changes.
3. `d` is clamped to `min(d, len_k, len_{k+1})`; the first clip's `transitionIn` is ignored.
4. Fold left to right: `[acc][v{k+1}] xfade=transition={kind}:duration={d_k}:offset={OFF_k}[acc']` with `OFF_k = (t1_k_original − T0) − d_k/2`, where `T0` is the timeline start of the accumulated group. Output length = Σ original lengths, by construction. Runs of `cut` segments are joined with `concat=n=…:v=1:a=0` first; xfade joins the resulting groups. All xfade inputs are `yuv444p` (§1: xfade has no 4:2:0 path); the accumulated stream gets one `format=yuv420p` after the last transition and before the overlay lanes. Transition kinds map `crossfade→fade`, `dip-black→fadeblack`, `slide→slide{direction}`, `wipe→wipe{direction}`, `zoom→zoomin`; the live preview reproduces exactly these five (templates spec §9.1 ports `zoomin`'s maths).

Audio stays **parallel** (§3.6): the linked audio clips of `k` and `k+1` get the same ±d/2 extension (or `apad` when there is no handle) plus `afade=t=out:st={len_k−d/2}:d={d}` and `afade=t=in:d={d}`. `acrossfade` is not used anywhere (it takes exactly two sequential streams and cannot be combined with `adelay`/`amix`).

### 3.6 Audio

Per audio clip `j` (input `i`), all lanes parallel:

```
[i:a] atrim=start={inPoint}:end={outPoint}, asetpts=PTS-STARTPTS,
      aresample=48000:async=1:first_pts=0, aformat=channel_layouts=stereo,
      {atempo chain}, volume={gain}dB, {afades}, adelay={t0*1000}|{t0*1000}, apad [a{j}]
```

`atempo` chain: 2 → `atempo=2`; 0.25 → `atempo=0.5,atempo=0.5`. Every lane also gets `afade=t=in:d=0.01,afade=t=out:st={len-0.01}:d=0.01` so auto-cut joins never click (auto-clips spec §5.2); `MediaClip.enhance` (auto-clips §8: `highpass`, `afftdn`, `deesser`, `acompressor`) is inserted right after `aformat`, never `loudnorm`, which belongs to the mix below. Buses: `amix=inputs=N:normalize=0:duration=longest` per role; missing bus → `anullsrc=r=48000:cl=stereo`. These ducking and loudness parameters are the only ones in Verso; the templates spec's music beds go through this same chain.

Ducking (default on when music and voice coexist):

```
[voice]asplit[voice_a][voice_sc];
[music][voice_sc] sidechaincompress=threshold=0.05:ratio=8:attack=20:release=400:makeup=1:level_sc=1:detection=rms:link=average [music_d];
[music_d] volume={duckDb+12}dB [music_g];           # heuristic: fixed compressor gives ≈12 dB on speech; duckDb adjusts the bed post-gain
[voice_a][music_g][sfx] amix=inputs=3:normalize=0:duration=first, alimiter=limit=0.98 [mix]
```

(`threshold=0.05` ≈ −26 dBFS RMS. Compressor ratio does not map to a fixed dB reduction, so `duckDb` is deliberately not mapped to `ratio`.)

Loudness: two-pass `loudnorm` to **−14 LUFS / −1 dBTP / LRA 11**. Pass 1 (stage *Analysing audio*) runs **`-loglevel info -nostats -vn … loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null NUL`** (`/dev/null` on Unix; never `-` because `-progress pipe:1` owns stdout) and parses the JSON object following the last `[Parsed_loudnorm_` line of stderr. Pass 2 appends `loudnorm=…:measured_I=…:measured_LRA=…:measured_TP=…:measured_thresh=…:offset=…:linear=true,aresample=48000` to `[mix]`. Parse failure → `Warning("We couldn't measure the sound level, so volume wasn't balanced.")` and no loudnorm. Encode `-c:a aac -ar 48000 -ac 2 -b:a 192k` (384k for YouTube/Shorts, matching Google's recommendation).

### 3.7 Output, container, chunking

```
-map "[vout]" -map "[aout]" {video args} -c:a aac … -fps_mode cfr -r {fps}
-pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv
-movflags +faststart+negative_cts_offsets -use_editlist 0 -video_track_timescale {timescale}
-metadata title="{name}" -metadata encoder="Verso" -f mp4 "{outDir}/.verso-{jobId}.part.mp4"
```

`{fps}` is `project.fps` written as `num/den` (`-r 30000/1001`, `fps=30000/1001`); `timescale = num * 1000` when `den == 1` and `num` when `den == 1001`, so every frame duration is an integer tick (1000 or 1001). `negative_cts_offsets` + `-use_editlist 0` is what actually satisfies YouTube's "no edit lists" with B-frames; verification scans for `elst` (§4.3). The `.part` file is written **in the output folder** (hidden-dot name) so the final step is an atomic rename, never a cross-volume copy.

**Entitlements (accounts spec §1).** Before building the request the sheet reads `account_state().entitlements`: `maxExportHeight: 1080` hides the 2160p size; `watermark: true` appends a 1.5 s Verso end-card (original art, `resources/endcard-{aspect}.png`, a `still` segment with a 0.3 s `crossfade` and the audio faded out over it) as the last segment. A Pro template on a free account locks Export entirely (templates spec §4.2). Everything else exports on Free.

**Chunking** (inputs above the §3 limit, or timeline > 12 min at 60 fps): split the segment list into chunks of ≤ 12 inputs. A chunk boundary falls on a `cut`; if the next boundary candidate is a transition, the pair `k, k+1` is kept in the same chunk (a chunk may therefore hold up to 14 inputs). Overlay lanes are sliced per chunk at the same boundaries (a caption spanning the boundary appears in both chunks' lists with the split durations). Each chunk is rendered video-only with identical codec args to `chunk_{n}.mp4`, PNGs are deleted after each chunk, then `-f concat -safe 0 -i list.txt -c copy video.mp4`, then a third FFmpeg: `-i video.mp4 {all audio inputs} -filter_complex_script audio.txt -map 0:v -c:v copy -map "[aout]" …` with the pass-1 loudnorm JSON reused. Progress: pass 1 = 10 %, chunks share 75 % weighted by duration, concat 2 %, audio mux 10 %, verify 3 %. Free-space check counts `3 × estimate` when chunking (`2 ×` otherwise). Cancel deletes chunk files after the child has exited.

### 3.8 Encoder selection and fallback

Rust probes once per launch (cached in `app_cache_dir/encoders.json`, keyed by ffmpeg hash + GPU driver string): parse `ffmpeg -hide_banner -encoders`, then smoke-test each candidate with `ffmpeg -f lavfi -i color=s=256x256:r=30:d=0.5 -c:v {enc} -f null NUL`, recording **speed** (used for estimates, §4.5). Presence is not enough: NVENC lists without a driver; `h264_mf` is absent on N editions. One rate-control mode per encoder, bitrate-capped VBR (platform specs are bitrate-based):

| # | Encoder | Args (`k` = preset kbps, `G` = GOP frames) |
| --- | --- | --- |
| 1 | `h264_nvenc` | `-preset p5 -tune hq -rc vbr -b:v {k}k -maxrate {1.5k}k -bufsize {3k}k -profile:v high -bf 2 -b_ref_mode middle -g {G} -spatial-aq 1 -temporal-aq 1 -multipass qres` (no `-cq`) |
| 2 | `h264_qsv` | `-preset slower -look_ahead 1 -b:v {k}k -maxrate {1.5k}k -bufsize {3k}k -profile:v high -bf 2 -g {G}` (no `-global_quality`) |
| 3 | `h264_amf` | `-quality quality -rc vbr_peak -b:v {k}k -maxrate {1.5k}k -profile:v high -bf 2 -g {G}` |
| 4 | `h264_mf` | `-rate_control vbr -b:v {k}k -max_bit_rate {1.5k}k -g {G} -hw_encoding 1`, then `-hw_encoding 0`; the smoke test decides whether it exists |
| 5 | `libopenh264` | `-profile:v high -rc_mode bitrate -allow_skip_frames 0 -b:v {k}k -maxrate {1.5k}k -g {G}`; last resort (§1) |

GOP: `G = fps/2` for YouTube/Shorts (Google: half the frame rate), `G = 2*fps` for Reels/TikTok/Square (Meta 2–5 s). `-bf 2`, yuv420p, BT.709 tags everywhere. HEVC (`hevc_nvenc/qsv/amf/mf`, `-tag:v hvc1`) is offered **only on the YouTube preset** as "Smaller file"; web uploaders and WhatsApp handle H.264 far more reliably. No software HEVC. AV1 (`libsvtav1 -preset 8 -crf 32`) is a YouTube opt-in. macOS: `h264_videotoolbox -b:v {k}k -maxrate {1.5k}k -profile:v high -allow_sw 1`.

Failure → next encoder: non-zero exit, or stderr matching `/(No capable devices|Cannot load|Failed to initiali[sz]e|InitializeEncoder failed|not supported|out of memory|0x8007|MFCreate|MFX_ERR)/i`, or verification failure. The job restarts from the render stage (pass-1 JSON reused). After the second fallback: "Your graphics card couldn't finish this export, so Verso is using a slower method. This may take a few minutes." Encoder names never appear in the UI.

**Presets = platform × project aspect.** The default chip follows `project.aspect` (9:16 → Reels, 16:9 → YouTube, 1:1 → Square), so "Export" is one click. Chips that make no sense for the aspect are disabled with a reason ("Reels are vertical. Change the project to 9:16 to export for Reels."). Sizes come from the aspect (9:16 → 1080×1920, 16:9 → 1920×1080 or 3840×2160 when the longest source is ≥ 2160 px tall and the account allows 2160, 1:1 → 1080×1080). `AspectRatio` has three values in the editing model; 4:5 is deliberately absent until that union grows.

| Platform | Allowed aspects | H.264 target/max | Audio | Notes |
| --- | --- | --- | --- | --- |
| Reels (Instagram/Facebook) | 9:16 | 10/15 Mbps | 192k | > 90 s → "Instagram may limit Reels longer than 90 seconds." |
| Shorts (YouTube) | 9:16, 1:1 | 12/18 (16/24 at 50/60) | 384k | > 180 s → warning |
| TikTok | 9:16, 1:1, 16:9 | 10/15 | 192k | 23–60 fps, ≤ 10 min, ≤ 4 GB (API); no size-capping logic |
| YouTube | 16:9, 9:16 (a Short) | 1080p 8/12, 2160p 40/60 (×1.5 at HFR) | 384k | HEVC/AV1 opt-in |
| Square / Feed | 1:1 | 8/12 | 192k | |

## 4. Rust side (`src-tauri/src/commands/export.rs`)

### 4.1 Types and commands

```rust
#[derive(Deserialize)] #[serde(rename_all="camelCase")]
pub struct ExportRequest {
  pub job_id: String, pub preset: Preset, pub width: u32, pub height: u32, pub fps: Fraction, pub duration_sec: f64,
  pub hevc: bool, pub chunks: Vec<ChunkSpec>,        // one chunk = whole job when not chunking
  pub audio_inputs: Vec<InputSpec>, pub audio_script: String, pub audio_measure_script: String,
  pub aux_files: Vec<(String, String)>,               // small text files for the job dir: concat lists, sendcmd `.cmd` files. PNGs arrive via overlay_* (§3.4)
  pub out_path: String,                               // from plugin-dialog save()
}
pub struct ChunkSpec { pub inputs: Vec<InputSpec>, pub filter_script: String, pub duration_sec: f64 }
pub struct InputSpec { pub path: String, pub ss: Option<f64>, pub to: Option<f64>, pub kind: InputKind /* Video|Audio|Still|Animated|ConcatList */, pub framerate: Option<u32> }
#[derive(Serialize, Clone)] #[serde(rename_all="camelCase", tag="kind")]
pub enum ExportEvent {
  Stage { job_id: String, stage: Stage },  // Preparing|AnalysingAudio|Rendering|Joining|Mixing|Checking|Done
  Progress { job_id: String, fraction: f64, out_time_sec: f64, fps: f64, speed: f64, eta_sec: Option<f64> },
  Warning { job_id: String, message: String },
  Done { job_id: String, path: String, size_bytes: u64, duration_sec: f64 },
  Failed { job_id: String, message: String, detail_log_path: String },
  Cancelled { job_id: String },
}
#[tauri::command] pub async fn export_preflight(app: AppHandle, req: PreflightRequest) -> Result<Vec<Issue>, String>;
#[tauri::command] pub async fn export_estimate(app: AppHandle, req: EstimateRequest) -> Result<Estimate, String>; // {seconds, bytes}
#[tauri::command] pub async fn export_start(app: AppHandle, state: State<'_, ExportState>, req: ExportRequest) -> Result<(), String>;
#[tauri::command] pub async fn export_cancel(state: State<'_, ExportState>, job_id: String) -> Result<(), String>;
#[tauri::command] pub async fn encoder_capabilities(app: AppHandle) -> Result<EncoderCaps, String>;
   // { h264: Vec<EncoderProbe{name, speed_1080p}>, hevc: Vec<…>, hw_decode: bool }
   // The ONE encoder/hwaccel probe in Verso: captions, reframe, templates (proxies) and auto-clips all read this; none probes on its own.
#[tauri::command] pub async fn export_open_folder(path: String) -> Result<(), String>;
#[tauri::command] pub async fn media_proxy(app: AppHandle, path: String, on_progress: tauri::ipc::Channel<f32>) -> Result<String, String>;  // §5.1
```

Relinking is the editing-model's flow (`resolve_media`, `media_fingerprint`, **Locate…**); there is no export-specific relink command.

Events: `app.emit("export://event", …)`; frontend `listen` in `src/lib/export.ts`, filtered by `jobId`. `ExportState = Mutex<HashMap<String, JobHandle { child: Option<Child>, cancel: Arc<AtomicBool>, job_dir: PathBuf, part_path: PathBuf }>>`.

### 4.2 Preflight (`export_preflight`, runs before the sheet shows Start)

Returns `Issue { severity: "block" | "warn", clip_id: Option<String>, message: String, action?: "relink" | "trim" | "changePreset" }`:

- source `missing` in the Editor's `MediaStatus` map, or `sizeBytes`/`sha1Head` changed since import → block, "We couldn't find *{file}*. Locate it to continue." (UI: the editing-model's **Locate…** flow; clips show the hatched Missing look meanwhile);
- entitlement: 2160 requested on a Free account → block with the 1080p button (the sheet should never offer it); Pro template on Free → Export locked (templates spec §4.2);
- overlapping clips on a lane, linked pair misaligned → block;
- duration outside platform bounds → warn (Reels < 3 s → block: "Reels need to be at least 3 seconds");
- aspect/preset mismatch → block with the chip reason; HDR source without tone-map support → block;
- free space < 2× (3× chunked) estimate → block ("Free up about {N} MB or export somewhere else"); FAT32 + estimate > 4 GB → block;
- no usable encoder → block; CPU-only + 4K → warn with the §4.5 prompt.

### 4.3 Job algorithm

1. `job_dir = app_cache_dir()/exports/{job_id}/` for scripts, PNGs, logs; `part_path` in the output folder. Write files.
2. Output fps = `project.fps` (editing-model §1.1 snaps it from the first import's `avg_frame_rate`; never re-derived here).
3. Stage `AnalysingAudio` (§3.6 pass 1): progress 0–10 %.
4. Stage `Rendering`: for each chunk, for `enc in candidates`: spawn `-hide_banner -nostdin -loglevel warning -y -progress pipe:1 -stats_period 0.25 -threads 0 …`. Stdout is read by a tokio task line by line (`progress=` flushes a record), stderr to `{job_dir}/ffmpeg.log` plus a 64 KB ring buffer. `speed=   0x` → 0, `N/A` → `None`. Events ≤ 8/s. Then `Joining` and `Mixing` when chunked.
5. Cancellation: set the flag, `child.kill()`, **`child.wait()`**, then delete `part_path`, chunk files and `job_dir`; if a delete fails (Windows lock), record the path in `app_cache_dir/pending_delete.json` and retry at next launch. Emit `Cancelled`. Cancel button disabled 500 ms after click.
6. Stage `Checking` (§4.4), then `fs::rename(part_path, out_path)` (same volume by construction; overwrite is pre-approved by the save dialog). Emit `Done`.
7. Keep `ffmpeg.log` 7 days under `app_log_dir()/exports/`; sweep `exports/*` and stray `.verso-*.part.mp4` older than 24 h at launch.

Process hygiene: keep the existing `tools::command()` (`std::process::Command` with `CREATE_NO_WINDOW`), extended with `creation_flags(CREATE_NO_WINDOW | BELOW_NORMAL_PRIORITY_CLASS /* 0x4000 */)` and `stdout/stderr(Stdio::piped())`, wrapped in `tokio::process::Command::from` for async readers. No `tauri-plugin-shell` dependency (it exposes no creation flags and would need a second capability scope for the dev PATH fallback).

### 4.4 Verification pass

```
ffprobe -v error -print_format json -show_format -show_streams -count_packets part.mp4
ffprobe -v error -select_streams v:0 -show_packets -read_intervals %+#1 part.mp4
```

Fatal (→ next encoder once, then `Failed`): stream count ≠ 1+1; codec/`pix_fmt`/size mismatch; `avg_frame_rate` off by > 0.5 % or `nb_frames` outside ±1 of `round(fps×duration)` (`r_frame_rate` mismatch is only a warning); `format.duration` off by > max(0.1 s, 1 frame); `format.start_time ≠ 0` or first video packet `pts ≠ 0`; `format_name` lacks `mp4`; **moov contains an `elst` box** (Rust walks `moov → trak → edts → elst`; the same walker fills `MediaInfo.has_edit_list`). Software-fallback encodes also run `ffmpeg -v error -i part.mp4 -t 2 -f null NUL`.

### 4.5 Estimate and messages

`export_estimate`: `seconds = duration × (1 / encoder.speed_1080p) × (W×H / (1920×1080)) + pass1` and `bytes = (v_kbps + a_kbps) × duration / 8`, shown under the Start button ("About 40 s · 110 MB"). CPU-only with 4K: dialog "This will take about {N} minutes on this computer. Export 1080p instead?" with **1080p** as the default button.

| Condition | Message |
| --- | --- |
| input missing (`No such file`) mid-render (should be caught in preflight) | "We couldn't find *{file}*. Locate it to continue." → relink flow |
| `Invalid data found when processing input` | "Part of *{file}* seems damaged, so we couldn't read it." |
| all encoders failed | "We couldn't finish the export on this computer. Updating your graphics driver usually fixes this." |
| `No space left`, `0x70` | "The drive ran out of space while saving. Free up space and try again." |
| output locked (`0x20`) | "That file is open in another app. Close it or pick a different name." |
| exit 0 but verify failed | "The finished file didn't check out, so we're trying another way." |
| sidecar missing | `tools::missing_message()` |

## 5. Real-time preview

### 5.1 Decision

**Option A: `<video>` per clip with gapless switching** (chosen) vs **Option B: Rust decode → canvas** (1080p30 raw is 93 MB/s over IPC, needs an A/V clock, `cpal`, GPU upload; weeks of work and 15 fps on CPU-only HEVC). A with a **proxy fallback**: on import run `canPlayType()` against the probed codec (`avc1.640028`, `hvc1.1.6.L120.B0`, **`hvc1.2.4.L153.B0`** for Main10/HDR, `vp09.00.10.08`, `av01.0.08M.08`); `needsProxy` (ProRes, DNxHR, HEVC without the Store extension, 10-bit, MPEG-2, > 4K, HDR of any codec since the WebView does no tone-mapping) starts a background proxy:

```
ffmpeg [-hwaccel d3d11va] -i src -map 0:v:0 -map 0:a? -vf "{hdr if is_hdr},scale=-2:720:flags=bicubic,fps=30,format=yuv420p"
  -c:v {first of h264_nvenc p1 | h264_qsv veryfast | h264_amf speed | h264_mf | libopenh264 -rc_mode bitrate} -b:v 4M
  -g 15 -bf 0 -c:a aac -b:a 128k -ar 48000 -movflags +faststart {cache}/proxies/{cache_key}.mp4
```

This is the **only** proxy pipeline in Verso (Rust command `media_proxy`, §4.1; key = `thumbnails.rs::cache_key(path, "proxy-v1")`; index `proxies/index.json`, LRU above 10 GB). The templates spec's grid and compositor use these proxies; nothing pads a proxy to the canvas. Proxy is preview-only; export always uses the original. Until it exists, the filmstrip frame shows with "Preparing preview…". Runtime `MEDIA_ERR_DECODE` on a "playable" asset flips it to `needsProxy`. macOS: same gate; **ProRes-on-Mac is treated as `needsProxy` until `canPlayType` is measured in WKWebView** (WebKit's `<video>` allow-list is not QuickTime's).

### 5.2 Player (`src/lib/player/`)

- `ClipPool`: `<video>` elements, `preload="auto"`, `crossOrigin="anonymous"`, `src = convertFileSrc(...)`. Base size 3; grows to the number of clips starting within the next 1 s (cap 6); clips shorter than the 400 ms pre-roll fall back to filmstrip frames instead of a seeked element.
- Master clock = `AudioContext.currentTime`. Drift > 60 ms → nudge `playbackRate` ±2 % for 500 ms; > 250 ms → re-seek.
- Gapless cut: 400 ms before `t1`, seek `next` and `play()` it muted; swap z-order and gain in one `requestAnimationFrame`. Transitions draw both elements into a `<canvas>` over the overlap `[C−d/2, C+d/2]`, exactly the export window, using `transitionAt()` from the templates spec §9.3. The same canvas path is used whenever more than one video clip is visible (second video track, template scenes with several slots, masks); a single full-frame clip is shown as a bare `<video>`. Per-clip `Transform`/`crop` and the reframe window (`cropAt()`, reframe spec §7) are applied as CSS `transform` on the bare element or as draw-rect maths on the canvas, with the reframe spec's even-pixel rounding. **This `src/lib/player/` module is the one preview engine**; the reframe, templates and captions specs plug into it rather than owning `<video>` elements.
- Audio: element → `MediaElementAudioSourceNode` → `GainNode` → role bus; music bus gain follows an `AnalyserNode` on the voice bus (60 Hz follower approximating the sidechain); master `DynamicsCompressorNode` limiter. **Implementation gate:** verify at startup that the asset protocol response carries `Access-Control-Allow-Origin` for the WebView origin (fetch one proxied file and check `response.type === "cors"`); if not, Web Audio would output silence, so fall back to `element.volume` for gain/fades and skip preview ducking (Inspector: "Volume is balanced on export"). No loudnorm in preview.
- Text/captions: DOM layers driven by `RenderGraph.overlayLanes`, same fonts and CSS as the rasteriser.
- Scrub: filmstrip frame instantly, real frame on `seeked` (≤ 150 ms).

## 6. Performance targets

| Metric | A4000 | iGPU laptop (4-core) | CPU-only |
| --- | --- | --- | --- |
| 90 s 1080p30 reel, 6 clips, captions, music | ≤ 25 s | ≤ 60 s (QSV) | ≤ 4 min (`h264_mf` sw) |
| Pass-1 loudness | ≤ 4 s | ≤ 8 s | ≤ 12 s |
| Encoder + hwaccel probe at launch | ≤ 2 s, off the UI thread | | |
| Proxy of 10 min 4K HEVC HDR | ≤ 3 min | ≤ 8 min | ≤ 25 min, background |
| 2 h podcast, 1 clip, word captions (≈ 20 k PNGs) | ≤ 1.2× realtime | ≤ 2× | ≤ 6× |
| Preview cut / 0.3 s montage | 0 dropped frames, jitter ≤ 1 frame | same | same |
| Memory | Rust ≤ 150 MB; FFmpeg ≤ 2 GB per chunk | | |

## 7. Edge cases

- Clip past source end → clamp, `Warning("{clip} was shortened by {n}s because the video ends there.")`.
- Rotation: FFmpeg auto-rotates; crop and preview use `display_width/height`.
- 44.1 kHz, mono, 5.1 → per-clip `aresample`/`aformat`; VFR audio drift → `aresample=async=1`.
- Stills → `-loop 1 -framerate fps -t`; GIF/animated → `-stream_loop -1 -t` (§3.1, single source of truth).
- Transition on the first clip ignored; `d` clamped to the shorter neighbour; freeze handles when the source has none.
- Non-ASCII paths: `OsString`, UTF-8 scripts, inputs by index; concat lists use single-quoted paths with `'` escaped as `'\''`.
- Window close mid-export → "An export is still running. Stop it and close?" then kill + wait.
- Sleep/lock: `MFX_ERR_DEVICE_LOST` / NVENC `0x8007…` → encoder failure → fallback.
- Chunk boundary inside a caption word → the word appears in both chunk lists with split durations (§3.7).

## 8. Test plan

Unit (TS, vitest): `buildRenderGraph` (gaps → black, overlap error, clamping, speed maths, linked-pair propagation, caption `timelineRange` conversion at speed 1 and 2, handle derivation incl. freeze fallback); `compileFilterGraph` snapshots: single clip (no `trim`, has `settb=AVTB`, `yuv420p`); three clips, two transition kinds (offset assertions `OFF_k = t1_k − T0 − d/2`, total duration unchanged, `yuv444p` on every xfade input and one final `format=yuv420p`); reframed clip (sendcmd fragment present, `.cmd` in `aux_files`); punch-in with size change (`scale=…:eval=frame` + fixed crop); templates' 12 golden projects (in-scene overlay before xfade, `alphamerge` mask); 23.976 + 60 fps + 1/1000-timebase VFR screen recording → every segment `fps=30,settb=AVTB`; HLG and PQ segments get the tone-map chain, SDR none; keyframed crop with prescale conversion and even rounding; ducking graph has `asplit`, no `acrossfade`; overlay lanes produce exactly two concat inputs for 300 captions, lane lists sum to timeline duration; chunking keeps xfade pairs together and splits a caption at the boundary; preset × aspect table (YouTube 9:16 allowed, Reels 16:9 disabled); Hindi/Hinglish caption fixture rasterises non-blank with Devanagari glyphs. Unit (Rust): `-progress` parser (`speed=   0x`, `N/A`, split lines); loudnorm JSON extraction from `-loglevel info` stderr fixtures (and a `-loglevel warning` fixture that must fail loudly); failure regex → message table; `elst` walker on fixtures with and without an edit list; `verify_output` (good, VFR leak, no audio, pts ≠ 0, elst present); extended `MediaInfo` on the §2.2 fixtures. Integration (`VERSO_SAMPLE_MEDIA`): 10 s project per available encoder passes verification and has no `elst`; cancel leaves no `.part` or chunk files, including with a held file lock; `VERSO_FAKE_ENCODER_FAIL=h264_nvenc` falls through; HDR sample exports with mid-grey ≈ 0.45–0.5 luma in a grey-card frame; 2 h single-clip podcast with word captions completes within §6 and ≤ 2 GB FFmpeg RSS; linked clip at 2× keeps A/V sync (clap test ≤ 1 frame); missing-media preflight → relink → export succeeds; ProRes → proxy → `canPlayType` gate; 0.3 s montage preview drops no frames. Manual matrix: Win11 + RTX, Win11 + Intel iGPU, Win10 + AMD, Win11 N edition VM without GPU (no `h264_mf`; must reach `libopenh264`); uploads to Instagram, Shorts, TikTok, YouTube without re-encode warnings; `ffmpeg -af ebur128 -f null -` reads −14 ± 1 LU.

## 9. Ordered implementation checklist

1. Extend `MediaInfo` (§2.2) + ffprobe entries + `elst` walker + fixtures (depends on editing-model checklist 1 for `avg_frame_rate: Fraction`).
2. `buildRenderGraph` over the v2 `Project` (editing-model checklist 1–3 done first) + tests; transition-kind → xfade mapping.
3. `encoder_capabilities` with smoke tests, speed capture, `hw_decode` probe, cache.
4. `compileFilterGraph`: inputs (`-ss/-to`, no trim), per-segment chain with `settb`, HDR tone-map, crop expressions (constant-size, size-changing via `scale eval=frame`, reframe sendcmd via `reframeChain.ts`), general transform path, `yuv444p` into xfade; snapshot tests.
5. `export.rs`: `std::process::Command` + tokio readers, `-progress` parser, events, `.part` in output folder, cancel-wait-delete, pending-delete sweep; Export sheet (aspect-driven default chip, estimate, progress, Cancel, Show in folder).
6. `export_preflight` + Issue UI (Offline badge, relink picker).
7. Audio: parallel lanes, roles, ducking, two-pass loudnorm with `-loglevel info` pass 1; `-movflags +faststart+negative_cts_offsets -use_editlist 0`; verification pass.
8. Transitions with handles/freeze + audio fades; overlay lanes (rasteriser with Manrope + Noto Sans Devanagari, concat lists, two overlay inputs).
9. Encoder fallback loop and messages; GOP per preset; HEVC/AV1 on YouTube only; chunking (xfade-pair rule, caption splitting, third-pass mux).
10. Preview: `ClipPool` growth rule, Web Audio with CORS gate and element-volume fallback, canvas transitions over `[C−d/2, C+d/2]`, DOM overlays, scrub.
11. Proxy pipeline incl. HDR and Main10 gating; runtime decode-error fallback.
12. macOS: VideoToolbox args, `-hwaccel videotoolbox`, measure WKWebView `canPlayType` for ProRes.
13. Release gate: manual matrix; legal sign-off on H.264/HEVC royalties, openh264 last resort, Media Foundation coverage; LGPL v3 notice, source link and font licences (Manrope OFL confirmed from the bundled file) in About.
