//! The analysis pipeline: sample frames and audio with the FFmpeg sidecar, find
//! and track faces, hear when someone talks, and match voices to faces.
//!
//! Active speaker = the visible face whose mouth moves most (above its own
//! baseline) while the voice finder hears speech. Identity across cuts comes
//! from SFace embeddings when installed, else from "same seat" (box overlap).

use std::collections::BTreeMap;
use std::io::{ErrorKind, Read};
use std::path::{Path, PathBuf};
use std::process::{Child, Stdio};

use super::models::{self, SFACE, SILERO, YUNET};
use super::onnx::{EnergyVad, SFace, Silero, YuNet};
use super::tracker::Tracker;
use super::{
    Face, FaceDetector, FaceEmbedder, FaceTrack, Frame, Rect, ReframeAnalysis, Speaker,
    SpeechSegment, TrackBox, VoiceDetector,
};
use crate::tools::{self, Tool};

pub const SAMPLE_FPS: f64 = 8.0;
const SAMPLE_WIDTH: u32 = 640;
const SR: usize = 16_000;

pub struct Models {
    pub detector: Box<dyn FaceDetector>,
    pub embedder: Option<Box<dyn FaceEmbedder>>,
    pub vad: Box<dyn VoiceDetector>,
    pub names: Vec<String>,
}

/// Load whatever is installed. The face finder is required.
pub fn load_models(dir: &Path) -> Result<Models, String> {
    let yunet =
        models::installed(dir, YUNET).ok_or("Download the face finder first, then try again.")?;
    let mut names = vec![YUNET.to_string()];
    let vad: Box<dyn VoiceDetector> = match models::installed(dir, SILERO) {
        Some(p) => {
            names.push(SILERO.into());
            Box::new(Silero::new(&p)?)
        }
        None => Box::new(EnergyVad::new()),
    };
    let embedder: Option<Box<dyn FaceEmbedder>> = match models::installed(dir, SFACE) {
        Some(p) => {
            names.push(SFACE.into());
            Some(Box::new(SFace::new(&p)?))
        }
        None => None,
    };
    Ok(Models {
        detector: Box::new(YuNet::new(&yunet)?),
        embedder,
        vad,
        names,
    })
}

fn spawn(args: &[String], src: &Path) -> Result<Child, String> {
    tools::command(Tool::Ffmpeg)
        .args([
            "-hide_banner",
            "-loglevel",
            "error",
            "-ss",
            &args[0],
            "-t",
            &args[1],
            "-i",
        ])
        .arg(src)
        .args(&args[2..])
        .arg("pipe:1")
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| match e.kind() {
            ErrorKind::NotFound => tools::missing_message(),
            _ => format!("We couldn't start FFmpeg ({e})."),
        })
}

pub type Progress<'a> = &'a mut dyn FnMut(f64, &str);

