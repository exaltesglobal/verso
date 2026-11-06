# Verso: Accounts, Licensing and Payments Backend

Spec for `server/` (Node.js + MariaDB 11.x on Hostinger), the Verso account web pages, and the desktop side (Rust Tauri commands + React state). Accounts and payments are the **only** online features of Verso; everything else stays offline. The app must be fully usable as Free with no account and must behave gracefully when the backend is unreachable or not configured.

## 0. Verified facts (checked 2026-11-06)

| Fact | Source |
| --- | --- |
| Hostinger Node.js: Node 18/20/22/24 selectable; app started on demand and **stopped after idle**, restarted on next request; env vars set in hPanel or **Import .env** (parses a file, strips quotes, skips comments; nothing is said about multi-line values, so we never use them); redeploy on save; every deploy overwrites the site directory. | https://docs.hostinger.com/node.js/overview , https://docs.hostinger.com/node.js/environment-variables |
| Hostinger limits: request killed at **120 s**; no inbound WebSockets; no always-running workers (killed on deploy/restart); NPROC 120 on Business/Unlimited **shared with PHP and cron processes**; 5 Node apps on Business/Unlimited, 10 on Cloud. | https://www.hostinger.com/support/?p=21141 |
| Hostinger cron: "has supported Node.js websites since 8 October 2026" (the sentence is on the page; Reviewer 1 missed it), UTC schedule, job stopped after **30 min**, env vars only via `node --env-file` (Node >= 20.6) or `curl` a protected route of the app. | https://www.hostinger.com/support/?p=21119 |
| Hostinger database engine is **MariaDB** ("Hostinger Web and Cloud hosting plans use MariaDB", example `11.8.9-MariaDB-log`), connect from the app to `127.0.0.1:3306`. | https://www.hostinger.com/support/how-to-check-your-database-version-in-phpmyadmin-at-hostinger/ , https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/ |
| Plans: Node.js on **Unlimited** and Cloud Startup/Professional/Enterprise; "Cloud Economy" not listed; Cloud Startup 4 cores/4 GB. | https://www.hostinger.com/in/nodejs-hosting |
| Node.js: 26 Active LTS (to 27 Oct 2027), 24 Maintenance LTS (security to 30 Apr 2028), 22 Maintenance (to 30 Apr 2027), **20 is EOL (30 Apr 2026)** although Hostinger still lists it. Target Node 24; `engines.node ">=24 <27"`, CI on 24 and 26. | https://endoflife.date/nodejs |
| Google OAuth for desktop: loopback `http://127.0.0.1:PORT` is the supported redirect; custom URI schemes and OOB **no longer supported**; PKCE S256. | https://developers.google.com/identity/protocols/oauth2/native-app |
| Razorpay Subscriptions: ten `subscription.*` events; webhook signature header `X-Razorpay-Signature` = hex HMAC-SHA256(raw body, webhook secret); `x-razorpay-event-id` for dedupe; respond within ~**5 s**; exponential retries for **24 h**; checkout signature = HMAC-SHA256(`payment_id|subscription_id`, key_secret). Create-subscription: `total_count` **required** (max 100 years), `customer_notify` boolean, `expire_by` optional; `cancel_at_cycle_end` semantics. | https://razorpay.com/docs/webhooks/subscriptions.md , https://razorpay.com/docs/webhooks/validate-test.md , https://razorpay.com/docs/webhooks/best-practices/ , https://razorpay.com/docs/payments/subscriptions/integration-guide/ , https://razorpay.com/docs/api/payments/subscriptions/create-subscription.md , https://razorpay.com/docs/api/payments/subscriptions/cancel-subscription.md |
| RBI card mandates: registration needs AFA; mandates up to **₹15,000** can be auto-debited without per-debit AFA; bank sends pre-debit notification >= 24 h before. Both our prices are far under the cap. International recurring cards need account enablement; UPI/eMandate INR only. | https://razorpay.com/docs/announcements/rbi-card-mandate-guidelines/subscriptions.md , https://razorpay.com/blog/international-subscriptions-india/ |
| GST: software licence = SAC **997331**, 18% since 22 Sep 2025. | https://busy.in/sac-code-997331 |
| DPDP Rules 2025 notified 13 Nov 2025; Rules 3, 5-16, 22-23 in force **13 May 2027**; breach: Board "immediately" + detailed report within 72 h; grievances <= 90 days; 48 h notice before erasure. | https://www.mondaq.com/india/data-protection/1709066/key-highlights-of-the-digital-personal-data-protection-rules-2025 |
| npm (registry.npmjs.org/<pkg>/latest): `fastify` 5.12.8 MIT; `fastify-raw-body` 6.0.3 MIT (Fastify 5); `@fastify/helmet` 13.2.0 MIT; `@fastify/cookie` 11.1.5 MIT; `kysely` 0.29.x MIT; `mysql2` 3.24.x MIT; `jose` 6.x MIT; `resend` **6.37.0** MIT (pin ^6); `@node-rs/argon2` **2.2.2** MIT (pin ^2.2); `google-auth-library` 11.3.3 **Apache-2.0**; `razorpay` 2.9.8 MIT; `@zxcvbn-ts/core` 4.2.0 MIT; `pdfkit` 0.20.2 MIT; `license-checker-rseidelsohn` 5.0.1 **BSD-3-Clause**. | registry URLs as named |
| crates.io: `ed25519-dalek` **3.0.0** stable (published 2026-07-06, not yanked) BSD-3-Clause; `keyring` **4.2.0** MIT OR Apache-2.0, backends are the optional deps `windows-native-keyring-store` / `apple-native-keyring-store` (v3 feature names `windows-native`/`apple-native` no longer apply); `tauri-plugin-deep-link` 2.6.3 and `tauri-plugin-single-instance` 2.5.5 MIT OR Apache-2.0. | https://crates.io/api/v1/crates/ed25519-dalek , https://docs.rs/keyring/latest/keyring/ , https://crates.io/api/v1/crates/tauri-plugin-deep-link |

