// ForgeOS Service Keys — ForgeOS-native API authentication for platforms/Dots
//
// Platforms and Dots authenticate to ForgeOS AI using a ForgeOS-issued
// service credential (fk_...). They NEVER need provider keys (OpenRouter,
// Mistral, etc.) — ForgeOS AI owns provider credentials and routing.
//
// Storage: Vercel env var FORGEOS_SERVICE_KEYS (production, serverless-safe)
//          Local JSON file (gateway.mjs local dev, 0600 permissions)
// Format: JSON object mapping keyId -> { hash, name, created, revoked, lastUsed }
//         Only SHA-256 hashes are stored. Plaintext keys are shown once at issuance.
//
// Example FORGEOS_SERVICE_KEYS:
//   {"scout":{"hash":"abc123...","name":"Scout / God's Eye","created":"2026-10-08T...Z","revoked":false}}

import { createHash, randomBytes } from 'crypto';
import { readFileSync, writeFileSync, existsSync, chmodSync } from 'fs';
import { join } from 'path';

const KEY_PREFIX = 'fk_';
const KEY_BYTES = 32; // 64 hex chars

// Local file for gateway.mjs dev mode (NOT used on Vercel)
const SERVICE_KEYS_FILE =
  process.env.FORGEOS_SERVICE_KEYS_FILE ||
  join(process.cwd(), 'secrets', 'service-keys.json');

/**
 * Generate a new ForgeOS service key.
 * Returns { key, keyId, hash } — key is shown ONCE, only hash is stored.
 */
export function generateServiceKey(name) {
  const key = KEY_PREFIX + randomBytes(KEY_BYTES).toString('hex');
  const keyId = createHash('sha256').update(key).digest('hex').slice(0, 16);
  const hash = hashKey(key);
  return {
    key, // PLAINTEXT — show once, never store
    keyId,
    hash,
    name: name || 'unnamed',
    created: new Date().toISOString(),
    revoked: false,
    lastUsed: null,
  };
}

/** SHA-256 hash of a service key (for storage/comparison). */
export function hashKey(key) {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Load service key registry.
 * Production (Vercel): from FORGEOS_SERVICE_KEYS env var (JSON).
 * Local dev: from secrets/service-keys.json file (0600).
 */
function loadRegistry() {
  // 1. Environment variable (production, serverless-safe)
  const envJson = process.env.FORGEOS_SERVICE_KEYS;
  if (envJson) {
    try {
      return JSON.parse(envJson);
    } catch {
      // Fall through to file
    }
  }
  // 2. Local file (gateway.mjs dev mode)
  try {
    if (existsSync(SERVICE_KEYS_FILE)) {
      return JSON.parse(readFileSync(SERVICE_KEYS_FILE, 'utf-8'));
    }
  } catch {
    // No registry
  }
  return {};
}

/**
 * Validate a presented service key.
 * Returns { valid, keyId, name } or { valid: false, reason }.
 * NEVER returns the key value or hash.
 */
export function validateServiceKey(presentedKey) {
  if (!presentedKey || typeof presentedKey !== 'string') {
    return { valid: false, reason: 'missing_credential' };
  }
  if (!presentedKey.startsWith(KEY_PREFIX)) {
    return { valid: false, reason: 'invalid_format' };
  }
  const presentedHash = hashKey(presentedKey);
  const registry = loadRegistry();

  for (const [keyId, meta] of Object.entries(registry)) {
    if (meta.hash === presentedHash) {
      if (meta.revoked) {
        return { valid: false, reason: 'revoked', keyId, name: meta.name };
      }
      return { valid: true, keyId, name: meta.name };
    }
  }
  return { valid: false, reason: 'invalid_credential' };
}

/**
 * Extract Bearer token from Authorization header.
 * Returns the key string or null.
 */
export function extractBearerToken(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') return null;
  const match = authHeader.match(/^Bearer\s+(fk_[a-f0-9]{64})$/i);
  return match ? match[1] : null;
}

/**
 * Save a new service key to the local file registry (dev mode only).
 * Production uses Vercel env vars (set via dashboard, not at runtime).
 */
export function saveServiceKeyLocal(entry) {
  const registry = loadRegistry();
  registry[entry.keyId] = {
    hash: entry.hash,
    name: entry.name,
    created: entry.created,
    revoked: false,
    lastUsed: null,
  };
  try {
    const dir = join(SERVICE_KEYS_FILE, '..');
    writeFileSync(SERVICE_KEYS_FILE, JSON.stringify(registry, null, 2), { mode: 0o600 });
    try { chmodSync(SERVICE_KEYS_FILE, 0o600); } catch { /* best effort */ }
    return true;
  } catch {
    return false;
  }
}

/** Check if any service keys are configured (for health/status). */
export function hasServiceKeysConfigured() {
  const registry = loadRegistry();
  return Object.keys(registry).length > 0;
}

/** Get public metadata (no hashes) for admin listing. */
export function listServiceKeysMeta() {
  const registry = loadRegistry();
  return Object.entries(registry).map(([keyId, meta]) => ({
    keyId,
    name: meta.name,
    created: meta.created,
    revoked: !!meta.revoked,
    lastUsed: meta.lastUsed || null,
  }));
}
