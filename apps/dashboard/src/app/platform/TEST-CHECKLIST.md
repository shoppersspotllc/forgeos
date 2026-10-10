# Young Money Platform — TEST Checklist (scaffold v0.1 + preview auth)

Scope: isolated branch `apps/young-money-platform`. TEST/demo data only. No production.

## Automated (run locally)

- [x] `tsc --noEmit` (strict) — 0 errors (2026-10-10)
- [x] `next build` — passes cleanly (2026-10-10; 2 pre-existing Turbopack warnings in `src/lib/forgeos-ai/service-keys.mjs`, unrelated to platform code)
- [x] API smoke tests — 63/63 pass (2026-10-10), covering:
  - All original scaffold checks (leads CRUD validation, draft lifecycle, approval queue incl. 409 double-decide, briefing labels, health evidence, activity/audit shape, outcome PATCH)
  - Preview auth: login wrong/empty/missing code → 401; valid → 200 + httpOnly cookie + `private-preview` label; bad tenant id → 400; missing/garbage/tampered/expired token → 401; cookie auth → 200
  - Cross-tenant isolation: tenant-b cannot list, read, PATCH, draft, or approve tenant-a's records (404, no data leaked); briefing/activity scoped per tenant; demo seeds invisible to other tenants
  - Simulated-send safety: send-path source scan (comments stripped) finds no network primitives; approve flow works with `fetch` replaced by a throwing stub; outbox gains exactly 1 local `simulated:true` record; outbox tenant-scoped

## Manual (browser, post-quota preview)

- [ ] `/platform` renders: 5 tool cards, Dot list, TEST banner
- [ ] `/platform/leads`: neglected chips visible; draft buttons queue approvals
- [ ] `/platform/approvals`: pending queue, approve/reject work; SIMULATED banner visible
- [ ] `/platform/briefing`: 4 sections with source/freshness/missing labels
- [ ] `/platform/activity`: activity + audit entries appear after actions
- [ ] Mobile 390px: no horizontal overflow on all 5 pages

## Explicitly NOT tested in this scaffold

- Real AI drafting (disabled by design — zero-spend; requires platform credential + approval)
- Real message delivery (sends are simulated; no email/SMS integration)
- Persistence (in-memory store is volatile by design)
- Production identity (preview auth only: shared access code, no MFA, no user directory, no login rate limiting — labeled as such in code)
- Full dashboard `next build` (VM copy stale; build runs on preview post-quota)