pub fn analyze(
    src: &Path,
    in_point: f64,
    out_point: Option<f64>,
    m: &mut Models,
    thumbs_dir: &Path,
    analysis_id: String,
    progress: Progress,
) -> Result<ReframeAnalysis, String> {
    let info = crate::commands::media::probe(&src.to_string_lossy())?;
    let (true, Some(sw), Some(sh)) = (info.has_video, info.width, info.height) else {
        return Err("This file has no picture, so there are no faces to find.".into());
    };
    let in_point = in_point.max(0.0);
    let out = out_point
        .unwrap_or(info.duration_sec)
        .min(info.duration_sec)
        .max(in_point);
    let dur = out - in_point;
    if dur <= 0.05 {
        return Err("This part of the clip is too short to look for speakers.".into());
    }

    progress(0.0, "Listening for voices…");
    let speech = if info.has_audio {
        voice_segments(src, in_point, dur, m.vad.as_mut(), progress)?
    } else {
        Vec::new()
    };

    progress(25.0, "Finding faces…");
    let mut tracks = face_tracks(src, in_point, dur, sw, sh, m, progress)?;
    let min_boxes = ((SAMPLE_FPS * 0.5) as usize).max(3);
    tracks.retain(|_, t| t.boxes.len() >= min_boxes);

    progress(90.0, "Matching voices to faces…");
    let identity = identities(&tracks);
    let windows = attribute(&speech, &tracks, &identity);

    // Rank identities by talk time, keep the ones that matter.
    let mut talk: BTreeMap<u32, f64> = BTreeMap::new();
    let mut seen: BTreeMap<u32, f64> = BTreeMap::new();
    for (s, e, who) in &windows {
        if let Some(id) = who {
            *talk.entry(*id).or_default() += e - s;
        }
    }
    for (tid, t) in &tracks {
        *seen.entry(identity[tid]).or_default() += t.boxes.len() as f64 / SAMPLE_FPS;
    }
    let mut ranked: Vec<u32> = seen
        .iter()
        .filter(|(id, vis)| **vis >= 2.0 || talk.get(id).copied().unwrap_or(0.0) > 0.5)
        .map(|(id, _)| *id)
        .collect();
    ranked.sort_by(|a, b| {
        let key = |id: &u32| (talk.get(id).copied().unwrap_or(0.0), seen[id]);
        key(b)
            .0
            .total_cmp(&key(a).0)
            .then(key(b).1.total_cmp(&key(a).1))
    });
    let final_id = |ident: u32| {
        ranked
            .iter()
            .position(|r| *r == ident)
            .map(|i| i as u32 + 1)
    };

    let face_tracks: Vec<FaceTrack> = tracks
        .iter()
        .filter_map(|(tid, t)| {
            Some(FaceTrack {
                id: *tid,
                speaker_id: final_id(identity[tid])?,
                boxes: t.boxes.clone(),
            })
        })
        .collect();

    let mut speech_segments: Vec<SpeechSegment> = Vec::new();
    for (s, e, who) in windows {
        let who = who.and_then(final_id);
        match speech_segments.last_mut() {
            Some(last) if last.speaker_id == who && (s - last.end).abs() < 1e-6 => last.end = e,
            _ => speech_segments.push(SpeechSegment {
                start: s,
                end: e,
                speaker_id: who,
            }),
        }
    }

    progress(97.0, "Saving speaker pictures…");
    std::fs::create_dir_all(thumbs_dir)
        .map_err(|e| format!("We couldn't create the speaker picture folder ({e})."))?;
    let speakers = ranked
        .iter()
        .enumerate()
        .map(|(i, ident)| {
            let id = i as u32 + 1;
            let best = face_tracks
                .iter()
                .filter(|t| t.speaker_id == id)
                .flat_map(|t| t.boxes.iter())
                .max_by(|a, b| {
                    (a.rect().area() * a.score as f64)
                        .total_cmp(&(b.rect().area() * b.score as f64))
                });
            let thumbnail_path = best.and_then(|b| {
                let out = thumbs_dir.join(format!("speaker-{id}.jpg"));
                thumbnail(src, b, sw, sh, &out)
                    .ok()
                    .map(|_| out.to_string_lossy().into_owned())
            });
            Speaker {
                id,
                label: format!("Speaker {id}"),
                thumbnail_path,
                talk_time_sec: (talk.get(ident).copied().unwrap_or(0.0) * 10.0).round() / 10.0,
            }
        })
        .collect();

    progress(100.0, "Done");
    Ok(ReframeAnalysis {
        analysis_id,
        source_path: src.to_string_lossy().into_owned(),
        source_width: sw,
        source_height: sh,
        in_point,
        out_point: out,
        sample_fps: SAMPLE_FPS,
        speakers,
        face_tracks,
        speech_segments,
        models: m.names.clone(),
    })
}

