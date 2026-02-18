@echo off
REM Disease Detection API Startup Script
REM This script starts the Flask API server for disease detection

echo ========================================
echo  Disease Detection API Startup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

echo [1/3] Checking Python environment...
cd /d "%~dp0backend\python"

REM Check if virtual environment exists
if not exist "venv" (
    echo Virtual environment not found. Creating one...
    python -m venv venv
    if %errorlevel% neq 0 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo [2/3] Activating virtual environment...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

REM Install/Update dependencies
echo [3/3] Installing/Updating dependencies...
pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo WARNING: Some dependencies may not have installed correctly
)

echo.
echo ========================================
echo  Starting Disease Detection API
echo ========================================
echo.
echo Server will start on: http://localhost:5002
echo Press Ctrl+C to stop the server
echo.

REM Run the disease detection API
python disease_detection_api.py

pause
