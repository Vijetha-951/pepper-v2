#!/bin/bash

echo ""
echo "======================================================================"
echo " PEPPER Enhanced Selenium Tests"
echo "======================================================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

echo "Running enhanced tests with detailed reporting..."
echo ""

# Run the enhanced tests
npm run test:enhanced

echo ""
echo "======================================================================"
echo " Tests Complete!"
echo "======================================================================"
echo ""
echo "Screenshots saved in: selenium-tests/screenshots/"
echo ""
