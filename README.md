# ForgeOS v2.0 — Portable AI Agent Factory

Rebuilt from complete architectural recall. Portable, modular, secure, scalable.

## Quick Start

```bash
# Local development
cd apps/dashboard
npm install
npm run dev        # http://localhost:3000

# Production
npm run build
npm run start      # http://localhost:3456

# Docker (full stack)
docker-compose up -d
```

## Architecture

```
FORGEOS CONTROL PLANE (this repo)
├── apps/dashboard      # Next.js Command Center
├── services/           # terminal, forgeos-ai, workforce
├── capabilities/       # Capability manifests
├── config/             # Portable config (.env.example)
└── data/               # Runtime data (gitignored)
```

## Capability Registry

Single discovery layer at `/api/capabilities`. Agents query to discover available capabilities.

| Capability | Status |
|---|---|
| Colibrì (Ollama) | Auto-detected |
| Ruflo v3.54.0 | Available |
| ForgeOS AI | Available |
| OpenCode / Claude Code | Available |
| GitHub | Available |
| Google Drive | Setup required (OAuth) |
| **Canva** | **Setup required (OAuth) — first-class creative** |
| Skills (coding, webdev, devops, research) | Available |

## Canva Integration

Canva is a first-class creative capability in the ForgeOS ecosystem:
- Registered in Capability Registry as `creative` category
- Connector pattern (OAuth via ForgeOS auth, no duplicate credentials)
- Dots, OpenCode, Claude Code discover via `/api/capabilities`
- Media Engine consumes Canva assets in pipelines
- View at: Platforms → Canva

## Portability

- No hardcoded paths — all via `$FORGEOS_HOME` and env vars
- `docker-compose.yml` runs full stack on any machine
- Config in `config/`, secrets in `.env` (gitignored)
- Identity preserved: `https://mcp.shoppersspotllc.com/`

## What's Working

- ✅ Dashboard with full navigation (Primary, Platforms, Power Trails)
- ✅ Capability Registry API (12 capabilities, 10 available)
- ✅ Colibrì status API (auto-detects Ollama, honest offline state)
- ✅ Canva view (architecture documented, OAuth pending owner)
- ✅ TypeScript clean, production build succeeds

## What's Staged (Needs VPS Data or Owner Action)

- ⏳ Young Money / God's Eye / Position AI views (need Baxter state data)
- ⏳ My Dots (needs OpenDots workforce)
- ⏳ Terminal PTY server (code ready, needs deployment)
- ⏳ ForgeOS AI gateway (needs provider credentials)
- ⏳ Google Drive / Canva OAuth (needs owner authorization)

## Migration from VPS

When VPS recovers, Phase 0: `git commit` uncommitted work → push to private GitHub → copy data dirs → import here.
