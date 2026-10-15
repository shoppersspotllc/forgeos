/**
 * Shared admin authentication for ForgeOS dashboard API routes.
 *
 * Uses the existing FORGEOS_ADMIN_TOKEN pattern: timing-safe Bearer comparison.
 * Returns true if the request carries a valid admin token, false otherwise.
 *
 * Usage:
 *   import { checkAdmin } from '@/lib/forgeos-ai/admin-auth';
 *   if (!checkAdmin(req)) {
 *     return NextResponse.json({ error: 'Admin authentication required' }, { status: 403 });
 *   }
 */

import { timingSafeEqual } from 'crypto';

export function checkAdmin(req: { headers: { get(name: string): string | null } }): boolean {
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
