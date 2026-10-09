/**
 * Host-based routing: guides.shoppersspotllc.com → /guides/*
 *
 * When the request arrives with Host: guides.shoppersspotllc.com,
 * rewrite to the /guides path so the guides site is served from
 * the subdomain without a separate Vercel project ($0).
 */

import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