Consequences: the server is **stateless and request-scoped** (no in-memory sessions, counters or queues; MariaDB holds them), every handler finishes well under 120 s, webhooks are acknowledged in milliseconds, background work runs from Hostinger cron hitting `POST /internal/cron/*`, and **nothing durable lives on the app disk**.

## 1. Plans and entitlements

| Code | Price (INR, GST-inclusive) | Razorpay plan | Entitlements |
| --- | --- | --- | --- |
| `free` | 0 | none | Every editing feature (captions, reframe, templates marked Free, free music), 1080p export with a small Verso end-card, 3 auto-cut runs/day |
| `pro_monthly` | ₹499 / month | `period=monthly, interval=1, amount=49900` | Pro templates and music, 2160p, no end-card, unlimited auto-cut |
| `pro_yearly` | ₹3,999 / year | `period=yearly, interval=1, amount=399900` | same |

Captions and reframe are **not** gated: the product promise is one-click defaults for everyone, and the captions/reframe specs have no Pro branch. Only the four `FeatureKey`s below exist; a spec that wants a new gate adds it here first.

```ts
// shared/entitlements.ts — single source, copied verbatim to src/lib/entitlements.ts by `pnpm sync:shared` (CI diff-checks)
export type PlanCode = "free" | "pro_monthly" | "pro_yearly";
export type FeatureKey = "auto_cut_unlimited" | "templates_premium" | "export_4k" | "no_endcard";
export interface Entitlements {
  tier: "free" | "pro"; watermark: boolean; maxExportHeight: 1080 | 2160;
  autoCutRunsPerDay: number | null;   // null = unlimited
  features: FeatureKey[];
}
export const FREE_ENTITLEMENTS: Entitlements = { tier: "free", watermark: true, maxExportHeight: 1080, autoCutRunsPerDay: 3, features: [] };
export const PRO_ENTITLEMENTS: Entitlements = { tier: "pro", watermark: false, maxExportHeight: 2160, autoCutRunsPerDay: null, features: ["auto_cut_unlimited","templates_premium","export_4k","no_endcard"] };
```

Consumers: the export spec reads `watermark`/`maxExportHeight` (end-card segment, 2160p hidden); the templates spec reads `features.includes("templates_premium")` at Apply; the auto-clips spec reads `autoCutRunsPerDay`. All of them call the one command `account_state` (§6.2); there is no `license_state`.

A signed-out or unconfigured app uses `FREE_ENTITLEMENTS`; a licence token carries `ent` so Pro can change server-side. The Free auto-cut counter lives on device in `app_data_dir/usage.json` as `{ day: "YYYY-MM-DD" (local date), autoCutRuns }`, reset when the local date changes; it is a soft nudge, not security.

## 2. Data model (MariaDB 11.x, MySQL-compatible SQL)

Rules: every `DATETIME` is UTC and the pool runs `SET time_zone = '+00:00'` on connect (`mysql2` `timezone: 'Z'`); no MySQL-8-only features (no multi-valued JSON indexes, no `JSON_TABLE` reliance, no invisible columns); `JSON` is MariaDB's `LONGTEXT CHECK (JSON_VALID(...))` alias and is only ever read back whole, never indexed. Migrations run on app boot (§3). CI runs the same migrations against `mariadb:11` in Docker; there is **no SQLite** anywhere.

