# ForgeOS AI — Integration Contract

**ForgeOS AI is the ONLY intelligence gateway.** No component calls providers directly.

## Architecture

```
USER → MUSE → RUFLO → CAPABILITY REGISTRY → FORGEOS AI → provider → DOT/WORKER
```

## Integration Rules

1. **All intelligence requests** (chat, completions, embeddings) go through ForgeOS AI
2. **Health/status probes** may be direct (infrastructure, not intelligence)
3. **No duplicate gateways** — one gateway, one ProviderPool
4. **Credentials** enter via `FORGEOS_<ID>_KEY` env vars or `services/forgeos-ai/secrets/<id>.env`
5. **Never expose credentials** in APIs, logs, or responses

## Client Libraries

| Component | Client | Import |
|---|---|---|
| Node.js services | `client.mjs` | `import { forgeosAI } from '../forgeos-ai/client.mjs'` |
| Dashboard (TS) | `forgeos-ai-client.ts` | `import { forgeosChat } from '@/lib/forgeos-ai-client'` |
| Dots/Workforce | `dot-agent.mjs` | `import { DotAgent } from './dot-agent.mjs'` |

## Capability-Aware Routing

Request a capability; ForgeOS AI routes to the best available provider:

| Capability | Use for |
|---|---|
| `chat` | General chat/reasoning (default) |
| `coding` | Code generation, debugging |
| `fast` | Fast/lightweight tasks |
| `embeddings` | Text embeddings |
| `vision` | Image understanding |
| `audio` | Audio transcription |

```javascript
// Node.js
const result = await forgeosAI.chat(
  [{ role: 'user', content: 'Hello' }],
  { capability: 'coding' }  // Routes to best coding-capable provider
);

// TypeScript (dashboard)
const result = await forgeosChat(
  [{ role: 'user', content: 'Hello' }],
  { capability: Capabilities.CODING }
);
```

## Fallback Behavior

1. Preferred provider (if specified and available)
2. Priority-ordered eligible providers (OpenRouter → OmniRoute → Ollama)
3. Circuit-open providers are skipped
4. If all fail → honest 503 `{"error": "All providers unavailable"}`

**Never fabricated.** If no provider can serve, the error is explicit and machine-readable.

## Authentication

- **Gateway**: No auth required for local dashboard (binds to 127.0.0.1)
- **Providers**: Credentials in vault, never in code or APIs
- **Dashboard proxy**: Forwards to gateway, no credential handling

## Health Probes vs Intelligence

| Type | Example | May bypass gateway? |
|---|---|---|
| Intelligence | `POST /v1/chat/completions` | **NO** — must use ForgeOS AI |
| Health probe | `GET /api/colibri/status` | YES — infrastructure check |
| Registry probe | `GET /api/capabilities` | YES — infrastructure check |

Health probes check *if* a service is running. Intelligence requests *use* a service to think.
Only intelligence must go through the gateway.

## Adding a Provider

1. Add credential: `FORGEOS_<ID>_KEY` env var or `services/forgeos-ai/secrets/<id>.env`
2. Register (if custom): `POST /providers/register { id, label, baseUrl }`
3. Health check: `POST /providers/check` or click in Forge AI view
4. Verify: `GET /providers` shows CONNECTED

Do NOT activate paid providers without owner approval.
