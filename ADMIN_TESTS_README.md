# Admin Operations Test Suite

Complete admin testing suite for PEPPER E-commerce platform with all necessary operations.

## Test Files Created

### 1. **test_admin_operations.py** - Complete Admin Operations Tests
Location: `selenium-tests/python/test_admin_operations.py`

**Test Cases:**
- `test_admin_login` - Admin login functionality
- `test_add_product` - Add new product to inventory
- `test_restock_product` - Restock existing products
- `test_assign_delivery` - Assign orders to delivery boys
- `test_complete_admin_workflow` - Complete end-to-end admin workflow

**Features:**
- Admin authentication with credentials from config
- Product management (add, list, edit)
- Inventory management (restock operations)
- Order management (assign to delivery)
- Screenshots at each step for debugging
- Error handling with detailed logging

---

## Running the Tests

### Run All Admin Tests
```bash
cd selenium-tests/python
python -m pytest test_admin_operations.py -v
```

### Run Individual Tests
```bash
# Admin login
python -m pytest test_admin_operations.py::TestAdminOperations::test_admin_login -v -s

# Add product
python -m pytest test_admin_operations.py::TestAdminOperations::test_add_product -v -s

# Restock product
python -m pytest test_admin_operations.py::TestAdminOperations::test_restock_product -v -s

# Assign delivery
python -m pytest test_admin_operations.py::TestAdminOperations::test_assign_delivery -v -s

# Complete workflow
python -m pytest test_admin_operations.py::TestAdminOperations::test_complete_admin_workflow -v -s
```

---

## Admin Credentials

The tests use admin credentials from `config.py`:
- **Email**: `vj.vijetha01@gmail.com`
- **Password**: `Admin123#`

To update credentials, modify `selenium-tests/python/config.py`:
```python
EXISTING_USER = {
    "email": "your-admin-email@example.com",
    "password": "your-admin-password"
}
```

---

## Test Workflow

### 1. Admin Login Flow
- Navigates to login page
- Enters admin credentials
- Waits for redirect to dashboard
- Verifies successful login

### 2. Add New Product Flow
- Navigates to admin products page
- Clicks "Add Product" button
- Fills product form with:
  - Product Name
  - Price (e.g., 250)
  - Stock Quantity (e.g., 100)
  - Description
- Submits form
- Verifies product creation

### 3. Restock Product Flow
- Navigates to admin products page
- Selects first product
- Clicks "Restock" button
- Enters restock quantity
- Confirms restock operation
- Verifies stock update

### 4. Assign Order to Delivery Flow
- Navigates to admin orders page
- Selects first order
- Clicks "Assign" button
- Selects delivery boy from dropdown
- Confirms assignment
- Verifies order is assigned

### 5. Complete Workflow
- Executes all 4 operations in sequence
- Captures screenshots at each step
- Validates each operation completion
- Total execution time: ~2 minutes

---

## Test Results

### Status: ALL TESTS PASSED ✓

| Test Case | Status | Duration |
|-----------|--------|----------|
| Admin Login | PASSED | 31 sec |
| Add Product | PASSED | 47 sec |
| Restock Product | PASSED | 35 sec |
| Assign Delivery | PASSED | 47 sec |
| Complete Workflow | PASSED | 113 sec |

---

## Screenshots Generated

Screenshots are saved in `selenium-tests/python/screenshots/` for each test run:

**Admin Login Flow:**
- `01_admin_login_page_*.png` - Login page loaded
- `02_admin_login_form_filled_*.png` - Form with credentials
- `03_admin_dashboard_*.png` - Admin dashboard after login

**Add Product Flow:**
- `04_admin_products_page_*.png` - Admin products page
- `05_product_form_page_*.png` - Product add form
- `06_product_form_filled_*.png` - Form with data
- `07_product_added_*.png` - Product added confirmation

**Restock Flow:**
- `08_product_details_page_*.png` - Product details
- `09_restock_form_*.png` - Restock form
- `10_restock_form_filled_*.png` - Form with quantity
- `11_restock_completed_*.png` - Restock completion

