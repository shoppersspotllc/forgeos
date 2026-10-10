/**
 * TurnoverPro Stripe Webhook Handler (TEST MODE MVP)
 * Receives payment completion events from Stripe.
 *
 * POST /api/apps/turnoverpro/webhook
 * Verifies Stripe signature, records completed bookings.
 *
 * DATA INTEGRITY NOTICE:
 * - Bookings are stored in-memory only. Server restart/deploy LOSES all records.
 * - Duplicate protection is in-memory only. A restart between Stripe retries
 *   could allow a duplicate log entry.
 * - STRIPE DASHBOARD IS THE SOURCE OF TRUTH for all payments.
 *   Verify bookings at https://dashboard.stripe.com/test/payments
 * - This is acceptable for test-mode validation only.
 * - Production requires a persistent database (e.g., Vercel Postgres, Supabase).
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

    // Timing-safe comparison
    const a = Buffer.from(v1, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return false;
    if (Math.abs(Date.now() / 1000 - parseInt(t)) > 300) return false; // 5 min tolerance
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_TURNOVERPRO;
  if (!webhookSecret) {
    console.error('TurnoverPro webhook secret not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const payload = await req.text();
  const signature = req.headers.get('stripe-signature') || '';

  if (!verifySignature(payload, signature, webhookSecret)) {
    console.error('TurnoverPro webhook: invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const event = JSON.parse(payload);

    // Idempotency: Stripe may deliver the same event multiple times.
    // Use the event ID to deduplicate. In production, check against a persistent store.
    // For MVP: track processed event IDs in memory (resets on deploy — acceptable for test mode).
    const eventId = event.id;
    if (!eventId) {
      console.error('TurnoverPro webhook: missing event ID');
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }

    // In-memory deduplication (use Redis/DB in production)
    const globalStore = globalThis as unknown as { __turnoverpro_events?: Set<string> };
    if (!globalStore.__turnoverpro_events) {
      globalStore.__turnoverpro_events = new Set();
    }
    if (globalStore.__turnoverpro_events.has(eventId)) {
      console.log(`TurnoverPro webhook: duplicate event ${eventId} ignored`);
      return NextResponse.json({ received: true, duplicate: true });
    }
    globalStore.__turnoverpro_events.add(eventId);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const meta = session.metadata || {};

      // Verify this is a test-mode payment (defense in depth)
      if (session.livemode) {
        console.error('TurnoverPro webhook: BLOCKED live-mode payment in test MVP');
        return NextResponse.json({ error: 'Live payments not accepted' }, { status: 400 });
      }

      const booking = {
        app: 'turnoverpro',
        stripeSessionId: session.id,
        stripeEventId: eventId,
        amountTotal: session.amount_total,
        currency: session.currency,
        customerEmail: session.customer_email,
        customerName: meta.customer_name,
        packageId: meta.package_id,
        addons: meta.addons,
        propertyAddress: meta.property_address,
        cleaningDate: meta.cleaning_date,
        customerPhone: meta.customer_phone,
        notes: meta.notes,
        paidAt: new Date().toISOString(),
        livemode: session.livemode,
        testMode: !session.livemode,
      };

      // Log booking (MVP: console + in-memory. Production needs persistent DB.)
      // WARNING: Bookings are lost on server restart/deploy. This is test-mode only.
      console.log('TurnoverPro booking completed:', JSON.stringify(booking));

      // Store in-memory for retrieval via API (lost on restart)
      const bookingStore = globalThis as unknown as { __turnoverpro_bookings?: Array<object> };
      if (!bookingStore.__turnoverpro_bookings) {
        bookingStore.__turnoverpro_bookings = [];
      }
      bookingStore.__turnoverpro_bookings.push(booking);

      // TODO (production): Write to persistent database
      // TODO (production): Send confirmation email — NOT IMPLEMENTED in MVP
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('TurnoverPro webhook error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
