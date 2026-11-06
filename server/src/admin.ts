// Admin actions. Pages, the JSON admin API and the CLI scripts all go through these, and each one
// writes an admin_audit row in the same transaction as the change.
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { removeDevice } from './auth.js';
import type { Config } from './config.js';
import { getBalance, grantPurchased } from './credits.js';
import { uuid } from './crypto.js';
import { ApiError } from './ctx.js';
import { now, type Db } from './db.js';
import { FEATURE_IDS, getEntitlements, getOverride, LIMIT_IDS } from './plans.js';

export type AdminCtx = { db: Db; config: Config };
/** Who did it (admin email, or "cli") and from where. */
export type Actor = { admin: string; ip: string | null };

export function isAdminEmail(config: Config, user: { email: string; email_verified_at: number | null } | undefined) {
  // Verified only: otherwise anyone could sign up with an admin's address before the admin does.
  return Boolean(user && user.email_verified_at && config.adminEmails.includes(user.email.toLowerCase()));
}

async function audit(db: Db, actor: Actor, action: string, targetUserId: string | null, before: unknown, after: unknown) {
  await db('admin_audit').insert({
    admin: actor.admin,
    action,
    target_user_id: targetUserId,
    before: before === undefined ? null : JSON.stringify(before),
    after: after === undefined ? null : JSON.stringify(after),
    ip: actor.ip,
    at: now(),
  });
}

export async function findUser(db: Db, idOrEmail: string) {
  const key = idOrEmail.trim();
  const user = await db('users').where({ id: key }).orWhere({ email: key.toLowerCase() }).first();
  if (!user) throw new ApiError(404, 'not_found', `No account matches ${key}.`);
  return user as { id: string; email: string; name: string | null; email_verified_at: number | null; blocked_at: number | null; created_at: number };
}

// ---------- users ----------

export async function searchUsers(ctx: AdminCtx, q: string, limit = 50) {
  const query = ctx.db('users').orderBy('created_at', 'desc').limit(limit);
  const term = q.trim().toLowerCase();
  if (term) query.where((w) => w.where('id', term).orWhereRaw('lower(email) like ?', [`%${term}%`]).orWhereRaw('lower(name) like ?', [`%${term}%`]));
  const users = await query;
  const ids = users.map((u) => u.id);
  const [balances, devices] = await Promise.all([
    ids.length ? ctx.db('credit_balances').whereIn('user_id', ids) : [],
    ids.length ? ctx.db('devices').whereIn('user_id', ids).groupBy('user_id').select('user_id').count({ n: '*' }).max({ seen: 'last_seen_at' }) : [],
  ]);
  return Promise.all(
    users.map(async (u) => {
      const b = balances.find((r) => r.user_id === u.id);
      const d = (devices as { user_id: string; n?: number; seen?: number }[]).find((r) => r.user_id === u.id);
      const ent = await getEntitlements(ctx.db, u.id);
      return {
        id: u.id as string,
        email: u.email as string,
        name: (u.name as string | null) ?? null,
        plan: ent.plan,
        overridden: ent.overridden,
        // Cached balance; it refills lazily on the user's next balance check.
        credits: b ? Number(b.allowance) + Number(b.purchased) : null,
        devices: Number(d?.n ?? 0),
        lastSeenAt: d?.seen ? Number(d.seen) : null,
        blocked: Boolean(u.blocked_at),
        createdAt: Number(u.created_at),
      };
    }),
  );
}

export async function userDetail(ctx: AdminCtx, userId: string) {
  const user = await findUser(ctx.db, userId);
  const [ent, override, balance, ledger, devices, subs, auditRows] = await Promise.all([
    getEntitlements(ctx.db, user.id),
    getOverride(ctx.db, user.id),
    getBalance(ctx.db, ctx.config, user.id),
    ctx.db('credit_ledger').where({ user_id: user.id }).orderBy('id', 'desc').limit(50),
    ctx.db('devices').where({ user_id: user.id }).orderBy('last_seen_at', 'desc'),
    ctx.db('subscriptions').where({ user_id: user.id }).orderBy('created_at', 'desc').limit(5),
    ctx.db('admin_audit').where({ target_user_id: user.id }).orderBy('id', 'desc').limit(20),
  ]);
  return { user, ent, override, balance, ledger, devices, subs, audit: auditRows };
}

