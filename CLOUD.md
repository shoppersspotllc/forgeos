# ForgeOS Cloud Foundation

**Principle:** Cloud = permanent. Devices = disposable workers.

The ForgeOS source of truth lives in GitHub. Development happens in cloud
workspaces (GitHub Codespaces). Physical machines (MacBook, Windows PC,
iPhone) are optional clients — never the permanent home.

## Quick Start (any device)

1. Open https://github.com/usaaboo75/forgeos
2. Click **Code → Codespaces → Create codespace**
3. Wait for the devcontainer to build (Node 20, dependencies auto-installed)
4. Run the dashboard:
   ```bash
   cd apps/dashboard
   npm run dev
   ```
5. Open the forwarded port 3000 in your browser

No machine-specific paths. No localhost dependencies in architecture.
No Windows-only or Mac-only assumptions.

## Repository Layout

| Path | Purpose | Runtime |
|------|---------|---------|
| `apps/dashboard` | Next.js 16 dashboard (UI + API routes) | Node 20 server (`next start`) |
| `services/forgeos-ai` | AI provider gateway | Node 20 (`gateway.mjs`, port 8788) |
| `services/terminal` | WebSocket terminal server | Node 20 |
| `services/workforce` | Dot agent workforce | Node 20 |
| `services/local-worker` | **Device-only** paired worker (not cloud) | Windows/Mac local |

## What Needs a Persistent Backend

The dashboard has 10 API routes — it **cannot** be statically exported.
It requires a Node.js server (`next start`) or a compatible host (Vercel).

- Dashboard API routes → need Next.js server
- `services/forgeos-ai/gateway.mjs` → port 8788 (optional, degrades honestly)
- `services/terminal/server.mjs` → WebSocket (optional)

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on every push/PR to `main`:
- `npm ci`
- `npx tsc --noEmit` (typecheck)
- `npm run build`

## Production Deployment

Vercel project `forgeos-command-center` is linked to this repo.
**Current status:** deployments BLOCKED by a Vercel team configuration
issue — requires owner action in the Vercel dashboard (Team Settings).

Domain: `forgeos.shoppersspotllc.com` → Vercel.

## Device Independence

- ForgeOS source: GitHub (permanent)
- Development: GitHub Codespaces (permanent, disposable)
- Production: Vercel/cloud hosting (permanent)
- Windows Local Worker: optional paired device worker (disposable)
- If all physical machines are OFF: source is safe in GitHub,
  production stays up on Vercel, development resumes in any browser
  via Codespaces.

## God's Eye

Independent Vite application. **Not** merged into ForgeOS source.
Ships as a static `dist/` build (`npm run build` in the gods-eye-view repo).
Target: `https://godseye.shoppersspotllc.com` (DNS not yet configured).
ForgeOS dashboard launches it via navigation link.
