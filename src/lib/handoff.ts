// "Hand off to a pro editor": turns a Verso project into files Premiere Pro,
// DaVinci Resolve and Final Cut can open (FCP7 XML / xmeml v5, FCPXML 1.11,
// SRT). Pure string building with type-only imports, so the Node self-check
// (scripts/handoff-selfcheck.ts) can run it without Tauri. See docs/HANDOFF.md.
import type { AspectRatio, Clip, Project } from "./project";
import type { Rect } from "./reframe";

export type HandoffTarget = "premiere" | "resolve";

const CANVAS: Record<AspectRatio, [number, number]> = {
  "9:16": [1080, 1920],
  "1:1": [1080, 1080],
  "4:5": [1080, 1350],
  "16:9": [1920, 1080],
};

/** A frame rate as XML wants it: one frame lasts num/den seconds. */
export interface Rate {
  timebase: number;
  ntsc: boolean;
  num: number;
  den: number;
}

export function rateFor(fps: number | null | undefined): Rate {
  const f = fps && Number.isFinite(fps) && fps > 0 ? fps : 30;
  for (const tb of [24, 30, 48, 60]) {
    if (Math.abs(f - (tb * 1000) / 1001) < 0.02)
      return { timebase: tb, ntsc: true, num: 1001, den: tb * 1000 };
  }
  const tb = Math.min(120, Math.max(1, Math.round(f)));
  return { timebase: tb, ntsc: false, num: 100, den: tb * 100 };
}

/** Seconds to whole frames. */
export const toFrames = (sec: number, r: Rate) => Math.round((sec * r.den) / r.num);
/** Whole frames to an FCPXML time ("1001/30000s"). */
const ft = (frames: number, r: Rate) => (frames === 0 ? "0s" : `${frames * r.num}/${r.den}s`);

export const xmlEscape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/** Absolute path to a percent-encoded file URL: C:\a b\x&y.mp4 -> file:///C:/a%20b/x%26y.mp4 */
export function fileUrl(path: string): string {
  const p = path.replace(/\\/g, "/");
  const enc = (s: string) =>
    s
      .split("/")
      .map((seg) => (/^[A-Za-z]:$/.test(seg) ? seg : encodeURIComponent(seg)))
      .join("/");
  if (p.startsWith("//")) return `file:${enc(p)}`; // UNC share: file://server/share/...
  return `file://${enc(/^[A-Za-z]:/.test(p) ? `/${p}` : p)}`;
}

const baseName = (path: string) => path.replace(/\\/g, "/").split("/").pop() ?? path;

interface Lanes {
  video: Clip[];
  sound: Clip[];
  music: Clip[];
  text: Clip[];
  captions: Clip[];
}

/** The clips each format can carry (same filters as buildExportRequest). */
function lanes(project: Project): Lanes {
  const of = (kind: string) =>
    project.tracks
      .filter((t) => t.kind === kind)
      .flatMap((t) => t.clips.filter((c) => c.end > c.start))
      .sort((a, b) => a.start - b.start);
  return {
    video: of("video").filter((c) => c.source?.hasVideo && !c.still && !c.variant),
    sound: of("audio").filter((c) => c.source?.hasAudio),
    music: of("music").filter((c) => c.source?.hasAudio),
    text: of("text").filter((c) => !c.sticker && (c.text ?? c.label).trim()),
    captions: of("captions").filter((c) => (c.text ?? c.label).trim()),
  };
}

/** Sound source: the cleaned copy while the clip sits inside its range (same rule as enhance.ts soundSource). */
function soundFile(c: Clip): { path: string; inPoint: number; durationSec: number } {
  const inPoint = c.inPoint ?? 0;
  const o = c.audioOverride;
  const offset = o?.offset ?? 0;
  if (o && inPoint >= offset - 1e-3 && (o.until == null || inPoint <= o.until + 1e-3))
    return {
      path: o.path,
      inPoint: inPoint - offset,
      durationSec: (o.until ?? c.source!.durationSec) - offset,
    };
  return { path: c.source!.path, inPoint, durationSec: c.source!.durationSec };
}

const speedOf = (c: Clip, video: Clip[]) =>
  c.speed ?? (c.linkId ? video.find((v) => v.linkId === c.linkId)?.speed : undefined) ?? 1;

