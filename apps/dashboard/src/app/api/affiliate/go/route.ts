/**
 * GET /api/affiliate/go?tid=soulmate_article
 *
 * Click tracking redirect for affiliate HopLinks.
 * Records a 'click' event in the revenue tracker, then 302-redirects
 * to the real ClickBank HopLink (or test destination if not configured).
 *
 * Test mode: append ?test=1 or send x-test-mode: 1 header to flag
 * the event as a test (excluded from genuine metrics).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHopLink } from '@/lib/affiliate/config';
import { recordEvent } from '@/lib/revenue/tracker';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tid = searchParams.get('tid') || '';
  const utmSource = searchParams.get('utm_source') || '';
  const utmMedium = searchParams.get('utm_medium') || '';
  const utmCampaign = searchParams.get('utm_campaign') || '';

  const { url, live } = getHopLink(tid);

  // Build headers object for test detection
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => { headers[k] = v; });

  recordEvent(
    {
      engine: 'affiliate',
      type: 'click',
      description: `Affiliate click: ${tid || '(unknown)'} → ${live ? 'LIVE HopLink' : 'TEST MODE'}`,
      amount: 0,
      source: `tid=${tid}`,
      dotName: 'system',
      utmSource: utmSource || undefined,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || undefined,
    },
    { url: req.url, headers }
  );

  return NextResponse.redirect(url, 302);
}
