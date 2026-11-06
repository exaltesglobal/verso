import { ApiError, type Ctx } from './ctx.js';
import {
  hashPassword,
  randomToken,
  safeEqual,
  sha256,
  sha256b64url,
  signAccessToken,
  uuid,
  verifyPassword,
} from './crypto.js';
import { now } from './db.js';
import { linkEmail } from './mailer.js';
import { getEntitlements } from './plans.js';

const DAY = 86_400_000;
const EMAIL_TOKEN_TTL = { verify: 2 * DAY, reset: 60 * 60_000 } as const;
const AUTH_CODE_TTL = 2 * 60_000;

export type User = {
  id: string;
  email: string;
  name: string | null;
  password_hash: string | null;
  email_verified_at: number | null;
  blocked_at?: number | null;
};

export const ACCOUNT_PAUSED = 'Your account is paused. Contact support.';
const paused = () => new ApiError(403, 'account_blocked', ACCOUNT_PAUSED);

/** Throws 403 account_blocked when an admin paused the account. */
export async function assertActive(ctx: Pick<Ctx, 'db'>, userId: string) {
  const u = await ctx.db('users').where({ id: userId }).first('blocked_at');
  if (u?.blocked_at) throw paused();
}

export function assertNotBlocked(user: { blocked_at?: number | null }) {
  if (user.blocked_at) throw paused();
}

export type DeviceInfo = { deviceId?: string | null; deviceName?: string | null; platform?: string | null };

export const normalizeEmail = (e: string) => e.trim().toLowerCase();

export async function findUserById(ctx: Ctx, id: string): Promise<User | undefined> {
  return ctx.db('users').where({ id }).first();
}

export async function createUser(ctx: Ctx, input: { email: string; password?: string; name?: string; verified?: boolean }) {
  const email = normalizeEmail(input.email);
  if (await ctx.db('users').where({ email }).first()) throw new ApiError(409, 'email_taken', 'An account with this email already exists.');
  const t = now();
  const user = {
    id: uuid(),
    email,
    name: input.name?.trim() || null,
    password_hash: input.password ? await hashPassword(input.password) : null,
    email_verified_at: input.verified ? t : null,
    created_at: t,
    updated_at: t,
  };
  await ctx.db('users').insert(user);
  if (!input.verified) await sendVerifyEmail(ctx, user);
  return user as User;
}

export async function authenticate(ctx: Ctx, email: string, password: string): Promise<User> {
  const user: User | undefined = await ctx.db('users').where({ email: normalizeEmail(email) }).first();
  // Verify against a dummy hash when the user is missing so timing does not reveal which emails exist.
  dummyHash ??= hashPassword(randomToken());
  const ok = await verifyPassword(user?.password_hash ?? (await dummyHash), password);
  if (!user || !user.password_hash || !ok) throw new ApiError(401, 'invalid_credentials', "That email and password don't match.");
  assertNotBlocked(user);
  return user;
}
let dummyHash: Promise<string> | undefined;

// ---------- email tokens ----------

async function createEmailToken(ctx: Ctx, userId: string, type: keyof typeof EMAIL_TOKEN_TTL) {
  const raw = randomToken();
  const t = now();
  await ctx.db('email_tokens').where({ user_id: userId, type }).whereNull('used_at').update({ used_at: t });
  await ctx.db('email_tokens').insert({
    id: uuid(),
    user_id: userId,
    type,
    token_hash: sha256(raw),
    expires_at: t + EMAIL_TOKEN_TTL[type],
    created_at: t,
  });
  return raw;
}

export async function sendVerifyEmail(ctx: Ctx, user: { id: string; email: string }) {
  const raw = await createEmailToken(ctx, user.id, 'verify');
  await ctx.mailer.send(
    linkEmail({
      to: user.email,
      subject: 'Confirm your email for Verso',
      intro: 'Tap the button below to confirm this is your email address.',
      button: 'Confirm email',
      url: `${ctx.config.PUBLIC_URL}/verify?token=${raw}`,
      outro: "If you didn't create a Verso account, you can ignore this email.",
      logo: `${ctx.config.PUBLIC_URL}/assets/verso-logo.png`,
    }),
  );
}

/** Always succeeds from the caller's point of view, so it can't be used to discover accounts. */
export async function sendResetEmail(ctx: Ctx, email: string) {
  const user: User | undefined = await ctx.db('users').where({ email: normalizeEmail(email) }).first();
  if (!user) return;
  const raw = await createEmailToken(ctx, user.id, 'reset');
  await ctx.mailer.send(
    linkEmail({
      to: user.email,
      subject: 'Reset your Verso password',
      intro: 'Someone asked to reset the password for your Verso account. The link works for one hour.',
      button: 'Choose a new password',
      url: `${ctx.config.PUBLIC_URL}/reset?token=${raw}`,
      outro: "If this wasn't you, ignore this email. Your password stays the same.",
      logo: `${ctx.config.PUBLIC_URL}/assets/verso-logo.png`,
    }),
  );
}

