# PEPPER Python Selenium Tests

Python-based Selenium test suite using pytest with HTML reports and screenshots.

## Prerequisites

1. Python 3.8 or higher
2. Chrome or Firefox browser installed
3. PEPPER application running on `http://localhost:3000`

## Installation

1. Install Python dependencies:
```bash
cd selenium-tests/python
pip install -r requirements.txt
```

## Configuration

Edit `config.py` to set:
- `BASE_URL`: Application URL (default: http://localhost:3000)
- `EXISTING_USER`: Admin credentials
- `BROWSER`: Browser to use (chrome/firefox)
- `HEADLESS`: Run in headless mode (true/false)

## Running Tests

### Run all tests:
```bash
pytest
```

### Run specific test:
```bash
pytest test_login.py
pytest test_add_to_cart.py
pytest test_admin_add_product.py
pytest test_admin_update_stock.py
```

### Run with HTML report:
```bash
pytest --html=reports/report.html --self-contained-html
```

### Run in headless mode:
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

## Test Cases

### Test Case 1: User Login
- File: `test_login.py`
- Tests: Login functionality with credentials
- Screenshots: Login page, form filled, login success

### Test Case 2: Add to Cart
- File: `test_add_to_cart.py`
- Tests: Adding products to cart
- Screenshots: Products page, product selected, added to cart, cart page

### Test Case 3: Admin Add Product
- File: `test_admin_add_product.py`
- Tests: Admin adding new products
- Screenshots: Admin page, form filled, product submitted

### Test Case 4: Admin Update Stock
- File: `test_admin_update_stock.py`
- Tests: Admin updating product stock
- Screenshots: Stock page, stock updated, stock saved

## Reports

HTML reports are generated in `reports/` directory:
- `report.html`: Main HTML report with embedded screenshots
- `junit.xml`: JUnit XML format for CI/CD integration

## Screenshots

Screenshots are saved in `screenshots/` directory with timestamps.

## Troubleshooting

1. **Browser not found**: Install Chrome or Firefox
2. **Application not running**: Start PEPPER on localhost:3000
3. **Login fails**: Check credentials in `config.py`
4. **Element not found**: Check application UI structure matches test selectors


