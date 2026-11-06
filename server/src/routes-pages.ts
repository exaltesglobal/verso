import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  authenticate,
  createAuthCode,
  createSession,
  createUser,
  destroySession,
  findOrCreateOAuthUser,
  getSessionUser,
  removeDevice,
  resetPassword,
  sendResetEmail,
  sendVerifyEmail,
  verifyEmail,
  type User,
} from './auth.js';
import { cancelSubscription, createCheckout } from './billing.js';
import { randomToken, safeEqual } from './crypto.js';
import { ApiError, type Ctx } from './ctx.js';
import { googleAuthUrl, googleProfileFromCode } from './google.js';
import { getEntitlements, latestSubscription } from './plans.js';
import { emailSchema, passwordSchema } from './routes-api.js';
import * as v from './views.js';

const SID = 'verso_sid';
const CSRF = 'verso_csrf';
const OAUTH = 'verso_oauth';

declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
    csrf: string;
  }
}

/** Only same-site relative paths, so `next` can't become an open redirect. */
const safeNext = (n: unknown) => (typeof n === 'string' && /^\/(?![/\\])/.test(n) && n.length < 2048 ? n : undefined);

const desktopQuery = z.object({
  port: z.coerce.number().int().min(1024).max(65535),
  code_challenge: z.string().regex(/^[A-Za-z0-9_-]{43,128}$/),
  code_challenge_method: z.literal('S256').default('S256'),
  state: z.string().min(8).max(256),
  device_id: z.string().trim().min(8).max(128).optional(),
  device_name: z.string().trim().max(120).optional(),
  platform: z.string().trim().max(40).optional(),
});

