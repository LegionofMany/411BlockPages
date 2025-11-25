Param()

function Write-Ok($m){ Write-Host $m -ForegroundColor Green }
function Write-Warn($m){ Write-Host $m -ForegroundColor Yellow }
function Write-Err($m){ Write-Host $m -ForegroundColor Red }

# Determine project root: prefer current working directory if it contains package.json,
# otherwise use the script's parent directory's parent (project root when script lives in scripts/)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$candidateRoot = Split-Path -Parent $scriptDir
if (Test-Path (Join-Path (Get-Location) 'package.json')) {
  $root = (Get-Location).ProviderPath
} else {
  $root = $candidateRoot
}
Set-Location $root

if (-not (Test-Path package.json)) {
  Write-Err "package.json not found in current directory: $root. Run this script from the project root.";
  exit 1
}

Write-Host "This script will: clean npm cache, remove node_modules and package-lock.json, reinstall dependencies, run SWC loader test, then start dev with polling."
Write-Host "Proceed? (Y/N)"
$c = Read-Host
if ($c.ToUpper() -ne 'Y') { Write-Warn "Aborted by user."; exit 0 }

try{
  Write-Host "Cleaning npm cache..."
  npm cache clean --force
  Write-Ok "npm cache cleaned."
} catch {
  Write-Warn "npm cache clean failed: $_"
}

if (Test-Path node_modules) {
  Write-Host "Removing node_modules..."
  Remove-Item -Recurse -Force node_modules
  Write-Ok "node_modules removed."
} else { Write-Warn "node_modules not present." }

if (Test-Path package-lock.json) {
  Write-Host "Removing package-lock.json..."
  Remove-Item -Force package-lock.json
  Write-Ok "package-lock.json removed."
} else { Write-Warn "package-lock.json not present." }

Write-Host "Installing dependencies (this may take a few minutes)..."
$rc = & npm install
if ($LASTEXITCODE -ne 0) { Write-Err "npm install failed. See output above."; exit $LASTEXITCODE }
Write-Ok "npm install completed."

Write-Host "Running SWC native loader test..."
& node scripts/test_swc_load.js
if ($LASTEXITCODE -ne 0) { Write-Warn "SWC loader test reported an error. You may need to install the Visual C++ Redistributable (x64) or run on WSL2." }
else { Write-Ok "SWC loader test passed." }

Write-Host "Starting dev server with watch polling (press Ctrl+C to stop)..."
& npm run dev:poll
