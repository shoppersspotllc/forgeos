// Four-Dot E2E Test Runner — starts gateway, runs all four Dot tests
// Run: node run-four-dots.mjs
import { spawn } from 'child_process';
import { createHash, randomBytes } from 'crypto';
import { existsSync, mkdirSync } from 'fs';

const TEST_DIR = '/Users/dexter/forgeos-gateway-test/four-dots-work';
if (!existsSync(TEST_DIR)) mkdirSync(TEST_DIR, { recursive: true });

// Download bundles if needed
const needed = ['hunter-bundle.mjs', 'craftsman-bundle.mjs', 'closer-bundle.mjs', 'shepherd-bundle.mjs', 'test-four-dots.mjs', 'dot-agent.mjs'];
const missing = needed.filter(f => !existsSync(`${TEST_DIR}/${f}`));
if (missing.length) {
  console.log('Downloading dot bundles...');
  const dl = spawn('curl', ['-sL', 'https://muse.ai/files/1356944414174081/1892466265082225/u4f2owckd5zngdhzmvw68zcz/analyst-test.tar.gz', '-o', `${TEST_DIR}/bundle.tar.gz`]);
  await new Promise(r => dl.on('close', r));
  // analyst-test.tar.gz has analyst files; we need the four new ones — download separately
  console.log('NOTE: Four-dot bundles need manual placement. Place these in ' + TEST_DIR + ':');
  console.log('  hunter-bundle.mjs, craftsman-bundle.mjs, closer-bundle.mjs, shepherd-bundle.mjs, test-four-dots.mjs, dot-agent.mjs');
  process.exit(1);
}

const key = 'fk_' + randomBytes(32).toString('hex');
const hash = createHash('sha256').update(key).digest('hex');
const svcKeys = JSON.stringify({ 'four-dots-test': { hash, name: 'four-dots' } });

console.log('Starting gateway on 8791...');
const gw = spawn('node', ['gateway.mjs'], {
  cwd: '/Users/dexter/forgeos-gateway-test/gateway-test',
  env: { ...process.env, FORGEOS_AI_PORT: '8791', FORGEOS_SERVICE_KEYS: svcKeys },
  stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise(r => setTimeout(r, 2500));

console.log('Running four-dot E2E tests...\n');
const test = spawn('node', ['test-four-dots.mjs'], {
  cwd: TEST_DIR,
  env: { ...process.env, FORGEOS_AI_ENDPOINT: 'http://127.0.0.1:8791', FORGEOS_SERVICE_KEY: key },
  stdio: 'inherit',
});
const exitCode = await new Promise(r => test.on('close', r));
gw.kill();
console.log(`\nFour-dot E2E: ${exitCode === 0 ? 'ALL PASSED' : 'SOME FAILED'}`);
process.exit(exitCode);