// ---------- access overrides ----------

export const overrideInput = z.object({
  plan: z.enum(['pro', 'free']).nullable(),
  /** Epoch ms. Null = no end date. Only applies to the plan override. */
  expiresAt: z.number().int().positive().nullable().default(null),
  features: z.partialRecord(z.enum(FEATURE_IDS as [string, ...string[]]), z.boolean()).default({}),
  limits: z.partialRecord(z.enum(LIMIT_IDS as [string, ...string[]]), z.number().int().min(-1).max(1_000_000)).default({}),
  note: z.string().trim().max(240).default(''),
});
export type OverrideInput = z.infer<typeof overrideInput>;

export async function setOverride(ctx: AdminCtx, actor: Actor, userId: string, input: OverrideInput) {
  const o = overrideInput.parse(input);
  const user = await findUser(ctx.db, userId);
  return ctx.db.transaction(async (trx) => {
    const before = await getOverride(trx, user.id);
    const t = now();
    const row = {
      plan_override: o.plan,
      expires_at: o.plan ? o.expiresAt : null,
      features: JSON.stringify(o.features),
      limits: JSON.stringify(o.limits),
      note: o.note || null,
      granted_by: actor.admin,
      updated_at: t,
    };
    await trx('user_overrides').insert({ user_id: user.id, ...row, created_at: t }).onConflict('user_id').merge(row);
    const after = await getOverride(trx, user.id);
    await audit(trx, actor, 'override.set', user.id, before, after);
    return after;
  });
}

export async function clearOverride(ctx: AdminCtx, actor: Actor, userId: string) {
  const user = await findUser(ctx.db, userId);
  await ctx.db.transaction(async (trx) => {
    const before = await getOverride(trx, user.id);
    await trx('user_overrides').where({ user_id: user.id }).delete();
    await audit(trx, actor, 'override.clear', user.id, before, null);
  });
}

/** Comp Pro for `days` (or forever), keeping any feature/limit overrides already set. */
export async function grantPro(ctx: AdminCtx, actor: Actor, userId: string, days: number | null, note = '') {
  const cur = await getOverride(ctx.db, (await findUser(ctx.db, userId)).id);
  return setOverride(ctx, actor, userId, {
    plan: 'pro',
    expiresAt: days ? now() + days * 86_400_000 : null,
    features: cur?.features ?? {},
    limits: cur?.limits ?? {},
    note: note || cur?.note || '',
  });
}

// ---------- credits ----------

export async function adjustCredits(ctx: AdminCtx, actor: Actor, userId: string, amount: number, note: string) {
  if (!Number.isInteger(amount) || amount === 0 || Math.abs(amount) > 1_000_000) throw new ApiError(400, 'invalid_amount', 'Enter a whole number of credits, not zero.');
  const reason = note.trim() || (amount > 0 ? 'Added by Verso support' : 'Removed by Verso support');
  const user = await findUser(ctx.db, userId);
  const before = await getBalance(ctx.db, ctx.config, user.id);
  await ctx.db.transaction(async (trx) => {
    await grantPurchased(trx, ctx.config, user.id, amount, 'admin', reason, `admin:${uuid()}`, { by: actor.admin });
    await audit(trx, actor, amount > 0 ? 'credits.grant' : 'credits.deduct', user.id, { total: before.total }, { delta: amount, note: reason });
  });
  return getBalance(ctx.db, ctx.config, user.id);
}

// ---------- account controls ----------

