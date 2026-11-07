import './env.js';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { resetDue } from './credits.js';
import { migrateLatest, migrateLatestSafe } from './db.js';

const config = loadConfig();
const { app, ctx } = await buildApp(config);

// SQLite dev databases migrate themselves; production runs `pnpm migrate:prod` explicitly.
if (config.DB_CLIENT === 'sqlite') await migrateLatest(ctx.db);

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    app.close().then(() => process.exit(0));
  });
}

// Monthly allowance resets. Balances also reset lazily on first use, so a missed run only delays history rows.
if (config.CREDITS_RESET_INTERVAL_MINUTES > 0) {
  const tick = () =>
    resetDue(ctx.db, config)
      .then((n) => n && app.log.info({ count: n }, 'credit allowances reset'))
      .catch((err) => app.log.error({ err }, 'credit reset failed'));
  setInterval(tick, config.CREDITS_RESET_INTERVAL_MINUTES * 60_000).unref();
}

await app.listen({ host: config.HOST, port: config.PORT });

// Production migrates AFTER listen: Hostinger kills a process that has not
// called listen() within 3 seconds, which left a half-applied migration once.
// Set SKIP_MIGRATE_ON_START=1 when migrations are run from a shell instead.
if (config.DB_CLIENT !== 'sqlite' && process.env.SKIP_MIGRATE_ON_START !== '1') {
  migrateLatestSafe(ctx.db, (m) => app.log.info(m))
    .then(([batch, names]) =>
      app.log.info(names.length ? `Applied migration batch ${batch}: ${names.join(', ')}` : 'Database is up to date'),
    )
    .catch((err) => app.log.error({ err }, 'Migrations failed; fix the database and restart'));
}
app.log.info(
  {
    db: config.DB_CLIENT,
    email: config.SMTP_HOST ? 'smtp' : config.RESEND_API_KEY ? 'resend' : 'console',
    google: config.googleConfigured,
    razorpay: config.razorpayConfigured,
  },
  `Verso server ready at ${config.PUBLIC_URL}`,
);
