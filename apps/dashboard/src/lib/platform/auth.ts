/**
 * Young Money Platform — private-preview access gate.
 *
 * HONEST SCOPE LABEL: this is "private-preview auth, not production identity."
 * It provides a demo-grade access gate (shared preview code + HMAC-signed
 * session tokens) so the private preview is not open to the internet. It is
 * NOT production identity: no passwords, no MFA, no account recovery, no
 * user directory, no login rate limiting. Do not use for real customers
 * or real data without a proper identity system.
 *
 * Design:
 * - Session secret comes ONLY from the PLATFORM_SESSION_SECRET environment
 *   variable. It is never committed, logged, or returned to clients.
 * - Preview access code comes ONLY from PLATFORM_PREVIEW_CODE (env).
 *   Verification uses a constant-time comparison.
 * - Tokens: `v1.<tenantId-b64url>.<exp-unix>.<sig-b64url>`,
 *   sig = HMAC-SHA256(secret, `v1.<tenantId-b64url>.<exp-unix>`).
 * - Every data access in the platform is scoped by the tenantId carried in
 *   a verified token. Tokens are accepted via `Authorization: Bearer <t>`
 *   or the `ymp_session` httpOnly cookie.
 * - Uses WebCrypto (async) so the same code runs in Node route handlers
 *   and in Edge middleware.
 */

const TOKEN_VERSION = 'v1';
/** 12 hours, in seconds. */
const DEFAULT_TTL_SECONDS = 12 * 3600;
export const SESSION_COOKIE = 'ymp_session';

/** tenantIds are lowercase alphanumerics + dashes, max 32 chars. */
const TENANT_RE = /^[a-z0-9-]{1,32}$/;

export function isValidTenantId(t: string): boolean {
  return TENANT_RE.test(t);
}

const te = new TextEncoder();

function b64urlEncodeBytes(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecodeBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Constant-time byte comparison (no early exit on content). */
function safeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Read lazily (never at import time) so `next build` prerender doesn't crash. */
function sessionSecret(): string | null {
  const s = process.env.PLATFORM_SESSION_SECRET;
  return typeof s === 'string' && s.length >= 16 ? s : null;
}

function previewCode(): string | null {
  const c = process.env.PLATFORM_PREVIEW_CODE;
  return typeof c === 'string' && c.length >= 8 ? c : null;
}

async function hmacSign(secret: string, payload: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', te.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, te.encode(payload));
  return new Uint8Array(sig);
}

/**
 * Issue a signed preview session token for a tenant.
 * Throws if the tenant id is invalid or the session secret is not configured.
 */
export async function issuePreviewToken(tenantId: string, ttlSeconds: number = DEFAULT_TTL_SECONDS): Promise<string> {
  if (!isValidTenantId(tenantId)) throw new Error('invalid tenant id');
  const secret = sessionSecret();
  if (!secret) throw new Error('preview auth is not configured (PLATFORM_SESSION_SECRET missing)');
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const tenantB64 = b64urlEncodeBytes(te.encode(tenantId));
  const payload = `${TOKEN_VERSION}.${tenantB64}.${exp}`;
  const sig = b64urlEncodeBytes(await hmacSign(secret, payload));
  return `${payload}.${sig}`;
}

/** Verify a token. Returns the tenantId, or null when invalid/expired/tampered. */
export async function verifyPreviewToken(token: string): Promise<string | null> {
  const secret = sessionSecret();
  if (!secret || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== TOKEN_VERSION) return null;
  const [ver, tenantB64, expStr, sigB64] = parts;
  const payload = `${ver}.${tenantB64}.${expStr}`;
  const expected = await hmacSign(secret, payload);
  let provided: Uint8Array;
  try {
    provided = b64urlDecodeBytes(sigB64);
  } catch {
    return null;
  }
  if (!safeEqualBytes(expected, provided)) return null;
  const exp = Number(expStr);
  if (!Number.isInteger(exp) || exp <= Math.floor(Date.now() / 1000)) return null;
  let tenantId: string;
  try {
    tenantId = new TextDecoder().decode(b64urlDecodeBytes(tenantB64));
  } catch {
    return null;
  }
  if (!isValidTenantId(tenantId)) return null;
  return tenantId;
}

/** Constant-time verification of the preview access code. */
export function verifyPreviewCode(candidate: unknown): boolean {
  const expected = previewCode();
  if (!expected || typeof candidate !== 'string' || candidate.length === 0) return false;
  return safeEqualBytes(te.encode(expected), te.encode(candidate));
}

/** True when preview auth is configured (both env vars present). */
export function isPreviewAuthConfigured(): boolean {
  return sessionSecret() !== null && previewCode() !== null;
}

export interface AuthResult {
  ok: true;
  tenantId: string;
}

export interface AuthFailure {
  ok: false;
  /** 401 for missing/invalid/tampered/expired token; 503 when auth isn't configured. */
  status: 401 | 503;
  error: string;
}

/** Extract the bearer token from Authorization header or the session cookie. */
export function extractToken(req: { headers: { get(name: string): string | null } }): string | null {
  const header = req.headers.get('authorization');
  if (header) {
    const m = /^Bearer (.+)$/.exec(header.trim());
    if (m) return m[1];
  }
  const cookie = req.headers.get('cookie');
  if (cookie) {
    for (const part of cookie.split(';')) {
      const [k, ...rest] = part.trim().split('=');
      if (k === SESSION_COOKIE) return rest.join('=');
    }
  }
  return null;
}

/**
 * Authorize a platform API request. Returns the tenantId on success;
 * otherwise a failure the route must turn into a 401/503 response.
 */
export async function authorizeRequest(req: { headers: { get(name: string): string | null } }): Promise<AuthResult | AuthFailure> {
  if (!isPreviewAuthConfigured()) {
    return { ok: false, status: 503, error: 'Preview auth is not configured on this deployment' };
  }
  const token = extractToken(req);
  if (!token) {
    return { ok: false, status: 401, error: 'Missing preview session token' };
  }
  const tenantId = await verifyPreviewToken(token);
  if (!tenantId) {
    return { ok: false, status: 401, error: 'Invalid or expired preview session token' };
  }
  return { ok: true, tenantId };
}
