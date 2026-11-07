import type { CSSProperties, ReactNode } from "react";

/** The pieces the Editor builds once; each workspace only arranges them. */
export interface WorkspaceSlots {
  topBar: ReactNode;
  left: ReactNode;
  preview: ReactNode;
  /** Craft/Studio: the inspector (or its reopen button). Quick: one-tap options. */
  right: ReactNode;
  timeline: ReactNode;
  /** Quick only: the "Make it better" row above the preview. */
  makeItBetter?: ReactNode;
  /** Studio only: drag handles between panels. */
  splitters?: ReactNode;
  /** Menus and dialogs. */
  overlays: ReactNode;
  style: CSSProperties;
  /** Set for 200 ms after a mode switch to crossfade. */
  switching: boolean;
}

const cls = (mode: string, switching: boolean) => `editor editor--${mode}${switching ? " is-switching" : ""}`;

/** Quick: steps | big preview with a clip strip | one-tap options. */
export function QuickWorkspace(s: WorkspaceSlots) {
  return (
    <div className={cls("quick", s.switching)} style={s.style}>
      {s.topBar}
      {s.left}
      <div className="quick-centre">
        {s.makeItBetter}
        {s.preview}
        {s.timeline}
      </div>
      {s.right}
      {s.overlays}
    </div>
  );
}

/** Craft: the classic editor with fixed panel sizes and every setting showing. */
export function CraftWorkspace(s: WorkspaceSlots) {
  return (
    <div className={cls("craft", s.switching)} style={s.style}>
      {s.topBar}
      {s.left}
      {s.preview}
      {s.right}
      {s.timeline}
      {s.overlays}
    </div>
  );
}

/** Studio: Premiere-style, with resizable panels, track headers, keyframes and all shortcuts. */
export function StudioWorkspace(s: WorkspaceSlots) {
  return (
    <div className={cls("studio", s.switching)} style={s.style}>
      {s.topBar}
      {s.left}
      {s.preview}
      {s.right}
      {s.timeline}
      {s.splitters}
      {s.overlays}
    </div>
  );
}
