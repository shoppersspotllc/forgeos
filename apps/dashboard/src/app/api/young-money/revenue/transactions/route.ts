/**
 * Young Money Revenue Transactions API
 * GET /api/young-money/revenue/transactions?mode=live|test&app=&kind=&limit=
 *
 * Returns sanitized transaction list (no PII).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTransactions, type AppId, type RevenueMode, type TransactionKind } from '@/lib/young-money/revenue';

const APPS: AppId[] = ['turnvia', 'quickvia', 'cardiq', 'menova', 'craftora'];
const KINDS: TransactionKind[] = ['payment', 'refund', 'subscription_payment', 'dispute'];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const modeParam = searchParams.get('mode') || 'live';

  if (modeParam !== 'live' && modeParam !== 'test') {
    return NextResponse.json({ error: 'mode must be "live" or "test"' }, { status: 400 });
  }
  const mode = modeParam as RevenueMode;

  const appParam = searchParams.get('app');
  if (appParam && !APPS.includes(appParam as AppId)) {
    return NextResponse.json({ error: 'Invalid app' }, { status: 400 });
  }

  const kindParam = searchParams.get('kind');
  if (kindParam && !KINDS.includes(kindParam as TransactionKind)) {
    return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
  }

  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

  const transactions = await getTransactions({
    app: appParam as AppId | undefined,
    mode,
    kind: kindParam as TransactionKind | undefined,
    limit,
  });

  // Sanitize — no PII
  const safe = transactions.map((t) => ({
    id: t.id,
    app: t.app,
    kind: t.kind,
    amount_cents: t.amount_cents,
    currency: t.currency,
    fee_cents: t.fee_cents,
    fee_estimated: t.fee_estimated,
    test_mode: t.test_mode,
    plan_or_package_id: t.plan_or_package_id,
    items_summary: t.items_summary,
    order_type: t.order_type,
    occurred_at: t.occurred_at,
    archived: t.archived || false,
  }));

  return NextResponse.json({
    mode,
    count: safe.length,
    transactions: safe,
    generated_at: new Date().toISOString(),
    volatility_warning: 'In-memory only — lost on restart/deploy.',
  });
}