```sql
CREATE TABLE users (
  id CHAR(26) PRIMARY KEY, email VARCHAR(320) NOT NULL UNIQUE, email_verified_at DATETIME NULL,
  pending_email VARCHAR(320) NULL,          -- change-email flow, promoted on verify
  password_hash VARCHAR(255) NULL, google_sub VARCHAR(64) NULL UNIQUE, display_name VARCHAR(120) NULL,
  country CHAR(2) NOT NULL DEFAULT 'IN', gst_state_code CHAR(2) NULL, gstin CHAR(15) NULL, gst_legal_name VARCHAR(200) NULL,
  billing_address TEXT NULL, role ENUM('user','admin') NOT NULL DEFAULT 'user', deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE devices (id CHAR(26) PRIMARY KEY, user_id CHAR(26) NOT NULL, device_key_hash CHAR(64) NOT NULL,
  name VARCHAR(120), os VARCHAR(40), app_version VARCHAR(20), last_seen_at DATETIME NOT NULL, revoked_at DATETIME NULL,
  UNIQUE KEY (user_id, device_key_hash), FOREIGN KEY (user_id) REFERENCES users(id));
CREATE TABLE sessions (id CHAR(26) PRIMARY KEY, user_id CHAR(26) NOT NULL, device_id CHAR(26) NULL,
  refresh_hash CHAR(64) NOT NULL UNIQUE, family CHAR(26) NOT NULL, expires_at DATETIME NOT NULL, revoked_at DATETIME NULL,
  ip VARCHAR(45), ua VARCHAR(255), created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE web_sessions (id CHAR(26) PRIMARY KEY, user_id CHAR(26) NOT NULL, token_hash CHAR(64) NOT NULL UNIQUE,
  csrf CHAR(43) NOT NULL, expires_at DATETIME NOT NULL, revoked_at DATETIME NULL, ip VARCHAR(45), created_at DATETIME NOT NULL);
CREATE TABLE auth_codes (code_hash CHAR(64) PRIMARY KEY, user_id CHAR(26) NOT NULL, code_challenge CHAR(43) NOT NULL,
  redirect_uri VARCHAR(255) NOT NULL, expires_at DATETIME NOT NULL, used_at DATETIME NULL);
CREATE TABLE email_tokens (token_hash CHAR(64) PRIMARY KEY, user_id CHAR(26) NOT NULL,
  purpose ENUM('verify','reset','delete','change_email','portal') NOT NULL, expires_at DATETIME NOT NULL, used_at DATETIME NULL);
CREATE TABLE subscriptions (id CHAR(26) PRIMARY KEY, user_id CHAR(26) NOT NULL,
  provider ENUM('razorpay','paddle') NOT NULL, provider_sub_id VARCHAR(64) NOT NULL UNIQUE, plan_code VARCHAR(32) NOT NULL,
  status ENUM('created','authenticated','active','pending','halted','cancelled','completed','expired') NOT NULL,
  current_period_end DATETIME NULL, cancel_at_period_end TINYINT(1) NOT NULL DEFAULT 0,
  grace_until DATETIME NULL,                 -- set once on first `pending`, never extended (§6.5)
  provider_event_at DATETIME NULL,           -- provider timestamp of the last applied event (§6.4)
  checkout_expires_at DATETIME NULL, raw JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE payments (id CHAR(26) PRIMARY KEY, user_id CHAR(26) NOT NULL, subscription_id CHAR(26) NULL,
  provider ENUM('razorpay','paddle') NOT NULL, provider_payment_id VARCHAR(64) NOT NULL UNIQUE,
  amount_paise INT NOT NULL, currency CHAR(3) NOT NULL, status ENUM('captured','failed','refunded') NOT NULL,
  method VARCHAR(20), error_code VARCHAR(64), error_description VARCHAR(255), paid_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE invoices (payment_id CHAR(26) PRIMARY KEY, invoice_number VARCHAR(32) NOT NULL UNIQUE,  -- VER/2026-27/000123
  issued_on DATE NOT NULL,                   -- IST calendar date of payment
  snapshot JSON NOT NULL,                    -- every field printed on the PDF, frozen at issue (seller, buyer, GSTIN, split)
  pdf LONGBLOB NULL, pdf_sha256 CHAR(64) NULL, created_at DATETIME NOT NULL);
CREATE TABLE webhook_events (provider ENUM('razorpay','paddle') NOT NULL, event_id VARCHAR(80) NOT NULL, event_type VARCHAR(64) NOT NULL,
  payload JSON NOT NULL, received_at DATETIME NOT NULL, processed_at DATETIME NULL, attempts INT NOT NULL DEFAULT 0, error TEXT NULL,
  PRIMARY KEY (provider, event_id));
CREATE TABLE idempotency_keys (user_id CHAR(26) NOT NULL, `key` CHAR(36) NOT NULL, response_status SMALLINT, response_body JSON,
  created_at DATETIME NOT NULL, PRIMARY KEY (user_id, `key`));
CREATE TABLE rate_limits (bucket VARCHAR(120) PRIMARY KEY, count INT NOT NULL, window_start DATETIME NOT NULL);
CREATE TABLE audit_log (id BIGINT AUTO_INCREMENT PRIMARY KEY, at DATETIME NOT NULL, actor_user_id CHAR(26) NULL,
  action VARCHAR(64) NOT NULL, target VARCHAR(80) NULL, ip VARCHAR(45), meta JSON);
CREATE TABLE invoice_counter (fy CHAR(7) PRIMARY KEY, next_no INT NOT NULL);
CREATE TABLE cron_state (job VARCHAR(40) PRIMARY KEY, locked_until DATETIME NULL, cursor VARCHAR(64) NULL, last_run_at DATETIME NULL);
```

Indexes: `sessions(user_id)`, `web_sessions(user_id)`, `devices(user_id,last_seen_at)`, `subscriptions(user_id,status)`, `subscriptions(status,checkout_expires_at)`, `payments(user_id,paid_at)`, `email_tokens(expires_at)`, `audit_log(at)`. On account deletion everything is hard-deleted except `payments`, `invoices` and `audit_log` (`user_id` kept; tax records, DPDP permits legally required retention).

## 3. Server layout and configuration

```
server/src/
  index.ts        Fastify 5 app. Registers /webhooks/razorpay and /health FIRST with only node:crypto + db imports,
                  then dynamic-imports the rest (pdfkit, resend, razorpay) so a cold start still acks webhooks fast
  config.ts       zod env; LICENCE_PRIVATE_KEY_B64 decoded here; exports `features`
  db/{pool,migrate}.ts  Kysely + mysql2 (timezone 'Z', pool max 5). migrate() runs at boot under
                  SELECT GET_LOCK('verso_migrate', 60); skips if another instance holds it
  auth/* licence/* billing/{provider,razorpay,paddle,invoice}.ts routes/* web/* jobs/* i18n/{en,hi}.json
```

Fastify 5 (`fastify-raw-body` for webhook signatures, `@fastify/helmet`, `@fastify/cookie`; rate limiting is DB-backed, §4). Access tokens: `jose` EdDSA JWT signed by the licence key, 15 min, claims `{sub, sid, dev, scope, iat, exp, kid}`. Refresh tokens: 32 random bytes base64url, 60 days, rotated on every use; reuse of an old token revokes the whole `family`.

`.env.example` (all single-line values):

