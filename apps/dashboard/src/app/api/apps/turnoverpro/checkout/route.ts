/**
 * TurnoverPro Stripe Checkout API
 * Creates a Stripe Checkout Session in TEST MODE for a cleaning booking.
 *
 * POST /api/apps/turnoverpro/checkout
 * Body: { packageId, addons[], customer: { name, email, phone, address, date, notes } }
 * Returns: { url } (Stripe Checkout URL) or { error }
 */

import { NextRequest, NextResponse } from 'next/server';

const PACKAGES: Record<string, { name: string; price: number }> = {
  studio: { name: 'Studio / 1-Bed Cleaning', price: 14900 },
  standard: { name: '2-Bed Standard Cleaning', price: 24900 },
  deep: { name: '3-Bed+ Deep Clean', price: 39900 },
};

const ADDONS: Record<string, { name: string; price: number }> = {
  fridge: { name: 'Inside Refrigerator', price: 2500 },
  oven: { name: 'Inside Oven', price: 2500 },
  windows: { name: 'Interior Windows', price: 3500 },
  laundry: { name: 'Laundry Room Detail', price: 2000 },
  pet: { name: 'Pet Hair Treatment', price: 3000 },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { packageId, addons = [], customer } = body;

    // Validate
    if (!PACKAGES[packageId]) {
      return NextResponse.json({ error: 'Invalid package selected.' }, { status: 400 });
    }
    if (!customer?.name?.trim() || !customer?.email?.trim() || !customer?.address?.trim() || !customer?.date) {
      return NextResponse.json({ error: 'Name, email, address, and date are required.' }, { status: 400 });
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

    // Build line items
    const pkg = PACKAGES[packageId];
    const lineItems: Array<{ price_data: object; quantity: number }> = [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: `TurnoverPro: ${pkg.name}` },
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

    // Create Stripe Checkout Session via REST API (no SDK needed)
    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('customer_email', customer.email);
    params.append('success_url', `${process.env.NEXT_PUBLIC_APP_URL || 'https://forgeos.shoppersspotllc.com'}/apps/turnoverpro/success?session_id={CHECKOUT_SESSION_ID}`);
    params.append('cancel_url', `${process.env.NEXT_PUBLIC_APP_URL || 'https://forgeos.shoppersspotllc.com'}/apps/turnoverpro/book?cancelled=1`);
    params.append('metadata[package_id]', packageId);
    params.append('metadata[customer_name]', customer.name);
    params.append('metadata[property_address]', customer.address);
    params.append('metadata[cleaning_date]', customer.date);
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
