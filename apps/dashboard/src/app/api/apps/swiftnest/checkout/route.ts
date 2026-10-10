/**
 * SwiftNest Checkout API
 * Creates a Stripe Checkout Session in TEST MODE for a courier delivery.
 *
 * POST /api/apps/swiftnest/checkout
 * Body: { packageId, addons[], customer: { name, email, phone, pickupAddress, dropoffAddress, date, notes } }
 * Returns: { url } (Stripe Checkout URL) or { error }
 *
 * SECURITY:
 * - Prices are server-side constants. Client sends only IDs.
 * - Test mode enforced: rejects non-sk_test_ keys.
 * - Rate limited: 10 req/min/IP.
 */

import { NextRequest, NextResponse } from 'next/server';

const PACKAGES: Record<string, { name: string; price: number }> = {
  small: { name: 'Small Parcel (up to 5 lbs)', price: 1200 },
  medium: { name: 'Medium Package (up to 20 lbs)', price: 1900 },
  large: { name: 'Large / Bulky (up to 50 lbs)', price: 2900 },
};

const ADDONS: Record<string, { name: string; price: number }> = {
  express: { name: 'Express 2-Hour Delivery', price: 800 },
  fragile: { name: 'Fragile Handling', price: 500 },
  signature: { name: 'Signature Required', price: 300 },
  scheduled: { name: 'Scheduled Time Window', price: 400 },
};

// In-memory rate limiter: 10 requests per IP per minute
const rateLimitStore = globalThis as unknown as {
  __swiftnest_ratelimit?: Map<string, number[]>;
};

function isRateLimited(ip: string): boolean {
  if (!rateLimitStore.__swiftnest_ratelimit) {
    rateLimitStore.__swiftnest_ratelimit = new Map();
  }
  const now = Date.now();
  const window = 60 * 1000;
  const maxRequests = 10;

  const timestamps = rateLimitStore.__swiftnest_ratelimit.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < window);

  if (recent.length >= maxRequests) {
    return true;
  }

  recent.push(now);
  rateLimitStore.__swiftnest_ratelimit.set(ip, recent);
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
    const { packageId, addons = [], customer } = body;

    if (!PACKAGES[packageId]) {
      return NextResponse.json({ error: 'Invalid package selected.' }, { status: 400 });
    }
    if (!customer?.name?.trim() || !customer?.email?.trim()
        || !customer?.pickupAddress?.trim() || !customer?.dropoffAddress?.trim()
        || !customer?.date) {
      return NextResponse.json(
        { error: 'Name, email, pickup address, dropoff address, and date are required.' },
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

    // SAFETY: Enforce test mode
    if (!stripeKey.startsWith('sk_test_')) {
      console.error('SwiftNest: BLOCKED — non-test Stripe key detected.');
      return NextResponse.json(
        { error: 'Payment system is in test mode only.' },
        { status: 503 }
      );
    }

    const pkg = PACKAGES[packageId];
    const lineItems: Array<{ price_data: { currency: string; product_data: { name: string }; unit_amount: number }; quantity: number }> = [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: `SwiftNest: ${pkg.name}` },
          unit_amount: pkg.price,
        },
        quantity: 1,
      },
    ];

    for (const addonId of addons) {
      const addon = ADDONS[addonId];
      if (addon) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: { name: `Add-on: ${addon.name}` },
            unit_amount: addon.price,
          },
          quantity: 1,
        });
      }
    }

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('customer_email', customer.email);
    params.append('success_url', `${process.env.NEXT_PUBLIC_APP_URL || 'https://forgeos.shoppersspotllc.com'}/apps/swiftnest/success?session_id={CHECKOUT_SESSION_ID}`);
    params.append('cancel_url', `${process.env.NEXT_PUBLIC_APP_URL || 'https://forgeos.shoppersspotllc.com'}/apps/swiftnest/book?cancelled=1`);
    params.append('metadata[package_id]', packageId);
    params.append('metadata[customer_name]', customer.name);
    params.append('metadata[pickup_address]', customer.pickupAddress);
    params.append('metadata[dropoff_address]', customer.dropoffAddress);
    params.append('metadata[delivery_date]', customer.date);
    params.append('metadata[addons]', addons.join(','));
    if (customer.phone) params.append('metadata[customer_phone]', customer.phone);
    if (customer.notes) params.append('metadata[notes]', customer.notes.substring(0, 500));

    lineItems.forEach((item: { price_data: { currency: string; product_data: { name: string }; unit_amount: number } }, i: number) => {
      const pd = item.price_data as { currency: string; product_data: { name: string }; unit_amount: number };
      params.append(`line_items[${i}][price_data][currency]`, pd.currency);
      params.append(`line_items[${i}][price_data][product_data][name]`, pd.product_data.name);
      params.append(`line_items[${i}][price_data][unit_amount]`, String(pd.unit_amount));
      params.append(`line_items[${i}][quantity]`, '1');
    });

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
      return NextResponse.json({ error: 'Payment setup failed. Please try again.' }, { status: 502 });
    }

    const session = await stripeRes.json();
    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
