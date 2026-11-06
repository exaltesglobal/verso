// Server-rendered admin pages. Same Studio-dark layout as the account pages; one Ember button per page.
import type { userDetail } from './admin.js';
import { FEATURE_IDS, LIMIT_IDS, PLANS } from './plans.js';
import { esc } from './views.js';

const csrfField = (csrf: string) => `<input type="hidden" name="_csrf" value="${esc(csrf)}">`;
const alert = (msg?: string) => (msg ? `<div class="alert" role="alert">${esc(msg)}</div>` : '');
const when = (ms: unknown) =>
  ms ? new Date(Number(ms)).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC' : '—';
const day = (ms: unknown) => (ms ? new Date(Number(ms)).toISOString().slice(0, 10) : '');
const label = (id: string) => id.replace(/_/g, ' ');
const confirmBox = (text: string) =>
  `<label class="confirm"><input type="checkbox" name="confirm" value="yes" required> ${esc(text)}</label>`;

export const ADMIN_CSS = `
.anav{display:flex;gap:8px;margin:0 0 20px}
.anav a{padding:6px 12px;border:1px solid #2A2A33;border-radius:99px;color:#B9B7BF;text-decoration:none;font-size:13px}
.anav a.on{color:#F5F4F0;border-color:#B9B7BF}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;color:#B9B7BF;font-weight:600;padding:8px 10px;border-bottom:1px solid #2A2A33}
td{padding:9px 10px;border-bottom:1px solid #2A2A33;vertical-align:top}
td code{font-size:12px;color:#B9B7BF;word-break:break-all}
.scroll{overflow-x:auto}
select,textarea{width:100%;padding:10px 12px;background:#1D1D24;border:1px solid #2A2A33;border-radius:10px;color:#F5F4F0;font:inherit}
.fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0 16px}
.inline-form{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap}
.inline-form>*{flex:1;min-width:140px}
.inline-form .btn{flex:0 0 auto;margin-top:0}
label.confirm{display:flex;gap:8px;align-items:center;color:#F5F4F0;margin:12px 0 0}
label.confirm input{width:auto}
.tag.warn{color:#F5F4F0;border-color:#B9B7BF}
.kv{display:grid;grid-template-columns:160px 1fr;gap:6px 16px;font-size:14px}
.kv dt{color:#B9B7BF}.kv dd{margin:0}`;

export function adminNav(active: 'users' | 'invites' | 'audit') {
  const a = (k: string, href: string, text: string) => `<a href="${href}"${k === active ? ' class="on"' : ''}>${text}</a>`;
  return `<nav class="anav" aria-label="Admin">${a('users', '/admin/users', 'Users')}${a('invites', '/admin/invites', 'Invites')}${a('audit', '/admin/audit', 'Audit log')}</nav>`;
}

type UserRow = { id: string; email: string; name: string | null; plan: string; overridden: boolean; credits: number | null; devices: number; lastSeenAt: number | null; blocked: boolean };

export function usersPage(o: { csrf: string; q: string; users: UserRow[] }) {
  const rows = o.users
    .map(
      (u) => `<tr><td><a href="/admin/users/${esc(u.id)}">${esc(u.email)}</a>${u.name ? `<div class="small muted">${esc(u.name)}</div>` : ''}</td>
<td>${u.plan === 'pro' ? 'Pro' : 'Free'}${u.overridden ? ' <span class="tag">override</span>' : ''}</td>
<td>${u.credits ?? '—'}</td><td>${u.devices}</td><td>${when(u.lastSeenAt)}</td>
<td>${u.blocked ? '<span class="tag warn">Paused</span>' : 'Active'}</td></tr>`,
    )
    .join('');
  return `${adminNav('users')}<h1>Users</h1>
<form method="get" action="/admin/users" class="inline-form" style="margin:0 0 20px"><div><label for="q">Email, name or user id</label><input id="q" name="q" value="${esc(o.q)}" autofocus></div>
<button class="btn primary inline" type="submit">Search</button></form>
<div class="card scroll" style="padding:8px 12px">${
    o.users.length
      ? `<table><thead><tr><th>User</th><th>Plan</th><th>Credits</th><th>Devices</th><th>Last seen</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`
      : `<p class="muted" style="margin:12px">Nobody matches that search.</p>`
  }</div><p class="small muted" style="margin-top:8px">Shows the 50 newest matches.</p>`;
}

