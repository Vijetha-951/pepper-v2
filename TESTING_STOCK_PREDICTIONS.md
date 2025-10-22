# Testing Stock Demand Prediction Feature

## 🧪 Test Environment Setup

### Prerequisites
1. Backend running on `http://localhost:5000`
2. Frontend running on `http://localhost:3000`
3. MongoDB with sample data
4. Admin user account

### Starting the Application

**Terminal 1 - Backend:**
```bash
cd c:\xampp\htdocs\PEPPER\backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd c:\xampp\htdocs\PEPPER\frontend
npm start
```

## 📊 Test Scenario 1: View Predictions Dashboard

### Steps:
1. Log in as admin user
2. Navigate to Dashboard (you should see Overview tab)
3. Scroll down to find "📊 Stock Demand Prediction" widget

### Expected Results:
- ✅ Widget loads without errors
- ✅ Displays 4 summary cards
- ✅ Shows trend distribution
- ✅ Lists 1-5 top priority products
- ✅ Each product card shows:
  - Product rank (1-5)
  - Product name
  - Current stock
  - Recommendation badge
  - Stock adjustment percentage

### If Widget Doesn't Load:
1. Check browser console for JavaScript errors
2. Verify backend is running: `curl http://localhost:5000/api/health`
3. Check network tab - verify API calls succeed
4. Ensure user role is 'admin'

## 🔄 Test Scenario 2: Refresh Predictions

### Steps:
1. View the prediction widget
2. Click the green "Refresh" button
3. Wait for predictions to reload

### Expected Results:
- ✅ Loading state appears briefly
- ✅ New data is fetched
- ✅ Widget updates with fresh predictions
- ✅ "Generated at" timestamp is current

### If Refresh Fails:
1. Check browser console for fetch errors
2. Verify `/api/admin/demand-predictions/summary/dashboard` returns 200
3. Confirm backend auth middleware is working

## 📋 Test Scenario 3: Expand Product Details

### Steps:
1. Click on any product card in the top 5
2. Card should expand to show more details
3. Click again to collapse

### Expected Results When Expanded:
- ✅ Prediction reasoning is visible
- ✅ Sales history table shows (up to 3 months)
- ✅ Each history item shows: Month, Sales quantity
- ✅ Click again collapses the card

## 🎯 Test Scenario 4: API Testing

### Test 1: Dashboard Summary Endpoint

