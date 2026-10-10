/**
 * Young Money centralized payment registry — TEST-mode scaffolding.
 *
 * This registry is the single place where payment providers and per-app
 * payment capabilities are declared. It holds NO secrets: every credential
 * is resolved from environment variables at runtime (see gateway.ts).
 *
 * Rules enforced here and in gateway.ts:
 * - TEST and LIVE credentials are separate. Only TEST is wired.
 * - An app can only use the capabilities it is registered for.
 * - `enabled: false` is the default. Enabling requires: credentials
 *   provisioned in Secure Vault/Vercel env, TEST verification passed, and
 *   Abubakar's explicit approval. LIVE activation always needs a separate
 *   explicit approval and is not possible through this module.
 */

export type PaymentEnvironment = 'test' | 'live';
export type PaymentCapability = 'one_time' | 'subscription';

export interface PaymentProvider {
  id: 'stripe';
  displayName: string;
  /** Hosts the server is allowed to call. */
  apiHosts: string[];
  /** Server-side-only env var holding the secret key. Never NEXT_PUBLIC. */
  secretEnvVar: string;
  /** Prefix for per-app webhook signing-secret env vars. */
  webhookSecretEnvPrefix: string;
  /** Required key prefix. Code rejects anything else. */
  testKeyPrefix: string;
}

export interface AppPaymentRegistration {
  appId: string;
  providerId: PaymentProvider['id'];
  capabilities: PaymentCapability[];
  /** Exact env var holding this app's webhook signing secret. */
  webhookSecretEnvVar: string;
  /** Master switch. Default false. See rules above. */
  enabled: boolean;
  notes: string;
}

export const PAYMENT_PROVIDERS: Record<PaymentProvider['id'], PaymentProvider> = {
  stripe: {
    id: 'stripe',
    displayName: 'Stripe',
    apiHosts: ['api.stripe.com'],
    secretEnvVar: 'STRIPE_SECRET_KEY',
    webhookSecretEnvPrefix: 'STRIPE_WEBHOOK_SECRET_',
    testKeyPrefix: 'sk_test_',
  },
};

/**
 * Verified 2026-10-10: Stripe is the only payment provider integrated anywhere
 * in the ForgeOS codebase (Track B app checkout routes). No Shopper's Spot
 * payment-processor account credentials exist in Secure Vault as of this
 * writing — all registrations stay disabled until credentials are provisioned
 * and TEST verification passes.
 */
export const APP_REGISTRATIONS: AppPaymentRegistration[] = [
  {
    appId: 'freshturn',
    providerId: 'stripe',
    capabilities: ['one_time'],
    webhookSecretEnvVar: 'STRIPE_WEBHOOK_SECRET_FRESHTURN',
    enabled: false,
    notes: 'Cleaning bookings. Existing checkout route enforces sk_test_ in code.',
  },
  {
    appId: 'swiftnest',
    providerId: 'stripe',
    capabilities: ['one_time'],
    webhookSecretEnvVar: 'STRIPE_WEBHOOK_SECRET_SWIFTNEST',
    enabled: false,
    notes: 'Courier deliveries. Existing checkout route enforces sk_test_ in code.',
  },
  {
    appId: 'pulsepilot',
    providerId: 'stripe',
    capabilities: ['subscription'],
    webhookSecretEnvVar: 'STRIPE_WEBHOOK_SECRET_PULSEPILOT',
    enabled: false,
    notes: 'Fitness subscriptions (Stripe subscription mode).',
  },
  {
    appId: 'tablemint',
    providerId: 'stripe',
    capabilities: ['one_time'],
    webhookSecretEnvVar: 'STRIPE_WEBHOOK_SECRET_TABLEMINT',
    enabled: false,
    notes: 'Food orders. Server-side menu totals.',
  },
];

export function registrationFor(appId: string): AppPaymentRegistration {
  const reg = APP_REGISTRATIONS.find((r) => r.appId === appId);
  if (!reg) throw new Error(`[payments] App '${appId}' is not registered for payments.`);
  return reg;
}

/** Non-sensitive metadata safe to store in the application database. */
export function publicRegistrationMeta(appId: string): {
  appId: string;
  provider: string;
  capabilities: PaymentCapability[];
  environment: PaymentEnvironment;
  enabled: boolean;
} {
  const reg = registrationFor(appId);
  return {
    appId: reg.appId,
    provider: PAYMENT_PROVIDERS[reg.providerId].displayName,
    capabilities: reg.capabilities,
    environment: 'test',
    enabled: reg.enabled,
  };
}
