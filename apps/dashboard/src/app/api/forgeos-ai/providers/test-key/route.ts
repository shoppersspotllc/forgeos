import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

/**
 * POST /api/forgeos-ai/providers/test-key
 *
 * Validates a provider API key against the REAL upstream provider API and
 * returns the actual connection status + model count. Used by the provider
 * card "key" popup so the owner sees truthful results before saving.
 *
 * Body: { providerId: string, key: string }
 *
 * Security:
 * - Requires FORGEOS_ADMIN_TOKEN as Bearer (same as /api/forgeos-ai/keys).
 * - The key is NEVER logged, NEVER persisted, NEVER returned.
 * - providerId is allowlisted; unknown ids are rejected.
 * - Upstream calls have a 15s timeout.
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

type CheckResult = {
  valid: boolean;
  modelCount: number | null;
  latencyMs: number;
  error: string | null;
  detail: string | null;
};

async function checkOpenRouter(key: string): Promise<CheckResult> {
  const start = Date.now();
  // /auth/key is the ONLY endpoint that truly validates the key (/models is public).
  const authRes = await fetchTimeout('https://openrouter.ai/api/v1/auth/key', {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (authRes.status === 401 || authRes.status === 403) {
    return { valid: false, modelCount: null, latencyMs: Date.now() - start, error: 'Invalid API key (rejected by OpenRouter)', detail: null };
  }
  if (!authRes.ok) {
    return { valid: false, modelCount: null, latencyMs: Date.now() - start, error: `OpenRouter returned HTTP ${authRes.status}`, detail: null };
  }
  const modelsRes = await fetchTimeout('https://openrouter.ai/api/v1/models', {
    headers: { Authorization: `Bearer ${key}` },
  });
  let count: number | null = null;
  if (modelsRes.ok) {
    const data = await modelsRes.json().catch(() => ({}));
    count = Array.isArray(data.data) ? data.data.length : null;
  }
  return { valid: true, modelCount: count, latencyMs: Date.now() - start, error: null, detail: 'Key accepted by OpenRouter' };
}

async function checkGemini(key: string): Promise<CheckResult> {
  const start = Date.now();
  const res = await fetchTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
    {}
  );
  if (res.status === 400 || res.status === 401 || res.status === 403) {
    return { valid: false, modelCount: null, latencyMs: Date.now() - start, error: 'Invalid API key (rejected by Google)', detail: null };
  }
  if (!res.ok) {
    return { valid: false, modelCount: null, latencyMs: Date.now() - start, error: `Google returned HTTP ${res.status}`, detail: null };
  }
  const data = await res.json().catch(() => ({}));
  const count = Array.isArray(data.models) ? data.models.length : null;
  return { valid: true, modelCount: count, latencyMs: Date.now() - start, error: null, detail: 'Key accepted by Google' };
}

async function checkZurelay(key: string): Promise<CheckResult> {
  const start = Date.now();
  // Best-effort: try OpenAI-compatible /models.
  const res = await fetchTimeout('https://api.zurelay.com/v1/models', {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (res.status === 401 || res.status === 403) {
    return { valid: false, modelCount: null, latencyMs: Date.now() - start, error: 'Invalid API key (rejected by Zurelay)', detail: null };
  }
  if (!res.ok) {
    return { valid: false, modelCount: null, latencyMs: Date.now() - start, error: `Zurelay returned HTTP ${res.status} — could not confirm`, detail: null };
  }
  const data = await res.json().catch(() => ({}));
  const count = Array.isArray(data.data) ? data.data.length : null;
  return { valid: true, modelCount: count, latencyMs: Date.now() - start, error: null, detail: 'Key accepted by Zurelay' };
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
  const key = typeof body.key === 'string' ? body.key : '';
  if (!ALLOWED.has(providerId)) {
    return NextResponse.json({ error: `Unknown or keyless provider: ${providerId}` }, { status: 400 });
  }
  if (!key.trim()) {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 });
  }

  try {
    const result =
      providerId === 'openrouter' ? await checkOpenRouter(key.trim()) :
      providerId === 'gemini' ? await checkGemini(key.trim()) :
      await checkZurelay(key.trim());
    // NEVER include the key in the response.
    return NextResponse.json({ providerId, ...result });
  } catch (e: any) {
    const msg = e?.name === 'AbortError' ? 'Upstream timed out' : 'Validation failed (network error)';
    return NextResponse.json({ providerId, valid: false, modelCount: null, latencyMs: 0, error: msg, detail: null });
  }
}