**Command:**
```bash
curl -X GET http://localhost:5000/api/admin/demand-predictions/summary/dashboard \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "summary": {
    "totalProducts": 21,
    "criticalStocks": 2,
    "increaseDemand": 5,
    "reduceDemand": 3,
    "trends": {
      "rising": 7,
      "declining": 4,
      "stable": 10
    },
    "topUrgent": [
      {
        "product": { "name": "Karimunda", ... },
        "currentStock": 8,
        "prediction": { "recommendation": "INCREASE", ... }
        ...
      }
    ],
    "generalHealth": {
      "healthy": 10,
      "adequate": 8,
      "low": 2,
      "outOfStock": 1
    }
  },
  "generatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Test 2: Top Predictions Endpoint

**Command:**
```bash
curl -X GET "http://localhost:5000/api/admin/demand-predictions?limit=3&monthsBack=6" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "predictions": [
    {
      "product": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Karimunda",
        "type": "Climber"
      },
      "currentStock": 8,
      "totalStock": 50,
      "stockHealth": "ADEQUATE",
      "salesMetrics": {
        "averageMonthlySales": 8.5,
        "recentAverageMonthlySales": 12.3,
        "trend": "RISING",
        "salesHistory": [...]
      },
      "prediction": {
        "recommendation": "INCREASE",
        "adjustmentPercentage": 30,
        "suggestedStock": 24,
        "reason": "Rising trend with insufficient stock. Current: 8, Recent avg: 12",
        "confidence": 85
      },
      "urgencyScore": 87
    },
    ...
  ],
  "total": 3,
  "generatedAt": "2024-01-15T10:30:00.000Z",
  "analysisMetadata": {
    "monthsAnalyzed": 6,
    "recommendedActions": {
      "INCREASE": 5,
      "REDUCE": 2,
      "MAINTAIN": 10,
      "MONITOR": 4
    }
  }
}
```

### Test 3: Single Product Prediction

**Command:**
```bash
curl -X GET "http://localhost:5000/api/admin/demand-predictions/507f1f77bcf86cd799439011?monthsBack=6" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "prediction": {
    "product": { ... },
    "currentStock": 8,
    "prediction": { ... }
  },
  "generatedAt": "2024-01-15T10:30:00.000Z"
}
```

## 🎨 Test Scenario 5: UI Elements

### Summary Cards
**Test:**
- Click on each card
- Verify text and numbers are visible
- Check colors match the spec:
  - Critical: Red (#fee2e2 background)
  - Increase: Green (#d1fae5 background)
  - Reduce: Orange (#fef3c7 background)
  - Total: Blue (#dbeafe background)

### Recommendation Badges
**Test:**
- Verify badge colors:
  - INCREASE: Green background, green text
  - REDUCE: Red background, red text
  - MAINTAIN: Yellow background, yellow text
  - MONITOR: Blue background, blue text

### Product Cards
**Test:**
- Rank badge (1-5) is visible and numbered correctly
- Product image displays (if available)
- Recommendation badge is properly colored
- Stock adjustment shows current → suggested + percentage

## 📈 Test Scenario 6: Decision Tree Logic Validation

### Test Case: Product with Rising Trend

**Setup:**
Create orders for product "Test Product" with these monthly sales:
- January: 5 units
- February: 8 units
- March: 12 units
- Current stock: 7 units

**Expected Prediction:**
- Trend: RISING (12 > 5 * 1.2)
- Current stock (7) < Recent avg (8.3)? YES
- Recent avg (8.3) > Overall avg (8.3) * 1.5? NO
- Recommendation: INCREASE
- Adjustment: 20%
- Suggested Stock: ~8-9 units

**How to Test:**
1. Use seed script to create test data
2. Create orders for "Test Product"
3. Check prediction matches expected values
4. Verify recommendation reasoning in expanded view

### Test Case: Product with Declining Trend

**Setup:**
Create orders with declining pattern:
- January: 20 units
- February: 12 units
- March: 5 units
- Current stock: 15 units

**Expected Prediction:**
- Trend: DECLINING (5 < 12 * 0.8)
- Stock turnover: 5/15 = 33% (> 30%)
- Recommendation: MAINTAIN or REDUCE (borderline)

### Test Case: New Product (No Sales)

**Setup:**
Create a new product with no orders

**Expected Prediction:**
- Trend: STABLE (no data)
- Recommendation: MONITOR
- Confidence: Low (depends on data points)
- Reason: "New product with no sales history"

## 🔐 Test Scenario 7: Security & Permissions

### Test 1: Non-Admin Access
**Steps:**
1. Log in as regular user (not admin)
2. Navigate to dashboard
3. Try to access `/api/admin/demand-predictions` directly

**Expected:**
- ✅ Widget NOT visible on dashboard
- ✅ Direct API call returns 403 Forbidden
- ✅ User is not affected by widget logic

### Test 2: Invalid Product ID
**Steps:**
```bash
curl -X GET "http://localhost:5000/api/admin/demand-predictions/invalid_id"
```

**Expected:**
- ✅ Returns 400/404 error
- ✅ Graceful error message
- ✅ No crash or security issues

## 🚨 Test Scenario 8: Edge Cases

### Test 1: No Orders in System
**Setup:** Fresh database with products but no orders

**Expected:**
- ✅ All products show MONITOR recommendation
- ✅ No crash
- ✅ Message: "No sales history"

### Test 2: Single Month of Data
**Setup:** Only 1 month of order history

**Expected:**
- ✅ Calculations work correctly
- ✅ Trend shows as STABLE
- ✅ Confidence is lower but still works

### Test 3: Seasonal Month
**Setup:** 
- Current month is March (spring)
- Product type is Climber
- Stable trend (not rising/declining)

**Expected:**
- ✅ Recommendation: INCREASE (seasonal bonus)
- ✅ Adjustment: 15%
- ✅ Reason mentions seasonal pattern

## 📊 Performance Tests

### Test 1: Load Time
**Setup:** Widget on dashboard with 21+ products

**Measurement:**
- Dashboard loads in < 3 seconds
- Widget fetches data in < 2 seconds
- No UI freezing or lag

### Test 2: Refresh Speed
**Setup:** Click Refresh button multiple times

**Measurement:**
- Each refresh takes < 1 second
- No memory leaks
- Multiple refreshes don't slow down widget

### Test 3: Large Dataset
**Setup:** 100+ products with 12+ months of history

**Measurement:**
- Predictions still generate within reasonable time
- No timeouts
- UI remains responsive

## ✅ Acceptance Criteria Checklist

- [ ] Widget displays on admin dashboard
- [ ] All 4 summary cards show correct data
- [ ] Trend distribution calculates correctly
- [ ] Top 5 products are ranked by urgency
- [ ] Product details can be expanded/collapsed
- [ ] Refresh button works
- [ ] API endpoints return correct JSON
- [ ] All recommendations have proper reasoning
- [ ] Confidence scores are calculated
- [ ] Non-admin users don't see widget
- [ ] No JavaScript errors in console
- [ ] Widget handles empty data gracefully
- [ ] Color coding matches spec
- [ ] Stock adjustment percentages are correct
- [ ] Sales history displays properly

## 🐛 Common Issues & Solutions

### Issue: Widget shows "Loading predictions..." forever
**Solution:**
1. Check backend is running: `npm start` in backend folder
2. Verify `/api/health` returns ok
3. Check browser console for errors
4. Verify admin token is valid

### Issue: "Failed to load demand predictions" error
**Solution:**
1. Check backend logs for errors
2. Verify MongoDB connection
3. Check user has admin role in database
4. Restart backend service

### Issue: Widget shows 0 products in summary
**Solution:**
1. Verify products exist in database: `db.products.countDocuments()`
2. Verify products are active: `isActive: true`
3. Verify orders exist with those products
4. Check date range (should have orders from last 6 months)

### Issue: All products show MONITOR recommendation
**Solution:**
1. This is expected if there's no sales data
2. Create test orders using seed script
3. Wait for data to propagate
4. Refresh predictions

## 📝 Test Report Template

```
Test Date: _______________
Tested By: _______________
Environment: Development / Staging / Production
Backend Version: _______________
Frontend Version: _______________

Test Results:
- Dashboard Widget: PASS / FAIL
- API Endpoints: PASS / FAIL
- Decision Logic: PASS / FAIL
- UI/UX: PASS / FAIL
- Performance: PASS / FAIL
- Security: PASS / FAIL

Issues Found:
1. _______________
2. _______________

Recommendations:
1. _______________
2. _______________

Sign-off: _______________ Date: _______________
```

---

**Last Updated**: 2024
**Test Coverage**: Comprehensive
**Estimated Test Time**: 30-45 minutes