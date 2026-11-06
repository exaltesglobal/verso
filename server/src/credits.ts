// AI credits: pricing from config, an append-only ledger with a cached balance row, monthly allowances,
// Razorpay one-time top-up orders and offline-spend reconciliation. See docs/SETUP-KEYS.md "Credits".
import type { Knex } from 'knex';
import { razorpay } from './billing.js';
import type { Config } from './config.js';
import { ApiError, type Ctx } from './ctx.js';
import { hmacSha256Hex, safeEqual, uuid } from './crypto.js';
import { now, type Db } from './db.js';
import { getEntitlements } from './plans.js';

export type Unit = 'minute' | 'run';
type Cost = { unit: Unit; credits: number };

// Defaults only. Override any of them with CREDITS_COSTS, e.g. "auto_cut=5,dubbing=12".
const DEFAULT_COSTS = {
  auto_cut: { unit: 'minute', credits: 4 }, // per source minute
  captions: { unit: 'minute', credits: 2 },
  speaker_reframe: { unit: 'minute', credits: 3 },
  dubbing: { unit: 'minute', credits: 10 }, // per output minute
  voiceover: { unit: 'minute', credits: 6 }, // per output minute
  background_removal: { unit: 'minute', credits: 5 },
  hook_generator: { unit: 'run', credits: 2 },
  caption_writer: { unit: 'run', credits: 1 },
  watch_time_predictor: { unit: 'run', credits: 2 },
  enhance_audio: { unit: 'minute', credits: 1 },
} satisfies Record<string, Cost>;

export type Action = keyof typeof DEFAULT_COSTS;
export const ACTIONS = Object.keys(DEFAULT_COSTS) as [Action, ...Action[]];

export type Pack = { id: string; credits: number; amountInr: number; amountUsd: number | null; priceInr: string; priceUsd: string | null };

export function priceLabel(amount: number, currency: 'INR' | 'USD') {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: amount % 100 ? 2 : 0,
  }).format(amount / 100);
}

/** Throws on a malformed CREDITS_COSTS / CREDITS_PACKS, so call it once at startup. */
export function creditsPricing(config: Config) {
  const costs: Record<Action, Cost> = structuredClone(DEFAULT_COSTS);
  for (const pair of (config.CREDITS_COSTS ?? '').split(',').filter((s) => s.trim())) {
    const [k = '', v = ''] = pair.split('=').map((s) => s.trim());
    const n = Number(v);
    if (!(k in costs) || !v || !Number.isFinite(n) || n < 0) throw new Error(`Bad CREDITS_COSTS entry "${pair}"`);
    costs[k as Action].credits = n;
  }
  const packs: Pack[] = config.CREDITS_PACKS.split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const [credits = NaN, inr = NaN, usd] = s.split(':').map((x) => parseInt(x, 10));
      if (!(credits > 0) || !(inr >= 100)) throw new Error(`Bad CREDITS_PACKS entry "${s}" (use credits:inrPaise[:usdCents])`);
      const amountUsd = usd && usd > 0 ? usd : null;
      return {
        id: `pack_${credits}`,
        credits,
        amountInr: inr,
        amountUsd,
        priceInr: priceLabel(inr, 'INR'),
        priceUsd: amountUsd ? priceLabel(amountUsd, 'USD') : null,
      };
    });
  return {
    costs,
    packs,
    allowances: { free: config.CREDITS_FREE_MONTHLY, pro: config.CREDITS_PRO_MONTHLY },
    topUpsForFree: config.CREDITS_TOPUP_FOR_FREE,
    offlineBuffer: config.CREDITS_OFFLINE_BUFFER,
    paymentsConfigured: config.razorpayOrdersConfigured,
  };
}

/** Credits for `units` minutes (fractions allowed) or runs. Any non-zero use costs at least 1 credit. */
export function costOf(config: Config, action: Action, units: number) {
  const c = creditsPricing(config).costs[action];
  if (c.credits === 0) return 0;
  return c.unit === 'minute' ? Math.max(1, Math.ceil(units * c.credits - 1e-9)) : c.credits * Math.max(1, Math.ceil(units));
}

// ---------- monthly periods ----------

/** `ms` shifted by `n` calendar months (UTC), clamping the day (Jan 31 + 1 month = Feb 28/29). */
function addMonths(ms: number, n: number) {
  const d = new Date(ms);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, daysInMonth));
  return d.getTime();
}

