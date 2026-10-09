import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/forgeos-ai/rate-limit';
import { gatewayChat } from '@/lib/forgeos-ai/gateway-dual';
import {

// Vercel: max 60s execution (Hobby plan limit)
export const maxDuration = 60;
  extractBearerToken,
  validateServiceKey,
} from '@/lib/forgeos-ai/service-keys.mjs';

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
  // Rate limiting: 60 requests/minute per authenticated consumer (Phase 1 hardening)
  const rateLimit = checkRateLimit(`forgeos-ai:${auth.keyId}`, { maxRequests: 60, windowMs: 60000 });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.', retryAfter: rateLimit.retryAfter },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter || 60) } }
    );
  }

  return gatewayChat(body);
}
