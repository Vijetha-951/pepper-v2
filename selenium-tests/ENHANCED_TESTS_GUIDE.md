# Enhanced Selenium Tests Guide

## Overview

The enhanced tests provide detailed step-by-step reporting with comprehensive logging, error handling, and screenshot capture for each test step.

## Test Cases

### 1. **User Login** (`TEST 1: User Login`)
- **Purpose**: Verifies user authentication and login functionality
- **Steps**:
  - Navigate to login page
  - Enter email and password credentials
  - Submit login form
  - Verify successful redirect to dashboard

**Expected Output:**
```
Screenshot saved: selenium-tests/screenshots/01_login_page_loaded_[timestamp].png
✅ Typed in Email field
✅ Clicked: Login button
Current URL: http://localhost:3000/dashboard
✅ User redirected to: http://localhost:3000/dashboard
✅ TEST 1 PASSED: User successfully logged in
```

### 2. **Browse Products** (`TEST 2: Browse Products`)
- **Purpose**: Tests product browsing and viewing product details
- **Steps**:
  - Navigate to home page
  - Wait for products to load
  - Verify product count
  - Click on first product
  - Verify product details are displayed

**Expected Output:**
```
Screenshot saved: selenium-tests/screenshots/02_browse_home_loaded_[timestamp].png
✅ Found 12 products on page
Screenshot saved: selenium-tests/screenshots/02_browse_products_visible_[timestamp].png
✅ Clicked on first product
✅ Product information displayed correctly
✅ TEST 2 PASSED: Successfully browsed products
```

### 3. **Add Product to Cart** (`TEST 3: Add Product to Cart`)
- **Purpose**: Verifies product can be added to shopping cart
- **Steps**:
  - Navigate to home page
  - Wait for products to load
  - Find and click "Add to Cart" button
  - Navigate to cart page
  - Verify products in cart

**Expected Output:**
```
Screenshot saved: selenium-tests/screenshots/03_add_cart_home_loaded_[timestamp].png
✅ Found 12 products
Screenshot saved: selenium-tests/screenshots/03_add_cart_products_visible_[timestamp].png
✅ Clicked button: ADD TO CART
Screenshot saved: selenium-tests/screenshots/03_add_cart_added_[timestamp].png
✅ Found 1 items in cart
✅ TEST 3 PASSED: Product successfully added to cart
```

### 4. **Checkout Process** (`TEST 4: Checkout Process`)
- **Purpose**: Tests the checkout/order placement flow
- **Steps**:
  - Navigate to cart page
  - Verify cart has items (add one if needed)
  - Find and click Checkout button
  - Verify checkout page loads

**Expected Output:**
```
Screenshot saved: selenium-tests/screenshots/04_checkout_cart_loaded_[timestamp].png
✅ Cart verified
Screenshot saved: selenium-tests/screenshots/04_checkout_cart_verified_[timestamp].png
✅ Clicked: CHECKOUT
Screenshot saved: selenium-tests/screenshots/04_checkout_checkout_clicked_[timestamp].png
✅ Checkout page loaded successfully
✅ TEST 4 PASSED: Checkout process initiated successfully
```

## Running Tests

### Run Enhanced Tests Only
```bash
cd selenium-tests
npm run test:enhanced
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests Headless (without GUI)
```bash
npm run test:headless
```

## Output Format

Each test generates:

1. **Console Output** - Detailed step-by-step logs with:
   - Test name and number
   - Step descriptions
   - Success/error messages
   - Stacktraces for failures
   - Final test status

2. **Screenshots** - Saved in `selenium-tests/screenshots/`:
   - Step name: `0X_testname_stepname_timestamp.png`
   - One screenshot per step
   - Last screenshot shows error (if test fails)

3. **Error Reporting** - Full error details:
   - Error message
   - Complete stacktrace
   - Screenshot of error state

## Sample Test Output

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
📸 Screenshot saved: selenium-tests/screenshots/01_login_submitted_1730997230000.png

Step 4: Verify successful login
Current URL: http://localhost:3000/dashboard
✅ User redirected to: http://localhost:3000/dashboard
✅ TEST 1 PASSED: User successfully logged in
📸 Screenshot saved: selenium-tests/screenshots/01_login_success_1730997230500.png
```

## Environment Variables

Configure these in `.env` or your system environment:

```bash
BASE_URL=http://localhost:3000
TEST_EMAIL=testuser@example.com
TEST_PASSWORD=testuser123
```

## Troubleshooting

### Tests Timing Out
- Increase `testTimeout` in `jest.config.js`
- Check if application is running on BASE_URL
- Verify network connectivity

### Screenshots Not Saving
- Ensure `selenium-tests/screenshots/` directory exists
- Check file write permissions
- Verify filesystem has available space

### Element Not Found Errors
- Check if selectors match your application's HTML structure
- Use browser DevTools to inspect element selectors
- Update selector arrays in test file if needed

### WebDriver Issues
- Ensure ChromeDriver version matches Chrome browser version
- Try running with specific browser: `npm run test:chrome`
- Check WebDriver initialization in `tests/setup.js`

## Customization

### Adding New Tests

Create a new test in `pepper-enhanced-tests.test.js`:

```javascript
test('TEST 5: Custom Functionality', async () => {
  console.log('\n' + '='.repeat(70));
  console.log('✨ TEST 5: Custom Functionality');
  console.log('='.repeat(70) + '\n');

  try {
    logStep(1, 'Step description');
    // Add your test logic
    logSuccess('TEST 5 PASSED: Description');
    await takeScreenshot('05_custom', 'success', 'Success message');
  } catch (error) {
    logError(`TEST 5 FAILED: ${error.message}`);
    console.error('\nStacktrace:');
    console.error(error.stack);
    await takeScreenshot('05_custom', 'error', `Error: ${error.message}`);
    throw error;
  }
}, 90000);
```

### Modifying Selectors

Update selector arrays to match your application:

```javascript
const loginButtonSelectors = [
  'button[type="submit"]',
  'button.login-btn',
  '#loginButton',
  'button:contains("Sign In")'
];
```

## References

- [Selenium WebDriver Documentation](https://www.selenium.dev/documentation/)
- [Jest Testing Framework](https://jestjs.io/)
- [Selenium WebDriver for Node.js](https://www.npmjs.com/package/selenium-webdriver)
