/**
 * Young Money centralized payment gateway — Stripe TEST-mode scaffolding.
 *
 * Security contract:
 * - Secrets come ONLY from environment variables. Nothing is hardcoded and
 *   nothing secret is committed, logged, or sent to the browser.
 * - TEST mode is enforced in code: only `sk_test_…` keys are accepted.
 *   A live key throws before any network call. LIVE cannot be enabled here.
 * - Every checkout requires a caller-supplied idempotency key (one per
 *   order/booking) so retries and duplicate submissions cannot double-charge.
 * - Amounts are validated server-side (positive integer cents).
 * - The central secret key is never exposed to individual apps or browser
 *   code: only this server-side module reads STRIPE_SECRET_KEY.
 *
 * Uses Stripe's REST API directly (no SDK dependency), matching the existing
 * Track B checkout implementations.
 */
import { PAYMENT_PROVIDERS, registrationFor } from './registry';

const STRIPE_API = 'https://api.stripe.com/v1';

function testKey(): string {
  const provider = PAYMENT_PROVIDERS.stripe;
  const key = process.env[provider.secretEnvVar];
  if (!key) {
    throw new Error(`[payments] ${provider.secretEnvVar} is not configured.`);
  }
  if (!key.startsWith(provider.testKeyPrefix)) {
    // Fail closed: never let a live key through this module.
    throw new Error(
      '[payments] BLOCKED: only Stripe TEST keys are accepted. Live payments are disabled.'
    );
  }
  return key;
}

export interface CheckoutSessionParams {
  appId: string;
  /** Positive integer minor units (cents). Determined server-side. */
  amountCents: number;
  currency?: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  mode?: 'payment' | 'subscription';
  /** Required. Unique per order/booking (e.g. `order_<uuid>`). */
  idempotencyKey: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
}

export async function createCheckoutSession(
  p: CheckoutSessionParams
): Promise<CheckoutSession> {
  const reg = registrationFor(p.appId);
  if (!reg.enabled) {
    throw new Error(`[payments] App '${p.appId}' is not enabled for payments.`);
  }
  if (p.mode === 'subscription' && !reg.capabilities.includes('subscription')) {
    throw new Error(`[payments] App '${p.appId}' is not registered for subscriptions.`);
  }
  if (!Number.isInteger(p.amountCents) || p.amountCents <= 0) {
    throw new Error('[payments] amountCents must be a positive integer.');
  }
  if (!p.idempotencyKey || p.idempotencyKey.length < 8) {
    throw new Error('[payments] A unique idempotencyKey (min 8 chars) is required.');
  }
  for (const url of [p.successUrl, p.cancelUrl]) {
    if (!/^https:\/\//.test(url)) {
      throw new Error('[payments] successUrl and cancelUrl must be https URLs.');
    }
  }

  const body = new URLSearchParams({
    mode: p.mode ?? 'payment',
    'line_items[0][price_data][currency]': p.currency ?? 'usd',
    'line_items[0][price_data][unit_amount]': String(p.amountCents),
    'line_items[0][price_data][product_data][name]': p.description.slice(0, 200),
    'line_items[0][quantity]': '1',
    success_url: p.successUrl,
    cancel_url: p.cancelUrl,
  });

  const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${testKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': p.idempotencyKey,
    },
    body,
  });

  if (!res.ok) {
    // Never log the key; the error body may contain request ids only.
    const errText = await res.text();
    throw new Error(`[payments] Stripe request failed (${res.status}): ${errText.slice(0, 200)}`);
  }
  const session = (await res.json()) as { id: string; url: string };
  if (!session.url) throw new Error('[payments] Stripe did not return a checkout URL.');
  return { id: session.id, url: session.url };
}

/**
 * Returns the webhook signing secret env var name for an app.
 * Callers read the actual secret from process.env themselves and must use
 * Stripe's signature verification (t= timestamp, v1= HMAC) with the raw
 * request body. Never trust an event merely because it reaches the endpoint.
 */
export function webhookSecretEnvVar(appId: string): string {
  return registrationFor(appId).webhookSecretEnvVar;
}

/**
 * Webhook signature verification (Stripe scheme).
 *
 * Verifies the `Stripe-Signature` header (`t=<timestamp>,v1=<hex hmac>`) using
 * the app's registered webhook signing secret from env and the RAW request
 * body. Enforces a timestamp tolerance to blunt replay attacks. Throws on
 * any failure (fail closed). Returns the verified event id + type.
 *
 * Caller responsibilities (not done here): read the raw body BEFORE parsing,
 * and track processed event ids to handle duplicate deliveries (idempotency).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export interface VerifiedWebhookEvent {
  eventId: string;
  eventType: string;
}

export function verifyWebhookSignature(opts: {
  appId: string;
  rawBody: string;
  signatureHeader: string | null | undefined;
  toleranceSeconds?: number;
}): VerifiedWebhookEvent {
  const secret = process.env[webhookSecretEnvVar(opts.appId)];
  if (!secret) {
    throw new Error('[payments] Webhook signing secret is not configured.');
  }
  if (!opts.signatureHeader) {
    throw new Error('[payments] Missing Stripe-Signature header.');
  }
  const pairs = opts.signatureHeader.split(',');
  const get = (k: string): string | undefined => {
    const p = pairs.find((x) => x.startsWith(k + '='));
    return p ? p.slice(k.length + 1) : undefined;
  };
  const t = get('t');
  const v1s = pairs.filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  if (!t || v1s.length === 0) {
    throw new Error('[payments] Malformed Stripe-Signature header.');
  }
  const ageSec = Math.abs(Date.now() / 1000 - Number(t));
  const tolerance = opts.toleranceSeconds ?? 300;
  if (!Number.isFinite(ageSec) || ageSec > tolerance) {
    throw new Error('[payments] Webhook timestamp outside tolerance (possible replay).');
  }
  const expectedHex = createHmac('sha256', secret).update(`${t}.${opts.rawBody}`, 'utf8').digest('hex');
  const expected = Buffer.from(expectedHex, 'utf8');
  const matched = v1s.some((v1) => {
    const actual = Buffer.from(v1, 'utf8');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  });
  if (!matched) {
    throw new Error('[payments] Webhook signature mismatch.');
  }
  let event: { id?: unknown; type?: unknown };
  try {
    event = JSON.parse(opts.rawBody);
  } catch {
    throw new Error('[payments] Webhook body is not valid JSON.');
  }
  if (typeof event.id !== 'string' || typeof event.type !== 'string') {
    throw new Error('[payments] Webhook payload missing id/type.');
  }
  return { eventId: event.id, eventType: event.type };
}
