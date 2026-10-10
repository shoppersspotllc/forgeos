/**
 * TurnoverPro Stripe Webhook Handler
 * Receives payment completion events from Stripe.
 *
 * POST /api/apps/turnoverpro/webhook
 * Verifies Stripe signature, records completed bookings.
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

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const meta = session.metadata || {};

      const booking = {
        app: 'turnoverpro',
        stripeSessionId: session.id,
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

      // Log booking (in production, this would write to a database)
      // For MVP: log to console + append to Young Money revenue tracking
      console.log('TurnoverPro booking completed:', JSON.stringify(booking));

      // TODO: Send confirmation email, notify operations team
      // TODO: Write to persistent booking store
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('TurnoverPro webhook error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
