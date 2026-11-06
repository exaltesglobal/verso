# Verso server: keys, setup and deploy

The accounts and payments backend lives in `server/`. Locally it needs no keys at all: it uses SQLite,
prints emails to the console, hides Google sign-in and shows "Payments aren't set up yet". This guide covers
where each production key comes from and how to deploy to Hostinger Cloud Economy.

All variables are listed with comments in [`server/.env.example`](../server/.env.example).

Throughout, `api.example.com` stands for your API domain (for example `api.verso.app`), and `PUBLIC_URL` is
`https://api.example.com`.

---

## 1. Token signing keys

### JWT_SECRET (access tokens)

A random string of at least 32 characters.

```bash
openssl rand -base64 48
```

Or, without OpenSSL: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`

Changing it signs everyone out of the desktop app within 15 minutes (their refresh still works).

### ENTITLEMENT_PRIVATE_KEY / ENTITLEMENT_PUBLIC_KEY (offline entitlement tokens)

An Ed25519 key pair. The server signs offline entitlement tokens with the private key; the desktop app
verifies them with the public key (also served at `GET /.well-known/jwks.json`).

```bash
openssl genpkey -algorithm ed25519 -out entitlement-private.pem
openssl pkey -in entitlement-private.pem -pubout -out entitlement-public.pem
```

Without OpenSSL:

```bash
node -e "const {generateKeyPairSync}=require('crypto');const k=generateKeyPairSync('ed25519');console.log(k.privateKey.export({type:'pkcs8',format:'pem'}));console.log(k.publicKey.export({type:'spki',format:'pem'}))"
```

Env vars are single-line, so replace newlines with `\n`:

```bash
awk 'NF {printf "%s\\n", $0}' entitlement-private.pem   # paste output into ENTITLEMENT_PRIVATE_KEY
awk 'NF {printf "%s\\n", $0}' entitlement-public.pem    # paste output into ENTITLEMENT_PUBLIC_KEY
```

Keep the private key secret and never commit it. Bake the public key (or its JWK) into the desktop app so
it can check the token offline. If you rotate the pair, ship an app update with the new public key first.

In local dev, missing keys are generated once into `server/.dev-keys/` (git-ignored).

---

## 2. Google sign-in (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create (or pick) a project, for example
   "Verso".
2. **APIs & Services > OAuth consent screen** (now called **Google Auth Platform > Branding / Audience**):
   - User type: **External**.
   - App name "Verso", support email, logo, and your app domain / privacy policy / terms links.
   - Scopes: `openid`, `email`, `profile` (all non-sensitive, so no Google review needed).
   - While in "Testing", only listed test users can sign in. Click **Publish app** when ready.
3. **APIs & Services > Credentials > Create credentials > OAuth client ID**:
   - Application type: **Web application**.
   - Name: "Verso API".
   - **Authorized redirect URIs**: `https://api.example.com/auth/google/callback`
     (for local testing also add `http://localhost:8787/auth/google/callback`).
   - Authorized JavaScript origins: not needed.
4. Copy the **Client ID** into `GOOGLE_CLIENT_ID` and the **Client secret** into `GOOGLE_CLIENT_SECRET`.

The redirect URI must match `PUBLIC_URL` + `/auth/google/callback` exactly, including `https` and no trailing
slash. Until both vars are set, `GET /auth/google` returns `503 {"error":"google_not_configured"}`.

---

## 3. Razorpay subscriptions

### Keys (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)

