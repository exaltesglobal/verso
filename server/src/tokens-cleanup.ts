// Deletes expired or spent sign-in rows so the auth tables stay small. For a Hostinger cron job, e.g. daily:
//   cd ~/verso-server && node dist/tokens-cleanup.js
// Rows are kept for a week after they expire or are used, so recent sign-in problems can still be looked into.
import './env.js';
import { loadConfig } from './config.js';
import { createDb, now } from './db.js';

const KEEP_MS = 7 * 24 * 60 * 60 * 1000;

const config = loadConfig();
const db = createDb(config);
try {
  const cutoff = now() - KEEP_MS;
  const sessions = await db('sessions').where('expires_at', '<', cutoff).del();
  // Revoked rows stay until they expire: reuse detection needs them to revoke the whole family.
  const refresh = await db('refresh_tokens').where('expires_at', '<', cutoff).del();
  const codes = await db('auth_codes').where('expires_at', '<', cutoff).orWhere('used_at', '<', cutoff).del();
  const email = await db('email_tokens').where('expires_at', '<', cutoff).orWhere('used_at', '<', cutoff).del();
  console.log(`Removed ${sessions} sessions, ${refresh} refresh tokens, ${codes} sign-in codes, ${email} email links.`);
} catch (err) {
  console.error('Token cleanup failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