```
NODE_ENV=production  PORT=3000  PUBLIC_URL=https://account.verso.app
DATABASE_URL=mysql://u123_verso:***@127.0.0.1:3306/u123_verso
APP_SECRET=                      # 32+ random bytes base64
LICENCE_PRIVATE_KEY_B64=         # base64 of the Ed25519 PKCS#8 DER (one line); LICENCE_KEY_ID=2026-11
LICENCE_OFFLINE_DAYS=14          # z.coerce.number().positive(); LICENCE_OFFLINE_SECONDS overrides it in staging
GOOGLE_CLIENT_ID= GOOGLE_CLIENT_SECRET=          # Web application client, redirect PUBLIC_URL/auth/google/callback
RESEND_API_KEY= EMAIL_FROM="Verso <no-reply@verso.app>"
RAZORPAY_KEY_ID= RAZORPAY_KEY_SECRET= RAZORPAY_WEBHOOK_SECRET= RAZORPAY_WEBHOOK_SECRET_PREVIOUS=
RAZORPAY_PLAN_PRO_MONTHLY= RAZORPAY_PLAN_PRO_YEARLY=
SELLER_LEGAL_NAME= SELLER_GSTIN= SELLER_STATE_CODE=27 SELLER_ADDRESS=
BACKUP_S3_ENDPOINT= BACKUP_S3_BUCKET= BACKUP_S3_KEY= BACKUP_S3_SECRET=   # off-box backups (any S3-compatible store)
CRON_SECRET= ADMIN_EMAILS= ADMIN_IP_ALLOWLIST=
```

`docs/SETUP-KEYS.md` steps: (1) `node scripts/gen-licence-key.mjs` prints `LICENCE_PRIVATE_KEY_B64` and the SPKI public key entry for `src-tauri/licence_pubkeys.json`; (2) Google Cloud Console → **Web application** client, redirect `PUBLIC_URL/auth/google/callback`, scopes `openid email profile` — never register `verso://` or a loopback URI with Google; (3) Resend domain + DNS, sending-only API key; (4) Razorpay test/live keys, `pnpm razorpay:plans`, webhook at `PUBLIC_URL/webhooks/razorpay` with the ten `subscription.*` events + `payment.failed`, 32-byte secret; (5) Hostinger: subdomain site, Node 24, root `server`, build `pnpm build`, entry `dist/index.js`, MariaDB DB, Import .env, cron entries from §7; (6) first request runs migrations.

## 4. REST API

JSON under `/v1`, `Authorization: Bearer <access>`. Errors are `{ error: { code, params? } }`; the **client** maps `code` to i18n text (`src/lib/i18n/{en,hi}.json`), the web pages use the server's `i18n/*.json` with `Accept-Language`.

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `GET /health` | none | `{ok, db, features}` |
| `GET /signin` (HTML) | none | `state, code_challenge, redirect_uri, mode=app|web` |
| `POST /v1/auth/register` | RL | `{email, password, displayName, ageConfirmed}` → 201, verify mail |
| `POST /v1/auth/login` | RL | `{email, password, code_challenge?, redirect_uri?}` → app auth code redirect or web session cookie |
| `GET /auth/google/start` `GET /auth/google/callback` | none | server-side Google code flow; linking rules §5 |
| `POST /v1/auth/token` | RL | `authorization_code` or `refresh_token` grant → `{access_token, refresh_token, expires_in, server_time, licence}` |
| `POST /v1/auth/logout` | bearer | revoke this session; `{all:true}` revokes all sessions, web sessions and devices |
| `POST /v1/auth/verify-email` `POST /v1/auth/resend-verification` (RL 3/h) | | |
| `POST /v1/auth/forgot` (RL) `POST /v1/auth/reset` | none | reset revokes all sessions |
| `POST /v1/auth/portal-token` | bearer | one-time 60 s token → `PUBLIC_URL/account?t=…` (§8) |
| `GET /v1/me` `PATCH /v1/me` | bearer | profile; GST fields apply to **future** invoices only (GSTIN regex `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$`, first 2 digits must equal `gst_state_code`) |
| `POST /v1/me/email` `POST /v1/me/email/confirm {token}` | bearer | change email: writes `pending_email`, mails both addresses, promotes on confirm, revokes other sessions |
| `POST /v1/me/password {current, next}` | bearer | requires current password (Google-only accounts use `forgot` instead); revokes other sessions |
| `GET /v1/me/export` (RL 1/day) `POST /v1/me/delete` `POST /v1/me/delete/confirm` | bearer | DPDP access/erasure |
| `GET /v1/licence` | bearer | fresh licence for `dev` in the access token |
| `GET /v1/devices` `DELETE /v1/devices/:id` | bearer | list / sign out a device |
| `GET /v1/billing/plans` | none | prices, tax breakdown, provider |
| `POST /v1/billing/checkout` | bearer, Idempotency-Key | `{plan_code, gst_state_code, gstin?, gst_legal_name?}` → `{checkout_url}` |
| `GET /checkout/:token` (HTML) `POST /v1/billing/confirm` | signed token | Razorpay Standard Checkout page and confirm |
| `POST /v1/billing/cancel` `POST /v1/billing/retry` | bearer | `cancel_at_cycle_end` default; retry for `halted` |
| `GET /v1/billing/invoices` `GET /v1/billing/invoices/:paymentId.pdf` | bearer | |
| `POST /webhooks/razorpay` | signature | §6.4; `POST /webhooks/paddle` → 501 |
| `/v1/admin/*` | admin + allowlist | users search/get, grant/revoke, failed events + replay, metrics; all audit-logged |
| `POST /internal/cron/:job` | `X-Cron-Secret` | §7 |

**Rate limiter** (fixed window, one round trip, safe across processes), executed on one connection:

```sql
INSERT INTO rate_limits (bucket, count, window_start) VALUES (?, 1, UTC_TIMESTAMP())
ON DUPLICATE KEY UPDATE
  count = LAST_INSERT_ID(IF(window_start < UTC_TIMESTAMP() - INTERVAL ? SECOND, 1, count + 1)),
  window_start = IF(window_start < UTC_TIMESTAMP() - INTERVAL ? SECOND, UTC_TIMESTAMP(), window_start);
SELECT LAST_INSERT_ID();   -- returns 1 on fresh insert (insertId of the first statement), else the new count
```

