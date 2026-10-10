/**
 * Young Money Revenue Subscriptions API (Cardiq)
 * GET /api/young-money/revenue/subscriptions?mode=live|test
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMRR, type RevenueMode } from '@/lib/young-money/revenue';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const modeParam = searchParams.get('mode') || 'live';

  if (modeParam !== 'live' && modeParam !== 'test') {
    return NextResponse.json({ error: 'mode must be "live" or "test"' }, { status: 400 });
  }

  const mrr = await getMRR(modeParam as RevenueMode);

  return NextResponse.json({
    mode: modeParam,
    mrr_cents: mrr.mrr_cents,
    mrr_display: `$${(mrr.mrr_cents / 100).toFixed(2)}/mo`,
    active_count: mrr.active_count,
    by_plan: mrr.by_plan,
    generated_at: new Date().toISOString(),
    volatility_warning: 'In-memory only — lost on restart/deploy.',
  });
}
