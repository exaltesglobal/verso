//! Simple multi-face tracker: constant-velocity prediction + greedy IoU matching.
//!
//! shortcut: no Kalman covariance, just an alpha-beta velocity estimate; good
//! enough for talking heads, upgrade if fast-moving subjects matter.

use super::Rect;

struct Live {
    id: u32,
    rect: Rect,
    vx: f64,
    vy: f64,
    misses: u32,
}

pub struct Tracker {
    live: Vec<Live>,
    next_id: u32,
    /// Frames a track survives without a matching detection.
    max_misses: u32,
    min_iou: f64,
}

impl Tracker {
    pub fn new(max_misses: u32) -> Self {
        Self {
            live: Vec::new(),
            next_id: 1,
            max_misses,
            min_iou: 0.25,
        }
    }

    /// Feed one frame's detections (normalised rects). Returns the track id for
    /// each detection, in the same order.
    pub fn update(&mut self, dets: &[Rect]) -> Vec<u32> {
        // Predict.
        let predicted: Vec<Rect> = self
            .live
            .iter()
            .map(|t| Rect {
                x: t.rect.x + t.vx,
                y: t.rect.y + t.vy,
                ..t.rect
            })
            .collect();

        // All candidate pairs, best IoU first.
        let mut pairs = Vec::new();
        for (ti, p) in predicted.iter().enumerate() {
            for (di, d) in dets.iter().enumerate() {
                let iou = p.iou(d);
                if iou >= self.min_iou {
                    pairs.push((iou, ti, di));
                }
            }
        }
        pairs.sort_by(|a, b| b.0.total_cmp(&a.0));

        let mut track_used = vec![false; self.live.len()];
        let mut ids = vec![0u32; dets.len()];
        for (_, ti, di) in pairs {
            if track_used[ti] || ids[di] != 0 {
                continue;
            }
            track_used[ti] = true;
            let t = &mut self.live[ti];
            let d = dets[di];
            const BETA: f64 = 0.3;
            t.vx = (1.0 - BETA) * t.vx + BETA * (d.x - t.rect.x);
            t.vy = (1.0 - BETA) * t.vy + BETA * (d.y - t.rect.y);
            t.rect = d;
            t.misses = 0;
            ids[di] = t.id;
        }

        for (i, used) in track_used.iter().enumerate() {
            if !used {
                self.live[i].misses += 1;
            }
        }
        let max = self.max_misses;
        self.live.retain(|t| t.misses <= max);

        for (di, id) in ids.iter_mut().enumerate() {
            if *id == 0 {
                *id = self.next_id;
                self.next_id += 1;
                self.live.push(Live {
                    id: *id,
                    rect: dets[di],
                    vx: 0.0,
                    vy: 0.0,
                    misses: 0,
                });
            }
        }
        ids
    }
}
