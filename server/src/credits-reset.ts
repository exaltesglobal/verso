// Resets monthly credit allowances whose period has ended. For a Hostinger cron job, e.g. hourly:
//   cd ~/verso-server && node dist/credits-reset.js
import './env.js';
import { loadConfig } from './config.js';
import { resetDue } from './credits.js';
import { createDb } from './db.js';

const config = loadConfig();
const db = createDb(config);
try {
  console.log(`Reset ${await resetDue(db, config)} credit allowance(s).`);
} catch (err) {
  console.error('Credit reset failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
