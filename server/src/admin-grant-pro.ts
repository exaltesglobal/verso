// Gives someone Pro for free, for a number of days or with no end date. Logged in admin_audit as "cli".
// Usage: pnpm admin:grant-pro <email> [days]
import './env.js';
import { findUser, grantPro } from './admin.js';
import { loadConfig } from './config.js';
import { createDb } from './db.js';

const [email = '', daysArg] = process.argv.slice(2);
const days = daysArg ? parseInt(daysArg, 10) : null;
if (!email.includes('@') || (daysArg && !(days! > 0))) {
  console.error('Usage: pnpm admin:grant-pro <email> [days]');
  process.exit(1);
}

const config = loadConfig();
const db = createDb(config);
try {
  const user = await findUser(db, email);
  const o = await grantPro({ db, config }, { admin: 'cli', ip: null }, user.id, days, 'Granted from the command line');
  console.log(`${user.email} now has Pro ${o?.expires_at ? `until ${new Date(o.expires_at).toISOString().slice(0, 10)}` : 'with no end date'}.`);
} catch (err) {
  console.error('Could not grant Pro:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
