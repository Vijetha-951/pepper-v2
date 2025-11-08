@echo off
echo.
echo ======================================================================
echo  PEPPER Enhanced Selenium Tests
echo ======================================================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Running enhanced tests with detailed reporting...
echo.

REM Run the enhanced tests
call npm run test:enhanced

echo.
echo ======================================================================
echo  Tests Complete!
echo ======================================================================
echo.
echo Screenshots saved in: selenium-tests\screenshots\
echo.
pause
