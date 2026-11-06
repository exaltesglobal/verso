// /admin pages (session cookie + CSRF form field) and /admin/api JSON mirrors (session + _csrf, or an
// admin's Bearer access token). Registered inside pageRoutes so the session and CSRF hooks apply.
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  adjustCredits,
  adminRemoveDevice,
  clearOverride,
  createInvites,
  isAdminEmail,
  listAudit,
  listInvites,
  overrideInput,
  revokeInvite,
  searchUsers,
  setBlocked,
  setOverride,
  signOutEverywhere,
  userDetail,
  type Actor,
  type OverrideInput,
} from './admin.js';
import { findUserById } from './auth.js';
import { ApiError, type Ctx } from './ctx.js';
import { now } from './db.js';
import { FEATURE_IDS, LIMIT_IDS } from './plans.js';
import { requireBearer } from './routes-api.js';
import * as av from './views-admin.js';

type Html = (reply: FastifyReply, req: FastifyRequest, title: string, body: string, opts?: { narrow?: boolean; status?: number }) => FastifyReply;

const lim = { config: { rateLimit: { max: 120, timeWindow: '1 minute' } } };

const NOTICES: Record<string, string> = {
  override: 'Access saved. The app picks it up the next time it checks in.',
  cleared: 'Overrides removed. Access comes from the subscription again.',
  credits: 'Credits updated.',
  blocked: 'Account paused.',
  unblocked: 'Account unpaused.',
  signedout: 'Signed out everywhere.',
  device: 'Device removed.',
  revoked: 'Invite revoked.',
};

/** "2026-12-31" from a date input to the end of that day (UTC), or null when empty. */
function endOfDay(v: string | undefined) {
  if (!v?.trim()) return null;
  const t = Date.parse(`${v.trim()}T23:59:59.999Z`);
  if (Number.isNaN(t)) throw new ApiError(400, 'invalid_date', 'That date looks wrong.');
  if (t <= now()) throw new ApiError(400, 'invalid_date', 'Pick a date in the future.');
  return t;
}

function overrideFromForm(b: Record<string, string>): OverrideInput {
  const features: Record<string, boolean> = {};
  for (const id of FEATURE_IDS) if (b[`f_${id}`] === 'on' || b[`f_${id}`] === 'off') features[id] = b[`f_${id}`] === 'on';
  const limits: Record<string, number> = {};
  for (const id of LIMIT_IDS) {
    const v = b[`l_${id}`]?.trim();
    if (v) limits[id] = Number(v);
  }
  const plan = b.plan === 'pro' || b.plan === 'free' ? b.plan : null;
  return overrideInput.parse({ plan, expiresAt: plan ? endOfDay(b.ends) : null, features, limits, note: b.note ?? '' });
}

