# PEPPER Selenium Tests - Pytest Guide

## Overview

Python-based Selenium tests using pytest framework with detailed step-by-step reporting, screenshots, and error logging.

## Quick Start

### Prerequisites

- **Python 3.8+** installed
- **pip** (Python package manager)
- **Chrome** or **Firefox** browser
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`

### Installation

```bash
cd selenium-tests

# Install Python dependencies
pip install -r requirements.txt
```

## Running Tests

### Run All Tests

**Windows:**
```bash
run-pytest.bat
# or
python -m pytest test_*.py -v
```

**Linux/Mac:**
```bash
./run-pytest.sh
# or
python3 -m pytest test_*.py -v
```

### Run Specific Test Suite

```bash
# Login tests
python -m pytest test_login.py -v

# Browse products
python -m pytest test_browse_products.py -v

# Add to cart
python -m pytest test_add_to_cart.py -v

# Checkout
python -m pytest test_checkout.py -v
```

### Run Specific Test

```bash
python -m pytest test_login.py::TestLogin::test_user_login -v
```

### Run with Custom Options

```bash
# Verbose output
python -m pytest test_*.py -vv

# Show print statements
python -m pytest test_*.py -v -s

# Stop on first failure
python -m pytest test_*.py -v -x

# Run only 1 thread (sequential)
python -m pytest test_*.py -v -n 1
```

## Test Files

### 1. **test_login.py** - User Authentication
```python
TestLogin::test_user_login() - User login functionality
TestAdminLogin::test_admin_login() - Admin login functionality
```

**Steps:**
1. Navigate to login page
2. Enter credentials
3. Submit form
4. Verify redirect

**Expected Output:**
```
Step 1: Navigate to login page...
✓ Login page loaded
📸 Screenshot saved: selenium-tests/screenshots/01_login_page_loaded_[timestamp].png

Step 2: Enter email and password...
✓ Entered email: testuser@example.com
✓ Entered password

Step 3: Submit login form...
✓ Clicked login button

Step 4: Verify successful login...
Current URL: http://localhost:3000/dashboard
✓ User redirected to: http://localhost:3000/dashboard

✅ TEST PASSED: User successfully logged in
```

### 2. **test_browse_products.py** - Product Browsing
```python
TestBrowseProducts::test_browse_products() - Browse and view products
TestBrowseProducts::test_filter_products() - Filter products
```

**Steps:**
1. Navigate to home page
2. Wait for products to load
3. Click on first product
4. Verify product details

**Expected Output:**
```
Step 1: Navigate to home page...
✓ Home page loaded

Step 2: Wait for products to load...
✓ Found 12 products

Step 3: Click on first product...
✓ Clicked on first product

Step 4: Verify product information...
✓ Product information is displayed

✅ TEST PASSED: Successfully browsed products
```

### 3. **test_add_to_cart.py** - Shopping Cart
```python
TestAddToCart::test_add_to_cart() - Add product to cart
TestAddToCart::test_update_cart_quantity() - Update cart quantity
```

**Steps:**
1. Navigate to home page
2. Find and click Add to Cart button
3. Navigate to cart page
4. Verify product in cart

**Expected Output:**
```
Step 1: Navigate to home page...
✓ Home page loaded

Step 2: Wait for products to load...
✓ Found 12 products

Step 3: Find and click Add to Cart button...
✓ Clicked button: ADD TO CART

Step 4: Navigate to cart page...
✓ Navigated to cart page

Step 5: Verify product in cart...
✓ Found 1 items in cart

✅ TEST PASSED: Product successfully added to cart
```

### 4. **test_checkout.py** - Order Placement
```python
TestCheckout::test_checkout_process() - Checkout flow
TestCheckout::test_place_order() - Complete order placement
```

**Steps:**
1. Navigate to cart page
2. Click Checkout button
3. Fill shipping address
4. Select payment method
5. Place order

**Expected Output:**
```
Step 1: Navigate to cart page...
✓ Cart page loaded

Step 2: Verify cart has items...
✓ Cart verified

Step 3: Find and click Checkout button...
✓ Clicked: CHECKOUT

Step 4: Verify checkout page loaded...
✓ Checkout page loaded successfully

✅ TEST PASSED: Checkout process initiated successfully
```

## Configuration

Edit `config.py` to customize:

```python
class Config:
    BASE_URL = "http://localhost:3000"           # Frontend URL
    BROWSER = "chrome"                           # chrome or firefox
    HEADLESS = False                             # Run without GUI
    IMPLICIT_WAIT = 10                           # Element wait timeout
    PAGE_LOAD_TIMEOUT = 30                       # Page load timeout
    
    TEST_USER = {
        "email": "testuser@example.com",
        "password": "testuser123"
    }
    
    ADMIN_USER = {
        "email": "vj.vijetha01@gmail.com",
        "password": "Admin123#"
    }
```

## Base Test Class

Common methods available in all tests (from `base_test.py`):

```python
# Wait for elements
wait_for_element(by, value, timeout=None)
wait_for_clickable(by, value, timeout=None)
wait_for_visible(by, value, timeout=None)