Limits: login 10/15 min per IP and 5/15 min per email; register 5/h per IP; forgot and resend-verification 3/h per email; refresh 60/h per session; admin 300/min. Over limit → 429 `rate_limited` with `Retry-After`.

## 5. Desktop sign-in (authorization code + PKCE, system browser)

The desktop app is a public client of **our** server only. Google is reached server-side with a Web client; no Google secret ships in the binary.

1. Rust `auth_start_sign_in()` makes `code_verifier` (64 random bytes base64url), `code_challenge`, `state`; binds `TcpListener` on `127.0.0.1:0`; opens `PUBLIC_URL/signin?mode=app&state&code_challenge&redirect_uri=http://127.0.0.1:PORT/callback` via `tauri-plugin-opener`. If the bind fails, `redirect_uri=verso://auth/callback` (deep link). That fallback is a redirect of **Verso's own server**, never a Google redirect URI.
2. Server stores `{state, code_challenge, redirect_uri}` in a signed HttpOnly 10-min cookie; accepted redirect URIs are exactly `http://127.0.0.1:<port>/callback`, `http://[::1]:<port>/callback`, `verso://auth/callback`.
3. User signs in with Google or email+password. **Linking rule:** a Google identity is attached to an existing password account only if that account's `email_verified_at IS NOT NULL` and Google reports `email_verified:true`; otherwise 409 `email_unverified` ("Verify your email first, then sign in with Google."). A Google-first account that later wants a password must use `forgot` (email proof).
4. Server inserts `auth_codes` (hash of 32-byte code, 2 min, single use) and redirects to `redirect_uri?code&state`. Rust's loopback handler serves a Verso-styled "You're signed in — back to Verso", stops listening, and calls `window.set_focus()`. State mismatch → ignore; 5 min timeout → `signin_timeout`.
5. Rust posts `/v1/auth/token` with `code`, `code_verifier`, `device: {device_key, name, os, app_version}`. Server checks `sha256(verifier)==challenge`, marks the code used atomically (`UPDATE … WHERE used_at IS NULL`), upserts the device, creates a session, returns tokens + licence + `server_time`.
6. Rust stores refresh token and device key in the OS keychain (`keyring` 4.x, service `com.agapelabs.verso`); Windows Credential Manager limits a secret to **2560 bytes**, so only these two short values go there, never the licence token. Licence lives in `app_data_dir/licence.json` with `server_offset`; access token in memory. Emits `account:changed`.

Scheme hijack: on Windows any app can register `verso://`; PKCE + `state` + 2-minute single-use code means a stolen callback yields nothing without the verifier held in Verso's memory. Tauri config: `plugins.deep-link.desktop.schemes: ["verso"]`; `tauri-plugin-single-instance` initialised **before** deep-link; installer (NSIS/MSI) registers the scheme, dev builds call `register("verso")`; capabilities JSON grants `opener:default`, `deep-link:default`, `http:default` for `PUBLIC_URL` only; pubkeys via `include_str!("../licence_pubkeys.json")`, URL via `option_env!("VERSO_ACCOUNT_URL")`.

Passwords: 8-128 chars, `@zxcvbn-ts/core` score >= 2; Argon2id (`@node-rs/argon2` ^2.2) `memoryCost 19456, timeCost 2, parallelism 1`, `APP_SECRET` as secret; unknown email → verify against a dummy hash; generic `bad_credentials`. Emails via `resend` ^6: verify (24 h), reset (1 h), change-email, delete-confirm (1 h), payment failed, cancelled, receipt (PDF attached).

## 6. Licensing

### 6.1 Licence token

`v1.<base64url(payload)>.<base64url(sig)>`, `sig = Ed25519(private, "verso-licence-v1." + payload_bytes)`.

```ts
interface LicencePayload { v: 1; kid: string; sub: string; dev: string; email: string; plan: PlanCode; ent: Entitlements;
  status: "active" | "grace" | "free" | "device_limit" | "revoked"; iat: number; nbf: number /* iat-300 */;
  exp: number; /* iat + LICENCE_OFFLINE_DAYS*86400, capped at grace_until + 86400 when status==grace; 3 days when revoked; 365 d when free */ }
```

Issued on every `/v1/auth/token` and `/v1/licence`. Pro works offline until `exp` (14 days). App refreshes silently on launch (background, **no spinner**, cold start may take seconds) and every 6 h.

### 6.2 Verification in Rust (`src-tauri/src/commands/account.rs`)

```rust
#[derive(Serialize, Deserialize, Clone)] #[serde(rename_all = "camelCase")]
pub struct AccountState { pub configured: bool, pub signed_in: bool, pub email: Option<String>, pub plan: String, pub tier: String,
  pub entitlements: Entitlements, pub offline_days_left: Option<u32>, pub needs_attention: Option<String> /* i18n key */,
  pub devices_over_limit: bool }
#[tauri::command] pub async fn account_state(app: AppHandle) -> Result<AccountState, String>;
#[tauri::command] pub async fn auth_start_sign_in(app: AppHandle) -> Result<(), String>;
#[tauri::command] pub async fn auth_cancel_sign_in(app: AppHandle) -> Result<(), String>;
#[tauri::command] pub async fn auth_sign_out(app: AppHandle, all_devices: bool) -> Result<(), String>;
#[tauri::command] pub async fn licence_refresh(app: AppHandle) -> Result<AccountState, String>;
#[tauri::command] pub async fn billing_open_checkout(app: AppHandle, plan_code: String) -> Result<(), String>;
#[tauri::command] pub async fn billing_open_portal(app: AppHandle, page: String) -> Result<(), String>; // "devices" | "invoices" | "delete"
```

