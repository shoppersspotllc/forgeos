/**
 * SkillVault Stripe Webhook Handler (TEST MODE MVP)
 * POST /api/apps/skillvault/webhook
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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_SKILLVAULT;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const payload = await req.text();
  const signature = req.headers.get('stripe-signature') || '';
  if (!verifySignature(payload, signature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const event = JSON.parse(payload);
    const eventId = event.id;
    if (!eventId) return NextResponse.json({ error: 'Invalid event' }, { status: 400 });

    const gs = globalThis as unknown as { __skillvault_events?: Set<string> };
    if (!gs.__skillvault_events) gs.__skillvault_events = new Set();
    if (gs.__skillvault_events.has(eventId)) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    gs.__skillvault_events.add(eventId);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (session.livemode) {
        return NextResponse.json({ error: 'Live payments not accepted' }, { status: 400 });
      }
      const meta = session.metadata || {};
      const enrollment = {
        app: 'skillvault',
        stripeSessionId: session.id,
        amountTotal: session.amount_total,
        currency: session.currency,
        customerEmail: session.customer_email,
        customerName: meta.customer_name,
        courseId: meta.course_id,
        enrolledAt: new Date().toISOString(),
        testMode: true,
      };
      console.log('SkillVault enrollment completed:', JSON.stringify(enrollment));
      const store = globalThis as unknown as { __skillvault_enrollments?: Array<object> };
      if (!store.__skillvault_enrollments) store.__skillvault_enrollments = [];
      store.__skillvault_enrollments.push(enrollment);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('SkillVault webhook error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
