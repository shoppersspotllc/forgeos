# ForgeOS Desktop Dashboard Migration — Execution Guide
#
# Target: desktop-fkjdg5q (Windows 11, Docker Desktop)
# Date prepared: 2026-10-15
# Security fixes: COMPLETE on main @ 616680f
# - Round 1 (10812fb): deploy/publish, medium, pinterest, tasks, fix-deploy
# - Round 2 (616680f): providers/check, github/analyze, revenue/stats, rate limiter
#
# SECURITY: Tailscale-only until the desktop is running the fixed code (616680f).
# Do NOT create a Cloudflare Tunnel route for the dashboard until then.

## Prerequisites (on desktop-fkjdg5q)

- [ ] Docker Desktop installed and running (WSL2 backend)
- [ ] Gateway running on http://127.0.0.1:8788 (existing Node process — do not stop)
- [ ] Ollama running on http://127.0.0.1:11434 (existing — do not stop)
- [ ] Local Worker healthy on :3460 (existing — do not touch)
- [ ] Git repo at C:\Users\<you>\forgeos (or your checkout path) on `main` branch

## Step 1: Prepare environment file

1. Copy `.env.desktop.template` to `.env.desktop`
2. Get values from Vercel: dashboard → forgeos project → Settings → Environment Variables → Production
3. Fill in:
   - FORGEOS_ADMIN_TOKEN
   - FORGEOS_GATEWAY_ADMIN_TOKEN
   - FORGEOS_MYDOTS_KEY, FORGEOS_PINDROP_KEY, FORGEOS_POSITION_AI_KEY, FORGEOS_QUANT_KEY
   - GOVERNOR_API_TOKEN
   - (Optional) GITHUB_TOKEN, MEDIUM_TOKEN, PINTEREST_ACCESS_TOKEN
4. Verify `.env.desktop` is NOT committed: `git status` should not show it

## Step 2: Build and start

```powershell
# In the forgeos repo root:
docker compose -f docker-compose.yml -f ..\forgeos-desktop-migration\docker-compose.desktop.yml --env-file ..\\forgeos-desktop-migration\\.env.desktop up -d --build
```

Expected: dashboard container builds (~2-3 min first time), starts on 127.0.0.1:3456.

## Step 3: Verify (on desktop)

```powershell
# Dashboard health (via localhost)
curl http://127.0.0.1:3456/api/forgeos-ai/health

# Dashboard → gateway internal connectivity
# (Open http://127.0.0.1:3456 in browser, go to ForgeAI → Provider Hub)
# Provider cards should show real status from the local gateway

# Container health
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## Step 4: Verify via Tailscale (from MacBook or phone)

```
http://100.104.110.68:3456/api/forgeos-ai/health
```

Should return 200. If not, check Windows Firewall allows 3456 on the Tailscale interface.

## Step 5: Acceptance tests

- [ ] Dashboard loads at http://100.104.110.68:3456 (via Tailscale)
- [ ] Provider Hub shows real provider status (not mocked)
- [ ] Real Ollama inference: My Dots → Scout → send a test message, verify real AI response
- [ ] Admin endpoints reject without token: `curl -X POST http://100.104.110.68:3456/api/deploy/publish` → 403
- [ ] Restart test: `docker restart <dashboard-container>`, verify it comes back healthy
- [ ] Reboot test: restart desktop, verify `restart: unless-stopped` brings dashboard back
- [ ] Gateway still healthy on :8788 (untouched)
- [ ] Local Worker still healthy on :3460 (untouched)
- [ ] Confirm NO tunnel route exists for :8788 or :3460

## Step 6: When ready for public tunnel (AFTER security fixes)

1. Complete all fixes in SECURITY_FIXES_REQUIRED.md
2. Verify each fixed endpoint returns 403 without token
3. Then create tunnel route: `forgeos.shoppersspotllc.com` → `http://127.0.0.1:3456`
4. Do NOT create routes for :8788 or :3460

## Rollback

Vercel deployment is untouched. If desktop dashboard fails:
1. `docker compose -f docker-compose.yml -f docker-compose.desktop.yml down`
2. Use https://forgeos.shoppersspotllc.com (Vercel) — still live
3. No DNS changes were made, no data was migrated

## Files in this package

- `docker-compose.desktop.yml` — Docker override (Tailscale-only networking)
- `.env.desktop.template` — Environment template (copy to .env.desktop, fill from Vercel)
- `SECURITY_FIXES_REQUIRED.md` — Auth gaps: 5 FIXED (commit a680853, merged 10812fb), 4 additional findings reported
- `MIGRATION_GUIDE.md` — Full step-by-step guide
- `DESKTOP_DEPLOY.sh` — Quick-start commands for the desktop (merged code @ 10812fb)
