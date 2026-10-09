// ForgeOS AI — Canonical Model Gateway (Production-Hardened)
// USER → MUSE → RUFLO → CAPABILITY REGISTRY → FORGEOS AI → provider → DOT/WORKER
//
// Single provider abstraction. Capability-aware routing. Circuit breaker.
// Graceful fallback. Transparent routing evidence. NEVER fabricates.
// Portable: all config via env vars, no hardcoded paths or credentials.

import { createServer } from 'http';
import { pool, ProviderState, CAPABILITIES } from './providers.mjs';
import { createHash } from 'crypto';

// --- ForgeOS-native service authentication (approved security addition) ---
// Platforms/Dots present: Authorization: Bearer fk_...
// Validated against FORGEOS_SERVICE_KEYS env var (JSON: keyId -> {hash, name, revoked}).
// Provider credentials remain server-side. This changes NOTHING about routing.
function validateServiceCredential(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') return { valid: false, reason: 'missing_credential' };
  const m = authHeader.match(/^Bearer\s+(fk_[a-f0-9]{64})$/i);
  if (!m) return { valid: false, reason: 'invalid_format' };
  const presentedHash = createHash('sha256').update(m[1]).digest('hex');
  let registry = {};
  try {
    if (process.env.FORGEOS_SERVICE_KEYS) registry = JSON.parse(process.env.FORGEOS_SERVICE_KEYS);
  } catch { /* no registry */ }
  for (const [keyId, meta] of Object.entries(registry)) {
    if (meta.hash === presentedHash) {
      if (meta.revoked) return { valid: false, reason: 'revoked', keyId };
      return { valid: true, keyId, name: meta.name };
    }
  }
  return { valid: false, reason: 'invalid_credential' };
}
// --- End authentication ---

const PORT = parseInt(process.env.FORGEOS_AI_PORT || '8788', 10);
const HOST = process.env.FORGEOS_AI_HOST || '127.0.0.1';
const HEALTH_INTERVAL_MS = parseInt(process.env.FORGEOS_AI_HEALTH_INTERVAL || '60000', 10);

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 1024 * 1024) req.destroy(); });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    // --- Health: aggregate ONLINE / DEGRADED / OFFLINE ---
    if (path === '/health' && req.method === 'GET') {
      const agg = pool.aggregateStatus();
      return json(res, 200, {
        service: 'forgeos-ai',
        version: '2.0.0',
        status: agg.aggregate,
        providers: agg.total,
        connected: agg.connected,
        configured: agg.configured,
        timestamp: new Date().toISOString(),
      });
    }

    // --- Provider status: metadata only, NEVER credentials ---
    if (path === '/providers' && req.method === 'GET') {
      const agg = pool.aggregateStatus();
      return json(res, 200, {
        status: agg.aggregate,
        providers: agg.providers,
        timestamp: new Date().toISOString(),
      });
    }

    // --- Trigger health checks ---
    if (path === '/providers/check' && req.method === 'POST') {
      const results = await pool.checkAll();
      const agg = pool.aggregateStatus();
      return json(res, 200, {
        status: agg.aggregate,
        providers: results,
        timestamp: new Date().toISOString(),
      });
    }

    // --- Routing evidence: transparent, no credentials ---
    if (path === '/routing/evidence' && req.method === 'GET') {
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
      return json(res, 200, {
        evidence: pool.getEvidence(limit),
        timestamp: new Date().toISOString(),
      });
    }

    // --- Capabilities: what the gateway can route ---
    if (path === '/capabilities' && req.method === 'GET') {
      return json(res, 200, {
        capabilities: Object.values(CAPABILITIES),
        providers: pool.sorted().map(p => ({
          id: p.id,
          capabilities: p.capabilities,
          state: p.state,
        })),
      });
    }

    // --- OpenAI-compatible chat: THE canonical intelligence endpoint ---
    if (path === '/v1/chat/completions' && req.method === 'POST') {
      const svcAuth = validateServiceCredential(req.headers['authorization']);
      if (!svcAuth.valid) {
        return json(res, 401, { error: 'ForgeOS service credential required', code: svcAuth.reason });
      }
      const body = await readBody(req);
      if (!body.messages || !Array.isArray(body.messages)) {
        return json(res, 400, { error: 'messages array required' });
      }
      // Validate capability if specified
      if (body.capability && !Object.values(CAPABILITIES).includes(body.capability)) {
        return json(res, 400, {
          error: `Unknown capability '${body.capability}'`,
          valid: Object.values(CAPABILITIES),
        });
      }
      try {
        const routed = await pool.route(body.messages, {
          model: body.model,
          provider: body.provider,
          capability: body.capability,
          temperature: body.temperature,
          maxTokens: body.max_tokens,
          timeout: body.timeout,
        });
        return json(res, 200, {
          ...routed.result,
          forgeos: {
            provider: routed.provider,
            label: routed.label,
            fallback: routed.fallback,
            capability: body.capability || CAPABILITIES.CHAT,
            routedAt: new Date().toISOString(),
            ...routed.evidence,
          },
        });
      } catch (e) {
        const status = e.statusCode || 500;
        return json(res, status, {
          error: e.message,
          details: e.details || undefined,
          forgeos: {
            routedAt: new Date().toISOString(),
            allProvidersFailed: status === 503,
          },
        });
      }
    }

    // --- Models list (metadata only) ---
    if (path === '/v1/models' && req.method === 'GET') {
      return json(res, 200, {
        data: pool.sorted().map(p => {
          const s = p.publicStatus();
          return {
            id: s.id, label: s.label, state: s.state,
            modelCount: s.modelCount, local: s.local,
            capabilities: s.capabilities,
          };
        }),
      });
    }

    // --- Register custom provider (no duplicates) ---
    if (path === '/providers/register' && req.method === 'POST') {
      const body = await readBody(req);
      if (!body.id || !body.baseUrl) {
        return json(res, 400, { error: 'id and baseUrl required' });
      }
      try {
        const status = pool.addCustomProvider(body);
        return json(res, 201, { provider: status });
      } catch (e) {
        return json(res, 409, { error: e.message });
      }
    }

    return json(res, 404, { error: 'Not found' });
  } catch (e) {
    return json(res, 500, { error: 'Internal error' });
  }
});

