import { decodeJwt } from 'jose';
import type { Config } from './config.js';
import { ApiError } from './ctx.js';

export const googleRedirectUri = (config: Config) => `${config.PUBLIC_URL}/auth/google/callback`;

export function googleAuthUrl(config: Config, state: string) {
  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  u.search = new URLSearchParams({
    client_id: config.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(config),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  }).toString();
  return u.toString();
}

export async function googleProfileFromCode(config: Config, code: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.GOOGLE_CLIENT_ID!,
      client_secret: config.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleRedirectUri(config),
      grant_type: 'authorization_code',
    }),
  });
  const json = (await res.json().catch(() => ({}))) as { id_token?: string };
  if (!res.ok || !json.id_token) throw new ApiError(502, 'google_exchange_failed', "We couldn't finish signing in with Google. Please try again.");
  // The id_token came straight from Google's token endpoint over TLS, so OIDC Core 3.1.3.7 lets us skip the
  // signature check; we still check issuer, audience and expiry.
  const c = decodeJwt(json.id_token);
  const issOk = c.iss === 'https://accounts.google.com' || c.iss === 'accounts.google.com';
  if (!issOk || c.aud !== config.GOOGLE_CLIENT_ID || !c.sub || !c.email || (c.exp ?? 0) * 1000 < Date.now()) {
    throw new ApiError(502, 'google_bad_token', "We couldn't finish signing in with Google. Please try again.");
  }
  return {
    sub: String(c.sub),
    email: String(c.email),
    emailVerified: c.email_verified === true || c.email_verified === 'true',
    name: typeof c.name === 'string' ? c.name : undefined,
  };
}
