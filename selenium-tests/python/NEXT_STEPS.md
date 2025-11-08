# 🎯 Next Steps - Running Your Selenium Tests

## ✅ Step-by-Step Guide

### **Step 1: Verify Prerequisites** ✅

Check if you have everything installed:

1. **Python 3.8+**
   ```bash
   python --version
   ```
   If not installed, download from: https://www.python.org/downloads/

2. **Chrome or Firefox Browser**
   - Chrome: https://www.google.com/chrome/
   - Firefox: https://www.mozilla.org/firefox/

3. **PEPPER Application Running**
   - Backend should be running on port 5000
   - Frontend should be running on port 3000
   - Test URL: http://localhost:3000

### **Step 2: Install Python Dependencies** 📦

```bash
cd selenium-tests/python
pip install -r requirements.txt
```

**Expected output:**
```
Successfully installed selenium-4.15.2 pytest-7.4.3 pytest-html-4.1.1 ...
```

### **Step 3: Verify Configuration** ⚙️

Check `config.py` - credentials should match your setup:

```python
EXISTING_USER = {
    "email": "vj.vijetha01@gmail.com",  # Your admin email
    "password": "Admin123#"              # Your admin password
}
```

**If different, update the credentials in `config.py`**

### **Step 4: Start Your Application** 🚀

Make sure PEPPER is running:

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

**Verify:** Open http://localhost:3000 in your browser - should see PEPPER homepage

### **Step 5: Run the Tests** 🧪

**Option A: Windows (Easiest)**
```bash
cd selenium-tests/python
run_tests.bat
```

**Option B: Manual Run**
```bash
cd selenium-tests/python
pytest --html=reports/report.html --self-contained-html -v
```

**Option C: Run Individual Tests**
```bash
# Test 1: Login
pytest test_login.py -v

# Test 2: Add to Cart
pytest test_add_to_cart.py -v

# Test 3: Admin Add Product
pytest test_admin_add_product.py -v

# Test 4: Admin Update Stock
pytest test_admin_update_stock.py -v
```

### **Step 6: View Results** 📊

1. **HTML Report:**
   - Open: `selenium-tests/python/reports/report.html`
   - Contains: Test results, screenshots, timing, errors

2. **Screenshots:**
   - Location: `selenium-tests/python/screenshots/`
   - Each test step has a screenshot

3. **Console Output:**
   - Shows: Step-by-step progress
   - Displays: Pass/Fail status
   - Includes: Screenshot paths

## 🎯 Expected Results

### **Successful Test Run:**

```
test_login.py::TestLogin::test_login PASSED
test_add_to_cart.py::TestAddToCart::test_add_to_cart PASSED
test_admin_add_product.py::TestAdminAddProduct::test_admin_add_product PASSED
test_admin_update_stock.py::TestAdminUpdateStock::test_admin_update_stock PASSED

========== 4 passed in 45.23s ==========
```

### **HTML Report Contents:**

- ✅ Summary: 4 tests passed
- ✅ Screenshots embedded for each step
- ✅ Detailed test logs
- ✅ Timing information
- ✅ Error messages (if any)

## 🔧 Troubleshooting

### **Issue 1: Python not found**
```bash
# Install Python or add to PATH
# Windows: Check "Add Python to PATH" during installation
```

### **Issue 2: pip install fails**
```bash
# Try:
python -m pip install -r requirements.txt
# Or:
pip3 install -r requirements.txt
```

### **Issue 3: Browser not found**
```bash
# Install Chrome or Firefox
# Or set browser in config.py:
BROWSER = "firefox"  # if Chrome not available
```

### **Issue 4: Application not running**
```bash
# Check if backend is running:
curl http://localhost:5000

# Check if frontend is running:
curl http://localhost:3000
```

### **Issue 5: Login fails**
```bash
# Update credentials in config.py:
EXISTING_USER = {
    "email": "your-email@example.com",
    "password": "your-password"
}
```

### **Issue 6: Element not found**
- Check screenshots in `screenshots/` folder
- Verify application UI matches test expectations
- Update selectors in test files if needed

## 📝 Test Execution Options

### **Run in Headless Mode (No Browser Window):**
```bash
HEADLESS=true pytest
```

### **Run with Specific Browser:**
```bash
BROWSER=chrome pytest
BROWSER=firefox pytest
```

### **Run with Custom URL:**
```bash
BASE_URL=http://localhost:3000 pytest
```

### **Run with Verbose Output:**
```bash
pytest -v -s
```

### **Run Only Failed Tests:**
```bash
pytest --lf
```

## ✅ Checklist Before Running

- [ ] Python 3.8+ installed
- [ ] Chrome or Firefox installed
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] PEPPER backend running (port 5000)
- [ ] PEPPER frontend running (port 3000)
- [ ] Credentials updated in `config.py` (if different)
- [ ] Application accessible at http://localhost:3000

## 🎉 After Running Tests

1. **Check HTML Report:**
   - Open `reports/report.html`
   - Review test results
   - View embedded screenshots

2. **Review Screenshots:**
   - Check `screenshots/` folder
   - Verify test steps executed correctly

3. **Fix Any Issues:**
   - Update test selectors if UI changed
   - Update credentials if needed
   - Check application logs for errors

## 🚀 Quick Start Command

**Everything in one command:**
```bash
cd selenium-tests/python && pip install -r requirements.txt && pytest --html=reports/report.html --self-contained-html -v
```

## 📞 Need Help?

1. Check screenshots for visual debugging
2. Review HTML report for detailed logs
3. Check console output for error messages
4. Verify application is running correctly
5. Update test selectors if UI structure changed

---

**You're all set! Run the tests and view the HTML reports with embedded screenshots!** 🎯


