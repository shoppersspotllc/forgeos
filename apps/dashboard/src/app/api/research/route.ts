/**
 * ForgeOS Research API — Shared Capability Layer (HTTP surface)
 *
 * POST /api/research
 *
 * Thin HTTP wrapper over the shared server-side executor
 * (@/lib/capabilities/executor). All capability logic, SSRF protection,
 * and param validation live in the executor so the My Dots agentic tool
 * loop can execute the same code in-process (no internal HTTP calls).
 *
 * Request:
 *   {
 *     capability: 'web-search' | 'web-read' | 'github-research' | 'youtube-transcript' | 'reddit' | 'rss',
 *     operation: string,
 *     params: Record<string, any>,
 *     dotName?: string  // audit logging only — NOT proof of identity
 *   }
 *
 * This is a public, rate-limited endpoint. Per-Dot tool permissions are
 * enforced server-side in the My Dots agentic tool loop, not here.
 * All external content is treated as untrusted. No credentials exposed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeCapability } from '@/lib/capabilities/executor';

export const maxDuration = 30;

// Rate limiter (per-instance)
const buckets = new Map<string, { count: number; resetAt: number }>();
function checkRate(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= max) return false;
  b.count++;
  return true;
}

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')?.trim()
    || 'unknown';
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  if (!checkRate(`research:${ip}`, 30, 60000)) {
    return NextResponse.json({ error: 'Rate limit exceeded (30/min)' }, { status: 429 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { capability, operation, params = {}, dotName } = body;
  if (!capability || !operation) {
    return NextResponse.json({ error: 'capability and operation required' }, { status: 400 });
  }

  try {
    const result = await executeCapability(capability, operation, params);

    // Audit log (server-side only)
    console.log(`[research] ${dotName || 'anonymous'} used ${capability}:${operation}`);

    return NextResponse.json({ success: true, capability, operation, result });
  } catch (e: any) {
    const msg = (e && e.message) || 'Research operation failed';
    console.error(`[research] ${capability}:${operation} failed:`, msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 502 }
    );
  }
}

export async function GET() {
  // Return capability registry
  const { CAPABILITY_REGISTRY } = await import('@/lib/capabilities/registry');
  return NextResponse.json({ capabilities: CAPABILITY_REGISTRY });
}
