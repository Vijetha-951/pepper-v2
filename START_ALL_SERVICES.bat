@echo off
REM PEPPER - Quick Start All Services
REM Run this once when you start working

echo ============================================
echo  PEPPER - Starting All Services
echo ============================================
echo.

REM Start Python Disease Detection API in a new window
echo [1/1] Starting Disease Detection API...
start "Disease Detection API" cmd /k "cd /d %~dp0backend\python && python disease_detection_api.py"

timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo  All Services Started!
echo ============================================
echo.
echo Python Disease Detection API: http://localhost:5002
echo.
echo Keep the Python API window open!
echo Close this window only - keep API window running.
echo.
pause
