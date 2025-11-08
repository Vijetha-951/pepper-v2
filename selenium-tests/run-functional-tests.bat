@echo off
REM PEPPER Functional Tests Runner - Windows Batch Script

echo.
echo ====================================================
echo  PEPPER Selenium Functional Tests Runner
echo ====================================================
echo.
echo This script will run 4 core functional tests:
echo   1. User Login Functionality
echo   2. Add to Cart Functionality
echo   3. Add New Product by Admin
echo   4. Update Stock by Admin
echo.

REM Check if npm is installed
where npm >nul 2>nul
if errorlevel 1 (
    echo ERROR: npm is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: package.json not found
    echo Please run this script from the selenium-tests directory
    pause
    exit /b 1
)

echo ✓ Environment check passed
echo.

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✓ Dependencies installed
)

echo.
echo ====================================================
echo  Starting Tests...
echo ====================================================
echo.
echo Make sure your PEPPER application is running on http://localhost:3000
echo.
pause

REM Run the functional tests
call npm test -- pepper-functional-tests.test.js

echo.
echo ====================================================
echo  Tests Completed
echo ====================================================
echo.
echo Screenshots saved to: tests/screenshots/
echo.
pause