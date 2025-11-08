# 🚀 Quick Start Guide - Python Selenium Tests

## ✅ What You Have Now

You now have a **complete Python-based Selenium test suite** with:

1. ✅ **Test Case 1: User Login** (`test_login.py`)
2. ✅ **Test Case 2: Add to Cart** (`test_add_to_cart.py`) 
3. ✅ **Test Case 3: Admin Add Product** (`test_admin_add_product.py`)
4. ✅ **Test Case 4: Admin Update Stock** (`test_admin_update_stock.py`)

All tests include:
- ✅ Screenshot capture at each step
- ✅ HTML reports with embedded screenshots (pytest-html)
- ✅ Detailed logging and error handling
- ✅ Base test class with helper methods
- ✅ Configuration management

## 📋 Setup Steps

### Step 1: Install Python Dependencies

```bash
cd selenium-tests/python
pip install -r requirements.txt
```

### Step 2: Configure Test Settings

Edit `config.py` if needed:
- `BASE_URL`: Your application URL (default: http://localhost:3000)
- `EXISTING_USER`: Admin credentials
- `BROWSER`: chrome or firefox
- `HEADLESS`: true or false

### Step 3: Start Your Application

Make sure PEPPER is running on `http://localhost:3000`

### Step 4: Run Tests

**Windows:**
```bash
run_tests.bat
```

**Linux/Mac:**
```bash
chmod +x run_tests.sh
./run_tests.sh
```

**Or manually:**
```bash
pytest --html=reports/report.html --self-contained-html -v
```

## 📊 View Reports

After running tests, open:
- `reports/report.html` - HTML report with embedded screenshots
- `screenshots/` - Individual screenshot files

## 🎯 Test Structure

Each test file follows this pattern:
```python
class TestAddToCart(BaseTest):
    def test_add_to_cart(self):
        # Step 1: Login
        # Step 2: Navigate
        # Step 3: Interact
        # Step 4: Verify
        # Screenshots at each step
```

## 📸 Screenshots

Screenshots are automatically:
- Taken at each test step
- Saved to `screenshots/` directory
- Embedded in HTML reports
- Named with timestamps

## 🔧 Customization

### Run Specific Test:
```bash
pytest test_login.py
pytest test_add_to_cart.py
```

### Run in Headless Mode:
```bash
HEADLESS=true pytest
```

### Run with Chrome:
```bash
BROWSER=chrome pytest
```

### Run with Firefox:
```bash
BROWSER=firefox pytest
```

## ✅ Expected Results

When tests pass, you'll see:
- ✅ All 4 tests passing
- ✅ Screenshots for each step
- ✅ HTML report with embedded screenshots
- ✅ Detailed console output

## 🐛 Troubleshooting

1. **Browser not found**: Install Chrome or Firefox
2. **Application not running**: Start PEPPER on localhost:3000
3. **Login fails**: Check credentials in `config.py`
4. **Element not found**: Check application UI structure

## 📁 File Structure

```
python/
├── base_test.py           # Base test class
├── config.py              # Configuration
├── test_login.py          # Test Case 1
├── test_add_to_cart.py    # Test Case 2
├── test_admin_add_product.py  # Test Case 3
├── test_admin_update_stock.py # Test Case 4
├── conftest.py            # Pytest configuration
├── pytest.ini             # Pytest settings
├── requirements.txt       # Python dependencies
├── run_tests.bat          # Windows runner
├── run_tests.sh           # Linux/Mac runner
├── screenshots/           # Screenshot directory
└── reports/               # HTML reports
```

## 🎉 You're Ready!

Your Python Selenium test suite is complete and ready to use. Just run the tests and view the HTML reports with embedded screenshots!