export function adminRoutes(ctx: Ctx, html: Html) {
  const { config } = ctx;

  return async function (app: FastifyInstance) {
    const body = (req: FastifyRequest) => (req.body ?? {}) as Record<string, string>;
    const errMsg = (e: unknown) => {
      if (e instanceof ApiError) return e.message;
      if (e instanceof z.ZodError) return e.issues[0]?.message ?? 'Please check the form.';
      throw e;
    };

    /** Signed-in admin for pages; redirects or 404s otherwise (so non-admins can't tell /admin exists). */
    const pageAdmin = (req: FastifyRequest, reply: FastifyReply): Actor | undefined => {
      if (!req.user) {
        reply.redirect(`/signin?next=${encodeURIComponent(req.url)}`);
        return undefined;
      }
      if (!isAdminEmail(config, req.user)) {
        html(reply, req, 'Not found', `<div class="card"><h1>Page not found</h1></div>`, { status: 404 });
        return undefined;
      }
      return { admin: req.user.email, ip: req.ip };
    };

    const apiAdmin = async (req: FastifyRequest): Promise<Actor> => {
      let user = req.user;
      if (req.headers.authorization?.startsWith('Bearer ')) user = await findUserById(ctx, (await requireBearer(ctx, req)).userId);
      if (!user) throw new ApiError(401, 'unauthorized', 'Sign in required.');
      if (!isAdminEmail(config, user)) throw new ApiError(404, 'not_found', 'Not found.');
      return { admin: user.email, ip: req.ip };
    };

    // ---------- pages ----------

    app.get('/admin', lim, (req, reply) => (pageAdmin(req, reply) ? reply.redirect('/admin/users') : reply));

    app.get('/admin/users', lim, async (req, reply) => {
      if (!pageAdmin(req, reply)) return reply;
      const q = String((req.query as Record<string, string>).q ?? '').slice(0, 254);
      return html(reply, req, 'Users', av.usersPage({ csrf: req.csrf, q, users: await searchUsers(ctx, q) }), { narrow: false });
    });

    const detailPage = async (req: FastifyRequest, reply: FastifyReply, id: string, error?: string) => {
      const d = await userDetail(ctx, id);
      const notice = NOTICES[(req.query as Record<string, string>).ok ?? ''];
      return html(reply, req, d.user.email, av.userPage({ ...d, csrf: req.csrf, notice, error }), { narrow: false, status: error ? 400 : 200 });
    };

    app.get('/admin/users/:id', lim, async (req, reply) => {
      if (!pageAdmin(req, reply)) return reply;
      try {
        return await detailPage(req, reply, (req.params as { id: string }).id);
      } catch (e) {
        return html(reply, req, 'Not found', `<div class="card"><h1>${errMsg(e)}</h1><a href="/admin/users">Back to users</a></div>`, { status: 404 });
      }
    });

    /** POST handler for a user detail action: runs it, then redirects back with a notice or re-renders with the error. */
    const userAction = (path: string, run: (actor: Actor, id: string, b: Record<string, string>) => Promise<unknown>, ok: string) =>
      app.post(`/admin/users/:id${path}`, lim, async (req, reply) => {
        const actor = pageAdmin(req, reply);
        if (!actor) return reply;
        const id = (req.params as { id: string }).id;
        try {
          await run(actor, id, body(req));
          return reply.redirect(`/admin/users/${encodeURIComponent(id)}?ok=${ok}`);
        } catch (e) {
          return detailPage(req, reply, id, errMsg(e));
        }
      });

    const confirmed = (b: Record<string, string>, what: string) => {
      if (b.confirm !== 'yes') throw new ApiError(400, 'confirm_required', `Tick the box to confirm ${what}.`);
    };

    userAction('/override', (a, id, b) => setOverride(ctx, a, id, overrideFromForm(b)), 'override');
    userAction('/override/clear', (a, id, b) => (confirmed(b, 'removing the overrides'), clearOverride(ctx, a, id)), 'cleared');
    userAction(
      '/credits',
      (a, id, b) => {
        const amount = Number(b.amount);
        if (amount < 0) confirmed(b, 'taking credits away');
        return adjustCredits(ctx, a, id, amount, b.note ?? '');
      },
      'credits',
    );
    userAction('/block', (a, id, b) => (confirmed(b, 'pausing the account'), setBlocked(ctx, a, id, true, b.note ?? '')), 'blocked');
    userAction('/unblock', (a, id) => setBlocked(ctx, a, id, false), 'unblocked');
    userAction('/signout-all', (a, id) => signOutEverywhere(ctx, a, id), 'signedout');
    userAction('/devices/remove', (a, id, b) => adminRemoveDevice(ctx, a, id, b.id ?? ''), 'device');

    const invitesPage = async (req: FastifyRequest, reply: FastifyReply, extra: { created?: string[]; error?: string } = {}) =>
      html(
        reply,
        req,
        'Invites',
        av.invitesPage({ csrf: req.csrf, invites: await listInvites(ctx), notice: NOTICES[(req.query as Record<string, string>).ok ?? ''], ...extra }),
        { narrow: false, status: extra.error ? 400 : 200 },
      );

    app.get('/admin/invites', lim, async (req, reply) => (pageAdmin(req, reply) ? invitesPage(req, reply) : reply));

    app.post('/admin/invites', lim, async (req, reply) => {
      const actor = pageAdmin(req, reply);
      if (!actor) return reply;
      const b = body(req);
      try {
        const created = await createInvites(ctx, actor, Number(b.count), Number(b.uses), b.note ?? '', endOfDay(b.ends));
        return invitesPage(req, reply, { created });
      } catch (e) {
        return invitesPage(req, reply, { error: errMsg(e) });
      }
    });

    app.post('/admin/invites/revoke', lim, async (req, reply) => {
      const actor = pageAdmin(req, reply);
      if (!actor) return reply;
      const b = body(req);
      try {
        confirmed(b, 'revoking the code');
        await revokeInvite(ctx, actor, b.code ?? '');
        return reply.redirect('/admin/invites?ok=revoked');
      } catch (e) {
        return invitesPage(req, reply, { error: errMsg(e) });
      }
    });

    const auditFilter = z.object({
      admin: z.string().max(254).optional(),
      action: z.string().max(40).optional(),
      user: z.string().max(254).optional(),
      before: z.coerce.number().int().positive().optional(),
    });

    app.get('/admin/audit', lim, async (req, reply) => {
      if (!pageAdmin(req, reply)) return reply;
      const f = auditFilter.parse(req.query);
      return html(reply, req, 'Audit log', av.auditPage({ rows: await listAudit(ctx, f), f }), { narrow: false });
    });

    // ---------- JSON API ----------

    app.get('/admin/api/users', lim, async (req) => {
      await apiAdmin(req);
      return { users: await searchUsers(ctx, String((req.query as Record<string, string>).q ?? '').slice(0, 254)) };
    });

    app.get('/admin/api/users/:id', lim, async (req) => {
      await apiAdmin(req);
      return userDetail(ctx, (req.params as { id: string }).id);
    });

    const apiAction = (path: string, run: (actor: Actor, id: string, b: Record<string, unknown>) => Promise<unknown>) =>
      app.post(`/admin/api/users/:id${path}`, lim, async (req) => {
        const actor = await apiAdmin(req);
        const result = await run(actor, (req.params as { id: string }).id, (req.body ?? {}) as Record<string, unknown>);
        return { ok: true, result: result ?? null };
      });

    // Body: { plan: "pro"|"free"|null, expiresAt?: epoch ms, days?: number, features?: {...}, limits?: {...}, note? }
    apiAction('/override', (a, id, b) => {
      const days = z.number().positive().max(36_500).optional().parse(b.days);
      return setOverride(ctx, a, id, overrideInput.parse({ ...b, expiresAt: days ? now() + days * 86_400_000 : (b.expiresAt ?? null) }));
    });
    apiAction('/override/clear', (a, id) => clearOverride(ctx, a, id));
    apiAction('/credits', (a, id, b) => {
      const p = z.object({ amount: z.number().int(), note: z.string().max(160).default('') }).parse(b);
      return adjustCredits(ctx, a, id, p.amount, p.note);
    });
    apiAction('/block', (a, id, b) => setBlocked(ctx, a, id, true, z.string().max(160).default('').parse(b.note)));
    apiAction('/unblock', (a, id) => setBlocked(ctx, a, id, false));
    apiAction('/signout-all', (a, id) => signOutEverywhere(ctx, a, id));
    apiAction('/devices/remove', (a, id, b) => adminRemoveDevice(ctx, a, id, z.string().max(36).parse(b.id)));

    app.get('/admin/api/invites', lim, async (req) => {
      await apiAdmin(req);
      return { invites: await listInvites(ctx) };
    });

    app.post('/admin/api/invites', lim, async (req) => {
      const actor = await apiAdmin(req);
      const b = z
        .object({ count: z.number().int().min(1).max(500).default(1), maxUses: z.number().int().min(1).default(1), note: z.string().max(120).default(''), expiresAt: z.number().int().positive().nullable().default(null) })
        .parse(req.body ?? {});
      return { codes: await createInvites(ctx, actor, b.count, b.maxUses, b.note, b.expiresAt) };
    });

    app.post('/admin/api/invites/revoke', lim, async (req) => {
      const actor = await apiAdmin(req);
      await revokeInvite(ctx, actor, z.object({ code: z.string().max(32) }).parse(req.body).code);
      return { ok: true };
    });

    app.get('/admin/api/audit', lim, async (req) => {
      await apiAdmin(req);
      return { entries: await listAudit(ctx, auditFilter.parse(req.query)) };
    });
  };
}
