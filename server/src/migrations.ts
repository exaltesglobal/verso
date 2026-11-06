import type { Knex } from 'knex';

type Migration = { up: (k: Knex) => Promise<void>; down: (k: Knex) => Promise<void> };

const id = (t: Knex.CreateTableBuilder) => t.string('id', 36).primary();
const userFk = (t: Knex.CreateTableBuilder) =>
  t.string('user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');

export const migrations: Record<string, Migration> = {
  '001_initial': {
    async up(k) {
      await k.schema.createTable('users', (t) => {
        id(t);
        t.string('email', 254).notNullable().unique();
        t.string('name', 120);
        t.string('password_hash', 255);
        t.bigInteger('email_verified_at');
        t.bigInteger('created_at').notNullable();
        t.bigInteger('updated_at').notNullable();
      });

      // Browser sessions for the hosted pages (cookie holds a random id; we store its hash).
      await k.schema.createTable('sessions', (t) => {
        t.string('id_hash', 64).primary();
        userFk(t);
        t.bigInteger('expires_at').notNullable();
        t.bigInteger('created_at').notNullable();
        t.index(['user_id']);
      });

      // Desktop refresh tokens. Rotated on every use; reuse of a rotated token revokes the whole family.
      await k.schema.createTable('refresh_tokens', (t) => {
        id(t);
        userFk(t);
        t.string('token_hash', 64).notNullable().unique();
        t.string('family_id', 36).notNullable();
        t.string('device_id', 128);
        t.bigInteger('expires_at').notNullable();
        t.bigInteger('revoked_at');
        t.bigInteger('created_at').notNullable();
        t.index(['family_id']);
        t.index(['user_id']);
      });

      // One-time codes for the desktop loopback + PKCE flow.
      await k.schema.createTable('auth_codes', (t) => {
        t.string('code_hash', 64).primary();
        userFk(t);
        t.string('code_challenge', 128).notNullable();
        t.string('device_id', 128);
        t.string('device_name', 120);
        t.string('platform', 40);
        t.bigInteger('expires_at').notNullable();
        t.bigInteger('used_at');
        t.bigInteger('created_at').notNullable();
      });

      await k.schema.createTable('oauth_accounts', (t) => {
        id(t);
        userFk(t);
        t.string('provider', 32).notNullable();
        t.string('provider_user_id', 191).notNullable();
        t.string('email', 254);
        t.bigInteger('created_at').notNullable();
        t.unique(['provider', 'provider_user_id']);
      });

      await k.schema.createTable('email_tokens', (t) => {
        id(t);
        userFk(t);
        t.string('type', 16).notNullable(); // verify | reset
        t.string('token_hash', 64).notNullable().unique();
        t.bigInteger('expires_at').notNullable();
        t.bigInteger('used_at');
        t.bigInteger('created_at').notNullable();
      });

      await k.schema.createTable('subscriptions', (t) => {
        id(t);
        userFk(t);
        t.string('provider', 32).notNullable().defaultTo('razorpay');
        t.string('provider_subscription_id', 64).notNullable().unique();
        t.string('plan', 32).notNullable(); // pro_monthly | pro_yearly
        t.string('status', 32).notNullable(); // created | authenticated | active | pending | halted | cancelled | completed | expired
        t.bigInteger('current_end');
        t.string('short_url', 255);
        t.bigInteger('created_at').notNullable();
        t.bigInteger('updated_at').notNullable();
        t.index(['user_id']);
      });

      await k.schema.createTable('payments', (t) => {
        id(t);
        t.string('user_id', 36).references('id').inTable('users').onDelete('SET NULL');
        t.string('provider_payment_id', 64).notNullable().unique();
        t.string('provider_subscription_id', 64);
        t.integer('amount'); // smallest currency unit (paise)
        t.string('currency', 8);
        t.string('status', 32).notNullable();
        t.bigInteger('created_at').notNullable();
      });

      // Every processed webhook event id, for idempotency.
      await k.schema.createTable('webhook_events', (t) => {
        t.string('id', 128).primary();
        t.string('provider', 32).notNullable();
        t.string('type', 64).notNullable();
        t.bigInteger('received_at').notNullable();
      });

      await k.schema.createTable('devices', (t) => {
        id(t);
        userFk(t);
        t.string('device_id', 128).notNullable();
        t.string('name', 120);
        t.string('platform', 40);
        t.bigInteger('last_seen_at').notNullable();
        t.bigInteger('created_at').notNullable();
        t.unique(['user_id', 'device_id']);
      });
    },
    async down(k) {
      for (const table of [
        'devices',
        'webhook_events',
        'payments',
        'subscriptions',
        'email_tokens',
        'oauth_accounts',
        'auth_codes',
        'refresh_tokens',
        'sessions',
        'users',
      ]) {
        await k.schema.dropTableIfExists(table);
      }
    },
  },
  '002_crash_reports_invites': {
    async up(k) {
      // Anonymous crash reports from the desktop app: version, OS and stack only, no user id.
      await k.schema.createTable('crash_reports', (t) => {
        id(t);
        t.string('kind', 16).notNullable(); // panic | frontend
        t.string('app_version', 32);
        t.string('os', 16);
        t.string('arch', 16);
        t.text('message');
        t.text('stack');
        t.bigInteger('reported_at');
        t.bigInteger('created_at').notNullable();
        t.index(['app_version']);
      });

      // Closed beta invite codes, created with `pnpm invite:create`.
      await k.schema.createTable('invite_codes', (t) => {
        t.string('code', 32).primary();
        t.string('note', 120);
        t.integer('max_uses').notNullable().defaultTo(1);
        t.integer('uses').notNullable().defaultTo(0);
        t.bigInteger('expires_at');
        t.bigInteger('created_at').notNullable();
      });
    },
    async down(k) {
      await k.schema.dropTableIfExists('invite_codes');
      await k.schema.dropTableIfExists('crash_reports');
    },
  },
  '003_credits': {
    async up(k) {
      // Append-only. The balance row below is updated in the same transaction as every insert here.
      await k.schema.createTable('credit_ledger', (t) => {
        t.bigIncrements('id');
        userFk(t);
        t.integer('delta').notNullable();
        t.string('bucket', 16).notNullable(); // allowance | purchased
        t.string('kind', 16).notNullable(); // grant | debit | refund | reset | admin
        t.string('reason', 160);
        t.string('action', 40);
        t.string('ref', 160).notNullable(); // idempotency key, order id or reset id
        t.text('meta');
        t.bigInteger('created_at').notNullable();
        // A debit split across both buckets writes two rows with the same ref.
        t.unique(['user_id', 'kind', 'ref', 'bucket']);
        t.index(['user_id', 'id']);
      });

      await k.schema.createTable('credit_balances', (t) => {
        t.string('user_id', 36).primary().references('id').inTable('users').onDelete('CASCADE');
        t.integer('allowance').notNullable().defaultTo(0);
        t.integer('purchased').notNullable().defaultTo(0);
        t.string('plan', 16).notNullable().defaultTo('none'); // plan the allowance was granted for
        t.bigInteger('period_start').notNullable().defaultTo(0);
        t.bigInteger('period_end').notNullable().defaultTo(0);
        t.bigInteger('updated_at').notNullable();
        t.index(['period_end']);
      });

      // Razorpay one-time orders for top-up packs.
      await k.schema.createTable('credit_orders', (t) => {
        t.string('id', 64).primary(); // Razorpay order id
        userFk(t);
        t.string('pack_id', 32).notNullable();
        t.integer('credits').notNullable();
        t.integer('amount').notNullable(); // smallest currency unit
        t.string('currency', 8).notNullable();
        t.string('status', 16).notNullable(); // created | paid
        t.string('payment_id', 64);
        t.bigInteger('created_at').notNullable();
        t.bigInteger('paid_at');
        t.index(['user_id']);
      });
    },
    async down(k) {
      await k.schema.dropTableIfExists('credit_orders');
      await k.schema.dropTableIfExists('credit_balances');
      await k.schema.dropTableIfExists('credit_ledger');
    },
  },
  '004_admin': {
    async up(k) {
      await k.schema.alterTable('users', (t) => {
        t.bigInteger('blocked_at'); // set = account paused: no sign-in, refresh or API access
      });

      // One row per user. The plan override honours expires_at; feature/limit overrides stay until cleared.
      await k.schema.createTable('user_overrides', (t) => {
        t.string('user_id', 36).primary().references('id').inTable('users').onDelete('CASCADE');
        t.string('plan_override', 8); // pro | free | null
        t.bigInteger('expires_at');
        t.text('features'); // JSON {feature: boolean}
        t.text('limits'); // JSON {limit: number}
        t.string('note', 240);
        t.string('granted_by', 254);
        t.bigInteger('created_at').notNullable();
        t.bigInteger('updated_at').notNullable();
      });

      // Append-only record of every admin action.
      await k.schema.createTable('admin_audit', (t) => {
        t.bigIncrements('id');
        t.string('admin', 254).notNullable();
        t.string('action', 40).notNullable();
        t.string('target_user_id', 36);
        t.text('before');
        t.text('after');
        t.string('ip', 64);
        t.bigInteger('at').notNullable();
        t.index(['target_user_id']);
        t.index(['at']);
      });
    },
    async down(k) {
      await k.schema.dropTableIfExists('admin_audit');
      await k.schema.dropTableIfExists('user_overrides');
      await k.schema.alterTable('users', (t) => t.dropColumn('blocked_at'));
    },
  },
};