/// Speech segments (start, end) in source seconds.
fn voice_segments(
    src: &Path,
    in_point: f64,
    dur: f64,
    vad: &mut dyn VoiceDetector,
    progress: Progress,
) -> Result<Vec<(f64, f64)>, String> {
    let args: Vec<String> = [
        &format!("{in_point:.3}"),
        &format!("{dur:.3}"),
        "-vn",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-f",
        "s16le",
    ]
    .iter()
    .map(|s| s.to_string())
    .collect();
    let mut child = spawn(&args, src)?;
    let mut stdout = child.stdout.take().ok_or("FFmpeg gave us no sound.")?;
    let chunk = vad.chunk();
    let step = chunk as f64 / SR as f64;
    let total = (dur * SR as f64 / chunk as f64).max(1.0);
    let mut bytes = vec![0u8; chunk * 2];
    let mut probs = Vec::new();
    loop {
        let n = read_full(&mut stdout, &mut bytes)?;
        if n < 2 {
            break;
        }
        let samples: Vec<f32> = bytes[..n - n % 2]
            .as_chunks::<2>()
            .0
            .iter()
            .map(|b| i16::from_le_bytes([b[0], b[1]]) as f32 / 32768.0)
            .collect();
        probs.push(vad.speech_prob(&samples)?);
        if probs.len() % 200 == 0 {
            progress(probs.len() as f64 / total * 25.0, "Listening for voices…");
        }
        if n < bytes.len() {
            break;
        }
    }
    let _ = child.wait();

    // Hysteresis: start above 0.5, end after 0.3 s below 0.35.
    let mut segs: Vec<(f64, f64)> = Vec::new();
    let mut start: Option<f64> = None;
    let mut quiet = 0.0;
    for (i, p) in probs.iter().enumerate() {
        let t = in_point + i as f64 * step;
        match start {
            None if *p > 0.5 => {
                start = Some(t);
                quiet = 0.0;
            }
            Some(s) if *p < 0.35 => {
                quiet += step;
                if quiet >= 0.3 {
                    segs.push((s, t - quiet + step));
                    start = None;
                }
            }
            Some(_) => quiet = 0.0,
            None => {}
        }
    }
    if let Some(s) = start {
        segs.push((s, in_point + probs.len() as f64 * step));
    }
    segs.retain(|(s, e)| e - s >= 0.25);
    Ok(segs)
}

fn read_full(r: &mut impl Read, buf: &mut [u8]) -> Result<usize, String> {
    let mut got = 0;
    while got < buf.len() {
        match r.read(&mut buf[got..]) {
            Ok(0) => break,
            Ok(n) => got += n,
            Err(e) if e.kind() == ErrorKind::Interrupted => {}
            Err(e) => return Err(format!("We couldn't read the video ({e}).")),
        }
    }
    Ok(got)
}

#[derive(Default)]
struct TrackData {
    boxes: Vec<TrackBox>,
    /// (time, mouth motion).
    motion: Vec<(f64, f32)>,
    embeds: Vec<Vec<f32>>,
    last_embed_t: f64,
    prev_patch: Option<(usize, Vec<f32>)>,
}

impl TrackData {
    fn span(&self) -> (f64, f64) {
        (
            self.boxes.first().map_or(0.0, |b| b.t),
            self.boxes.last().map_or(0.0, |b| b.t),
        )
    }
    fn mean_box(&self) -> Rect {
        let n = self.boxes.len().max(1) as f64;
        let mut r = Rect::default();
        for b in &self.boxes {
            r.x += b.x / n;
            r.y += b.y / n;
            r.w += b.w / n;
            r.h += b.h / n;
        }
        r
    }
    fn mean_embed(&self) -> Option<Vec<f32>> {
        let first = self.embeds.first()?;
        let mut m = vec![0f32; first.len()];
        for e in &self.embeds {
            m.iter_mut().zip(e).for_each(|(a, b)| *a += b);
        }
        let n = m.iter().map(|x| x * x).sum::<f32>().sqrt().max(1e-9);
        m.iter_mut().for_each(|x| *x /= n);
        Some(m)
    }
}

/// Grey 16x10 patch around the mouth, in face-relative coords so scale doesn't matter.
fn mouth_patch(frame: &Frame, f: &Face) -> Vec<f32> {
    let (r, l) = (f.landmarks[3], f.landmarks[4]);
    let d = ((l[0] - r[0]).powi(2) + (l[1] - r[1]).powi(2))
        .sqrt()
        .max(3.0);
    let (cx, cy) = ((r[0] + l[0]) / 2.0, (r[1] + l[1]) / 2.0 + 0.1 * d);
    let (pw, ph) = (1.6 * d, 1.0 * d);
    let mut out = Vec::with_capacity(160);
    for j in 0..10 {
        for i in 0..16 {
            let x = cx - pw / 2.0 + pw * (i as f32 + 0.5) / 16.0;
            let y = cy - ph / 2.0 + ph * (j as f32 + 0.5) / 10.0;
            out.push(frame.gray(x, y) / 255.0);
        }
    }
    out
}

