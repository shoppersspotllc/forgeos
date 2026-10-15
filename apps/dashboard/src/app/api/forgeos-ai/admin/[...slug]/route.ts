import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

/**
 * ForgeOS AI Provider Hub — admin proxy to the standalone gateway.
 *
 * Browser (admin) → this route → gateway /admin/*.
 *
 * Auth layers (both server-side enforced):
 *   1. Caller must present FORGEOS_ADMIN_TOKEN as Bearer (same token as /api/forgeos-ai/keys).
 *   2. This route forwards with FORGEOS_GATEWAY_ADMIN_TOKEN, which never
 *      reaches the browser.
 *
 * The gateway owns credentials: they are written to its secrets/ dir (0600)
 * and never appear in any response. If the gateway is unreachable (desktop
 * offline), this route returns 503 — it never fabricates provider state.
 */

const GATEWAY_URL = process.env.FORGEOS_AI_ENDPOINT || 'http://127.0.0.1:8788';

function checkAdmin(req: NextRequest): boolean {
  const adminToken = process.env.FORGEOS_ADMIN_TOKEN;
  if (!adminToken) return false;
  const header = req.headers.get('authorization') || '';
  const expected = `Bearer ${adminToken}`;
  if (header.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(header, 'utf8'), Buffer.from(expected, 'utf8'));
  } catch {
    return false;
  }
}

async function proxy(req: NextRequest, slug: string[]) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: 403 });
  }
  const gatewayToken = process.env.FORGEOS_GATEWAY_ADMIN_TOKEN;
  if (!gatewayToken) {
    return NextResponse.json(
      { error: 'Provider hub unavailable: FORGEOS_GATEWAY_ADMIN_TOKEN is not configured on this server' },
      { status: 503 }
    );
  }

  const target = `${GATEWAY_URL}/admin/${slug.map(encodeURIComponent).join('/')}`;
  const init: RequestInit = {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${gatewayToken}`,
    },
    signal: AbortSignal.timeout(30000),
  };
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    try {
      init.body = JSON.stringify(await req.json());
    } catch {
      init.body = '{}';
    }
  }

  let gwRes: Response;
  try {
    gwRes = await fetch(target, init);
  } catch {
    return NextResponse.json(
      { error: 'ForgeOS AI gateway is unreachable. Start it on the desktop to manage providers.' },
      { status: 503 }
    );
  }
  const data = await gwRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: gwRes.status });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  return proxy(req, (await ctx.params).slug);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  return proxy(req, (await ctx.params).slug);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  return proxy(req, (await ctx.params).slug);
}
