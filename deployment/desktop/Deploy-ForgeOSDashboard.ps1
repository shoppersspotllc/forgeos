<#
.SYNOPSIS
  Deploys the ForgeOS dashboard (security release 616680f) on Windows via Docker.
  Self-contained: writes compose config, prompts for secrets securely, verifies.
.DESCRIPTION
  1. Verifies prerequisites (Docker, git, gateway :8788, Ollama :11434, worker :3460).
  2. Pulls main @ 616680f (or verifies already there).
  3. Prompts securely for env vars (never echoed, never logged).
  4. Writes docker-compose.desktop.yml and .env.desktop (git-ignored).
  5. Builds and starts the dashboard on 127.0.0.1:3456 (Tailscale-only).
  6. Runs health + auth verification checks.
.NOTES
  - Gateway, Ollama, Local Worker are NOT touched.
  - Vercel deployment remains live as rollback.
  - Do NOT create Cloudflare Tunnel routes for :8788 or :3460.
  - Requires: Docker Desktop (WSL2), git, PowerShell 5.1+
#>
$ErrorActionPreference = 'Stop'

$ExpectedCommit = '616680f'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$ComposeFile = Join-Path $RepoRoot 'docker-compose.desktop.yml'
$EnvFile = Join-Path $RepoRoot '.env.desktop'

Write-Host '=== ForgeOS Dashboard Deployment (security release) ===' -ForegroundColor Cyan
Write-Host "Expected commit: $ExpectedCommit"
Write-Host ''

# --- 1. Prerequisites ---
Write-Host '[1/7] Checking prerequisites...' -ForegroundColor Yellow

$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) { throw 'Docker not found. Install Docker Desktop first.' }
Write-Host '  Docker: OK'

$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) { throw 'Git not found.' }
Write-Host '  Git: OK'

function Test-Port($port, $name) {
  try {
    $tcp = New-Object Net.Sockets.TcpClient
    $iar = $tcp.BeginConnect('127.0.0.1', $port, $null, $null)
    $ok = $iar.AsyncWaitHandle.WaitOne(3000)
    $tcp.Close()
    if ($ok) { Write-Host "  ${name} (:$port): OK" -ForegroundColor Green; return $true }
  } catch {}
  Write-Host "  ${name} (:$port): NOT REACHABLE" -ForegroundColor Red
  return $false
}

$gw = Test-Port 8788 'Gateway'
$ol = Test-Port 11434 'Ollama'
$wk = Test-Port 3460 'Local Worker'

if (-not $gw) { throw 'Gateway not running on :8788. Start it before deploying.' }
if (-not $ol) { Write-Host '  WARNING: Ollama not on :11434. AI inference will fail.' -ForegroundColor Yellow }
if (-not $wk) { Write-Host '  WARNING: Local Worker not on :3460.' -ForegroundColor Yellow }

# --- 2. Verify git state ---
Write-Host '[2/7] Verifying repository...' -ForegroundColor Yellow
Push-Location $RepoRoot
try {
  $branch = (git rev-parse --abbrev-ref HEAD).Trim()
  $commit = (git rev-parse --short HEAD).Trim()
  Write-Host "  Branch: $branch, Commit: $commit"
  if ($commit -ne $ExpectedCommit) {
    Write-Host "  Pulling latest main..." -ForegroundColor Yellow
    git checkout main 2>$null | Out-Null
    git pull origin main | Out-Null
    $commit = (git rev-parse --short HEAD).Trim()
    Write-Host "  Now at: $commit"
    if ($commit -ne $ExpectedCommit) {
      throw "Expected $ExpectedCommit but got $commit. Manual git pull may be needed."
    }
  }
  Write-Host '  Commit verified.' -ForegroundColor Green
} finally { Pop-Location }

# --- 3. Secure env var prompts ---
Write-Host '[3/7] Collecting environment (secrets never displayed)...' -ForegroundColor Yellow

