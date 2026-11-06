import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/manrope"; // bundled locally, no CDN
import "./styles/verso-tokens.css"; // brand kit tokens: single source of styling
import "./styles/app.css";
import "./styles/account.css";
import App from "./App";
import { AccountHost } from "./components/account/AccountHost";
import { installCrashHandlers } from "./lib/crash";
import { EntitlementsProvider } from "./lib/entitlements";
import { BetaGate } from "./screens/BetaGate";

installCrashHandlers();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BetaGate>
      <EntitlementsProvider>
        <App />
        <AccountHost />
      </EntitlementsProvider>
    </BetaGate>
  </React.StrictMode>,
);
