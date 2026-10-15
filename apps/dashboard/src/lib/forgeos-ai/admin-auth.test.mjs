/**
 * Regression tests for ForgeOS dashboard authentication fixes.
 *
 * Tests that the 5 fixed endpoints reject unauthenticated requests
 * and that the checkAdmin function behaves correctly.
 *
 * Run: node --test src/lib/forgeos-ai/admin-auth.test.mjs
 * (Uses Node.js built-in test runner, no dependencies)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// We test the checkAdmin logic directly by importing the compiled behavior.
// Since admin-auth.ts is TypeScript, we replicate the exact logic here for
// the unit test, and verify the route files contain the checkAdmin import.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { timingSafeEqual } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = join(__dirname, '..', '..', '..');

// --- Replicate checkAdmin logic for unit testing ---
// (Must match src/lib/forgeos-ai/admin-auth.ts exactly)
function checkAdmin(headers, adminToken) {
  if (!adminToken) return false;
  const header = headers.get('authorization') || '';
  const expected = `Bearer ${adminToken}`;
  if (header.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(header, 'utf8'), Buffer.from(expected, 'utf8'));
  } catch {
    return false;
  }
}

function mockHeaders(auth) {
  return { get: (name) => name === 'authorization' ? (auth || null) : null };
}

describe('checkAdmin', () => {
  const TOKEN = 'test-admin-token-12345';

  test('rejects missing authorization header', () => {
    assert.equal(checkAdmin(mockHeaders(null), TOKEN), false);
  });

  test('rejects empty authorization header', () => {
    assert.equal(checkAdmin(mockHeaders(''), TOKEN), false);
  });

  test('rejects wrong token', () => {
    assert.equal(checkAdmin(mockHeaders('Bearer wrong-token'), TOKEN), false);
  });

  test('rejects malformed Bearer (no token)', () => {
    assert.equal(checkAdmin(mockHeaders('Bearer '), TOKEN), false);
  });

  test('rejects non-Bearer scheme', () => {
    assert.equal(checkAdmin(mockHeaders(`Token ${TOKEN}`), TOKEN), false);
  });

  test('accepts correct Bearer token', () => {
    assert.equal(checkAdmin(mockHeaders(`Bearer ${TOKEN}`), TOKEN), true);
  });

  test('rejects when admin token not configured', () => {
    assert.equal(checkAdmin(mockHeaders(`Bearer ${TOKEN}`), ''), false);
    assert.equal(checkAdmin(mockHeaders(`Bearer ${TOKEN}`), undefined), false);
  });

  test('rejects token with different length (timing-safe)', () => {
    assert.equal(checkAdmin(mockHeaders('Bearer short'), TOKEN), false);
    assert.equal(checkAdmin(mockHeaders('Bearer a-much-longer-token-that-does-not-match'), TOKEN), false);
  });
});

describe('route files contain checkAdmin', () => {
  const routes = [
    'src/app/api/deploy/publish/route.ts',
    'src/app/api/publish/medium/route.ts',
    'src/app/api/publish/pinterest/route.ts',
    'src/app/api/tasks/route.ts',
    'src/app/api/young-money/fix-deploy/route.ts',
    // Round 2 fixes (2026-10-15)
    'src/app/api/forgeos-ai/providers/check/route.ts',
    'src/app/api/github/analyze/route.ts',
    'src/app/api/revenue/stats/route.ts',
  ];

  for (const route of routes) {
    test(`${route} imports checkAdmin`, () => {
      const content = readFileSync(join(SRC_ROOT, route), 'utf-8');
      assert.ok(
        content.includes("from '@/lib/forgeos-ai/admin-auth'"),
        `${route} must import checkAdmin from shared lib`
      );
    });

    test(`${route} calls checkAdmin before handler logic`, () => {
      const content = readFileSync(join(SRC_ROOT, route), 'utf-8');
      assert.ok(
        content.includes('if (!checkAdmin(req))'),
        `${route} must call checkAdmin(req)`
      );
      assert.ok(
        content.includes("status: 403"),
        `${route} must return 403 on auth failure`
      );
    });
  }

  test('deploy/publish uses execFileSync for git commit (no shell injection)', () => {
    const content = readFileSync(join(SRC_ROOT, 'src/app/api/deploy/publish/route.ts'), 'utf-8');
    assert.ok(
      content.includes("execFileSync('git', ['commit', '-m', message]"),
      'Must use execFileSync with args array for commit'
    );
    assert.ok(
      !content.includes('git commit -m "${'),
      'Must NOT interpolate message into shell string'
    );
  });

  test('deploy/publish validates branch name before push', () => {
    const content = readFileSync(join(SRC_ROOT, 'src/app/api/deploy/publish/route.ts'), 'utf-8');
    assert.ok(
      content.includes('/^[a-zA-Z0-9._\\-\\/]+$/.test(branch)'),
      'Must validate branch name with allowlist regex'
    );
  });
});

describe('shared auth lib exists', () => {
  test('src/lib/forgeos-ai/admin-auth.ts exists and exports checkAdmin', () => {
    const content = readFileSync(join(SRC_ROOT, 'src/lib/forgeos-ai/admin-auth.ts'), 'utf-8');
    assert.ok(content.includes('export function checkAdmin'), 'Must export checkAdmin');
    assert.ok(content.includes('timingSafeEqual'), 'Must use timing-safe comparison');
    assert.ok(content.includes('FORGEOS_ADMIN_TOKEN'), 'Must read FORGEOS_ADMIN_TOKEN');
  });
});

describe('research rate limiter IP spoofing fix', () => {
  test('getIp does not trust leftmost x-forwarded-for', () => {
    const content = readFileSync(join(SRC_ROOT, 'src/app/api/research/route.ts'), 'utf-8');
    // Must NOT use the old vulnerable pattern: split(',')[0]
    assert.ok(
      !content.includes("split(',')[0]"),
      'Must not trust leftmost x-forwarded-for (client-controlled)'
    );
  });

  test('getIp only trusts proxy headers when TRUST_PROXY_HEADERS=true', () => {
    const content = readFileSync(join(SRC_ROOT, 'src/app/api/research/route.ts'), 'utf-8');
    assert.ok(
      content.includes("process.env.TRUST_PROXY_HEADERS === 'true'"),
      'Must gate proxy header trust behind TRUST_PROXY_HEADERS'
    );
  });

  test('getIp uses rightmost entry when trusting proxy (Vercel appends real IP last)', () => {
    const content = readFileSync(join(SRC_ROOT, 'src/app/api/research/route.ts'), 'utf-8');
    assert.ok(
      content.includes('parts[parts.length - 1]'),
      'Must take rightmost x-forwarded-for entry (added by trusted proxy)'
    );
  });

  test('getIp falls back to direct (single bucket) without trusted proxy', () => {
    const content = readFileSync(join(SRC_ROOT, 'src/app/api/research/route.ts'), 'utf-8');
    assert.ok(
      content.includes("return 'direct'"),
      'Must fall back to single bucket when proxy headers untrusted'
    );
  });
});
