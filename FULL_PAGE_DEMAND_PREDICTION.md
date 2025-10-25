# 📊 Stock Demand Prediction - Full Page View

## Overview

The Stock Demand Prediction feature now includes a dedicated **full-page view** (`/admin-demand-predictions`) that displays all product predictions in a detailed, comprehensive layout. This complements the widget view on the dashboard overview.

---

## 🎯 Two Views Available

### 1. **Widget View** (Dashboard Overview)
- **Location:** Admin Dashboard → Overview tab
- **Shows:** Top 5 urgent products + summary stats
- **Use Case:** Quick glance at critical issues during daily check-ins
- **Time to Insight:** < 5 seconds

### 2. **Full-Page View** (New!)
- **Location:** Admin Dashboard → Demand Predictions tab OR `/admin-demand-predictions`
- **Shows:** ALL products with predictions + detailed analysis
- **Use Case:** In-depth analysis, planning, and decision-making
- **Time to Insight:** < 30 seconds

---

## 🚀 How to Access

### Option 1: From Admin Dashboard Sidebar
1. Log in as admin
2. Go to Dashboard
3. In the left sidebar, click **"📊 Demand Predictions"**
4. The full-page view loads with all predictions

### Option 2: Direct URL
Navigate directly to: **`http://localhost:3000/admin-demand-predictions`**

### Option 3: From Navigation Button
From any dashboard page, click the **"Demand Predictions"** link in the admin menu.

---

## 📋 Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Stock Demand Prediction                    [← Back] [🔄 Refresh]│
│ Analyze product demand and optimize stock levels              │
└─────────────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┐
│ 🔴       │ 🟢       │ 🟡       │ 📊       │
│ Critical │ Need     │ Can      │ Total    │
│ Stocks   │ Increase │ Reduce   │ Analyzed │
│   5      │    7     │    3     │   21     │
└──────────┴──────────┴──────────┴──────────┘

┌──────────────────────────────────────────────┐
│ 📈 All Predictions (21)                      │
│                                              │
│ ┌─ Karimunda [📈 INCREASE +30%]             │
│ │ Current: 8 units | Suggested: 24 units    │
│ │ Confidence: 85%                            │
│ │ [Click to expand details ▼]               │
│ └─────────────────────────────────────────  │
│                                              │
│ ┌─ Guntur [➡️ MAINTAIN 0%]                  │
│ │ Current: 15 units | Suggested: 15 units   │
│ │ Confidence: 92%                            │
│ │ [Click to expand details ▼]               │
│ └─────────────────────────────────────────  │
│                                              │
│ [... more products ...]                     │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 📊 Summary Cards

The top 4 cards provide quick statistics:

### 🔴 **Critical Stocks**
- Products with **≤5 units** remaining
- **Action:** Order immediately
- Example: 5 products need urgent restocking

### 🟢 **Need Increase**
- Products with **rising demand trend**
- **Action:** Increase stock to meet demand
- Example: 7 products showing growth

### 🟡 **Can Reduce**
- Products with **declining demand trend**
- **Action:** Reduce orders to save costs
- Example: 3 products showing decline

### 📊 **Total Analyzed**
- **All active products** with sales history
- Products generating predictions
- Example: 21 active products

---

## 🔍 Product Prediction Cards

Each product displays key information:

### **Basic Information**
- **Product Name** (with emoji prefix)
- **Recommendation Badge** (color-coded)
  - 🟢 GREEN = INCREASE
  - 🟡 YELLOW = MAINTAIN
  - 🔴 RED = REDUCE
  - 🔵 BLUE = MONITOR

### **Quick Stats Grid**
```
┌─────────────┬──────────────┬──────────────┬──────────────┐
│ Current     │ Stock        │ Suggested    │ Confidence   │
│ Stock       │ Adjustment   │ Stock        │ Score        │
│             │              │              │              │
│ 8 units     │ +30%         │ 24 units     │ 85%          │
└─────────────┴──────────────┴──────────────┴──────────────┘
```