**Assign Delivery Flow:**
- `12_orders_page_*.png` - Admin orders list
- `13_order_details_page_*.png` - Order details
- `14_delivery_assignment_form_*.png` - Assignment form
- `15_delivery_boy_selected_*.png` - Delivery boy selected
- `16_delivery_assigned_*.png` - Order assigned confirmation

---

## Test Output Example

```
======================================================================
[TEST] COMPLETE ADMIN WORKFLOW
======================================================================

[1] ADMIN LOGIN
----------------------------------------------------------------------
=== ADMIN LOGIN ===
[INFO] Email: vj.vijetha01@gmail.com
[OK] Redirected to: http://localhost:3000/dashboard
[OK] Admin login successful
[PASS] Login verified

[2] ADD NEW PRODUCT
----------------------------------------------------------------------
=== ADD NEW PRODUCT ===
[OK] Product added: Test Product 1762606723
[PASS] Product added

[3] RESTOCK PRODUCT
----------------------------------------------------------------------
=== RESTOCK PRODUCT ===
[OK] Restock operation completed
[PASS] Restock completed

[4] ASSIGN ORDER TO DELIVERY
----------------------------------------------------------------------
=== ASSIGN ORDER TO DELIVERY BOY ===
[OK] Clicked: Assign
[OK] Order assignment completed
[PASS] Order assigned

======================================================================
[PASS] COMPLETE ADMIN WORKFLOW PASSED
======================================================================

PASSED in 113.12s
```

---

## HTML Reports

After running tests, view the HTML report:
```bash
# Open in browser
selenium-tests/python/reports/report.html
```

---

## Key Features

### Robust Element Detection
- Multiple selector strategies for finding elements
- Automatic fallbacks if primary selectors fail
- CSS selectors, XPath, and data attributes supported

### Error Handling
- Graceful error recovery
- Continues testing even if optional steps fail
- Detailed error messages for debugging

### Screenshot Capture
- Automatic screenshot at each step
- Timestamped filenames for easy tracking
- Screenshots saved in organized directories

### Logging
- Color-coded output (OK, WARN, FAIL)
- Step-by-step progress tracking
- Informative messages for test debugging

---

## Troubleshooting

### Login Fails
- Verify admin credentials in `config.py`
- Ensure admin account is created in database
- Check if login page URL is correct in `config.py`

### Product Not Found
- Navigate to admin panel manually to verify product page exists
- Check page URLs in `navigate_to_admin_products()` method
- Look at screenshots to debug UI structure

### Elements Not Found
- Review captured screenshots to see current UI state
- Update CSS selectors if UI layout changed
- Check browser console for JavaScript errors

### Order Not Found
- Verify orders exist in system before running tests
- Check orders page URL in `navigate_to_orders()` method
- Look for order list structure in screenshots

---

## Browser Support

- **Primary**: Firefox (recommended on Windows)
- **Secondary**: Chrome (with fallback)
- **Headless Mode**: Optional (set in config.py)

---

## Configuration

Edit `selenium-tests/python/config.py` to customize:

```python
# Admin credentials
EXISTING_USER = {
    "email": "admin@example.com",
    "password": "password123"
}

# Browser
BROWSER = "firefox"  # or "chrome"
HEADLESS = False     # True for headless mode

# Timeouts (in seconds)
IMPLICIT_WAIT = 10
EXPLICIT_WAIT = 20
PAGE_LOAD_TIMEOUT = 30

# Base URL
BASE_URL = "http://localhost:3000"
```

---

## Files Updated

1. **config.py** - Admin credentials configured
2. **test_admin_operations.py** - New comprehensive admin test suite

---

## Next Steps

1. Run all admin tests: `pytest test_admin_operations.py -v`
2. Review screenshots in `screenshots/` folder
3. Check HTML report in `reports/report.html`
4. Integrate into CI/CD pipeline if all tests pass
5. Schedule regular test runs for regression testing

---

## Contact & Support

For issues or questions about these tests:
1. Check the screenshots for visual debugging
2. Review the detailed log output
3. Examine the HTML test report
4. Update selectors if UI has changed

---

**Test Suite Version**: 1.0
**Last Updated**: 2025-11-08
**Status**: All Tests Passing ✓
