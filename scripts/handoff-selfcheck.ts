// Self-check for src/lib/handoff.ts (no test runner in this repo).
// Run: node scripts/handoff-selfcheck.ts   (Node 23.6+ strips the types)
import assert from "node:assert/strict";
import { fileUrl, framing, handoffFiles, toFcpxml, toSrt, toXmeml } from "../src/lib/handoff.ts";
import type { Project } from "../src/lib/project.ts";

interface El {
  name: string;
  attrs: Record<string, string>;
  children: El[];
  text: string;
}

const unescape = (s: string) =>
  s.replace(
    /&(lt|gt|quot|apos|amp);/g,
    (_, e: string) => ({ lt: "<", gt: ">", quot: '"', apos: "'", amp: "&" })[e]!,
  );

/** Tiny strict XML parser: throws on unbalanced tags, bad attributes or raw `<`/`&` in text. */
function parseXml(xml: string): El {
  const body = xml.replace(/^<\?xml[^>]*\?>\s*/, "").replace(/^<!DOCTYPE [^>]*>\s*/, "");
  const root: El = { name: "#doc", attrs: {}, children: [], text: "" };
  const stack = [root];
  const re = /<(\/?)([A-Za-z][\w:.-]*)((?:\s+[\w:.-]+="[^"<]*")*)\s*(\/?)>|([^<]+)/gy;
  let m: RegExpExecArray | null;
  let pos = 0;
  while (pos < body.length && (m = re.exec(body))) {
    pos = re.lastIndex;
    const [, close, name, attrs, self, text] = m;
    const top = stack[stack.length - 1];
    if (text !== undefined) {
      assert.ok(!/&(?!(lt|gt|quot|apos|amp);)/.test(text), `raw & in text: ${text}`);
      top.text += unescape(text);
    } else if (close) {
      assert.equal(top.name, name, `closing </${name}> but open <${top.name}>`);
      stack.pop();
    } else {
      const el: El = { name, attrs: {}, children: [], text: "" };
      for (const a of attrs.matchAll(/([\w:.-]+)="([^"]*)"/g)) {
        assert.ok(!/&(?!(lt|gt|quot|apos|amp);)/.test(a[2]), `raw & in attribute ${a[1]}`);
        el.attrs[a[1]] = unescape(a[2]);
      }
      top.children.push(el);
      if (!self) stack.push(el);
    }
  }
  assert.equal(pos, body.length, `could not parse near: ${body.slice(pos, pos + 60)}`);
  assert.equal(stack.length, 1, `unclosed <${stack[stack.length - 1].name}>`);
  assert.equal(root.children.length, 1, "exactly one root element");
  return root.children[0];
}

const all = (el: El, name: string): El[] =>
  el.children.flatMap((c) => [...(c.name === name ? [c] : []), ...all(c, name)]);
const one = (el: El, path: string): El =>
  path.split("/").reduce((e, n) => {
    const hit = e.children.find((c) => c.name === n);
    assert.ok(hit, `missing <${n}> under <${e.name}>`);
    return hit;
  }, el);

