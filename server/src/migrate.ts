import './env.js';
import { loadConfig } from './config.js';
import { createDb, migrateLatest, migrateRollback } from './db.js';

const config = loadConfig();
const db = createDb(config);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isLockError = (err: unknown) =>
  err instanceof Error && /migration table is already locked/i.test(err.message);

try {
  const rollback = process.argv.includes('--rollback');
  let result: [number, string[]];
  if (rollback) {
    result = await migrateRollback(db);
  } else {
    try {
      result = await migrateLatest(db);
    } catch (err) {
      if (!isLockError(err)) throw err;
      // Another instance may be migrating right now: give it a moment, then retry.
      console.log('Migration table is locked; waiting 5s and retrying...');
      await sleep(5000);
      try {
        result = await migrateLatest(db);
      } catch (err2) {
        if (!isLockError(err2)) throw err2;
        // Still locked after the wait: the lock is stale (a previous run was killed mid-migration).
        console.log('Lock is stale; releasing it and retrying once more.');
        await db.migrate.forceFreeMigrationsLock();
        result = await migrateLatest(db);
      }
    }
  }
  const [batch, names] = result;
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
