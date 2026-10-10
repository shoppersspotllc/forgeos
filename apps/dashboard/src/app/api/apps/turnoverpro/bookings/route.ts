/**
 * TurnoverPro Bookings API (TEST MODE)
 * Returns recorded bookings from webhook events.
 *
 * GET /api/apps/turnoverpro/bookings
 *
 * WARNING: In-memory only. Bookings are lost on server restart/deploy.
 * This is acceptable for test-mode MVP validation only.
 * Production requires a persistent database.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const store = globalThis as unknown as { __turnoverpro_bookings?: Array<object> };
  const bookings = store.__turnoverpro_bookings || [];

  // Strip sensitive fields before returning
  const safe = bookings.map((b: Record<string, unknown>) => ({
    app: b.app,
    packageId: b.packageId,
    addons: b.addons,
    amountTotal: b.amountTotal,
    currency: b.currency,
    cleaningDate: b.cleaningDate,
    paidAt: b.paidAt,
    testMode: b.testMode,
    // customerEmail, customerName, propertyAddress, phone intentionally excluded
  }));

  return NextResponse.json({
    bookings: safe,
    count: safe.length,
    warning: 'Test mode: in-memory only, lost on restart',
  });
}
