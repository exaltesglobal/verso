import logo from "../assets/brand/verso-logo-horizontal-dark-bg.svg";
import { Icon, type IconName } from "../components/Icon";
import { AgapeCredit } from "../components/AgapeCredit";
import { IconButton } from "../components/ui";
import { recentProjects } from "../data/placeholder";
import { useFilmstrip } from "../lib/filmstrip";
import { formatDuration } from "../lib/media";
import { timeAgo, type ProjectSummary } from "../lib/persist";

interface WelcomeProps {
  importing: boolean;
  onNewProject: () => void;
  onImport: () => void;
  onMakeClips: () => void;
  onOpenSample: () => void;
  onAbout: () => void;
  recents: ProjectSummary[];
  onOpenRecent: (id: string) => void;
  onOpenFile: () => void;
}

interface Action {
  icon: IconName;
  title: string;
  body: string;
  onClick: () => void;
  featured?: boolean;
  busy?: boolean;
}

export function Welcome({
  importing,
  onNewProject,
  onImport,
  onMakeClips,
  onOpenSample,
  onAbout,
  recents,
  onOpenRecent,
  onOpenFile,
}: WelcomeProps) {
  const actions: Action[] = [
    {
      icon: "auto-cut",
      title: "Make clips from long video",
      body: "Drop in a podcast or vlog. We find the best moments and turn them into reels.",
      onClick: onMakeClips,
      featured: true,
    },
    {
      icon: "import",
      title: "Import video",
      body: "Bring in a video you already have and start editing it.",
      onClick: onImport,
      busy: importing,
    },
    {
      icon: "add",
      title: "New project",
      body: "Start with an empty 9:16 reel and add things as you go.",
      onClick: onNewProject,
    },
  ];

  return (
    <div className="welcome">
      <header className="welcome__bar">
        <img src={logo} alt="Verso" className="welcome__logo" />
        <div className="welcome__bar-actions">
          <IconButton icon="help" label="About Verso" onClick={onAbout} />
          <IconButton icon="settings" label="Settings" />
        </div>
      </header>

      <main className="welcome__main">
        <p className="eyebrow">Welcome to Verso</p>
        <h1 className="hero">
          Long videos in. <span className="hero__payoff">Reels out.</span>
        </h1>
        <p className="welcome__lede">What would you like to make today?</p>

        <div className="welcome__actions">
          {actions.map((a) => (
            <button
              key={a.title}
              type="button"
              className={a.featured ? "action-card is-featured" : "action-card"}
              onClick={a.onClick}
              disabled={a.busy}
            >
              <span className="action-card__icon">
                <Icon name={a.icon} size={28} />
              </span>
              <span className="action-card__title">{a.busy ? "Opening…" : a.title}</span>
              <span className="action-card__body">{a.body}</span>
              {a.featured && <span className="action-card__tag">Most popular</span>}
            </button>
          ))}
        </div>

        <section className="recent" aria-labelledby="recent-title">
          <div className="recent__head">
            <h2 id="recent-title">{recents.length ? "Recent projects" : "Try a sample"}</h2>
            <button type="button" className="btn btn--ghost" onClick={onOpenFile}>
              <Icon name="folder" size={20} />
              <span>Open a project</span>
            </button>
          </div>
          <div className="recent__list">
            {recents.slice(0, 6).map((p) => (
              <RecentCard key={p.id} project={p} onOpen={() => onOpenRecent(p.id)} />
            ))}
            {!recents.length &&
              recentProjects.map((p) => (
                <button key={p.id} type="button" className="recent-card" onClick={onOpenSample}>
                  <span
                    className="recent-card__thumb"
                    style={{ background: `linear-gradient(160deg, ${p.tint[0]}, ${p.tint[1]})` }}
                  />
                  <span className="recent-card__text">
                    <span className="recent-card__name">{p.name}</span>
                    <span className="recent-card__detail">{p.detail}</span>
                  </span>
                </button>
              ))}
          </div>
        </section>
      </main>

      <footer className="welcome__foot">
        <span>Verso 0.1 beta</span>
        <AgapeCredit />
      </footer>
    </div>
  );
}

function RecentCard({ project: p, onOpen }: { project: ProjectSummary; onOpen: () => void }) {
  const frames = useFilmstrip(p.coverSource ?? undefined);
  const cover = frames[Math.floor(frames.length / 2)];
  return (
    <button type="button" className="recent-card" onClick={onOpen}>
      <span className="recent-card__thumb">{cover && <img src={cover} alt="" />}</span>
      <span className="recent-card__text">
        <span className="recent-card__name">{p.name}</span>
        <span className="recent-card__detail">
          {formatDuration(p.durationSec)} � edited {timeAgo(p.updatedAt)}
        </span>
      </span>
    </button>
  );
}
