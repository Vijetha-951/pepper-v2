# Quick Start Guide - Test Suite

Get started with PEPPER E-commerce tests in 5 minutes!

---

## Prerequisites

```bash
# Navigate to test directory
cd selenium-tests/python

# Install dependencies (if needed)
pip install selenium pytest pytest-html webdriver-manager
```

---

## Run Tests Now

### Option 1: Complete Admin Workflow (Recommended - 2 minutes)
```bash
python -m pytest test_admin_operations.py::TestAdminOperations::test_complete_admin_workflow -v -s
```
✅ Tests all admin operations in sequence

### Option 2: All Admin Tests (5 minutes)
```bash
python -m pytest test_admin_operations.py -v
```
✅ Runs: Login, Add Product, Restock, Assign Delivery individually

### Option 3: Individual Admin Tests
```bash
# Just login
python -m pytest test_admin_operations.py::TestAdminOperations::test_admin_login -v -s

# Just add product
python -m pytest test_admin_operations.py::TestAdminOperations::test_add_product -v -s

# Just restock
python -m pytest test_admin_operations.py::TestAdminOperations::test_restock_product -v -s

# Just assign delivery
python -m pytest test_admin_operations.py::TestAdminOperations::test_assign_delivery -v -s
```

---

## What Gets Tested

### Admin Operations Tested ✓

1. **Admin Login**
   - Email: vj.vijetha01@gmail.com
   - Password: Admin123#

2. **Add New Product**
   - Creates test product with name, price, stock, description
   
3. **Restock Product**
   - Updates existing product stock quantity

4. **Assign Order to Delivery Boy**
   - Selects delivery personnel for order

---

## View Results

### Console Output
Tests print step-by-step progress:
```
[OK] Admin login successful
[OK] Product added: Test Product 1762606723
[OK] Restock operation completed
[OK] Order assignment completed
[PASS] COMPLETE WORKFLOW PASSED
```

### Screenshots
Located in: `screenshots/` folder
- Auto-created at each test step
- Timestamped filenames
- Useful for debugging

### HTML Report
Located in: `reports/report.html`
- Open in browser for detailed results
- Test duration, pass/fail status
- Full execution timeline

---

## Expected Results

### Admin Login Test
```
Status: PASSED
Duration: ~31 seconds
Result: Successfully logs into admin dashboard
```

### Add Product Test
```
Status: PASSED
Duration: ~47 seconds
Result: Creates new product in system
```

### Restock Test
```
Status: PASSED
Duration: ~35 seconds
Result: Updates product stock quantity
```

### Assign Delivery Test
```
Status: PASSED
Duration: ~47 seconds
Result: Assigns order to delivery boy
```

### Complete Workflow
```
Status: PASSED
Duration: ~113 seconds (2 minutes)
Result: All 4 operations completed successfully
```

---

## Troubleshooting

### Tests Won't Start
```bash
# Ensure you're in correct directory
pwd  # Should show: .../selenium-tests/python

# Try with explicit Python path
/usr/bin/python3 -m pytest test_admin_operations.py -v
```

### Firefox Not Found
```bash
# Install Firefox or use Chrome
# In config.py, change: BROWSER = "chrome"
```

### Elements Not Found Errors
```bash
# Check screenshots to see actual UI state
# Look in: screenshots/ folder

# If UI changed, may need selector updates
# Edit the specific test case with new selectors
```

### Timeout Errors
```bash
# Increase timeouts in config.py
EXPLICIT_WAIT = 30  # Was 20, now 30 seconds
```

---

## Next Steps

After running tests successfully:

1. **Review Screenshots** 📸
   - Check `screenshots/` folder
   - Verify UI looks correct
   - Document any UI changes

2. **Check HTML Report** 📊
   - Open `reports/report.html`
   - Review timing and status
   - Share with team

3. **Schedule Regular Runs** 📅
   - Daily: `test_complete_admin_workflow`
   - Weekly: All admin tests
   - Monthly: Full test suite

