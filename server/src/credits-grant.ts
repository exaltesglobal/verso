// Gives (or with a negative amount, takes back) purchased credits. They never expire.
// Usage: pnpm credits:grant <email> <amount> <note>
import './env.js';
import { loadConfig } from './config.js';
import { getBalance, grantPurchased } from './credits.js';
import { uuid } from './crypto.js';
import { createDb } from './db.js';

const [email = '', amountArg = '', ...noteParts] = process.argv.slice(2);
const amount = parseInt(amountArg, 10);
const note = noteParts.join(' ').trim() || 'Added by Verso support';
if (!email.includes('@') || !Number.isInteger(amount) || amount === 0) {
  console.error('Usage: pnpm credits:grant <email> <amount> <note>');
  process.exit(1);
}

const config = loadConfig();
const db = createDb(config);
try {
  const user = await db('users').where({ email: email.trim().toLowerCase() }).first('id');
  if (!user) throw new Error(`No account with the email ${email}`);
  await db.transaction((trx) => grantPurchased(trx, config, user.id, amount, 'admin', note, `admin:${uuid()}`));
  const b = await getBalance(db, config, user.id);
  console.log(`${amount > 0 ? 'Added' : 'Removed'} ${Math.abs(amount)} credits. ${email} now has ${b.total} (${b.allowance} monthly + ${b.purchased} purchased).`);
} catch (err) {
  console.error('Could not grant credits:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
