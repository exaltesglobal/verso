// Brand-kit icons (03-Iconography). Each SVG uses currentColor, so an icon
// takes the colour of its text. Loaded as raw strings at build time.
const files = import.meta.glob("../assets/icons/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const icons: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, svg]) => [path.slice(path.lastIndexOf("/") + 1, -".svg".length), svg]),
);

export type IconName =
  | "add"
  | "adjust"
  | "auto-cut"
  | "auto-reel"
  | "captions"
  | "crop"
  | "delete"
  | "effects"
  | "export"
  | "filters"
  | "folder"
  | "help"
  | "import"
  | "layers"
  | "music"
  | "one-click"
  | "pause"
  | "play"
  | "redo"
  | "reframe"
  | "save"
  | "settings"
  | "share"
  | "speed"
  | "split"
  | "subject-track"
  | "templates"
  | "text"
  | "timeline"
  | "transitions"
  | "trim"
  | "undo"
  | "vertical"
  | "voiceover"
  | "volume"
  | "zoom-in"
  // Additions in the brand hand (Lucide, ISC, redrawn at stroke 1.75) where the kit had no icon.
  | "alert"
  | "check"
  | "check-circle"
  | "chevron-down"
  | "chevron-right"
  | "close"
  | "eye"
  | "eye-off"
  | "fullscreen"
  | "headphones"
  | "info"
  | "lock"
  | "magnet"
  | "more-horizontal"
  | "reset"
  | "safe-zone"
  | "search"
  | "skip-end"
  | "skip-start"
  | "step-back"
  | "step-forward"
  | "unlock"
  | "user"
  | "volume-off"
  | "zoom-fit"
  | "zoom-out";

interface IconProps {
  name: IconName;
  /** 16 in the timeline, 20 in toolbars, 24 in the tool rail. */
  size?: 16 | 20 | 24 | 28 | 32;
  className?: string;
}

export function Icon({ name, size = 20, className }: IconProps) {
  return (
    <span
      className={className ? `vs-icon ${className}` : "vs-icon"}
      style={{ width: size, height: size }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: icons[name] ?? "" }}
    />
  );
}