/** One framing key: `t` source seconds, scale vs native pixels, dx/dy canvas pixels of the source centre from the canvas centre (y down). */
export interface FrameKey {
  t: number;
  scale: number;
  dx: number;
  dy: number;
}

/**
 * Where the export (src-tauri/src/export/mod.rs) puts the picture: crop rect (or
 * whole frame), cover-fit to the canvas, then zoom/pan. Reframed clips ignore
 * zoom, like the export does. Split layouts use the first panel only.
 */
export function framing(c: Clip, W: number, H: number): FrameKey[] {
  const sw = c.source?.width || W;
  const sh = c.source?.height || H;
  const key = (t: number, r: Rect, z: number, fx: number, fy: number): FrameKey => {
    const s = Math.max(W / (r.w * sw), H / (r.h * sh));
    const cx = (r.x + r.w / 2) * sw + ((1 - 1 / z) * (fx - 0.5) * W) / s;
    const cy = (r.y + r.h / 2) * sh + ((1 - 1 / z) * (fy - 0.5) * H) / s;
    const S = s * z;
    return { t, scale: S, dx: (sw / 2 - cx) * S, dy: (sh / 2 - cy) * S };
  };
  const keys = (c.cropPath?.keyframes ?? []).filter((k) => k.rects.length);
  if (keys.length) {
    const first = keys[0].rects[0];
    const w = Math.min(1, Math.max(0.02, first.w));
    const h = Math.min(1, Math.max(0.02, first.h));
    const inP = c.inPoint ?? 0;
    const span = (c.end - c.start) * (c.speed ?? 1);
    // Keep one key either side of the clip's source window so edges interpolate.
    let lo = 0;
    keys.forEach((k, i) => k.t <= inP && (lo = i));
    let hi = keys.findIndex((k) => k.t >= inP + span);
    if (hi < 0) hi = keys.length - 1;
    let win = keys.slice(lo, Math.max(lo, hi) + 1);
    // shortcut: uniform thinning to 120 keys can soften fast pans; only very long reframed clips hit it.
    if (win.length > 120) {
      const step = Math.ceil(win.length / 120);
      win = [...win.filter((_, i) => i % step === 0), win[win.length - 1]];
    }
    const out = win.map((k) => {
      const r = k.rects[0];
      return key(
        k.t,
        { x: Math.min(Math.max(0, r.x), 1 - w), y: Math.min(Math.max(0, r.y), 1 - h), w, h },
        1,
        0.5,
        0.5,
      );
    });
    // Drop repeats so a static reframe becomes a single value.
    return out.filter(
      (k, i) => i === 0 || Math.abs(k.dx - out[i - 1].dx) > 0.5 || Math.abs(k.dy - out[i - 1].dy) > 0.5,
    );
  }
  const z = Math.min(5, Math.max(1, c.zoom ?? 1));
  const fx = 0.5 + Math.min(1, Math.max(-1, c.pos?.x ?? 0)) / 2;
  const fy = 0.5 + Math.min(1, Math.max(-1, c.pos?.y ?? 0)) / 2;
  return [key(c.inPoint ?? 0, { x: 0, y: 0, w: 1, h: 1 }, z, fx, fy)];
}

const num = (v: number, d = 4) => String(Number(v.toFixed(d)));

/** Sequence frame rate: the first video's probed rate (probe_media), else 30. */
function sequenceRate(l: Lanes): Rate {
  return rateFor(l.video[0]?.source?.fps ?? l.sound[0]?.source?.fps);
}

// ---------------------------------------------------------------- FCPXML 1.11

