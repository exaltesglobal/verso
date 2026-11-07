// Server integration tests: in-memory SQLite, Fastify inject, no network.
// Lives outside src/ so `tsc` (the Hostinger build) never compiles or ships it.
import { generateKeyPairSync } from 'node:crypto';
import { createLocalJWKSet, jwtVerify } from 'jose';
import nodemailer from 'nodemailer';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app.js';
import { createUser } from '../src/auth.js';
import { loadConfig, type Config } from '../src/config.js';
import { hmacSha256Hex } from '../src/crypto.js';
import type { Ctx } from '../src/ctx.js';
import { createDb, migrateLatest, type Db } from '../src/db.js';
import { createMailer } from '../src/mailer.js';

const kp = generateKeyPairSync('ed25519');
const baseEnv = {
  NODE_ENV: 'test',
  SQLITE_FILE: ':memory:',
  JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long',
  ENTITLEMENT_PRIVATE_KEY: kp.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  ENTITLEMENT_PUBLIC_KEY: kp.publicKey.export({ type: 'spki', format: 'pem' }).toString(),
  ADMIN_EMAILS: 'boss@example.com',
  RAZORPAY_WEBHOOK_SECRET: 'whsec_test',
  AUTH_RATE_LIMIT_PER_MINUTE: '1000',
  CREDITS_FREE_MONTHLY: '30',
  CREDITS_OFFLINE_BUFFER: '10',
  CREDITS_RESET_INTERVAL_MINUTES: '0',
};

/** Console-mailer log lines, so the test can read the emailed links like a developer would. */
const logged: string[] = [];
const fakeLog = { info: (_o: unknown, msg: string) => logged.push(msg), error: () => {} } as never;

let config: Config;
let db: Db;
let app: Awaited<ReturnType<typeof buildApp>>['app'];
let ctx: Ctx;

beforeAll(async () => {
  config = loadConfig(baseEnv);
  db = createDb(config);
  await migrateLatest(db);
  ({ app, ctx } = await buildApp(config, { db, mailer: createMailer(config, fakeLog) }));
});
afterAll(async () => {
  await app.close();
  await db.destroy();
});

const post = (url: string, payload: unknown, headers: Record<string, string> = {}) =>
  app.inject({ method: 'POST', url, payload: payload as object, headers });
const get = (url: string, token?: string) =>
  app.inject({ method: 'GET', url, headers: token ? { authorization: `Bearer ${token}` } : {} });

async function signup(email: string) {
  const res = await post('/v1/auth/signup', { email, password: 'correct horse battery', device_id: 'device-0001' });
  expect(res.statusCode).toBe(201);
  return res.json() as { user: { id: string; emailVerified: boolean }; access_token: string; refresh_token: string };
}