// ---- sample project: 25 fps 16:9 source, cut to 9:16, one clip at 2x with a reframe move
const PATH = "C:\\Media Files\\R&D\\clip one.mp4";
const src = {
  path: PATH,
  fileName: "clip one.mp4",
  sizeBytes: 1,
  durationSec: 60,
  width: 1920,
  height: 1080,
  fps: 25,
  videoCodec: "h264",
  audioCodec: "aac",
  hasVideo: true,
  hasAudio: true,
};
const music = {
  ...src,
  path: "D:\\Music\\beat <1>.mp3",
  fileName: "beat <1>.mp3",
  hasVideo: false,
  width: null,
  height: null,
  fps: null,
};
const crop = { mode: "follow_subject" as const, aspect: "9:16", layout: "single" as const };
const project = {
  id: "p1",
  name: 'Tom & Jerry\'s "reel"',
  aspect: "9:16",
  createdAt: 0,
  updatedAt: 0,
  tracks: [
    {
      kind: "text",
      label: "Text",
      clips: [
        {
          id: "t1",
          label: "Hi",
          text: "Big <news> & more",
          start: 0.5,
          end: 2,
          style: { preset: "title", y: 0.2, size: 0.06, color: "#FF0000", align: "center" },
        },
      ],
    },
    {
      kind: "captions",
      label: "Captions",
      clips: [
        { id: "c1", label: "hello there", text: "hello there", start: 0, end: 1.25 },
        { id: "c2", label: "world", text: "world", start: 61.5, end: 3725.001 },
      ],
    },
    {
      kind: "video",
      label: "Video",
      clips: [
        {
          id: "v1",
          label: "one",
          start: 0,
          end: 4,
          inPoint: 2,
          source: src,
          linkId: "L1",
          zoom: 1.5,
          pos: { x: 1, y: 0 },
        },
        {
          id: "v2",
          label: "two",
          start: 4,
          end: 6,
          inPoint: 10,
          speed: 2,
          source: src,
          linkId: "L2",
          cropPath: {
            ...crop,
            keyframes: [
              { t: 9, rects: [{ x: 0, y: 0, w: 0.3164, h: 1 }] },
              { t: 12, rects: [{ x: 0.6836, y: 0, w: 0.3164, h: 1 }] },
            ],
          },
        },
      ],
    },
    {
      kind: "audio",
      label: "Sound",
      clips: [
        { id: "a1", label: "one sound", start: 0, end: 4, inPoint: 2, source: src, linkId: "L1" },
        { id: "a2", label: "two sound", start: 4, end: 6, inPoint: 10, source: src, linkId: "L2" },
      ],
    },
    {
      kind: "music",
      label: "Music",
      clips: [{ id: "m1", label: "beat", start: 0, end: 6, inPoint: 0, source: music, volume: 0.5 }],
    },
  ],
} as unknown as Project;

// ---- file URLs
assert.equal(fileUrl(PATH), "file:///C:/Media%20Files/R%26D/clip%20one.mp4");
assert.equal(fileUrl("/Users/me/My Clip.mov"), "file:///Users/me/My%20Clip.mov");

// ---- framing maths
const [still] = framing({ id: "x", label: "", start: 0, end: 1, source: src }, 1080, 1920);
assert.ok(Math.abs(still.scale - 1920 / 1080) < 1e-9 && Math.abs(still.dx) < 1e-9, "cover-fit, centred");
const v1 = framing(project.tracks[2].clips[0], 1080, 1920)[0];
// zoom 1.5 panned fully right: the view's right edge stays on the un-zoomed frame's right edge (export crop maths).
const fit = 1920 / 1080;
assert.ok(
  Math.abs((540 - v1.dx) / v1.scale - 540 / fit) < 1e-6 && Math.abs(v1.scale - 1.5 * fit) < 1e-9,
  "pan right reaches the edge",
);
const v2 = framing(project.tracks[2].clips[1], 1080, 1920);
assert.equal(v2.length, 2, "reframe keys kept");
assert.ok(v2[0].dx > 0 && v2[1].dx < 0, "reframe pans left half then right half");

