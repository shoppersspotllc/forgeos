/**
 * PulsePilot Checkout API
 * Creates a Stripe Checkout Session in SUBSCRIPTION mode (TEST MODE).
 *
 * POST /api/apps/pulsepilot/checkout
 * Body: { planId, customer: { name, email, phone } }
 * Returns: { url } (Stripe Checkout URL) or { error }
 *
 * SECURITY:
 * - Prices are server-side constants. Client sends only IDs.
 * - Test mode enforced: rejects non-sk_test_ keys.
 * - Rate limited: 10 req/min/IP.
 */

import { NextRequest, NextResponse } from 'next/server';

const PLANS: Record<string, { name: string; price: number }> = {
  basic: { name: 'PulsePilot Basic — Monthly', price: 2900 },
  pro: { name: 'PulsePilot Pro — Monthly', price: 4900 },
  elite: { name: 'PulsePilot Elite — Monthly', price: 7900 },
};

const rateLimitStore = globalThis as unknown as {
  __pulsepilot_ratelimit?: Map<string, number[]>;
};

function isRateLimited(ip: string): boolean {
  if (!rateLimitStore.__pulsepilot_ratelimit) {
    rateLimitStore.__pulsepilot_ratelimit = new Map();
  }
  const now = Date.now();
  const window = 60 * 1000;
  const maxRequests = 10;

  const timestamps = rateLimitStore.__pulsepilot_ratelimit.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < window);
  if (recent.length >= maxRequests) return true;

  recent.push(now);
  rateLimitStore.__pulsepilot_ratelimit.set(ip, recent);
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a minute and try again.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { planId, customer } = body;

    if (!PLANS[planId]) {
      return NextResponse.json({ error: 'Invalid plan selected.' }, { status: 400 });
    }
    if (!customer?.name?.trim() || !customer?.email?.trim()) {
      return NextResponse.json(
        { error: 'Name and email are required.' },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 503 }
      );
    }

    if (!stripeKey.startsWith('sk_test_')) {
      console.error('PulsePilot: BLOCKED — non-test Stripe key detected.');
      return NextResponse.json(
        { error: 'Payment system is in test mode only.' },
        { status: 503 }
      );
    }

    const plan = PLANS[planId];

    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('customer_email', customer.email);
    params.append('success_url', `${process.env.NEXT_PUBLIC_APP_URL || 'https://forgeos.shoppersspotllc.com'}/apps/pulsepilot/success?session_id={CHECKOUT_SESSION_ID}`);
    params.append('cancel_url', `${process.env.NEXT_PUBLIC_APP_URL || 'https://forgeos.shoppersspotllc.com'}/apps/pulsepilot/subscribe?cancelled=1`);
    params.append('metadata[plan_id]', planId);
    params.append('metadata[customer_name]', customer.name);
    if (customer.phone) params.append('metadata[customer_phone]', customer.phone);

    // Subscription: recurring monthly price
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][product_data][name]', plan.name);
    params.append('line_items[0][price_data][unit_amount]', String(plan.price));
    params.append('line_items[0][price_data][recurring][interval]', 'month');
    params.append('line_items[0][quantity]', '1');

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!stripeRes.ok) {
      const errText = await stripeRes.text();
      console.error('Stripe error:', errText.substring(0, 200));
      return NextResponse.json({ error: 'Subscription setup failed. Please try again.' }, { status: 502 });
    }

    const session = await stripeRes.json();
    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
