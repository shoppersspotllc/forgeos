/**
 * POST /api/payments/checkout
 *
 * Creates a Stripe TEST-mode Checkout Session for a registered app.
 * Controlled TEST pilot: fixed $1.00 amount, everything server-side.
 *
 * Security: delegates to the centralized gateway, which fail-closes unless
 * STRIPE_SECRET_KEY is an sk_test_ key. Live payments are impossible here —
 * a live key throws before any network call.
 */
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { createCheckoutSession } from '@/lib/payments/gateway';

/** Controlled TEST pilot amount: $1.00. Never taken from the client. */
const TEST_AMOUNT_CENTS = 100;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch((): unknown => ({}))) as {
      appId?: unknown;
    };
    const appId = typeof body.appId === 'string' ? body.appId : '';
    if (!appId) {
      return NextResponse.json({ error: 'appId is required' }, { status: 400 });
    }
    const origin = new URL(req.url).origin;
    const session = await createCheckoutSession({
      appId,
      amountCents: TEST_AMOUNT_CENTS,
      currency: 'usd',
      description: 'Young Money TEST pilot — $1.00 (TEST mode, no real charge)',
      successUrl: `${origin}/payments/test-result?app=${encodeURIComponent(appId)}&status=success`,
      cancelUrl: `${origin}/payments/test-result?app=${encodeURIComponent(appId)}&status=cancelled`,
      mode: 'payment',
      idempotencyKey: `test_${randomUUID()}`,
    });
    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      testMode: true,
      amountCents: TEST_AMOUNT_CENTS,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status =
      message.includes('not enabled') || message.includes('BLOCKED') ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
