/**
 * Host-based routing: guides.shoppersspotllc.com → /guides/*
 *
 * When the request arrives with Host: guides.shoppersspotllc.com,
 * rewrite to the /guides path so the guides site is served from
 * the subdomain without a separate Vercel project ($0).
 *
 * Plus: private-preview gate for the Young Money platform (/platform/*,
 * /api/platform/*). See lib/platform/auth.ts — honest scope label:
 * private-preview auth, not production identity.
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractToken, verifyPreviewToken, SESSION_COOKIE } from './lib/platform/auth';

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';

  // Guides subdomain → serve /guides/*
  if (host === 'guides.shoppersspotllc.com' || host.startsWith('guides.')) {
    const url = req.nextUrl.clone();
    // Don't rewrite SEO files, API routes, or already-prefixed paths
    const passthrough = ['/sitemap.xml', '/robots.txt'];
    if (passthrough.includes(url.pathname)) {
      return NextResponse.next();
    }
    // Don't double-prefix if already on /guides or /api
    if (!url.pathname.startsWith('/guides') && !url.pathname.startsWith('/api')) {
      url.pathname = url.pathname === '/' ? '/guides' : `/guides${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // Young Money platform preview gate (not on the guides host paths above,
  // which return early; platform paths are never /guides-prefixed).
  const { pathname } = req.nextUrl;
  const isPlatformUi = pathname === '/platform' || pathname.startsWith('/platform/');
  const isPlatformApi = pathname.startsWith('/api/platform/');
  if (isPlatformUi || isPlatformApi) {
    const isLoginPage = pathname === '/platform/login';
    const isLoginApi = pathname === '/api/platform/auth/login';
    if (!isLoginPage && !isLoginApi) {
      const token = extractToken(req);
      const tenantId = token ? await verifyPreviewToken(token) : null;
      if (!tenantId) {
        if (isPlatformApi) {
          return NextResponse.json(
            { demo: true, dataMode: 'TEST', data: { error: 'Invalid or expired preview session token' } },
            { status: 401 }
          );
        }
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = '/platform/login';
        const res = NextResponse.redirect(loginUrl);
        if (req.cookies.get(SESSION_COOKIE)) {
          res.cookies.delete(SESSION_COOKIE);
        }
        return res;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

// seo-passthrough v2