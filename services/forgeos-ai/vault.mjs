// ForgeOS AI — Credential Vault
// Portable: loads from ./secrets/*.env or environment variables
// NEVER exposes values, NEVER logs values, NEVER returns values via API

import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync, chmodSync, unlinkSync } from 'fs';
import { join } from 'path';

const SECRETS_DIR = process.env.FORGEOS_SECRETS_DIR || join(process.cwd(), 'secrets');

/** Provider IDs are restricted to prevent path traversal via the secrets dir. */
function sanitizeProviderId(providerId) {
  if (typeof providerId !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(providerId)) {
    throw new Error('Invalid provider id (use lowercase letters, numbers, dashes)');
  }
  return providerId;
}

class Vault {
  constructor() {
    this.cache = new Map();
  }

  loadEnvFile(providerId) {
    const filePath = join(SECRETS_DIR, `${providerId}.env`);
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
            if (val) return val;
          }
        }
      } catch { /* fall through */ }
    }
    const envKey = `FORGEOS_${providerId.toUpperCase().replace(/-/g, '_')}_KEY`;
    return process.env[envKey] || null;
  }

  /** Returns true if a credential exists. NEVER returns the value. */
  has(providerId) {
    if (this.cache.has(providerId)) return true;
    const val = this.loadEnvFile(providerId);
    if (val) {
      this.cache.set(providerId, val);
      return true;
    }
    return false;
  }

  /** Internal use only — for outbound requests. NEVER expose via API. */
  getInternal(providerId) {
    if (this.cache.has(providerId)) return this.cache.get(providerId);
    const val = this.loadEnvFile(providerId);
    if (val) this.cache.set(providerId, val);
    return val;
  }

  /** Public status — metadata only, no values. */
  status(providerId) {
    const has = this.has(providerId);
    return {
      has,
      source: has ? 'configured' : 'none',
    };
  }

  /**
   * Store a provider credential persistently (admin-only callers).
   * Writes secrets/<providerId>.env with 0600 permissions and clears the cache
   * so the new value takes effect immediately — no restart required.
   * NEVER logs or returns the value.
   */
  setProviderKey(providerId, value) {
    const id = sanitizeProviderId(providerId);
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error('Credential must be a non-empty string');
    }
    if (value.length > 4096) {
      throw new Error('Credential too long');
    }
    const trimmed = value.trim();
    if (/[\r\n]/.test(trimmed)) {
      throw new Error('Credential must not contain line breaks');
    }
    mkdirSync(SECRETS_DIR, { recursive: true });
    const filePath = join(SECRETS_DIR, `${id}.env`);
    const envKey = `FORGEOS_${id.toUpperCase().replace(/-/g, '_')}_KEY`;
    writeFileSync(filePath, `# ForgeOS AI provider credential — managed via provider hub\n${envKey}=${trimmed}\n`, { mode: 0o600 });
    try { chmodSync(filePath, 0o600); } catch { /* best effort */ }
    this.cache.delete(id);
    return true;
  }

  /**
   * Remove a provider credential file (admin-only callers).
   * Falls back to "not configured" if the credential came from env vars.
   */
  removeProviderKey(providerId) {
    const id = sanitizeProviderId(providerId);
    const filePath = join(SECRETS_DIR, `${id}.env`);
    this.cache.delete(id);
    if (existsSync(filePath)) {
      // Overwrite before unlink to avoid leaving the secret on disk.
      try { writeFileSync(filePath, '# revoked\n'); } catch { /* best effort */ }
      try { unlinkSync(filePath); } catch { /* already gone */ }
      return { removed: true, source: 'file' };
    }
    return { removed: false, source: 'none' };
  }

  clearCache(providerId) {
    if (providerId) this.cache.delete(providerId);
    else this.cache.clear();
  }
}

export const vault = new Vault();
