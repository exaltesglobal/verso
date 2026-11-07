import type { User } from './auth.js';
import type { Pack } from './credits.js';
import { PLANS, type Entitlements } from './plans.js';

export const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const CSS = `@font-face{font-family:Manrope;src:url(/assets/manrope.woff2) format("woff2");font-weight:200 800;font-display:swap}
:root{--ink:#0B0B0F;--panel:#111116;--surface:#16161C;--raised:#1D1D24;--line:#2A2A33;--line-strong:#3A3A45;--paper:#F5F4F0;--text-2:#B9B7BF;--muted:#8E8C96;--dim:#5C5B66;--ember:#FF4A2B;--glow:#FF9466;--ember-tint:rgba(255,74,43,.12);--grad:linear-gradient(135deg,#FF9466 0%,#FF4A2B 100%);--ease:cubic-bezier(.2,.8,.2,1)}
*{box-sizing:border-box}
html,body{margin:0;background:var(--ink);color:var(--paper);font-family:Manrope,system-ui,sans-serif;font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}
body{min-height:100vh;display:flex;flex-direction:column;position:relative;isolation:isolate}
body:before{content:"";position:absolute;inset:0 0 auto;height:620px;z-index:-1;pointer-events:none;background:radial-gradient(55% 60% at 50% 0%,rgba(255,74,43,.14),transparent 70%),radial-gradient(35% 40% at 88% 10%,rgba(255,148,102,.07),transparent 70%)}
a{color:var(--paper);text-decoration-color:rgba(255,74,43,.6);text-underline-offset:3px}
a:hover{text-decoration-color:var(--ember)}
:focus-visible{outline:2px solid var(--glow);outline-offset:3px;border-radius:8px}
header{position:sticky;top:0;z-index:10;background:rgba(11,11,15,.72);backdrop-filter:saturate(140%) blur(18px);-webkit-backdrop-filter:saturate(140%) blur(18px);border-bottom:1px solid rgba(42,42,51,.6)}
header .in{display:flex;align-items:center;justify-content:space-between;gap:20px;max-width:1080px;margin:0 auto;padding:0 24px;height:64px}
header .brand{display:block;text-decoration:none}
header .brand img{display:block;height:28px;width:auto}
header nav{display:flex;align-items:center;gap:24px}
header nav a,header nav button{color:var(--text-2);text-decoration:none;font:600 14px Manrope,system-ui,sans-serif;background:none;border:0;cursor:pointer;padding:0;transition:color .2s}
header nav a:hover,header nav button:hover{color:var(--paper)}
main{flex:1;width:100%;max-width:1080px;margin:0 auto;padding:48px 24px 80px}
.narrow{max-width:440px;margin:24px auto 0}
.auth{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,440px);gap:56px;align-items:center;margin-top:8px}
.auth .art{position:relative;min-height:560px;border-radius:24px;overflow:hidden;border:1px solid var(--line);background:var(--raised) center/cover no-repeat;display:flex;flex-direction:column;justify-content:flex-end;padding:36px;isolation:isolate}
.auth .art:before{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(11,11,15,.1) 30%,rgba(11,11,15,.92))}
.auth .art b{font-size:44px;font-weight:800;letter-spacing:-.045em;line-height:1.02}
.auth .art b em{font-style:normal;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent}
.auth .art p{margin:12px 0 0;color:var(--text-2);max-width:36ch}
.card{background:linear-gradient(180deg,var(--surface),var(--panel));border:1px solid var(--line);border-radius:22px;padding:32px;box-shadow:0 30px 90px rgba(0,0,0,.45)}
.card+.card{margin-top:16px}
h1{font-size:clamp(28px,3.4vw,40px);line-height:1.08;margin:0 0 10px;font-weight:800;letter-spacing:-.04em}
h2{font-size:19px;margin:0 0 14px;font-weight:700;letter-spacing:-.02em}
p{margin:0 0 16px}
.muted{color:var(--text-2)}
.small{font-size:13px}
label{display:block;font-size:13px;font-weight:600;color:var(--text-2);margin:18px 0 8px}
input{width:100%;padding:13px 16px;background:var(--panel);border:1px solid var(--line-strong);border-radius:14px;color:var(--paper);font:inherit;transition:border-color .2s,box-shadow .2s}
input::placeholder{color:var(--dim)}
input:focus{outline:none;border-color:var(--glow);box-shadow:0 0 0 4px var(--ember-tint)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:13px 20px;border-radius:999px;font:700 15px Manrope,system-ui,sans-serif;letter-spacing:-.01em;text-decoration:none;cursor:pointer;border:1px solid var(--line-strong);background:transparent;color:var(--paper);transition:transform .2s var(--ease),box-shadow .2s var(--ease),background .2s,border-color .2s}
.btn:hover{border-color:var(--muted)}
.btn:disabled{opacity:.5;cursor:not-allowed;border-color:var(--line)}
.btn.primary{background:var(--ember);border-color:var(--ember);color:var(--ink);box-shadow:0 0 0 1px rgba(255,74,43,.4),0 8px 28px rgba(255,74,43,.28)}
.btn.primary:hover{background:#FF5F43;transform:translateY(-1px);box-shadow:0 0 0 1px rgba(255,74,43,.5),0 14px 36px rgba(255,74,43,.36)}
.btn.inline{width:auto}
form .btn{margin-top:22px}
.or{display:flex;align-items:center;gap:12px;color:var(--muted);font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin:22px 0 0}
.or:before,.or:after{content:"";flex:1;height:1px;background:var(--line)}
.alert{background:var(--ember-tint);border:1px solid rgba(255,74,43,.35);border-radius:14px;padding:12px 16px;margin:0 0 18px;font-size:14px}
.row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 0;border-top:1px solid var(--line)}
.row:first-of-type{border-top:0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;margin-top:32px;align-items:stretch}
.grid .card{display:flex;flex-direction:column}
.grid .card+.card{margin-top:0}
.grid .card ul.ticks{flex:1;align-content:start}
.price{font-size:46px;font-weight:800;letter-spacing:-.04em;line-height:1;margin:6px 0 14px}
ul.ticks{list-style:none;padding:0;margin:8px 0 20px;display:grid;gap:10px}
ul.ticks li{display:grid;grid-template-columns:18px minmax(0,1fr);gap:10px;color:var(--text-2)}
ul.ticks li:before{content:"";width:14px;height:8px;border-left:2px solid var(--glow);border-bottom:2px solid var(--glow);transform:rotate(-45deg) translate(1px,4px)}
.tag{display:inline-block;font:600 11px ui-monospace,monospace;letter-spacing:.06em;padding:4px 9px;border-radius:999px;background:var(--ember-tint);color:var(--glow);vertical-align:middle}
footer{border-top:1px solid var(--line);color:var(--muted);font-size:13px}
footer .in{max-width:1080px;margin:0 auto;padding:28px 24px 40px;display:flex;flex-wrap:wrap;gap:16px 32px;justify-content:space-between}
footer nav{display:flex;flex-wrap:wrap;gap:20px}
footer a{color:var(--text-2);text-decoration:none}
footer a:hover{color:var(--paper)}
@media (max-width:900px){.auth{grid-template-columns:1fr;gap:24px}.auth .art{min-height:220px;padding:24px}.auth .art b{font-size:30px}.auth .art p{display:none}}
@media (max-width:560px){main{padding:28px 16px 64px}.card{padding:24px}header .in{padding:0 16px}header nav{gap:16px}}`;

