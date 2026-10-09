// ForgeOS AI — Dual-Mode Gateway Access
// Tries the external gateway (local dev, :8788) first.
// Falls back to in-process ProviderPool (Vercel serverless, public deployment).
//
// The standalone gateway at services/forgeos-ai/ is preserved untouched.
// This module only activates the in-process path when the external gateway
// is unreachable, ensuring the public deployment works with $0 infrastructure.

import { NextResponse } from 'next/server';

const GATEWAY_URL = process.env.FORGEOS_AI_ENDPOINT || 'http://127.0.0.1:8788';

// Lazy-load the in-process pool to avoid importing Node.js 'fs' at module level
// in environments where it might not be available during build.
let poolInstance: any = null;
async function getPool() {
  if (!poolInstance) {
    const mod = await import('./providers.mjs');
    poolInstance = mod.pool;
  }
  return poolInstance;
}

async function tryGateway(path: string, init?: RequestInit): Promise<{ ok: boolean; data: any; status: number }> {
  try {
    const res = await fetch(`${GATEWAY_URL}${path}`, {
      ...init,
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data, status: res.status };
  } catch {
    return { ok: false, data: null, status: 0 };
  }
}

/**
 * Internal: get health data (not a NextResponse) for use by other routes.
 */
export async function getHealthData(): Promise<any> {
  const gw = await tryGateway('/health');
  if (gw.ok) return gw.data;

  const pool = await getPool();
  const agg = pool.aggregateStatus();
  return {
    service: 'forgeos-ai',
    version: '2.0.0',
    status: agg.aggregate,
    providers: agg.total,
    connected: agg.connected,
    configured: agg.configured,
    timestamp: new Date().toISOString(),
    _mode: 'in-process',
  };
}

/**
 * Internal: route a chat completion (not a NextResponse) for use by other routes.
 */
export async function routeChat(body: {
  messages: { role: string; content: string }[];
  model?: string;
  capability?: string;
  temperature?: number;
  max_tokens?: number;
  // provider selection removed (Phase 2) - ForgeOS AI controls routing
}): Promise<{ ok: boolean; data: any; status: number }> {
  if (!body.messages || !Array.isArray(body.messages)) {
    return { ok: false, data: { error: 'messages array required' }, status: 400 };
  }

  const gw = await tryGateway('/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (gw.ok || gw.status !== 0) {
    return gw;
  }

  // Fallback: in-process routing
  try {
    const pool = await getPool();
    const routed = await pool.route(body.messages, {
      model: body.model,
      // provider: removed (Phase 2) - ForgeOS AI controls routing
      capability: body.capability,
      temperature: body.temperature,
      maxTokens: body.max_tokens,
    });
    return {
      ok: true,
      status: 200,
      data: {
        ...routed.result,
        forgeos: {
          provider: routed.provider,
          label: routed.label,
          fallback: routed.fallback,
          capability: body.capability || 'chat',
          routedAt: new Date().toISOString(),
          _mode: 'in-process',
          ...routed.evidence,
        },
      },
    };
  } catch (err: any) {
    return {
      ok: false,
      status: err.statusCode || 503,
      data: {
        error: err.message || 'ForgeOS AI gateway unreachable',
        gateway: GATEWAY_URL,
        _mode: 'in-process',
        details: err.details,
      },
    };
  }
}

/**
 * GET /health — dual-mode
 */
export async function gatewayHealth() {
  const gw = await tryGateway('/health');
  if (gw.ok) return NextResponse.json(gw.data, { status: gw.status });

  // Fallback: in-process
  const pool = await getPool();
  const agg = pool.aggregateStatus();
  return NextResponse.json({
    service: 'forgeos-ai',
    version: '2.0.0',
    status: agg.aggregate,
    providers: agg.total,
    connected: agg.connected,
    configured: agg.configured,
    timestamp: new Date().toISOString(),
    _mode: 'in-process',
  });
}

/**
 * GET /providers — dual-mode
 */
export async function gatewayProviders() {
  const gw = await tryGateway('/providers');
  if (gw.ok) return NextResponse.json(gw.data, { status: gw.status });

  const pool = await getPool();
  const agg = pool.aggregateStatus();
  return NextResponse.json({
    status: agg.aggregate,
    providers: agg.providers,
    timestamp: new Date().toISOString(),
    _mode: 'in-process',
  });
}

/**
 * POST /providers/check — dual-mode
 */
export async function gatewayProvidersCheck() {
  const gw = await tryGateway('/providers/check', { method: 'POST' });
  if (gw.ok) return NextResponse.json(gw.data, { status: gw.status });

  const pool = await getPool();
  const results = await pool.checkAll();
  const agg = pool.aggregateStatus();
  return NextResponse.json({
    status: agg.aggregate,
    providers: results,
    timestamp: new Date().toISOString(),
    _mode: 'in-process',
  });
}

/**
 * POST /v1/chat/completions — dual-mode
 */
export async function gatewayChat(body: {
  messages: { role: string; content: string }[];
  model?: string;
  capability?: string;
  temperature?: number;
  max_tokens?: number;
  // provider selection removed (Phase 2) - ForgeOS AI controls routing
}) {
  if (!body.messages || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: 'messages array required' }, { status: 400 });
  }

  const gw = await tryGateway('/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (gw.ok || gw.status !== 0) {
    // Gateway responded (success or error) — use its response
    return NextResponse.json(gw.data, { status: gw.status });
  }

  // Fallback: in-process routing
  try {
    const pool = await getPool();
    const routed = await pool.route(body.messages, {
      model: body.model,
      // provider: removed (Phase 2) - ForgeOS AI controls routing
      capability: body.capability,
      temperature: body.temperature,
      maxTokens: body.max_tokens,
    });
    return NextResponse.json({
      ...routed.result,
      forgeos: {
        provider: routed.provider,
        label: routed.label,
        fallback: routed.fallback,
        capability: body.capability || 'chat',
        routedAt: new Date().toISOString(),
        _mode: 'in-process',
        ...routed.evidence,
      },
    });
  } catch (err: any) {
    const status = err.statusCode || 503;
    return NextResponse.json(
      {
        error: err.message || 'ForgeOS AI gateway unreachable',
        gateway: GATEWAY_URL,
        _mode: 'in-process',
        details: err.details,
      },
      { status }
    );
  }
}
