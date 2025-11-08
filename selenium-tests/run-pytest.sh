#!/bin/bash

echo ""
echo "======================================================================"
echo " PEPPER Selenium Tests - pytest"
echo "======================================================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed"
    echo "Please install Python3 first"
    exit 1
fi

echo "✅ Python found: $(python3 --version)"
echo ""

# Check if requirements are installed
echo "Checking dependencies..."
python3 -m pip list | grep -q "selenium"
if [ $? -ne 0 ]; then
    echo "Installing dependencies..."
    python3 -m pip install -r requirements.txt
    echo ""
fi

echo "Running Pytest tests..."
echo ""

# Run all tests
python3 -m pytest test_*.py -v

echo ""
echo "======================================================================"
echo " Tests Complete!"
echo "======================================================================"
echo ""
echo "Screenshots saved in: selenium-tests/screenshots/"
echo ""
