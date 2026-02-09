# PowerShell script to start both Frontend and Backend services
# Run this script from the root directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting AI Medical Center Services" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory (absolute path)
$scriptRoot = if ($PSScriptRoot) { 
    $PSScriptRoot 
} else { 
    Split-Path -Parent $MyInvocation.MyCommand.Path 
}

# Ensure we have absolute path
if (-not [System.IO.Path]::IsPathRooted($scriptRoot)) {
    $scriptRoot = Join-Path (Get-Location) $scriptRoot
    $scriptRoot = (Resolve-Path $scriptRoot).Path
}

Write-Host "Script Root: $scriptRoot" -ForegroundColor Gray
Write-Host ""

# Start Backend in a new window
Write-Host "Starting Backend (X-ray API)..." -ForegroundColor Yellow
$backendPath = Join-Path $scriptRoot "services\nv-reason-cxr-api"
if (Test-Path $backendPath) {
    $backendPath = (Resolve-Path $backendPath).Path
    Write-Host "Backend Path: $backendPath" -ForegroundColor Gray
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendPath'; .\start-backend.ps1"
} else {
    Write-Host "ERROR: Backend path not found: $backendPath" -ForegroundColor Red
}

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Frontend in a new window
Write-Host "Starting Frontend (Next.js)..." -ForegroundColor Yellow
$frontendPath = Join-Path $scriptRoot "healt-care"
if (Test-Path $frontendPath) {
    $frontendPath = (Resolve-Path $frontendPath).Path
    Write-Host "Frontend Path: $frontendPath" -ForegroundColor Gray
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendPath'; npm run dev"
} else {
    Write-Host "ERROR: Frontend path not found: $frontendPath" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Services Starting..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Two PowerShell windows will open:" -ForegroundColor Yellow
Write-Host "  1. Backend server (X-ray API)" -ForegroundColor White
Write-Host "  2. Frontend server (Next.js)" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this script (services will continue running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