async function startupSelfTest() {
  console.log('ForgeOS AI — running startup self-test...');
  const results = await pool.checkAll();
  const agg = pool.aggregateStatus();

  console.log(`  Providers: ${agg.total}, Connected: ${agg.connected}, Configured: ${agg.configured}`);
  console.log(`  Aggregate status: ${agg.aggregate}`);
  for (const r of results) {
    console.log(`    ${r.id}: ${r.state}${r.error ? ` (${r.error.slice(0, 60)})` : ''}`);
  }

  // Self-test: verify routing fails honestly when nothing available
  if (agg.connected === 0) {
    try {
      await pool.route([{ role: 'user', content: 'self-test' }], { timeout: 5000 });
      console.log('  Self-test WARNING: routing succeeded with 0 connected providers');
    } catch (e) {
      if (e.statusCode === 503) {
        console.log('  Self-test PASS: honest 503 when no providers available');
      } else {
        console.log(`  Self-test: routing failed with ${e.statusCode} (expected 503)`);
      }
    }
  } else {
    console.log('  Self-test: providers connected, routing available');
  }

  // Verify no credentials leak in public status
  const leaked = JSON.stringify(agg.providers).match(/bearer|api[_-]?key|sk-|secret/i);
  if (leaked) {
    console.error('  Self-test FAIL: potential credential leak in public status!');
  } else {
    console.log('  Self-test PASS: no credentials in public status');
  }
}

server.listen(PORT, HOST, async () => {
  console.log(`ForgeOS AI gateway listening on ${HOST}:${PORT}`);
  await startupSelfTest();
  // Continuous lightweight health monitoring
  pool.startHealthMonitoring(HEALTH_INTERVAL_MS);
  console.log(`Health monitoring active (every ${HEALTH_INTERVAL_MS / 1000}s)`);
});

process.on('SIGTERM', () => {
  pool.stopHealthMonitoring();
  server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  pool.stopHealthMonitoring();
  server.close(() => process.exit(0));
});