export function toFcpxml(project: Project): string {
  const l = lanes(project);
  const [W, H] = CANVAS[project.aspect] ?? CANVAS["9:16"];
  const r = sequenceRate(l);
  const fr = (s: number) => toFrames(s, r);
  const total = Math.max(1, ...[...l.video, ...l.sound, ...l.music, ...l.text].map((c) => fr(c.end)));

  const formats: string[] = [
    `<format id="r1" frameDuration="${ft(1, r)}" width="${W}" height="${H}" colorSpace="1-1-1 (Rec. 709)"/>`,
  ];
  const formatIds = new Map<string, string>();
  const assets = new Map<string, { id: string; xml: string }>();
  const assetFor = (path: string, c: Clip, durationSec: number) => {
    const src = c.source!;
    const hit = assets.get(path);
    if (hit) return hit.id;
    const id = `a${assets.size + 1}`;
    let fmt = "";
    if (src.hasVideo && path === src.path) {
      const fk = `${src.width}x${src.height}@${src.fps}`;
      if (!formatIds.has(fk)) {
        const fid = `r${formats.length + 1}`;
        const ar = rateFor(src.fps);
        formats.push(
          `<format id="${fid}" frameDuration="${ft(1, ar)}" width="${src.width ?? W}" height="${src.height ?? H}"/>`,
        );
        formatIds.set(fk, fid);
      }
      fmt = ` hasVideo="1" format="${formatIds.get(fk)}" videoSources="1"`;
    }
    const audio = src.hasAudio ? ` hasAudio="1" audioSources="1" audioChannels="2" audioRate="48000"` : "";
    assets.set(path, {
      id,
      xml: `<asset id="${id}" name="${xmlEscape(baseName(path))}" uid="${xmlEscape(fileUrl(path))}" start="0s" duration="${ft(fr(durationSec), r)}"${fmt}${audio}><media-rep kind="original-media" src="${xmlEscape(fileUrl(path))}"/></asset>`,
    });
    return id;
  };

  /** asset-clip with speed (timeMap), framing and level. Local time = source seconds / speed. */
  const assetClip = (
    c: Clip,
    lane: number,
    file: { path: string; inPoint: number; durationSec: number },
    speed: number,
    inner: string,
    srcEnable: "video" | "audio",
  ) => {
    const ref = assetFor(file.path, c, file.durationSec);
    const off = fr(c.start);
    const dur = Math.max(1, fr(c.end) - off);
    let timeMap = "";
    if (Math.abs(speed - 1) > 1e-3) {
      const L = fr(file.durationSec / speed);
      timeMap = `<timeMap><timept time="0s" value="0s" interp="linear"/><timept time="${ft(L, r)}" value="${Math.round(L * r.num * speed * 1000)}/${r.den * 1000}s" interp="linear"/></timeMap>`;
    }
    return `<asset-clip ref="${ref}" lane="${lane}" offset="${ft(off, r)}" start="${ft(fr(file.inPoint / speed), r)}" duration="${ft(dur, r)}" name="${xmlEscape(c.label)}" srcEnable="${srcEnable}">${timeMap}${inner}</asset-clip>`;
  };

  const items: string[] = [];
  for (const c of l.video) {
    const speed = c.speed ?? 1;
    const keys = framing(c, W, H);
    const pos = (k: FrameKey) => `${num((k.dx / H) * 100)} ${num((-k.dy / H) * 100)}`;
    const sc = (k: FrameKey) => `${num(k.scale)} ${num(k.scale)}`;
    let transform = `<adjust-transform position="${pos(keys[0])}" scale="${sc(keys[0])}"`;
    if (keys.length > 1) {
      const anim = (f: (k: FrameKey) => string) =>
        `<keyframeAnimation>${keys.map((k) => `<keyframe time="${ft(fr(k.t / speed), r)}" value="${f(k)}"/>`).join("")}</keyframeAnimation>`;
      transform += `><param name="position">${anim(pos)}</param><param name="scale">${anim(sc)}</param></adjust-transform>`;
    } else transform += "/>";
    const blend = (c.opacity ?? 1) < 0.999 ? `<adjust-blend amount="${num(c.opacity ?? 1)}"/>` : "";
    items.push(
      assetClip(
        c,
        1,
        { path: c.source!.path, inPoint: c.inPoint ?? 0, durationSec: c.source!.durationSec },
        speed,
        `<adjust-conform type="none"/>${transform}${blend}`,
        "video",
      ),
    );
  }
  const audioLane = (clips: Clip[], lane: number) => {
    for (const c of clips) {
      const v = c.volume ?? 1;
      const vol =
        Math.abs(v - 1) > 1e-3
          ? `<adjust-volume amount="${v <= 0.001 ? "-96" : num(20 * Math.log10(v), 2)}dB"/>`
          : "";
      items.push(assetClip(c, lane, soundFile(c), speedOf(c, l.video), vol, "audio"));
    }
  };
  audioLane(l.sound, -1);
  audioLane(l.music, -2);

  const titleEffect = l.text.length
    ? `<effect id="e1" name="Basic Title" uid=".../Titles.localized/Bumper:Opener.localized/Basic Title.localized/Basic Title.moti"/>`
    : "";
  l.text.forEach((c, i) => {
    const s = c.style;
    const rgb = /^#([0-9a-f]{6})/i.exec(s?.color ?? "")?.[1] ?? "F5F4F0";
    const col = [0, 2, 4].map((j) => num(parseInt(rgb.slice(j, j + 2), 16) / 255, 3)).join(" ");
    const off = fr(c.start);
    items.push(
      `<title ref="e1" lane="2" offset="${ft(off, r)}" start="0s" duration="${ft(Math.max(1, fr(c.end) - off), r)}" name="${xmlEscape(c.label)}">` +
        `<adjust-transform position="0 ${num((0.5 - (s?.y ?? 0.7)) * 100)}"/>` +
        `<text><text-style ref="ts${i + 1}">${xmlEscape(c.text ?? c.label)}</text-style></text>` +
        `<text-style-def id="ts${i + 1}"><text-style font="Helvetica" fontSize="${Math.round((s?.size ?? 0.045) * H)}" fontColor="${col} 1" bold="1" alignment="${s?.align ?? "center"}"/></text-style-def>` +
        `</title>`,
    );
  });

  const name = xmlEscape(project.name || "Verso reel");
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<!DOCTYPE fcpxml>`,
    `<fcpxml version="1.11">`,
    `<resources>`,
    ...formats,
    ...[...assets.values()].map((a) => a.xml),
    titleEffect,
    `</resources>`,
    `<library>`,
    `<event name="Verso">`,
    `<project name="${name}">`,
    `<sequence format="r1" duration="${ft(total, r)}" tcStart="0s" tcFormat="NDF" audioLayout="stereo" audioRate="48k">`,
    `<spine>`,
    // Everything rides on one gap so each lane keeps Verso's timeline times exactly.
    `<gap name="Verso" offset="0s" start="0s" duration="${ft(total, r)}">`,
    ...items,
    `</gap>`,
    `</spine>`,
    `</sequence>`,
    `</project>`,
    `</event>`,
    `</library>`,
    `</fcpxml>`,
    "",
  ]
    .filter(Boolean)
    .join("\n");
}

// ---------------------------------------------------------- Premiere xmeml v5

export function toXmeml(project: Project): string {
  const l = lanes(project);
  const [W, H] = CANVAS[project.aspect] ?? CANVAS["9:16"];
  const r = sequenceRate(l);
  const fr = (s: number) => toFrames(s, r);
  const rate = (x: Rate = r) =>
    `<rate><timebase>${x.timebase}</timebase><ntsc>${x.ntsc ? "TRUE" : "FALSE"}</ntsc></rate>`;
  const total = Math.max(1, ...[...l.video, ...l.sound, ...l.music].map((c) => fr(c.end)));

  const files = new Map<string, string>();
  const fileXml = (path: string, c: Clip, durationSec: number) => {
    const known = files.get(path);
    if (known) return `<file id="${known}"/>`;
    const id = `file-${files.size + 1}`;
    files.set(path, id);
    const src = c.source!;
    const vid =
      src.hasVideo && path === src.path
        ? `<video><samplecharacteristics>${rate(rateFor(src.fps))}<width>${src.width ?? W}</width><height>${src.height ?? H}</height><pixelaspectratio>square</pixelaspectratio></samplecharacteristics></video>`
        : "";
    const aud = src.hasAudio
      ? `<audio><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics><channelcount>2</channelcount></audio>`
      : "";
    return `<file id="${id}"><name>${xmlEscape(baseName(path))}</name><pathurl>${xmlEscape(fileUrl(path))}</pathurl>${rate(rateFor(src.fps))}<duration>${fr(durationSec)}</duration><media>${vid}${aud}</media></file>`;
  };

  const param = (id: string, name: string, value: string, extra = "") =>
    `<parameter authoringApp="PremierePro"><parameterid>${id}</parameterid><name>${name}</name>${extra}<value>${value}</value></parameter>`;
  const effect = (name: string, id: string, cat: string, media: "video" | "audio", params: string) =>
    `<filter><effect><name>${name}</name><effectid>${id}</effectid><effectcategory>${cat}</effectcategory><effecttype>${cat}</effecttype><mediatype>${media}</mediatype>${params}</effect></filter>`;
  const timeRemap = (speed: number, media: "video" | "audio") =>
    Math.abs(speed - 1) < 1e-3
      ? ""
      : effect(
          "Time Remap",
          "timeremap",
          "motion",
          media,
          param("variablespeed", "variablespeed", "0", "<valuemin>0</valuemin><valuemax>1</valuemax>") +
            param(
              "speed",
              "speed",
              num(speed * 100, 2),
              "<valuemin>-100000</valuemin><valuemax>100000</valuemax>",
            ) +
            param("reverse", "reverse", "FALSE") +
            param("frameblending", "frameblending", "FALSE"),
        );

  let n = 0;
  const clipitem = (
    c: Clip,
    file: { path: string; inPoint: number; durationSec: number },
    speed: number,
    media: "video" | "audio",
    filters: string,
  ) => {
    const start = fr(c.start);
    const end = Math.max(start + 1, fr(c.end));
    const inF = fr(file.inPoint);
    const out = inF + Math.max(1, Math.round((end - start) * speed));
    const st =
      media === "audio"
        ? `<sourcetrack><mediatype>audio</mediatype><trackindex>1</trackindex></sourcetrack>`
        : "";
    return `<clipitem id="clipitem-${++n}"><name>${xmlEscape(c.label)}</name><enabled>TRUE</enabled><duration>${fr(file.durationSec)}</duration>${rate()}<start>${start}</start><end>${end}</end><in>${inF}</in><out>${out}</out>${fileXml(file.path, c, file.durationSec)}${st}${timeRemap(speed, media)}${filters}</clipitem>`;
  };

  const videoItems = l.video.map((c) => {
    const keys = framing(c, W, H);
    // Keyframe `when` is in source frames, the same scale as <in>/<out>.
    const kf = (f: (k: FrameKey) => string) =>
      keys.length > 1
        ? keys.map((k) => `<keyframe><when>${fr(k.t)}</when><value>${f(k)}</value></keyframe>`).join("")
        : "";
    const scale = (k: FrameKey) => num(k.scale * 100, 3);
    // shortcut: Center is written as a fraction of the sequence frame (0,0 = middle); verify in Premiere and adjust if it imports off-centre.
    const centre = (k: FrameKey) => `<horiz>${num(k.dx / W, 5)}</horiz><vert>${num(k.dy / H, 5)}</vert>`;
    const motion = effect(
      "Basic Motion",
      "basic",
      "motion",
      "video",
      `<parameter authoringApp="PremierePro"><parameterid>scale</parameterid><name>Scale</name><valuemin>0</valuemin><valuemax>1000</valuemax><value>${scale(keys[0])}</value>${kf(scale)}</parameter>` +
        `<parameter authoringApp="PremierePro"><parameterid>center</parameterid><name>Center</name><value>${centre(keys[0])}</value>${kf(centre)}</parameter>`,
    );
    const opacity =
      (c.opacity ?? 1) < 0.999
        ? effect(
            "Opacity",
            "opacity",
            "motion",
            "video",
            param(
              "opacity",
              "Opacity",
              num((c.opacity ?? 1) * 100, 2),
              "<valuemin>0</valuemin><valuemax>100</valuemax>",
            ),
          )
        : "";
    return clipitem(
      c,
      { path: c.source!.path, inPoint: c.inPoint ?? 0, durationSec: c.source!.durationSec },
      c.speed ?? 1,
      "video",
      motion + opacity,
    );
  });
  const audioItems = (clips: Clip[]) =>
    clips.map((c) => {
      const v = Math.max(0, Math.min(3.98, c.volume ?? 1));
      const level =
        Math.abs(v - 1) > 1e-3
          ? effect(
              "Audio Levels",
              "audiolevels",
              "audiolevels",
              "audio",
              param("level", "Level", num(v, 4), "<valuemin>0</valuemin><valuemax>3.98109</valuemax>"),
            )
          : "";
      return clipitem(c, soundFile(c), speedOf(c, l.video), "audio", level);
    });
  const track = (items: string[]) =>
    `<track>${items.join("")}<enabled>TRUE</enabled><locked>FALSE</locked></track>`;
  const soundTracks = [l.sound, l.music].filter((t) => t.length).map((t) => track(audioItems(t)));

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<!DOCTYPE xmeml>`,
    `<xmeml version="5">`,
    `<sequence id="sequence-1">`,
    `<name>${xmlEscape(project.name || "Verso reel")}</name>`,
    `<duration>${total}</duration>`,
    rate(),
    `<timecode>${rate()}<string>00:00:00:00</string><frame>0</frame><displayformat>NDF</displayformat></timecode>`,
    `<media>`,
    `<video>`,
    `<format><samplecharacteristics>${rate()}<width>${W}</width><height>${H}</height><pixelaspectratio>square</pixelaspectratio><fielddominance>none</fielddominance></samplecharacteristics></format>`,
    track(videoItems),
    `</video>`,
    `<audio>`,
    `<numOutputChannels>2</numOutputChannels>`,
    `<format><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics></format>`,
    ...soundTracks,
    `</audio>`,
    `</media>`,
    `</sequence>`,
    `</xmeml>`,
    "",
  ].join("\n");
}