### **Expandable Details** (Click to reveal)
When you click a product card, it expands to show:

#### Prediction Details
- **Sales Trend** (↑ Rising, ↓ Declining, → Stable)
- **Recent Avg Sales** (Last 3 months average)
- **Overall Avg Sales** (All-time average)
- **Urgency Score** (0-100 ranking)

#### Explanation
- **Reason** (Why this recommendation was made)
  - Example: "Rising trend with insufficient stock - order more to meet demand"

#### Sales History Chart
- **Last 3 Months** breakdown
- Month-by-month units sold
- Visual trend validation

---

## 🎨 Color Coding

### **Recommendation Colors**
| Color | Recommendation | Meaning |
|-------|---|---|
| 🟢 Green | INCREASE | Rising demand, order more stock |
| 🔴 Red | REDUCE | Declining demand, order less |
| 🟡 Yellow | MAINTAIN | Stable demand, keep current |
| 🔵 Blue | MONITOR | New/insufficient data, watch |

### **Confidence Level Colors**
| Confidence Range | Color | Interpretation |
|---|---|---|
| 80-100% | 🟢 Green | High confidence (6+ months data) |
| 60-79% | 🟡 Yellow | Medium confidence (3-5 months) |
| 0-59% | 🔴 Red | Low confidence (<3 months) |

### **Adjustment Percentage Colors**
| Value | Color | Meaning |
|---|---|---|
| +5% to +50% | 🟢 Green | Stock increase needed |
| 0% | 🟡 Yellow | No adjustment |
| -5% to -30% | 🔴 Red | Stock decrease recommended |

---

## ⚙️ Features

### 🔄 Refresh Button
- **Purpose:** Manually reload all predictions
- **Use:** After adding/updating products or stock
- **Time:** Takes ~2 seconds to refresh
- **Status:** Shows "Refreshing..." while loading

### ✏️ Click to Expand
- **Click any product card** to see detailed breakdown
- **Click again** to collapse
- **Details include:**
  - Sales trend analysis
  - Historical data
  - Detailed reasoning
  - Recent sales history (3 months)

### 📱 Responsive Layout
- Works on desktop, tablet, and mobile
- Cards stack on smaller screens
- Touch-friendly interaction

---

## 📈 Understanding the Predictions

### Example 1: Rising Demand ⬆️
```
Product: Karimunda (Climber pepper)
Recent Months: 10 → 12 → 15 units
Current Stock: 8 units
Trend: RISING (15 > 8.5 × 1.2)

Recommendation: INCREASE +30%
Suggested Stock: 24 units
Reasoning: Rising trend with insufficient stock.
           Need more units to meet growing demand.
```

### Example 2: Declining Demand ⬇️
```
Product: Bhut Jolokia
Recent Months: 20 → 18 → 14 units
Current Stock: 30 units
Trend: DECLINING (14 < 20 × 0.8)

Recommendation: REDUCE -20%
Suggested Stock: 24 units
Reasoning: Declining demand. Reduce orders
           to minimize inventory costs.
```

### Example 3: Stable Demand ➡️
```
Product: Kashmiri Bell
Recent Months: 12 → 11 → 12 units
Current Stock: 15 units
Trend: STABLE (11 < 1.2 × 8 < 14.4)

Recommendation: MAINTAIN 0%
Suggested Stock: 15 units
Reasoning: Stable, consistent demand.
           Current stock level is optimal.
```

### Example 4: New Product 👁️
```
Product: New Variety (Just Added)
Sales History: 0 or < 1 month
Current Stock: 5 units

Recommendation: MONITOR
Suggested Stock: Current
Reasoning: Insufficient sales data.
           Monitor and collect more data.
```

---

## 🎯 Workflow - How to Use

### **Daily (5 minutes)**
1. Check **Critical Stocks** count
2. If > 0, expand those products and order stock
3. Click Refresh to get latest predictions