type LayoutOpts = { title: string; user?: User | null; csrf?: string; body: string; narrow?: boolean };

const SITE = 'https://verso.video';
/** Auth pages get the website's look: a real creator photo beside the form (image served by verso.video). */
const ART = `<aside class="art" style="background-image:url(${SITE}/img/who-podcaster.webp)" aria-hidden="true"><b>Long videos in.<br><em>Reels out.</em></b><p>Verso finds the best moments, frames them for 9:16 and adds captions, all on your own computer.</p></aside>`;

export function layout(o: LayoutOpts) {
  const nav = o.user
    ? `<a href="/pricing">Pricing</a><a href="/account">Account</a>
       <form method="post" action="/signout" style="margin:0"><input type="hidden" name="_csrf" value="${esc(o.csrf)}"><button type="submit">Sign out</button></form>`
    : `<a href="${SITE}">Home</a><a href="/pricing">Pricing</a><a href="/signin">Sign in</a>`;
  const body = o.narrow ? (o.user ? `<div class="narrow">${o.body}</div>` : `<div class="auth">${ART}<div>${o.body}</div></div>`) : o.body;
  const links = [['Privacy', '/privacy'], ['Terms', '/terms'], ['Refunds', '/refunds'], ['Contact', '/contact']]
    .map(([t, h]) => `<a href="${SITE}${h}">${t}</a>`).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="robots" content="noindex, nofollow"><title>${esc(o.title)} · Verso</title>
<link rel="preload" href="/assets/manrope.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/app.css"></head>
<body><header><div class="in"><a class="brand" href="${SITE}"><img src="/assets/verso-logo.svg" alt="Verso" width="96" height="28"></a><nav>${nav}</nav></div></header>
<main>${body}</main>
<footer><div class="in"><span>© ${new Date().getFullYear()} Verso by Agape Labs · Exaltes Global Private Limited</span><nav>${links}</nav></div></footer></body></html>`;
}

const csrfField = (csrf: string) => `<input type="hidden" name="_csrf" value="${esc(csrf)}">`;
const alert = (msg?: string) => (msg ? `<div class="alert" role="alert">${esc(msg)}</div>` : '');
const nextField = (next?: string) => (next ? `<input type="hidden" name="next" value="${esc(next)}">` : '');
const withNext = (path: string, next?: string) => (next ? `${path}?next=${encodeURIComponent(next)}` : path);
/** Google first, then an "or" divider. Shown disabled (not hidden) when the server has no Google keys. */
const googleBlock = (configured: boolean, next?: string) =>
  (configured
    ? `<a class="btn" href="${esc(withNext('/auth/google', next))}">Continue with Google</a>`
    : `<button class="btn" type="button" disabled aria-describedby="google-off">Continue with Google</button><p id="google-off" class="small muted" style="margin:6px 0 0">Google sign-in isn't set up yet.</p>`) +
  `<div class="or">or</div>`;

export function signInPage(o: { csrf: string; next?: string; error?: string; notice?: string; email?: string; google: boolean }) {
  return `<div class="card"><h1>Sign in to Verso</h1><p class="muted">Welcome back.</p>
${alert(o.error ?? o.notice)}
${googleBlock(o.google, o.next)}
<form method="post" action="/signin">${csrfField(o.csrf)}${nextField(o.next)}
<label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required value="${esc(o.email)}">
<label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required>
<button class="btn primary" type="submit">Sign in</button></form>
<p class="small muted" style="margin:20px 0 0"><a href="/forgot">Forgot your password?</a> · New here? <a href="${esc(withNext('/signup', o.next))}">Create an account</a></p></div>`;
}

export function signUpPage(o: { csrf: string; next?: string; error?: string; email?: string; name?: string; google: boolean }) {
  return `<div class="card"><h1>Create your Verso account</h1><p class="muted">Free forever. Upgrade when you need more.</p>
${alert(o.error)}
${googleBlock(o.google, o.next)}
<form method="post" action="/signup">${csrfField(o.csrf)}${nextField(o.next)}
<label for="name">Name</label><input id="name" name="name" autocomplete="name" maxlength="120" value="${esc(o.name)}">
<label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required value="${esc(o.email)}">
<label for="password">Password</label><input id="password" name="password" type="password" autocomplete="new-password" minlength="8" required>
<p class="small muted" style="margin:6px 0 0">At least 8 characters.</p>
<button class="btn primary" type="submit">Create account</button></form>
<p class="small muted" style="margin:20px 0 0">Already have an account? <a href="${esc(withNext('/signin', o.next))}">Sign in</a></p></div>`;
}

export function forgotPage(o: { csrf: string; error?: string }) {
  return `<div class="card"><h1>Forgot your password?</h1><p class="muted">Enter your email and we'll send you a link to choose a new one.</p>
${alert(o.error)}
<form method="post" action="/forgot">${csrfField(o.csrf)}
<label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required>
<button class="btn primary" type="submit">Send reset link</button></form>
<p class="small muted" style="margin:20px 0 0"><a href="/signin">Back to sign in</a></p></div>`;
}

export function resetPage(o: { csrf: string; token: string; error?: string }) {
  return `<div class="card"><h1>Choose a new password</h1>
${alert(o.error)}
<form method="post" action="/reset">${csrfField(o.csrf)}<input type="hidden" name="token" value="${esc(o.token)}">
<label for="password">New password</label><input id="password" name="password" type="password" autocomplete="new-password" minlength="8" required>
<p class="small muted" style="margin:6px 0 0">At least 8 characters.</p>
<button class="btn primary" type="submit">Save password</button></form></div>`;
}

export function messagePage(o: { title: string; body: string; link?: { href: string; label: string } }) {
  return `<div class="card"><h1>${esc(o.title)}</h1><p class="muted">${esc(o.body)}</p>
${o.link ? `<a class="btn primary" href="${esc(o.link.href)}">${esc(o.link.label)}</a>` : ''}</div>`;
}

type Sub = { provider_subscription_id: string; plan: string; status: string; current_end: number | null } | undefined;
type Device = { id: string; name: string | null; platform: string | null; last_seen_at: number };

const date = (ms: number | string | null | undefined) =>
  ms ? new Date(Number(ms)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export function accountPage(o: { user: User; ent: Entitlements; sub: Sub; devices: Device[]; csrf: string; notice?: string; payments: boolean }) {
  const { user, ent, sub } = o;
  const planLine =
    ent.plan !== 'pro'
      ? 'Free'
      : ent.overridden && !ent.billingPlan
        ? `Pro (complimentary)${ent.expiresAt ? ` · until ${date(Date.parse(ent.expiresAt))}` : ''}`
        : `Pro ${ent.billingPlan === 'pro_yearly' ? '(yearly)' : '(monthly)'} · ${sub?.status === 'cancelled' ? 'ends' : 'renews'} ${date(ent.expiresAt ? Date.parse(ent.expiresAt) : null)}`;
  const canCancel = ent.plan === 'pro' && sub && sub.status !== 'cancelled' && o.payments;
  const devices = o.devices.length
    ? o.devices
        .map(
          (d) => `<div class="row"><div><div>${esc(d.name || 'Unnamed device')}</div><div class="small muted">${esc(d.platform || '')} · last seen ${date(d.last_seen_at)}</div></div>
<form method="post" action="/account/devices/remove" style="margin:0">${csrfField(o.csrf)}<input type="hidden" name="id" value="${esc(d.id)}"><button class="btn inline" type="submit" style="margin:0">Remove</button></form></div>`,
        )
        .join('')
    : `<p class="muted" style="margin:0">No devices yet. Sign in from the Verso app to add one.</p>`;

  return `${alert(o.notice)}
<h1>Your account</h1><p class="muted">${esc(user.name ? `${user.name} · ` : '')}${esc(user.email)}</p>
${user.email_verified_at ? '' : `<div class="alert">Please confirm your email. <form method="post" action="/account/resend-verification" style="display:inline">${csrfField(o.csrf)}<button type="submit" style="background:none;border:0;color:#F5F4F0;text-decoration:underline;font:inherit;cursor:pointer;padding:0">Send the link again</button></form></div>`}
<div class="card"><h2>Plan</h2><p>${esc(planLine)}</p>
${ent.plan === 'free' ? `<a class="btn primary inline" href="/pricing">Upgrade to Pro</a>` : ''}
${canCancel ? `<form method="post" action="/billing/cancel" style="margin:0">${csrfField(o.csrf)}<input type="hidden" name="subscription_id" value="${esc(sub!.provider_subscription_id)}"><button class="btn inline" type="submit">Cancel subscription</button></form><p class="small muted" style="margin:8px 0 0">You keep Pro until the end of the period you've paid for.</p>` : ''}
</div>
<div class="card"><h2>Devices <span class="tag">${o.devices.length} of ${ent.limits.max_devices}</span></h2>${devices}</div>`;
}

export function pricingPage(o: {
  user?: User | null;
  ent?: Entitlements;
  csrf: string;
  configured: boolean;
  monthly: string;
  yearly: string;
  error?: string;
}) {
  // Mirrors PLANS (plans.ts): Free is the full editor with no watermark; Pro adds the AI tools and 4K/60 fps.
  const devices = (n: number) => `Use on ${n === 1 ? '1 device' : `up to ${n} devices`}`;
  const freeFeatures = ['The full editor', '1080p export', 'No watermark, ever', 'Basic caption styles', devices(PLANS.free.limits.max_devices)];
  const proFeatures = ['4K and 60 fps export', 'Auto-cut and auto clips', 'Speaker reframe', 'Premium caption styles and Pro templates', devices(PLANS.pro.limits.max_devices)];
  const isPro = o.ent?.plan === 'pro';
  let action: string;
  if (!o.configured) action = `<div class="alert">Payments aren't set up yet. Check back soon.</div>`;
  else if (isPro) action = `<p class="muted">You're on Pro. Manage it from your <a href="/account">account page</a>.</p>`;
  else if (!o.user) action = `<a class="btn primary" href="/signin?next=%2Fpricing">Sign in to upgrade</a>`;
  else
    action = `<form method="post" action="/billing/checkout" style="margin:0">${csrfField(o.csrf)}
<label style="display:flex;gap:10px;align-items:center;margin:0 0 8px;color:#F5F4F0"><input type="radio" name="plan" value="pro_yearly" checked style="width:auto"> Yearly · ${esc(o.yearly)}</label>
<label style="display:flex;gap:10px;align-items:center;margin:0;color:#F5F4F0"><input type="radio" name="plan" value="pro_monthly" style="width:auto"> Monthly · ${esc(o.monthly)}</label>
<button class="btn primary" type="submit">Upgrade to Pro</button></form>`;

  return `<h1>Pricing</h1><p class="muted">Start free with the full editor and no watermark. Go Pro for auto clips, speaker reframe and 4K. AI tools use credits on both plans.</p>
${alert(o.error)}
<div class="grid">
<div class="card"><h2>Free</h2><div class="price">₹0</div><ul class="ticks">${freeFeatures.map((f) => `<li>${f}</li>`).join('')}</ul></div>
<div class="card"><h2>Pro</h2><div class="price">${esc(o.monthly)}</div><p class="small muted">or ${esc(o.yearly)}</p>
<ul class="ticks">${proFeatures.map((f) => `<li>${f}</li>`).join('')}</ul>${action}</div>
</div>`;
}

// ---------- credit top-ups ----------

export function creditsBuyPage(o: { csrf: string; packs: Pack[]; selected?: string; allowed: boolean; configured: boolean; error?: string }) {
  if (!o.configured) return messagePage({ title: "Payments aren't set up yet", body: 'Check back soon. Your credits and AI tools keep working in the meantime.' });
  if (!o.allowed) {
    return messagePage({
      title: 'Top-ups are part of Pro',
      body: 'Upgrade to Verso Pro to buy more credits. Pro also gives you more credits every month.',
      link: { href: '/pricing', label: 'See Pro' },
    });
  }
  const selected = o.packs.find((p) => p.id === o.selected)?.id ?? o.packs[0]?.id;
  const options = o.packs
    .map(
      (p) => `<label style="display:flex;gap:10px;align-items:center;justify-content:space-between;margin:0 0 8px;color:#F5F4F0;padding:12px;border:1px solid #2A2A33;border-radius:10px">
<span style="display:flex;gap:10px;align-items:center"><input type="radio" name="pack" value="${esc(p.id)}"${p.id === selected ? ' checked' : ''} style="width:auto"> ${p.credits.toLocaleString('en-IN')} credits</span>
<span class="muted">${esc(p.priceInr)}${p.priceUsd ? ` · ${esc(p.priceUsd)}` : ''}</span></label>`,
    )
    .join('');
  const currency = o.packs.some((p) => p.priceUsd)
    ? `<label for="currency">Pay in</label><select id="currency" name="currency"><option value="INR">Indian rupees</option><option value="USD">US dollars</option></select>`
    : '';
  return `<div class="card"><h1>Get more credits</h1>
<p class="muted">Credits you buy never expire. We use your monthly credits first.</p>
${alert(o.error)}
<form method="post" action="/credits/buy">${csrfField(o.csrf)}${options}${currency}
<button class="btn primary" type="submit">Continue to payment</button></form></div>`;
}

export function creditsCheckoutPage(o: { csrf: string; keyId: string; orderId: string; amount: number; currency: string; credits: number; email: string; price: string }) {
  return `<div class="card"><h1>${o.credits.toLocaleString('en-IN')} credits · ${esc(o.price)}</h1>
<p class="muted">Finish paying in the Razorpay window. Your credits show up in Verso right after.</p>
<div id="rzp" data-key="${esc(o.keyId)}" data-order="${esc(o.orderId)}" data-amount="${o.amount}" data-currency="${esc(o.currency)}" data-email="${esc(o.email)}" data-desc="${o.credits} Verso credits"></div>
<form id="paid" method="post" action="/credits/paid">${csrfField(o.csrf)}
<input type="hidden" name="razorpay_payment_id"><input type="hidden" name="razorpay_order_id"><input type="hidden" name="razorpay_signature"></form>
<button id="again" class="btn primary" type="button" hidden>Open payment again</button>
<p class="small muted" style="margin:16px 0 0"><a href="/credits/buy">Pick a different pack</a></p></div>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script><script src="/assets/credits-checkout.js"></script>`;
}

/** Opens Razorpay Checkout for the order on the page and posts the signed result to /credits/paid. */
export const CREDITS_CHECKOUT_JS = `(function(){
var d=document.getElementById('rzp').dataset,again=document.getElementById('again'),paid=document.getElementById('paid');
function open(){new Razorpay({key:d.key,order_id:d.order,amount:d.amount,currency:d.currency,name:'Verso',description:d.desc,
prefill:{email:d.email},theme:{color:'#FF4A2B'},
handler:function(r){paid.razorpay_payment_id.value=r.razorpay_payment_id;paid.razorpay_order_id.value=r.razorpay_order_id;paid.razorpay_signature.value=r.razorpay_signature;paid.submit();},
modal:{ondismiss:function(){again.hidden=false;}}}).open();}
again.addEventListener('click',open);open();})();`;

/** CSP for the checkout page only: Razorpay's script, iframe and API. */
export const CHECKOUT_CSP =
  "default-src 'self'; script-src 'self' https://checkout.razorpay.com; frame-src https://api.razorpay.com https://checkout.razorpay.com; " +
  "connect-src 'self' https://*.razorpay.com; img-src 'self' data: https://*.razorpay.com; style-src 'self' 'unsafe-inline'; font-src 'self'; form-action 'self'; base-uri 'self'";
