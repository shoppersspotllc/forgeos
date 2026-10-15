// ForgeOS AI — Canonical Model Gateway (Production-Hardened)
// USER → MUSE → RUFLO → CAPABILITY REGISTRY → FORGEOS AI → provider → DOT/WORKER
//
// Single provider abstraction. Capability-aware routing. Circuit breaker.
// Graceful fallback. Transparent routing evidence. NEVER fabricates.
// Portable: all config via env vars, no hardcoded paths or credentials.

import { createServer } from 'http';
import { pool, ProviderState, CAPABILITIES } from './providers.mjs';
import { vault } from './vault.mjs';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, chmodSync } from 'fs';
import { join } from 'path';

// --- ForgeOS-native service authentication (approved security addition) ---
// Platforms/Dots present: Authorization: Bearer fk_...
// Validated against FORGEOS_SERVICE_KEYS env var (JSON: keyId -> {hash, name, revoked}).
// Provider credentials remain server-side. This changes NOTHING about routing.
const SERVICE_KEYS_FILE =
  process.env.FORGEOS_SERVICE_KEYS_FILE ||
  join(process.env.FORGEOS_SECRETS_DIR || join(process.cwd(), 'secrets'), 'service-keys.json');

function loadServiceKeyRegistry() {
  let registry = {};
  // 1. Env var (takes precedence)
  try {
    if (process.env.FORGEOS_SERVICE_KEYS) registry = { ...registry, ...JSON.parse(process.env.FORGEOS_SERVICE_KEYS) };
  } catch { /* ignore malformed env */ }
  // 2. Local file (persistent, managed via /admin/keys)
  try {
    if (existsSync(SERVICE_KEYS_FILE)) {
      registry = { ...registry, ...JSON.parse(readFileSync(SERVICE_KEYS_FILE, 'utf-8')) };
    }
  } catch { /* no file registry */ }
  return registry;
}

function saveServiceKeyRegistry(registry) {
  mkdirSync(join(SERVICE_KEYS_FILE, '..'), { recursive: true });
  writeFileSync(SERVICE_KEYS_FILE, JSON.stringify(registry, null, 2), { mode: 0o600 });
  try { chmodSync(SERVICE_KEYS_FILE, 0o600); } catch { /* best effort */ }
}

function validateServiceCredential(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') return { valid: false, reason: 'missing_credential' };
  const m = authHeader.match(/^Bearer\s+(fk_[a-f0-9]{64})$/i);
  if (!m) return { valid: false, reason: 'invalid_format' };
  const presentedHash = createHash('sha256').update(m[1]).digest('hex');
  const registry = loadServiceKeyRegistry();
  for (const [keyId, meta] of Object.entries(registry)) {
    const storedHash = typeof meta === 'string' ? meta : meta.hash;
    if (storedHash && storedHash.length === presentedHash.length) {
      try {
        if (timingSafeEqual(Buffer.from(storedHash, 'utf8'), Buffer.from(presentedHash, 'utf8'))) {
          const metaObj = typeof meta === 'string' ? { name: keyId } : meta;
          if (metaObj.revoked) return { valid: false, reason: 'revoked', keyId };
          if (metaObj.expiresAt) {
            const t = new Date(metaObj.expiresAt).getTime();
            if (!isNaN(t) && Date.now() > t) return { valid: false, reason: 'expired', keyId };
          }
          return { valid: true, keyId, name: metaObj.name };
        }
      } catch { /* compare failed */ }
    }
  }
  return { valid: false, reason: 'invalid_credential' };
}
// --- End authentication ---

// --- Gateway admin authentication (provider hub management) ---
// Management endpoints (/admin/*) require FORGEOS_GATEWAY_ADMIN_TOKEN.
// The token NEVER leaves the server: dashboard proxies it server-side.
function checkGatewayAdmin(req) {
  const adminToken = process.env.FORGEOS_GATEWAY_ADMIN_TOKEN;
  if (!adminToken) return false;
  const header = req.headers['authorization'] || '';
  const expected = `Bearer ${adminToken}`;
  if (header.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(header, 'utf8'), Buffer.from(expected, 'utf8'));
  } catch {
    return false;
  }
}

// Service key issuance.
// NOTE: key format must stay in sync with apps/dashboard/src/lib/forgeos-ai/service-keys.mjs
// (fk_ + 32 random bytes hex; keyId = sha256(key)[0:16]; stored value = sha256(key) hex).
function issueServiceKey(name) {
  const key = 'fk_' + randomBytes(32).toString('hex');
  const keyId = createHash('sha256').update(key).digest('hex').slice(0, 16);
  const hash = createHash('sha256').update(key).digest('hex');
  return {
    key, // PLAINTEXT — returned ONCE to the admin caller, never stored
    keyId,
    entry: {
      hash,
      name: (name || 'unnamed-service').toString().slice(0, 100),
      created: new Date().toISOString(),
      expiresAt: null,
      revoked: false,
      lastUsed: null,
    },
  };
}

