// Loads server/.env (if present) into process.env before config is read. Real env vars win.
try {
  process.loadEnvFile();
} catch {
  // no .env file: rely on the environment (Hostinger hPanel sets variables directly)
}