/** The monthly period [start, end) containing `t`, with boundaries on the anchor's day of month. */
export function monthPeriod(anchor: number, t: number): [number, number] {
  const a = new Date(anchor);
  const b = new Date(t);
  let k = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  while (addMonths(anchor, k) > t) k--;
  while (addMonths(anchor, k + 1) <= t) k++;
  return [addMonths(anchor, k), addMonths(anchor, k + 1)];
}

// ---------- balance ----------

type Row = { allowance: number; purchased: number; plan: string; period_start: number; period_end: number };
type Trx = Knex.Transaction;

const locked = <T extends Knex.QueryBuilder>(config: Config, q: T) => (config.DB_CLIENT === 'mysql' ? q.forUpdate() : q);

function toRow(r: Record<string, unknown>): Row {
  return {
    allowance: Number(r.allowance),
    purchased: Number(r.purchased),
    plan: String(r.plan),
    period_start: Number(r.period_start),
    period_end: Number(r.period_end),
  };
}

/**
 * Locks the user's balance row (creating it on first use) and resets the allowance when the period
 * ended or the plan changed. Allowance credits don't roll over; purchased credits are never touched.
 * Pro periods follow the subscription renewal day, Free periods the signup day.
 */
async function freshBalance(trx: Trx, config: Config, userId: string, t = now()): Promise<Row> {
  await trx('credit_balances').insert({ user_id: userId, updated_at: t }).onConflict('user_id').ignore();
  const row = toRow(await locked(config, trx('credit_balances').where({ user_id: userId })).first());
  const ent = await getEntitlements(trx, userId);
  if (row.plan === ent.plan && t < row.period_end) return row;

  const user = await trx('users').where({ id: userId }).first('created_at');
  if (!user) throw new ApiError(404, 'not_found', 'Account not found.');
  const anchor = ent.plan === 'pro' && ent.expiresAt ? Date.parse(ent.expiresAt) : Number(user.created_at);
  const [start, end] = monthPeriod(anchor, t);
  const amount = ent.plan === 'pro' ? config.CREDITS_PRO_MONTHLY : config.CREDITS_FREE_MONTHLY;
  if (amount !== row.allowance) {
    await trx('credit_ledger').insert({
      user_id: userId,
      delta: amount - row.allowance,
      bucket: 'allowance',
      kind: 'reset',
      reason: `Monthly ${ent.plan === 'pro' ? 'Pro' : 'Free'} credits`,
      ref: `reset:${uuid()}`,
      created_at: t,
    });
  }
  const next = { ...row, allowance: amount, plan: ent.plan, period_start: start, period_end: end };
  await trx('credit_balances').where({ user_id: userId }).update({ ...next, updated_at: t });
  return next;
}

async function saveBalance(trx: Trx, userId: string, row: Row) {
  await trx('credit_balances').where({ user_id: userId }).update({ allowance: row.allowance, purchased: row.purchased, updated_at: now() });
}

export type Balance = ReturnType<typeof view>;

function view(config: Config, row: Row) {
  const total = row.allowance + row.purchased;
  return {
    allowance: row.allowance,
    purchased: row.purchased,
    total,
    plan: row.plan,
    resetsAt: new Date(row.period_end).toISOString(),
    // Offline spending never exceeds what the user actually has.
    offlineBuffer: Math.min(config.CREDITS_OFFLINE_BUFFER, Math.max(0, total)),
  };
}

export async function getBalance(db: Db, config: Config, userId: string) {
  return view(config, await db.transaction((trx) => freshBalance(trx, config, userId)));
}

// ---------- debit / refund / grant ----------

export type DebitInput = { action: Action; units: number; idempotencyKey: string; meta?: Record<string, unknown> };

const insufficient = (cost: number, total: number) =>
  new ApiError(
    402,
    'insufficient_credits',
    `This needs ${cost} credit${cost === 1 ? '' : 's'} and you have ${Math.max(0, total)}. Get more credits or upgrade to Pro to keep going.`,
  );

/**
 * Spends credits once per idempotency key: allowance first, then purchased. `floor` is the lowest total
 * allowed after the debit (0 online; minus the offline buffer when reconciling offline spends).
 */
