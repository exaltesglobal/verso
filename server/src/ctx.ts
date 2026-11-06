import type { Config } from './config.js';
import type { Keys } from './crypto.js';
import type { Db } from './db.js';
import type { Mailer } from './mailer.js';

export type Ctx = { db: Db; config: Config; keys: Keys; mailer: Mailer };

/** Errors that are safe to show to the client. `code` is stable for the desktop app to switch on. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