type Detail = Awaited<ReturnType<typeof userDetail>>;

export function userPage(o: Detail & { csrf: string; notice?: string; error?: string }) {
  const { user, ent, override: ov, balance } = o;
  const base = `/admin/users/${esc(user.id)}`;
  const form = (path: string, inner: string, style = '') => `<form method="post" action="${base}${path}" style="margin:0;${style}">${csrfField(o.csrf)}${inner}</form>`;

  const planText = `${ent.plan === 'pro' ? 'Pro' : 'Free'}${ent.billingPlan ? ` · ${esc(ent.billingPlan)} (${esc(ent.status)})` : ''}${ent.expiresAt ? ` · until ${when(Date.parse(ent.expiresAt))}` : ''}`;
  const featureRows = FEATURE_IDS.map((id) => {
    const cur = ov?.features[id];
    const opt = (v: string, t: string, sel: boolean) => `<option value="${v}"${sel ? ' selected' : ''}>${t}</option>`;
    return `<div><label for="f_${id}">${esc(label(id))} <span class="muted">(now ${ent.features[id] ? 'on' : 'off'})</span></label>
<select id="f_${id}" name="f_${id}">${opt('', 'From plan', cur === undefined)}${opt('on', 'Always on', cur === true)}${opt('off', 'Always off', cur === false)}</select></div>`;
  }).join('');
  const limitRows = LIMIT_IDS.map(
    (id) => `<div><label for="l_${id}">${esc(label(id))} <span class="muted">(now ${ent.limits[id]})</span></label>
<input id="l_${id}" name="l_${id}" type="number" min="-1" step="1" value="${ov?.limits[id] ?? ''}" placeholder="From plan (free ${PLANS.free.limits[id as keyof typeof PLANS.free.limits]}, pro ${PLANS.pro.limits[id as keyof typeof PLANS.pro.limits]})"></div>`,
  ).join('');
  const planSel = (v: string, t: string) => `<option value="${v}"${(ov?.plan_override ?? '') === v ? ' selected' : ''}>${t}</option>`;

  const ledger = o.ledger.length
    ? `<table><thead><tr><th>When</th><th>Change</th><th>Kind</th><th>Reason</th></tr></thead><tbody>${o.ledger
        .map((r) => `<tr><td>${when(r.created_at)}</td><td>${Number(r.delta) > 0 ? '+' : ''}${Number(r.delta)} <span class="muted">${esc(r.bucket)}</span></td><td>${esc(r.kind)}</td><td>${esc(r.reason ?? r.action ?? '')}</td></tr>`)
        .join('')}</tbody></table>`
    : `<p class="muted" style="margin:0">No credit activity yet.</p>`;

  const devices = o.devices.length
    ? o.devices
        .map(
          (d) => `<div class="row"><div><div>${esc(d.name || 'Unnamed device')}</div><div class="small muted">${esc(d.platform || '')} · last seen ${when(d.last_seen_at)}</div></div>
${form('/devices/remove', `<input type="hidden" name="id" value="${esc(d.id)}"><button class="btn inline" type="submit" style="margin:0">Remove</button>`)}</div>`,
        )
        .join('')
    : `<p class="muted" style="margin:0">No devices.</p>`;

  const auditRows = o.audit.length
    ? `<table><tbody>${o.audit.map((a) => `<tr><td>${when(a.at)}</td><td>${esc(a.action)}</td><td>${esc(a.admin)}</td></tr>`).join('')}</tbody></table>
<p class="small" style="margin:8px 0 0"><a href="/admin/audit?user=${esc(user.id)}">See all</a></p>`
    : `<p class="muted" style="margin:0">No admin changes yet.</p>`;

  return `${adminNav('users')}${alert(o.error ?? o.notice)}
<h1>${esc(user.email)}</h1><p class="muted">${esc(user.name ?? '')}${user.name ? ' · ' : ''}<code>${esc(user.id)}</code></p>
<div class="card"><h2>Summary ${user.blocked_at ? '<span class="tag warn">Paused</span>' : ''}</h2><dl class="kv">
<dt>Plan now</dt><dd>${planText}${ent.overridden ? ' <span class="tag">override</span>' : ''}</dd>
<dt>Credits</dt><dd>${balance.total} (${balance.allowance} monthly + ${balance.purchased} bought) · refills ${when(Date.parse(balance.resetsAt))}</dd>
<dt>Email</dt><dd>${user.email_verified_at ? 'Confirmed' : 'Not confirmed'}</dd>
<dt>Joined</dt><dd>${when(user.created_at)}</dd>
<dt>Status</dt><dd>${user.blocked_at ? `Paused since ${when(user.blocked_at)}` : 'Active'}</dd>
</dl></div>

<div class="card"><h2>Access</h2>
${ov ? `<p class="small muted">Override set by ${esc(ov.granted_by ?? 'unknown')}${ov.note ? `: “${esc(ov.note)}”` : ''}.</p>` : `<p class="small muted">No override. Access comes from the subscription.</p>`}
${form(
  '/override',
  `<div class="fields"><div><label for="plan">Plan</label><select id="plan" name="plan">${planSel('', 'From subscription')}${planSel('pro', 'Pro (comp)')}${planSel('free', 'Free')}</select></div>
<div><label for="ends">Plan override ends</label><input id="ends" name="ends" type="date" value="${day(ov?.expires_at)}"><p class="small muted" style="margin:4px 0 0">Empty means no end date.</p></div></div>
<h2 style="margin-top:20px">Features</h2><div class="fields">${featureRows}</div>
<h2 style="margin-top:20px">Limits</h2><p class="small muted" style="margin:0">-1 means unlimited. Empty means use the plan's number.</p><div class="fields">${limitRows}</div>
<label for="note">Note</label><input id="note" name="note" maxlength="240" value="${esc(ov?.note ?? '')}" placeholder="Why, for the audit log">
<button class="btn primary inline" type="submit">Save access</button>`,
)}
${ov ? form('/override/clear', `${confirmBox('Yes, remove every override for this user')}<button class="btn inline" type="submit">Remove overrides</button>`, 'margin-top:20px;border-top:1px solid #2A2A33;padding-top:8px') : ''}
</div>

<div class="card"><h2>Credits</h2>
${form(
  '/credits',
  `<div class="inline-form"><div><label for="amount">Credits to add (negative takes away)</label><input id="amount" name="amount" type="number" step="1" required></div>
<div style="flex:2"><label for="cnote">Note</label><input id="cnote" name="note" maxlength="160" placeholder="Shown in the user's history"></div></div>
<label class="confirm"><input type="checkbox" name="confirm" value="yes"> I'm sure (needed when taking credits away)</label>
<button class="btn inline" type="submit">Update credits</button>`,
)}
<h2 style="margin-top:24px">History</h2><div class="scroll">${ledger}</div></div>

<div class="card"><h2>Account</h2>
${
  user.blocked_at
    ? form('/unblock', `<p class="muted">This account is paused. The user can't sign in, and the app shows "Your account is paused."</p><button class="btn inline" type="submit">Unpause account</button>`)
    : form('/block', `<p class="muted">Pausing signs the user out of the website now and stops the app at its next check-in (within 15 minutes).</p><input name="note" maxlength="160" placeholder="Reason, for the audit log">${confirmBox('Yes, pause this account')}<button class="btn inline" type="submit">Pause account</button>`)
}
${form('/signout-all', `<p class="muted" style="margin-top:20px">Ends every browser session and app sign-in. The user can sign in again.</p><button class="btn inline" type="submit">Sign out everywhere</button>`)}
</div>

