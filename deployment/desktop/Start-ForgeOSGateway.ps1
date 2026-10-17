<#
.SYNOPSIS
  Starts the ForgeOS AI Gateway on Windows (port 8788).
  Run this BEFORE Deploy-ForgeOSDashboard.ps1.
.DESCRIPTION
  1. Verifies Node.js is installed.
  2. Verifies the gateway source exists.
  3. Prompts securely for FORGEOS_OPENROUTER_KEY and FORGEOS_SERVICE_KEYS.
  4. Starts the gateway as a background process on 127.0.0.1:8788.
.NOTES
  - The gateway must be running before the dashboard can be deployed.
  - Keep this window open or use Start-Process to run in background.
  - To stop: find the node process and stop it, or close the window.
#>
$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$GatewayDir = Join-Path $RepoRoot 'services\forgeos-ai'
$GatewayScript = Join-Path $GatewayDir 'gateway.mjs'

Write-Host '=== ForgeOS AI Gateway Startup ===' -ForegroundColor Cyan
Write-Host ''

# --- 1. Prerequisites ---
Write-Host '[1/3] Checking prerequisites...' -ForegroundColor Yellow

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) { throw 'Node.js not found. Install Node.js LTS first.' }
Write-Host "  Node.js: $(node --version)" -ForegroundColor Green

if (-not (Test-Path $GatewayScript)) {
    throw "Gateway not found at $GatewayScript. Clone the forgeos repo first."
}
Write-Host '  Gateway source: OK' -ForegroundColor Green

# Check if port 8788 is already in use
try {
    $tcp = New-Object Net.Sockets.TcpClient
    $iar = $tcp.BeginConnect('127.0.0.1', 8788, $null, $null)
    $inUse = $iar.AsyncWaitHandle.WaitOne(2000)
    $tcp.Close()
    if ($inUse) {
        Write-Host '  Port 8788: ALREADY IN USE (gateway may already be running)' -ForegroundColor Yellow
        $resp = Read-Host '  Continue anyway? (y/N)'
        if ($resp -ne 'y' -and $resp -ne 'Y') { exit 0 }
    } else {
        Write-Host '  Port 8788: available' -ForegroundColor Green
    }
} catch {
    Write-Host '  Port 8788: available' -ForegroundColor Green
}

# --- 2. Secure env var prompts ---
Write-Host ''
Write-Host '[2/3] Collecting configuration (secrets never displayed)...' -ForegroundColor Yellow

function Read-Secret($prompt) {
    $sec = Read-Host -Prompt $prompt -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
    try { $val = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
    return $val
}

$openrouterKey = Read-Secret '  FORGEOS_OPENROUTER_KEY (required for AI)'
if ([string]::IsNullOrWhiteSpace($openrouterKey)) { throw 'FORGEOS_OPENROUTER_KEY is required.' }

$serviceKeys = Read-Secret '  FORGEOS_SERVICE_KEYS (JSON, required for auth)'
if ([string]::IsNullOrWhiteSpace($serviceKeys)) { throw 'FORGEOS_SERVICE_KEYS is required.' }

$adminToken = Read-Secret '  FORGEOS_ADMIN_TOKEN (required)'
if ([string]::IsNullOrWhiteSpace($adminToken)) { throw 'FORGEOS_ADMIN_TOKEN is required.' }

$gwAdminToken = Read-Secret '  FORGEOS_GATEWAY_ADMIN_TOKEN (required for key issuance)'
if ([string]::IsNullOrWhiteSpace($gwAdminToken)) { throw 'FORGEOS_GATEWAY_ADMIN_TOKEN is required.' }

# --- 3. Start gateway ---
Write-Host ''
Write-Host '[3/3] Starting gateway on 127.0.0.1:8788...' -ForegroundColor Yellow

$env:FORGEOS_OPENROUTER_KEY = $openrouterKey
$env:FORGEOS_SERVICE_KEYS = $serviceKeys
$env:FORGEOS_ADMIN_TOKEN = $adminToken
$env:FORGEOS_GATEWAY_ADMIN_TOKEN = $gwAdminToken
$env:PORT = '8788'
$env:HOST = '127.0.0.1'

# Clear from variables (still in env for the child process)
$openrouterKey = $serviceKeys = $adminToken = $gwAdminToken = $null
[GC]::Collect()

Push-Location $GatewayDir
try {
    Write-Host '  Gateway starting... (Ctrl+C to stop)' -ForegroundColor Green
    Write-Host '  Health check: http://127.0.0.1:8788/health' -ForegroundColor Gray
    Write-Host ''
    node gateway.mjs
} finally {
    Pop-Location
}
