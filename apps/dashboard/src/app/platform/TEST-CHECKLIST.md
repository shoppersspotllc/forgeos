# Young Money Platform — TEST Checklist (scaffold v0.1)

Scope: isolated branch `apps/young-money-platform`. TEST/demo data only. No production.

## Automated (run locally)

- [ ] `tsc --noEmit` on the new `platform` routes — target: 0 errors
- [ ] API smoke tests (node script against `next dev` or route handlers):
  - [ ] `GET /api/platform/leads` → 200, `demo:true`, 6 seeded leads, 2 flagged neglected
  - [ ] `POST /api/platform/leads` → 201 with valid body; 400 with missing customerName / bad trade / bad amount
  - [ ] `POST /api/platform/leads/[id]/draft` → 201, approval queued, `aiGenerated:false`, nothing sent
  - [ ] `POST /api/platform/leads/[id]/draft` on won lead → 409
  - [ ] `GET /api/platform/approvals` → pending list
  - [ ] `POST /api/platform/approvals` approve → approved + SIMULATED send logged; lead status → followed_up
  - [ ] `POST /api/platform/approvals` approve twice → 409 (no double-send)
  - [ ] `POST /api/platform/approvals` reject → rejected with note
  - [ ] `GET /api/platform/briefing` → 4 sections, each with source/freshness/period + missing-data disclosure
  - [ ] `GET /api/platform/health` → checks with evidence; `aiMode=test-stub`
  - [ ] `GET /api/platform/activity` → activity + audit records appended by the above
  - [ ] `PATCH /api/platform/leads/[id]` → outcome won/lost/open; 400 on invalid outcome; 404 on unknown id

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
- Auth/permissions (no customer identity system yet — greenfield per assessment)
- Full dashboard `next build` (VM copy stale; build runs on preview post-quota)
