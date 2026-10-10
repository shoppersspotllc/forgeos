import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPreviewCode,
  issuePreviewToken,
  isPreviewAuthConfigured,
  isValidTenantId,
  SESSION_COOKIE,
} from '@/lib/platform/auth';
import { store, DEMO } from '@/lib/platform/store';

/**
 * POST /api/platform/auth/login — private-preview access gate.
 *
 * Body: { code: string, tenant?: string }. The code is verified in
 * constant time against PLATFORM_PREVIEW_CODE; on success a signed
 * session token is issued for the requested tenant (default "demo").
 * Sets an httpOnly session cookie AND returns the token for API use.
 *
 * HONEST SCOPE LABEL: private-preview auth, not production identity.
 */
export async function POST(req: NextRequest) {
  if (!isPreviewAuthConfigured()) {
    return NextResponse.json(
      { demo: DEMO, dataMode: 'TEST', data: { error: 'Preview auth is not configured on this deployment' } },
      { status: 503 }
    );
  }
  let body: { code?: unknown; tenant?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { demo: DEMO, dataMode: 'TEST', data: { error: 'Invalid JSON body' } },
      { status: 400 }
    );
  }
  if (!verifyPreviewCode(body.code)) {
    // Deliberately identical shape/timing profile to a malformed request:
    // no oracle for code validity beyond the 401 itself.
    return NextResponse.json(
      { demo: DEMO, dataMode: 'TEST', data: { error: 'Invalid preview access code' } },
      { status: 401 }
    );
  }
  const tenant = typeof body.tenant === 'string' && body.tenant.length > 0 ? body.tenant.toLowerCase() : 'demo';
  if (!isValidTenantId(tenant)) {
    return NextResponse.json(
      { demo: DEMO, dataMode: 'TEST', data: { error: 'Invalid tenant id (a-z, 0-9, dash; max 32 chars)' } },
      { status: 400 }
    );
  }
  const token = await issuePreviewToken(tenant);
  const expiresAt = new Date(Date.now() + 12 * 3600 * 1000).toISOString();
  store.logActivity(tenant, 'system', 'preview_login', tenant, 'Preview session issued (TEST).');
  // B1 fix: base the Secure attribute on the actual request scheme, not
  // NODE_ENV alone. Browsers drop Secure cookies over plain HTTP, which broke
  // UI login on non-HTTPS previews (API returned 200 but the cookie was never
  // stored, so the browser bounced back to /platform/login). HTTPS deployments
  // — direct or behind a proxy sending x-forwarded-proto — keep Secure.
  const forwardedProto = req.headers.get('x-forwarded-proto');
  const isSecureRequest = forwardedProto
    ? forwardedProto.split(',')[0].trim().toLowerCase() === 'https'
    : req.nextUrl.protocol === 'https:';
  const res = NextResponse.json({
    demo: DEMO,
    dataMode: 'TEST',
    data: { token, tenantId: tenant, expiresAt, authMode: 'private-preview (not production identity)' },
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 12 * 3600,
    secure: isSecureRequest,
  });
  return res;
}