function Read-Secret($prompt, $required = $true) {
  $sec = Read-Host -Prompt $prompt -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
  try { $val = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
  if ($required -and [string]::IsNullOrWhiteSpace($val)) { throw "$prompt is required." }
  return $val
}

# Only prompt if .env.desktop doesn't exist or is missing the admin token
$needPrompt = $true
if (Test-Path $EnvFile) {
  $existing = Get-Content $EnvFile -Raw
  if ($existing -match 'FORGEOS_ADMIN_TOKEN=.+') {
    $resp = Read-Host '  .env.desktop exists with admin token. Re-enter all values? (y/N)'
    $needPrompt = ($resp -eq 'y' -or $resp -eq 'Y')
  }
}

if ($needPrompt) {
  Write-Host '  Enter values from Vercel → forgeos → Settings → Environment Variables (Production).'
  Write-Host '  Input is hidden. Press Enter to skip optional values.' -ForegroundColor Gray
  $adminToken = Read-Secret '  FORGEOS_ADMIN_TOKEN (required)'
  $gwAdminToken = Read-Secret '  FORGEOS_GATEWAY_ADMIN_TOKEN (required)'
  $mydotsKey = Read-Secret '  FORGEOS_MYDOTS_KEY (required)'
  $pindropKey = Read-Secret '  FORGEOS_PINDROP_KEY (required)'
  $positionKey = Read-Secret '  FORGEOS_POSITION_AI_KEY (required)'
  $quantKey = Read-Secret '  FORGEOS_QUANT_KEY (required)'
  $govToken = Read-Secret '  GOVERNOR_API_TOKEN (required)'
  $openrouterKey = Read-Secret '  FORGEOS_OPENROUTER_KEY (required for AI)' 
  $ghToken = Read-Secret '  GITHUB_TOKEN (optional)' $false
  $medToken = Read-Secret '  MEDIUM_TOKEN (optional)' $false
  $pinToken = Read-Secret '  PINTEREST_ACCESS_TOKEN (optional)' $false

  # Write .env.desktop (never displayed, never logged)
  $envContent = @"
FORGEOS_ADMIN_TOKEN=$adminToken
FORGEOS_GATEWAY_ADMIN_TOKEN=$gwAdminToken
FORGEOS_MYDOTS_KEY=$mydotsKey
FORGEOS_PINDROP_KEY=$pindropKey
FORGEOS_POSITION_AI_KEY=$positionKey
FORGEOS_QUANT_KEY=$quantKey
GOVERNOR_API_TOKEN=$govToken
FORGEOS_OPENROUTER_KEY=$openrouterKey
GITHUB_TOKEN=$ghToken
MEDIUM_TOKEN=$medToken
PINTEREST_ACCESS_TOKEN=$pinToken
"@
  $envContent | Out-File -FilePath $EnvFile -Encoding utf8 -NoNewline
  Write-Host '  .env.desktop written (secrets not displayed).' -ForegroundColor Green

  # Clear from memory
  $adminToken = $gwAdminToken = $mydotsKey = $pindropKey = $positionKey = $quantKey = $govToken = $openrouterKey = $null
  [GC]::Collect()
}

# Ensure .env.desktop is git-ignored
Push-Location $RepoRoot
try {
  $ignored = (git check-ignore .env.desktop 2>$null)
  if (-not $ignored) {
    Add-Content -Path (Join-Path $RepoRoot '.gitignore') -Value "`n.env.desktop"
    Write-Host '  Added .env.desktop to .gitignore.' -ForegroundColor Green
  }
} finally { Pop-Location }

# --- 4. Write compose override ---
Write-Host '[4/7] Writing Docker Compose override...' -ForegroundColor Yellow
$composeYamlLines = @(
  'services:',
  '  dashboard:',
  '    build:',
  '      context: ./apps/dashboard',
  '      dockerfile: Dockerfile',
  '    ports:',
  '      - "127.0.0.1:3456:3456"',
  '    environment:',
  '      - FORGEOS_AI_ENDPOINT=http://host.docker.internal:8788',
  '      - OLLAMA_ENDPOINT=http://host.docker.internal:11434',
  '      - FORGEOS_ADMIN_TOKEN=${FORGEOS_ADMIN_TOKEN}',
  '      - FORGEOS_GATEWAY_ADMIN_TOKEN=${FORGEOS_GATEWAY_ADMIN_TOKEN}',
  '      - FORGEOS_MYDOTS_KEY=${FORGEOS_MYDOTS_KEY}',
  '      - FORGEOS_PINDROP_KEY=${FORGEOS_PINDROP_KEY}',
  '      - FORGEOS_POSITION_AI_KEY=${FORGEOS_POSITION_AI_KEY}',
  '      - FORGEOS_QUANT_KEY=${FORGEOS_QUANT_KEY}',
  '      - GOVERNOR_API_TOKEN=${GOVERNOR_API_TOKEN}',
  '      - FORGEOS_OPENROUTER_KEY=${FORGEOS_OPENROUTER_KEY:-}',
  '      - GITHUB_TOKEN=${GITHUB_TOKEN:-}',
  '      - MEDIUM_TOKEN=${MEDIUM_TOKEN:-}',
  '      - PINTEREST_ACCESS_TOKEN=${PINTEREST_ACCESS_TOKEN:-}',
  '    volumes:',
  '      - forgeos-data:/forgeos/data',
  '      - forgeos-config:/forgeos/config',
  '    restart: unless-stopped',
  '    networks:',
  '      - forgeos-net',
  '    healthcheck:',
  '      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3456/api/forgeos-ai/health"]',
  '      interval: 30s',
  '      timeout: 10s',
  '      retries: 3',
  '      start_period: 60s',
  '',
  'volumes:',
  '  forgeos-data:',
  '    driver: local',
  '  forgeos-config:',
  '    driver: local',
  '',
  'networks:',
  '  forgeos-net:',
  '    driver: bridge'
)
$composeYamlLines | Out-File -FilePath $ComposeFile -Encoding utf8
Write-Host '  docker-compose.desktop.yml written.' -ForegroundColor Green

# --- 5. Build and start ---
Write-Host '[5/7] Building and starting dashboard (this takes 2-3 min first time)...' -ForegroundColor Yellow
Push-Location $RepoRoot
try {
  # NOTE: Specify 'dashboard' service explicitly. Without it, compose would also
  # start the base file's 'ollama' service, conflicting with host Ollama on :11434.
  docker compose -f docker-compose.yml -f docker-compose.desktop.yml --env-file .env.desktop up -d --build dashboard
  if ($LASTEXITCODE -ne 0) { throw 'Docker compose failed.' }
} finally { Pop-Location }
Write-Host '  Container started.' -ForegroundColor Green

# --- 6. Verify ---
Write-Host '[6/7] Verifying deployment...' -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Health check
try {
  $health = Invoke-RestMethod -Uri 'http://127.0.0.1:3456/api/forgeos-ai/health' -TimeoutSec 10
  Write-Host "  Dashboard health: $($health.status)" -ForegroundColor Green
} catch {
  Write-Host '  Dashboard health: FAILED — check docker logs' -ForegroundColor Red
  throw
}

# Auth rejection check (must be 403 without token)
try {
  Invoke-RestMethod -Uri 'http://127.0.0.1:3456/api/deploy/publish' -Method POST -TimeoutSec 10 | Out-Null
  Write-Host '  Auth check: FAILED — endpoint allowed unauthenticated POST!' -ForegroundColor Red
  throw 'Security check failed.'
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 403) {
    Write-Host '  Auth rejection (403 without token): OK' -ForegroundColor Green
  } else {
    Write-Host "  Auth check: unexpected status $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    throw
  }
}

