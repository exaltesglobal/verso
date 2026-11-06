import type { User } from './auth.js';
import type { Pack } from './credits.js';
import type { Entitlements } from './plans.js';

export const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const CSS = `@font-face{font-family:Manrope;src:url(/assets/manrope.woff2) format("woff2");font-weight:200 800;font-display:swap}
*{box-sizing:border-box}
html,body{margin:0;background:#0B0B0F;color:#F5F4F0;font-family:Manrope,system-ui,sans-serif;font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}
a{color:#F5F4F0}
header{display:flex;align-items:center;justify-content:space-between;max-width:960px;margin:0 auto;padding:20px 24px}
header .brand{font-weight:800;font-size:18px;letter-spacing:-.01em;text-decoration:none}
header nav{display:flex;gap:20px}
header nav a,header nav button{color:#B9B7BF;text-decoration:none;font:inherit;background:none;border:0;cursor:pointer;padding:0}
header nav a:hover,header nav button:hover{color:#F5F4F0}
main{max-width:960px;margin:0 auto;padding:24px 24px 64px}
.narrow{max-width:420px;margin:32px auto 0}
.card{background:#16161C;border:1px solid #2A2A33;border-radius:14px;padding:28px}
.card+.card{margin-top:16px}
h1{font-size:26px;line-height:1.25;margin:0 0 8px;font-weight:700;letter-spacing:-.015em}
h2{font-size:17px;margin:0 0 12px;font-weight:700}
p{margin:0 0 16px}
.muted{color:#B9B7BF}
.small{font-size:13px}
label{display:block;font-size:13px;color:#B9B7BF;margin:16px 0 6px}
input{width:100%;padding:11px 12px;background:#1D1D24;border:1px solid #2A2A33;border-radius:10px;color:#F5F4F0;font:inherit}
input:focus{outline:2px solid #F5F4F0;outline-offset:1px;border-color:transparent}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:12px 16px;border-radius:10px;font:inherit;font-weight:700;text-decoration:none;cursor:pointer;border:1px solid #2A2A33;background:#1D1D24;color:#F5F4F0}
.btn:hover{border-color:#B9B7BF}
.btn.primary{background:#FF4A2B;border-color:#FF4A2B;color:#0B0B0F}
.btn.primary:hover{filter:brightness(1.08)}
.btn.inline{width:auto}
.btn:focus-visible{outline:2px solid #F5F4F0;outline-offset:2px}
form .btn{margin-top:20px}
.or{display:flex;align-items:center;gap:12px;color:#B9B7BF;font-size:13px;margin:20px 0 0}
.or:before,.or:after{content:"";flex:1;height:1px;background:#2A2A33}
.alert{background:#1D1D24;border:1px solid #2A2A33;border-left:3px solid #F5F4F0;border-radius:10px;padding:12px 14px;margin:0 0 16px;font-size:14px}
.row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 0;border-top:1px solid #2A2A33}
.row:first-of-type{border-top:0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-top:24px}
.price{font-size:28px;font-weight:800;margin:4px 0 16px}
ul.ticks{list-style:none;padding:0;margin:0 0 8px}
ul.ticks li{padding:4px 0;color:#B9B7BF}
ul.ticks li:before{content:"✓  ";color:#F5F4F0}
.tag{display:inline-block;font-size:12px;padding:2px 8px;border:1px solid #2A2A33;border-radius:99px;color:#B9B7BF}
footer{max-width:960px;margin:0 auto;padding:0 24px 32px;color:#B9B7BF;font-size:12px}`;

type LayoutOpts = { title: string; user?: User | null; csrf?: string; body: string; narrow?: boolean };

export function layout(o: LayoutOpts) {
  const nav = o.user
    ? `<a href="/pricing">Pricing</a><a href="/account">Account</a>
       <form method="post" action="/signout" style="margin:0"><input type="hidden" name="_csrf" value="${esc(o.csrf)}"><button type="submit">Sign out</button></form>`
    : `<a href="/pricing">Pricing</a><a href="/signin">Sign in</a>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><title>${esc(o.title)} · Verso</title>
<link rel="preload" href="/assets/manrope.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/app.css"></head>
<body><header><a class="brand" href="/">Verso</a><nav>${nav}</nav></header>
<main>${o.narrow ? `<div class="narrow">${o.body}</div>` : o.body}</main>
<footer>© ${new Date().getFullYear()} Agape Labs · Exaltes Global Private Limited</footer></body></html>`;
}

const csrfField = (csrf: string) => `<input type="hidden" name="_csrf" value="${esc(csrf)}">`;
const alert = (msg?: string) => (msg ? `<div class="alert" role="alert">${esc(msg)}</div>` : '');
const nextField = (next?: string) => (next ? `<input type="hidden" name="next" value="${esc(next)}">` : '');
const withNext = (path: string, next?: string) => (next ? `${path}?next=${encodeURIComponent(next)}` : path);

export function signInPage(o: { csrf: string; next?: string; error?: string; notice?: string; email?: string; google: boolean }) {
  return `<div class="card"><h1>Sign in to Verso</h1><p class="muted">Welcome back.</p>
${alert(o.error ?? o.notice)}
<form method="post" action="/signin">${csrfField(o.csrf)}${nextField(o.next)}
<label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required value="${esc(o.email)}">
<label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required>
<button class="btn primary" type="submit">Sign in</button></form>
${o.google ? `<div class="or">or</div><a class="btn" style="margin-top:16px" href="${esc(withNext('/auth/google', o.next))}">Continue with Google</a>` : ''}
<p class="small muted" style="margin:20px 0 0"><a href="/forgot">Forgot your password?</a> · New here? <a href="${esc(withNext('/signup', o.next))}">Create an account</a></p></div>`;
}

export function signUpPage(o: { csrf: string; next?: string; error?: string; email?: string; name?: string; google: boolean }) {
  return `<div class="card"><h1>Create your Verso account</h1><p class="muted">Free forever. Upgrade when you need more.</p>
${alert(o.error)}
<form method="post" action="/signup">${csrfField(o.csrf)}${nextField(o.next)}
<label for="name">Name</label><input id="name" name="name" autocomplete="name" maxlength="120" value="${esc(o.name)}">
<label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required value="${esc(o.email)}">
<label for="password">Password</label><input id="password" name="password" type="password" autocomplete="new-password" minlength="8" required>
<p class="small muted" style="margin:6px 0 0">At least 8 characters.</p>
<button class="btn primary" type="submit">Create account</button></form>
${o.google ? `<div class="or">or</div><a class="btn" style="margin-top:16px" href="${esc(withNext('/auth/google', o.next))}">Continue with Google</a>` : ''}
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
    ent.plan === 'pro'
      ? `Pro ${ent.billingPlan === 'pro_yearly' ? '(yearly)' : '(monthly)'} · ${sub?.status === 'cancelled' ? 'ends' : 'renews'} ${date(ent.expiresAt ? Date.parse(ent.expiresAt) : null)}`
      : 'Free';
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
  const proFeatures = ['4K export', 'No watermark', 'Unlimited auto clips', 'Pro caption styles', 'Pro templates', 'Use on up to 3 devices'];
  const freeFeatures = ['1080p export', 'Verso watermark', '10 auto clips a month', 'Basic caption styles', '1 device'];
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

  return `<h1>Pricing</h1><p class="muted">Start free. Go Pro when you want 4K, no watermark and unlimited auto clips.</p>
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
