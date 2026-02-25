@echo off
REM PEPPER Service Status Checker
REM Quickly check which services are running

echo ============================================
echo  PEPPER - Service Status Check
echo ============================================
echo.

echo Checking services...
echo.

REM Check Python Disease Detection API (Port 5002)
echo [Python API - Port 5002]
netstat -ano | findstr ":5002" >nul 2>&1
if %errorlevel% equ 0 (
    echo Status: ✓ RUNNING
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5002" ^| findstr "LISTENING"') do (
        echo PID: %%a
    )
) else (
    echo Status: ✗ NOT RUNNING
    echo.
    echo To start: .\START_ALL_SERVICES.bat
)

echo.
echo ============================================
echo.

REM Check Node.js Backend (Port 5000)
echo [Node.js Backend - Port 5000]
netstat -ano | findstr ":5000" >nul 2>&1
if %errorlevel% equ 0 (
    echo Status: ✓ RUNNING
) else (
    echo Status: ✗ NOT RUNNING
    echo To start: cd backend ^&^& npm start
)

echo.
echo ============================================
echo.

REM Check React Frontend (Port 3000)
echo [React Frontend - Port 3000]
netstat -ano | findstr ":3000" >nul 2>&1
if %errorlevel% equ 0 (
    echo Status: ✓ RUNNING
) else (
    echo Status: ✗ NOT RUNNING
    echo To start: cd frontend ^&^& npm start
)

echo.
echo ============================================
echo.

REM Check MongoDB (Port 27017)
echo [MongoDB - Port 27017]
netstat -ano | findstr ":27017" >nul 2>&1
if %errorlevel% equ 0 (
    echo Status: ✓ RUNNING
) else (
    echo Status: ✗ NOT RUNNING
    echo To start: net start MongoDB
)

echo.
echo ============================================
echo.
echo Press any key to exit...
pause >nul
