import { NextRequest, NextResponse } from 'next/server';
import { gatewayChat } from '@/lib/forgeos-ai/gateway-dual';
import {
  extractBearerToken,
  validateServiceKey,
} from '@/lib/forgeos-ai/service-keys.mjs';

export const maxDuration = 60;

/**
 * OpenAI-compatible chat completions endpoint for OpenDots.
 *
 * OpenDots (CopilotKit) appends `/chat/completions` to OPENAI_BASE_URL.
 * Point OPENAI_BASE_URL at https://forgeos.shoppersspotllc.com/api/forgeos-ai
 * and the Dot's model calls land here, authenticated with a ForgeOS
 * service credential (Authorization: Bearer fk_...).
 *
 * Request/response shape matches OpenAI chat completions, so any
 * OpenAI-compatible client works unchanged. All inference routes through
 * ForgeOS AI → ProviderPool (existing providers, existing spend).
 */
export async function POST(req: NextRequest) {
  const token = extractBearerToken(req.headers.get('authorization'));
  if (!token) {
    return NextResponse.json(
      { error: 'ForgeOS service credential required', code: 'missing_credential' },
      { status: 401 },
    );
  }
  const auth = validateServiceKey(token);
  if (!auth.valid) {
    return NextResponse.json(
      { error: 'Invalid ForgeOS service credential', code: auth.reason },
      { status: 401 },
    );
  }

  const body = await req.json();
  if (!body.messages || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: 'messages array required' }, { status: 400 });
  }
  if (!body.model) {
    body.model = 'llama3.2:1b';
  }

  return gatewayChat(body, { keyId: auth.keyId, consumerName: auth.name });
}
