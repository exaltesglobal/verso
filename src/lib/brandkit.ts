// Brand kits: one per channel. Logo, colours, caption look, intro and outro,
// applied to a reel in one click. Stored locally (no account needed).
import type { MediaInfo } from "./media";
import { appendMedia, projectDuration, uid, type Clip, type Project } from "./project";

export type LogoCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface BrandKit {
  id: string;
  name: string;
  logo?: MediaInfo;
  logoCorner: LogoCorner;
  /** 0..1 */
  logoOpacity: number;
  /** Logo width as a share of the frame width. */
  logoSize: number;
  accent: string;
  textColor: string;
  captionStyleId?: string;
  intro?: MediaInfo;
  outro?: MediaInfo;
  handle?: string;
}

/** What a project keeps once a kit is applied (a snapshot, so later kit edits don't change old reels). */
export interface ProjectBrand {
  kitId: string;
  logo?: MediaInfo;
  logoCorner: LogoCorner;
  logoOpacity: number;
  logoSize: number;
  accent: string;
  textColor: string;
  handle?: string;
}

const KEY = "verso.brandkits.v1";

export function loadKits(): BrandKit[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as BrandKit[];
  } catch {
    return [];
  }
}

export function saveKits(kits: BrandKit[]) {
  localStorage.setItem(KEY, JSON.stringify(kits));
}

export function newKit(name = "My channel"): BrandKit {
  return {
    id: uid("bk"),
    name,
    logoCorner: "top-right",
    logoOpacity: 0.9,
    logoSize: 0.16,
    accent: "#FFB547",
    textColor: "#F5F4F0",
  };
}

/**
 * Applies a kit: logo watermark (the creator's own), brand colours on text,
 * caption look, and intro/outro clips around the reel. One undoable change.
 */
export function applyBrandKit(project: Project, kit: BrandKit): Project {
  let next: Project = {
    ...project,
    captionStyle: kit.captionStyleId ?? project.captionStyle,
    brand: {
      kitId: kit.id,
      logo: kit.logo,
      logoCorner: kit.logoCorner,
      logoOpacity: kit.logoOpacity,
      logoSize: kit.logoSize,
      accent: kit.accent,
      textColor: kit.textColor,
      handle: kit.handle,
    },
    tracks: project.tracks.map((t) =>
      t.kind === "text"
        ? {
            ...t,
            clips: t.clips.map((c) =>
              c.style
                ? {
                    ...c,
                    style: {
                      ...c.style,
                      color: c.style.preset === "boxed" ? "#0B0B0F" : kit.textColor,
                    },
                    boxColor: kit.accent,
                  }
                : c,
            ),
          }
        : t,
    ),
    updatedAt: Date.now(),
  };

  if (kit.intro && !hasBrandClip(project, "intro")) next = withIntro(next, kit.intro);
  if (kit.outro && !hasBrandClip(project, "outro")) {
    const before = projectDuration(next);
    next = appendMedia(next, [kit.outro]);
    next = tagNew(next, before, "outro");
  }
  return next;
}

function hasBrandClip(p: Project, role: "intro" | "outro") {
  return p.tracks.some((t) => t.clips.some((c) => c.brandRole === role));
}

function tagNew(p: Project, from: number, role: "intro" | "outro"): Project {
  return {
    ...p,
    tracks: p.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) =>
        c.start >= from - 0.001 && c.source && !c.brandRole ? { ...c, brandRole: role } : c,
      ),
    })),
  };
}

/** Puts the intro at 0 and shifts everything else right. */
function withIntro(p: Project, intro: MediaInfo): Project {
  const len = intro.durationSec;
  const link = uid("l");
  const label = intro.fileName.replace(/\.[^.]+$/, "");
  const v: Clip = {
    id: uid("v"),
    label,
    start: 0,
    end: len,
    inPoint: 0,
    source: intro,
    linkId: intro.hasAudio ? link : undefined,
    brandRole: "intro",
  };
  const a: Clip | null = intro.hasAudio
    ? {
        id: uid("a"),
        label: `${label} · sound`,
        start: 0,
        end: len,
        inPoint: 0,
        source: intro,
        linkId: link,
        volume: 1,
        brandRole: "intro",
      }
    : null;
  return {
    ...p,
    tracks: p.tracks.map((t) => {
      const shifted = t.clips.map((c) => ({ ...c, start: c.start + len, end: c.end + len }));
      if (t.kind === "video") return { ...t, clips: [v, ...shifted] };
      if (t.kind === "audio") return { ...t, clips: a ? [a, ...shifted] : shifted };
      return { ...t, clips: shifted };
    }),
  };
}

export function removeBrand(project: Project): Project {
  return { ...project, brand: undefined, updatedAt: Date.now() };
}
