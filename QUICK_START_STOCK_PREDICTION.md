# Stock Demand Prediction - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Start the Application (2 min)

**Terminal 1 - Start Backend:**
```bash
cd c:\xampp\htdocs\PEPPER\backend
npm start
```
Wait for: `✅ Connected to MongoDB` and `🚀 Server running on http://localhost:5000`

**Terminal 2 - Start Frontend:**
```bash
cd c:\xampp\htdocs\PEPPER\frontend
npm start
```
Wait for: Browser opens to `http://localhost:3000`

### Step 2: Log In as Admin (1 min)

1. Go to http://localhost:3000/login
2. Log in with admin credentials
3. You should see the Dashboard automatically

### Step 3: Navigate to Dashboard (1 min)

1. Click "Overview" tab (should already be selected)
2. Scroll down to see "📊 Stock Demand Prediction" widget
3. Wait for data to load

### Step 4: Review Predictions (1 min)

**You'll see:**
- 📊 4 Summary Cards (Critical Stocks, Need Increase, Can Reduce, Total)
- 📈 Trend Distribution (Rising/Stable/Declining breakdown)
- 🔥 Top 5 Priority Products with recommendations

**Click on any product** to see:
- Detailed prediction reasoning
- Last 3 months sales history
- Stock adjustment recommendation

---

## 💡 Understanding the Predictions

### The 4 Recommendation Types

| Recommendation | Icon | Color | Meaning |
|---|---|---|---|
| **INCREASE** | ⬆️ | Green | Rising demand, increase stock |
| **REDUCE** | ⬇️ | Red | Declining demand, reduce stock |
| **MAINTAIN** | ➡️ | Yellow | Steady demand, keep current |
| **MONITOR** | 👁️ | Blue | New product, watch demand |

### What the Numbers Mean

- **Current Stock**: Units available right now
- **Suggested Stock**: Recommended inventory level
- **Adjustment %**: Percentage to increase/decrease
- **Confidence %**: How reliable the prediction is (higher = better)

### Examples

**Example 1: Rising Demand**
```
Product: Karimunda
Current: 8 units
Trend: RISING ↑
Confidence: 85%
Recommendation: INCREASE +30%
Suggested: 24 units
Reason: Rising trend with insufficient stock
```
👉 **Action:** Order more inventory

**Example 2: Declining Demand**
```
Product: Thekkan 1
Current: 45 units
Trend: DECLINING ↓
Confidence: 78%
Recommendation: REDUCE -20%
Suggested: 36 units
Reason: Declining trend with poor stock turnover
```
👉 **Action:** Reduce next restock order

**Example 3: New Product**
```
Product: New Pepper Variety
Current: 10 units
Trend: STABLE →
Confidence: 45%
Recommendation: MONITOR
Suggested: 10 units
Reason: New product with no sales history
```
👉 **Action:** Wait and observe customer response

---

## 🎯 How Predictions Are Made

The system analyzes:
1. **Last 6 months** of sales data
2. **Sales trend** (going up, down, or stable?)
3. **Product type** (Climber or Bush pepper?)
4. **Current stock level** (enough? too much?)

Then applies **decision rules**:

```
IF no sales yet → MONITOR
IF sales declining → REDUCE
IF sales rising & low stock → INCREASE
IF seasonal month → INCREASE
IF critical stock (≤5) → INCREASE
ELSE → MAINTAIN
```

---

## 📊 Dashboard Widget Features

### Summary Cards
- **Critical Stocks**: ⚠️ Products with ≤5 units
- **Need Increase**: 📈 Products with rising demand
- **Can Reduce**: 📉 Products with declining demand
- **Total Analyzed**: 📦 All products tracked

### Trend Distribution
- **Rising**: Products with increasing sales
- **Stable**: Products with steady sales
- **Declining**: Products with decreasing sales

### Top 5 Products
Ranked by **Urgency Score** (what needs attention most)

Each card shows:
- Rank (1-5)
- Product name & type
- Current stock
- Recommendation
- Recent sales average
- Current trend
- Confidence score

**Click to expand** and see:
- Detailed prediction reason
- Sales history (last 3 months)

---

## 🔄 Using the Refresh Button

Click the green **"Refresh"** button to:
- Re-calculate all predictions
- Get latest sales data
- Update recommendation rankings

Use when:
- ✅ You've made recent stock changes
- ✅ New orders have been placed
- ✅ You want to verify current state

---

## ⚡ Common Actions

### "I see INCREASE recommendation - what do I do?"
1. Note the suggested stock level
2. Go to **Stock Management** tab
3. Click on the product
4. Use the Restock button
5. Add the recommended quantity
6. Save

### "A product shows MONITOR - should I order?"
1. Not yet - wait for more sales data
2. Check back in a few days
3. If trend emerges, recommendation will change
4. Then take action