// ---- FCPXML
const fcp = parseXml(toFcpxml(project));
assert.equal(fcp.name, "fcpxml");
assert.equal(fcp.attrs.version, "1.11");
const fmt = one(fcp, "resources/format");
assert.deepEqual(
  [fmt.attrs.id, fmt.attrs.width, fmt.attrs.height, fmt.attrs.frameDuration],
  ["r1", "1080", "1920", "100/2500s"],
);
const assets = all(fcp, "asset");
assert.equal(assets.length, 2, "one asset per file");
assert.equal(one(assets[0], "media-rep").attrs.src, fileUrl(PATH));
assert.equal(one(assets[1], "media-rep").attrs.src, "file:///D:/Music/beat%20%3C1%3E.mp3");
const proj = one(fcp, "library/event/project");
assert.equal(proj.attrs.name, project.name, "name escaped and parsed back");
const seq = one(proj, "sequence");
assert.equal(seq.attrs.duration, "15000/2500s", "6 s at 25 fps");
const gap = one(seq, "spine/gap");
const clips = all(gap, "asset-clip");
const vids = clips.filter((c) => c.attrs.lane === "1");
assert.deepEqual(
  [vids[0].attrs.offset, vids[0].attrs.start, vids[0].attrs.duration],
  ["0s", "5000/2500s", "10000/2500s"],
);
// 2x clip: 2 s on the timeline, local start = source 10 s / 2.
assert.deepEqual(
  [vids[1].attrs.offset, vids[1].attrs.start, vids[1].attrs.duration],
  ["10000/2500s", "12500/2500s", "5000/2500s"],
);
const tps = all(vids[1], "timept");
assert.equal(tps.length, 2);
assert.equal(tps[1].attrs.time, "75000/2500s", "60 s source at 2x = 30 s local");
assert.equal(tps[1].attrs.value, "150000000/2500000s", "maps to 60 s of source");
assert.equal(all(vids[1], "keyframe").length, 4, "position + scale keyframes");
assert.equal(clips.filter((c) => c.attrs.lane === "-1").length, 2, "sound lane");
const mus = clips.find((c) => c.attrs.lane === "-2")!;
assert.equal(one(mus, "adjust-volume").attrs.amount, "-6.02dB");
const title = all(gap, "title")[0];
assert.equal(all(title, "text-style")[0].text, "Big <news> & more");

// ---- xmeml
const xm = parseXml(toXmeml(project));
assert.equal(xm.attrs.version, "5");
const xseq = one(xm, "sequence");
assert.equal(one(xseq, "rate/timebase").text, "25");
assert.equal(one(xseq, "duration").text, "150");
const vItems = all(one(xseq, "media/video"), "clipitem");
const f = (el: El, n: string) => Number(one(el, n).text);
assert.deepEqual(
  [f(vItems[0], "start"), f(vItems[0], "end"), f(vItems[0], "in"), f(vItems[0], "out")],
  [0, 100, 50, 150],
);
assert.deepEqual(
  [f(vItems[1], "start"), f(vItems[1], "end"), f(vItems[1], "in"), f(vItems[1], "out")],
  [100, 150, 250, 350],
  "2x: 50 timeline frames use 100 source frames",
);
const remap = all(vItems[1], "effect").find((e) => one(e, "effectid").text === "timeremap")!;
assert.equal(
  all(remap, "parameter")
    .find((p) => one(p, "parameterid").text === "speed")!
    .children.find((c) => c.name === "value")!.text,
  "200",
);
assert.equal(one(vItems[0], "file/pathurl").text, fileUrl(PATH));
assert.equal(
  vItems[1].children.find((c) => c.name === "file")!.children.length,
  0,
  "repeat file is a reference",
);
assert.equal(all(vItems[1], "keyframe").length, 4, "scale + centre keyframes");
const aTracks = all(one(xseq, "media/audio"), "track");
assert.equal(aTracks.length, 2, "sound + music tracks");
assert.deepEqual(
  [f(all(aTracks[0], "clipitem")[1], "in"), f(all(aTracks[0], "clipitem")[1], "out")],
  [250, 350],
  "linked sound follows the video speed",
);

// ---- SRT
assert.equal(
  toSrt(project),
  "1\n00:00:00,000 --> 00:00:01,250\nhello there\n\n2\n00:01:01,500 --> 01:02:05,001\nworld\n",
);

// ---- bundles
assert.deepEqual(Object.keys(handoffFiles(project, "premiere", "Reel")).sort(), [
  "Reel - read me.txt",
  "Reel captions.srt",
  "Reel.fcpxml",
  "Reel.xml",
]);
assert.deepEqual(Object.keys(handoffFiles(project, "resolve", "Reel")).sort(), [
  "Reel - read me.txt",
  "Reel captions.srt",
  "Reel.fcpxml",
]);
assert.match(handoffFiles(project, "premiere", "Reel")["Reel - read me.txt"], /Big <news> & more/);

console.log("handoff self-check: all passed");
