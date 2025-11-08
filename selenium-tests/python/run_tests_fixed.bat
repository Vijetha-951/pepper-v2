@echo off
chcp 65001 >nul
echo ========================================
echo PEPPER Python Selenium Tests
echo ========================================
echo.

cd /d %~dp0

echo Running tests with Python...
python -m pytest --html=reports/report.html --self-contained-html -v

echo.
echo ========================================
echo Tests completed!
echo Report: reports\report.html
echo ========================================
pause


