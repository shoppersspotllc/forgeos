/**
 * ForgeOS AI - Rate Limiter (TypeScript)
 *
 * Token-bucket rate limiter for Vercel/serverless.
 *
 * Design:
 * - In-memory per-instance (Map). Each Vercel serverless instance has its own
 *   bucket state. This is not a distributed limiter, but it provides meaningful
 *   protection: a single abusive client hitting one instance is throttled, and
 *   Vercel's routing distributes load across instances.
 * - For stronger guarantees, replace with Vercel KV / Upstash Redis in future.
 *
 * Usage:
 *   import { checkRateLimit } from '@/lib/forgeos-ai/rate-limit.mjs';
 *   const result = checkRateLimit(identifier, { maxRequests: 30, windowMs: 60000 });
 *   if (!result.allowed) {
 *     return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
 *   }
 */

// Buckets: identifier -> { tokens, lastRefill }
const buckets = new Map();

/**
 * Check if a request is allowed under the rate limit.
 *
 * @param {string} identifier - Unique key (IP address, keyId, etc.)
 * @param {object} options - { maxRequests, windowMs }
 * @returns {object} { allowed, remaining, resetAt }
 */
export function checkRateLimit(identifier: string, options: { maxRequests?: number; windowMs?: number } = {}) {
  const maxRequests = options.maxRequests || 30;
  const windowMs = options.windowMs || 60000; // 1 minute default

  const now = Date.now();
  let bucket = buckets.get(identifier);

  if (!bucket) {
    bucket = { tokens: maxRequests, lastRefill: now };
    buckets.set(identifier, bucket);
  }

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor((elapsed / windowMs) * maxRequests);
  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(maxRequests, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  if (bucket.tokens > 0) {
    bucket.tokens--;
    return {
      allowed: true,
      remaining: bucket.tokens,
      resetAt: bucket.lastRefill + windowMs,
    };
  }

  return {
    allowed: false,
    remaining: 0,
    resetAt: bucket.lastRefill + windowMs,
    retryAfter: Math.ceil((bucket.lastRefill + windowMs - now) / 1000),
  };
}

/**
 * Get client identifier from request (IP address).
 * Works with Vercel's x-forwarded-for and x-real-ip headers.
 */
export function getClientIp(req: { headers: { get(name: string): string | null } }) {
  // Vercel provides x-forwarded-for with client IP first
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return 'unknown';
}

/**
 * Cleanup old buckets periodically to prevent memory leaks.
 * Called opportunistically on each check.
 */
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  // Cleanup every 5 minutes
  if (now - lastCleanup < 300000) return;
  lastCleanup = now;

  const cutoff = now - 3600000; // 1 hour
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.lastRefill < cutoff) {
      buckets.delete(key);
    }
  }
}

// Export for testing
export function _clearBuckets() {
  buckets.clear();
}
