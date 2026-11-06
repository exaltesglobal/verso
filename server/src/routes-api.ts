import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
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
import { signEntitlementToken, verifyAccessToken } from './crypto.js';
import { ApiError, type Ctx } from './ctx.js';
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

export function apiRoutes(ctx: Ctx) {
  return async function (app: FastifyInstance) {
    const authLimit = { rateLimit: { max: ctx.config.AUTH_RATE_LIMIT_PER_MINUTE, timeWindow: '1 minute' } };

    async function bearer(req: FastifyRequest) {
      const h = req.headers.authorization;
      if (!h?.startsWith('Bearer ')) throw new ApiError(401, 'unauthorized', 'Sign in required.');
      try {
        return await verifyAccessToken(ctx.keys, h.slice(7));
      } catch {
        throw new ApiError(401, 'invalid_token', 'Your session expired. Refresh your token.');
      }
    }

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

    // Public key the desktop app pins to verify offline entitlement tokens.
    const jwks = async () => ({ keys: [ctx.keys.entPublicJwk] });
    app.get('/.well-known/jwks.json', jwks);
    app.get('/v1/entitlements/public-key', jwks);
  };
}

export const publicUser = (u: { id: string; email: string; name: string | null; email_verified_at: number | null }) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  emailVerified: Boolean(u.email_verified_at),
});