# Element interactions
safe_click(element)
safe_send_keys(element, text)
scroll_to_element(element)

# Utilities
navigate_to(path="")
take_screenshot(name="screenshot")
get_current_url()
find_element(by, value)
find_elements(by, value)
element_exists(by, value)
```

## Screenshots

Screenshots are saved to `selenium-tests/screenshots/`

Format: `{test_name}_{step_name}_{timestamp}.png`

Examples:
- `01_login_page_loaded_1730997227000.png`
- `02_products_visible_1730997237500.png`
- `03_added_to_cart_1730997245000.png`
- `04_checkout_success_1730997255000.png`

## HTML Report Generation

Generate HTML report after tests:

```bash
python -m pytest test_*.py -v --html=report.html --self-contained-html
```

Install HTML plugin:
```bash
pip install pytest-html
```

## Headless Mode

Run tests without opening browser GUI:

**Windows:**
```bash
set HEADLESS=true
python -m pytest test_*.py -v
```

**Linux/Mac:**
```bash
export HEADLESS=true
python3 -m pytest test_*.py -v
```

Or modify `config.py`:
```python
HEADLESS = True
```

## Troubleshooting

### Python Not Found
```
Error: python is not recognized as an internal command
Solution: Install Python and add to PATH
```

### Selenium Not Installed
```
Error: ModuleNotFoundError: No module named 'selenium'
Solution: pip install -r requirements.txt
```

### Chrome/Firefox Not Found
```
Error: WebDriver not found
Solution: Install Chrome or Firefox browser
```

### Element Not Found
```
Error: Element not found with selectors
Solution: 
1. Check if selectors match your HTML
2. Increase timeout values
3. Use browser DevTools to inspect elements
```

### Timeout Error
```
Error: Exceeded timeout waiting for element
Solution:
1. Increase IMPLICIT_WAIT in config.py
2. Increase PAGE_LOAD_TIMEOUT
3. Check network connection to frontend
```

### Tests Failing on Login
```
Error: Login failed
Solution:
1. Verify TEST_USER credentials in config.py
2. Check if user exists in database
3. Verify backend is running
```

## Adding New Tests

Create new test file `test_feature.py`:

```python
import time
import pytest
from selenium.webdriver.common.by import By
from base_test import BaseTest
from config import Config

class TestFeature(BaseTest):
    """Test feature description"""
    
    def test_feature_scenario(self):
        """
        Test Case: Feature Scenario
        Steps:
        1. Step 1
        2. Step 2
        3. Step 3
        """
        try:
            print("\n" + "="*70)
            print("✨ TEST: Feature Scenario")
            print("="*70 + "\n")
            
            print("Step 1: Description...")
            self.navigate_to("/page")
            time.sleep(2)
            self.take_screenshot("01_page_loaded")
            print("✓ Step 1 complete")
            
            print("\nStep 2: Description...")
            element = self.wait_for_element(By.CSS_SELECTOR, ".selector")
            self.safe_click(element)
            print("✓ Step 2 complete")
            
            print("\nStep 3: Verify...")
            if True:  # your assertion
                self.take_screenshot("03_success")
                print("\n✅ TEST PASSED: Feature working\n")
            else:
                raise AssertionError("Feature failed")
            
        except Exception as e:
            print(f"\n✗ TEST FAILED: {str(e)}\n")
            print(f"Stacktrace: {type(e).__name__}: {e}")
            self.take_screenshot("feature_failure")
            pytest.fail(f"Test failed: {str(e)}")
```

## Debugging

### Enable Verbose Output

```bash
python -m pytest test_*.py -vv -s
```

The `-s` flag shows all print statements.

### Screenshot on Failure

Automatically taken - check `selenium-tests/screenshots/` for error screenshots.

### View Browser During Test

Set `HEADLESS = False` in `config.py` to see browser window during execution.

## Performance

### Parallel Execution

```bash
pip install pytest-xdist
python -m pytest test_*.py -v -n auto
```

### Timeout

Set timeout per test:

```python
@pytest.mark.timeout(300)  # 5 minutes
def test_feature(self):
    ...
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Selenium Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.9
      - name: Install dependencies
        run: |
          pip install -r selenium-tests/requirements.txt
      - name: Run tests
        run: |
          python -m pytest selenium-tests/test_*.py -v
```

## Best Practices

1. **Use wait functions** - Never use `time.sleep()` alone for waits
2. **Screenshot on failure** - Already done, check screenshots folder
3. **Clear error messages** - Print step progress with markers
4. **One assertion per test** - Keep tests focused
5. **Use try-except** - Gracefully handle optional steps
6. **Data-driven tests** - Use pytest parametrize for multiple scenarios
7. **Clean up** - Tests automatically close browser

## Report Format

Console output shows:
- ✓ Step progress
- ✅ Test passed
- ✗ Test failed
- ❌ Error details
- 📸 Screenshot paths
- ⚠️ Warnings/non-critical issues
- 💳 Payment/checkout specific messages

## Support

For issues:
1. Check test output and screenshots
2. Verify frontend/backend running
3. Check browser console for JavaScript errors
4. Review base_test.py for available methods
5. Read test file to understand flow
