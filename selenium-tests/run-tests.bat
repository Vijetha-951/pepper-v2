@echo off
REM PEPPER Selenium Test Runner for Windows
REM This script helps you run the Selenium tests with proper setup

echo 🚀 PEPPER Selenium Test Runner
echo ==============================

REM Check if we're in the selenium-tests directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the selenium-tests directory
    echo    cd selenium-tests ^&^& run-tests.bat
    pause
    exit /b 1
)

REM Check if PEPPER app is running
echo 🔍 Checking if PEPPER application is running...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PEPPER application is running on localhost:3000
) else (
    echo ⚠️  Warning: PEPPER application not detected on localhost:3000
    echo    Please start your PEPPER application first:
    echo    cd frontend ^&^& npm start
    echo    cd backend ^&^& npm start
    echo.
    set /p continue="Continue anyway? (y/n): "
    if /i not "%continue%"=="y" exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Run setup check
echo 🔧 Running setup check...
node setup-check.js

echo.
echo 🎯 Choose test mode:
echo 1) Run all tests (default)
echo 2) Run tests in headless mode
echo 3) Run tests with Chrome
echo 4) Run tests with Firefox
echo 5) Run tests in watch mode
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo 🚀 Running all tests...
    npm test
) else if "%choice%"=="2" (
    echo 🚀 Running tests in headless mode...
    set HEADLESS=true
    npm test
) else if "%choice%"=="3" (
    echo 🚀 Running tests with Chrome...
    set BROWSER=chrome
    npm test
) else if "%choice%"=="4" (
    echo 🚀 Running tests with Firefox...
    set BROWSER=firefox
    npm test
) else if "%choice%"=="5" (
    echo 🚀 Running tests in watch mode...
    npm run test:watch
) else (
    echo 🚀 Running all tests (default)...
    npm test
)

echo.
echo 📊 Test Results Summary:
echo ========================
if exist "tests\screenshots" (
    for /f %%i in ('dir /b tests\screenshots\*.png 2^>nul ^| find /c /v ""') do set screenshot_count=%%i
    echo 📸 Screenshots taken: %screenshot_count%
    echo    Location: tests\screenshots\
)

echo.
echo ✅ Test run completed!
echo 📁 Check tests\screenshots\ for visual debugging
echo 📋 Review console output for detailed results
pause
