// ForgeOS AI — Provider Abstraction & Pool (Production-Hardened)
// Fault-tolerant: circuit breaker, retry with limits, capability-aware routing,
// automatic recovery, transparent routing evidence.
// State vocabulary: NEEDS_CONFIGURATION | VERIFYING | CONNECTED | DEGRADED | OFFLINE | TIMEOUT
// Circuit states: CLOSED (normal) | OPEN (failing, skip) | HALF_OPEN (testing recovery)

import { vault } from './vault.mjs';

const OLLAMA_BASE = process.env.OLLAMA_ENDPOINT || 'http://127.0.0.1:11434';

// Capability taxonomy — every provider declares what it can do
export const CAPABILITIES = {
  CHAT: 'chat',           // General chat/reasoning
  CODING: 'coding',       // Code generation, debugging
  FAST: 'fast',           // Fast/lightweight tasks
  EMBEDDINGS: 'embeddings', // Text embeddings
  VISION: 'vision',       // Image understanding
  AUDIO: 'audio',         // Audio transcription/generation
};

// Built-in provider definitions (configs only — credentials via vault)
const BUILT_IN_PROVIDERS = [
  {
    id: 'ollama',
    label: 'Ollama (Local)',
    baseUrl: `${OLLAMA_BASE}/v1`,
    requiresKey: false,
    local: true,
    priority: 100, // Last resort fallback
    timeout: 90000,
    capabilities: [CAPABILITIES.CHAT, CAPABILITIES.CODING, CAPABILITIES.FAST, CAPABILITIES.EMBEDDINGS],
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    requiresKey: true,
    priority: 10,
    timeout: 120000,
    capabilities: [CAPABILITIES.CHAT, CAPABILITIES.CODING, CAPABILITIES.FAST, CAPABILITIES.VISION],
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    requiresKey: true,
    priority: 15, // Primary cloud backend (free tier)
    timeout: 120000,
    capabilities: [CAPABILITIES.CHAT, CAPABILITIES.CODING, CAPABILITIES.FAST, CAPABILITIES.VISION],
    nativeGemini: true,
  },
  {
    id: 'omniroute',
    label: 'OmniRoute',
    baseUrl: process.env.OMNIROUTE_BASE || 'http://127.0.0.1:20128/v1',
    requiresKey: false,
    priority: 20,
    timeout: 120000,
    capabilities: [CAPABILITIES.CHAT, CAPABILITIES.CODING, CAPABILITIES.FAST, CAPABILITIES.EMBEDDINGS],
  },
];

export const ProviderState = {
  NEEDS_CONFIGURATION: 'NEEDS_CONFIGURATION',
  VERIFYING: 'VERIFYING',
  CONNECTED: 'CONNECTED',
  DEGRADED: 'DEGRADED',
  OFFLINE: 'OFFLINE',
  TIMEOUT: 'TIMEOUT',
};

// Circuit breaker config
const CIRCUIT = {
  FAILURE_THRESHOLD: 3,      // Open after 3 consecutive failures
  SUCCESS_THRESHOLD: 2,      // Close after 2 consecutive successes in half-open
  OPEN_TIMEOUT_MS: 60000,    // Try half-open after 60s
  MAX_RETRIES: 2,            // Retry failed requests up to 2 times
  RETRY_BASE_MS: 1000,       // Exponential backoff base
};

class Provider {
  constructor(def) {
    this.id = def.id;
    this.label = def.label;
    this.baseUrl = def.baseUrl;
    this.requiresKey = def.requiresKey;
    this.local = !!def.local;
    this.priority = def.priority;
    this.timeout = def.timeout || 60000;
    this.capabilities = def.capabilities || [CAPABILITIES.CHAT];
    // Health state
    this.state = ProviderState.NEEDS_CONFIGURATION;
    this.lastCheck = null;
    this.lastLatency = null;
    this.lastError = null;
    this.modelCount = 0;
    // Circuit breaker state
    this.circuit = 'CLOSED';
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.circuitOpenedAt = null;
    // Stats
    this.totalRequests = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
  }

  isConfigured() {
    if (!this.requiresKey) return true;
    return vault.has(this.id);
  }

  supports(capability) {
    return this.capabilities.includes(capability);
  }

