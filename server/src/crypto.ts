import { createHash, createHmac, generateKeyPairSync, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hash, verify } from '@node-rs/argon2';
import { importPKCS8, importSPKI, exportJWK, SignJWT, jwtVerify, type JWK, type CryptoKey } from 'jose';
import type { Config } from './config.js';

export const uuid = () => randomUUID();
export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url');
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
export const sha256b64url = (s: string) => createHash('sha256').update(s).digest('base64url');

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function hmacSha256Hex(secret: string, payload: string | Buffer) {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

// argon2id with library defaults (m=19MiB, t=2, p=1), OWASP-recommended baseline.
export const hashPassword = (pw: string) => hash(pw);
export const verifyPassword = async (hashed: string, pw: string) => {
  try {
    return await verify(hashed, pw);
  } catch {
    return false;
  }
};

export type Keys = {
  jwtSecret: Uint8Array;
  entPrivate: CryptoKey;
  entPublic: CryptoKey;
  entPublicJwk: JWK;
  entKid: string;
};

const pem = (v: string) => v.replace(/\\n/g, '\n');
const devKeyDir = join(dirname(fileURLToPath(import.meta.url)), '..', '.dev-keys');

/** Loads signing keys from env; outside production, missing keys are generated once into server/.dev-keys/. */
export async function loadKeys(config: Config): Promise<Keys> {
  let jwtSecret = config.JWT_SECRET;
  let priv = config.ENTITLEMENT_PRIVATE_KEY && pem(config.ENTITLEMENT_PRIVATE_KEY);
  let pub = config.ENTITLEMENT_PUBLIC_KEY && pem(config.ENTITLEMENT_PUBLIC_KEY);

  if (!config.isProd && (!jwtSecret || !priv || !pub)) {
    mkdirSync(devKeyDir, { recursive: true });
    const f = (n: string) => join(devKeyDir, n);
    if (!existsSync(f('jwt-secret.txt'))) writeFileSync(f('jwt-secret.txt'), randomToken(48));
    if (!existsSync(f('entitlement-private.pem'))) {
      const kp = generateKeyPairSync('ed25519');
      writeFileSync(f('entitlement-private.pem'), kp.privateKey.export({ type: 'pkcs8', format: 'pem' }));
      writeFileSync(f('entitlement-public.pem'), kp.publicKey.export({ type: 'spki', format: 'pem' }));
    }
    jwtSecret ||= readFileSync(f('jwt-secret.txt'), 'utf8').trim();
    priv ||= readFileSync(f('entitlement-private.pem'), 'utf8');
    pub ||= readFileSync(f('entitlement-public.pem'), 'utf8');
  }
  if (!jwtSecret || !priv || !pub) throw new Error('Signing keys are not configured');

  const entPrivate = await importPKCS8(priv, 'EdDSA');
  const entPublic = await importSPKI(pub, 'EdDSA', { extractable: true });
  const entPublicJwk = await exportJWK(entPublic);
  const entKid = sha256(pub).slice(0, 16);
  return { jwtSecret: new TextEncoder().encode(jwtSecret), entPrivate, entPublic, entPublicJwk: { ...entPublicJwk, kid: entKid, alg: 'EdDSA', use: 'sig' }, entKid };
}

const ISSUER = 'verso-accounts';

export async function signAccessToken(keys: Keys, config: Config, userId: string, deviceId?: string | null) {
  return new SignJWT({ typ: 'access', ...(deviceId ? { did: deviceId } : {}) })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience('verso-api')
    .setIssuedAt()
    .setExpirationTime(`${config.ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(keys.jwtSecret);
}

export async function verifyAccessToken(keys: Keys, token: string) {
  const { payload } = await jwtVerify(token, keys.jwtSecret, { issuer: ISSUER, audience: 'verso-api', algorithms: ['HS256'] });
  if (payload.typ !== 'access' || !payload.sub) throw new Error('not an access token');
  return { userId: payload.sub, deviceId: (payload.did as string | undefined) ?? null };
}

export async function signEntitlementToken(
  keys: Keys,
  config: Config,
  userId: string,
  claims: Record<string, unknown>,
  deviceId?: string | null,
) {
  return new SignJWT({ ...claims, ...(deviceId ? { did: deviceId } : {}) })
    .setProtectedHeader({ alg: 'EdDSA', kid: keys.entKid, typ: 'verso-entitlement+jwt' })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience('verso-desktop')
    .setIssuedAt()
    .setExpirationTime(`${config.OFFLINE_ENTITLEMENT_DAYS}d`)
    .sign(keys.entPrivate);
}
