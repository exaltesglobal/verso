import { readFile } from 'node:fs/promises';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  assertActive,
  authenticate,
  createUser,
  exchangeAuthCode,
  findUserById,
  issueTokens,
  registerDevice,
  resetPassword,
  revokeRefreshToken,
  rotateRefreshToken,
  sendResetEmail,
  verifyEmail,
} from './auth.js';
import { signEntitlementToken, uuid, verifyAccessToken } from './crypto.js';
import { ApiError, type Ctx } from './ctx.js';
import { now } from './db.js';
import { getEntitlements } from './plans.js';

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z.string().min(8, 'Use at least 8 characters.').max(200);
const device = {
  device_id: z.string().trim().min(8).max(128).optional(),
  device_name: z.string().trim().max(120).optional(),
  platform: z.string().trim().max(40).optional(),
};
const deviceOf = (b: { device_id?: string; device_name?: string; platform?: string }) => ({
  deviceId: b.device_id ?? null,
  deviceName: b.device_name ?? null,
  platform: b.platform ?? null,
});

const tokenBody = z.discriminatedUnion('grant_type', [
  z.object({ grant_type: z.literal('authorization_code'), code: z.string().min(10).max(200), code_verifier: z.string().min(43).max(128) }),
  z.object({ grant_type: z.literal('refresh_token'), refresh_token: z.string().min(10).max(200) }),
]);

/** The signed-in user (and device) from the `Authorization: Bearer` access token. */
export async function requireBearer(ctx: Ctx, req: FastifyRequest) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) throw new ApiError(401, 'unauthorized', 'Sign in required.');
  let claims;
  try {
    claims = await verifyAccessToken(ctx.keys, h.slice(7));
  } catch {
    throw new ApiError(401, 'invalid_token', 'Your session expired. Refresh your token.');
  }
  await assertActive(ctx, claims.userId);
  return claims;
}

