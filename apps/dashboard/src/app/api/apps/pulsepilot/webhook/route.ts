/**
 * PulsePilot Stripe Webhook Handler (TEST MODE MVP)
 *
 * POST /api/apps/pulsepilot/webhook
 * Handles: checkout.session.completed, customer.subscription.deleted
 *
 * DATA INTEGRITY NOTICE:
 * - Stored in-memory only. Server restart/deploy LOSES all records.
 * - STRIPE DASHBOARD IS THE SOURCE OF TRUTH.
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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_PULSEPILOT;
  if (!webhookSecret) {
    console.error('PulsePilot webhook secret not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const payload = await req.text();
  const signature = req.headers.get('stripe-signature') || '';

  if (!verifySignature(payload, signature, webhookSecret)) {
    console.error('PulsePilot webhook: invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const event = JSON.parse(payload);
    const eventId = event.id;
    if (!eventId) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }

    const globalStore = globalThis as unknown as { __pulsepilot_events?: Set<string> };
    if (!globalStore.__pulsepilot_events) {
      globalStore.__pulsepilot_events = new Set();
    }
    if (globalStore.__pulsepilot_events.has(eventId)) {
      console.log(`PulsePilot webhook: duplicate event ${eventId} ignored`);
      return NextResponse.json({ received: true, duplicate: true });
    }
    globalStore.__pulsepilot_events.add(eventId);

    const store = globalThis as unknown as { __pulsepilot_subs?: Array<Record<string, unknown>> };
    if (!store.__pulsepilot_subs) {
      store.__pulsepilot_subs = [];
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (session.livemode) {
        console.error('PulsePilot webhook: BLOCKED live-mode payment');
        return NextResponse.json({ error: 'Live payments not accepted' }, { status: 400 });
      }

      const meta = session.metadata || {};
      const sub = {
        app: 'pulsepilot',
        stripeSessionId: session.id,
        stripeSubscriptionId: session.subscription,
        stripeEventId: eventId,
        customerEmail: session.customer_email,
        customerName: meta.customer_name,
        planId: meta.plan_id,
        customerPhone: meta.customer_phone,
        status: 'active',
        startedAt: new Date().toISOString(),
        testMode: true,
      };

      console.log('PulsePilot subscription started:', JSON.stringify(sub));
      store.__pulsepilot_subs.push(sub);
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      console.error(`PulsePilot payment failed for subscription: ${invoice.subscription}`);
      // Mark subscription as past_due in store
      const sub = store.__pulsepilot_subs.find(
        (s: Record<string, unknown>) => s.stripeSubscriptionId === invoice.subscription
      ) as Record<string, unknown> | undefined;
      if (sub) {
        sub.status = 'past_due';
        sub.lastPaymentFailedAt = new Date().toISOString();
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const sub = store.__pulsepilot_subs.find(
        (s: Record<string, unknown>) => s.stripeSubscriptionId === subscription.id
      ) as Record<string, unknown> | undefined;
      if (sub) {
        sub.status = subscription.status;
        sub.updatedAt = new Date().toISOString();
        console.log(`PulsePilot subscription updated: ${subscription.id} → ${subscription.status}`);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const subId = subscription.id;
      const existing = store.__pulsepilot_subs.find(
        (s: Record<string, unknown>) => s.stripeSubscriptionId === subId
      ) as Record<string, unknown> | undefined;
      if (existing) {
        existing.status = 'cancelled';
        existing.cancelledAt = new Date().toISOString();
        console.log(`PulsePilot subscription cancelled: ${subId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('PulsePilot webhook error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