// ------------------------------------------------------------------- SRT

const srtTime = (sec: number) => {
  const ms = Math.max(0, Math.round(sec * 1000));
  const p = (v: number, w = 2) => String(v).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

/** Captions track as SubRip; empty string when there are no captions. */
export function toSrt(project: Project): string {
  return lanes(project)
    .captions.map(
      (c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${(c.text ?? c.label).trim()}\n`,
    )
    .join("\n");
}

// ------------------------------------------------------------- the bundle

/** Files to write for a target: name -> contents. `base` is the file name without extension. */
export function handoffFiles(project: Project, target: HandoffTarget, base: string): Record<string, string> {
  const l = lanes(project);
  const out: Record<string, string> = {};
  if (target === "premiere") out[`${base}.xml`] = toXmeml(project);
  out[`${base}.fcpxml`] = toFcpxml(project);
  const srt = toSrt(project);
  if (srt) out[`${base} captions.srt`] = srt;
  out[`${base} - read me.txt`] = readMe(project, target, base, l);
  return out;
}

function readMe(project: Project, target: HandoffTarget, base: string, l: Lanes): string {
  const app = target === "premiere" ? "Premiere Pro" : "DaVinci Resolve";
  const steps =
    target === "premiere"
      ? [
          `In Premiere Pro: File > Import, pick "${base}.xml".`,
          `Captions: File > Import "${base} captions.srt", then drag it onto the timeline.`,
        ]
      : [
          `In DaVinci Resolve: File > Import > Timeline, pick "${base}.fcpxml".`,
          `Captions: File > Import > Subtitle, pick "${base} captions.srt".`,
        ];
  const skipped: string[] = [];
  const project0 = project.tracks.flatMap((t) => t.clips);
  if (project0.some((c) => c.still)) skipped.push("Photos (add them again from your files).");
  if (project0.some((c) => c.transitionIn)) skipped.push("Transitions (they arrive as straight cuts).");
  if (project0.some((c) => c.speedRamp?.length))
    skipped.push("Speed ramps (each clip keeps one steady speed).");
  if (project0.some((c) => c.zoomKeys?.length || c.fx?.push))
    skipped.push("Punch-in zooms and slow push-ins.");
  if (project0.some((c) => c.color) || project.look) skipped.push("Colour, looks, grain and film effects.");
  if (project0.some((c) => c.videoOverride)) skipped.push("Background removal (the original video is used).");
  if (project0.some((c) => c.sticker)) skipped.push("Stickers.");
  if (l.captions.length)
    skipped.push("Caption styling and word-by-word animation (the words come over in the .srt file).");
  if (l.text.some((c) => c.style?.animation)) skipped.push("Text animations.");
  const texts =
    target === "premiere" && l.text.length
      ? [
          "",
          "Text on screen (Premiere's XML import can't carry titles, so retype these with the Type tool):",
          ...l.text.map(
            (c) =>
              `  ${srtTime(c.start).slice(0, 8)} - ${srtTime(c.end).slice(0, 8)}  ${(c.text ?? c.label).replace(/\s+/g, " ")}`,
          ),
        ]
      : [];
  return [
    `"${project.name}" from Verso, ready for ${app}.`,
    "",
    "How to open it:",
    ...steps.map((s) => `  - ${s}`),
    "",
    "What comes across: your cuts, clip speed, framing (including smart reframe moves), sound and music levels" +
      (target === "resolve" ? ", and on-screen text as basic titles." : "."),
    "Keep the original video files where they are; the project points at them.",
    ...(skipped.length
      ? [
          "",
          "Not carried over (redo these in the editor if you need them):",
          ...skipped.map((s) => `  - ${s}`),
        ]
      : []),
    ...texts,
    "",
  ].join("\r\n");
}
