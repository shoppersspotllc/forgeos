# Payment Onboarding — Future Young Money Products

Every product that wants payment operations must complete this checklist.
No step may be skipped; LIVE activation always needs Abubakar's separate
explicit approval.

## 1. Project registration
- Add an entry to `APP_REGISTRATIONS` in `registry.ts`: appId, provider,
  capabilities (`one_time` and/or `subscription`), webhook secret env var name.
- `enabled` stays `false` until every step below passes.

## 2. Environment selection
- TEST first, always. `STRIPE_SECRET_KEY` must be a `sk_test_…` key.
- TEST and LIVE credentials are separate and never shared. LIVE keys are
  never accepted by `gateway.ts` (fail-closed in code).

## 3. Credential provisioning
- Owner creates keys in the provider's official dashboard (Stripe Dashboard →
  Developers → API keys, with "View test data" on).
- Keys enter through Secure Vault / Vercel environment variables only.
  Never chat, never Git, never client-side code, never `NEXT_PUBLIC_`.
- Webhook signing secret: create one endpoint per app in the provider
  dashboard, store as the app's `STRIPE_WEBHOOK_SECRET_<APP>` env var.

## 4. Restricted permissions
- The app's server routes call only `gateway.ts`; they never read
  `STRIPE_SECRET_KEY` directly and never see other apps' webhook secrets.
- Prices are server-side constants; clients send IDs only.
- Rate limits on checkout endpoints (10 req/min/IP minimum).

## 5. Security checks (must pass before enablement)
- `security-gate` workflow green on the app's branch (secret scan, dependency
  audit, typecheck, build).
- TEST-mode funnel verification: success, declined card, invalid input,
  tampered webhook signature, replayed/duplicate events, rate-limit trip.
- Confirm test activity is recorded separately from real revenue.

## 6. Enablement
- Set `enabled: true` for the app in `registry.ts` (TEST only).
- Record the evidence packet: commit, test results, approver, date.

## 7. LIVE activation (separate approval, separate change)
- Requires Abubakar's explicit approval naming the app and the go-live date.
- Separate keys, separate webhook endpoint, separate verification run.
- Never enable LIVE as part of TEST setup.
