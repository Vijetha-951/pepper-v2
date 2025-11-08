# PEPPER Functional Tests Guide

This guide explains the 4 core functional tests created for the PEPPER e-commerce application.

## Test Cases Overview

### ✅ TEST CASE 1: User Login Functionality
**File:** `pepper-functional-tests.test.js`

**Description:** Tests the complete user login flow.

**Test Steps:**
1. Navigate to login page (`/login`)
2. Enter admin credentials (email: `admin@example.com`, password: `admin123456`)
3. Click submit button
4. Verify redirect away from login page
5. Look for user profile/dashboard elements

**Expected Result:** User successfully logs in and is redirected to dashboard

**Screenshots Generated:**
- `01_login_page_loaded.png` - Initial login page
- `01_login_form_filled.png` - Form with credentials entered
- `01_login_success.png` - Successful login confirmation

---

### 🛒 TEST CASE 2: Add to Cart Functionality
**File:** `pepper-functional-tests.test.js`

**Description:** Tests adding products to shopping cart from home page.

**Test Steps:**
1. Navigate to home page (`/`)
2. Wait for products to load
3. Find first "Add to Cart" button
4. Click the button to add product to cart
5. Navigate to cart page (`/cart`)
6. Verify items are in cart

**Expected Result:** Product is successfully added to cart and visible on cart page

**Screenshots Generated:**
- `02_home_page.png` - Home page with products
- `02_products_visible.png` - Products loaded successfully
- `02_product_added_to_cart.png` - After clicking add to cart
- `02_cart_page.png` - Cart page showing added items
- `02_add_to_cart_success.png` - Final confirmation

---

### ➕ TEST CASE 3: Add New Product by Admin
**File:** `pepper-functional-tests.test.js`

**Description:** Tests the admin functionality to add a new product.

**Test Steps:**
1. Login as admin (email: `admin@example.com`, password: `admin123456`)
2. Navigate to add products page (`/add-products`)
3. Fill in product form with:
   - Name: Dynamically generated (e.g., "Test Product 1234567890")
   - Description: "This is a test product created by Selenium automation"
   - Price: "250"
   - Stock: "50"
   - Type: "Climber"
   - Category: "Vegetables"
4. Click submit button
5. Verify form submission

**Expected Result:** New product is added to the system

**Screenshots Generated:**
- `03_admin_logged_in.png` - Admin login confirmation
- `03_product_form_page.png` - Product form page
- `03_product_form_filled.png` - Form with all fields filled
- `03_product_submitted.png` - After form submission
- `03_add_product_success.png` - Final confirmation

---

### 📦 TEST CASE 4: Update Stock by Admin
**File:** `pepper-functional-tests.test.js`

**Description:** Tests the admin stock management functionality.

**Test Steps:**
1. Login as admin (email: `admin@example.com`, password: `admin123456`)
2. Navigate to stock management page (`/admin/stock`)
3. Find first product in the product list/table
4. Update stock quantity to "75"
5. Click save/update button
6. Verify stock changes are saved

**Expected Result:** Product stock quantity is successfully updated

**Screenshots Generated:**
- `04_admin_login.png` - Admin login
- `04_stock_management_page.png` - Stock management page
- `04_stock_updated.png` - Stock value changed
- `04_stock_saved.png` - Changes saved confirmation
- `04_update_stock_success.png` - Final confirmation

---

## Prerequisites

Before running the tests, ensure:

1. **Node.js** is installed (v14 or higher)
2. **PEPPER application** is running on `http://localhost:3000`
3. **Backend server** is running (if separate)
4. **Admin user** exists with credentials:
   - Email: `admin@example.com`
   - Password: `admin123456`
5. **Chrome or Firefox** browser is installed

## Setup Instructions

### 1. Navigate to selenium-tests directory
```bash
cd c:\xampp\htdocs\PEPPER\selenium-tests
```

### 2. Install dependencies
```bash
npm install
```

### 3. Verify setup
```bash
node setup-check.js
```

## Running the Tests

### Run Only the Functional Tests
```bash
npm test -- pepper-functional-tests.test.js
```

### Run All Tests
```bash
npm test
```

### Run in Headless Mode (No Browser Window)
```bash
HEADLESS=true npm test -- pepper-functional-tests.test.js
```

### Run with Specific Browser
```bash
BROWSER=chrome npm test -- pepper-functional-tests.test.js
BROWSER=firefox npm test -- pepper-functional-tests.test.js
```

### Run with Custom Base URL
```bash
BASE_URL=http://localhost:3000 npm test -- pepper-functional-tests.test.js
```