  /** Circuit breaker: should we attempt this provider? */
  async geminiChat(messages, options = {}) {
    // Use Gemini default unless caller specifies a valid Gemini model.
    // Ignores Ollama-specific defaults (e.g., llama3.2:1b) injected by the route.
    const model = (options.model && options.model.startsWith('gemini-'))
      ? options.model
      : 'gemini-2.5-flash';
    const key = vault.getInternal(this.id);
    const contents = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const sys = messages.find(m => m.role === 'system');
    const body = { contents };
    if (sys) body.systemInstruction = { parts: [{ text: sys.content }] };
    const url = `${this.baseUrl}/models/${model}:generateContent`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(options.timeout || this.timeout),
    });
    if (!res.ok) throw new Error(`${this.label}: HTTP ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    this.recordSuccess(0);
    return {
      id: `gemini-${Date.now()}`, object: 'chat.completion',
      created: Math.floor(Date.now()/1000), model,
      choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  }

  circuitAllows() {
    if (this.circuit === 'CLOSED') return true;
    if (this.circuit === 'OPEN') {
      // Check if enough time passed to try half-open
      if (Date.now() - this.circuitOpenedAt > CIRCUIT.OPEN_TIMEOUT_MS) {
        this.circuit = 'HALF_OPEN';
        this.consecutiveSuccesses = 0;
        return true;
      }
      return false;
    }
    return true; // HALF_OPEN allows one test request
  }

  recordSuccess(latencyMs) {
    this.totalRequests++;
    this.successfulRequests++;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses++;
    this.lastLatency = latencyMs;

    if (this.circuit === 'HALF_OPEN' && this.consecutiveSuccesses >= CIRCUIT.SUCCESS_THRESHOLD) {
      this.circuit = 'CLOSED';
      this.state = ProviderState.CONNECTED;
      this.lastError = null;
    } else if (this.circuit === 'CLOSED' && this.state !== ProviderState.CONNECTED) {
      // Gradual recovery
      if (this.state === ProviderState.DEGRADED || this.state === ProviderState.OFFLINE) {
        this.state = ProviderState.CONNECTED;
        this.lastError = null;
      }
    }
  }

  recordFailure(errorMsg) {
    this.totalRequests++;
    this.failedRequests++;
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    this.lastError = errorMsg?.slice(0, 120) || 'Unknown error';

    if (this.circuit === 'HALF_OPEN') {
      // Failed during recovery test — reopen
      this.circuit = 'OPEN';
      this.circuitOpenedAt = Date.now();
      this.state = ProviderState.OFFLINE;
    } else if (this.consecutiveFailures >= CIRCUIT.FAILURE_THRESHOLD) {
      this.circuit = 'OPEN';
      this.circuitOpenedAt = Date.now();
      this.state = ProviderState.OFFLINE;
    } else if (this.state === ProviderState.CONNECTED) {
      this.state = ProviderState.DEGRADED;
    }
  }

  async healthCheck() {
    this.state = ProviderState.VERIFYING;
    const start = Date.now();

    if (this.requiresKey && !vault.has(this.id)) {
      this.state = ProviderState.NEEDS_CONFIGURATION;
      this.lastError = 'No credential configured';
      return this.publicStatus();
    }

    // Don't probe if circuit is open (but allow half-open test)
    if (!this.circuitAllows() && this.circuit === 'OPEN') {
      this.state = ProviderState.OFFLINE;
      this.lastError = 'Circuit breaker open — skipping probe';
      return this.publicStatus();
    }

    try {
      const headers = {};
      if (this.requiresKey) {
        headers['Authorization'] = `Bearer ${vault.getInternal(this.id)}`;
      }
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(`${this.baseUrl}/models`, { headers, signal: ctrl.signal });
      clearTimeout(timer);
      const latency = Date.now() - start;
      this.lastCheck = new Date().toISOString();

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        this.modelCount = data.data?.length || 0;
        this.recordSuccess(latency);
        if (this.circuit === 'CLOSED') {
          this.state = ProviderState.CONNECTED;
          this.lastError = null;
        }
      } else if (res.status === 401 || res.status === 403) {
        this.state = ProviderState.NEEDS_CONFIGURATION;
        this.lastError = `Authentication failed (${res.status}) — check credential`;
        this.recordFailure(this.lastError);
      } else {
        this.recordFailure(`HTTP ${res.status}`);
      }
    } catch (e) {
      const latency = Date.now() - start;
      this.lastCheck = new Date().toISOString();
      if (e.name === 'AbortError') {
        this.state = ProviderState.TIMEOUT;
        this.recordFailure('Connection timeout (15s)');
      } else {
        this.recordFailure(e.message);
        if (this.circuit !== 'OPEN') this.state = ProviderState.OFFLINE;
      }
    }
    return this.publicStatus();
  }

  /** Public status — NEVER includes credentials. */
  publicStatus() {
    return {
      id: this.id,
      label: this.label,
      state: this.state,
      circuit: this.circuit,
      local: this.local,
      configured: this.isConfigured(),
      capabilities: this.capabilities,
      lastCheck: this.lastCheck,
      latencyMs: this.lastLatency,
      modelCount: this.modelCount,
      error: this.lastError,
      stats: {
        total: this.totalRequests,
        success: this.successfulRequests,
        failed: this.failedRequests,
        consecutiveFailures: this.consecutiveFailures,
      },
    };
  }

  /** Chat with retry and exponential backoff. */
  async chat(messages, options = {}) {
    if (this.nativeGemini) return this.geminiChat(messages, options);
    if (this.requiresKey && !vault.has(this.id)) {
      throw new Error(`${this.label}: NEEDS_CONFIGURATION — no credential`);
    }
    if (!this.circuitAllows()) {
      throw new Error(`${this.label}: circuit breaker OPEN — skipping`);
    }

    const headers = { 'Content-Type': 'application/json' };
    if (this.requiresKey) {
      headers['Authorization'] = `Bearer ${vault.getInternal(this.id)}`;
    }

    let lastError;
    const maxAttempts = 1 + (options.retries ?? CIRCUIT.MAX_RETRIES);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) {
        // Exponential backoff: 1s, 2s
        await new Promise(r => setTimeout(r, CIRCUIT.RETRY_BASE_MS * Math.pow(2, attempt - 1)));
      }
      const start = Date.now();
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), options.timeout || this.timeout);
      try {
        const res = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers,
          signal: ctrl.signal,
          body: JSON.stringify({
            model: (() => {
              const m = options.model;
              // OpenRouter requires valid model IDs; use free tier default for Ollama/generic models
              if (!m || m === 'default' || m.includes(':1b') || m.startsWith('llama')) {
                return 'meta-llama/llama-3.1-8b-instruct:free';
              }
              return m;
            })(),
            messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens,
            stream: false,
          }),
        });
        clearTimeout(timer);
        const latency = Date.now() - start;

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            // Auth failure — don't retry, mark needs configuration
            const err = new Error(`${this.label}: authentication failed (${res.status})`);
            this.recordFailure(err.message);
            this.state = ProviderState.NEEDS_CONFIGURATION;
            throw err;
          }
          throw new Error(`${this.label}: HTTP ${res.status}`);
        }
        const data = await res.json();
        this.recordSuccess(latency);
        return { data, latencyMs: latency, attempts: attempt + 1 };
      } catch (e) {
        clearTimeout(timer);
        lastError = e;
        // Don't retry auth failures
        if (e.message.includes('authentication failed')) throw e;
        // Don't retry circuit-open
        if (e.message.includes('circuit breaker')) throw e;
      }
    }
    this.recordFailure(lastError.message);
    throw lastError;
  }
}

// Routing evidence ring buffer (last 100 decisions, no credentials)
const EVIDENCE_LIMIT = 100;
const routingEvidence = [];

function recordEvidence(entry) {
  routingEvidence.unshift({
    ...entry,
    timestamp: new Date().toISOString(),
    // NEVER: apiKey, credential, token, Authorization header
  });
  if (routingEvidence.length > EVIDENCE_LIMIT) routingEvidence.pop();
}

class ProviderPool {
  constructor() {
    this.providers = new Map();
    this.customProviders = new Map();
    for (const def of BUILT_IN_PROVIDERS) {
      this.providers.set(def.id, new Provider(def));
    }
    this.healthCheckInterval = null;
  }

  addCustomProvider({ id, label, baseUrl, requiresKey = true, priority = 50, capabilities, timeout }) {
    if (this.providers.has(id)) {
      throw new Error(`Provider '${id}' already registered`);
    }
    const provider = new Provider({
      id, label, baseUrl, requiresKey, priority,
      timeout: timeout || 120000,
      capabilities: capabilities || [CAPABILITIES.CHAT],
    });
    this.providers.set(id, provider);
    this.customProviders.set(id, provider);
    return provider.publicStatus();
  }

  removeCustomProvider(id) {
    if (!this.customProviders.has(id)) throw new Error(`'${id}' is not a custom provider`);
    this.customProviders.delete(id);
    this.providers.delete(id);
  }

  get(id) {
    return this.providers.get(id);
  }

  sorted() {
    return [...this.providers.values()].sort((a, b) => a.priority - b.priority);
  }

  /** Routing-eligible: configured, supports capability, circuit allows.
   * Cold-start fix: a provider that isConfigured() is eligible on first use
   * even while its runtime state is still NEEDS_CONFIGURATION (lastCheck === null).
   * The state check only excludes providers that were actually checked and found
   * to need configuration. This makes serverless cold starts work correctly. */
  eligible(capability = CAPABILITIES.CHAT) {
    return this.sorted().filter(p =>
      p.isConfigured() &&
      p.supports(capability) &&
      p.circuitAllows() &&
      (p.state !== ProviderState.NEEDS_CONFIGURATION || p.lastCheck === null)
    );
  }

  async checkAll() {
    const results = [];
    for (const p of this.sorted()) {
      results.push(await p.healthCheck());
    }
    return results;
  }

  /** Start continuous lightweight health monitoring. */
  startHealthMonitoring(intervalMs = 60000) {
    if (this.healthCheckInterval) return;
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkAll();
      } catch (e) {
        console.error('Health monitor error:', e.message);
      }
    }, intervalMs);
    // Don't keep process alive just for monitoring
    if (this.healthCheckInterval.unref) this.healthCheckInterval.unref();
  }

  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Capability-aware routing with graceful fallback.
   * NEVER fabricates. Returns honest 503 if all fail.
   */
  async route(messages, options = {}) {
    const capability = options.capability || CAPABILITIES.CHAT;
    const startTime = Date.now();

    // Validate capability is supported by at least one configured provider
    const capableProviders = this.sorted().filter(p => p.isConfigured() && p.supports(capability));
    if (capableProviders.length === 0) {
      const err = new Error(`No provider supports capability '${capability}'`);
      err.statusCode = 400;
      err.details = { capability, availableCapabilities: [...new Set(this.sorted().flatMap(p => p.capabilities))] };
      recordEvidence({
        capability, selectedProvider: null, model: options.model || null,
        latencyMs: Date.now() - startTime, success: false,
        fallbackUsed: false, error: err.message,
      });
      throw err;
    }

    const preferred = options.provider ? [this.get(options.provider)].filter(Boolean) : [];
    const candidates = [
      ...preferred.filter(p => p.supports(capability)),
      ...this.eligible(capability).filter(p => !preferred.includes(p)),
    ];

    const errors = [];
    let fallbackUsed = false;

    for (let i = 0; i < candidates.length; i++) {
      const provider = candidates[i];
      if (i > 0) fallbackUsed = true;
      try {
        const { data, latencyMs, attempts } = await provider.chat(messages, options);
        const totalLatency = Date.now() - startTime;
        recordEvidence({
          capability,
          selectedProvider: provider.id,
          providerLabel: provider.label,
          model: options.model || 'default',
          latencyMs: totalLatency,
          providerLatencyMs: latencyMs,
          attempts,
          success: true,
          fallbackUsed,
          triedProviders: candidates.slice(0, i + 1).map(p => p.id),
        });
        return {
          provider: provider.id,
          label: provider.label,
          fallback: fallbackUsed,
          result: data,
          evidence: {
            capability, latencyMs: totalLatency,
            attempts, fallbackUsed,
          },
        };
      } catch (e) {
        errors.push({ provider: provider.id, error: e.message?.slice(0, 200) });
        // Continue to next provider — one failure never brings down ForgeOS
      }
    }

    // All providers failed — honest 503, never fabricated
    const totalLatency = Date.now() - startTime;
    recordEvidence({
      capability,
      selectedProvider: null,
      model: options.model || null,
      latencyMs: totalLatency,
      success: false,
      fallbackUsed: errors.length > 1,
      error: 'All providers unavailable',
      triedProviders: candidates.map(p => p.id),
    });
    const err = new Error('All providers unavailable');
    err.statusCode = 503;
    err.details = { errors, capability, triedProviders: candidates.map(p => p.id) };
    throw err;
  }

  /** Aggregate status: ONLINE / DEGRADED / OFFLINE */
  aggregateStatus() {
    const statuses = this.sorted().map(p => p.publicStatus());
    const connected = statuses.filter(s => s.state === ProviderState.CONNECTED).length;
    const configured = statuses.filter(s => s.configured).length;

    let aggregate;
    if (connected > 0) aggregate = 'ONLINE';
    else if (configured > 0) aggregate = 'DEGRADED';
    else aggregate = 'OFFLINE';

    return { aggregate, connected, configured, total: statuses.length, providers: statuses };
  }

  publicStatus() {
    return this.sorted().map(p => p.publicStatus());
  }

  getEvidence(limit = 20) {
    return routingEvidence.slice(0, limit);
  }

  clearEvidence() {
    routingEvidence.length = 0;
  }
}

export const pool = new ProviderPool();
export { CIRCUIT };
