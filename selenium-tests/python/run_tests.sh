#!/bin/bash

echo "========================================"
echo "PEPPER Python Selenium Tests"
echo "========================================"
echo ""

cd "$(dirname "$0")"

echo "Checking Python installation..."
python3 --version || python --version
if [ $? -ne 0 ]; then
    echo "ERROR: Python is not installed or not in PATH"
    exit 1
fi

echo ""
echo "Installing dependencies..."
pip install -r requirements.txt || pip3 install -r requirements.txt

echo ""
echo "Creating directories..."
mkdir -p screenshots
mkdir -p reports

echo ""
echo "Running tests..."
pytest --html=reports/report.html --self-contained-html -v

echo ""
echo "========================================"
echo "Tests completed!"
echo "Report: reports/report.html"
echo "========================================"


