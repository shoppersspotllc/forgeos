import { NextRequest, NextResponse } from 'next/server';
import {
  generateServiceKey,
  listServiceKeysMeta,
  hasServiceKeysConfigured,
} from '@/lib/forgeos-ai/service-keys.mjs';

/**
 * ForgeOS Service Key Management
 *
 * GET  /api/forgeos-ai/keys — list key metadata (no hashes/values)
 * POST /api/forgeos-ai/keys — issue a new service key (admin only)
 *
 * Admin auth: requires FORGEOS_ADMIN_TOKEN env var to match
 * Authorization: Bearer <admin-token> header.
 *
 * POST body: { "name": "Scout / God's Eye" }
 * Returns: { "key": "fk_...", "keyId": "...", "name": "..." }
 *   The plaintext key is shown ONCE. Store it securely. Only the hash
 *   goes into FORGEOS_SERVICE_KEYS.
 *
 * For production: add the returned key's hash to the FORGEOS_SERVICE_KEYS
 * env var in Vercel (as JSON), then redeploy. The plaintext key goes to
 * the platform/Dot that will use it.
 */

// Admin token from env (never in code)
// Phase 4: Timing-safe comparison prevents timing attacks on admin token
import { timingSafeEqual } from 'crypto';
function checkAdmin(req: NextRequest): boolean {
  const adminToken = process.env.FORGEOS_ADMIN_TOKEN;
  if (!adminToken) return false;
  const header = req.headers.get('authorization') || '';
  const expected = `Bearer ${adminToken}`;
  if (header.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(header, 'utf8'), Buffer.from(expected, 'utf8'));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  // Listing requires admin auth
  if (!checkAdmin(req)) {
    return NextResponse.json(
      { error: 'Admin authentication required' },
      { status: 403 }
    );
  }
  return NextResponse.json({
    keys: listServiceKeysMeta(),
    configured: hasServiceKeysConfigured(),
  });
}

export async function POST(req: NextRequest) {
  // Issuance requires admin auth
  if (!checkAdmin(req)) {
    return NextResponse.json(
      { error: 'Admin authentication required' },
      { status: 403 }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // No body is fine, name is optional
  }

  const name = (body.name || 'unnamed-service').toString().slice(0, 100);
  const issued = generateServiceKey(name);

  // Return plaintext ONCE. The caller must store the hash in
  // FORGEOS_SERVICE_KEYS env var. We do NOT persist here because
  // Vercel serverless has no writable persistent storage.
  return NextResponse.json({
    key: issued.key, // SHOW ONCE — give this to the platform/Dot
    keyId: issued.keyId,
    name: issued.name,
    created: issued.created,
    hash: issued.hash, // Add this to FORGEOS_SERVICE_KEYS JSON
    instructions:
      'Add {"<keyId>":{"hash":"<hash>","name":"<name>","created":"<created>","expiresAt":null,"revoked":false}} to FORGEOS_SERVICE_KEYS env var in Vercel, then redeploy. Give the "key" value to the platform. Never commit it. Set expiresAt to an ISO 8601 timestamp to enable expiry.',
  });
}
