/**
 * SkillSpring Checkout API
 * Creates a Stripe Checkout Session in TEST MODE for course enrollment.
 *
 * POST /api/apps/skillspring/checkout
 * Body: { courseId, customer: { name, email } }
 */

import { NextRequest, NextResponse } from 'next/server';

const COURSES: Record<string, { name: string; price: number }> = {
  negotiation: { name: 'Master Negotiation — Full Course', price: 9900 },
  copywriting: { name: 'Conversion Copywriting — Full Course', price: 7900 },
  sysdesign: { name: 'System Design Mastery — Full Course', price: 14900 },
};

const rateLimitStore = globalThis as unknown as {
  __skillspring_ratelimit?: Map<string, number[]>;
};

function isRateLimited(ip: string): boolean {
  if (!rateLimitStore.__skillspring_ratelimit) {
    rateLimitStore.__skillspring_ratelimit = new Map();
  }
  const now = Date.now();
  const window = 60 * 1000;
  const maxRequests = 10;
  const timestamps = rateLimitStore.__skillspring_ratelimit.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < window);
  if (recent.length >= maxRequests) return true;
  recent.push(now);
  rateLimitStore.__skillspring_ratelimit.set(ip, recent);
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip') || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { courseId, customer } = body;

    if (!COURSES[courseId]) {
      return NextResponse.json({ error: 'Invalid course selected.' }, { status: 400 });
    }
    if (!customer?.name?.trim() || !customer?.email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'Payment system not configured.' }, { status: 503 });
    }
    if (!stripeKey.startsWith('sk_test_')) {
      console.error('SkillSpring: BLOCKED — non-test Stripe key.');
      return NextResponse.json({ error: 'Payment system is in test mode only.' }, { status: 503 });
    }

    const course = COURSES[courseId];

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('customer_email', customer.email);
    params.append('success_url', `${process.env.NEXT_PUBLIC_APP_URL || 'https://forgeos.shoppersspotllc.com'}/apps/skillspring/success?session_id={CHECKOUT_SESSION_ID}`);
    params.append('cancel_url', `${process.env.NEXT_PUBLIC_APP_URL || 'https://forgeos.shoppersspotllc.com'}/apps/skillspring/enroll?cancelled=1`);
    params.append('metadata[course_id]', courseId);
    params.append('metadata[customer_name]', customer.name);
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][product_data][name]', course.name);
    params.append('line_items[0][price_data][unit_amount]', String(course.price));
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
      console.error('Stripe error:', (await stripeRes.text()).substring(0, 200));
      return NextResponse.json({ error: 'Enrollment failed. Please try again.' }, { status: 502 });
    }

    const session = await stripeRes.json();
    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
