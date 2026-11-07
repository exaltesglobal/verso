import knexFactory, { type Knex } from 'knex';
import type { Config } from './config.js';
import { migrations } from './migrations.js';

export type Db = Knex;

export function createDb(config: Config): Db {
  if (config.DB_CLIENT === 'sqlite') {
    return knexFactory({
      client: 'better-sqlite3',
      connection: { filename: config.SQLITE_FILE },
      useNullAsDefault: true,
      pool: {
        min: 1,
        max: 1,
        afterCreate: (conn: { pragma: (s: string) => void }, done: (err: Error | null, conn: unknown) => void) => {
          conn.pragma('foreign_keys = ON');
          done(null, conn);
        },
      },
    });
  }
  return knexFactory({
    client: 'mysql2',
    connection: {
      ...(config.DATABASE_URL
        ? { uri: config.DATABASE_URL }
        : {
            host: config.DB_HOST,
            port: config.DB_PORT,
            user: config.DB_USER,
            password: config.DB_PASSWORD,
            database: config.DB_NAME,
          }),
      charset: 'utf8mb4',
      timezone: 'Z',
      // bigint timestamps come back as JS numbers instead of strings
      supportBigNumbers: true,
      bigNumberStrings: false,
    } as Knex.MySql2ConnectionConfig,
    pool: { min: 0, max: 10 },
  });
}

// Migrations live in code (not a directory) so the same list runs from tsx in dev and from dist/ in production.
const migrationSource: Knex.MigrationSource<string> = {
  getMigrations: async () => Object.keys(migrations),
  getMigrationName: (name) => name,
  getMigration: async (name) => migrations[name]!,
};

export async function migrateLatest(db: Db) {
  return db.migrate.latest({ migrationSource });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isLockError = (err: unknown) =>
  err instanceof Error && /migration table is already locked/i.test(err.message);

/**
 * Apply pending migrations while tolerating other instances doing the same.
 * Hostinger starts several processes at once: whoever takes the knex lock
 * migrates, the others wait and retry. If the lock is still held after the
 * wait it is treated as stale (left by a killed process) and released once.
 */
export async function migrateLatestSafe(db: Db, log: (msg: string) => void = console.log) {
  try {
    return await migrateLatest(db);
  } catch (err) {
    if (!isLockError(err)) throw err;
    log('Migration table is locked by another instance; waiting 15s...');
    await sleep(15_000);
    try {
      return await migrateLatest(db);
    } catch (err2) {
      if (!isLockError(err2)) throw err2;
      log('Migration lock looks stale; releasing it and retrying once.');
      await db.migrate.forceFreeMigrationsLock();
      return await migrateLatest(db);
    }
  }
}

export async function migrateRollback(db: Db) {
  return db.migrate.rollback({ migrationSource });
}

/** Timestamps are stored as epoch milliseconds (bigint) so SQLite and MySQL behave the same. */
export const now = () => Date.now();
