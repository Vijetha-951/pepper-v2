@echo off
echo ========================================
echo Starting PEPPER Backend Services
echo ========================================
echo.

echo [1/2] Starting Flask ML Service (Port 5001)...
start "Flask ML Service" cmd /k "cd /d C:\xampp\htdocs\PEPPER\backend\python && python disease_detection_api.py"
timeout /t 3 /nobreak >nul

echo [2/2] Starting Node.js Backend (Port 5000)...
start "Node.js Backend" cmd /k "cd /d C:\xampp\htdocs\PEPPER\backend && node src/server.js"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo Both backends started!
echo ========================================
echo Flask ML API:    http://localhost:5001
echo Node.js API:     http://localhost:5000
echo Frontend:        http://localhost:3000
echo ========================================
echo.
echo Press any key to exit...
pause >nul
