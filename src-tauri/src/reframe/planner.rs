//! Turns a [`ReframeAnalysis`] into a [`CropPath`]: which part of the source to
//! show at each moment, at the target aspect, smoothed so it never jitters.

use serde::{Deserialize, Serialize};

use super::{Rect, ReframeAnalysis};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Mode {
    /// Keep it centred (fallback).
    Centre,
    /// Largest / most central face.
    FollowSubject,
    /// One chosen speaker (`options.speakerId`).
    FollowSpeaker,
    /// Whoever is talking, with minimum hold and hysteresis.
    ActiveSpeaker,
    /// Two speakers stacked (portrait/square) or side by side (landscape).
    SplitTwo,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum Transition {
    #[default]
    Cut,
    Pan,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct PlanOptions {
    /// 1 = largest crop that fits; 2 = twice as tight.
    pub zoom: f64,
    /// Spring smoothing time in seconds (higher = lazier camera).
    pub smoothing_sec: f64,
    /// Ignore subject moves smaller than this fraction of the crop width.
    pub dead_zone: f64,
    /// Stay on a speaker at least this long before switching.
    pub min_hold_sec: f64,
    /// A new speaker must be talking this long before we switch (hysteresis).
    pub switch_delay_sec: f64,
    pub transition: Transition,
    pub speaker_id: Option<u32>,
    /// For `split_two`: [top/left, bottom/right]. Defaults to the two most talkative.
    pub speaker_ids: Option<Vec<u32>>,
}

impl Default for PlanOptions {
    fn default() -> Self {
        Self {
            zoom: 1.0,
            smoothing_sec: 0.35,
            dead_zone: 0.06,
            min_hold_sec: 1.6,
            switch_delay_sec: 0.4,
            transition: Transition::Cut,
            speaker_id: None,
            speaker_ids: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Keyframe {
    pub t: f64,
    pub rects: Vec<Rect>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CropPath {
    /// The mode actually used (split_two falls back when fewer than 2 speakers).
    pub mode: Mode,
    pub aspect: String,
    /// `single`, `stacked` (top/bottom) or `side_by_side`.
    pub layout: String,
    /// Linear interpolation between keyframes; a cut is two keyframes 1 ms apart.
    pub keyframes: Vec<Keyframe>,
}

pub fn parse_aspect(aspect: &str) -> Result<f64, String> {
    let (a, b) = aspect
        .split_once(':')
        .ok_or_else(|| format!("We don't know the shape \"{aspect}\"."))?;
    let (a, b): (f64, f64) = (
        a.trim().parse().map_err(|_| "Bad shape.".to_string())?,
        b.trim().parse().map_err(|_| "Bad shape.".to_string())?,
    );
    if a <= 0.0 || b <= 0.0 {
        return Err("Bad shape.".into());
    }
    Ok(a / b)
}

/// Normalised crop size for `target` aspect (w/h) inside a `source` aspect frame.
pub fn crop_size(source: f64, target: f64, zoom: f64) -> (f64, f64) {
    let zoom = zoom.max(1.0);
    let (w, h) = if target < source {
        (target / source, 1.0)
    } else {
        (1.0, source / target)
    };
    (w / zoom, h / zoom)
}

/// Crop of size (w,h) centred on (cx,cy), clamped inside the frame.
pub fn place(cx: f64, cy: f64, w: f64, h: f64) -> Rect {
    Rect {
        x: (cx - w / 2.0).clamp(0.0, (1.0 - w).max(0.0)),
        y: (cy - h / 2.0).clamp(0.0, (1.0 - h).max(0.0)),
        w,
        h,
    }
}

/// Critically damped spring (one axis).
#[derive(Debug, Clone, Copy)]
pub struct Spring {
    pub pos: f64,
    vel: f64,
}

impl Spring {
    pub fn new(pos: f64) -> Self {
        Self { pos, vel: 0.0 }
    }
    pub fn reset(&mut self, pos: f64) {
        self.pos = pos;
        self.vel = 0.0;
    }
    pub fn step(&mut self, target: f64, smooth: f64, dt: f64) -> f64 {
        let omega = 2.0 / smooth.max(1e-3);
        let x = omega * dt;
        let decay = 1.0 / (1.0 + x + 0.48 * x * x + 0.235 * x * x * x);
        let change = self.pos - target;
        let temp = (self.vel + omega * change) * dt;
        self.vel = (self.vel - omega * temp) * decay;
        self.pos = target + (change + temp) * decay;
        self.pos
    }
}

/// Smoothed camera for one panel: dead zone, then a spring per axis.
struct Camera {
    goal: (f64, f64),
    sx: Spring,
    sy: Spring,
}

impl Camera {
    fn new(cx: f64, cy: f64) -> Self {
        Self {
            goal: (cx, cy),
            sx: Spring::new(cx),
            sy: Spring::new(cy),
        }
    }
    fn cut(&mut self, cx: f64, cy: f64) {
        self.goal = (cx, cy);
        self.sx.reset(cx);
        self.sy.reset(cy);
    }
    fn step(&mut self, want: (f64, f64), dead: (f64, f64), smooth: f64, dt: f64) -> (f64, f64) {
        if (want.0 - self.goal.0).abs() > dead.0 {
            self.goal.0 = want.0;
        }
        if (want.1 - self.goal.1).abs() > dead.1 {
            self.goal.1 = want.1;
        }
        (
            self.sx.step(self.goal.0, smooth, dt),
            self.sy.step(self.goal.1, smooth, dt),
        )
    }
}

/// Holds on a subject for a minimum time and only switches once the new
/// candidate has been wanted continuously for `delay` seconds.
pub struct Switcher {
    pub current: Option<u32>,
    since: f64,
    pending: Option<(u32, f64)>,
    min_hold: f64,
    delay: f64,
}

impl Switcher {
    pub fn new(min_hold: f64, delay: f64) -> Self {
        Self {
            current: None,
            since: f64::NEG_INFINITY,
            pending: None,
            min_hold,
            delay,
        }
    }

    /// Returns true when the subject changed at this step.
    pub fn update(&mut self, t: f64, want: Option<u32>) -> bool {
        let Some(want) = want.filter(|w| Some(*w) != self.current) else {
            self.pending = None;
            return false;
        };
        if self.current.is_none() {
            self.current = Some(want);
            self.since = t;
            self.pending = None;
            return true;
        }
        let started = match self.pending {
            Some((id, at)) if id == want => at,
            _ => {
                self.pending = Some((want, t));
                t
            }
        };
        if t - started >= self.delay && t - self.since >= self.min_hold {
            self.current = Some(want);
            self.since = t;
            self.pending = None;
            return true;
        }
        false
    }
}

/// Per-speaker boxes sorted by time, for nearest-in-time lookup.
struct Faces {
    by_speaker: Vec<(u32, Vec<(f64, Rect)>)>,
    tolerance: f64,
}

impl Faces {
    fn new(a: &ReframeAnalysis) -> Self {
        let mut by_speaker: Vec<(u32, Vec<(f64, Rect)>)> = Vec::new();
        for tr in &a.face_tracks {
            let entry = match by_speaker
                .iter_mut()
                .position(|(id, _)| *id == tr.speaker_id)
            {
                Some(i) => &mut by_speaker[i].1,
                None => {
                    by_speaker.push((tr.speaker_id, Vec::new()));
                    &mut by_speaker.last_mut().unwrap().1
                }
            };
            entry.extend(tr.boxes.iter().map(|b| (b.t, b.rect())));
        }
        for (_, v) in &mut by_speaker {
            v.sort_by(|a, b| a.0.total_cmp(&b.0));
        }
        Self {
            by_speaker,
            tolerance: 1.5 / a.sample_fps.max(1.0),
        }
    }

    fn at(&self, speaker: u32, t: f64) -> Option<Rect> {
        let v = &self.by_speaker.iter().find(|(id, _)| *id == speaker)?.1;
        let i = v.partition_point(|(bt, _)| *bt < t);
        [i.checked_sub(1), Some(i)]
            .into_iter()
            .flatten()
            .filter_map(|j| v.get(j))
            .filter(|(bt, _)| (bt - t).abs() <= self.tolerance)
            .min_by(|a, b| (a.0 - t).abs().total_cmp(&(b.0 - t).abs()))
            .map(|(_, r)| *r)
    }

    fn visible(&self, t: f64) -> Vec<(u32, Rect)> {
        self.by_speaker
            .iter()
            .filter_map(|(id, _)| self.at(*id, t).map(|r| (*id, r)))
            .collect()
    }

    fn first(&self, speaker: u32) -> Option<Rect> {
        self.by_speaker
            .iter()
            .find(|(id, _)| *id == speaker)
            .and_then(|(_, v)| v.first().map(|(_, r)| *r))
    }
}

fn talking_at(a: &ReframeAnalysis, t: f64) -> Option<u32> {
    let segs = &a.speech_segments;
    let i = segs.partition_point(|s| s.end < t);
    segs.get(i)
        .filter(|s| s.start <= t && t <= s.end)
        .and_then(|s| s.speaker_id)
}

/// Where the crop centre should go to frame a face: a little headroom above.
fn aim(face: &Rect, crop_h: f64) -> (f64, f64) {
    (face.cx(), face.cy() + crop_h * 0.12)
}

/// Keeps keyframes only where the path changes; always keeps cut pairs.
struct Emitter {
    out: Vec<Keyframe>,
}

impl Emitter {
    fn push(&mut self, t: f64, rects: Vec<Rect>, force: bool) {
        if let Some(prev) = self.out.last() {
            let moved = prev.rects.iter().zip(&rects).any(|(a, b)| {
                (a.x - b.x).abs() > 0.002 || (a.y - b.y).abs() > 0.002 || (a.w - b.w).abs() > 0.002
            });
            if !moved && !force {
                return;
            }
        }
        self.out.push(Keyframe { t, rects });
    }
    fn finish(mut self, end: f64) -> Vec<Keyframe> {
        if let Some(last) = self.out.last().cloned()
            && last.t < end
        {
            self.out.push(Keyframe {
                t: end,
                rects: last.rects,
            });
        }
        self.out
    }
}

pub fn plan(
    a: &ReframeAnalysis,
    aspect: &str,
    mode: Mode,
    o: &PlanOptions,
) -> Result<CropPath, String> {
    let target = parse_aspect(aspect)?;
    let source = a.source_width.max(1) as f64 / a.source_height.max(1) as f64;
    let faces = Faces::new(a);
    let dt = 1.0 / a.sample_fps.max(1.0);
    let (t0, t1) = (a.in_point, a.out_point.max(a.in_point));
    let steps = ((t1 - t0) / dt).ceil().max(1.0) as usize;

    // Speakers ranked by talk time (already sorted that way by analysis).
    let ranked: Vec<u32> = a.speakers.iter().map(|s| s.id).collect();

    let mut mode = mode;
    let pair: Vec<u32> = match &o.speaker_ids {
        Some(ids) if ids.len() >= 2 => ids[..2].to_vec(),
        _ => ranked.iter().copied().take(2).collect(),
    };
    if mode == Mode::SplitTwo && pair.len() < 2 {
        mode = Mode::FollowSubject;
    }
    if mode == Mode::FollowSpeaker && o.speaker_id.is_none() {
        mode = Mode::ActiveSpeaker;
    }

    let mut em = Emitter { out: Vec::new() };

    if mode == Mode::Centre {
        let (w, h) = crop_size(source, target, o.zoom);
        let r = place(0.5, 0.5, w, h);
        em.push(t0, vec![r], true);
        return Ok(CropPath {
            mode,
            aspect: aspect.into(),
            layout: "single".into(),
            keyframes: em.finish(t1),
        });
    }

    if mode == Mode::SplitTwo {
        let stacked = target <= 1.0;
        let panel = if stacked { target * 2.0 } else { target / 2.0 };
        let (pw, _) = crop_size(source, panel, 1.0);
        // Panels at most half the frame wide so the two people don't overlap.
        let zoom = o.zoom.max(pw / 0.5);
        let (w, h) = crop_size(source, panel, zoom);
        let dead = (o.dead_zone * w, o.dead_zone * h);
        let mut cams: Vec<Camera> = pair
            .iter()
            .enumerate()
            .map(|(i, id)| {
                let start = faces.first(*id).map(|f| aim(&f, h));
                let (cx, cy) = start.unwrap_or((0.25 + 0.5 * i as f64, 0.5));
                Camera::new(cx, cy)
            })
            .collect();
        for k in 0..=steps {
            let t = (t0 + k as f64 * dt).min(t1);
            let rects = pair
                .iter()
                .zip(cams.iter_mut())
                .map(|(id, cam)| {
                    let want = faces.at(*id, t).map(|f| aim(&f, h)).unwrap_or(cam.goal);
                    let (cx, cy) = cam.step(want, dead, o.smoothing_sec, dt);
                    place(cx, cy, w, h)
                })
                .collect();
            em.push(t, rects, k == 0);
        }
        return Ok(CropPath {
            mode,
            aspect: aspect.into(),
            layout: if stacked { "stacked" } else { "side_by_side" }.into(),
            keyframes: em.finish(t1),
        });
    }

    let (w, h) = crop_size(source, target, o.zoom);
    let dead = (o.dead_zone * w, o.dead_zone * h);
    let (hold, delay) = match mode {
        Mode::ActiveSpeaker => (o.min_hold_sec, o.switch_delay_sec),
        // Subject following is stickier: only switch for a clearly better subject.
        _ => (o.min_hold_sec * 2.0, o.switch_delay_sec * 2.0),
    };
    let mut sw = Switcher::new(hold, delay);
    let mut cam: Option<Camera> = None;

    for k in 0..=steps {
        let t = (t0 + k as f64 * dt).min(t1);
        let visible = faces.visible(t);
        let want = match mode {
            Mode::FollowSpeaker => o.speaker_id.filter(|id| visible.iter().any(|v| v.0 == *id)),
            Mode::ActiveSpeaker => talking_at(a, t)
                .filter(|id| visible.iter().any(|v| v.0 == *id))
                // Nobody (visible) talking yet: start on the biggest face.
                .or_else(|| {
                    sw.current
                        .is_none()
                        .then(|| best_subject(&visible))
                        .flatten()
                }),
            _ => best_subject(&visible),
        };
        let switched = sw.update(t, want);
        let target_face = sw.current.and_then(|id| faces.at(id, t));

        let c = cam.get_or_insert_with(|| {
            let (cx, cy) = target_face.map(|f| aim(&f, h)).unwrap_or((0.5, 0.5));
            Camera::new(cx, cy)
        });
        let aim_at = target_face.map(|f| aim(&f, h)).unwrap_or(c.goal);
        let is_cut = switched && k > 0 && o.transition == Transition::Cut;
        if is_cut {
            let before = place(c.sx.pos, c.sy.pos, w, h);
            em.push((t - 0.001).max(t0), vec![before], true);
            c.cut(aim_at.0, aim_at.1);
        }
        let (cx, cy) = c.step(aim_at, dead, o.smoothing_sec, dt);
        em.push(t, vec![place(cx, cy, w, h)], k == 0 || is_cut);
    }

    Ok(CropPath {
        mode,
        aspect: aspect.into(),
        layout: "single".into(),
        keyframes: em.finish(t1),
    })
}

/// Biggest face, discounted by distance from the frame centre.
fn best_subject(visible: &[(u32, Rect)]) -> Option<u32> {
    visible
        .iter()
        .map(|(id, r)| {
            let off = ((r.cx() - 0.5).powi(2) + (r.cy() - 0.5).powi(2)).sqrt();
            (*id, r.area() * (1.0 - off).max(0.1))
        })
        .max_by(|a, b| a.1.total_cmp(&b.1))
        .map(|(id, _)| id)
}
