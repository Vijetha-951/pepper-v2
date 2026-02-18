@echo off
REM Kaggle Dataset Downloader
REM Downloads plant disease datasets from Kaggle

echo ========================================
echo  Kaggle Dataset Downloader
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo [INFO] Checking Python environment...
cd /d "%~dp0backend\python"

REM Check if kaggle package is installed
python -c "import kaggle" >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing Kaggle package...
    pip install kaggle
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Kaggle package
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo  Running Dataset Downloader
echo ========================================
echo.

REM Run the download script
python download_kaggle_dataset.py

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo  Download Complete!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Review downloaded images in backend/python/pepper_dataset
    echo 2. Run: python train_with_real_images.py
    echo 3. Restart the disease detection API
)

pause
