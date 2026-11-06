import { useEffect, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Button } from "../ui";
import {
  connectSurecast,
  disconnectSurecast,
  setSurecastUrl,
  surecastPage,
  surecastStatus,
  useSurecastUrl,
  type SurecastStatus,
} from "../../lib/surecast";

/** Settings section: Surecast address and the workspace API key (kept in the system keychain). */
export function SurecastSettings() {
  const base = useSurecastUrl();
  const [url, setUrl] = useState(base);
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<SurecastStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!base) return;
    let alive = true;
    surecastStatus()
      .then((s) => alive && setStatus(s))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, [base]);

  const saveUrl = () => {
    setError("");
    if (url.trim() && !/^https:\/\/|^http:\/\/(localhost|127\.0\.0\.1)/.test(url.trim())) {
      return setError("The address starts with https://, for example https://app.surecast.live");
    }
    setSurecastUrl(url);
  };

  const connect = async () => {
    setBusy(true);
    setError("");
    try {
      setStatus(await connectSurecast(key));
      setKey("");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    await disconnectSurecast().catch(() => {});
    setStatus((s) => (s ? { ...s, connected: false, email: null, workspace: null } : s));
  };

  return (
    <section className="settings__section">
      <h2 className="settings__heading">Surecast</h2>
      <p className="settings__text">
        Send finished reels to Surecast, then schedule them there for Instagram, YouTube, TikTok and more.
      </p>

      <div className="settings__row">
        <div>
          <div className="settings__label">Surecast address</div>
          <div className="settings__hint">
            {base ? "Where your Surecast workspace lives." : "Not set up yet."}
          </div>
        </div>
        <div className="settings__control">
          <input
            className="field__input publish-settings__input"
            value={url}
            placeholder="https://app.surecast.live"
            onChange={(e) => setUrl(e.target.value)}
            onBlur={saveUrl}
            onKeyDown={(e) => e.key === "Enter" && saveUrl()}
            aria-label="Surecast address"
            spellCheck={false}
          />
        </div>
      </div>

      {base && status?.connected && (
        <div className="settings__row">
          <div>
            <div className="settings__label">
              Connected{status.workspace ? ` to ${status.workspace}` : ""}
            </div>
            <div className="settings__hint">
              {status.error ?? status.email ?? "Your key is saved in this computer's keychain."}
            </div>
          </div>
          <div className="settings__control">
            <Button variant="ghost" onClick={() => void disconnect()}>
              Disconnect
            </Button>
          </div>
        </div>
      )}

      {base && status && !status.connected && (
        <div className="settings__row">
          <div>
            <div className="settings__label">API key</div>
            <div className="settings__hint">
              In Surecast, open Settings, then API keys, and create a key for Verso.{" "}
              <button
                type="button"
                className="settings__link"
                onClick={() => void openUrl(surecastPage("/settings")).catch(() => {})}
              >
                Open Surecast
              </button>
            </div>
          </div>
          <div className="settings__control">
            <input
              className="field__input publish-settings__input"
              type="password"
              value={key}
              placeholder="sc_live_…"
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && key && void connect()}
              aria-label="Surecast API key"
              autoComplete="off"
              spellCheck={false}
            />
            <Button onClick={() => void connect()} disabled={!key.trim() || busy}>
              {busy ? "Checking…" : "Connect"}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="publish__error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
