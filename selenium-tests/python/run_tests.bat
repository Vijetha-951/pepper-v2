@echo off
echo ========================================
echo PEPPER Python Selenium Tests
echo ========================================
echo.

cd /d %~dp0

echo Checking Python installation...
python --version
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Creating directories...
if not exist screenshots mkdir screenshots
if not exist reports mkdir reports

echo.
echo Running tests...
pytest --html=reports/report.html --self-contained-html -v

echo.
echo ========================================
echo Tests completed!
echo Report: reports/report.html
echo ========================================
pause