export async function debit(ctx: Ctx, userId: string, input: DebitInput, floor = 0) {
  const cost = costOf(ctx.config, input.action, input.units);
  return ctx.db.transaction(async (trx) => {
    const row = await freshBalance(trx, ctx.config, userId);
    const prior = await trx('credit_ledger').where({ user_id: userId, kind: 'debit', ref: input.idempotencyKey });
    if (prior.length) {
      return { charged: -prior.reduce((s, r) => s + Number(r.delta), 0), duplicate: true, balance: view(ctx.config, row) };
    }
    if (cost > 0) {
      const total = row.allowance + row.purchased;
      if (total - cost < floor) throw insufficient(cost, total);
      const fromAllowance = Math.min(Math.max(row.allowance, 0), cost);
      const parts = [
        ['allowance', fromAllowance],
        ['purchased', cost - fromAllowance],
      ] as const;
      const t = now();
      for (const [bucket, amount] of parts) {
        if (!amount) continue;
        await trx('credit_ledger').insert({
          user_id: userId,
          delta: -amount,
          bucket,
          kind: 'debit',
          reason: null,
          action: input.action,
          ref: input.idempotencyKey,
          meta: JSON.stringify({ units: input.units, ...input.meta }),
          created_at: t,
        });
      }
      row.allowance -= fromAllowance;
      row.purchased -= cost - fromAllowance;
      await saveBalance(trx, userId, row);
    }
    return { charged: cost, duplicate: false, balance: view(ctx.config, row) };
  });
}

/** Gives back a debit (failed job) once. Allowance spent in an earlier period has already expired. */
export async function refund(ctx: Ctx, userId: string, idempotencyKey: string, reason?: string) {
  return ctx.db.transaction(async (trx) => {
    const row = await freshBalance(trx, ctx.config, userId);
    const debits = await trx('credit_ledger').where({ user_id: userId, kind: 'debit', ref: idempotencyKey });
    if (!debits.length) throw new ApiError(404, 'not_found', "We couldn't find that charge.");
    if (await trx('credit_ledger').where({ user_id: userId, kind: 'refund', ref: idempotencyKey }).first()) {
      return { refunded: 0, duplicate: true, balance: view(ctx.config, row) };
    }
    let refunded = 0;
    const t = now();
    for (const d of debits) {
      const expired = d.bucket === 'allowance' && Number(d.created_at) < row.period_start;
      const amount = expired ? 0 : -Number(d.delta);
      // A zero row still marks the key as refunded.
      await trx('credit_ledger').insert({
        user_id: userId,
        delta: amount,
        bucket: d.bucket,
        kind: 'refund',
        reason: reason?.slice(0, 160) ?? "Job didn't finish",
        action: d.action,
        ref: idempotencyKey,
        created_at: t,
      });
      if (d.bucket === 'allowance') row.allowance += amount;
      else row.purchased += amount;
      refunded += amount;
    }
    await saveBalance(trx, userId, row);
    return { refunded, duplicate: false, balance: view(ctx.config, row) };
  });
}

/** Adds (or with a negative amount, removes) purchased credits once per ref. Returns false for a repeat. */
export async function grantPurchased(
  trx: Trx,
  config: Config,
  userId: string,
  credits: number,
  kind: 'grant' | 'admin',
  reason: string,
  ref: string,
  meta?: Record<string, unknown>,
) {
  const row = await freshBalance(trx, config, userId);
  if (await trx('credit_ledger').where({ user_id: userId, kind, ref }).first()) return false;
  await trx('credit_ledger').insert({
    user_id: userId,
    delta: credits,
    bucket: 'purchased',
    kind,
    reason: reason.slice(0, 160),
    ref,
    meta: meta ? JSON.stringify(meta) : null,
    created_at: now(),
  });
  row.purchased += credits;
  await saveBalance(trx, userId, row);
  return true;
}

/** Applies spends made offline. Each item is its own transaction; the total may dip to minus the buffer, never lower. */
export async function reconcile(ctx: Ctx, userId: string, items: (DebitInput & { at?: number })[]) {
  const results: { idempotencyKey: string; status: 'applied' | 'duplicate' | 'rejected'; charged: number; message?: string }[] = [];
  for (const it of items) {
    try {
      const r = await debit(ctx, userId, { ...it, meta: { ...it.meta, offline: true, at: it.at } }, -ctx.config.CREDITS_OFFLINE_BUFFER);
      results.push({ idempotencyKey: it.idempotencyKey, status: r.duplicate ? 'duplicate' : 'applied', charged: r.charged });
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      results.push({ idempotencyKey: it.idempotencyKey, status: 'rejected', charged: 0, message: e.message });
    }
  }
  return { results, balance: await getBalance(ctx.db, ctx.config, userId) };
}

