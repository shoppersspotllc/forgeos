/**
 * FitRoutine Subscriptions API (TEST MODE)
 * GET /api/apps/fitroutine/subscriptions
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const store = globalThis as unknown as { __fitroutine_subs?: Array<object> };
  const subs = store.__fitroutine_subs || [];

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
