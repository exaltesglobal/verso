import type { FastifyBaseLogger } from 'fastify';
import type { Config } from './config.js';
import { ApiError, type Ctx } from './ctx.js';
import { hmacSha256Hex, safeEqual, sha256, uuid } from './crypto.js';
import { now } from './db.js';
import type { BillingPlan } from './plans.js';

const API = 'https://api.razorpay.com/v1';

async function razorpay<T>(config: Config, method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  if (!config.RAZORPAY_KEY_ID || !config.RAZORPAY_KEY_SECRET) throw new ApiError(503, 'payments_not_configured', "Payments aren't set up yet.");
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.RAZORPAY_KEY_ID}:${config.RAZORPAY_KEY_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { description?: string } };
  if (!res.ok) throw new ApiError(502, 'payment_provider_error', json.error?.description ?? 'Payment provider error.');
  return json;
}

export function planIdFor(config: Config, plan: BillingPlan) {
  return plan === 'pro_yearly' ? config.RAZORPAY_PLAN_PRO_YEARLY : config.RAZORPAY_PLAN_PRO_MONTHLY;
}

function billingPlanFor(config: Config, razorpayPlanId: string | undefined): BillingPlan {
  return razorpayPlanId && razorpayPlanId === config.RAZORPAY_PLAN_PRO_YEARLY ? 'pro_yearly' : 'pro_monthly';
}

/** Creates a Razorpay subscription and returns its hosted checkout URL. */
export async function createCheckout(ctx: Ctx, user: { id: string; email: string }, plan: BillingPlan) {
  const planId = planIdFor(ctx.config, plan);
  if (!ctx.config.razorpayConfigured || !planId) throw new ApiError(503, 'payments_not_configured', "Payments aren't set up yet.");
  const sub = await razorpay<{ id: string; status: string; short_url: string }>(ctx.config, 'POST', '/subscriptions', {
    plan_id: planId,
    total_count: plan === 'pro_yearly' ? 10 : 120, // Razorpay requires a cycle count; this is "until cancelled" in practice
    customer_notify: 1,
    notes: { user_id: user.id, email: user.email },
  });
  const t = now();
  await ctx.db('subscriptions').insert({
    id: uuid(),
    user_id: user.id,
    provider: 'razorpay',
    provider_subscription_id: sub.id,
    plan,
    status: sub.status,
    short_url: sub.short_url,
    created_at: t,
    updated_at: t,
  });
  return sub.short_url;
}

export async function cancelSubscription(ctx: Ctx, userId: string, providerSubscriptionId: string) {
  const sub = await ctx.db('subscriptions').where({ user_id: userId, provider_subscription_id: providerSubscriptionId }).first();
  if (!sub) throw new ApiError(404, 'not_found', 'Subscription not found.');
  // Keep Pro until the end of the period the user already paid for; the webhook updates our row.
  await razorpay(ctx.config, 'POST', `/subscriptions/${providerSubscriptionId}/cancel`, { cancel_at_cycle_end: 1 });
}

/** Razorpay signs the raw request body with HMAC-SHA256 (hex) using the webhook secret. */
export function verifyRazorpaySignature(secret: string, rawBody: Buffer | string, signature: string | undefined) {
  if (!signature) return false;
  return safeEqual(hmacSha256Hex(secret, rawBody), signature);
}

type RzpSubscription = { id: string; plan_id?: string; status: string; current_end?: number | null; notes?: Record<string, string> };
type RzpPayment = { id: string; amount?: number; currency?: string; status: string; subscription_id?: string; notes?: Record<string, string> };
export type RazorpayEvent = {
  event: string;
  payload: { subscription?: { entity: RzpSubscription }; payment?: { entity: RzpPayment } };
};

const HANDLED = new Set(['subscription.activated', 'subscription.charged', 'subscription.cancelled', 'subscription.halted', 'payment.failed']);

/**
 * Applies a verified webhook event once. The event id is recorded in the same transaction as its effects,
 * so a failure rolls both back and Razorpay's retry gets processed; a replay of a committed event is a no-op.
 */
export async function handleRazorpayEvent(ctx: Ctx, log: FastifyBaseLogger, eventId: string, evt: RazorpayEvent) {
  return ctx.db.transaction(async (trx) => {
    const seen = await trx('webhook_events').where({ id: eventId }).first();
    if (seen) return { duplicate: true };
    await trx('webhook_events').insert({ id: eventId, provider: 'razorpay', type: evt.event, received_at: now() });
    if (!HANDLED.has(evt.event)) return { ignored: true };

    const t = now();
    const s = evt.payload.subscription?.entity;
    if (s) {
      const existing = await trx('subscriptions').where({ provider_subscription_id: s.id }).first();
      const userId: string | undefined = existing?.user_id ?? s.notes?.user_id;
      if (!userId || !(await trx('users').where({ id: userId }).first())) {
        log.warn({ subscription: s.id, event: evt.event }, 'webhook for unknown user, skipped');
        return { ignored: true };
      }
      const status = evt.event === 'subscription.halted' ? 'halted' : evt.event === 'subscription.cancelled' ? 'cancelled' : s.status;
      const fields = {
        status,
        current_end: s.current_end ? s.current_end * 1000 : (existing?.current_end ?? null),
        plan: billingPlanFor(ctx.config, s.plan_id),
        updated_at: t,
      };
      if (existing) await trx('subscriptions').where({ id: existing.id }).update(fields);
      else
        await trx('subscriptions').insert({ id: uuid(), user_id: userId, provider: 'razorpay', provider_subscription_id: s.id, created_at: t, ...fields });
    }

    const p = evt.payload.payment?.entity;
    if (p) {
      const subId = p.subscription_id ?? s?.id ?? null;
      const owner = subId ? await trx('subscriptions').where({ provider_subscription_id: subId }).first() : undefined;
      const userId = owner?.user_id ?? p.notes?.user_id ?? null;
      const status = evt.event === 'payment.failed' ? 'failed' : p.status;
      const row = await trx('payments').where({ provider_payment_id: p.id }).first();
      if (row) await trx('payments').where({ id: row.id }).update({ status });
      else
        await trx('payments').insert({
          id: uuid(),
          user_id: userId && (await trx('users').where({ id: userId }).first()) ? userId : null,
          provider_payment_id: p.id,
          provider_subscription_id: subId,
          amount: p.amount ?? null,
          currency: p.currency ?? null,
          status,
          created_at: t,
        });
    }
    return { processed: true };
  });
}

/** Razorpay sends x-razorpay-event-id; fall back to a body hash so identical deliveries still dedupe. */
export const eventIdFrom = (header: string | undefined, rawBody: Buffer) => header || `body:${sha256(rawBody.toString('utf8'))}`;