<div class="card"><h2>Devices <span class="tag">${o.devices.length} of ${ent.limits.max_devices}</span></h2>${devices}</div>
<div class="card"><h2>Recent admin changes</h2><div class="scroll">${auditRows}</div></div>`;
}

type Invite = { code: string; note: string | null; max_uses: number; uses: number; expires_at: number | null; created_at: number };

export function invitesPage(o: { csrf: string; invites: Invite[]; created?: string[]; notice?: string; error?: string }) {
  const t = Date.now();
  const status = (i: Invite) =>
    i.expires_at && Number(i.expires_at) <= t ? 'Ended' : Number(i.uses) >= Number(i.max_uses) ? 'Used up' : 'Open';
  const rows = o.invites
    .map(
      (i) => `<tr><td><code>${esc(i.code)}</code></td><td>${Number(i.uses)} / ${Number(i.max_uses)}</td><td>${esc(i.note ?? '')}</td>
<td>${i.expires_at ? when(i.expires_at) : 'Never'}</td><td>${status(i)}</td>
<td>${status(i) === 'Open' ? `<form method="post" action="/admin/invites/revoke" style="margin:0">${csrfField(o.csrf)}<input type="hidden" name="code" value="${esc(i.code)}">${confirmBox('Sure')}<button class="btn inline" type="submit" style="margin-top:6px">Revoke</button></form>` : ''}</td></tr>`,
    )
    .join('');
  return `${adminNav('invites')}${alert(o.error ?? o.notice)}<h1>Beta invites</h1>
