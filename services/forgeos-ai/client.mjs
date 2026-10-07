// ForgeOS AI — Official Client Library
// THE ONLY WAY components consume intelligence. No direct provider calls.
// Used by: Muse, Ruflo, Workforce/Dots, OpenCode, Claude Code, Power Trails, all future agents.
//
// Usage:
//   import { forgeosAI } from './client.mjs';
//   const result = await forgeosAI.chat([
//     { role: 'user', content: 'Hello' }
//   ], { capability: 'chat' });

const GATEWAY_URL = process.env.FORGEOS_AI_ENDPOINT || 'http://127.0.0.1:8788';

export const Capabilities = {
  CHAT: 'chat',
  CODING: 'coding',
  FAST: 'fast',
  EMBEDDINGS: 'embeddings',
  VISION: 'vision',
  AUDIO: 'audio',
};

class ForgeOSAIClient {
  constructor(baseUrl = GATEWAY_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Request intelligence through ForgeOS AI.
   * The gateway handles provider selection, fallback, circuit breaking, and retries.
   * NEVER call providers directly.
   */
  async chat(messages, options = {}) {
    const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(options.timeout || 180000),
      body: JSON.stringify({
        messages,
        model: options.model,
        capability: options.capability || Capabilities.CHAT,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        provider: options.provider, // optional preferred provider
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(data.error || `ForgeOS AI error: ${res.status}`);
      err.statusCode = res.status;
      err.details = data.details;
      err.forgeos = data.forgeos;
      throw err;
    }

    return data;
  }

  /** Check gateway health. Returns ONLINE / DEGRADED / OFFLINE. */
  async health() {
    const res = await fetch(`${this.baseUrl}/health`, {
      signal: AbortSignal.timeout(10000),
    });
    return res.json();
  }

  /** Get provider statuses. NEVER includes credentials. */
  async providers() {
    const res = await fetch(`${this.baseUrl}/providers`, {
      signal: AbortSignal.timeout(15000),
    });
    return res.json();
  }

  /** Get recent routing evidence. */
  async routingEvidence(limit = 20) {
    const res = await fetch(`${this.baseUrl}/routing/evidence?limit=${limit}`, {
      signal: AbortSignal.timeout(10000),
    });
    return res.json();
  }

  /** List supported capabilities. */
  async capabilities() {
    const res = await fetch(`${this.baseUrl}/capabilities`, {
      signal: AbortSignal.timeout(10000),
    });
    return res.json();
  }
}

// Singleton — all components share this client
export const forgeosAI = new ForgeOSAIClient();

// Factory for custom gateway URLs (testing, multi-instance)
export function createClient(baseUrl) {
  return new ForgeOSAIClient(baseUrl);
}
