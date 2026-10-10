/**
 * SwiftNest Bookings API (TEST MODE)
 * GET /api/apps/swiftnest/bookings
 * Returns sanitized delivery records (no PII).
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const store = globalThis as unknown as { __swiftnest_bookings?: Array<Record<string, unknown>> };
  const bookings = store.__swiftnest_bookings || [];

  const safe = bookings.map((b: Record<string, unknown>) => ({
    app: b.app,
    packageId: b.packageId,
    addons: b.addons,
    amountTotal: b.amountTotal,
    currency: b.currency,
    deliveryDate: b.deliveryDate,
    paidAt: b.paidAt,
    testMode: b.testMode,
  }));

  return NextResponse.json({
    bookings: safe,
    count: safe.length,
    warning: 'Test mode: in-memory only, lost on restart',
  });
}