### **Weekly (15 minutes)**
1. Review all **Need Increase** products
2. Plan restocking orders for those items
3. Check **Can Reduce** products
4. Plan to reduce upcoming orders

### **Monthly (30 minutes)**
1. Review all predictions
2. Analyze trends over past month
3. Adjust thresholds if needed
4. Update forecasting strategy

---

## 🔧 Technical Details

### **API Endpoint**
```
GET /api/admin/demand-predictions?limit=50&monthsBack=6
```

### **Response Format**
```json
{
  "predictions": [
    {
      "_id": "product-id",
      "productName": "Karimunda",
      "currentStock": 8,
      "suggestedStock": 24,
      "adjustmentPercentage": 30,
      "recommendation": "INCREASE",
      "salesTrend": "rising",
      "recentAvgSales": 12.3,
      "overallAvgSales": 8.5,
      "confidence": 85,
      "reason": "Rising trend with insufficient stock...",
      "urgencyScore": 85,
      "recentSalesHistory": [
        { "month": "March", "sales": 10 },
        { "month": "April", "sales": 12 },
        { "month": "May", "sales": 15 }
      ]
    },
    // ... more products
  ],
  "stats": {
    "criticalStocks": 5,
    "needIncrease": 7,
    "canReduce": 3,
    "totalAnalyzed": 21
  }
}
```

### **Authentication**
- Requires **Firebase ID token** (Admin user)
- Automatically included via `apiFetch` service
- 401 Unauthorized if not authenticated

### **Performance**
- **Initial Load:** < 2 seconds
- **Refresh:** < 2 seconds
- **Expand Product:** Instant

---

## ⚡ Tips & Tricks

### **Sort Products Manually**
- Click on summary cards to focus on that category
- Example: Click "Critical Stocks" card, then manually review those

### **Export Strategy**
- Use browser's Print function (Ctrl+P) to print predictions
- Save as PDF for records

### **Monitor Confidence Scores**
- Higher confidence (80%+) = Act on recommendations
- Lower confidence (<60%) = Gather more data first

### **Seasonal Adjustments**
- For seasonal products, check **Sales History**
- Verify recommendation aligns with expected seasonality
- May need to override for known seasonal events

---

## 🆘 Troubleshooting

### **Page Won't Load**
1. Ensure you're logged in as **admin**
2. Check browser console (F12) for errors
3. Refresh the page
4. Clear browser cache and reload

### **No Predictions Showing**
1. Ensure you have **at least 1 month of sales data**
2. Click **Refresh** button
3. Check if any products have orders in the last 6 months
4. Products with no sales history won't have predictions

### **Incorrect Confidence Score**
- Confidence depends on data availability
- More months of data = higher confidence
- Minimum 1 month required for predictions

### **Adjustment Percentage Seems Wrong**
1. Click to expand and review **Sales History**
2. Check the **Trend** direction
3. Verify it matches expected behavior
4. Contact support if still incorrect

---

## 📞 Support

For issues with the full-page view:
1. Check the **STOCK_DEMAND_PREDICTION_GUIDE.md** for detailed information
2. Review **TESTING_STOCK_PREDICTIONS.md** for test scenarios
3. Contact admin support with a screenshot

---

## 📚 Related Documentation

- **Main Feature Guide:** `STOCK_DEMAND_PREDICTION_GUIDE.md`
- **Quick Start:** `QUICK_START_STOCK_PREDICTION.md`
- **Testing:** `TESTING_STOCK_PREDICTIONS.md`
- **Widget View:** Dashboard → Overview → Scroll to widget

---

## ✅ Next Steps

1. **Try it out:** Go to Admin Dashboard → Demand Predictions
2. **Expand a product:** Click to see detailed analysis
3. **Plan actions:** Based on recommendations
4. **Refresh:** After making stock changes
5. **Review weekly:** Build habit of checking trends

**Enjoy smarter inventory management! 📊✨**