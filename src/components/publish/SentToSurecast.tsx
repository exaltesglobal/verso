import { openUrl } from "@tauri-apps/plugin-opener";
import { jobLabel, postPage, retryJob, removeJob, useSentPosts, type SendJob } from "../../lib/surecast";

const open = (url: string) => void openUrl(url).catch(() => {});

function when(j: SendJob) {
  if (!j.scheduledAt || j.remoteStatus === "published") return null;
  const d = new Date(j.scheduledAt);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      });
}

/** Welcome screen list: reels sent to Surecast, with their status read back. Hidden when empty. */
export function SentToSurecast({ limit = 5 }: { limit?: number }) {
  const { jobs, reload } = useSentPosts();
  if (!jobs.length) return null;

  return (
    <section className="sent" aria-label="Sent to Surecast">
      <h2 className="sent__heading">Sent to Surecast</h2>
      <ul className="sent__list">
        {jobs.slice(0, limit).map((j) => {
          const label = jobLabel(j);
          const at = when(j);
          return (
            <li key={j.id} className="sent__item">
              <div className="sent__main">
                <span className="sent__title" title={j.package.title}>
                  {j.package.title || j.package.projectName}
                </span>
                <span className="sent__meta">
                  {j.state === "failed" && j.error ? j.error : at ? `Goes out ${at}` : null}
                </span>
              </div>
              <span className={`sent__chip sent__chip--${label.tone}`}>{label.text}</span>
              <div className="sent__actions">
                {j.state === "failed" && (
                  <>
                    <button
                      type="button"
                      className="sent__link"
                      onClick={() => void retryJob(j.id).then(reload)}
                    >
                      Try again
                    </button>
                    <button
                      type="button"
                      className="sent__link"
                      onClick={() => void removeJob(j.id).then(reload)}
                    >
                      Remove
                    </button>
                  </>
                )}
                {j.links[0] && (
                  <button type="button" className="sent__link" onClick={() => open(j.links[0])}>
                    View post
                  </button>
                )}
                {j.postId && j.remoteStatus !== "deleted" && (
                  <button type="button" className="sent__link" onClick={() => open(postPage(j.postId!))}>
                    Open in Surecast
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
