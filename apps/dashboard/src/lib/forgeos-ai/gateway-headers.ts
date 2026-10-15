/**
 * Optional extra HTTP headers for outbound calls to the standalone
 * ForgeOS AI gateway (services/forgeos-ai, desktop-primary).
 *
 * Set FORGEOS_GATEWAY_HEADERS to a JSON object of string pairs, e.g.:
 *   {"CF-Access-Client-Id":"...","CF-Access-Client-Secret":"..."}
 *
 * Purpose: when the desktop gateway is reached through a private-access
 * proxy — e.g. an authenticated outbound tunnel from the desktop — the
 * proxy's own auth headers travel here. The gateway's own Bearer tokens
 * (service credential, admin token) are always set explicitly by callers
 * and can never be overridden through this variable.
 *
 * Security: values are never logged. Malformed JSON is ignored (no headers).
 * Only plain string pairs are accepted.
 */
export function gatewayExtraHeaders(): Record<string, string> {
  const raw = process.env.FORGEOS_GATEWAY_HEADERS;
  if (!raw || typeof raw !== 'string') return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof k !== 'string' || typeof v !== 'string' || !k.trim() || !v) continue;
    const kl = k.toLowerCase();
    // Never allow overriding the gateway's own auth or hop-by-hop headers.
    if (kl === 'authorization' || kl === 'host' || kl === 'content-length' ||
        kl === 'connection' || kl === 'transfer-encoding') continue;
    out[k] = v;
  }
  return out;
}