export function apiRoutes(ctx: Ctx) {
  return async function (app: FastifyInstance) {
    const authLimit = { rateLimit: { max: ctx.config.AUTH_RATE_LIMIT_PER_MINUTE, timeWindow: '1 minute' } };

    const bearer = (req: FastifyRequest) => requireBearer(ctx, req);

    app.post('/v1/auth/signup', { config: authLimit }, async (req, reply) => {
      const b = z.object({ email: emailSchema, password: passwordSchema, name: z.string().trim().max(120).optional(), ...device }).parse(req.body);
      const user = await createUser(ctx, b);
      await registerDevice(ctx, user.id, deviceOf(b));
      return reply.code(201).send({ user: publicUser(user), ...(await issueTokens(ctx, user.id, b.device_id ?? null)) });
    });

    app.post('/v1/auth/login', { config: authLimit }, async (req) => {
      const b = z.object({ email: emailSchema, password: z.string().min(1).max(200), ...device }).parse(req.body);
      const user = await authenticate(ctx, b.email, b.password);
      await registerDevice(ctx, user.id, deviceOf(b));
      return { user: publicUser(user), ...(await issueTokens(ctx, user.id, b.device_id ?? null)) };
    });

    // OAuth-style token endpoint: exchanges the desktop one-time code (PKCE S256) or rotates a refresh token.
    app.post('/v1/auth/token', { config: authLimit }, async (req) => {
      const b = tokenBody.parse(req.body);
      return b.grant_type === 'authorization_code' ? exchangeAuthCode(ctx, b.code, b.code_verifier) : rotateRefreshToken(ctx, b.refresh_token);
    });

    app.post('/v1/auth/logout', async (req, reply) => {
      const b = z.object({ refresh_token: z.string().min(10).max(200) }).parse(req.body);
      await revokeRefreshToken(ctx, b.refresh_token);
      return reply.code(204).send();
    });

    app.post('/v1/auth/forgot-password', { config: authLimit }, async (req, reply) => {
      const b = z.object({ email: emailSchema }).parse(req.body);
      await sendResetEmail(ctx, b.email);
      return reply.code(202).send({ ok: true, message: 'If that email has an account, we sent a reset link.' });
    });

    app.post('/v1/auth/reset-password', { config: authLimit }, async (req) => {
      const b = z.object({ token: z.string().min(10).max(200), password: passwordSchema }).parse(req.body);
      await resetPassword(ctx, b.token, b.password);
      return { ok: true };
    });

    app.post('/v1/auth/verify-email', { config: authLimit }, async (req) => {
      const b = z.object({ token: z.string().min(10).max(200) }).parse(req.body);
      await verifyEmail(ctx, b.token);
      return { ok: true };
    });

    app.get('/v1/me', async (req) => {
      const { userId } = await bearer(req);
      const user = await findUserById(ctx, userId);
      if (!user) throw new ApiError(401, 'unauthorized', 'Sign in required.');
      return { user: publicUser(user) };
    });

    app.get('/v1/me/entitlements', async (req) => {
      const { userId, deviceId } = await bearer(req);
      const ent = await getEntitlements(ctx.db, userId);
      const claims = { plan: ent.plan, features: ent.features, limits: ent.limits, expiresAt: ent.expiresAt };
      const offlineToken = await signEntitlementToken(ctx.keys, ctx.config, userId, { ent: claims }, deviceId);
      return { ...claims, billingPlan: ent.billingPlan, status: ent.status, offlineToken, offlineValidDays: ctx.config.OFFLINE_ENTITLEMENT_DAYS };
    });

    app.get('/v1/me/devices', async (req) => {
      const { userId, deviceId } = await bearer(req);
      const rows = await ctx.db('devices').where({ user_id: userId }).orderBy('last_seen_at', 'desc');
      return {
        devices: rows.map((d) => ({ name: d.name, platform: d.platform, lastSeenAt: Number(d.last_seen_at), current: d.device_id === deviceId })),
      };
    });

    // Anonymous crash reports from the desktop app (sent only after the user agrees). No auth, rate limited.
    app.post('/v1/crash-reports', { config: { rateLimit: { max: 30, timeWindow: '1 hour' } } }, async (req, reply) => {
      const b = z
        .object({
          kind: z.enum(['panic', 'frontend']),
          appVersion: z.string().max(32).optional(),
          os: z.string().max(16).optional(),
          arch: z.string().max(16).optional(),
          message: z.string().max(16_000).default(''),
          stack: z.string().max(16_000).default(''),
          createdAt: z.number().int().nonnegative().optional(),
        })
        .parse(req.body);
      await ctx.db('crash_reports').insert({
        id: uuid(),
        kind: b.kind,
        app_version: b.appVersion ?? null,
        os: b.os ?? null,
        arch: b.arch ?? null,
        message: b.message,
        stack: b.stack,
        reported_at: b.createdAt ?? null,
        created_at: now(),
      });
      return reply.code(204).send();
    });

    // Closed beta: checks an invite code and uses up one of its seats.
    app.post('/v1/beta/redeem', { config: authLimit }, async (req) => {
      const { code } = z.object({ code: z.string().trim().toUpperCase().min(4).max(32) }).parse(req.body);
      const used = await ctx
        .db('invite_codes')
        .where({ code })
        .andWhere('uses', '<', ctx.db.ref('max_uses'))
        .andWhere((q) => q.whereNull('expires_at').orWhere('expires_at', '>', now()))
        .increment('uses', 1);
      if (!used) throw new ApiError(404, 'invalid_invite', "That invite code isn't valid or has been used up.");
      return { ok: true };
    });

    // Tauri updater endpoint: /updates/{{target}}/{{arch}}/{{current_version}}. Reads the latest.json that
    // tauri-action attaches to each release (copy it to UPDATES_MANIFEST). 204 means "no update".
    app.get('/updates/:target/:arch/:current', async (req, reply) => {
      const p = req.params as { target: string; arch: string; current: string };
      let manifest: { version: string; notes?: string; pub_date?: string; platforms: Record<string, { url: string; signature: string }> };
      try {
        manifest = JSON.parse(await readFile(ctx.config.UPDATES_MANIFEST, 'utf8'));
      } catch {
        return reply.code(204).send();
      }
      const key = `${p.target}-${p.arch}`;
      const platform = manifest.platforms?.[key] ?? manifest.platforms?.[`${key}-nsis`];
      if (!platform || !isNewer(manifest.version, p.current)) return reply.code(204).send();
      return { version: manifest.version, notes: manifest.notes ?? '', pub_date: manifest.pub_date, url: platform.url, signature: platform.signature };
    });

    // Public key the desktop app pins to verify offline entitlement tokens.
    const jwks = async () => ({ keys: [ctx.keys.entPublicJwk] });
    app.get('/.well-known/jwks.json', jwks);
    app.get('/v1/entitlements/public-key', jwks);
  };
}

/** True when semver `a` is greater than `b` (pre-release tags ignored). */
function isNewer(a: string, b: string) {
  const pa = a.replace(/^v/, '').split(/[.-]/).map((n) => parseInt(n, 10) || 0);
  const pb = b.replace(/^v/, '').split(/[.-]/).map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) > (pb[i] ?? 0);
  return false;
}

export const publicUser = (u: { id: string; email: string; name: string | null; email_verified_at: number | null }) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  emailVerified: Boolean(u.email_verified_at),
});
