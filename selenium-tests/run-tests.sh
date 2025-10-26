#!/bin/bash

# PEPPER Selenium Test Runner
# This script helps you run the Selenium tests with proper setup

echo "🚀 PEPPER Selenium Test Runner"
echo "=============================="

# Check if we're in the selenium-tests directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the selenium-tests directory"
    echo "   cd selenium-tests && ./run-tests.sh"
    exit 1
fi

# Check if PEPPER app is running
echo "🔍 Checking if PEPPER application is running..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ PEPPER application is running on localhost:3000"
else
    echo "⚠️  Warning: PEPPER application not detected on localhost:3000"
    echo "   Please start your PEPPER application first:"
    echo "   cd frontend && npm start"
    echo "   cd backend && npm start"
    echo ""
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run setup check
echo "🔧 Running setup check..."
node setup-check.js

echo ""
echo "🎯 Choose test mode:"
echo "1) Run all tests (default)"
echo "2) Run tests in headless mode"
echo "3) Run tests with Chrome"
echo "4) Run tests with Firefox"
echo "5) Run tests in watch mode"
echo "6) Run specific test case"
echo ""

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo "🚀 Running all tests..."
        npm test
        ;;
    2)
        echo "🚀 Running tests in headless mode..."
        HEADLESS=true npm test
        ;;
    3)
        echo "🚀 Running tests with Chrome..."
        BROWSER=chrome npm test
        ;;
    4)
        echo "🚀 Running tests with Firefox..."
        BROWSER=firefox npm test
        ;;
    5)
        echo "🚀 Running tests in watch mode..."
        npm run test:watch
        ;;
    6)
        echo "🎯 Available test cases:"
        echo "1) User Registration and Login Flow"
        echo "2) Product Browsing and Cart Management"
        echo "3) Navigation and Page Accessibility"
        echo "4) Dashboard and User Interface Elements"
        echo ""
        read -p "Enter test case number (1-4): " testcase
        case $testcase in
            1)
                echo "🚀 Running Test Case 1: User Registration and Login Flow..."
                npm test -- --testNamePattern="User Registration and Login Flow"
                ;;
            2)
                echo "🚀 Running Test Case 2: Product Browsing and Cart Management..."
                npm test -- --testNamePattern="Product Browsing and Cart Management"
                ;;
            3)
                echo "🚀 Running Test Case 3: Navigation and Page Accessibility..."
                npm test -- --testNamePattern="Navigation and Page Accessibility"
                ;;
            4)
                echo "🚀 Running Test Case 4: Dashboard and User Interface Elements..."
                npm test -- --testNamePattern="Dashboard and User Interface Elements"
                ;;
            *)
                echo "❌ Invalid test case number"
                exit 1
                ;;
        esac
        ;;
    *)
        echo "🚀 Running all tests (default)..."
        npm test
        ;;
esac

echo ""
echo "📊 Test Results Summary:"
echo "========================"
if [ -d "tests/screenshots" ]; then
    screenshot_count=$(find tests/screenshots -name "*.png" | wc -l)
    echo "📸 Screenshots taken: $screenshot_count"
    echo "   Location: tests/screenshots/"
fi

echo ""
echo "✅ Test run completed!"
echo "📁 Check tests/screenshots/ for visual debugging"
echo "📋 Review console output for detailed results"
