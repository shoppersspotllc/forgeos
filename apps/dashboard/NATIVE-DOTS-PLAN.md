# Option C: Native Dots Runtime in ForgeOS — Implementation Plan

## Goal
Build a native Dots runtime inside ForgeOS, integrated exclusively through ForgeOS AI.
No CopilotKit, no external accounts, no new spending.

## Architecture Inspection (2026-10-13)

### Existing components
| Component | Location | Status |
|-----------|----------|--------|
| Chat API | `apps/dashboard/src/app/api/my-dots/chat/route.ts` | Working, non-streaming |
| Dot personas | `DOT_PERSONAS` in chat route | 6 Dots (Scout, Analyst, Craftsman, Hunter, Shepherd, Closer) |
| Tool execution | `src/lib/capabilities/executor.ts` | Working, capability-gated |
| Tool permissions | `DOT_TOOL_PERMISSIONS` in chat route | Per-Dot allowlist |
| ForgeOS AI backend | `https://forgeos.shoppersspotllc.com/api/forgeos-ai/chat` | Working, OpenAI-compatible |
| Auth | `FORGEOS_MYDOTS_KEY` env var (server-side) | Working |
| Governor | `services/workforce/governor/` | 7 Dots onboarded, 31/31 tests pass |
| Workforce bundles | `services/workforce/*-bundle.mjs` | 5 bundles with tools |

### Gaps for Option C
1. **No streaming** — current API returns complete JSON, UI waits for full response
2. **No thread persistence** — stateless; each request is independent
3. **MediaPilot missing** from `DOT_PERSONAS` (exists in Governor)

## Design Decisions

### 1. Streaming via Server-Sent Events (SSE)
- New endpoint: `POST /api/my-dots/stream`
- Returns `text/event-stream` with `data:` chunks
- Reuses existing tool loop and ForgeOS AI client
- UI renders tokens as they arrive

### 2. Thread persistence via client-side history + localStorage
- **Decision**: Threads stored in browser localStorage, full history sent per request
- **Rationale**: Zero server infrastructure, works on Vercel serverless, survives reloads
- Server remains stateless (scales horizontally, no DB to manage)
- Future: migrate to Vercel KV for cross-device sync (not in slice)

### 3. Auth: existing pattern
- Browser → `/api/my-dots/*` (no key in client)
- Server holds `FORGEOS_MYDOTS_KEY`, calls ForgeOS AI with Bearer
- Rate limiting per IP (existing)

### 4. Tools: existing capability executor
- No changes to tool permissions or executor
- Streaming wraps the existing agentic loop

## Vertical Slice (smallest functional)

### Files to create
1. `apps/dashboard/src/app/api/my-dots/stream/route.ts` — SSE streaming endpoint
   - Accepts: `{ dotName, messages: [{role, content}] }`
   - Streams ForgeOS AI response chunks as SSE
   - Runs tool loop (non-streaming internally), then streams final answer
   - Auth: none needed client-side (server holds key)

2. `apps/dashboard/src/components/views/DotsChatView.tsx` — Chat UI
   - Dot selector (7 Dots from Governor list)
   - Message list with streaming render
   - localStorage thread persistence (per-Dot threads)
   - New thread / switch thread

### Files to modify
1. `apps/dashboard/src/app/api/my-dots/chat/route.ts` — add MediaPilot to DOT_PERSONAS
2. `apps/dashboard/src/components/views/MyDotsView.tsx` — avatar opens DotsChatView (internal)

### Tests
- Typecheck: `npx tsc --noEmit`
- Manual: stream a message, verify tokens arrive incrementally
- Manual: reload page, verify thread history restored from localStorage
- Manual: verify tool-calling Dot (Analyst) still works via stream endpoint

## Out of scope (future slices)
- Vercel KV for server-side thread sync
- Voice input/output
- File attachments
- Multi-user / sharing
- The `/chat/completions` OpenAI-compat endpoint (preserved as reference, not deployed)

## Reference work preserved (not deleted)
- `shoppersspotllc/OpenDots` fork with 5 Intelligence-optional modifications
- `apps/dashboard/src/app/api/forgeos-ai/chat/completions/route.ts` (unpushed)
- Dedicated `fk_` key for OpenDots (generated, not deployed)
