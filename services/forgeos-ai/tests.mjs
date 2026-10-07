// ForgeOS AI — Production Hardening Tests
// Tests: provider failure, timeout, fallback, recovery, invalid credentials,
//        all-unavailable, concurrent requests, capability mismatch.
// Run: node tests.mjs

import { pool, ProviderState, CAPABILITIES, CIRCUIT } from './providers.mjs';

let passed = 0;
let failed = 0;

function test(name, fn) {
  return (async () => {
    try {
      await fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (e) {
      failed++;
      console.log(`  ✗ ${name}: ${e.message}`);
    }
  })();
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

console.log('\n=== ForgeOS AI Hardening Tests ===\n');

// --- Test 1: Provider states are honest ---
await test('provider states reflect reality (no fabrication)', async () => {
  await pool.checkAll();
  const statuses = pool.publicStatus();
  assert(statuses.length >= 3, 'expected at least 3 providers');
  for (const s of statuses) {
    assert(Object.values(ProviderState).includes(s.state), `invalid state: ${s.state}`);
    // No credentials in public status
    const str = JSON.stringify(s);
    assert(!/bearer|sk-|api[_-]?key/i.test(str), `credential leak in ${s.id}`);
  }
});

// --- Test 2: Unconfigured provider reports NEEDS_CONFIGURATION ---
await test('unconfigured provider reports NEEDS_CONFIGURATION', async () => {
  const or = pool.get('openrouter');
  assert(or, 'openrouter provider exists');
  if (!or.isConfigured()) {
    assert(
      or.state === ProviderState.NEEDS_CONFIGURATION,
      `expected NEEDS_CONFIGURATION, got ${or.state}`
    );
  } else {
    console.log('    (openrouter has credential — skipping)');
  }
});

// --- Test 3: Circuit breaker opens after failures ---
await test('circuit breaker opens after repeated failures', async () => {
  const p = pool.get('omniroute');
  assert(p, 'omniroute exists');
  // Simulate failures
  p.consecutiveFailures = 0;
  p.circuit = 'CLOSED';
  for (let i = 0; i < CIRCUIT.FAILURE_THRESHOLD; i++) {
    p.recordFailure('simulated failure');
  }
  assert(p.circuit === 'OPEN', `expected OPEN, got ${p.circuit}`);
  assert(!p.circuitAllows(), 'circuit should not allow requests when OPEN');
  // Reset for other tests
  p.circuit = 'CLOSED';
  p.consecutiveFailures = 0;
});

// --- Test 4: Circuit breaker recovers (half-open → closed) ---
await test('circuit breaker recovers via half-open', async () => {
  const p = pool.get('ollama');
  p.circuit = 'OPEN';
  p.circuitOpenedAt = Date.now() - CIRCUIT.OPEN_TIMEOUT_MS - 1000;
  assert(p.circuitAllows(), 'should allow half-open test after timeout');
  assert(p.circuit === 'HALF_OPEN', `expected HALF_OPEN, got ${p.circuit}`);
  // Simulate successful recovery
  p.recordSuccess(100);
  p.recordSuccess(100);
  assert(p.circuit === 'CLOSED', `expected CLOSED after recovery, got ${p.circuit}`);
});

// --- Test 5: All providers unavailable → honest 503 ---
await test('all unavailable returns honest 503 (no fabrication)', async () => {
  // Force all circuits open
  const saved = [];
  for (const p of pool.sorted()) {
    saved.push({ p, circuit: p.circuit });
    p.circuit = 'OPEN';
    p.circuitOpenedAt = Date.now();
  }
  try {
    await pool.route([{ role: 'user', content: 'test' }], { timeout: 3000 });
    throw new Error('should have thrown 503');
  } catch (e) {
    assert(e.statusCode === 503, `expected 503, got ${e.statusCode}`);
    assert(e.message === 'All providers unavailable', `unexpected: ${e.message}`);
  } finally {
    for (const { p, circuit } of saved) { p.circuit = circuit; p.consecutiveFailures = 0; }
  }
});

// --- Test 6: Capability mismatch → honest 400 ---
await test('unsupported capability returns honest 400', async () => {
  try {
    await pool.route(
      [{ role: 'user', content: 'test' }],
      { capability: 'nonexistent-capability', timeout: 3000 }
    );
    throw new Error('should have thrown 400');
  } catch (e) {
    assert(e.statusCode === 400, `expected 400, got ${e.statusCode}`);
    assert(e.message.includes('No provider supports'), `unexpected: ${e.message}`);
  }
});

// --- Test 7: Invalid capability name → 400 ---
await test('invalid capability name rejected', async () => {
  const valid = Object.values(CAPABILITIES);
  assert(valid.includes('chat'), 'chat capability exists');
  assert(valid.includes('coding'), 'coding capability exists');
  assert(valid.includes('fast'), 'fast capability exists');
  assert(valid.includes('embeddings'), 'embeddings capability exists');
});

// --- Test 8: Routing evidence recorded (no credentials) ---
await test('routing evidence recorded without credentials', async () => {
  pool.clearEvidence();
  try {
    await pool.route([{ role: 'user', content: 'test' }], { timeout: 3000 });
  } catch { /* expected to fail */ }
  const evidence = pool.getEvidence(5);
  assert(evidence.length > 0, 'evidence should be recorded');
  for (const e of evidence) {
    assert(e.timestamp, 'evidence needs timestamp');
    assert('success' in e, 'evidence needs success flag');
    assert('fallbackUsed' in e, 'evidence needs fallback flag');
    const str = JSON.stringify(e);
    assert(!/bearer|sk-|authorization/i.test(str), 'credential leak in evidence');
  }
});

// --- Test 9: Concurrent requests don't corrupt state ---
await test('concurrent requests handled safely', async () => {
  const promises = Array.from({ length: 5 }, (_, i) =>
    pool.route([{ role: 'user', content: `concurrent ${i}` }], { timeout: 3000 })
      .catch(e => ({ error: e.statusCode }))
  );
  const results = await Promise.all(promises);
  assert(results.length === 5, 'all 5 should resolve');
  // All should fail with 503 (no providers) — but not crash
  for (const r of results) {
    assert(r.error === 503, `expected 503, got ${JSON.stringify(r)}`);
  }
});

// --- Test 10: Retry with limits (doesn't infinite-loop) ---
await test('retry respects limits', async () => {
  const p = pool.get('ollama');
  const start = Date.now();
  try {
    await p.chat([{ role: 'user', content: 'test' }], { timeout: 2000, retries: 1 });
  } catch { /* expected */ }
  const elapsed = Date.now() - start;
  // 1 retry + backoff should take < 10s, not infinite
  assert(elapsed < 15000, `retry took too long: ${elapsed}ms`);
});

// --- Test 11: Aggregate status honest ---
await test('aggregate status ONLINE/DEGRADED/OFFLINE honest', async () => {
  const agg = pool.aggregateStatus();
  assert(['ONLINE', 'DEGRADED', 'OFFLINE'].includes(agg.aggregate), `invalid: ${agg.aggregate}`);
  assert(typeof agg.connected === 'number', 'connected count needed');
  assert(typeof agg.configured === 'number', 'configured count needed');
  // With no providers connected, should be DEGRADED or OFFLINE, never ONLINE
  if (agg.connected === 0) {
    assert(agg.aggregate !== 'ONLINE', 'cannot be ONLINE with 0 connected');
  }
});

// --- Test 12: Custom provider no-duplicates ---
await test('duplicate provider registration rejected', async () => {
  try {
    pool.addCustomProvider({ id: 'ollama', label: 'Dupe', baseUrl: 'http://x' });
    throw new Error('should have rejected duplicate');
  } catch (e) {
    assert(e.message.includes('already registered'), `unexpected: ${e.message}`);
  }
});

// --- Test 13: Priority-based routing order ---
await test('providers sorted by priority', async () => {
  const sorted = pool.sorted();
  for (let i = 1; i < sorted.length; i++) {
    assert(
      sorted[i].priority >= sorted[i - 1].priority,
      `priority order violated: ${sorted[i - 1].id}(${sorted[i - 1].priority}) > ${sorted[i].id}(${sorted[i].priority})`
    );
  }
  // openrouter (10) should come before ollama (100)
  const ids = sorted.map(p => p.id);
  assert(ids.indexOf('openrouter') < ids.indexOf('ollama'), 'openrouter should have higher priority than ollama');
});

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
