# PowerShell script to cleanly start PEPPER application
# This script kills any existing processes on ports 3000 and 5000 before starting

Write-Host "🧹 Cleaning up existing processes..." -ForegroundColor Yellow

# Kill processes on port 3000 (Frontend)
$frontend = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($frontend) {
    Write-Host "   Stopping process on port 3000..." -ForegroundColor Red
    Stop-Process -Id $frontend.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Kill processes on port 5000 (Backend)
$backend = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($backend) {
    Write-Host "   Stopping process on port 5000..." -ForegroundColor Red
    Stop-Process -Id $backend.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host "✅ Ports 3000 and 5000 are now available" -ForegroundColor Green

# Start the application
Write-Host "🚀 Starting PEPPER application..." -ForegroundColor Cyan
npm run dev