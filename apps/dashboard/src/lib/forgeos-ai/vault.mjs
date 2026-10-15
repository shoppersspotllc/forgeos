// ForgeOS AI — Credential Vault
// Portable: loads from ./secrets/*.env or environment variables
// NEVER exposes values, NEVER logs values, NEVER returns values via API

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const SECRETS_DIR = process.env.FORGEOS_SECRETS_DIR || join(process.cwd(), 'secrets');

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
    const envVal = process.env[envKey];
    return (envVal && envVal.trim()) || null;
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

  /**
   * Stores a validated credential in memory for this server instance.
   * EPHEMERAL: lost on cold start / redeploy. For persistence, set the
   * FORGEOS_<ID>_KEY env var. Only call after the key has been validated
   * against the real provider. NEVER expose via API.
   */
  setEphemeral(providerId, key) {
    if (!providerId || !key || !key.trim()) return false;
    this.cache.set(providerId, key.trim());
    return true;
  }

  /** Public status — metadata only, no values. */
  status(providerId) {
    const has = this.has(providerId);
    return {
      has,
      source: has ? 'configured' : 'none',
    };
  }

  clearCache(providerId) {
    if (providerId) this.cache.delete(providerId);
    else this.cache.clear();
  }
}

export const vault = new Vault();