describe('server', () => {
  it('GET /healthz', async () => {
    const res = await get('/healthz');
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it('signup sends a verification link that verifies the email once', async () => {
    const s = await signup('new@example.com');
    expect(s.user.emailVerified).toBe(false);
    const token = logged.join('\n').match(/\/verify\?token=([\w-]+)/)?.[1];
    expect(token).toBeTruthy();
    expect((await post('/v1/auth/verify-email', { token })).statusCode).toBe(200);
    expect((await get('/v1/me', s.access_token)).json().user.emailVerified).toBe(true);
    const again = await post('/v1/auth/verify-email', { token });
    expect(again.statusCode).toBe(400);
    expect(again.json().error).toBe('invalid_token');
  });

  it('sign-in, refresh rotation and /v1/me with a bearer token', async () => {
    await signup('login@example.com');
    const bad = await post('/v1/auth/login', { email: 'login@example.com', password: 'wrong password' });
    expect(bad.statusCode).toBe(401);
    const ok = await post('/v1/auth/login', { email: 'login@example.com', password: 'correct horse battery' });
    expect(ok.statusCode).toBe(200);
    const { access_token, refresh_token } = ok.json();

    expect((await get('/v1/me')).statusCode).toBe(401);
    expect((await get('/v1/me', 'not-a-jwt')).statusCode).toBe(401);
    const me = await get('/v1/me', access_token);
    expect(me.statusCode).toBe(200);
    expect(me.json().user.email).toBe('login@example.com');

    const r1 = await post('/v1/auth/token', { grant_type: 'refresh_token', refresh_token });
    expect(r1.statusCode).toBe(200);
    expect(r1.json().refresh_token).not.toBe(refresh_token);
    expect((await get('/v1/me', r1.json().access_token)).statusCode).toBe(200);
    // The old refresh token is spent.
    expect((await post('/v1/auth/token', { grant_type: 'refresh_token', refresh_token })).statusCode).toBe(401);
  });

  it('entitlement token verifies against the published JWKS', async () => {
    const s = await signup('ent@example.com');
    const ent = await get('/v1/me/entitlements', s.access_token);
    expect(ent.statusCode).toBe(200);
    const jwks = (await get('/.well-known/jwks.json')).json();
    const { payload, protectedHeader } = await jwtVerify(ent.json().offlineToken, createLocalJWKSet(jwks), {
      issuer: 'verso-accounts',
      audience: 'verso-desktop',
    });
    expect(protectedHeader.alg).toBe('EdDSA');
    expect(payload.sub).toBe(s.user.id);
    expect(payload.did).toBe('device-0001');
    expect((payload.ent as { plan: string }).plan).toBe(ent.json().plan);

    const other = generateKeyPairSync('ed25519');
    const { SignJWT, importPKCS8 } = await import('jose');
    const forged = await new SignJWT({})
      .setProtectedHeader({ alg: 'EdDSA', kid: jwks.keys[0].kid })
      .sign(await importPKCS8(other.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(), 'EdDSA'));
    await expect(jwtVerify(forged, createLocalJWKSet(jwks))).rejects.toThrow();
  });

  it('credits: debit, balance, idempotency, append-only ledger, offline buffer', async () => {
    const s = await signup('credits@example.com');
    const t = s.access_token;
    const start = (await get('/v1/credits/balance', t)).json();
    expect(start.total).toBe(30);
    expect(start.offlineBuffer).toBe(10);
    expect(start.offlineGrant).toBeTruthy();

    const d1 = await post('/v1/credits/debit', { action: 'captions', units: 2, idempotencyKey: 'job-00001' }, { authorization: `Bearer ${t}` });
    expect(d1.statusCode).toBe(200);
    expect(d1.json()).toMatchObject({ charged: 4, duplicate: false, balance: { total: 26 } });
    const dup = await post('/v1/credits/debit', { action: 'captions', units: 2, idempotencyKey: 'job-00001' }, { authorization: `Bearer ${t}` });
    expect(dup.json()).toMatchObject({ charged: 4, duplicate: true, balance: { total: 26 } });

    const before = await db('credit_ledger').where({ user_id: s.user.id }).orderBy('id');
    const tooMuch = await post('/v1/credits/debit', { action: 'dubbing', units: 3, idempotencyKey: 'job-00002' }, { authorization: `Bearer ${t}` });
    expect(tooMuch.statusCode).toBe(402);
    const refund = await post('/v1/credits/refund', { idempotencyKey: 'job-00001' }, { authorization: `Bearer ${t}` });
    expect(refund.json()).toMatchObject({ refunded: 4, balance: { total: 30 } });
    const after = await db('credit_ledger').where({ user_id: s.user.id }).orderBy('id');
    // Refunds add rows; earlier rows are never edited or removed.
    expect(after.slice(0, before.length)).toEqual(before);
    expect(after.length).toBeGreaterThan(before.length);

    // Offline spends may dip into the buffer (down to -10), never beyond it.
    const rec = await post(
      '/v1/credits/reconcile',
      {
        items: [
          { action: 'dubbing', units: 3.5, idempotencyKey: 'off-00001' }, // 35: 30 -> -5, inside the buffer
          { action: 'dubbing', units: 1, idempotencyKey: 'off-00002' }, // 10 more would reach -15
        ],
      },
      { authorization: `Bearer ${t}` },
    );
    expect(rec.statusCode).toBe(200);
    expect(rec.json().results.map((r: { status: string }) => r.status)).toEqual(['applied', 'rejected']);
    expect(rec.json().balance).toMatchObject({ total: -5, offlineBuffer: 0 });
  });

  it('admin API: blocked for non-admins and unverified admin emails, open to a verified admin', async () => {
    const user = await signup('someone@example.com');
    expect((await get('/admin/api/users')).statusCode).toBe(401);
    expect((await get('/admin/api/users', user.access_token)).statusCode).toBe(404);

    const boss = await signup('boss@example.com'); // on ADMIN_EMAILS but not verified yet
    expect((await get('/admin/api/users', boss.access_token)).statusCode).toBe(404);
    await db('users').where({ id: boss.user.id }).update({ email_verified_at: Date.now() });
    const ok = await get('/admin/api/users', boss.access_token);
    expect(ok.statusCode).toBe(200);

    const verifiedStranger = await createUser(ctx, { email: 'other@example.com', password: 'correct horse battery', verified: true });
    expect(verifiedStranger.email_verified_at).toBeTruthy();
    const login = await post('/v1/auth/login', { email: 'other@example.com', password: 'correct horse battery' });
    expect((await get('/admin/api/users', login.json().access_token)).statusCode).toBe(404);
  });

  it('Razorpay webhook checks the signature', async () => {
    const body = JSON.stringify({ event: 'test.ping', payload: {} });
    const send = (sig?: string) =>
      app.inject({
        method: 'POST',
        url: '/webhooks/razorpay',
        payload: body,
        headers: { 'content-type': 'application/json', ...(sig ? { 'x-razorpay-signature': sig } : {}) },
      });
    expect((await send()).statusCode).toBe(400);
    const bad = await send(hmacSha256Hex('wrong-secret', body));
    expect(bad.statusCode).toBe(400);
    expect(bad.json().error).toBe('invalid_signature');
    const ok = await send(hmacSha256Hex('whsec_test', body));
    expect(ok.statusCode).toBe(200);
    expect(ok.json()).toMatchObject({ ok: true, ignored: true });
  });
});

describe('mailer selection', () => {
  const mail = { to: 'a@example.com', subject: 'Hi', text: 'Hello', html: '<p>Hello</p>' };

  it('uses SMTP when SMTP_HOST is set', async () => {
    const sent: unknown[] = [];
    const json = nodemailer.createTransport({ jsonTransport: true });
    const spy = vi.spyOn(nodemailer, 'createTransport').mockImplementation(((opts: unknown) => {
      sent.push(opts);
      return json;
    }) as never);
    const sendMail = vi.spyOn(json, 'sendMail');
    try {
      const smtp = loadConfig({ ...baseEnv, SMTP_HOST: 'smtp.example.com', SMTP_USER: 'u', SMTP_PASS: 'p', RESEND_API_KEY: 're_x' });
      await createMailer(smtp, fakeLog).send(mail);
      expect(sent[0]).toMatchObject({ host: 'smtp.example.com', port: 465, secure: true, auth: { user: 'u', pass: 'p' } });
      expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'a@example.com', subject: 'Hi' }));
    } finally {
      spy.mockRestore();
    }
  });

  it('falls back to the console mailer without SMTP or Resend', async () => {
    const spy = vi.spyOn(nodemailer, 'createTransport');
    const before = logged.length;
    await createMailer(loadConfig(baseEnv), fakeLog).send(mail);
    expect(spy).not.toHaveBeenCalled();
    expect(logged.length).toBe(before + 1);
    spy.mockRestore();
  });
});