fn face_tracks(
    src: &Path,
    in_point: f64,
    dur: f64,
    sw: u32,
    sh: u32,
    m: &mut Models,
    progress: Progress,
) -> Result<BTreeMap<u32, TrackData>, String> {
    let fw = SAMPLE_WIDTH.min(sw) / 2 * 2;
    let fh = ((fw as f64 * sh as f64 / sw as f64 / 2.0).round() as u32 * 2).max(2);
    let args: Vec<String> = vec![
        format!("{in_point:.3}"),
        format!("{dur:.3}"),
        "-an".into(),
        "-vf".into(),
        format!("fps={SAMPLE_FPS},scale={fw}:{fh}:flags=bilinear"),
        "-f".into(),
        "rawvideo".into(),
        "-pix_fmt".into(),
        "rgb24".into(),
    ];
    let mut child = spawn(&args, src)?;
    let mut stdout = child.stdout.take().ok_or("FFmpeg gave us no picture.")?;
    let expected = (dur * SAMPLE_FPS).ceil().max(1.0);
    let mut tracker = Tracker::new(SAMPLE_FPS as u32); // survive ~1 s without a face
    let mut tracks: BTreeMap<u32, TrackData> = BTreeMap::new();
    let mut frame = Frame {
        width: fw,
        height: fh,
        rgb: vec![0u8; (fw * fh * 3) as usize],
    };
    let mut k = 0usize;
    loop {
        if read_full(&mut stdout, &mut frame.rgb)? < frame.rgb.len() {
            break;
        }
        let t = in_point + k as f64 / SAMPLE_FPS;
        let faces: Vec<Face> = m
            .detector
            .detect(&frame)?
            .into_iter()
            .filter(|f| f.w >= 12.0 && f.h >= 12.0)
            .collect();
        let rects: Vec<Rect> = faces
            .iter()
            .map(|f| Rect {
                x: (f.x / fw as f32) as f64,
                y: (f.y / fh as f32) as f64,
                w: (f.w / fw as f32) as f64,
                h: (f.h / fh as f32) as f64,
            })
            .collect();
        let ids = tracker.update(&rects);
        for ((face, rect), id) in faces.iter().zip(&rects).zip(ids) {
            let td = tracks.entry(id).or_default();
            td.boxes.push(TrackBox {
                t,
                x: rect.x,
                y: rect.y,
                w: rect.w,
                h: rect.h,
                score: face.score,
            });
            let patch = mouth_patch(&frame, face);
            if let Some((pk, prev)) = &td.prev_patch
                && *pk + 1 == k
            {
                let diff = prev
                    .iter()
                    .zip(&patch)
                    .map(|(a, b)| (a - b).abs())
                    .sum::<f32>()
                    / patch.len() as f32;
                td.motion.push((t, diff));
            }
            td.prev_patch = Some((k, patch));
            if let Some(emb) = m.embedder.as_mut()
                && td.embeds.len() < 5
                && face.w >= 36.0
                && face.score >= 0.8
                && (td.embeds.is_empty() || t - td.last_embed_t >= 1.0)
            {
                td.embeds.push(emb.embed(&frame, face)?);
                td.last_embed_t = t;
            }
        }
        k += 1;
        if k.is_multiple_of(8) {
            progress(
                25.0 + (k as f64 / expected).min(1.0) * 65.0,
                "Finding faces…",
            );
        }
    }
    let _ = child.wait();
    if k == 0 {
        return Err("We couldn't read any frames from this video.".into());
    }
    Ok(tracks)
}