async function consumeEmailToken(ctx: Ctx, type: 'verify' | 'reset', raw: string) {
  return ctx.db.transaction(async (trx) => {
    const row = await trx('email_tokens').where({ token_hash: sha256(raw), type }).first();
    if (!row || row.used_at || Number(row.expires_at) < now()) return null;
    const n = await trx('email_tokens').where({ id: row.id }).whereNull('used_at').update({ used_at: now() });
    return n === 1 ? (row.user_id as string) : null;
  });
}

export async function verifyEmail(ctx: Ctx, raw: string) {
  const userId = await consumeEmailToken(ctx, 'verify', raw);
  if (!userId) throw new ApiError(400, 'invalid_token', 'This link has expired or was already used.');
  await ctx.db('users').where({ id: userId }).update({ email_verified_at: now(), updated_at: now() });
  return userId;
}

export async function resetPassword(ctx: Ctx, raw: string, password: string) {
  const userId = await consumeEmailToken(ctx, 'reset', raw);
  if (!userId) throw new ApiError(400, 'invalid_token', 'This link has expired or was already used.');
  const t = now();
  // Clicking the emailed link proves the inbox, so the email counts as verified too.
  await ctx.db('users').where({ id: userId }).update({ password_hash: await hashPassword(password), updated_at: t });
  await ctx.db('users').where({ id: userId }).whereNull('email_verified_at').update({ email_verified_at: t });
  await ctx.db('sessions').where({ user_id: userId }).delete();
  await ctx.db('refresh_tokens').where({ user_id: userId }).whereNull('revoked_at').update({ revoked_at: t });
  return userId;
}

// ---------- browser sessions ----------

export async function createSession(ctx: Ctx, userId: string) {
  const raw = randomToken();
  const t = now();
  await ctx.db('sessions').insert({ id_hash: sha256(raw), user_id: userId, expires_at: t + ctx.config.SESSION_TTL_DAYS * DAY, created_at: t });
  return raw;
}

export async function getSessionUser(ctx: Ctx, raw: string | undefined): Promise<User | undefined> {
  if (!raw) return undefined;
  const s = await ctx.db('sessions').where({ id_hash: sha256(raw) }).first();
  if (!s || Number(s.expires_at) < now()) return undefined;
  const user = await findUserById(ctx, s.user_id);
  return user?.blocked_at ? undefined : user;
}

export async function destroySession(ctx: Ctx, raw: string | undefined) {
  if (raw) await ctx.db('sessions').where({ id_hash: sha256(raw) }).delete();
}

// ---------- devices ----------

export async function registerDevice(ctx: Ctx, userId: string, d: DeviceInfo) {
  if (!d.deviceId) return;
  const t = now();
  const existing = await ctx.db('devices').where({ user_id: userId, device_id: d.deviceId }).first();
  if (existing) {
    await ctx.db('devices')
      .where({ id: existing.id })
      .update({ last_seen_at: t, name: d.deviceName ?? existing.name, platform: d.platform ?? existing.platform });
    return;
  }
  const ent = await getEntitlements(ctx.db, userId);
  const [{ count }] = await ctx.db('devices').where({ user_id: userId }).count({ count: '*' });
  if (Number(count) >= ent.limits.max_devices) {
    throw new ApiError(
      409,
      'device_limit_reached',
      `Your ${ent.plan === 'pro' ? 'Pro' : 'Free'} plan works on ${ent.limits.max_devices} device${ent.limits.max_devices === 1 ? '' : 's'}. Remove one from your account page to sign in here.`,
    );
  }
  await ctx.db('devices').insert({
    id: uuid(),
    user_id: userId,
    device_id: d.deviceId,
    name: d.deviceName ?? null,
    platform: d.platform ?? null,
    last_seen_at: t,
    created_at: t,
  });
}

export async function removeDevice(ctx: Pick<Ctx, 'db'>, userId: string, id: string) {
  const dev = await ctx.db('devices').where({ id, user_id: userId }).first();
  if (!dev) return;
  await ctx.db('devices').where({ id }).delete();
  await ctx.db('refresh_tokens').where({ user_id: userId, device_id: dev.device_id }).whereNull('revoked_at').update({ revoked_at: now() });
}

// ---------- desktop tokens ----------

