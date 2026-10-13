/**
 * GET /api/revenue/stats — current Young Money revenue statistics
 * POST /api/revenue/stats — record a revenue event (lead, click, conversion, commission, payout, expense)
 *
 * All values must be real. Never fabricate revenue.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStats, recordEvent, getEvents } from '@/lib/revenue/tracker';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const engine = searchParams.get('engine') || undefined;
  const includeEvents = searchParams.get('events') === 'true';

  const stats = getStats();
  const response: any = { stats };
  if (includeEvents) {
    response.events = getEvents(engine, undefined, 50);
  }
  return NextResponse.json(response);
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { engine, type, description, amount, source, evidence, dotName } = body;

  if (!['affiliate', 'pindrop', 'quant', 'other'].includes(engine)) {
    return NextResponse.json({ error: 'Invalid engine' }, { status: 400 });
  }
  if (!['lead', 'click', 'conversion', 'commission', 'payout', 'expense'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }
  if (typeof description !== 'string' || description.length === 0 || description.length > 500) {
    return NextResponse.json({ error: 'Description required (1-500 chars)' }, { status: 400 });
  }
  const amt = Number(amount);
  if (!isFinite(amt) || amt < 0 || amt > 1000000) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  const event = recordEvent({
    engine,
    type,
    description,
    amount: amt,
    source: typeof source === 'string' ? source.substring(0, 200) : undefined,
    evidence: typeof evidence === 'string' ? evidence.substring(0, 500) : undefined,
    dotName: typeof dotName === 'string' ? dotName.substring(0, 50) : undefined,
  });

  return NextResponse.json({ success: true, event, stats: getStats() });
}
