// Pauses an account (or with --unblock, turns it back on). Logged in admin_audit as "cli".
// Usage: pnpm admin:block <email> [--unblock]
import './env.js';
import { findUser, setBlocked } from './admin.js';
import { loadConfig } from './config.js';
import { createDb } from './db.js';

const args = process.argv.slice(2);
const email = args.find((a) => a.includes('@')) ?? '';
const unblock = args.includes('--unblock');
if (!email) {
  console.error('Usage: pnpm admin:block <email> [--unblock]');
  process.exit(1);
}

const config = loadConfig();
const db = createDb(config);
try {
  const user = await findUser(db, email);
  await setBlocked({ db, config }, { admin: 'cli', ip: null }, user.id, !unblock);
  console.log(unblock ? `${user.email} can sign in again.` : `${user.email} is paused. The app stops at its next check-in.`);
} catch (err) {
  console.error('Could not update the account:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
