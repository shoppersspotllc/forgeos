// ForgeOS AI — Dual-Mode Gateway Access
// Tries the external gateway (local dev, :8788) first.
// Falls back to in-process ProviderPool (Vercel serverless, public deployment).
//
// The standalone gateway at services/forgeos-ai/ is preserved untouched.
// This module only activates the in-process path when the external gateway
// is unreachable, ensuring the public deployment works with $0 infrastructure.

import { NextResponse } from 'next/server';
import { gatewayExtraHeaders } from './gateway-headers';

const GATEWAY_URL = process.env.FORGEOS_AI_ENDPOINT || 'http://127.0.0.1:8788';

/**
 * Phase 4: Observability — sanitized structured logging.
 *
 * NEVER log: credentials (fk_...), Authorization headers, provider API keys,
 * full prompt content, internal URLs, or stack traces.
 *
 * Logged: timestamp, event type, keyId, consumer name, model, provider,
 * success/failure, latency, status code, message counts (not content).
 */
interface AuthContext {
  keyId?: string;
  consumerName?: string;
}

function sanitizeForLog(value: any): any {
  if (typeof value === 'string') {
    // Redact anything that looks like a credential
    if (/^(fk_|sk-|Bearer\s+)/i.test(value)) return '[REDACTED]';
    if (value.length > 200) return value.slice(0, 200) + '...[truncated]';
    return value;
  }
  if (Array.isArray(value)) return value.map(sanitizeForLog);
  if (value && typeof value === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) {
      const kl = k.toLowerCase();
      // Never log sensitive keys
      if (kl.includes('key') || kl.includes('token') || kl.includes('secret') ||
          kl.includes('auth') || kl.includes('credential') || kl.includes('password')) {
        out[k] = '[REDACTED]';
      } else if (kl === 'messages' || kl === 'prompt' || kl === 'content') {
        // Log counts, not content
        out[k] = Array.isArray(v) ? `[${v.length} messages]` : '[content redacted]';
      } else {
        out[k] = sanitizeForLog(v);
      }
    }
    return out;
  }
  return value;
}

function logAIEvent(event: string, data: Record<string, any>) {
  const sanitized = sanitizeForLog(data);
  // Structured JSON log for serverless log aggregation
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    service: 'forgeos-ai',
    event,
    ...sanitized,
  }));
}

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
    // Merge order: tunnel/proxy auth headers first, caller headers win,
    // except the gateway's own auth which callers set explicitly.
    const headers = {
      ...gatewayExtraHeaders(),
      ...((init?.headers as Record<string, string>) || {}),
    };
    const res = await fetch(`${GATEWAY_URL}${path}`, {
      ...init,
      headers,
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data, status: res.status };
  } catch (_e) {
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
}, authContext?: AuthContext): Promise<{ ok: boolean; data: any; status: number }> {
  const startTime = Date.now();
  const keyId = (authContext && authContext.keyId) || 'unknown';
  const consumerName = (authContext && authContext.consumerName) || 'unknown';

  if (!body.messages || !Array.isArray(body.messages)) {
    logAIEvent('ai_request_rejected', {
      keyId, consumer: consumerName,
      reason: 'messages_array_required',
      latencyMs: Date.now() - startTime,
    });
    return { ok: false, data: { error: 'messages array required' }, status: 400 };
  }

  // Phase 4: Log request start (sanitized - no prompt content)
  const messageCount = body.messages.length;
  const totalChars = body.messages.reduce((sum, m) =>
    sum + (typeof m.content === 'string' ? m.content.length : 0), 0);

  const gw = await tryGateway('/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (gw.ok || gw.status !== 0) {
    logAIEvent('ai_request_complete', {
      keyId, consumer: consumerName,
      mode: 'gateway', success: gw.ok, statusCode: gw.status,
      messageCount, totalChars,
      latencyMs: Date.now() - startTime,
    });
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
    const latencyMs = Date.now() - startTime;
    // Phase 4: Log success with consumer identity (sanitized)
    logAIEvent('ai_request_complete', {
      keyId, consumer: consumerName,
      mode: 'in-process', success: true, statusCode: 200,
      provider: routed.provider, model: body.model || (routed.evidence && routed.evidence.model),
      fallback: routed.fallback, messageCount, totalChars,
      latencyMs,
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
          // Phase 4: Consumer identity in evidence (name only, not key)
          consumer: consumerName,
          ...routed.evidence,
        },
      },
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    // Phase 4: Log failure (sanitized - no stack trace, no internal URLs)
    logAIEvent('ai_request_failed', {
      keyId, consumer: consumerName,
      mode: 'in-process', success: false,
      statusCode: err.statusCode || 503,
      errorCode: err.code || 'unknown',
      messageCount, totalChars,
      latencyMs,
    });
    return {
      ok: false,
      status: err.statusCode || 503,
      data: {
        // Phase 3: No internal URLs in client errors
        error: 'ForgeOS AI temporarily unavailable',
        _mode: 'in-process',
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
}, authContext?: AuthContext) {
  const startTime = Date.now();
  const keyId = (authContext && authContext.keyId) || 'unknown';
  const consumerName = (authContext && authContext.consumerName) || 'unknown';

  if (!body.messages || !Array.isArray(body.messages)) {
    logAIEvent('ai_request_rejected', {
      keyId, consumer: consumerName,
      reason: 'messages_array_required',
      latencyMs: Date.now() - startTime,
    });
    return NextResponse.json({ error: 'messages array required' }, { status: 400 });
  }

  // Phase 4: Log request start (sanitized - no prompt content)
  const messageCount = body.messages.length;
  const totalChars = body.messages.reduce((sum, m) =>
    sum + (typeof m.content === 'string' ? m.content.length : 0), 0);

  const gw = await tryGateway('/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (gw.ok || gw.status !== 0) {
    // Gateway responded (success or error) — use its response
    logAIEvent('ai_request_complete', {
      keyId, consumer: consumerName,
      mode: 'gateway', success: gw.ok, statusCode: gw.status,
      messageCount, totalChars,
      latencyMs: Date.now() - startTime,
    });
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
    const latencyMs = Date.now() - startTime;
    // Phase 4: Log success with consumer identity (sanitized)
    logAIEvent('ai_request_complete', {
      keyId, consumer: consumerName,
      mode: 'in-process', success: true, statusCode: 200,
      provider: routed.provider, model: body.model || (routed.evidence && routed.evidence.model),
      fallback: routed.fallback, messageCount, totalChars,
      latencyMs,
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
        // Phase 4: Consumer identity in evidence (name only, not key)
        consumer: consumerName,
        ...routed.evidence,
      },
    });
  } catch (err: any) {
    const status = err.statusCode || 503;
    const latencyMs = Date.now() - startTime;
    // Phase 4: Log failure (sanitized - no stack trace, no internal URLs)
    logAIEvent('ai_request_failed', {
      keyId, consumer: consumerName,
      mode: 'in-process', success: false, statusCode: status,
      errorCode: err.code || 'unknown',
      messageCount, totalChars,
      latencyMs,
    });
    return NextResponse.json(
      {
        // Phase 4: No internal URLs, no raw error messages in client errors
        error: 'ForgeOS AI temporarily unavailable',
        _mode: 'in-process',
      },
      { status }
    );
  }
}
