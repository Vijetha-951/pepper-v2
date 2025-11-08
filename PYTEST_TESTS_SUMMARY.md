# PEPPER Selenium Pytest Tests - Complete Summary

## ✅ What's Done

Created a complete **Python-based Selenium testing suite** with pytest framework for your PEPPER e-commerce application.

## 📁 Files Created

### Core Test Files

| File | Purpose |
|------|---------|
| `config.py` | Configuration (BASE_URL, test users, browser settings) |
| `base_test.py` | Base class with common test methods (wait, click, screenshot) |
| `test_login.py` | Login & admin authentication tests |
| `test_browse_products.py` | Product browsing & filtering tests |
| `test_add_to_cart.py` | Add to cart & quantity update tests |
| `test_checkout.py` | Checkout & order placement tests |

### Configuration Files

| File | Purpose |
|------|---------|
| `pytest.ini` | Pytest configuration |
| `conftest.py` | Pytest fixtures & hooks |
| `requirements.txt` | Python dependencies |

### Runner Scripts

| File | Purpose |
|------|---------|
| `run-pytest.bat` | Windows batch file to run all tests |
| `run-pytest.sh` | Unix/Linux shell script to run tests |

### Documentation

| File | Purpose |
|------|---------|
| `PYTEST_TESTS_GUIDE.md` | Complete guide with examples |

## 🧪 Test Cases Created

### 1. **test_login.py** - 2 Test Cases
- `test_user_login()` - User authentication
- `test_admin_login()` - Admin login

### 2. **test_browse_products.py** - 2 Test Cases
- `test_browse_products()` - Browse and view product details
- `test_filter_products()` - Filter product listings

### 3. **test_add_to_cart.py** - 2 Test Cases
- `test_add_to_cart()` - Add products to shopping cart
- `test_update_cart_quantity()` - Update quantity in cart

### 4. **test_checkout.py** - 2 Test Cases
- `test_checkout_process()` - Initiate checkout
- `test_place_order()` - Complete order placement

**Total: 8 Test Cases**

## 🚀 Quick Start

### Step 1: Install Python Dependencies

```bash
cd selenium-tests
pip install -r requirements.txt
```

### Step 2: Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Step 3: Run Tests

**Windows:**
```bash
cd selenium-tests
run-pytest.bat
# or
python -m pytest test_*.py -v
```

**Linux/Mac:**
```bash
cd selenium-tests
./run-pytest.sh
# or
python3 -m pytest test_*.py -v
```

## 📊 Expected Output Format

```
==============================================================================
🔐 TEST: User Login
==============================================================================

Step 1: Navigate to login page...
✓ Login page loaded
📸 Screenshot saved: selenium-tests/screenshots/01_login_page_loaded_1730997227000.png

Step 2: Enter email and password...
✓ Entered email: testuser@example.com
✓ Entered password
📸 Screenshot saved: selenium-tests/screenshots/02_login_form_filled_1730997227500.png

Step 3: Submit login form...
✓ Clicked login button
📸 Screenshot saved: selenium-tests/screenshots/03_login_submitted_1730997230000.png

Step 4: Verify successful login...
Current URL: http://localhost:3000/dashboard
✓ User redirected to: http://localhost:3000/dashboard

✅ TEST PASSED: User successfully logged in

==============================================================================
🛍️  TEST: Browse Products
==============================================================================

Step 1: Navigate to home page...
✓ Home page loaded
📸 Screenshot saved: selenium-tests/screenshots/01_home_page_loaded_1730997237000.png

Step 2: Wait for products to load...
✓ Found 12 products
📸 Screenshot saved: selenium-tests/screenshots/02_products_visible_1730997237500.png

Step 3: Click on first product...
✓ Clicked on first product
📸 Screenshot saved: selenium-tests/screenshots/03_product_details_1730997240000.png

Step 4: Verify product information...
✓ Product information is displayed

✅ TEST PASSED: Successfully browsed products
```

## 📸 Screenshots

All test screenshots are saved to:
```
selenium-tests/screenshots/
```

Format: `{test_number}_{test_name}_{step_name}_{timestamp}.png`

Examples:
- `01_login_page_loaded_1730997227000.png`
- `02_products_visible_1730997237500.png`
- `03_added_to_cart_1730997245000.png`
- `04_checkout_success_1730997255000.png`

## 🎯 Test Execution Commands