export function pageRoutes(ctx: Ctx) {
  const { config } = ctx;
  const cookieOpts = { path: '/', httpOnly: true, sameSite: 'lax' as const, secure: config.secureCookies };

  return async function (app: FastifyInstance) {
    const authLimit = { rateLimit: { max: config.AUTH_RATE_LIMIT_PER_MINUTE, timeWindow: '1 minute' } };

    app.decorateRequest('user', undefined);
    app.decorateRequest('csrf', '');

    // Double-submit CSRF: an httpOnly cookie must match the hidden form field on every POST in this scope.
    app.addHook('preHandler', async (req, reply) => {
      let token = req.cookies[CSRF];
      if (!token || token.length < 32) {
        token = randomToken();
        reply.setCookie(CSRF, token, cookieOpts);
      }
      req.csrf = token;
      req.user = await getSessionUser(ctx, req.cookies[SID]);
      if (req.method === 'POST') {
        const sent = (req.body as Record<string, unknown> | undefined)?._csrf;
        if (typeof sent !== 'string' || !req.cookies[CSRF] || !safeEqual(sent, req.cookies[CSRF]!)) {
          return reply
            .code(403)
            .type('text/html')
            .send(v.layout({ title: 'Try again', narrow: true, body: v.messagePage({ title: 'Please try that again', body: 'Your form expired. Go back, refresh the page and try once more.' }) }));
        }
      }
    });

    const html = (reply: FastifyReply, req: FastifyRequest, title: string, body: string, opts: { narrow?: boolean; status?: number } = {}) =>
      reply
        .code(opts.status ?? 200)
        .header('Cache-Control', 'no-store')
        .type('text/html; charset=utf-8')
        .send(v.layout({ title, body, user: req.user, csrf: req.csrf, narrow: opts.narrow ?? true }));

    async function startSession(reply: FastifyReply, userId: string) {
      reply.setCookie(SID, await createSession(ctx, userId), { ...cookieOpts, maxAge: config.SESSION_TTL_DAYS * 86_400 });
    }

    const requireUser = (req: FastifyRequest, reply: FastifyReply) => {
      if (req.user) return req.user;
      reply.redirect(`/signin?next=${encodeURIComponent(req.url)}`);
      return undefined;
    };

    const field = (req: FastifyRequest, name: string) => {
      const val = (req.body as Record<string, unknown> | undefined)?.[name];
      return typeof val === 'string' ? val : undefined;
    };
    const errMsg = (e: unknown) => {
      if (e instanceof ApiError) return e.message;
      if (e instanceof z.ZodError) return e.issues[0]?.message ?? 'Please check the form.';
      throw e;
    };

    app.get('/', (req, reply) => reply.redirect(req.user ? '/account' : '/signin'));

    // ---------- sign in / sign up ----------

    app.get('/signin', (req, reply) => {
      const q = req.query as Record<string, string>;
      const next = safeNext(q.next);
      if (req.user) return reply.redirect(next ?? '/account');
      const notice = q.reset === '1' ? 'Your password is updated. Sign in with the new one.' : q.google_error ? q.google_error : undefined;
      return html(reply, req, 'Sign in', v.signInPage({ csrf: req.csrf, next, notice, google: config.googleConfigured }));
    });

    app.post('/signin', { config: authLimit }, async (req, reply) => {
      const next = safeNext(field(req, 'next'));
      const email = field(req, 'email') ?? '';
      try {
        const user = await authenticate(ctx, emailSchema.parse(email), field(req, 'password') ?? '');
        await startSession(reply, user.id);
        return reply.redirect(next ?? '/account');
      } catch (e) {
        return html(reply, req, 'Sign in', v.signInPage({ csrf: req.csrf, next, email, error: errMsg(e), google: config.googleConfigured }), { status: 400 });
      }
    });

    app.get('/signup', (req, reply) => {
      const next = safeNext((req.query as Record<string, string>).next);
      if (req.user) return reply.redirect(next ?? '/account');
      return html(reply, req, 'Create account', v.signUpPage({ csrf: req.csrf, next, google: config.googleConfigured }));
    });

    app.post('/signup', { config: authLimit }, async (req, reply) => {
      const next = safeNext(field(req, 'next'));
      const email = field(req, 'email') ?? '';
      const name = field(req, 'name') ?? '';
      try {
        const user = await createUser(ctx, { email: emailSchema.parse(email), password: passwordSchema.parse(field(req, 'password') ?? ''), name: name.slice(0, 120) });
        await startSession(reply, user.id);
        if (next) return reply.redirect(next);
        return html(reply, req, 'Check your inbox', v.messagePage({ title: 'Check your inbox', body: `We sent you a link. Check your inbox at ${user.email} to confirm your email.`, link: { href: '/account', label: 'Go to your account' } }));
      } catch (e) {
        return html(reply, req, 'Create account', v.signUpPage({ csrf: req.csrf, next, email, name, error: errMsg(e), google: config.googleConfigured }), { status: 400 });
      }
    });

    app.post('/signout', async (req, reply) => {
      await destroySession(ctx, req.cookies[SID]);
      reply.clearCookie(SID, { path: '/' });
      return reply.redirect('/signin');
    });

    // ---------- password reset & email verification ----------

    app.get('/forgot', (req, reply) => html(reply, req, 'Forgot password', v.forgotPage({ csrf: req.csrf })));

    app.post('/forgot', { config: authLimit }, async (req, reply) => {
      const parsed = emailSchema.safeParse(field(req, 'email') ?? '');
      if (!parsed.success) return html(reply, req, 'Forgot password', v.forgotPage({ csrf: req.csrf, error: 'Enter a valid email address.' }), { status: 400 });
      await sendResetEmail(ctx, parsed.data);
      return html(reply, req, 'Check your inbox', v.messagePage({ title: 'Check your inbox', body: 'If that email has a Verso account, we sent you a link. Check your inbox.' }));
    });

    app.get('/reset', (req, reply) => {
      const token = (req.query as Record<string, string>).token ?? '';
      if (!token) return reply.redirect('/forgot');
      return html(reply, req, 'New password', v.resetPage({ csrf: req.csrf, token }));
    });

    app.post('/reset', { config: authLimit }, async (req, reply) => {
      const token = field(req, 'token') ?? '';
      try {
        await resetPassword(ctx, token, passwordSchema.parse(field(req, 'password') ?? ''));
        reply.clearCookie(SID, { path: '/' });
        return reply.redirect('/signin?reset=1');
      } catch (e) {
        return html(reply, req, 'New password', v.resetPage({ csrf: req.csrf, token, error: errMsg(e) }), { status: 400 });
      }
    });

    app.get('/verify', async (req, reply) => {
      const token = (req.query as Record<string, string>).token ?? '';
      try {
        await verifyEmail(ctx, token);
        return html(reply, req, 'Email confirmed', v.messagePage({ title: 'Your email is confirmed', body: "Thanks. You're all set.", link: { href: '/account', label: 'Go to your account' } }));
      } catch (e) {
        return html(reply, req, 'Link expired', v.messagePage({ title: 'This link has expired', body: errMsg(e), link: { href: '/account', label: 'Go to your account' } }), { status: 400 });
      }
    });

    app.post('/account/resend-verification', { config: authLimit }, async (req, reply) => {
      const user = requireUser(req, reply);
      if (!user) return reply;
      if (!user.email_verified_at) await sendVerifyEmail(ctx, user);
      return reply.redirect('/account?notice=verify_sent');
    });

    // ---------- Google ----------

    app.get('/auth/google', async (req, reply) => {
      if (!config.googleConfigured) {
        return reply.code(503).send({ error: 'google_not_configured', message: "Google sign-in isn't set up on this server yet." });
      }
      const state = randomToken();
      const next = safeNext((req.query as Record<string, string>).next) ?? '/account';
      reply.setCookie(OAUTH, JSON.stringify({ state, next }), { ...cookieOpts, maxAge: 600 });
      return reply.redirect(googleAuthUrl(config, state));
    });

    app.get('/auth/google/callback', { config: authLimit }, async (req, reply) => {
      if (!config.googleConfigured) {
        return reply.code(503).send({ error: 'google_not_configured', message: "Google sign-in isn't set up on this server yet." });
      }
      const q = req.query as Record<string, string>;
      let saved: { state?: string; next?: string } = {};
      try {
        saved = JSON.parse(req.cookies[OAUTH] ?? '{}');
      } catch {}
      reply.clearCookie(OAUTH, { path: '/' });
      const fail = (msg: string) => reply.redirect(`/signin?google_error=${encodeURIComponent(msg)}`);
      if (q.error) return fail('Google sign-in was cancelled.');
      if (!q.code || !q.state || !saved.state || !safeEqual(q.state, saved.state)) return fail('That Google sign-in expired. Please try again.');
      try {
        const profile = await googleProfileFromCode(config, q.code);
        const user = await findOrCreateOAuthUser(ctx, 'google', profile);
        await startSession(reply, user.id);
        return reply.redirect(safeNext(saved.next) ?? '/account');
      } catch (e) {
        return fail(errMsg(e));
      }
    });

    // ---------- desktop sign-in (system browser -> loopback, PKCE) ----------

    app.get('/desktop/sign-in', (req, reply) => {
      const parsed = desktopQuery.safeParse(req.query);
      if (!parsed.success) {
        return html(reply, req, 'Sign-in link broken', v.messagePage({ title: 'This sign-in link is incomplete', body: 'Go back to the Verso app and choose Sign in again.' }), { status: 400 });
      }
      if (!req.user) return reply.redirect(`/signin?next=${encodeURIComponent(req.url)}`);
      const q = parsed.data;
      const hidden = Object.entries(q)
        .filter(([, val]) => val !== undefined)
        .map(([k, val]) => `<input type="hidden" name="${v.esc(k)}" value="${v.esc(val)}">`)
        .join('');
      return html(
        reply,
        req,
        'Sign in to the app',
        `<div class="card"><h1>Sign in to the Verso app?</h1>
<p class="muted">You're signed in as ${v.esc(req.user.email)}.${q.device_name ? ` This will add ${v.esc(q.device_name)} to your devices.` : ''}</p>
<form method="post" action="/desktop/authorize"><input type="hidden" name="_csrf" value="${v.esc(req.csrf)}">${hidden}
<button class="btn primary" type="submit">Continue to Verso</button></form>
<p class="small muted" style="margin:16px 0 0">Not you? Sign out from the top of this page first.</p></div>`,
      );
    });

    app.post('/desktop/authorize', async (req, reply) => {
      const q = desktopQuery.parse(req.body);
      const user = requireUser(req, reply);
      if (!user) return reply;
      const code = await createAuthCode(ctx, user.id, q.code_challenge, { deviceId: q.device_id, deviceName: q.device_name, platform: q.platform });
      const target = new URL(`http://127.0.0.1:${q.port}/callback`);
      target.searchParams.set('code', code);
      target.searchParams.set('state', q.state);
      return reply.redirect(target.toString());
    });

    // ---------- account ----------

    app.get('/account', async (req, reply) => {
      const user = requireUser(req, reply);
      if (!user) return reply;
      const [ent, sub, devices] = await Promise.all([
        getEntitlements(ctx.db, user.id),
        latestSubscription(ctx.db, user.id),
        ctx.db('devices').where({ user_id: user.id }).orderBy('last_seen_at', 'desc'),
      ]);
      const notices: Record<string, string> = {
        verify_sent: 'We sent you a link. Check your inbox.',
        device_removed: 'Device removed. It will be signed out the next time it checks in.',
        cancelled: "Your subscription is cancelled. You keep Pro until the end of this period.",
      };
      const notice = notices[(req.query as Record<string, string>).notice ?? ''];
      return html(reply, req, 'Account', v.accountPage({ user, ent, sub, devices, csrf: req.csrf, notice, payments: config.razorpayConfigured }), { narrow: false });
    });

    app.post('/account/devices/remove', async (req, reply) => {
      const user = requireUser(req, reply);
      if (!user) return reply;
      const id = field(req, 'id');
      if (id) await removeDevice(ctx, user.id, id);
      return reply.redirect('/account?notice=device_removed');
    });

    // ---------- pricing & billing ----------

    const pricing = async (req: FastifyRequest, reply: FastifyReply, error?: string) =>
      html(
        reply,
        req,
        'Pricing',
        v.pricingPage({
          user: req.user,
          ent: req.user ? await getEntitlements(ctx.db, req.user.id) : undefined,
          csrf: req.csrf,
          configured: config.razorpayConfigured,
          monthly: config.PRICE_LABEL_PRO_MONTHLY,
          yearly: config.PRICE_LABEL_PRO_YEARLY,
          error,
        }),
        { narrow: false, status: error ? 400 : 200 },
      );

    app.get('/pricing', (req, reply) => pricing(req, reply));

    app.post('/billing/checkout', async (req, reply) => {
      const user = requireUser(req, reply);
      if (!user) return reply;
      const plan = z.enum(['pro_monthly', 'pro_yearly']).safeParse(field(req, 'plan'));
      if (!plan.success) return pricing(req, reply, 'Pick a plan to continue.');
      try {
        return reply.redirect(await createCheckout(ctx, user, plan.data));
      } catch (e) {
        req.log.error({ err: e }, 'checkout failed');
        return pricing(req, reply, errMsg(e));
      }
    });

    app.post('/billing/cancel', async (req, reply) => {
      const user = requireUser(req, reply);
      if (!user) return reply;
      try {
        await cancelSubscription(ctx, user.id, field(req, 'subscription_id') ?? '');
        return reply.redirect('/account?notice=cancelled');
      } catch (e) {
        return html(reply, req, 'Something went wrong', v.messagePage({ title: "We couldn't cancel that", body: errMsg(e), link: { href: '/account', label: 'Back to your account' } }), { status: 400 });
      }
    });
  };
}
