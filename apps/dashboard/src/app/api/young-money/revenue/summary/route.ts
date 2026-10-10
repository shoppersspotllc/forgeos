/**
 * Young Money Revenue Summary API
 * GET /api/young-money/revenue/summary?mode=live|test&app=
 *
 * Returns per-app and aggregate revenue figures.
 * mode is REQUIRED and defaults to 'live'. There is no mixed-mode view.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSummary, getMRR, type AppId, type RevenueMode } from '@/lib/young-money/revenue';

const APPS: AppId[] = ['turnvia', 'quickvia', 'cardiq', 'menova', 'craftora'];
const MONTHLY_TARGET_CENTS = 5000000; // $50,000

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const modeParam = searchParams.get('mode') || 'live';

  if (modeParam !== 'live' && modeParam !== 'test') {
    return NextResponse.json(
      { error: 'mode must be "live" or "test"' },
      { status: 400 }
    );
  }
  const mode = modeParam as RevenueMode;

  const appParam = searchParams.get('app');
  if (appParam && !APPS.includes(appParam as AppId)) {
    return NextResponse.json(
      { error: `Invalid app. Must be one of: ${APPS.join(', ')}` },
      { status: 400 }
    );
  }

  // Per-app summaries
  const perApp = await Promise.all(
    APPS.map(async (app) => ({
      app,
      ...(await getSummary(app, mode)),
    }))
  );

  // Aggregate
  const total = await getSummary('all', mode);

  // MRR (Cardiq)
  const mrr = await getMRR(mode);

  // Progress toward $50K monthly target (live mode only is meaningful)
  const progress_pct = mode === 'live'
    ? Math.min(100, (total.net_cents / MONTHLY_TARGET_CENTS) * 100)
    : null;

  return NextResponse.json({
    mode,
    generated_at: new Date().toISOString(),
    volatility_warning: 'In-memory only — lost on restart/deploy. Stripe Dashboard is the source of truth.',
    target: {
      monthly_cents: MONTHLY_TARGET_CENTS,
      monthly_display: '$50,000',
      progress_pct,
    },
    total: {
      transaction_count: total.transaction_count,
      gross_cents: total.gross_cents,
      refunds_cents: total.refunds_cents,
      fees_cents: total.fees_cents,
      fees_estimated: total.fees_estimated,
      net_cents: total.net_cents,
    },
    mrr: {
      mrr_cents: mrr.mrr_cents,
      active_count: mrr.active_count,
      by_plan: mrr.by_plan,
    },
    per_app: perApp.map((p) => ({
      app: p.app,
      transaction_count: p.transaction_count,
      gross_cents: p.gross_cents,
      refunds_cents: p.refunds_cents,
      fees_cents: p.fees_cents,
      fees_estimated: p.fees_estimated,
      net_cents: p.net_cents,
      mrr_cents: p.mrr_cents,
      active_subscriptions: p.active_subscriptions,
    })),
  });
}