/// Track id -> identity id (a representative track id). Merges tracks that never
/// overlap in time and either look alike (SFace) or sit in the same place.
fn identities(tracks: &BTreeMap<u32, TrackData>) -> BTreeMap<u32, u32> {
    let ids: Vec<u32> = tracks.keys().copied().collect();
    let embeds: Vec<Option<Vec<f32>>> = ids.iter().map(|i| tracks[i].mean_embed()).collect();
    let mut pairs: Vec<(f64, usize, usize)> = Vec::new();
    for a in 0..ids.len() {
        for b in a + 1..ids.len() {
            let sim = match (&embeds[a], &embeds[b]) {
                (Some(x), Some(y)) => {
                    let cos: f32 = x.iter().zip(y).map(|(p, q)| p * q).sum();
                    (cos > 0.4).then_some(1.0 + cos as f64)
                }
                _ => {
                    let iou = tracks[&ids[a]].mean_box().iou(&tracks[&ids[b]].mean_box());
                    (iou > 0.3).then_some(iou)
                }
            };
            if let Some(s) = sim {
                pairs.push((s, a, b));
            }
        }
    }
    pairs.sort_by(|x, y| y.0.total_cmp(&x.0));

    let mut group: Vec<usize> = (0..ids.len()).collect();
    let overlaps = |a: usize, b: usize| {
        let (s1, e1) = tracks[&ids[a]].span();
        let (s2, e2) = tracks[&ids[b]].span();
        e1.min(e2) - s1.max(s2) > 0.5
    };
    for (_, a, b) in pairs {
        let (ga, gb) = (group[a], group[b]);
        if ga == gb {
            continue;
        }
        let members =
            |g: usize| -> Vec<usize> { (0..ids.len()).filter(|i| group[*i] == g).collect() };
        let (ma, mb) = (members(ga), members(gb));
        let clash = ma.iter().any(|i| mb.iter().any(|j| overlaps(*i, *j)));
        if !clash {
            for g in group.iter_mut() {
                if *g == gb {
                    *g = ga;
                }
            }
        }
    }
    ids.iter()
        .enumerate()
        .map(|(i, id)| (*id, ids[group[i]]))
        .collect()
}

/// Splits speech into ~1 s windows and picks the face whose mouth moves most.
fn attribute(
    speech: &[(f64, f64)],
    tracks: &BTreeMap<u32, TrackData>,
    identity: &BTreeMap<u32, u32>,
) -> Vec<(f64, f64, Option<u32>)> {
    let baseline: BTreeMap<u32, f32> = tracks
        .iter()
        .map(|(id, t)| {
            let mut v: Vec<f32> = t.motion.iter().map(|m| m.1).collect();
            v.sort_by(|a, b| a.total_cmp(b));
            (*id, v.get(v.len() / 2).copied().unwrap_or(0.0))
        })
        .collect();
    let mut out = Vec::new();
    for &(s, e) in speech {
        let n = ((e - s) / 1.0).ceil().max(1.0) as usize;
        let len = (e - s) / n as f64;
        for i in 0..n {
            let (ws, we) = (s + i as f64 * len, s + (i + 1) as f64 * len);
            let best = tracks
                .iter()
                .filter_map(|(id, t)| {
                    let inside: Vec<f32> = t
                        .motion
                        .iter()
                        .filter(|(mt, _)| *mt >= ws && *mt < we)
                        .map(|m| m.1)
                        .collect();
                    (inside.len() >= 2).then(|| {
                        let mean = inside.iter().sum::<f32>() / inside.len() as f32;
                        (*id, mean - baseline[id])
                    })
                })
                .max_by(|a, b| a.1.total_cmp(&b.1))
                .map(|(id, _)| identity[&id]);
            out.push((ws, we, best));
        }
    }
    out
}

fn thumbnail(src: &Path, b: &TrackBox, sw: u32, sh: u32, out: &PathBuf) -> Result<(), String> {
    let side = (b.w * sw as f64).max(b.h * sh as f64) * 1.8;
    let side = side.min(sw.min(sh) as f64).max(16.0) as u32 / 2 * 2;
    let cx = ((b.x + b.w / 2.0) * sw as f64 - side as f64 / 2.0).clamp(0.0, (sw - side) as f64);
    let cy = ((b.y + b.h / 2.0) * sh as f64 - side as f64 / 2.0).clamp(0.0, (sh - side) as f64);
    let status = tools::command(Tool::Ffmpeg)
        .args(["-hide_banner", "-loglevel", "error", "-y", "-ss"])
        .arg(format!("{:.3}", b.t))
        .arg("-i")
        .arg(src)
        .args(["-frames:v", "1", "-an", "-vf"])
        .arg(format!(
            "crop={side}:{side}:{}:{},scale=160:160",
            cx as u32, cy as u32
        ))
        .args(["-q:v", "4"])
        .arg(out)
        .status()
        .map_err(|e| format!("We couldn't save a speaker picture ({e})."))?;
    if status.success() {
        Ok(())
    } else {
        Err("We couldn't save a speaker picture.".into())
    }
}
