import { z } from 'zod';

const bool = z
  .string()
  .optional()
  .transform((v) => v === '1' || v === 'true');
const opt = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() ? v.trim() : undefined));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().default(8787),
  PUBLIC_URL: z.string().url().default('http://localhost:8787'),
  CORS_ORIGINS: z.string().default('http://localhost:1420,tauri://localhost,http://tauri.localhost'),
  TRUST_PROXY: bool,
  LOG_LEVEL: z.string().default('info'),

  DB_CLIENT: z.enum(['sqlite', 'mysql']).default('sqlite'),
  SQLITE_FILE: z.string().default('./verso-dev.sqlite'),
  DATABASE_URL: opt,
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().default(3306),
  DB_USER: opt,
  DB_PASSWORD: opt,
  DB_NAME: opt,

  JWT_SECRET: opt,
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().default(30),
  SESSION_TTL_DAYS: z.coerce.number().int().default(30),
  ENTITLEMENT_PRIVATE_KEY: opt,
  ENTITLEMENT_PUBLIC_KEY: opt,
  OFFLINE_ENTITLEMENT_DAYS: z.coerce.number().int().default(7),

  AUTH_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().default(20),

  RESEND_API_KEY: opt,
  // SMTP (e.g. Hostinger mail: smtp.hostinger.com, port 465). Used instead of Resend when SMTP_HOST is set.
  SMTP_HOST: opt,
  SMTP_PORT: z.coerce.number().int().default(465),
  SMTP_USER: opt,
  SMTP_PASS: opt,
  EMAIL_FROM: z.string().default('Verso <no-reply@example.com>'),

  GOOGLE_CLIENT_ID: opt,
  GOOGLE_CLIENT_SECRET: opt,

  RAZORPAY_KEY_ID: opt,
  RAZORPAY_KEY_SECRET: opt,
  RAZORPAY_WEBHOOK_SECRET: opt,
  RAZORPAY_PLAN_PRO_MONTHLY: opt,
  RAZORPAY_PLAN_PRO_YEARLY: opt,
  PRICE_LABEL_PRO_MONTHLY: z.string().default('₹499 / month'),
  PRICE_LABEL_PRO_YEARLY: z.string().default('₹4,999 / year'),

  UPDATES_MANIFEST: z.string().default('./updates/latest.json'),

  /** Comma-separated emails that may open /admin (they must sign in with a verified email). */
  ADMIN_EMAILS: z.string().default(''),

  // AI credits. Every number is tunable here; the app reads them from GET /v1/credits/pricing.
  CREDITS_FREE_MONTHLY: z.coerce.number().int().min(0).default(30),
  CREDITS_PRO_MONTHLY: z.coerce.number().int().min(0).default(1000),
  /** Overrides for action costs, e.g. "auto_cut=4,captions=2". Unlisted actions keep their defaults. */
  CREDITS_COSTS: opt,
  /** Top-up packs as credits:inrPaise[:usdCents], comma-separated. */
  CREDITS_PACKS: z.string().default('300:19900:299,1000:54900:799,3000:144900:1999'),
  CREDITS_TOPUP_FOR_FREE: z
    .string()
    .optional()
    .transform((v) => v === undefined || v === '' || v === '1' || v === 'true'),
  /** Credits the desktop app may spend offline before it has to sync. */
  CREDITS_OFFLINE_BUFFER: z.coerce.number().int().min(0).default(50),
  /** How often the server checks for monthly allowance resets. 0 turns the in-process job off (use cron). */
  CREDITS_RESET_INTERVAL_MINUTES: z.coerce.number().int().min(0).default(60),
});

export type Config = z.infer<typeof schema> & {
  isProd: boolean;
  secureCookies: boolean;
  corsOrigins: string[];
  googleConfigured: boolean;
  razorpayConfigured: boolean;
  /** One-time credit orders need only the key pair, not the subscription plan ids. */
  razorpayOrdersConfigured: boolean;
  adminEmails: string[];
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  }
  const c = parsed.data;
  const isProd = c.NODE_ENV === 'production';
  if (isProd) {
    const missing = (['JWT_SECRET', 'ENTITLEMENT_PRIVATE_KEY', 'ENTITLEMENT_PUBLIC_KEY'] as const).filter((k) => !c[k]);
    if (missing.length) throw new Error(`Missing required production env vars: ${missing.join(', ')}`);
    if ((c.JWT_SECRET ?? '').length < 32) throw new Error('JWT_SECRET must be at least 32 characters');
  }
  return {
    ...c,
    isProd,
    secureCookies: c.PUBLIC_URL.startsWith('https://'),
    corsOrigins: c.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
    googleConfigured: Boolean(c.GOOGLE_CLIENT_ID && c.GOOGLE_CLIENT_SECRET),
    razorpayConfigured: Boolean(
      c.RAZORPAY_KEY_ID && c.RAZORPAY_KEY_SECRET && c.RAZORPAY_PLAN_PRO_MONTHLY && c.RAZORPAY_PLAN_PRO_YEARLY,
    ),
    razorpayOrdersConfigured: Boolean(c.RAZORPAY_KEY_ID && c.RAZORPAY_KEY_SECRET),
    adminEmails: c.ADMIN_EMAILS.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
  };
}
