import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import Fastify, { type FastifyError } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import type { Config } from './config.js';
import { loadKeys } from './crypto.js';
import { ApiError, type Ctx } from './ctx.js';
import { createDb, type Db } from './db.js';
import { creditsPricing } from './credits.js';
import { createMailer, type Mailer } from './mailer.js';
import { apiRoutes } from './routes-api.js';
import { creditsRoutes } from './routes-credits.js';
import { pageRoutes } from './routes-pages.js';
import { webhookRoutes } from './routes-webhooks.js';
import { CREDITS_CHECKOUT_JS, CSS } from './views.js';

const require = createRequire(import.meta.url);
const fontFile = require.resolve('@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2');

export async function buildApp(config: Config, overrides: { db?: Db; mailer?: Mailer } = {}) {
  creditsPricing(config); // fail fast on a malformed CREDITS_COSTS / CREDITS_PACKS
  const app = Fastify({
    trustProxy: config.TRUST_PROXY,
    bodyLimit: 256 * 1024,
    logger: {
      level: config.NODE_ENV === 'test' ? 'silent' : config.LOG_LEVEL,
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]', '*.password', '*.refresh_token', '*.token'],
        censor: '[redacted]',
      },
    },
  });

  const db = overrides.db ?? createDb(config);
  const ctx: Ctx = {
    db,
    config,
    keys: await loadKeys(config),
    mailer: overrides.mailer ?? createMailer(config, app.log),
  };
  app.addHook('onClose', async () => {
    if (!overrides.db) await db.destroy();
  });

  const https = config.PUBLIC_URL.startsWith('https://');
  await app.register(helmet, {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        // Form posts may redirect to Razorpay checkout or to the desktop app's loopback listener.
        formAction: ["'self'", 'http://127.0.0.1:*', 'https://rzp.io', 'https://*.razorpay.com', 'https://accounts.google.com'],
        upgradeInsecureRequests: https ? [] : null,
      },
    },
    strictTransportSecurity: https ? undefined : false,
  });
  await app.register(cors, { origin: config.corsOrigins, credentials: false });
  await app.register(cookie);
  await app.register(formbody);
  await app.register(rateLimit, { global: false });

  app.setErrorHandler((err: FastifyError | ApiError | ZodError, req, reply) => {
    if (err instanceof ApiError) return reply.code(err.status).send({ error: err.code, message: err.message });
    if (err instanceof ZodError) {
      return reply.code(400).send({ error: 'invalid_request', message: err.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ') });
    }
    const status = (err as FastifyError).statusCode ?? 500;
    if (status >= 500) req.log.error({ err }, 'unhandled error');
    return reply.code(status).send({
      error: status === 429 ? 'rate_limited' : status >= 500 ? 'server_error' : 'bad_request',
      message: status === 429 ? 'Too many attempts. Please wait a minute and try again.' : status >= 500 ? 'Something went wrong on our side.' : err.message,
    });
  });

  app.get('/healthz', async () => {
    await db.raw('select 1');
    return { ok: true };
  });

  const font = readFileSync(fontFile);
  app.get('/assets/manrope.woff2', (_req, reply) =>
    reply.header('Cache-Control', 'public, max-age=31536000, immutable').type('font/woff2').send(font),
  );
  app.get('/assets/app.css', (_req, reply) => reply.header('Cache-Control', 'public, max-age=3600').type('text/css').send(CSS));

  app.get('/assets/credits-checkout.js', (_req, reply) =>
    reply.header('Cache-Control', 'public, max-age=3600').type('text/javascript').send(CREDITS_CHECKOUT_JS),
  );

  await app.register(apiRoutes(ctx));
  await app.register(creditsRoutes(ctx));
  await app.register(webhookRoutes(ctx));
  await app.register(pageRoutes(ctx));
  return { app, ctx };
}