export async function issueTokens(ctx: Ctx, userId: string, deviceId: string | null, familyId = uuid()) {
  const refresh = randomToken(48);
  const t = now();
  await ctx.db('refresh_tokens').insert({
    id: uuid(),
    user_id: userId,
    token_hash: sha256(refresh),
    family_id: familyId,
    device_id: deviceId,
    expires_at: t + ctx.config.REFRESH_TOKEN_TTL_DAYS * DAY,
    created_at: t,
  });
  return {
    token_type: 'Bearer',
    access_token: await signAccessToken(ctx.keys, ctx.config, userId, deviceId),
    expires_in: ctx.config.ACCESS_TOKEN_TTL_SECONDS,
    refresh_token: refresh,
    refresh_expires_in: ctx.config.REFRESH_TOKEN_TTL_DAYS * 86_400,
  };
}

export async function rotateRefreshToken(ctx: Ctx, raw: string) {
  const invalid = new ApiError(401, 'invalid_refresh_token', 'Please sign in again.');
  const row = await ctx.db('refresh_tokens').where({ token_hash: sha256(raw) }).first();
  if (!row) throw invalid;
  if (row.revoked_at) {
    // A rotated token was replayed: assume theft and kill the whole family.
    await ctx.db('refresh_tokens').where({ family_id: row.family_id }).whereNull('revoked_at').update({ revoked_at: now() });
    throw invalid;
  }
  if (Number(row.expires_at) < now()) throw invalid;
  await assertActive(ctx, row.user_id);
  const n = await ctx.db('refresh_tokens').where({ id: row.id }).whereNull('revoked_at').update({ revoked_at: now() });
  if (n !== 1) throw invalid;
  if (row.device_id) {
    const dev = await ctx.db('devices').where({ user_id: row.user_id, device_id: row.device_id }).first();
    if (!dev) throw new ApiError(401, 'device_removed', 'This device was signed out from your account page.');
    await ctx.db('devices').where({ id: dev.id }).update({ last_seen_at: now() });
  }
  return issueTokens(ctx, row.user_id, row.device_id, row.family_id);
}

export async function revokeRefreshToken(ctx: Ctx, raw: string) {
  const row = await ctx.db('refresh_tokens').where({ token_hash: sha256(raw) }).first();
  if (row) await ctx.db('refresh_tokens').where({ family_id: row.family_id }).whereNull('revoked_at').update({ revoked_at: now() });
}

export async function createAuthCode(ctx: Ctx, userId: string, codeChallenge: string, d: DeviceInfo) {
  const raw = randomToken();
  const t = now();
  await ctx.db('auth_codes').insert({
    code_hash: sha256(raw),
    user_id: userId,
    code_challenge: codeChallenge,
    device_id: d.deviceId ?? null,
    device_name: d.deviceName ?? null,
    platform: d.platform ?? null,
    expires_at: t + AUTH_CODE_TTL,
    created_at: t,
  });
  return raw;
}

export async function exchangeAuthCode(ctx: Ctx, code: string, verifier: string) {
  const invalid = new ApiError(400, 'invalid_grant', 'This sign-in link has expired. Please try again from the app.');
  const hash = sha256(code);
  const row = await ctx.db('auth_codes').where({ code_hash: hash }).first();
  if (!row || row.used_at || Number(row.expires_at) < now()) throw invalid;
  const n = await ctx.db('auth_codes').where({ code_hash: hash }).whereNull('used_at').update({ used_at: now() });
  if (n !== 1) throw invalid;
  if (!safeEqual(sha256b64url(verifier), row.code_challenge)) throw invalid;
  await assertActive(ctx, row.user_id);
  const device = { deviceId: row.device_id, deviceName: row.device_name, platform: row.platform };
  await registerDevice(ctx, row.user_id, device);
  return issueTokens(ctx, row.user_id, row.device_id);
}

// ---------- Google ----------

export async function findOrCreateOAuthUser(
  ctx: Ctx,
  provider: string,
  profile: { sub: string; email: string; emailVerified: boolean; name?: string },
) {
  const link = await ctx.db('oauth_accounts').where({ provider, provider_user_id: profile.sub }).first();
  if (link) return (await findUserById(ctx, link.user_id))!;
  if (!profile.emailVerified) throw new ApiError(400, 'email_unverified', 'Your Google email is not verified.');
  const email = normalizeEmail(profile.email);
  let user: User | undefined = await ctx.db('users').where({ email }).first();
  if (!user) user = await createUser(ctx, { email, name: profile.name, verified: true });
  else if (!user.email_verified_at) {
    // Someone signed up with this email but never proved it; drop their password so they can't keep access.
    await ctx.db('users').where({ id: user.id }).update({ email_verified_at: now(), password_hash: null, updated_at: now() });
  }
  await ctx.db('oauth_accounts').insert({ id: uuid(), user_id: user.id, provider, provider_user_id: profile.sub, email, created_at: now() });
  return user;
}