### "Product recommendation seems wrong"
1. Click product to expand details
2. Review the sales history
3. Check the reasoning given
4. Consider external factors (season, campaigns, etc.)
5. Use your judgment + prediction as guidance

---

## 📈 Tips & Best Practices

### ✅ DO:
- ✅ Review predictions weekly
- ✅ Consider seasonal factors
- ✅ Use confidence score as tie-breaker
- ✅ Combine with your market knowledge
- ✅ Monitor critical stocks closely

### ❌ DON'T:
- ❌ Follow recommendations blindly
- ❌ Ignore products with low confidence
- ❌ Skip manual verification
- ❌ Forget about supplier lead times
- ❌ Ignore market trends

---

## 🔧 Customization

### Change Analysis Period
Edit `backend/src/services/demandPredictionService.js`:
```javascript
// Line 35 - change from 6 to desired months
static async generatePredictions(monthsBack = 6)
```

### Adjust Seasonal Months
Same file, `checkSeasonalPattern()` method:
```javascript
'Climber': [3, 4, 5, 9, 10, 11],  // Adjust these months
'Bush': [4, 5, 6, 7, 8]            // Adjust these months
```

### Change Adjustment Percentages
Same file, look for values like `20`, `30`, `15`, `10` in `predictDemand()`

---

## 🐛 Troubleshooting

### Widget not showing?
1. ✅ You must be logged in as admin
2. ✅ Check browser console (F12) for errors
3. ✅ Restart frontend: `npm start`

### No predictions generated?
1. ✅ There must be sales orders in system
2. ✅ Orders should have products
3. ✅ Check from last 6 months
4. ✅ Click Refresh button

### Numbers look wrong?
1. ✅ Click product to see reasoning
2. ✅ Check sales history to verify
3. ✅ Verify products are marked `isActive`
4. ✅ Check product type (Climber/Bush)

### Page won't load?
1. ✅ Backend running? Check: `curl http://localhost:5000/api/health`
2. ✅ MongoDB connected? Check terminal
3. ✅ No JS errors? Check F12 console
4. ✅ Try hard refresh: `Ctrl+Shift+R`

---

## 📱 Using Predictions in Daily Work

### Morning Routine
1. Open Dashboard
2. Check "Critical Stocks" - order any urgent items
3. Review "Need Increase" - plan restocking
4. Glance at trends to spot changes

### Weekly Review
1. Click "Refresh" to get latest data
2. Review all 5 top priority products
3. Note any trend changes
4. Plan purchases accordingly

### Monthly Planning
1. Export top 10 predictions
2. Analyze trend patterns
3. Adjust purchasing strategy
4. Update supplier orders

---

## 🎓 Understanding Confidence Scores

**What it means:**
- 90-100%: Very confident (12+ months data, consistent sales)
- 70-89%: Fairly confident (6-12 months data)
- 50-69%: Somewhat confident (2-6 months data)
- Below 50%: Low confidence (less than 2 months data)

**How to use:**
- 🟢 High confidence: Follow recommendation closely
- 🟡 Medium confidence: Use as guide + judgment
- 🔴 Low confidence: Observe more before acting

---

## 📊 Real-World Example

**Scenario:** You're managing inventory for Karimunda peppers

**Current State:**
- Stock: 8 units
- Price: 120 per unit
- Type: Climber pepper

**Prediction Widget Shows:**
- Rank: #2 (high urgency)
- Trend: RISING ↑
- Recent Sales: 12.3 units/month
- Confidence: 85%
- Recommendation: **INCREASE +30%**
- Suggested Stock: 24 units

**What You Do:**
1. Recognize rising demand (12.3 > historical 8.5)
2. Note current stock (8) is below recent average (12.3)
3. Trust the 85% confidence score
4. Decide to increase stock to 20-25 units
5. Place order with supplier
6. Stock arrives, mark in system
7. Widget updates with new calculations

**Result:** Better inventory management, reduced stockouts, improved customer satisfaction

---

## 🚀 Next Steps

1. **Start Using**: Review predictions daily
2. **Learn Patterns**: Notice trends in your data
3. **Optimize**: Adjust seasonal thresholds if needed
4. **Integrate**: Use in your purchasing decisions
5. **Scale**: Apply to other products

---

## 📞 Need Help?

Refer to these detailed documents:
- **Full Guide**: `STOCK_DEMAND_PREDICTION_GUIDE.md`
- **Testing Guide**: `TESTING_STOCK_PREDICTIONS.md`
- **Implementation Checklist**: `STOCK_PREDICTION_IMPLEMENTATION_CHECKLIST.md`

---

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: ✅ Production Ready

Enjoy smarter inventory management! 🎉