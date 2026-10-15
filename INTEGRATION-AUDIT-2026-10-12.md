# ForgeOS Integration Audit — Dots as Real AI Agents

**Date:** 2026-10-12
**Mission:** Trace existing components, find minimal gaps, don't rebuild.

## 1. Request Path Trace

### Path: Dot Chat → AI Response

```
MyDotsView (browser)
  → POST /api/my-dots/chat {dotName, message}
    → Server validates dotName against DOT_PERSONAS
    → Builds system prompt server-side
    → Calls https://forgeos.shoppersspotllc.com/api/forgeos-ai/chat
      with FORGEOS_MYDOTS_KEY (fk_ credential, server-side only)
      → Gateway validates fk_ via SHA-256
        → ProviderPool routes to provider
          → Provider calls model API
        → Response back through gateway
      → Gateway returns to my-dots/chat
    → Optional: agentic tool loop (max 2 rounds)
  → Response to browser
```

**Status:** Code path is COMPLETE and CORRECT. No code changes needed.

### Path: Governor Task → Browser Execution

```
POST /api/governor/tasks {dotId, title, url}
  → requireHuman (GOVERNOR_API_TOKEN Bearer)
    → 503 if token unset (CURRENT STATE in prod)
  → Governor.createTask() → SQLite
  → Governor.dispatch(task.id)
    → Spawns run-task.mjs as child process
      → Browser executor (Playwright, read-only)
      → Screenshots + HTML report
      → SQLite persistence
  → Task complete/failed
```

**Status:** Code is COMPLETE. Blocked by: (1) No token in prod, (2) Vercel can't load `../../services`.

## 2. Component Health

| Component | Location | Health | Blocker |
|-----------|----------|--------|---------|
| My Dots chat API | Vercel `/api/my-dots/chat` | ✅ LIVE | None (code works) |
| ForgeOS AI gateway | Vercel `/api/forgeos-ai/*` | ⚠️ DEGRADED | 0/5 providers configured |
| Capability executor | Vercel (in-process) | ✅ WORKS | None |
| Governor API | Vercel `/api/governor/*` | ❌ 503 | No token + can't load on serverless |
| Governor runtime | `services/workforce/` | ✅ CODE EXISTS | Needs persistent host |
| Browser executor | `services/workforce/` | ✅ CODE EXISTS | Needs persistent host |
| SQLite | `services/.../tasks.db` | ✅ 21 tasks | Needs persistent host |
| Ollama | MacBook Pro :11434 | ✅ INSTALLED (v0.40.0, llama3.2:1b) | Not reachable from Vercel |

## 3. Provider Status (live)

All 5 providers: NEEDS_CONFIGURATION
- `ollama`: No Ollama on Vercel (it's on the Mac)
- `openrouter`: No API key configured
- `gemini`: No API key configured
- `omniroute`: Not running (expects localhost:20128)
- `zurelay`: No configuration

**Root cause:** The gateway code is fine. It's a configuration/connectivity issue, not a code issue.

## 4. The Minimal Gap

The Dots can't think because no AI provider is reachable from Vercel.

**Zero-cost path (Dexter's preference):**
- Ollama is already on the MacBook Pro with llama3.2:1b
- The gateway previously ran LOCALLY on the Mac and connected to Ollama
- For local E2E tests: run gateway on Mac → Ollama on Mac → works (proven 2026-10-07, 2026-10-08)

**Production path (future, needs decision):**
- Vercel cannot reach Mac's localhost
- Options: (a) Expose Mac Ollama via secure tunnel, (b) Use OpenRouter with key + cost controls, (c) Run gateway on persistent host with Ollama
- **No action taken** — Dexter said audit first, decide later

## 5. What NOT to Build

- ❌ New provider integration (gateway already supports 5 providers)
- ❌ New gateway (existing one works, just needs config)
- ❌ New task system (Governor exists and works)
- ❌ New browser executor (exists with evidence)
- ❌ OpenDots assets (don't exist — emoji identities are the asset)

## 6. Smallest Implementation Plan

### Phase 1: Local E2E Proof (Mac environment)
1. Start ForgeOS AI gateway locally on Mac (`node services/forgeos-ai/gateway.mjs`)
2. Verify Ollama connectivity (`curl localhost:11434/v1/models`)
3. Trace: Dot chat → local gateway → Ollama → response
4. Implement Analyst skill bundle (data analysis tools via capability executor)
5. Run Analyst E2E task: real data in → analysis out → evidence saved
6. Verify with screenshots and independent check

### Phase 2: Governor Integration (Mac environment)
1. Start Governor locally (it already works on filesystem)
2. Onboard Analyst to Governor (currently only Scout)
3. Dispatch Analyst task via Governor → browser executor
4. Verify task lifecycle, persistence, evidence

### Phase 3: Remaining Dots (Mac environment)
1. Same pattern for Craftsman, Hunter, Shepherd, Closer
2. Each: skills → test → evidence → verification
3. Muse as orchestrator (add to registry)

### Phase 4: Production Path (needs Dexter's decision)
1. Choose: tunnel to Mac Ollama, OpenRouter key, or persistent host with Ollama
2. Deploy Governor to chosen host
3. Update dashboard to read from persistent Governor API

## 7. Immediate Next Step

**Audit the Mac environment:**
- Is Ollama running? (`curl localhost:11434/v1/models`)
- Is the gateway running? (`curl localhost:8788/health`)
- Can we trace a Dot request end-to-end locally?

This requires Dexter to run commands on his Mac (I don't have shell access) OR for him to confirm the services are running.

## 8. Blockers (no action without approval)

1. **AI providers in production:** All 5 need configuration. Zero-cost path is Mac Ollama, but Vercel can't reach it. Needs Dexter's decision on production AI strategy.
2. **Persistent host:** Governor needs it. Dexter said audit Fly.io free tier before proposing.
3. **Mac access:** I need Dexter to verify Ollama/gateway status on his Mac, or grant a way to check.

## Conclusion

Finish, don't rebuild. The code exists. The gaps are:
1. Configuration (provider credentials)
2. Connectivity (Vercel → Ollama)
3. Hosting (Governor needs persistent Node)

The smallest plan is: prove it works locally on the Mac first (where Ollama already runs), then solve production connectivity with Dexter's explicit decisions.

## E2E Gateway Test — 2026-10-12 20:12 UTC (SUCCESS)

**Test gateway** (minimal, local-only) → Ollama on MacBook Air:
- Health: `{"service":"forgeos-ai-test","status":"ONLINE","ollama":"CONNECTED","models":["llama3.2:1b"]}`
- Chat: `{"provider":"ollama","model":"llama3.2:1b","response":"ForgeOS AI is now connected.","latency_ms":6845}`

**Proven path:** HTTP → fk_ Bearer auth → Ollama /api/generate → llama3.2:1b → JSON response
**Latency:** 6.8s for 1B model inference
**Note:** Model paraphrased ("is now connected" vs "connected") — consistent with known 1B instruction-following limits.

**Remaining:** Test real gateway.mjs which uses /v1/chat/completions (different from /api/generate). The /v1/models data:null quirk needs verification against /v1/chat/completions.
