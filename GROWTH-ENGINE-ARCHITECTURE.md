# ForgeOS Agent Runtime Architecture

**Date:** 2026-10-12
**Status:** DESIGN (pending Dexter's decisions on AI providers + persistent host)
**Mission:** Turn the Dots into real AI agents

## 1. Current State (from audit)

### What works
- **My Dots chat** (`/api/my-dots/chat`): Real agentic loop. Dots call ForgeOS AI, emit `toolcall` blocks, server validates permissions, executes tools in-process, feeds results back. Live in production.
- **Capability executor** (`lib/capabilities/`): 6 real tools (web-search, web-read, github-research, youtube-transcript, reddit, rss) with SSRF protection.
- **Governor** (`services/workforce/governor/`): Real task lifecycle (create → dispatch → complete/fail), SQLite persistence, 21 tasks in history. Only Scout onboarded.
- **Browser executor** (`services/workforce/dot-executor/`): Real Chromium automation, read-only, screenshot evidence, 15+ completed runs.
- **ForgeOS AI gateway**: Real fk_ auth, provider routing, circuit breaker. **Currently DEGRADED: 0/5 providers connected.**

### What's broken
- Governor API on Vercel: structurally cannot load `../../services` on serverless. Needs persistent Node host.
- `/api/tasks`: in-memory only, lost on cold start.
- 5 of 6 Dots cannot be dispatched (only Scout onboarded).
- Browser executor is read-only by design (no clicks, forms, logins).

### What doesn't exist
- OpenDots source/assets: only emoji identities (🔍📊🔨🎯🐑💰). No images or animations to preserve.
- Role-specific skill bundles: Dots have chat personas + research tools only. No Analyst scoring engine, no Craftsman code tools, no Hunter/Closer outreach tools, no Shepherd QA tools.

## 2. Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ForgeOS Dashboard (Vercel)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Scout 🔍 │  │ Analyst📊 │  │Craftsman🔨│  │ Hunter 🎯 │ ... │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │             │             │             │              │
│       └─────────────┴──────┬──────┴─────────────┘              │
│                            │ /api/my-dots/chat                │
│                    ┌───────┴────────┐                         │
│                    │ Capability     │                         │
│                    │ Executor       │                         │
│                    │ (tools)        │                         │
│                    └───────┬────────┘                         │
│                            │ ForgeOS AI gateway               │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│              Persistent Node Host (NEW - needs approval)       │
│                            │                                  │
│                    ┌───────┴────────┐                         │
│                    │   Governor     │                         │
│                    │ (task lifecycle│                         │
│                    │  + SQLite)     │                         │
│                    └───────┬────────┘                         │
│                            │ spawns                           │
│                    ┌───────┴────────┐                         │
│                    │ Dot Executor   │                         │
│                    │ (browser +     │                         │
│                    │  evidence)    │                         │
│                    └────────────────┘                         │
└──────────────────────────────────────────────────────────────┘
```

### Component responsibilities

**Dashboard (Vercel, stateless):**
- Dot chat UI → `/api/my-dots/chat` (already works)
- Workforce dashboard → reads task status from Governor API (needs persistent host)
- Skill definitions → served from registry (static + dynamic)
- Activity stream → polls Governor for task updates

**ForgeOS AI Gateway (existing, needs providers):**
- Model routing, fk_ auth, circuit breaker
- All Dot "thinking" goes through here
- **BLOCKED: 0 providers connected**

**Governor (persistent host, exists, needs deployment):**
- Task lifecycle: `pending → assigned → running → complete|failed`
- Per-Dot onboarding (currently only Scout)
- SQLite persistence (tasks, transitions, verifications)
- Spawns dot-executor as child process
- Timeout, cancellation, bounded retries, orphan reaping

**Dot Executor (persistent host, exists):**
- Browser automation (Playwright, read-only)
- Screenshot evidence per step
- HTML report generation
- Cleanup verification

**Capability Executor (Vercel, works):**
- In-process tool execution for chat-time tools
- Web research, GitHub, Reddit, RSS, YouTube

## 3. Per-Dot Skill Bundles (to build)

### Scout 🔍 (has: research tools)
**Add:** Lead scoring engine, prospect qualification workflow, evidence-backed report generator
**Status:** Partially implemented (research tools work, needs scoring/qualification)

### Analyst 📊 (has: research tools)
**Add:** Structured data analysis (CSV/JSON input → insights), comparison engine, revenue analysis, metric calculations
**Status:** To build

### Craftsman 🔨 (has: research tools)
**Add:** Repository inspection (read-only git), code generation via AI, build diagnostics, test runner integration
**Status:** To build (read-only first, per safety rules)

### Shepherd 🐑 (has: research tools)
**Add:** QA checklists, service health probes, regression test runner, recovery verification
**Status:** To build

### Hunter 🎯 (has: research tools)
**Add:** Prospect research templates, outreach draft generator (drafts only, never sends), follow-up scheduler
**Status:** To build (drafts only, per safety rules)

### Closer 💰 (has: research tools)
**Add:** Proposal generator, pricing calculator, objection handler, conversion tracker
**Status:** To build

### Muse 🤖 (orchestrator)
**Role:** Decomposes goals, assigns to Dots, coordinates dependencies, tracks progress, presents consolidated results
**Needs:** Task decomposition engine, multi-agent coordinator, result aggregator
**Status:** To build (Muse currently not in dot registry — must be added)

## 4. Truthful Dashboard (to build)

Each Dot card shows:
- **Health:** Real status from Governor (not hardcoded). `online` = heartbeat < 60s, `degraded` = AI gateway down, `offline` = no heartbeat, `unknown` = never checked.
- **Current task:** From Governor API (null if idle — show "Idle", not fake activity).
- **Last verified task:** From `task_verifications` table (null → "No verified tasks yet").
- **Success/failure counts:** From SQLite `dot_task_history` (real numbers, null → "No data yet").
- **Skills:** From skill registry (real list).
- **Actions:** "View workspace" (task history + traces), "Chat" (existing).

**Never:** Invent numbers, claim completion without verification, show "Online" without a heartbeat.

## 5. Safety Architecture

- **Server-side authorization:** All tool calls validated against `DOT_TOOL_PERMISSIONS`. Caller-supplied dotName is lookup key only.
- **Least privilege:** Dots start with read-only. Write/deploy/message/purchase require explicit capability grants + approval gates.
- **Secret redaction:** fk_ keys, tokens never in client code, logs, or error messages.
- **Browser allowlists:** Domain allowlist enforced. No credential-bearing URLs.
- **Approval gates:** External comms, publishing, spending, production changes, customer commitments — all require Dexter's explicit approval.
- **Audit logs:** All task transitions, tool calls, and approvals in SQLite (append-only).

## 6. Deployment Requirements

### Persistent Node Host (needs Dexter's approval)
**Why:** Governor + SQLite + browser executor cannot run on Vercel serverless.
**Options:**
- Fly.io (free tier, persistent volumes) — matches FreeLLM rescue pattern
- Railway ($5/mo) — simple, persistent
- Local Mac/PC — free, but requires always-on machine

**What runs there:**
- Governor API (task lifecycle)
- SQLite database (tasks.db)
- Dot executor (browser automation)
- ForgeOS AI gateway (optional — can stay on Vercel via dual-mode)

**Cost:** $0-5/mo depending on option.

### Vercel (existing)
- Dashboard UI (unchanged)
- `/api/my-dots/chat` (works — needs AI providers)
- `/api/capabilities`, `/api/research` (work)
- Proxies to persistent host for Governor API

## 7. Implementation Stages

### Stage 1: Unblock the brains (BLOCKED — needs Dexter)
- Connect AI providers to ForgeOS AI gateway
- Verify Dot chat works end-to-end with real AI

### Stage 2: Persistent home (BLOCKED — needs Dexter)
- Deploy Governor + executor to persistent host
- Verify task dispatch works (Scout only)
- Dashboard reads real task data

### Stage 3: Onboard Analyst
- Implement Analyst skill bundle (data analysis tools)
- End-to-end test with evidence
- Dashboard shows real Analyst metrics

### Stage 4-6: Onboard Craftsman, Hunter, Shepherd, Closer
- Same pattern: skills → test → evidence → dashboard

### Stage 7: Muse orchestrator
- Add Muse to dot registry
- Implement task decomposition + multi-agent coordination
- Multi-agent delegation test with evidence

### Stage 8: Truthful dashboard
- Replace all hardcoded statuses with real data
- Activity stream, workspace views, verification badges

## 8. Definition of Done (per Dot)

- [ ] Skill bundle implemented and tested
- [ ] Runtime connection verified (AI gateway + Governor)
- [ ] One end-to-end task completed with screenshots/traces
- [ ] Failure case tested (recovery works)
- [ ] Independent verification passed
- [ ] Dashboard shows real metrics (no fakes)
- [ ] Deployment status documented

## 9. Known Limitations

- Browser executor is read-only by design (no clicks, forms, logins) — write actions need architecture change + safety review
- No OpenDots source to preserve — emoji identities are the asset
- Vercel cannot host the Governor — persistent host is mandatory for background tasks
- AI gateway needs provider keys — Dots are brain-dead until connected
- SQLite lives outside the repo (`~/workspace/dot-foundation/`) — should be moved into the deployment

## 10. Open Questions for Dexter

1. **AI providers:** Which provider keys should I wire up? (OpenRouter, Gemini, etc.)
2. **Persistent host:** Approve Fly.io (free), Railway ($5/mo), or local machine?
3. **Dot order:** Analyst first, or a different priority?
4. **Muse in registry:** Should Muse be added as a dispatchable dot, or stay as orchestrator-only?
