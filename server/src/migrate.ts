import './env.js';
import { loadConfig } from './config.js';
import { createDb, migrateLatest, migrateRollback } from './db.js';

const config = loadConfig();
const db = createDb(config);
try {
  const rollback = process.argv.includes('--rollback');
  const [batch, names] = rollback ? await migrateRollback(db) : await migrateLatest(db);
  console.log(
    names.length
      ? `${rollback ? 'Rolled back' : 'Applied'} batch ${batch}: ${names.join(', ')}`
      : 'Database is already up to date.',
  );
} catch (err) {
  console.error('Migration failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
