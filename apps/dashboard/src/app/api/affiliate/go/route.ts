/**
 * GET /api/affiliate/go?tid=soulmate_article
 *
 * Click tracking redirect for affiliate HopLinks.
 * Records a 'click' event in the revenue tracker, then 302-redirects
 * to the real ClickBank HopLink (or test destination if not configured).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHopLink } from '@/lib/affiliate/config';
import { recordEvent } from '@/lib/revenue/tracker';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tid = searchParams.get('tid') || '';

  const { url, live } = getHopLink(tid);

  // Record the click — real measurement
  recordEvent({
    engine: 'affiliate',
    type: 'click',
    description: `Affiliate click: ${tid || '(unknown)'} → ${live ? 'LIVE HopLink' : 'TEST MODE'}`,
    amount: 0,
    source: `tid=${tid}`,
    dotName: 'system',
  });

  return NextResponse.redirect(url, 302);
}
