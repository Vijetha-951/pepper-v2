# 🚀 Run Tests Now - Simple Commands

## ✅ Step 1: Make Sure PEPPER is Running

**Terminal 1 (Backend):**
```bash
cd backend
npm start
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm start
```

**Verify:** Open http://localhost:3000 in your browser

---

## ✅ Step 2: Run the Tests

**In your current terminal (you're already in the python folder):**

```bash
pytest --html=reports/report.html --self-contained-html -v
```

**Or use the batch file:**
```bash
run_tests.bat
```

---

## ✅ Step 3: View Results

After tests complete:
1. Open: `reports/report.html` in your browser
2. Check: `screenshots/` folder for individual screenshots

---

## 🎯 That's It!

**Just run:**
```bash
pytest --html=reports/report.html --self-contained-html -v
```

**Expected output:**
```
test_login.py::TestLogin::test_login PASSED
test_add_to_cart.py::TestAddToCart::test_add_to_cart PASSED
test_admin_add_product.py::TestAdminAddProduct::test_admin_add_product PASSED
test_admin_update_stock.py::TestAdminUpdateStock::test_admin_update_stock PASSED

========== 4 passed in XX.XXs ==========
```

---

## 📊 View HTML Report

Open: `selenium-tests/python/reports/report.html`

You'll see:
- ✅ Test results
- ✅ Embedded screenshots
- ✅ Detailed logs
- ✅ Timing information

---

## 🔧 If Tests Fail

1. **Check screenshots** in `screenshots/` folder
2. **Check credentials** in `config.py`
3. **Verify application** is running on http://localhost:3000
4. **Check console output** for error messages

---

**Ready? Just run the pytest command above!** 🎉