1. Sign in to the [Razorpay Dashboard](https://dashboard.razorpay.com/). Use **Test mode** (toggle at the top)
   until you're ready to take real money.
2. **Account & Settings > API Keys > Generate Key**.
3. Copy **Key Id** (`rzp_test_...` / `rzp_live_...`) into `RAZORPAY_KEY_ID` and **Key Secret** into
   `RAZORPAY_KEY_SECRET`. The secret is shown once; store it safely.
4. Live mode needs a separate key pair and an activated account (KYC). Subscriptions must be enabled on the
   account; if the Subscriptions menu is missing, ask Razorpay support to enable it.

### Plan ids (RAZORPAY_PLAN_PRO_MONTHLY, RAZORPAY_PLAN_PRO_YEARLY)

Either:

- **Dashboard**: **Subscriptions > Plans > Create plan**. Create "Verso Pro (monthly)" with billing frequency
  every 1 month, and "Verso Pro (yearly)" every 1 year, in INR. Copy each `plan_...` id.
- **Script**: with the key vars set in `server/.env`, run `pnpm razorpay:plans 49900 499900` (amounts in paise:
  ₹499 and ₹4,999). It prints both lines to paste into your env.

Plans are per mode: test-mode plan ids don't work with live keys. Also update `PRICE_LABEL_PRO_MONTHLY` and
`PRICE_LABEL_PRO_YEARLY` so the pricing page matches.

### Webhook (RAZORPAY_WEBHOOK_SECRET)

1. **Account & Settings > Webhooks > Add new webhook**.
2. **Webhook URL**: `https://api.example.com/webhooks/razorpay`
3. **Secret**: make up a long random string (`openssl rand -hex 32`) and put the same value in
   `RAZORPAY_WEBHOOK_SECRET`.
4. **Active events**: `subscription.activated`, `subscription.charged`, `subscription.cancelled`,
   `subscription.halted`, `payment.failed`, and for credit top-ups `payment.captured` and `order.paid`
   (see section 8).
5. Save. Repeat in live mode with the live URL and secret.

The server checks the `X-Razorpay-Signature` HMAC on the raw body, and records each `X-Razorpay-Event-Id` so a
redelivered event is applied only once.

How checkout works: the pricing page creates a Razorpay subscription for the signed-in user (their user id is
stored in the subscription notes) and redirects to Razorpay's hosted payment page (`short_url`). When Razorpay
calls the webhook, the user's plan becomes Pro until `current_end`. Cancelling from the account page cancels at
the end of the paid cycle.

---

## 4. Email via Resend (RESEND_API_KEY, EMAIL_FROM)

1. Create an account at [resend.com](https://resend.com/).
2. **Domains > Add domain**. Use a subdomain such as `mail.example.com` so it doesn't clash with your normal
   mailbox records.
3. Add the DNS records Resend shows (an MX and TXT for SPF on `send.mail...`, and a DKIM TXT
   `resend._domainkey...`). On Hostinger: **hPanel > Domains > DNS / Nameservers > DNS records**. Adding a DMARC
   record (`_dmarc`, `v=DMARC1; p=none;`) is recommended.
4. Wait for **Verified** in Resend (usually minutes, up to a few hours).
5. **API Keys > Create API key** with "Sending access" restricted to that domain. Put it in `RESEND_API_KEY`.
6. Set `EMAIL_FROM`, for example `Verso <no-reply@mail.example.com>`. The domain must be the verified one.

Without `RESEND_API_KEY`, verification and reset emails (with their links) are printed to the server log.

---

## 5. MySQL on Hostinger (DB_*)

1. **hPanel > Websites > (your site) > Databases > Management** (on Cloud plans: **Databases > MySQL
   Databases**).
2. Create a database and a user with a strong password. Hostinger prefixes both, for example `u123456789_verso`.
3. Note the host. For a Node.js app on the same Hostinger account it is usually `localhost` or `127.0.0.1`
   (the panel shows it next to the database). Port `3306`.
4. Set:

```
DB_CLIENT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=u123456789_verso
DB_PASSWORD=...
DB_NAME=u123456789_verso
```

or one `DATABASE_URL=mysql://u123456789_verso:PASSWORD@localhost:3306/u123456789_verso` (URL-encode special
characters in the password).

---

## 6. Deploy to Hostinger Cloud Economy

Cloud Economy includes Node.js web apps managed from hPanel.

### Create the app

1. **hPanel > Websites > Add website > Node.js Apps** (labelled "Node.js Web App" on some accounts).
2. Choose **Import Git repository** (connect GitHub and pick the Verso repo and branch) or **Upload your
   website files** (a zip of the `server/` folder without `node_modules`, `dist` and `.dev-keys`).
3. Build settings:

| Setting | Value |
| --- | --- |
| Root directory | `server` (when importing the whole repo) |
| Node.js version | 20.x or 22.x |
| Package manager | pnpm if offered, otherwise npm |
| Install / build command | `pnpm install && pnpm build` (npm: `npm install && npm run build`) |
| Entry file | `server.cjs` (start command `node server.cjs`; Hostinger loads entries with `require()`, so the shim imports the ES module build) |

The build needs devDependencies (TypeScript). `better-sqlite3` is optional and may fail to compile on the
host; that is fine because production uses MySQL.

### Environment variables

In the app's **Environment variables** section add at least:

```
NODE_ENV=production
PUBLIC_URL=https://api.example.com
TRUST_PROXY=true
CORS_ORIGINS=tauri://localhost,http://tauri.localhost
DB_CLIENT=mysql
DB_HOST=... DB_PORT=3306 DB_USER=... DB_PASSWORD=... DB_NAME=...
JWT_SECRET=...
ENTITLEMENT_PRIVATE_KEY=...
ENTITLEMENT_PUBLIC_KEY=...
RESEND_API_KEY=...            EMAIL_FROM=Verso <no-reply@mail.example.com>
GOOGLE_CLIENT_ID=...          GOOGLE_CLIENT_SECRET=...
RAZORPAY_KEY_ID=...           RAZORPAY_KEY_SECRET=...           RAZORPAY_WEBHOOK_SECRET=...
RAZORPAY_PLAN_PRO_MONTHLY=... RAZORPAY_PLAN_PRO_YEARLY=...
```

Hostinger sets `PORT` itself; the server reads it. Don't commit a `.env` file; use the panel.

### Run migrations

Migrations create and update the tables. Run them after the first deploy and after every deploy that adds a
migration. Either:

- **SSH** (hPanel > Advanced > SSH Access): `cd` into the app's folder and run `npm run migrate:prod`
  (`node dist/migrate.js`). It needs the same env vars; if the shell doesn't have them, put them in a
  `server/.env` file on the server only (it is git-ignored and read automatically).
- **Start command**: use `node dist/migrate.js && node server.cjs` so each start applies pending
  migrations first. Migrations are idempotent and locked, so this is safe.

To undo the last batch: `node dist/migrate.js --rollback`.

### Domain

1. In the app's settings, **Connect domain** and enter `api.example.com`.
2. If the domain's DNS is on Hostinger, the record is added for you. Otherwise add the A/CNAME record the panel
   shows at your DNS provider.
3. Wait for the free SSL certificate to be issued, then open `https://api.example.com/healthz`. You should see
   `{"ok":true}`.
4. Make sure `PUBLIC_URL` matches the domain, then update the Google redirect URI and the Razorpay webhook URL
   to use it.

### After deploy checklist

- `https://api.example.com/healthz` returns `{"ok":true}`.
- Sign up at `/signup` and receive the confirmation email.
- "Continue with Google" works (or, if not configured, is hidden).
- `/pricing` shows the upgrade form. A test-mode payment flips the account page to Pro within a few seconds
  (Razorpay Dashboard > Webhooks shows the delivery status).

---

## 7. Desktop app integration (reference)

**Sign in from the app (loopback + PKCE)**

1. App picks a free port, starts a listener on `http://127.0.0.1:<port>/callback`, creates a random
   `code_verifier` (43 to 128 chars) and `code_challenge = base64url(sha256(code_verifier))`, plus a random
   `state`.
2. App opens the system browser at
   `https://api.example.com/desktop/sign-in?port=<port>&code_challenge=<c>&code_challenge_method=S256&state=<s>&device_id=<stable install id>&device_name=<host name>&platform=windows`
3. The user signs in (password or Google), confirms, and the browser is redirected to
   `http://127.0.0.1:<port>/callback?code=<code>&state=<s>`. The app checks `state`.
4. App calls `POST /v1/auth/token` with JSON
   `{"grant_type":"authorization_code","code":"...","code_verifier":"..."}` within 2 minutes and gets
   `{access_token, expires_in, refresh_token, refresh_expires_in}`.
   `409 device_limit_reached` means the plan's device limit is used up; the message tells the user what to do.

**Staying signed in**: `POST /v1/auth/token` with `{"grant_type":"refresh_token","refresh_token":"..."}`
returns a new pair. The old refresh token stops working; replaying it signs out that whole session.
Sign out: `POST /v1/auth/logout` with `{"refresh_token":"..."}`.

**Entitlements**: `GET /v1/me/entitlements` with `Authorization: Bearer <access_token>` returns

```json
{
  "plan": "pro",
  "features": { "export_4k": true, "watermark_free": true, "caption_styles_pro": true, "templates_pro": true },
  "limits": { "auto_clips_per_month": -1, "max_devices": 3, "max_export_height": 2160 },
  "expiresAt": "2026-12-06T19:32:10.000Z",
  "billingPlan": "pro_yearly",
  "status": "active",
  "offlineToken": "eyJ...",
  "offlineValidDays": 7
}
```

`-1` means unlimited. `offlineToken` is an EdDSA (Ed25519) JWT: `iss=verso-accounts`, `aud=verso-desktop`,
`sub=<user id>`, `did=<device id>`, claim `ent` with the same plan/features/limits, `exp` after
`OFFLINE_ENTITLEMENT_DAYS`. Verify it with the pinned public key; when it expires and the app is offline,
fall back to Free.

Other JSON endpoints: `POST /v1/auth/signup`, `/v1/auth/login`, `/v1/auth/forgot-password`,
`/v1/auth/reset-password`, `/v1/auth/verify-email`, `GET /v1/me`, `GET /.well-known/jwks.json`.

---

## 8. Credits

AI tools (auto-cut, captions, speaker reframe, dubbing, voiceover, background removal, enhance audio, hook
ideas, caption writer, watch time check) cost credits. Editing and export are always free. Every number below
is server config: the app reads it from `GET /v1/credits/pricing`, so changing an env var and restarting the
server is enough. No app release needed.

### How it works

- **Monthly credits**: Free gets `CREDITS_FREE_MONTHLY` (30), Pro gets `CREDITS_PRO_MONTHLY` (1000). They
  refill every month: Pro on the subscription's renewal day, Free on the signup day. Unused monthly credits
  don't roll over.
- **Bought credits** (top-up packs) never expire. Monthly credits are spent first.
- **Ledger**: every change is a row in `credit_ledger` (append-only); `credit_balances` holds the running
  totals and is updated in the same transaction. Debits are idempotent per `idempotencyKey`.
- **Offline**: `GET /v1/credits/balance` returns a signed `offlineGrant` (same Ed25519 key as entitlements)
  allowing up to `CREDITS_OFFLINE_BUFFER` credits (never more than the balance). The app queues offline spends
  and sends them to `POST /v1/credits/reconcile` when it's back online. The balance may dip below zero by at
  most the buffer; the next top-up or refill covers it.

### Env vars

| Variable | Default | Meaning |
| --- | --- | --- |
| `CREDITS_FREE_MONTHLY` | `30` | Monthly credits on Free |
| `CREDITS_PRO_MONTHLY` | `1000` | Monthly credits on Pro |
| `CREDITS_COSTS` | empty | Cost overrides, `action=credits` comma-separated, e.g. `auto_cut=5,dubbing=12` |
| `CREDITS_PACKS` | `300:19900:299,1000:54900:799,3000:144900:1999` | Packs as `credits:inrPaise[:usdCents]` |
| `CREDITS_TOPUP_FOR_FREE` | `true` | Let Free users buy packs. `false` = Pro only |
| `CREDITS_OFFLINE_BUFFER` | `50` | Credits the app may spend offline before syncing |
| `CREDITS_RESET_INTERVAL_MINUTES` | `60` | In-process refill check. `0` turns it off (use the cron below) |

Default costs (per minute of media unless noted): `auto_cut` 4 (per source minute), `captions` 2,
`speaker_reframe` 3, `dubbing` 10 and `voiceover` 6 (per output minute), `background_removal` 5,
`enhance_audio` 1, `hook_generator` 2, `caption_writer` 1 and `watch_time_predictor` 2 (per run). Minute
actions round up and any use costs at least 1 credit. A bad `CREDITS_COSTS` or `CREDITS_PACKS` stops the
server at startup with a clear error.

### Razorpay setup for top-ups

Top-ups use one-time **Orders** with the same `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` as subscriptions
(plan ids aren't needed).

1. **Account & Settings > Payment capture**: set automatic capture on, so paid orders are captured right away.
2. Add `payment.captured` and `order.paid` to the existing webhook (section 3). Either one grants the credits;
   the other is a no-op.
3. To charge in US dollars, enable **International payments** in Razorpay and give each pack a USD price in
   `CREDITS_PACKS`. Without it, leave the third field off and only rupees are offered.

Flow: the app opens `<PUBLIC_URL>/credits/buy?pack=pack_1000` in the browser. After sign-in, the page creates a
Razorpay order (`credit_orders` row) and opens Razorpay Checkout. On success the page verifies the checkout
signature and the captured payment and adds the credits at once; the webhook does the same as a backup. The app
refreshes the balance when its window regains focus.

### Admin and cron

- Give or take back credits: `pnpm credits:grant someone@example.com 500 "Sorry about the outage"` (a negative
  amount removes credits). In production: `node dist/credits-grant.js <email> <amount> <note>`.
- Refills also happen lazily on each balance check. For a cron job on Hostinger (hPanel > Advanced > Cron Jobs),
  hourly: `cd ~/verso-server && node dist/credits-reset.js`, and set `CREDITS_RESET_INTERVAL_MINUTES=0`.

#### Hostinger cron jobs (hPanel > Advanced > Cron Jobs)

| Job | Schedule | Command |
| --- | --- | --- |
| Credit allowance resets | Hourly (`0 * * * *`) | `cd ~/verso-server && node dist/credits-reset.js` |
| Expired sign-in rows (sessions, refresh tokens, sign-in codes, email links) | Daily (`30 3 * * *`) | `cd ~/verso-server && node dist/tokens-cleanup.js` |

Both scripts read the same `.env` as the server and exit non-zero on failure, so Hostinger's cron email shows
problems. `tokens-cleanup` keeps rows for 7 days after they expire or are used. Dev equivalents:
`pnpm credits:reset` and `pnpm tokens:cleanup`.

### API

All except pricing need `Authorization: Bearer <access_token>`.

- `GET /v1/credits/pricing` → `{ costs: { auto_cut: { unit: "minute", credits: 4 }, ... }, packs: [{ id,
  credits, amountInr, amountUsd, priceInr, priceUsd }], allowances: { free, pro }, topUpsForFree,
  offlineBuffer, paymentsConfigured }`
- `GET /v1/credits/balance` → `{ allowance, purchased, total, plan, resetsAt, offlineBuffer, offlineGrant }`
- `POST /v1/credits/debit` `{ action, units, idempotencyKey, meta? }` → `{ charged, duplicate, balance }`.
  `402 insufficient_credits` with a plain message when there aren't enough.
- `POST /v1/credits/refund` `{ idempotencyKey, reason? }` → `{ refunded, duplicate, balance }` (for failed jobs)
- `POST /v1/credits/reconcile` `{ items: [{ action, units, idempotencyKey, at? }] }` → per-item
  `applied | duplicate | rejected`
- `GET /v1/credits/history?cursor=&limit=` → `{ items, nextCursor }`
- `POST /v1/credits/orders` `{ packId, currency? }` → `{ orderId, keyId, amount, currency, credits, packId,
  checkoutUrl }` for an in-app Razorpay Checkout