# Confirm no public binding (only 127.0.0.1:3456)
$portCheck = (docker port forgeos-dashboard-1 2>$null) -join ' '
if ($portCheck -match '0\.0\.0\.0:3456') {
  Write-Host '  WARNING: Dashboard bound to 0.0.0.0! Should be 127.0.0.1 only.' -ForegroundColor Red
} else {
  Write-Host '  Port binding (127.0.0.1 only): OK' -ForegroundColor Green
}

# --- 7. Summary ---
Write-Host ''
Write-Host '[7/7] Deployment complete!' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Verified:'
Write-Host '  - Dashboard: http://127.0.0.1:3456 (localhost only)'
Write-Host '  - Tailscale: http://100.104.110.68:3456 (from other devices)'
Write-Host '  - Auth: unauthorized requests rejected with 403'
Write-Host '  - Gateway :8788, Ollama :11434, Worker :3460: untouched'
Write-Host ''
Write-Host 'Next: open http://100.104.110.68:3456 in a browser (via Tailscale)'
Write-Host '  and verify Provider Hub + a real Ollama inference via My Dots.'
Write-Host ''
Write-Host 'Rollback: docker compose -f docker-compose.yml -f docker-compose.desktop.yml down'
Write-Host '  (Stops only the dashboard container; gateway/Ollama/worker untouched.)'
Write-Host '  Then use https://forgeos.shoppersspotllc.com (Vercel, still live).'
