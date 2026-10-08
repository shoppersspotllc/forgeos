import { NextRequest } from 'next/server';
import { gatewayChat } from '@/lib/forgeos-ai/gateway-dual';

/**
 * Dashboard → ForgeOS AI /v1/chat/completions (dual-mode)
 * Tries the external gateway first, falls back to in-process ProviderPool.
 * All dashboard intelligence requests flow through here → ForgeOS AI → provider.
 * NEVER call providers directly from the dashboard.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  // Default to the local Ollama model when none specified (in-process mode
  // has no gateway to resolve a default; the frozen ProviderPool requires
  // an explicit model for Ollama).
  if (!body.model) {
    body.model = 'llama3.2:1b';
  }
  return gatewayChat(body);
}
