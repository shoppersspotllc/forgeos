/**
 * SwiftNest Stripe Webhook Handler (TEST MODE MVP)
 *
 * POST /api/apps/swiftnest/webhook
 * Verifies Stripe signature, records completed deliveries.
 *
 * DATA INTEGRITY NOTICE:
 * - Deliveries are stored in-memory only. Server restart/deploy LOSES all records.
 * - Duplicate protection is in-memory only.
 * - STRIPE DASHBOARD IS THE SOURCE OF TRUTH for all payments.
 * - Production requires a persistent database.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const elements = signature.split(',');
    const t = elements.find((e) => e.startsWith('t='))?.split('=')[1];
    const v1 = elements.find((e) => e.startsWith('v1='))?.split('=')[1];
    if (!t || !v1) return false;

    const signedPayload = `${t}.${payload}`;
    const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

    const a = Buffer.from(v1, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return false;
    if (Math.abs(Date.now() / 1000 - parseInt(t)) > 300) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_SWIFTNEST;
  if (!webhookSecret) {
    console.error('SwiftNest webhook secret not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const payload = await req.text();
  const signature = req.headers.get('stripe-signature') || '';

  if (!verifySignature(payload, signature, webhookSecret)) {
    console.error('SwiftNest webhook: invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const event = JSON.parse(payload);
    const eventId = event.id;
    if (!eventId) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }

    const globalStore = globalThis as unknown as { __swiftnest_events?: Set<string> };
    if (!globalStore.__swiftnest_events) {
      globalStore.__swiftnest_events = new Set();
    }
    if (globalStore.__swiftnest_events.has(eventId)) {
      console.log(`SwiftNest webhook: duplicate event ${eventId} ignored`);
      return NextResponse.json({ received: true, duplicate: true });
    }
    globalStore.__swiftnest_events.add(eventId);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      if (session.livemode) {
        console.error('SwiftNest webhook: BLOCKED live-mode payment');
        return NextResponse.json({ error: 'Live payments not accepted' }, { status: 400 });
      }

      const meta = session.metadata || {};
      const delivery = {
        app: 'swiftnest',
        stripeSessionId: session.id,
        stripeEventId: eventId,
        amountTotal: session.amount_total,
        currency: session.currency,
        customerEmail: session.customer_email,
        customerName: meta.customer_name,
        packageId: meta.package_id,
        addons: meta.addons,
        pickupAddress: meta.pickup_address,
        dropoffAddress: meta.dropoff_address,
        deliveryDate: meta.delivery_date,
        customerPhone: meta.customer_phone,
        notes: meta.notes,
        paidAt: new Date().toISOString(),
        testMode: true,
      };

      console.log('SwiftNest delivery completed:', JSON.stringify(delivery));

      const store = globalThis as unknown as { __swiftnest_bookings?: Array<object> };
      if (!store.__swiftnest_bookings) {
        store.__swiftnest_bookings = [];
      }
      store.__swiftnest_bookings.push(delivery);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('SwiftNest webhook error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
