#!/usr/bin/env node
// Downloads an LGPL FFmpeg build and installs ffmpeg + ffprobe as Tauri sidecars:
//   src-tauri/binaries/ffmpeg-<target-triple>[.exe]
//   src-tauri/binaries/ffprobe-<target-triple>[.exe]
//
// Source: BtbN/FFmpeg-Builds, release branch n9.0, LGPL variant (no GPL-only
// components such as x264/x265). The download is verified against the
// release's checksums.sha256 before anything is extracted.
//
// Usage: pnpm fetch:ffmpeg [--force]

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FFMPEG_BRANCH = "9.0";
const RELEASE = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest";
const ASSETS = {
  "x86_64-pc-windows-msvc": `ffmpeg-n${FFMPEG_BRANCH}-latest-win64-lgpl-${FFMPEG_BRANCH}.zip`,
  "aarch64-pc-windows-msvc": `ffmpeg-n${FFMPEG_BRANCH}-latest-winarm64-lgpl-${FFMPEG_BRANCH}.zip`,
  "x86_64-unknown-linux-gnu": `ffmpeg-n${FFMPEG_BRANCH}-latest-linux64-lgpl-${FFMPEG_BRANCH}.tar.xz`,
  "aarch64-unknown-linux-gnu": `ffmpeg-n${FFMPEG_BRANCH}-latest-linuxarm64-lgpl-${FFMPEG_BRANCH}.tar.xz`,
};

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "src-tauri", "binaries");
const force = process.argv.includes("--force");

function hostTriple() {
  const out = execFileSync("rustc", ["-vV"], { encoding: "utf8" });
  const line = out.split("\n").find((l) => l.startsWith("host:"));
  if (!line) throw new Error("Could not read the Rust host triple from `rustc -vV`.");
  return line.slice(5).trim();
}

function sha256(file) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    createReadStream(file)
      .on("data", (d) => hash.update(d))
      .on("end", () => resolve(hash.digest("hex")))
      .on("error", reject);
  });
}

async function download(url, dest) {
  const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": "verso-build" } });
  if (!res.ok) throw new Error(`Download failed (${res.status}) for ${url}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

function findFile(dir, name) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      const hit = findFile(p, name);
      if (hit) return hit;
    } else if (entry === name) {
      return p;
    }
  }
  return null;
}

async function main() {
  const triple = process.env.TAURI_TARGET_TRIPLE || hostTriple();
  const exe = triple.includes("windows") ? ".exe" : "";
  const targets = ["ffmpeg", "ffprobe"].map((n) => join(outDir, `${n}-${triple}${exe}`));

  if (!force && targets.every(existsSync)) {
    console.log(`FFmpeg sidecars already present for ${triple}. Use --force to refresh.`);
    return;
  }

  const asset = ASSETS[triple];
  if (!asset) {
    console.error(
      `No prebuilt LGPL FFmpeg is configured for ${triple}.\n` +
        `macOS: build FFmpeg with --disable-gpl (or use an LGPL build you trust) and place\n` +
        `ffmpeg-${triple} and ffprobe-${triple} in src-tauri/binaries/.`,
    );
    process.exit(1);
  }

  const work = mkdtempSync(join(tmpdir(), "verso-ffmpeg-"));
  try {
    console.log(`Downloading ${asset} ...`);
    const archive = join(work, asset);
    const sums = join(work, "checksums.sha256");
    await download(`${RELEASE}/checksums.sha256`, sums);
    await download(`${RELEASE}/${asset}`, archive);

    const expected = readFileSync(sums, "utf8")
      .split("\n")
      .map((l) => l.trim().split(/\s+/))
      .find(([, name]) => name === asset)?.[0];
    if (!expected) throw new Error(`No checksum listed for ${asset}.`);
    const actual = await sha256(archive);
    if (actual !== expected) throw new Error(`Checksum mismatch for ${asset}.`);
    console.log("Checksum verified.");

    const extractDir = join(work, "x");
    mkdirSync(extractDir);
    // bsdtar (bundled with Windows 10+) and GNU tar both handle these archives.
    execFileSync("tar", ["-xf", archive, "-C", extractDir], { stdio: "inherit" });

    mkdirSync(outDir, { recursive: true });
    for (const [i, name] of ["ffmpeg", "ffprobe"].entries()) {
      const src = findFile(extractDir, `${name}${exe}`);
      if (!src) throw new Error(`${name}${exe} not found in ${asset}.`);
      copyFileSync(src, targets[i]);
      if (!exe) chmodSync(targets[i], 0o755);
      console.log(`Installed ${targets[i]}`);
    }
    const license = findFile(extractDir, "LICENSE.txt");
    if (license) copyFileSync(license, join(outDir, "FFMPEG-LICENSE.txt"));
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
