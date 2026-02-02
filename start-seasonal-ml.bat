@echo off
REM Seasonal Suitability ML System - Training and API Startup Script

echo ============================================================
echo Seasonal Suitability ML System - Setup and Start
echo ============================================================
echo.

cd /d "%~dp0\backend\python"

echo [1/4] Checking Python dependencies...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
echo.

echo [2/4] Generating training dataset...
python seasonal_suitability_dataset.py
echo.

echo [3/4] Training ML model...
python seasonal_suitability_model.py
echo.

echo [4/4] Starting Flask API server...
echo API will be available at: http://127.0.0.1:5001
echo Health check: http://127.0.0.1:5001/health
echo.
echo Press Ctrl+C to stop the server
echo.
python seasonal_suitability_api.py --host 127.0.0.1 --port 5001

pause
