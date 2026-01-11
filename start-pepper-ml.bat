@echo off
REM Quick Start Script for Pepper ML Module (Windows)

echo ============================================================
echo Pepper ML Module - Quick Start
echo ============================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

echo [1/5] Checking Python installation...
python --version
echo.

REM Navigate to python directory
cd backend\python

echo [2/5] Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo [3/5] Setting up ML module (generating data and training models)...
python setup_ml_module.py
if errorlevel 1 (
    echo ERROR: Setup failed
    pause
    exit /b 1
)
echo.

echo [4/5] Running verification tests...
python test_ml_module.py
if errorlevel 1 (
    echo WARNING: Some tests failed
)
echo.

echo [5/5] Setup complete!
echo.
echo ============================================================
echo Next Steps:
echo ============================================================
echo.
echo 1. Start the ML API (keep this window open):
echo    python pepper_ml_api.py
echo.
echo 2. In a NEW command prompt, start Node.js backend:
echo    cd backend
echo    npm start
echo.
echo 3. Test the API:
echo    curl http://localhost:3000/api/pepper-ml/health
echo.
echo ============================================================
echo.
echo Press any key to start the ML API...
pause >nul

python pepper_ml_api.py
