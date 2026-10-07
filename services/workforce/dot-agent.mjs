// ForgeOS Workforce — Dot Agent Adapter
// Dots consume intelligence EXCLUSIVELY through ForgeOS AI.
// NEVER call providers directly. NEVER bypass the gateway.
//
// Architecture: DOT → FORGEOS AI → provider → response
// The Dot requests a capability; ForgeOS AI handles routing, fallback, and retries.

import { forgeosAI, Capabilities } from '../forgeos-ai/client.mjs';

export class DotAgent {
  constructor({ id, name, role, defaultCapability = Capabilities.CHAT }) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.defaultCapability = defaultCapability;
  }

  /**
   * Request intelligence for a task.
   * @param {string} prompt - The task/prompt
   * @param {object} options - { capability, model, temperature, maxTokens }
   * @returns {object} - { content, provider, fallback, latencyMs }
   */
  async think(prompt, options = {}) {
    const messages = [
      {
        role: 'system',
        content: `You are ${this.name}, a ${this.role} in the ForgeOS AI workforce.`,
      },
      { role: 'user', content: prompt },
    ];

    try {
      const result = await forgeosAI.chat(messages, {
        capability: options.capability || this.defaultCapability,
        model: options.model,
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens,
      });

      return {
        content: result.choices?.[0]?.message?.content || '',
        provider: result.forgeos?.provider || 'unknown',
        fallback: result.forgeos?.fallback || false,
        latencyMs: result.forgeos?.latencyMs || 0,
        success: true,
      };
    } catch (e) {
      // Honest failure — never fabricate
      return {
        content: null,
        error: e.message,
        statusCode: e.statusCode || 500,
        success: false,
      };
    }
  }

  /** Specialized: coding tasks route to coding-capable providers. */
  async code(prompt, options = {}) {
    return this.think(prompt, { ...options, capability: Capabilities.CODING });
  }

  /** Specialized: fast lightweight tasks. */
  async quick(prompt, options = {}) {
    return this.think(prompt, { ...options, capability: Capabilities.FAST });
  }
}

// Example Dot definitions (workforce roster)
export const DOTS = [
  new DotAgent({ id: 'scout', name: 'Scout', role: 'Research Specialist' }),
  new DotAgent({ id: 'analyst', name: 'Analyst', role: 'Data Analyst' }),
  new DotAgent({ id: 'craftsman', name: 'Craftsman', role: 'Build Engineer', defaultCapability: Capabilities.CODING }),
  new DotAgent({ id: 'hunter', name: 'Hunter', role: 'Outreach Specialist' }),
  new DotAgent({ id: 'shepherd', name: 'Shepherd', role: 'Relationship Manager' }),
  new DotAgent({ id: 'closer', name: 'Closer', role: 'Deal Closer' }),
];
