# 🚀 START HERE - Run Your Tests in 5 Minutes!

## Quick Start (Copy & Paste)

### **1. Install Dependencies**
```bash
cd selenium-tests\python
pip install -r requirements.txt
```

### **2. Start Your Application**
Make sure PEPPER is running on http://localhost:3000

### **3. Run Tests**
```bash
pytest --html=reports/report.html --self-contained-html -v
```

### **4. View Report**
Open `reports/report.html` in your browser!

---

## 📋 Detailed Steps

### Step 1: Check Prerequisites ✅

**Python:**
```bash
python --version
```
Should show: `Python 3.8.x` or higher

**Browser:**
- Chrome or Firefox must be installed

**Application:**
- Backend running on port 5000
- Frontend running on port 3000

### Step 2: Install Python Packages 📦

```bash
cd selenium-tests\python
pip install -r requirements.txt
```

This installs:
- selenium
- pytest
- pytest-html (for HTML reports)
- webdriver-manager (automatic driver management)

### Step 3: Verify Configuration ⚙️

Open `config.py` and check:
- `BASE_URL`: Should be `http://localhost:3000`
- `EXISTING_USER`: Your admin credentials
- `BROWSER`: `chrome` or `firefox`

### Step 4: Start PEPPER Application 🚀

**Terminal 1:**
```bash
cd backend
npm start
```

**Terminal 2:**
```bash
cd frontend
npm start
```

**Verify:** Open http://localhost:3000 - should see PEPPER homepage

### Step 5: Run Tests 🧪

**Windows:**
```bash
cd selenium-tests\python
run_tests.bat
```

**Or manually:**
```bash
pytest --html=reports/report.html --self-contained-html -v
```

### Step 6: View Results 📊

1. **HTML Report:** `reports/report.html`
2. **Screenshots:** `screenshots/` folder
3. **Console:** Test execution logs

## 🎯 What You'll Get

✅ **4 Test Cases:**
1. User Login
2. Add to Cart
3. Admin Add Product
4. Admin Update Stock

✅ **HTML Report with:**
- Test results (pass/fail)
- Embedded screenshots
- Detailed logs
- Timing information

✅ **Screenshots:**
- One screenshot per test step
- Saved in `screenshots/` folder
- Embedded in HTML report

## 🔧 Common Issues

### Python not found?
```bash
# Install Python from python.org
# Make sure to check "Add to PATH"
```

### pip install fails?
```bash
python -m pip install -r requirements.txt
```

### Browser not found?
```bash
# Install Chrome or Firefox
# Or change BROWSER in config.py to "firefox"
```

### Application not running?
```bash
# Start backend: cd backend && npm start
# Start frontend: cd frontend && npm start
```

### Login fails?
```bash
# Update credentials in config.py
EXISTING_USER = {
    "email": "your-email@example.com",
    "password": "your-password"
}
```

## 📝 Test Commands

**Run all tests:**
```bash
pytest
```

**Run specific test:**
```bash
pytest test_login.py
pytest test_add_to_cart.py
```

**Run with headless browser:**
```bash
HEADLESS=true pytest
```

**Run with verbose output:**
```bash
pytest -v -s
```

## ✅ Expected Output

```
test_login.py::TestLogin::test_login PASSED
test_add_to_cart.py::TestAddToCart::test_add_to_cart PASSED
test_admin_add_product.py::TestAdminAddProduct::test_admin_add_product PASSED
test_admin_update_stock.py::TestAdminUpdateStock::test_admin_update_stock PASSED

========== 4 passed in 45.23s ==========
```

## 🎉 You're Ready!

1. ✅ Install dependencies
2. ✅ Start PEPPER application
3. ✅ Run tests
4. ✅ View HTML report

**That's it! Your tests are ready to run!** 🚀