/** Admin key metadata — NEVER hashes or values. */
function listServiceKeysMeta() {
  const registry = loadServiceKeyRegistry();
  return Object.entries(registry).map(([keyId, meta]) => {
    const m = typeof meta === 'string' ? {} : meta;
    return {
      keyId,
      name: m.name || keyId,
      created: m.created || null,
      expiresAt: m.expiresAt || null,
      revoked: !!m.revoked,
      lastUsed: m.lastUsed || null,
    };
  });
}
// --- End admin ---

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

    // --- Provider hub management (admin only) ---
    // All /admin/* routes require FORGEOS_GATEWAY_ADMIN_TOKEN.
    if (path.startsWith('/admin/')) {
      if (!process.env.FORGEOS_GATEWAY_ADMIN_TOKEN) {
        return json(res, 503, { error: 'Gateway admin is not configured (FORGEOS_GATEWAY_ADMIN_TOKEN unset)' });
      }
      if (!checkGatewayAdmin(req)) {
        return json(res, 403, { error: 'Admin authentication required' });
      }
      const seg = path.split('/').filter(Boolean); // ['admin', 'providers', ':id', 'credential']

      // GET /admin/providers — full provider inventory (metadata only, never credentials)
      if (seg[1] === 'providers' && seg.length === 2 && req.method === 'GET') {
        return json(res, 200, { providers: pool.publicStatus(), timestamp: new Date().toISOString() });
      }

      // POST /admin/providers/:id/credential {credential} — store provider key (persistent file, 0600)
      if (seg[1] === 'providers' && seg[3] === 'credential' && req.method === 'POST') {
        const provider = pool.get(seg[2]);
        if (!provider) return json(res, 404, { error: `Unknown provider '${seg[2]}'` });
        const body = await readBody(req);
        try {
          vault.setProviderKey(seg[2], body.credential);
        } catch (e) {
          return json(res, 400, { error: e.message });
        }
        return json(res, 200, { id: seg[2], configured: true });
      }

      // DELETE /admin/providers/:id/credential — remove stored file credential
      if (seg[1] === 'providers' && seg[3] === 'credential' && req.method === 'DELETE') {
        const provider = pool.get(seg[2]);
        if (!provider) return json(res, 404, { error: `Unknown provider '${seg[2]}'` });
        const result = vault.removeProviderKey(seg[2]);
        return json(res, 200, { id: seg[2], ...result });
      }

      // POST /admin/providers/:id/test — real authenticated validation (hits provider /models)
      if (seg[1] === 'providers' && seg[3] === 'test' && req.method === 'POST') {
        const provider = pool.get(seg[2]);
        if (!provider) return json(res, 404, { error: `Unknown provider '${seg[2]}'` });
        const status = await provider.healthCheck();
        return json(res, 200, { provider: status });
      }

      // POST /admin/providers/:id/enable | /disable
      if (seg[1] === 'providers' && (seg[3] === 'enable' || seg[3] === 'disable') && req.method === 'POST') {
        const provider = pool.get(seg[2]);
        if (!provider) return json(res, 404, { error: `Unknown provider '${seg[2]}'` });
        const enabled = provider.setEnabled(seg[3] === 'enable');
        return json(res, 200, { id: seg[2], enabled });
      }

      // GET /admin/keys — key metadata (never hashes or values)
      if (seg[1] === 'keys' && seg.length === 2 && req.method === 'GET') {
        return json(res, 200, { keys: listServiceKeysMeta(), timestamp: new Date().toISOString() });
      }

      // POST /admin/keys {name} — issue a service key, persist hash locally, show plaintext ONCE
      if (seg[1] === 'keys' && seg.length === 2 && req.method === 'POST') {
        const body = await readBody(req);
        const issued = issueServiceKey(body.name);
        const registry = loadServiceKeyRegistry();
        registry[issued.keyId] = issued.entry;
        saveServiceKeyRegistry(registry);
        return json(res, 201, {
          key: issued.key, // SHOW ONCE — hand to the consumer, then it cannot be retrieved again
          keyId: issued.keyId,
          name: issued.entry.name,
          created: issued.entry.created,
        });
      }

      // POST /admin/keys/:keyId/revoke
      if (seg[1] === 'keys' && seg[3] === 'revoke' && req.method === 'POST') {
        const registry = loadServiceKeyRegistry();
        const meta = registry[seg[2]];
        if (!meta) return json(res, 404, { error: `Unknown key '${seg[2]}'` });
        const metaObj = typeof meta === 'string' ? { hash: meta, name: seg[2] } : { ...meta };
        metaObj.revoked = true;
        registry[seg[2]] = metaObj; // file overlay wins over env entries
        saveServiceKeyRegistry(registry);
        return json(res, 200, { keyId: seg[2], revoked: true });
      }

      return json(res, 404, { error: 'Unknown admin endpoint' });
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
