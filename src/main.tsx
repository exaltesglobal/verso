import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/manrope"; // bundled locally, no CDN
import "./styles/verso-tokens.css"; // brand kit tokens: single source of styling
import "./styles/app.css";
import "./styles/account.css";
import "./styles/credits.css";
import "./styles/modes.css"; // Quick / Craft / Studio workspaces, one-tap edits
import "./styles/panels.css"; // simple panel structure: primary action, big choices, More settings
import "./styles/premium.css"; // premium shell: spec tokens and components, loaded last
import App from "./App";
import { AccountHost } from "./components/account/AccountHost";
import { CreditsHost } from "./components/credits/CreditsHost";
import { TooltipLayer } from "./components/Tooltip";
import { installCrashHandlers } from "./lib/crash";
import { CreditsProvider } from "./lib/credits";
import { EntitlementsProvider } from "./lib/entitlements";
import { BetaGate } from "./screens/BetaGate";

installCrashHandlers();

// macOS keeps its native traffic lights (tauri.macos.conf.json); CSS hides our window buttons there.
if (/Mac/i.test(navigator.platform)) document.documentElement.classList.add("is-mac");

// No browser context menu: text fields keep theirs, everything else uses Verso's own menus.
window.addEventListener("contextmenu", (e) => {
  const el = e.target as HTMLElement;
  if (!el.closest("input, textarea, [contenteditable='true']")) e.preventDefault();
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BetaGate>
      <EntitlementsProvider>
        <CreditsProvider>
          <App />
          <AccountHost />
          <CreditsHost />
          <TooltipLayer />
        </CreditsProvider>
      </EntitlementsProvider>
    </BetaGate>
  </React.StrictMode>,
);
