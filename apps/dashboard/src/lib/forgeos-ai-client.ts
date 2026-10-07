// ForgeOS AI — TypeScript Client for Dashboard/Frontend
// All dashboard intelligence requests go through ForgeOS AI.
// This client calls the dashboard's /api/forgeos-ai/* proxies (which forward to the gateway).

export const Capabilities = {
  CHAT: 'chat',
  CODING: 'coding',
  FAST: 'fast',
  EMBEDDINGS: 'embeddings',
  VISION: 'vision',
  AUDIO: 'audio',
} as const;

export type Capability = typeof Capabilities[keyof typeof Capabilities];

interface ChatOptions {
  model?: string;
  capability?: Capability;
  temperature?: number;
  maxTokens?: number;
  provider?: string;
  timeout?: number;
}

export async function forgeosChat(messages: { role: string; content: string }[], options: ChatOptions = {}) {
  // Route through the dashboard proxy → ForgeOS AI gateway
  // (Direct gateway access also works: process.env.FORGEOS_AI_ENDPOINT)
  const res = await fetch('/api/forgeos-ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(options.timeout || 180000),
    body: JSON.stringify({
      messages,
      model: options.model,
      capability: options.capability || Capabilities.CHAT,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      provider: options.provider,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `ForgeOS AI error: ${res.status}`);
  }

  return data;
}

export async function forgeosHealth() {
  const res = await fetch('/api/forgeos-ai/health', { signal: AbortSignal.timeout(10000) });
  return res.json();
}

export async function forgeosProviders() {
  const res = await fetch('/api/forgeos-ai/providers', { signal: AbortSignal.timeout(15000) });
  return res.json();
}
