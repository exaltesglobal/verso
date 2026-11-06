import './env.js';
import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { migrateLatest } from './db.js';

const config = loadConfig();
const { app, ctx } = await buildApp(config);

// SQLite dev databases migrate themselves; production runs `pnpm migrate:prod` explicitly.
if (config.DB_CLIENT === 'sqlite') await migrateLatest(ctx.db);

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    app.close().then(() => process.exit(0));
  });
}

await app.listen({ host: config.HOST, port: config.PORT });
app.log.info(
  {
    db: config.DB_CLIENT,
    email: config.RESEND_API_KEY ? 'resend' : 'console',
    google: config.googleConfigured,
    razorpay: config.razorpayConfigured,
  },
  `Verso server ready at ${config.PUBLIC_URL}`,
);
