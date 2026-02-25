@echo off
REM Quick test script for CNN disease detection

echo.
echo ========================================
echo CNN Disease Detection - Quick Test
echo ========================================
echo.

cd /d "%~dp0"

REM Check if we're in the right directory
if not exist "test_cnn_integration.py" (
    echo Error: test_cnn_integration.py not found
    echo Please run this script from backend\python directory
    pause
    exit /b 1
)

echo Running integration test...
echo.

python test_cnn_integration.py

echo.
echo ========================================
echo.
pause
