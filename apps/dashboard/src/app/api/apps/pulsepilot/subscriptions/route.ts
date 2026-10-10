/**
 * PulsePilot Subscriptions API (TEST MODE)
 * GET /api/apps/pulsepilot/subscriptions
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const store = globalThis as unknown as { __pulsepilot_subs?: Array<Record<string, unknown>> };
  const subs = store.__pulsepilot_subs || [];

  const safe = subs.map((s: Record<string, unknown>) => ({
    app: s.app,
    planId: s.planId,
    status: s.status,
    startedAt: s.startedAt,
    cancelledAt: s.cancelledAt,
    testMode: s.testMode,
  }));

  return NextResponse.json({
    subscriptions: safe,
    count: safe.length,
    warning: 'Test mode: in-memory only, lost on restart',
  });
}
