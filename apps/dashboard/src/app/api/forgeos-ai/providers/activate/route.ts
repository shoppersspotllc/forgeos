import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { vault } from '@/lib/forgeos-ai/vault.mjs';
import { getPool } from '@/lib/forgeos-ai/gateway-dual';

/**
 * POST /api/forgeos-ai/providers/activate
 *
 * Validates a provider API key against the REAL upstream API, and if valid,
 * activates it in the in-process pool so the provider ACTUALLY connects —
 * the provider cards then show real latency, model count, and key health.
 *
 * Body: { providerId: string, key: string }
 *
 * Security:
 * - Requires FORGEOS_ADMIN_TOKEN as Bearer.
 * - The key is NEVER logged, NEVER returned. It is held in server memory only.
 *
 * Honest limitation: the activation is EPHEMERAL (in-memory). It survives
 * until the serverless instance cold-starts or redeploys. For permanent
 * activation, set FORGEOS_<ID>_KEY as a Vercel env var.
 */

const ALLOWED = new Set(['openrouter', 'gemini', 'zurelay']);

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

async function fetchTimeout(url: string, init: RequestInit, ms = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: 403 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const providerId = typeof body.providerId === 'string' ? body.providerId : '';
  const key = typeof body.key === 'string' ? body.key.trim() : '';
  if (!ALLOWED.has(providerId)) {
    return NextResponse.json({ error: `Unknown or keyless provider: ${providerId}` }, { status: 400 });
  }
  if (!key) {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 });
  }

  // 1. Validate against the real provider (same logic as test-key).
  const start = Date.now();
  let valid = false;
  let modelCount: number | null = null;
  let error: string | null = null;
  try {
    if (providerId === 'openrouter') {
      const r = await fetchTimeout('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (r.status === 401 || r.status === 403) error = 'Invalid API key (rejected by OpenRouter)';
      else if (!r.ok) error = `OpenRouter returned HTTP ${r.status}`;
      else {
        valid = true;
        const m = await fetchTimeout('https://openrouter.ai/api/v1/models', {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (m.ok) {
          const d = await m.json().catch(() => ({}));
          modelCount = Array.isArray(d.data) ? d.data.length : null;
        }
      }
    } else if (providerId === 'gemini') {
      const r = await fetchTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`, {}
      );
      if (r.status === 400 || r.status === 401 || r.status === 403) error = 'Invalid API key (rejected by Google)';
      else if (!r.ok) error = `Google returned HTTP ${r.status}`;
      else {
        valid = true;
        const d = await r.json().catch(() => ({}));
        modelCount = Array.isArray(d.models) ? d.models.length : null;
      }
    } else {
      const r = await fetchTimeout('https://api.zurelay.com/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (r.status === 401 || r.status === 403) error = 'Invalid API key (rejected by Zurelay)';
      else if (!r.ok) error = `Zurelay returned HTTP ${r.status} — could not confirm`;
      else {
        valid = true;
        const d = await r.json().catch(() => ({}));
        modelCount = Array.isArray(d.data) ? d.data.length : null;
      }
    }
  } catch (e: any) {
    error = e?.name === 'AbortError' ? 'Upstream timed out' : 'Validation failed (network error)';
  }

  if (!valid) {
    return NextResponse.json({ providerId, success: false, error, latencyMs: Date.now() - start });
  }

  // 2. Activate in the in-process pool (ephemeral, in-memory).
  vault.setEphemeral(providerId, key);
  const pool = await getPool();
  const provider = pool.get(providerId);
  let status: any = null;
  if (provider) {
    try {
      status = await provider.healthCheck();
    } catch (e: any) {
      status = provider.publicStatus();
    }
  }

  const envVar = `FORGEOS_${providerId.toUpperCase().replace(/-/g, '_')}_KEY`;
  return NextResponse.json({
    providerId,
    success: true,
    latencyMs: Date.now() - start,
    modelCount,
    status,
    ephemeral: true,
    persistenceNote: `Active for this session. For permanent activation, set ${envVar} as a Vercel env var (Production) and redeploy.`,
  });
}
