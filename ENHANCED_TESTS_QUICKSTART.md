# Enhanced Tests Quick Start

## Prerequisites

Before running the enhanced tests, ensure:
1. **Node.js** is installed
2. **MongoDB** is running locally or accessible
3. **Chrome or Firefox** browser is installed

## Setup Steps

### Step 1: Prepare Backend

```bash
cd backend
npm install
```

### Step 2: Prepare Frontend

```bash
cd frontend
npm install
```

### Step 3: Prepare Selenium Tests

```bash
cd selenium-tests
npm install
```

## Running Tests

### Option A: Windows - Run Enhanced Tests (GUI)

**Terminal 1 - Start Backend:**
```bash
cd backend
npm start
```
Wait for: `Server running on port 5000`

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm start
```
Wait for: Application loads on `http://localhost:3000`

**Terminal 3 - Run Tests:**
```bash
cd selenium-tests
npm run test:enhanced
```

### Option B: Windows - Quick Start Script

Double-click: `selenium-tests\run-enhanced-tests.bat`

(Requires backend and frontend already running)

### Option C: Using Batch File (All in One)

Create `start-all-and-test.bat`:

```batch
@echo off
cd /d %~dp0

echo Starting MongoDB...
start mongod

echo Starting Backend...
start cmd /k "cd backend && npm start"

echo Starting Frontend...
start cmd /k "cd frontend && npm start"

timeout /t 10

echo Starting Tests...
cd selenium-tests
npm run test:enhanced
```

Then double-click the file.

## Test Output Format

### Successful Test Output:
```
======================================================================
🔐 TEST 1: User Login
======================================================================

Step 1: Navigate to login page...
✅ Login page loaded
📸 Screenshot saved: selenium-tests/screenshots/01_login_page_loaded_1730997227000.png

Step 2: Enter email and password
✅ Typed in Email field
✅ Typed in Password field
📸 Screenshot saved: selenium-tests/screenshots/01_login_form_filled_1730997227500.png

Step 3: Click login button
✅ Clicked: Login button

Step 4: Verify successful login
Current URL: http://localhost:3000/dashboard
✅ User redirected to: http://localhost:3000/dashboard
✅ TEST 1 PASSED: User successfully logged in
📸 Screenshot saved: selenium-tests/screenshots/01_login_success_1730997230500.png
```

### Failed Test Output:
```
======================================================================
🛍️  TEST 2: Browse Products
======================================================================

Step 1: Navigate to home page...
✅ Home page loaded
📸 Screenshot saved: selenium-tests/screenshots/02_browse_home_loaded_1730997237000.png

Step 2: Wait for products to load...
❌ No products found on home page

❌ TEST 2 FAILED: No products found on home page

Stacktrace:
Error: No products found on home page
    at async Test (path/to/pepper-enhanced-tests.test.js:305:15)
```

## Test Cases Overview

### TEST 1: User Login
- Navigate to `/login`
- Enter test user credentials
- Submit login form
- Verify redirect to dashboard
- **Expected Pass Rate:** 100% (if credentials are correct)

### TEST 2: Browse Products
- Navigate to home page
- Wait for products to load
- Click on first product
- Verify product details displayed
- **Expected Pass Rate:** 100% (if products exist)

### TEST 3: Add Product to Cart
- Browse products on home page
- Click "Add to Cart" button
- Navigate to `/cart`
- Verify items in cart
- **Expected Pass Rate:** 90%+ (depends on cart implementation)

### TEST 4: Checkout Process
- Navigate to cart page
- Verify items in cart
- Click checkout button
- Verify checkout page loads
- **Expected Pass Rate:** 90%+ (depends on checkout page)

## Screenshots

All screenshots are saved to: `selenium-tests/screenshots/`

Format: `{TEST_NUMBER}_{TEST_NAME}_{STEP_NAME}_{TIMESTAMP}.png`

Example:
- `01_login_page_loaded_1730997227000.png`
- `02_browse_products_visible_1730997237500.png`
- `03_add_cart_success_1730997245000.png`

## Troubleshooting

### Tests Timeout
```
Solution: Increase jest timeout in jest.config.js
testTimeout: 120000 (already set to 2 minutes)
```

### Backend Connection Error
```
Error: Cannot connect to localhost:5000

Solution:
1. Start backend: cd backend && npm start
2. Verify MongoDB is running
3. Check backend logs for errors
```

### Frontend Not Loading
```
Error: Cannot navigate to http://localhost:3000

Solution:
1. Start frontend: cd frontend && npm start
2. Wait for "Compiled successfully" message
3. Open http://localhost:3000 in browser to verify
```

### Element Not Found
```
Error: Element not found with selectors

Solution:
1. Check if frontend is running and fully loaded
2. Inspect HTML structure in browser DevTools
3. Update selectors in pepper-enhanced-tests.test.js if HTML changed
```

### No Products Found
```
Warning: No products found on home page

Solution:
1. Ensure admin has added products in the application
2. Check if product database is populated
3. Verify frontend product API endpoints working
```

### Chrome/Firefox Not Found
```
Error: Unable to create WebDriver

Solution:
1. Install Chrome or Firefox browser
2. Ensure chromedriver/geckodriver are installed: npm install
3. Try different browser: BROWSER=firefox npm run test:enhanced
```

## Test Configuration

### Environment Variables

Set these in Command Prompt before running tests:

```bash
set BASE_URL=http://localhost:3000
set TEST_EMAIL=testuser@example.com
set TEST_PASSWORD=testuser123
set BROWSER=chrome
set HEADLESS=false
```

Or in `.env` file:

```
BASE_URL=http://localhost:3000
TEST_EMAIL=testuser@example.com
TEST_PASSWORD=testuser123
BROWSER=chrome
HEADLESS=false
```

### Headless Mode (No Browser GUI)

```bash
set HEADLESS=true
npm run test:enhanced
```

### Use Firefox Instead of Chrome

```bash
set BROWSER=firefox
npm run test:enhanced
```

## Next Steps

1. ✅ All 4 tests created with detailed logging
2. ✅ Jest configuration set up for detailed output
3. ✅ Screenshots captured for each step
4. 📝 Run tests with: `npm run test:enhanced`
5. 📊 View reports in `selenium-tests/screenshots/`

## Files Created

- `pepper-enhanced-tests.test.js` - Test suite with 4 tests
- `jest.config.js` - Jest configuration
- `DetailedReporter.js` - Custom test reporter
- `ENHANCED_TESTS_GUIDE.md` - Detailed documentation
- `run-enhanced-tests.bat` - Windows batch runner
- `run-enhanced-tests.sh` - Unix/Linux shell runner

## Support

For issues or questions:
1. Check ENHANCED_TESTS_GUIDE.md for detailed documentation
2. Verify all services (Backend, Frontend, MongoDB) are running
3. Check browser console and backend logs for errors
4. Review screenshots in `selenium-tests/screenshots/` folder