export async function history(db: Db, userId: string, cursor?: number, limit = 50) {
  const q = db('credit_ledger').where({ user_id: userId }).andWhereNot('delta', 0).orderBy('id', 'desc').limit(limit + 1);
  if (cursor) q.andWhere('id', '<', cursor);
  const rows = await q;
  const items = rows.slice(0, limit).map((r) => ({
    id: Number(r.id),
    delta: Number(r.delta),
    bucket: r.bucket as string,
    kind: r.kind as string,
    reason: (r.reason as string | null) ?? null,
    action: (r.action as string | null) ?? null,
    createdAt: Number(r.created_at),
  }));
  return { items, nextCursor: rows.length > limit ? String(items[items.length - 1]!.id) : null };
}

/** Resets every allowance whose period has ended. Runs in-process on an interval and from `pnpm credits:reset`. */
export async function resetDue(db: Db, config: Config, t = now()) {
  const due: string[] = await db('credit_balances').where('period_end', '<=', t).pluck('user_id');
  for (const id of due) await db.transaction((trx) => freshBalance(trx, config, id, t));
  return due.length;
}

// ---------- top-up orders (Razorpay) ----------

export async function createOrder(ctx: Ctx, user: { id: string; email: string }, packId: string, currency: 'INR' | 'USD' = 'INR') {
  if (!ctx.config.razorpayOrdersConfigured) throw new ApiError(503, 'payments_not_configured', "Payments aren't set up yet.");
  const pricing = creditsPricing(ctx.config);
  const pack = pricing.packs.find((p) => p.id === packId);
  if (!pack) throw new ApiError(404, 'unknown_pack', "That credit pack isn't available.");
  if (!pricing.topUpsForFree && (await getEntitlements(ctx.db, user.id)).plan !== 'pro') {
    throw new ApiError(403, 'pro_required', 'Credit top-ups are part of Verso Pro. Upgrade to buy more credits.');
  }
  const amount = currency === 'USD' ? pack.amountUsd : pack.amountInr;
  if (!amount) throw new ApiError(400, 'currency_unavailable', "That pack isn't sold in US dollars yet.");
  const order = await razorpay<{ id: string }>(ctx.config, 'POST', '/orders', {
    amount,
    currency,
    receipt: `credits_${Date.now()}`,
    notes: { user_id: user.id, pack_id: pack.id, credits: String(pack.credits) },
  });
  await ctx.db('credit_orders').insert({
    id: order.id,
    user_id: user.id,
    pack_id: pack.id,
    credits: pack.credits,
    amount,
    currency,
    status: 'created',
    created_at: now(),
  });
  return { orderId: order.id, keyId: ctx.config.RAZORPAY_KEY_ID!, amount, currency, credits: pack.credits, packId: pack.id };
}

/**
 * Marks an order paid and grants its credits exactly once. Called from the webhook (payment.captured,
 * order.paid) and from the checkout page callback; whichever comes second is a no-op.
 */
export async function fulfilOrder(trx: Trx, config: Config, orderId: string, paymentId: string | null, amountPaid?: number) {
  const order = await locked(config, trx('credit_orders').where({ id: orderId })).first();
  if (!order) return { ignored: true };
  if (order.status === 'paid') return { duplicate: true };
  if (amountPaid !== undefined && amountPaid < Number(order.amount)) return { ignored: true, reason: 'amount_mismatch' };
  await trx('credit_orders').where({ id: orderId }).update({ status: 'paid', payment_id: paymentId, paid_at: now() });
  await grantPurchased(trx, config, order.user_id, Number(order.credits), 'grant', `Bought ${order.credits} credits`, `order:${orderId}`, {
    paymentId,
    packId: order.pack_id,
  });
  return { granted: Number(order.credits) };
}

/** Razorpay Checkout signs `order_id|payment_id` with the key secret. */
export const verifyCheckoutSignature = (keySecret: string, orderId: string, paymentId: string, signature: string) =>
  safeEqual(hmacSha256Hex(keySecret, `${orderId}|${paymentId}`), signature);