Verify: split on `.`, prefix `v1`, look up `kid` in embedded `licence_pubkeys.json` (`{kid, spki_b64, retired?}`), `ed25519_dalek::VerifyingKey::verify_strict`, `dev == stored device id`. Time: `now_corrected = local_now + server_offset` where `server_offset = server_time - local_now` saved at the last successful refresh (fixes laptops with dead CMOS batteries); require `nbf <= now_corrected <= exp`. Rollback check: persist `last_seen_unix`; `now_corrected < last_seen - 86400` → treat as expired with key `clock_wrong`. Any failure degrades to `FREE_ENTITLEMENTS`, never an error dialog. `reqwest` + `rustls`, 10 s timeout, 3 jittered retries on network errors only.

### 6.3 Device limits

Pro allows 3 active devices. **Sign-in always succeeds.** If the user already has 3 active devices (not revoked, `last_seen_at` within 60 days), the new device is created, the licence is issued as `status:"device_limit"` with Free entitlements, and `needs_attention="device_limit"` ("Pro is already on 3 computers. Free one in Account › Devices."). Account shows the device list with Sign out buttons; after a removal, `licence_refresh` upgrades immediately. The `expire` job marks devices unseen for 60 days as revoked so dead laptops free their slot. Remote sign-out is a bearer-token reality: it takes effect at the next online refresh (<= 6 h) and at worst at `exp` (14 days offline); a device the server sees as revoked gets a 3-day `revoked` token at refresh, and support copy says so.

### 6.4 Razorpay integration

```ts
export interface PaymentProvider {
  readonly name: "razorpay" | "paddle";
  createCheckout(u: User, plan: Plan): Promise<{ providerSubId: string; checkoutUrl: string; expiresAt: Date }>;
  confirmCheckout(input: unknown, stored: Subscription): Promise<{ paymentId: string } | null>;
  cancel(providerSubId: string, atPeriodEnd: boolean): Promise<void>;
  verifyWebhook(rawBody: Buffer, headers: Record<string, string>): { eventId: string; type: string; createdAt: Date; payload: any } | null;
  normalize(evt): NormalizedEvent; // {kind, subId, providerAt, periodEnd?, payment?}
}
```

**Checkout.** Requires `email_verified_at` and `gst_state_code` (checkout page has one state dropdown defaulted from locale, optional GSTIN + legal name). If an unexpired `created` subscription for the same user+plan exists, reuse it; else `POST /v1/subscriptions {plan_id, total_count: 120 | 10, quantity:1, customer_notify:false, notes:{user_id, plan_code}, expire_by: now+1h}` and store `created` with `checkout_expires_at`. Hosted page loads `checkout.razorpay.com/v1/checkout.js` with `{key, subscription_id, name:"Verso Pro", prefill:{email}, handler}`; handler posts to `/v1/billing/confirm`; server checks `HMAC-SHA256(key_secret, payment_id + "|" + stored.provider_sub_id)` with `timingSafeEqual`, sets `authenticated` (without touching `provider_event_at`), issues Pro. Page shows "You're on Pro. Back to Verso." and tries `verso://billing/done`. The app polls `/v1/licence` with backoff 3 s → 15 s for **15 minutes** (UPI Autopay and card AFA routinely take 2-5 min), restarts polling when the window regains focus, and Account has an explicit "I've paid — refresh" button.

**Webhook handler** (route registered before heavy imports): raw body; `X-Razorpay-Signature` must equal hex HMAC-SHA256(body, secret or `_PREVIOUS`); mismatch → 400. Then:

```
INSERT INTO webhook_events (...) VALUES (...) ON DUPLICATE KEY UPDATE attempts = attempts + 1;
BEGIN; SELECT processed_at, error FROM webhook_events WHERE provider=? AND event_id=? FOR UPDATE;
  if processed_at IS NOT NULL → COMMIT, 200 (true duplicate)
  if error IS NOT NULL AND attempts > 5 → COMMIT, 200 (poison; admin replay only)
  SELECT * FROM subscriptions WHERE provider_sub_id=? FOR UPDATE;
  apply(normalize(evt)); UPDATE webhook_events SET processed_at=UTC_TIMESTAMP(), error=NULL; COMMIT; 200
on throw → ROLLBACK, UPDATE webhook_events SET error=?; 200 (Razorpay retries up to 24 h; attempts caps it)
```

Ordering: compare `evt.providerAt` with `subscriptions.provider_event_at` (provider clock vs provider clock, never our `updated_at`); older or equal → skip the state change but still record payments. `apply` per kind: `authenticated/activated` → status, `current_period_end`, `grace_until=NULL`. `charged` → `INSERT IGNORE payments` (retries are harmless), `current_period_end`, create invoice (§6.6), receipt mail only when the insert actually inserted. `pending`/`halted`/`cancelled`/`completed`/`expired` → §6.5 table. `payment.failed` → `INSERT IGNORE payments(status='failed', error_code, error_description)`.

### 6.5 Dunning state table

`grace_until` is set **once** (first `pending`, `now + 7 d`) and never moved; `halted` sets it only if NULL.

| From | Event | To | grace_until | Licence | Email |
| --- | --- | --- | --- | --- | --- |
| active | `pending` | pending | set if NULL (now+7d) | active (`grace`) until grace_until | day 0 "payment didn't go through" |
| pending | `charged`/`activated` | active | NULL | active | receipt |
| pending | `halted` | halted | keep (set now+3d only if NULL) | `grace` until grace_until, then free | "Update your payment method" with `short_url`/retry link |
| pending/halted | cron `expire`, grace_until passed | unchanged | keep | free, `needs_attention=payment_failed` | day 7 "Pro paused; your projects are safe" |
| halted | user `/billing/retry` → new sub charged | active (new row; old row cancelled) | NULL | active | receipt |
| active | user cancel (`cancel_at_cycle_end`) | active, `cancel_at_period_end=1` | — | active until `current_period_end` | "Pro ends on <date>" |
| any | `cancelled`/`completed`/`expired` | that status | — | free from `max(current_period_end, now)` | cancelled |
| created | `checkout_expires_at` passed (cron) | expired | — | — | none |

