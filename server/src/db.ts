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

export async function migrateRollback(db: Db) {
  return db.migrate.rollback({ migrationSource });
}

/** Timestamps are stored as epoch milliseconds (bigint) so SQLite and MySQL behave the same. */
export const now = () => Date.now();