### Run Single Test Case
```bash
# Test Case 1: Login only
npm test -- pepper-functional-tests.test.js -t "User Login Functionality"

# Test Case 2: Add to Cart only
npm test -- pepper-functional-tests.test.js -t "Add to Cart Functionality"

# Test Case 3: Add Product only
npm test -- pepper-functional-tests.test.js -t "Add New Product by Admin"

# Test Case 4: Update Stock only
npm test -- pepper-functional-tests.test.js -t "Update Stock by Admin"
```

## Test Output

When tests run, you'll see:

1. **Console Output:**
   - Step-by-step test execution log
   - Success indicators (✓) and failures (✗)
   - Screenshot file paths

2. **Screenshots:**
   - Automatically saved to: `selenium-tests/tests/screenshots/`
   - Named with pattern: `{test_prefix}_{action}_{timestamp}.png`
   - Each test generates 4-6 screenshots for visual verification

3. **Summary:**
   - Number of tests passed/failed
   - Test execution time
   - Any errors encountered

## Example Test Run Output

```
🚀 WebDriver initialized successfully

🔐 === TEST CASE 1: User Login Functionality ===
Step 1: Navigating to login page...
✓ Login page loaded
✓ Login form found
✓ Entered email: admin@example.com
✓ Entered password
✓ Login form filled
Step 3: Submitting login form...
✓ Login button clicked
Step 4: Verifying login success...
✓ Redirected from login page
✅ TEST CASE 1 PASSED: User successfully logged in

🛒 === TEST CASE 2: Add to Cart Functionality ===
Step 1: Navigating to home page...
✓ Home page loaded
Step 2: Waiting for products to load...
✓ Products found using selector: .product-card
✓ Clicked button: Add to Cart
✓ Cart page loaded
✓ Found 1 items in cart using selector: .cart-item
✅ TEST CASE 2 PASSED: Products successfully added to cart

[... more test output ...]

✅ All tests completed - WebDriver closed
```

## Troubleshooting

### Tests fail with "Application not running"
- Ensure PEPPER frontend is running on `http://localhost:3000`
- Check: `http://localhost:3000` in your browser

### Tests fail with "Browser not found"
- Install Chrome or Firefox
- Make sure ChromeDriver/GeckoDriver are in PATH
- Or reinstall: `npm install`

### Tests fail with "Element not found"
- This may indicate your UI structure differs from expected
- Check generated screenshots to see what was found
- Update CSS selectors in the test file if needed

### Screenshot directory not found
- Ensure `selenium-tests/tests/` directory exists
- Create it if missing: `mkdir selenium-tests\tests\screenshots`

## Important Notes

1. **Admin Credentials:** Tests use `admin@example.com` / `admin123456`
   - Ensure this user exists in your database
   - Modify credentials in the test file if different

2. **Test Independence:** Each test case clears cookies before running
   - Tests can be run in any order
   - Tests don't affect your live data permanently

3. **Timing:** Tests have generous timeouts (up to 90 seconds)
   - Adjust in `package.json` if needed

4. **Screenshots:** All screenshots are timestamped
   - Check `tests/screenshots/` folder after running
   - Useful for debugging failures

5. **Headless Mode:** For CI/CD pipelines, use `HEADLESS=true`
   - Tests run faster without opening browser window

## Test Success Criteria

### ✅ Test Case 1: PASS
- Login page loads
- Form submission successful
- Redirected away from login page

### ✅ Test Case 2: PASS
- Home page loads with products
- Add to cart button found and clicked
- Cart page shows items

### ✅ Test Case 3: PASS
- Product form page loads
- Form can be filled with data
- Form successfully submitted

### ✅ Test Case 4: PASS
- Stock management page loads
- Stock value can be updated
- Changes are saved

## Performance

Typical test execution times:
- Test Case 1 (Login): ~15 seconds
- Test Case 2 (Add to Cart): ~20 seconds
- Test Case 3 (Add Product): ~30 seconds
- Test Case 4 (Update Stock): ~30 seconds

**Total time for all 4 tests: ~2-3 minutes**

## Integration with CI/CD

To run tests in GitHub Actions, GitLab CI, or similar:

```yaml
- name: Run Selenium Tests
  run: |
    cd selenium-tests
    npm install
    HEADLESS=true npm test -- pepper-functional-tests.test.js
```

## Support

If tests fail, collect the following information:
1. Console output (copy all text)
2. Screenshots from `tests/screenshots/` folder
3. Current URL when failure occurred
4. Browser version (Chrome/Firefox)
5. Node.js version: `node --version`

Check screenshots to understand exactly what the test encountered and what actions failed.

---

**Created:** Automated Selenium Test Suite for PEPPER
**Last Updated:** 2024
**Test Framework:** Jest + Selenium WebDriver