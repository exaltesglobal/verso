import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/manrope"; // bundled locally, no CDN
import "./styles/verso-tokens.css"; // brand kit tokens: single source of styling
import "./styles/app.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
