import { NextRequest, NextResponse } from 'next/server';
import { gatewayChat } from '@/lib/forgeos-ai/gateway-dual';
import {
  extractBearerToken,
  validateServiceKey,
} from '@/lib/forgeos-ai/service-keys.mjs';

export const maxDuration = 60;
// Phase 2.1: Minimal in-memory rate limiter (per-instance)
const __rateBuckets = new Map();
function __checkRate(key: string, maxReq: number, windowMs: number) {
  const now = Date.now();
  const b = __rateBuckets.get(key);
  if (!b || now >= b.resetAt) {
    __rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= maxReq) return false;
  b.count++;
  return true;
}
/**
 * Dashboard → ForgeOS AI /v1/chat/completions (dual-mode)
 * Tries the external gateway first, falls back to in-process ProviderPool.
 * All dashboard intelligence requests flow through here → ForgeOS AI → provider.
 * NEVER call providers directly from the dashboard.
 *
 * AUTHENTICATION: Requires a valid ForgeOS service credential.
 *   Authorization: Bearer fk_...
 * Platforms/Dots authenticate to ForgeOS. They NEVER need provider keys.
 */
export async function POST(req: NextRequest) {
  // --- ForgeOS-native authentication ---
  const token = extractBearerToken(req.headers.get('authorization'));
  if (!token) {
    return NextResponse.json(
      { error: 'ForgeOS service credential required', code: 'missing_credential' },
      { status: 401 }
    );
  }
  const auth = validateServiceKey(token);
  if (!auth.valid) {
    return NextResponse.json(
      { error: 'Invalid ForgeOS service credential', code: auth.reason },
      { status: 401 }
    );
  }
  // --- End authentication ---

  const body = await req.json();
  // Default to the local Ollama model when none specified (in-process mode
  // has no gateway to resolve a default; the frozen ProviderPool requires
  // an explicit model for Ollama).
  if (!body.model) {
    body.model = 'llama3.2:1b';
  }
  // Rate limit: 60 req/min per authenticated key
  if (!__checkRate('rl:' + auth.keyId, 60, 60000)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: 60 },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  // Phase 4: Pass consumer identity for observability (server-side logging)
  return gatewayChat(body, { keyId: auth.keyId, consumerName: auth.name });
}