Dunning cron sends the day-3 reminder once (`audit_log` guard). Immediate cancel and refunds are admin/manual in the Razorpay dashboard.

### 6.6 GST invoice (deterministic, persisted off-disk)

At `charged`: `taxable = round(A/1.18)`, `tax = A - taxable`; place of supply = GSTIN first 2 digits, else `users.gst_state_code` (mandatory at checkout). Same state as `SELLER_STATE_CODE` → CGST=SGST=tax/2 (odd paisa to CGST), else IGST. **No silent fallback to the seller's state; a missing state blocks checkout — CA to confirm B2C place-of-supply rule and LUT/OIDAR treatment for non-IN customers (phase 2).** FY and `issued_on` are computed from `paid_at` converted to **IST** (`Asia/Kolkata`). Number `VER/<FY>/<6 digits>` from `invoice_counter … FOR UPDATE` inside the webhook transaction. Everything printed is frozen into `invoices.snapshot`; `pdfkit` renders from the snapshot and the bytes are stored in `invoices.pdf` (LONGBLOB, ~30 KB each) — the app directory is wiped on every Hostinger deploy, so nothing is written to disk. Download regenerates from the snapshot if `pdf` is NULL and byte-compares with `pdf_sha256` in tests. Issued invoices are immutable; GST detail changes apply to the next invoice.

### 6.7 International

Phase 1 INR/India only; `country != IN` shows `payments_india_only`. Phase 2 Paddle (merchant of record) through `billing/paddle.ts`; `provider` enum already present.

## 7. Scheduled jobs (`curl -fsS -H "X-Cron-Secret: $S" -X POST PUBLIC_URL/internal/cron/<job>`)

| Job | Schedule | Work (< 60 s, idempotent) |
| --- | --- | --- |
| `expire` | `*/15 * * * *` | grace/period-end downgrades; expire `created` subs; revoke devices unseen 60 d; purge expired codes/tokens/sessions/rate windows |
| `dunning` | `0 */6 * * *` | day-3 reminders |
| `reconcile` | `0 3 * * *` | **50 subs per run**, cursor in `cron_state`, `GET /v1/subscriptions/{id}` for `pending/halted/active` stale > 2 d |
| `keepwarm` | `*/5 * * * *` | `GET /health`; cadence must be shorter than the idle timeout measured in staging; each run is one short-lived process in the NPROC budget |
| `backup` | `30 2 * * *` | `node --env-file=.env scripts/backup.mjs`: uses `mysqldump` **if present** (`which mysqldump`, unverified on Hostinger) else a Kysely table-by-table JSON dump; gzip; upload to `BACKUP_S3_*` (off-box); keep 30. A backup on the same disk is not a backup |

Lock: `UPDATE cron_state SET locked_until = UTC_TIMESTAMP() + INTERVAL 10 MINUTE WHERE job=? AND (locked_until IS NULL OR locked_until < UTC_TIMESTAMP())`; 0 rows → exit.

## 8. Web account portal (`PUBLIC_URL/account`)

Server-rendered pages, Verso tokens, no framework. Session: `vs` cookie = 32-byte token (hash in `web_sessions`, 24 h, `Secure; HttpOnly; SameSite=Lax`), CSRF double-submit (`csrf` column, hidden field on every form). Entry points: `/signin?mode=web`, or from the app via `POST /v1/auth/portal-token` → `GET /account?t=<token>` (purpose `portal`, 60 s, single use) which creates a web session and 302s to `/account/<page>`. Pages: `/account` (plan, next charge, Upgrade/Cancel), `/account/devices` (list + Sign out, "Sign out everywhere"), `/account/invoices` (list + PDF), `/account/security` (change email/password), `/account/delete`. `logout {all:true}` also revokes web sessions.

## 9. App behaviour when not configured or offline

`VERSO_ACCOUNT_URL`/pubkeys absent → `configured=false`, Account menu shows `accounts_not_configured`, **no network call ever**. Offline → Pro persists until `exp`; "Pro works offline for N more days" only when N <= 5; 5xx treated as offline. `/health.features` hides Google, Upgrade or sign-up when their keys are missing. React: `useAccount()` reads `account_state` on mount and subscribes to `account:changed`; TopBar gets a sign-in/avatar button (Ember stays reserved for Export); export gate uses `entitlements.watermark`/`maxExportHeight`; locked features show a "Pro" tag and an upgrade sheet.

## 10. Security and privacy

- HTTPS, HSTS, helmet headers, CSP allowing only `checkout.razorpay.com` on the checkout page; cookies as above; raw-body signature checks with `timingSafeEqual`; webhook body <= 256 KB.
- Secrets in env only; `APP_SECRET` peppers Argon2 and token hashes; Ed25519 key rotates via `kid` with both keys shipped for one release.
- Refresh rotation + family revocation; password change/reset/email change revoke other sessions; admin routes need `role=admin` + `ADMIN_EMAILS` + optional allowlist, all audited.
- Desktop: strict deep-link parsing (`verso://auth/callback?code&state`, `verso://billing/done` only); loopback accepts one request; licence verification in Rust.
- CI: `pnpm audit`; licence allowlist (MIT/Apache-2.0/BSD/ISC/MPL-2.0) generated from the real lockfile with `license-checker-rseidelsohn`; `cargo deny`; `engines.node` check.
- DPDP/GDPR: minimal fields; purpose text on sign-in; age >= 18 checkbox; export JSON; delete with email confirm, 48 h notice mail before erasure, payments/invoices kept 8 years, audit log 1 year; grievance contact and Board link; `docs/INCIDENT.md` (users promptly, Board immediately, 72 h report). Resend and Razorpay named as processors. No trackers.

