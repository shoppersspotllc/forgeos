# Young Money Shared Ledger — Integration Design

**Status:** DESIGN — not implemented. Awaiting owner approval before any merge.
**Date:** 2026-10-09

## Problem

The revenue ledger (`lib/young-money/revenue.ts`) lives on branch `apps/young-money-revenue`.
The five app webhooks live on separate branches:
- `apps/turnoverpro-mvp` (Turnvia)
- `apps/localdrop-mvp` (Quickvia)
- `apps/fitroutine-mvp` (Cardiq)
- `apps/directdish-mvp` (Menova)
- `apps/skillvault-mvp` (Craftora)

Webhooks cannot import the ledger until the code is on the same branch.

## Recommended Solution: Shared Module + Sequential Merge

### Phase 1: Merge ledger to main (1 PR)
**Branch:** `apps/young-money-revenue` → `main`

**What merges:**
- `apps/dashboard/src/lib/young-money/revenue.ts` (ledger module)
- `apps/dashboard/src/lib/young-money/revenue.test.ts` (tests)
- `apps/dashboard/src/app/api/young-money/revenue/*` (3 API routes)
- `apps/dashboard/src/app/young-money/page.tsx` (dashboard)

**What does NOT merge:** Any app-specific code. The ledger is app-agnostic.

**Verification before merge:**
- [ ] Tests pass locally
- [ ] TypeScript compiles with no errors
- [ ] No changes to frozen ForgeOS core
- [ ] No changes to existing routes

### Phase 2: Merge apps one at a time (5 PRs, sequential)

**Order:** Turnvia first (prioritized by owner), then Quickvia, Cardiq, Menova, Craftora.

For each app:
1. Rebase app branch onto updated `main` (now includes ledger)
2. Modify app's webhook to import and call ledger functions:
   ```ts
   import { recordTransaction, recordRefund } from '@/lib/young-money/revenue';
   // On checkout.session.completed:
   await recordTransaction({ id: event.id, app: 'turnvia', kind: 'payment', ... });
   // On charge.refunded:
   await recordRefund({ id: event.id, app: 'turnvia', ... });
   ```
3. Add webhook event subscriptions in Stripe Dashboard (test mode):
   - All apps: `checkout.session.completed`, `charge.refunded`
   - Cardiq only: `invoice.payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Create PR, verify, merge
5. Deploy and test before moving to next app

**Why sequential:** If one app's webhook has a bug, it doesn't block the others.
Each merge is independently verifiable.

### Phase 3: Production readiness (per app, after owner approval)
1. Persistent storage (replace InMemoryStorage with Postgres)
2. Remove test-mode lock for that app only
3. Configure live webhook secret
4. Verify first live transaction appears in LIVE dashboard

## Alternative Considered: Duplicate Ledger Per App

**Rejected.** Duplicating the ledger module into each app branch would:
- Create 5 copies of financial logic to maintain
- Risk divergence (one app's refund handling differs from others)
- Make cross-app aggregation impossible without additional sync

The shared module is the correct architecture.

## Merge Sequence Summary

| Step | Source Branch | Target | Contents |
|------|--------------|--------|----------|
| 1 | `apps/young-money-revenue` | `main` | Ledger + APIs + dashboard + tests |
| 2 | `apps/turnoverpro-mvp` | `main` | Turnvia app + webhook→ledger wiring |
| 3 | `apps/localdrop-mvp` | `main` | Quickvia app + webhook→ledger wiring |
| 4 | `apps/fitroutine-mvp` | `main` | Cardiq app + webhook→ledger wiring |
| 5 | `apps/directdish-mvp` | `main` | Menova app + webhook→ledger wiring |
| 6 | `apps/skillvault-mvp` | `main` | Craftora app + webhook→ledger wiring |

**DO NOT merge any step without explicit owner approval.**
**DO NOT activate live payments at any step without explicit owner approval.**
