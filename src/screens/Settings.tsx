import { useEffect, useState, type ReactNode } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { open } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";
import { AccountDetails } from "../components/account/AccountPanel";
import { Button, Segmented, Toggle } from "../components/ui";
import type { ExportQuality } from "../lib/export";
import { updateSettings, useSettings } from "../lib/settings";
import { checkForUpdates, installUpdate } from "../lib/updates";

const QUALITY: Record<string, ExportQuality> = { Draft: "draft", Standard: "standard", High: "high" };
const QUALITY_LABELS = Object.keys(QUALITY);
const LANGUAGES: [string, string][] = [
  ["auto", "Detect automatically"],
  ["en", "English"],
  ["hi", "Hindi"],
  ["es", "Spanish"],
  ["pt", "Portuguese"],
  ["fr", "French"],
  ["de", "German"],
  ["ar", "Arabic"],
  ["id", "Indonesian"],
  ["ja", "Japanese"],
];
const LICENCES: [string, string, string][] = [
  ["Tauri", "MIT or Apache-2.0", "https://github.com/tauri-apps/tauri"],
  ["React", "MIT", "https://github.com/facebook/react"],
  ["Manrope font", "SIL Open Font License 1.1", "https://github.com/sharanda/manrope"],
  ["keyring", "MIT or Apache-2.0", "https://github.com/hwchen/keyring-rs"],
  ["ureq", "MIT or Apache-2.0", "https://github.com/algesten/ureq"],
  ["jsonwebtoken", "MIT", "https://github.com/Keats/jsonwebtoken"],
  ["Serde", "MIT or Apache-2.0", "https://github.com/serde-rs/serde"],
];

const link = (url: string) => () => void openUrl(url).catch(() => {});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="settings__section">
      <h2 className="settings__heading">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="settings__row">
      <div>
        <div className="settings__label">{label}</div>
        {hint && <div className="settings__hint">{hint}</div>}
      </div>
      <div className="settings__control">{children}</div>
    </div>
  );
}

/** Full-screen settings, opened from the Welcome settings icon. */
export function Settings({ onClose }: { onClose: () => void }) {
  const s = useSettings();
  const [version, setVersion] = useState("0.1.0");
  const [update, setUpdate] = useState<{ text: string; version?: string } | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => {});
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const check = async () => {
    setChecking(true);
    try {
      const u = await checkForUpdates();
      if (!u.configured) setUpdate({ text: "Updates aren't set up for this build yet." });
      else if (u.version) setUpdate({ text: `Version ${u.version} is ready.`, version: u.version });
      else setUpdate({ text: "You're on the latest version." });
    } catch (e) {
      setUpdate({ text: String(e) });
    } finally {
      setChecking(false);
    }
  };

  const pickFolder = async () => {
    const dir = await open({ directory: true, title: "Choose where exports go" }).catch(() => null);
    if (typeof dir === "string") updateSettings({ exportFolder: dir });
  };

  const qualityLabel = QUALITY_LABELS.find((k) => QUALITY[k] === s.exportQuality) ?? "High";

  return (
    <div className="settings" role="dialog" aria-modal="true" aria-label="Settings">
      <header className="settings__bar">
        <h1 className="settings__title">Settings</h1>
        <Button onClick={onClose}>Done</Button>
      </header>

      <div className="settings__body">
        <Section title="Account">
          <AccountDetails />
        </Section>

        <Section title="Exports">
          <Row label="Default quality" hint="Higher quality makes bigger files.">
            <Segmented
              label="Default export quality"
              options={QUALITY_LABELS}
              value={qualityLabel}
              onChange={(v) => updateSettings({ exportQuality: QUALITY[v] })}
            />
          </Row>
          <Row label="Save exports to" hint={s.exportFolder || "We'll ask every time."}>
            <Button icon="folder" onClick={pickFolder}>
              Choose folder
            </Button>
            {s.exportFolder && (
              <Button variant="ghost" onClick={() => updateSettings({ exportFolder: "" })}>
                Ask every time
              </Button>
            )}
          </Row>
        </Section>

        <Section title="Captions">
          <Row label="Default language" hint="The language people speak in your videos.">
            <select
              className="field__input settings__select"
              value={s.captionLanguage}
              onChange={(e) => updateSettings({ captionLanguage: e.target.value })}
              aria-label="Default caption language"
            >
              {LANGUAGES.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </Row>
        </Section>

        <Section title="Performance">
          <Row
            label="Use the graphics card"
            hint="Faster previews and exports. Turn off if you see glitches."
          >
            <Toggle
              label="Use the graphics card"
              checked={s.gpu}
              onChange={(gpu) => updateSettings({ gpu })}
            />
          </Row>
        </Section>

        <Section title="Updates">
          <Row label="Update automatically" hint="We'll let you know when a new version is ready.">
            <Toggle
              label="Update automatically"
              checked={s.autoUpdate}
              onChange={(autoUpdate) => updateSettings({ autoUpdate })}
            />
          </Row>
          <Row label={`Verso ${version}`} hint={update?.text}>
            {update?.version ? (
              <Button onClick={() => installUpdate().catch((e) => setUpdate({ text: String(e) }))}>
                Restart to update
              </Button>
            ) : (
              <Button onClick={check} disabled={checking}>
                {checking ? "Checking…" : "Check now"}
              </Button>
            )}
          </Row>
        </Section>

        <Section title="About and licences">
          <p className="settings__text">
            Verso {version} beta. Developed by Agape Labs, Exaltes Global Private Limited.
          </p>
          <p className="settings__text">
            Verso uses <strong>FFmpeg</strong>, licensed under the GNU Lesser General Public License (LGPL)
            version 2.1 or later. FFmpeg is not modified, and runs as a separate program you can replace. Its
            licence ships in the app's licences folder.{" "}
            <button type="button" className="settings__link" onClick={link("https://ffmpeg.org/legal.html")}>
              FFmpeg licence
            </button>{" "}
            ·{" "}
            <button
              type="button"
              className="settings__link"
              onClick={link("https://github.com/BtbN/FFmpeg-Builds")}
            >
              Source code for the build we ship
            </button>
          </p>
          <h3 className="settings__subheading">Open-source software</h3>
          <ul className="settings__licences">
            {LICENCES.map(([name, licence, url]) => (
              <li key={name}>
                <button type="button" className="settings__link" onClick={link(url)}>
                  {name}
                </button>
                <span className="settings__hint">{licence}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