## 11. Failure handling (i18n keys; en shown, hi required)

| Key | en |
| --- | --- |
| `net_unreachable` | "We couldn't reach Verso accounts. Check your internet connection and try again." |
| `browser_failed` | "We couldn't open your browser. Copy this link to sign in:" (copy button) |
| `signin_timeout` | "Sign-in timed out. Try again." |
| `signed_out_remote` | "You've been signed out. Sign in again to keep Pro." |
| `licence_invalid` | "Something's wrong with your licence. Sign out and in again." |
| `device_limit` | "Pro is already on 3 computers. Free one in Account › Devices." |
| `payment_failed_checkout` | "The payment didn't go through. No money was taken. Try another card or UPI." |
| `payment_pending` | "Payment received? UPI and bank approval can take a few minutes. We'll switch you to Pro automatically, or press Refresh." |
| `payment_failed` | "We couldn't renew Verso Pro. Your projects are safe; exports will have the Verso end-card until payment goes through." |
| `clock_wrong` | "Your computer's clock looks wrong. Fix the date and time to keep using Pro." |
| `email_unverified` | "Verify your email first, then sign in with Google." |
| `signup_unavailable` / `upgrade_unavailable` / `payments_india_only` | "Sign-up isn't available right now." / "Upgrades aren't available yet." / "Payments are available in India for now." |

## 12. Performance targets

`/v1/auth/token`, `/v1/licence` p95 < 300 ms warm; cold start after idle measured in staging (target < 5 s, never on the app's critical path). Webhook ack p95 < 500 ms, hard ceiling 4 s. Argon2id 50-100 ms. Desktop `account_state` from cache < 5 ms; licence verify < 1 ms. Pool max 5, cron concurrency 1; `EXPLAIN` in tests shows no table scans.

## 13. Test plan

- **Unit (vitest):** PKCE; Argon2 + dummy-hash path; refresh rotation/family revocation; licence sign/verify round trip; Razorpay checkout and webhook signature vectors (current and previous secret); GST split (same state, inter-state, odd paisa) and IST FY boundary (31 Mar 18:30 UTC); invoice PDF determinism (same snapshot → same sha256); rate-limiter statement (fresh insert returns 1, window reset); dunning table (every row); ordering (`activated` after `confirm`, stale `activated` after `cancelled`); dedupe (crash after insert → retry processes; processed → 200).
- **Integration (MariaDB 11 Docker service, supertest, CI matrix Node 24 and 26):** register → verify → login → token → licence; Google mock incl. linking rules; checkout reuse; confirm → `charged` webhook → invoice row with PDF; `pending → halted → downgrade`; device-limit sign-in returns Free + `device_limit` then frees after DELETE; change email/password/resend; portal token → web session → CSRF rejection; export/delete; cron jobs twice; `features` off paths; concurrency: two parallel `charged` webhooks, two parallel invoice counters.
- **Rust (`cargo test`):** licence fixtures (expired, wrong `dev`, retired `kid`, tampered, rollback, negative `server_offset` of -10 min still valid); deep-link parsing; keyring mock.
- **Manual E2E (Windows):** Razorpay test mode cards/UPI against staging; `LICENCE_OFFLINE_SECONDS=900` offline expiry; firewall-blocked loopback → deep link; remote sign-out visible within 6 h; cold-start timing; keepwarm cadence.
- **Security:** `pnpm audit`, licence allowlist, ZAP baseline, wrong-signature webhook → 400, CSRF-less POST → 403.

## 14. Ordered implementation checklist

1. `server/` scaffold: Fastify 5, zod config (base64 key, offline seconds), Kysely + mysql2 (`timezone 'Z'`), boot migrations under `GET_LOCK`, `/health`, MariaDB 11 in CI, licence allowlist + engines check.
2. Schema §2; `shared/entitlements.ts` + sync check; i18n files.
3. Email/password auth, Argon2id, verify/resend/forgot/reset/change email/change password, Resend templates, DB rate limiter.
4. Licence signing, `/v1/auth/token` with `server_time`, refresh rotation, devices with limit semantics, `/v1/licence`.
5. Sign-in page (PKCE params, allowed redirect URIs, `auth_codes`); Google web client with linking rules.
6. Web portal §8: `web_sessions`, portal token, pages, CSRF.
7. Rust `commands/account.rs`: loopback, deep link (single-instance first), keyring 4.x, `ed25519-dalek` 3 verify with offset, scheduler, `set_focus`; Tauri config/capabilities.
8. React: `useAccount`, TopBar, Account sheet (devices, plan, offline days, refresh button), export gate, not-configured states.
9. Razorpay: plans script, checkout (reuse, GST state), confirm, webhook with lock/dedupe/ordering, dunning table.
10. Invoices: snapshot, LONGBLOB PDF, IST FY, counter, receipt mail, downloads.
11. Cron jobs with `cron_state` lock and paging; off-box backup script; Hostinger cron entries; measure idle timeout and set keepwarm.
12. Export/delete/privacy page/audit; admin endpoints and replay.
13. Docs (`SETUP-KEYS`, `INCIDENT`), staging deploy, Razorpay test-mode E2E.
14. Paddle stub, country-based provider selection, international copy.
15. Launch: rotate keys, live Razorpay keys and webhook, CA sign-off on GST place-of-supply and LUT/OIDAR.
