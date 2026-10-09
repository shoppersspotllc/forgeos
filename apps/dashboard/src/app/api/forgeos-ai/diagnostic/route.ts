import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

/**
 * ForgeOS AI — Provider Diagnostic (admin only)
 *
 * POST /api/forgeos-ai/diagnostic
 *
 * Admin-authenticated diagnostic for testing a specific provider.
 * Does NOT affect production routing or priorities.
 *
 * Auth: Authorization: Bearer <FORGEOS_ADMIN_TOKEN>
 * Body: { provider: 'zurelay', messages: [{ role: 'user', content: '...' }], model?: string }
 *
 * Returns: { provider, label, model, latencyMs, result }
 * The provider credential stays server-side; only the sanitized result is returned.
 */

function checkAdmin(req: NextRequest): boolean {
  const adminToken = process.env.FORGEOS_ADMIN_TOKEN;
  if (!adminToken) return false;
  const header = req.headers.get('authorization') || '';
  const expected = `Bearer ${adminToken}`;
  if (header.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(header, 'utf8'), Buffer.from(expected, 'utf8'));
  } catch (_e) {
    return false;
  }
}

// Lazy-load pool to avoid importing Node.js modules at build time
let poolInstance: any = null;
async function getPool() {
  if (!poolInstance) {
    const mod = await import('@/lib/forgeos-ai/providers.mjs');
    poolInstance = mod.pool;
  }
  return poolInstance;
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch (_e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const providerId = body.provider;
  const messages = body.messages;

  if (!providerId || typeof providerId !== 'string') {
    return NextResponse.json({ error: 'provider (string) required' }, { status: 400 });
  }
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'messages (non-empty array) required' }, { status: 400 });
  }
  // Cap diagnostic message size
  const totalChars = messages.reduce((sum: number, m: any) =>
    sum + (typeof m.content === 'string' ? m.content.length : 0), 0);
  if (totalChars > 2000) {
    return NextResponse.json({ error: 'Diagnostic messages capped at 2000 chars' }, { status: 413 });
  }

  const startTime = Date.now();
  try {
    const pool = await getPool();
    // Force the specific provider via the pool's provider option.
    // This does NOT change production routing; it's a one-off diagnostic.
    const routed = await pool.route(messages, {
      provider: providerId,
      model: body.model,
      capability: 'chat',
    });
    const latencyMs = Date.now() - startTime;

    // DIAGNOSTIC NO-FALLBACK ENFORCEMENT:
    // This endpoint must prove the REQUESTED provider responded, not a fallback.
    // If the pool fell back to a different provider, reject the result.
    if (routed.provider !== providerId || routed.fallback === true) {
      return NextResponse.json({
        provider: providerId,
        error: 'Provider fallback detected — diagnostic requires the requested provider',
        requestedProvider: providerId,
        actualProvider: routed.provider,
        fallback: routed.fallback ?? true,
        latencyMs,
      }, { status: 502 });
    }

    // Return sanitized result: provider identity + model + latency, not raw credentials
    return NextResponse.json({
      provider: routed.provider,
      label: routed.label,
      model: routed.evidence?.model || body.model || 'default',
      latencyMs,
      providerLatencyMs: routed.evidence?.providerLatencyMs || null,
      fallback: routed.fallback,
      // Include only the message content, not internal metadata
      result: routed.result,
    });
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return NextResponse.json({
      provider: providerId,
      error: 'Diagnostic request failed',
      code: err.code || 'unknown',
      statusCode: err.statusCode || 503,
      latencyMs,
    }, { status: err.statusCode || 503 });
  }
}