### Run All Tests
```bash
python -m pytest test_*.py -v
```

### Run Specific Test Suite
```bash
python -m pytest test_login.py -v
python -m pytest test_browse_products.py -v
python -m pytest test_add_to_cart.py -v
python -m pytest test_checkout.py -v
```

### Run Specific Test Case
```bash
python -m pytest test_login.py::TestLogin::test_user_login -v
```

### Verbose Output (show print statements)
```bash
python -m pytest test_*.py -v -s
```

### Stop on First Failure
```bash
python -m pytest test_*.py -v -x
```

## 🔧 Configuration

Edit `config.py` to customize:

```python
BASE_URL = "http://localhost:3000"          # Frontend URL
BROWSER = "chrome"                          # Browser: chrome or firefox
HEADLESS = False                            # Run without GUI
IMPLICIT_WAIT = 10                          # Element wait timeout (seconds)

TEST_USER = {
    "email": "testuser@example.com",
    "password": "testuser123"
}

ADMIN_USER = {
    "email": "vj.vijetha01@gmail.com",
    "password": "Admin123#"
}
```

## 📋 Dependencies

From `requirements.txt`:
- **selenium** 4.15.2 - WebDriver automation
- **pytest** 7.4.3 - Test framework
- **pytest-timeout** 2.1.0 - Test timeout management
- **pytest-xdist** 3.5.0 - Parallel test execution
- **webdriver-manager** 4.0.1 - WebDriver management

## 🐛 Troubleshooting

### Python Not Found
```bash
# Verify Python installation
python --version
# or
python3 --version
```

### Dependencies Not Installed
```bash
pip install -r requirements.txt
```

### Browser Not Found
```
Install Chrome or Firefox browser
```

### Tests Timing Out
Increase timeout in `config.py`:
```python
IMPLICIT_WAIT = 30  # 30 seconds
PAGE_LOAD_TIMEOUT = 60  # 60 seconds
```

### Login Failing
Check credentials in `config.py` and verify user exists in database

## ✨ Features

✅ **Detailed Step-by-Step Reporting**
- Each step clearly marked with ✓, ✓ or ✗
- Console output shows progress in real-time

✅ **Automatic Screenshots**
- One screenshot per test step
- Saved with timestamp and step name
- Error screenshots automatically captured

✅ **Error Handling**
- Graceful error recovery
- Full stacktrace on failure
- Non-critical warnings don't fail tests

✅ **Reusable Test Methods**
- `wait_for_element()` - Wait for element to load
- `safe_click()` - Safely click with scroll
- `safe_send_keys()` - Clear and type text
- `take_screenshot()` - Capture screen
- `navigate_to()` - Navigate to URL
- And more in `base_test.py`

✅ **Flexible Configuration**
- Customize users, URLs, timeouts
- Switch between Chrome/Firefox
- Headless mode for CI/CD

✅ **Pytest Features**
- Verbose output with `-v`
- Show prints with `-s`
- Stop on failure with `-x`
- Parallel execution with `-n`

## 📖 Documentation

Full guide available in: `selenium-tests/PYTEST_TESTS_GUIDE.md`

Covers:
- Installation & setup
- Running individual tests
- Configuration options
- Base test methods
- Adding new tests
- Debugging & troubleshooting
- CI/CD integration
- Best practices

## 🎬 Next Steps

1. ✅ All 8 test cases created
2. ✅ Configuration ready
3. ✅ Base class with helper methods
4. ✅ Documentation complete
5. 📝 Run tests: `python -m pytest test_*.py -v`
6. 📊 Review screenshots in `selenium-tests/screenshots/`
7. 🔄 Modify tests as needed for your app

## 🤝 Support

Test files are ready to use. If tests fail:

1. **Check screenshot** - See what happened
2. **Verify services running** - Backend & Frontend
3. **Check credentials** - In `config.py`
4. **Read console output** - Shows exact failure point
5. **Review test code** - Find selectors that need updating

Modify selectors in test files if your HTML structure differs:

```python
# Example - update selector if needed
email_field = self.wait_for_element(By.CSS_SELECTOR, "input[name='email']")
# If that doesn't work, try:
email_field = self.wait_for_element(By.ID, "email-input")
# Or:
email_field = self.wait_for_element(By.XPATH, "//input[@type='email']")
```

---

**Everything is ready to go!** Run `python -m pytest test_*.py -v` to start testing.