4. **Update Credentials** 🔐
   - If admin password changes, update `config.py`
   - Never commit credentials to git
   - Use environment variables for security

---

## Common Commands

```bash
# Run with minimal output
pytest test_admin_operations.py -q

# Run with full output including prints
pytest test_admin_operations.py -v -s

# Run with HTML report generation
pytest test_admin_operations.py --html=reports/report.html

# Run and stop on first failure
pytest test_admin_operations.py -x

# Run specific test by name
pytest test_admin_operations.py -k "admin_login"

# Run and show slowest tests
pytest test_admin_operations.py --durations=5
```

---

## File Locations

| File | Location | Purpose |
|------|----------|---------|
| Admin Tests | `test_admin_operations.py` | Main test suite |
| Config | `config.py` | Settings & credentials |
| Base Class | `base_test.py` | Test utilities |
| Screenshots | `screenshots/` | Test images |
| Reports | `reports/report.html` | Test results |
| Docs | `../ADMIN_TESTS_README.md` | Detailed guide |

---

## Browser Window

When tests run, you'll see:
- Firefox browser opens automatically
- Tests interact with the UI
- Screenshots captured at each step
- Browser closes when test finishes

⚠️ **Don't close the browser** - let tests complete

---

## Real-World Usage

### Development
```bash
# Run while coding to verify changes
pytest test_admin_operations.py::TestAdminOperations::test_admin_login -v -s
```

### Quality Assurance
```bash
# Run complete workflow for validation
pytest test_admin_operations.py::TestAdminOperations::test_complete_admin_workflow -v
```

### Continuous Integration
```bash
# Run full suite for regression testing
pytest test_admin_operations.py -v --html=reports/report.html
```

### Before Deployment
```bash
# Run all tests to ensure nothing is broken
pytest test_admin_operations.py -v
```

---

## Getting Help

### Test Not Working?
1. Check the error message
2. Look at the screenshot captured
3. Review `ADMIN_TESTS_README.md` for troubleshooting
4. Check `TEST_SUITE_SUMMARY.md` for detailed documentation

### UI Changed?
1. Manually test the feature
2. Take screenshots to see new UI
3. Update CSS selectors in test file
4. Re-run to verify

### Need More Info?
- See: `ADMIN_TESTS_README.md` for comprehensive guide
- See: `TEST_SUITE_SUMMARY.md` for architecture details
- See: `test_admin_operations.py` for implementation

---

## Performance Notes

- **Fastest Test**: Admin Login (~31 seconds)
- **Slowest Test**: Complete Workflow (~113 seconds)
- **Average**: ~47 seconds per operation
- **Network**: Impact depends on server response time

---

## Security Notes

⚠️ **Important**
- Don't commit credentials to git
- Use environment variables for CI/CD
- Rotate admin password periodically
- Don't share login credentials in chat/email

---

## Success Checklist

✅ Tests run without errors  
✅ All tests show PASSED status  
✅ Screenshots captured successfully  
✅ HTML report generated  
✅ No timeout errors  
✅ No element not found errors  

---

## That's It! 🎉

You now have:
- ✅ 5 working admin tests
- ✅ Complete test documentation  
- ✅ Automated screenshots for debugging
- ✅ HTML reports for sharing results
- ✅ Ready for CI/CD integration

**Happy Testing!**

---

## Still Need Help?

1. Review the detailed guides:
   - `ADMIN_TESTS_README.md` - Complete admin test guide
   - `TEST_SUITE_SUMMARY.md` - Full architecture & details

2. Check the screenshots:
   - `screenshots/` folder - Visual debugging

3. Review test output:
   - Look for [OK] / [PASS] / [FAIL] markers

4. Read the test code:
   - `test_admin_operations.py` - Implementation details

---

**Version**: 1.0  
**Last Updated**: 2025-11-08  
**Status**: ✅ Production Ready