export async function setBlocked(ctx: AdminCtx, actor: Actor, userId: string, blocked: boolean, note = '') {
  const user = await findUser(ctx.db, userId);
  await ctx.db.transaction(async (trx) => {
    await trx('users').where({ id: user.id }).update({ blocked_at: blocked ? now() : null, updated_at: now() });
    // Browser sessions end now; desktop refresh tokens are refused while blocked (and work again after unblock).
    if (blocked) await trx('sessions').where({ user_id: user.id }).delete();
    await audit(trx, actor, blocked ? 'user.block' : 'user.unblock', user.id, { blocked: Boolean(user.blocked_at) }, { blocked, note: note || undefined });
  });
}

export async function signOutEverywhere(ctx: AdminCtx, actor: Actor, userId: string) {
  const user = await findUser(ctx.db, userId);
  await ctx.db.transaction(async (trx) => {
    const sessions = await trx('sessions').where({ user_id: user.id }).delete();
    const tokens = await trx('refresh_tokens').where({ user_id: user.id }).whereNull('revoked_at').update({ revoked_at: now() });
    await audit(trx, actor, 'user.signout_all', user.id, { sessions, tokens }, null);
  });
}

export async function adminRemoveDevice(ctx: AdminCtx, actor: Actor, userId: string, deviceRowId: string) {
  const user = await findUser(ctx.db, userId);
  const dev = await ctx.db('devices').where({ id: deviceRowId, user_id: user.id }).first();
  if (!dev) throw new ApiError(404, 'not_found', 'That device is already gone.');
  await removeDevice(ctx, user.id, deviceRowId);
  await audit(ctx.db, actor, 'device.remove', user.id, { id: dev.id, name: dev.name, platform: dev.platform }, null);
}

// ---------- invites ----------

// No 0/O/1/I so codes are easy to read aloud.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const part = () => Array.from(randomBytes(4), (b) => ALPHABET[b % ALPHABET.length]).join('');

export async function createInvites(ctx: AdminCtx, actor: Actor, count: number, maxUses: number, note: string, expiresAt: number | null) {
  const n = Math.max(1, Math.min(500, Math.floor(count) || 1));
  const uses = Math.max(1, Math.min(100_000, Math.floor(maxUses) || 1));
  const rows = Array.from({ length: n }, () => ({
    code: `VERSO-${part()}-${part()}`,
    note: note.trim().slice(0, 120) || null,
    max_uses: uses,
    uses: 0,
    expires_at: expiresAt,
    created_at: now(),
  }));
  await ctx.db.transaction(async (trx) => {
    await trx('invite_codes').insert(rows);
    await audit(trx, actor, 'invite.create', null, null, { codes: rows.map((r) => r.code), maxUses: uses, note: rows[0]!.note, expiresAt });
  });
  return rows.map((r) => r.code);
}

export async function listInvites(ctx: AdminCtx, limit = 200) {
  return ctx.db('invite_codes').orderBy('created_at', 'desc').limit(limit);
}

export async function revokeInvite(ctx: AdminCtx, actor: Actor, code: string) {
  const row = await ctx.db('invite_codes').where({ code }).first();
  if (!row) throw new ApiError(404, 'not_found', "That invite code doesn't exist.");
  await ctx.db.transaction(async (trx) => {
    // Expiring it now keeps the row (and its use count) for the record.
    await trx('invite_codes').where({ code }).update({ expires_at: now() });
    await audit(trx, actor, 'invite.revoke', null, { code, uses: row.uses, maxUses: row.max_uses, expiresAt: row.expires_at }, { expiresAt: now() });
  });
}

// ---------- audit ----------

export async function listAudit(ctx: AdminCtx, f: { admin?: string; action?: string; user?: string; before?: number }, limit = 100) {
  const q = ctx.db('admin_audit').orderBy('id', 'desc').limit(limit);
  if (f.admin) q.whereRaw('lower(admin) like ?', [`%${f.admin.toLowerCase()}%`]);
  if (f.action) q.where('action', 'like', `${f.action}%`);
  if (f.user) {
    const u = await ctx.db('users').where({ id: f.user }).orWhere({ email: f.user.toLowerCase() }).first('id');
    q.where('target_user_id', u?.id ?? f.user);
  }
  if (f.before) q.where('id', '<', f.before);
  return q;
}
