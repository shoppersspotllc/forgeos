/**
 * TableMint Checkout API
 * Creates a Stripe Checkout Session in TEST MODE for a food order.
 *
 * POST /api/apps/tablemint/checkout
 * Body: { items: [{id, qty}], orderType: 'pickup'|'delivery', customer: { name, email, phone, address? } }
 *
 * SECURITY:
 * - Prices are server-side constants. Client sends only item IDs + quantities.
 * - Quantities capped at 20 per item to prevent abuse.
 * - Test mode enforced. Rate limited.
 */

import { NextRequest, NextResponse } from 'next/server';

const MENU: Record<string, { name: string; price: number }> = {
  burger: { name: 'Classic Burger', price: 1299 },
  pizza: { name: 'Margherita Pizza', price: 1499 },
  salad: { name: 'Caesar Salad', price: 999 },
  pasta: { name: 'Pasta Alfredo', price: 1399 },
  wings: { name: 'Buffalo Wings (8)', price: 1199 },
  soda: { name: 'Fountain Drink', price: 299 },
};

const DELIVERY_FEE = 299;
const MAX_QTY = 20;

const rateLimitStore = globalThis as unknown as {
  __tablemint_ratelimit?: Map<string, number[]>;
};

function isRateLimited(ip: string): boolean {
  if (!rateLimitStore.__tablemint_ratelimit) {
    rateLimitStore.__tablemint_ratelimit = new Map();
  }
  const now = Date.now();
  const window = 60 * 1000;
  const maxRequests = 10;
  const timestamps = rateLimitStore.__tablemint_ratelimit.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < window);
  if (recent.length >= maxRequests) return true;
  recent.push(now);
  rateLimitStore.__tablemint_ratelimit.set(ip, recent);
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip') || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a minute and try again.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { items = [], orderType = 'pickup', customer } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
    }
    if (!['pickup', 'delivery'].includes(orderType)) {
      return NextResponse.json({ error: 'Invalid order type.' }, { status: 400 });
    }
    if (!customer?.name?.trim() || !customer?.email?.trim() || !customer?.phone?.trim()) {
      return NextResponse.json({ error: 'Name, email, and phone are required.' }, { status: 400 });
    }
    if (orderType === 'delivery' && !customer?.address?.trim()) {
      return NextResponse.json({ error: 'Delivery address is required.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'Payment system not configured.' }, { status: 503 });
    }
    if (!stripeKey.startsWith('sk_test_')) {
      console.error('TableMint: BLOCKED — non-test Stripe key.');
      return NextResponse.json({ error: 'Payment system is in test mode only.' }, { status: 503 });
    }

    // Build line items from server-side prices only
    const lineItems: Array<{ price_data: { currency: string; product_data: { name: string }; unit_amount: number }; quantity: number }> = [];
    const orderSummary: string[] = [];

    for (const { id, qty } of items) {
      const menuItem = MENU[id];
      if (!menuItem) continue; // skip invalid items
      const quantity = Math.min(Math.max(1, parseInt(qty) || 1), MAX_QTY);
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: menuItem.name },
          unit_amount: menuItem.price,
        },
        quantity,
      });
      orderSummary.push(`${menuItem.name} x${quantity}`);
    }

    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'No valid items in cart.' }, { status: 400 });
    }

    if (orderType === 'delivery') {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Delivery Fee' },
          unit_amount: DELIVERY_FEE,
        },
        quantity: 1,
      });
    }

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('customer_email', customer.email);
    params.append('success_url', `${process.env.NEXT_PUBLIC_APP_URL || 'https://forgeos.shoppersspotllc.com'}/apps/tablemint/success?session_id={CHECKOUT_SESSION_ID}`);
    params.append('cancel_url', `${process.env.NEXT_PUBLIC_APP_URL || 'https://forgeos.shoppersspotllc.com'}/apps/tablemint/order?cancelled=1`);
    params.append('metadata[order_type]', orderType);
    params.append('metadata[customer_name]', customer.name);
    params.append('metadata[customer_phone]', customer.phone);
    params.append('metadata[items]', orderSummary.join('; ').substring(0, 500));
    if (customer.address) params.append('metadata[delivery_address]', customer.address.substring(0, 200));

    lineItems.forEach((item, i) => {
      const pd = item.price_data;
      params.append(`line_items[${i}][price_data][currency]`, pd.currency);
      params.append(`line_items[${i}][price_data][product_data][name]`, pd.product_data.name);
      params.append(`line_items[${i}][price_data][unit_amount]`, String(pd.unit_amount));
      params.append(`line_items[${i}][quantity]`, String(item.quantity));
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
      return NextResponse.json({ error: 'Order setup failed. Please try again.' }, { status: 502 });
    }

    const session = await stripeRes.json();
    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
