# PEPPER Application Startup Script
# This script ensures clean startup without port conflicts

Write-Host "🌶️  PEPPER Application Startup" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta

# Function to kill processes on specific ports
function Stop-ProcessOnPort {
    param([int]$Port, [string]$ServiceName)
    
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connections) {
        $processes = $connections | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($process in $processes) {
            Write-Host "   🛑 Stopping $ServiceName process (PID: $process) on port $Port" -ForegroundColor Red
            Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 2
    }
}

Write-Host "🧹 Cleaning up existing processes..." -ForegroundColor Yellow

# Clean up ports
Stop-ProcessOnPort -Port 3000 -ServiceName "Frontend"
Stop-ProcessOnPort -Port 5000 -ServiceName "Backend"

Write-Host "✅ Ports 3000 and 5000 are now available" -ForegroundColor Green

# Set environment variables to ensure correct ports
$env:PORT = "5000"  # For backend
$env:REACT_APP_PORT = "3000"  # For frontend

Write-Host "🚀 Starting Backend Server (Port 5000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-Command", "cd 'c:\xampp\htdocs\PEPPER\backend'; `$env:PORT='5000'; npm run dev" -WindowStyle Minimized

Start-Sleep -Seconds 5

Write-Host "🎨 Starting Frontend Development Server (Port 3000)..." -ForegroundColor Blue  
Start-Process powershell -ArgumentList "-Command", "cd 'c:\xampp\htdocs\PEPPER\frontend'; `$env:PORT='3000'; npm start" -WindowStyle Minimized

Start-Sleep -Seconds 3

Write-Host "🔍 Checking server status..." -ForegroundColor Yellow

$backendRunning = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
$frontendRunning = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue

if ($backendRunning) {
    Write-Host "   ✅ Backend running on http://localhost:5000" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend failed to start" -ForegroundColor Red
}

if ($frontendRunning) {
    Write-Host "   ✅ Frontend running on http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "   ❌ Frontend failed to start" -ForegroundColor Red
}

Write-Host "`n🎉 PEPPER Application is ready!" -ForegroundColor Green
Write-Host "   🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   🔧 Backend API: http://localhost:5000/api" -ForegroundColor Cyan
Write-Host "   📊 Health Check: http://localhost:5000/api/health" -ForegroundColor Cyan

Write-Host "`n⚡ Quick Commands:" -ForegroundColor Yellow
Write-Host "   To stop all processes: Get-Process -Name 'node' | Stop-Process -Force" -ForegroundColor Gray
Write-Host "   To restart: Run this script again" -ForegroundColor Gray

Read-Host -Prompt "`nPress Enter to exit this window (servers will continue running in background)"