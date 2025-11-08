@echo off
echo.
echo ======================================================================
echo  PEPPER Selenium Tests - pytest
echo ======================================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python and add it to system PATH
    pause
    exit /b 1
)

echo ✅ Python found
echo.

REM Check if requirements are installed
echo Checking dependencies...
python -m pip list | find "selenium" >nul
if %errorlevel% neq 0 (
    echo Installing dependencies...
    python -m pip install -r requirements.txt
    echo.
)

echo Running Pytest tests...
echo.

REM Run all tests
python -m pytest test_*.py -v

echo.
echo ======================================================================
echo  Tests Complete!
echo ======================================================================
echo.
echo Screenshots saved in: selenium-tests\screenshots\
echo.
pause