${o.created?.length ? `<div class="card"><h2>New codes</h2><pre style="margin:0;white-space:pre-wrap">${esc(o.created.join('\n'))}</pre></div>` : ''}
<div class="card"><h2>Create codes</h2><form method="post" action="/admin/invites" style="margin:0">${csrfField(o.csrf)}
<div class="fields"><div><label for="count">How many codes</label><input id="count" name="count" type="number" min="1" max="500" value="1"></div>
<div><label for="uses">Uses per code</label><input id="uses" name="uses" type="number" min="1" value="1"></div>
<div><label for="ends">Ends on</label><input id="ends" name="ends" type="date"></div></div>
<label for="note">Note</label><input id="note" name="note" maxlength="120" placeholder="Who these are for">
<button class="btn primary inline" type="submit">Create codes</button></form></div>
<div class="card scroll" style="padding:8px 12px">${
    o.invites.length
      ? `<table><thead><tr><th>Code</th><th>Used</th><th>Note</th><th>Ends</th><th>Status</th><th></th></tr></thead><tbody>${rows}</tbody></table>`
      : `<p class="muted" style="margin:12px">No invite codes yet.</p>`
  }</div>`;
}

type AuditRow = { id: number; admin: string; action: string; target_user_id: string | null; before: string | null; after: string | null; ip: string | null; at: number };

export function auditPage(o: { rows: AuditRow[]; f: { admin?: string; action?: string; user?: string } }) {
  const short = (s: string | null) => (s ? esc(s.length > 300 ? `${s.slice(0, 300)}…` : s) : '');
  const rows = o.rows
    .map(
      (r) => `<tr><td>${when(r.at)}</td><td>${esc(r.admin)}<div class="small muted">${esc(r.ip ?? '')}</div></td><td>${esc(r.action)}</td>
<td>${r.target_user_id ? `<a href="/admin/users/${esc(r.target_user_id)}">${esc(r.target_user_id.slice(0, 8))}…</a>` : ''}</td>
<td><code>${short(r.before)}</code></td><td><code>${short(r.after)}</code></td></tr>`,
    )
    .join('');
  const last = o.rows.at(-1);
  const older = last && o.rows.length >= 100
    ? `<p><a href="/admin/audit?${new URLSearchParams({ ...Object.fromEntries(Object.entries(o.f).filter(([, v]) => v)), before: String(last.id) }).toString()}">Older entries</a></p>`
    : '';
  return `${adminNav('audit')}<h1>Audit log</h1>
<form method="get" action="/admin/audit" class="inline-form" style="margin:0 0 20px">
<div><label for="admin">Admin</label><input id="admin" name="admin" value="${esc(o.f.admin ?? '')}"></div>
<div><label for="action">Action</label><input id="action" name="action" value="${esc(o.f.action ?? '')}" placeholder="e.g. override, credits, user.block"></div>
<div><label for="user">User email or id</label><input id="user" name="user" value="${esc(o.f.user ?? '')}"></div>
<button class="btn primary inline" type="submit">Filter</button></form>
<div class="card scroll" style="padding:8px 12px">${
    o.rows.length
      ? `<table><thead><tr><th>When</th><th>Admin</th><th>Action</th><th>User</th><th>Before</th><th>After</th></tr></thead><tbody>${rows}</tbody></table>`
      : `<p class="muted" style="margin:12px">No entries match.</p>`
  }</div>${older}`;
}
