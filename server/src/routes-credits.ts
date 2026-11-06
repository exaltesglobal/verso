import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { findUserById } from './auth.js';
import { ACTIONS, createOrder, creditsPricing, debit, getBalance, history, reconcile, refund } from './credits.js';
import { signEntitlementToken } from './crypto.js';
import { ApiError, type Ctx } from './ctx.js';
import { requireBearer } from './routes-api.js';

const key = z.string().trim().min(8).max(128);
const debitItem = z.object({
  action: z.enum(ACTIONS),
  units: z.number().positive().max(600),
  idempotencyKey: key,
  meta: z.record(z.string(), z.unknown()).optional(),
});

export function creditsRoutes(ctx: Ctx) {
  return async function (app: FastifyInstance) {
    app.get('/v1/credits/pricing', async () => creditsPricing(ctx.config));

    // Balance plus a signed offline grant: how much the desktop app may spend before it syncs again.
    app.get('/v1/credits/balance', async (req) => {
      const { userId, deviceId } = await requireBearer(ctx, req);
      const b = await getBalance(ctx.db, ctx.config, userId);
      const offlineGrant = await signEntitlementToken(ctx.keys, ctx.config, userId, { cr: { buf: b.offlineBuffer, bal: b.total } }, deviceId);
      return { ...b, offlineGrant };
    });

    app.post('/v1/credits/debit', async (req) => {
      const { userId } = await requireBearer(ctx, req);
      return debit(ctx, userId, debitItem.parse(req.body));
    });

    app.post('/v1/credits/refund', async (req) => {
      const { userId } = await requireBearer(ctx, req);
      const b = z.object({ idempotencyKey: key, reason: z.string().max(160).optional() }).parse(req.body);
      return refund(ctx, userId, b.idempotencyKey, b.reason);
    });

    app.post('/v1/credits/reconcile', async (req) => {
      const { userId } = await requireBearer(ctx, req);
      const b = z.object({ items: z.array(debitItem.extend({ at: z.number().int().nonnegative().optional() })).max(200) }).parse(req.body);
      return reconcile(ctx, userId, b.items);
    });

    app.get('/v1/credits/history', async (req) => {
      const { userId } = await requireBearer(ctx, req);
      const q = z.object({ cursor: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().min(1).max(100).default(50) }).parse(req.query);
      return history(ctx.db, userId, q.cursor, q.limit);
    });

    // For an in-app Razorpay Checkout. The desktop app opens the hosted /credits/buy page instead.
    app.post('/v1/credits/orders', async (req) => {
      const { userId } = await requireBearer(ctx, req);
      const b = z.object({ packId: z.string().max(32), currency: z.enum(['INR', 'USD']).default('INR') }).parse(req.body);
      const user = await findUserById(ctx, userId);
      if (!user) throw new ApiError(401, 'unauthorized', 'Sign in required.');
      const order = await createOrder(ctx, user, b.packId, b.currency);
      return { ...order, checkoutUrl: `${ctx.config.PUBLIC_URL}/credits/buy?pack=${encodeURIComponent(order.packId)}` };
    });
  };
}
