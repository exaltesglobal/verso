// Creates closed-beta invite codes and prints them.
// Usage: pnpm invite:create [count=1] [maxUses=1] [note]
import './env.js';
import { randomBytes } from 'node:crypto';
import { loadConfig } from './config.js';
import { createDb, now } from './db.js';

const [count = '1', maxUses = '1', ...noteParts] = process.argv.slice(2);
const n = Math.max(1, Math.min(500, parseInt(count, 10) || 1));
const uses = Math.max(1, parseInt(maxUses, 10) || 1);
// No 0/O/1/I so codes are easy to read aloud.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const part = () => Array.from(randomBytes(4), (b) => ALPHABET[b % ALPHABET.length]).join('');

const db = createDb(loadConfig());
try {
  const rows = Array.from({ length: n }, () => ({
    code: `VERSO-${part()}-${part()}`,
    note: noteParts.join(' ').slice(0, 120) || null,
    max_uses: uses,
    uses: 0,
    created_at: now(),
  }));
  await db('invite_codes').insert(rows);
  console.log(rows.map((r) => r.code).join('\n'));
  console.log(`\nCreated ${n} code${n === 1 ? '' : 's'}, ${uses} use${uses === 1 ? '' : 's'} each.`);
} catch (err) {
  console.error('Could not create invite codes:', err instanceof Error ? err.message : err, '\nRun `pnpm migrate` first.');
  process.exitCode = 1;
} finally {
  await db.destroy();
}
