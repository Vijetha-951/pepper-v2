# Stock Demand Prediction Feature

## 📊 Overview

The Stock Demand Prediction feature uses a **Decision Tree algorithm** to analyze historical sales data and predict upcoming product demand. This helps the admin make informed stock management decisions.

**Example Decision Logic:**
- If month = June and past sales trend = rising → Increase stock by 20%
- If sales declining and stock turnover < 30% → Reduce stock by 20%
- If critical stock (≤5 units) → Recommend increase
- If seasonal month detected → Increase stock by 15%

## 🎯 Key Features

### 1. **Automated Demand Prediction**
- Analyzes last 6 months of sales history (configurable)
- Calculates sales trends (Rising/Declining/Stable)
- Identifies seasonal patterns by product type
- Generates urgency scores for prioritization

### 2. **Decision Tree Logic**
The prediction engine uses the following decision nodes:

```
IF no sales history
  → MONITOR (new product, collect data)
ELSE IF no recent sales
  → REDUCE (no demand, consider reducing stock)
ELSE IF trend is RISING
  → IF current stock < recent average
    → INCREASE (20-30% depending on urgency)
  → ELSE
    → MONITOR
ELSE IF trend is DECLINING
  → IF stock turnover < 30%
    → REDUCE (20% reduction)
  → ELSE
    → MAINTAIN
ELSE (STABLE trend)
  → IF seasonal pattern detected
    → INCREASE (15% increase)
  → ELSE IF stock <= 5
    → INCREASE (10% increase)
  → ELSE
    → MAINTAIN
```

### 3. **Admin Dashboard Widget**
- **Real-time Summary Stats**: Critical stocks, demand trends, general health
- **Sales Trend Distribution**: Rising/Declining/Stable product breakdown
- **Top Priority Products**: Ranked by urgency with detailed recommendations
- **Expandable Details**: View sales history and detailed reasoning for each product

### 4. **Prediction Confidence**
- Confidence score (0-100%) based on:
  - Data point availability (more months = higher confidence)
  - Sales volume (higher volume = more confident prediction)

## 🔧 Architecture

### Backend Components

#### 1. **DemandPredictionService** (`backend/src/services/demandPredictionService.js`)
Core service with the decision tree algorithm:

```javascript
// Main methods:
generatePredictions(monthsBack)     // Generate predictions for all products
getTopPredictions(limit, monthsBack) // Get top N predictions sorted by urgency
getPredictionForProduct(productId, monthsBack) // Get specific product prediction
```

#### 2. **Admin Routes** (`backend/src/routes/admin.routes.js`)
Three new API endpoints:

```
GET /api/admin/demand-predictions/summary/dashboard
  - Returns aggregated summary with stats
  - Response: { summary: {...}, generatedAt: timestamp }

GET /api/admin/demand-predictions?limit=10&monthsBack=6
  - Returns top N predictions sorted by urgency
  - Response: { predictions: [...], total: N, analysisMetadata: {...} }

GET /api/admin/demand-predictions/:productId?monthsBack=6
  - Returns prediction for specific product
  - Response: { prediction: {...}, generatedAt: timestamp }
```

### Frontend Components

#### 1. **DemandPredictionWidget** (`frontend/src/components/DemandPredictionWidget.jsx`)
React component that:
- Fetches predictions from backend
- Displays summary statistics
- Shows trend distribution
- Lists top priority products with expandable details
- Includes refresh functionality

#### 2. **Dashboard Integration** (`frontend/src/pages/Dashboard.jsx`)
Widget is automatically displayed in the admin overview page:
```jsx
{user?.role === 'admin' && (
  <div style={{ marginTop: '2rem' }}>
    <DemandPredictionWidget />
  </div>
)}
```

## 📈 Sales Data Requirements

The prediction engine uses:
- **Order History**: Historical order data from Order collection
- **Product Metadata**: Product type (Climber/Bush) for seasonal patterns
- **Time Window**: Last 6 months of data (configurable)

### Seasonal Patterns

The algorithm detects seasonal demand patterns by product type:

- **Climber Peppers**: Higher demand in Spring (Mar-May) and Fall (Sep-Nov)
- **Bush Peppers**: Higher demand in Summer (Apr-Aug)

These patterns are baked into the algorithm and can be customized.

## 🎨 UI/UX Features

### Summary Cards
- **Critical Stocks**: Red alert for products with ≤5 units
- **Need Increase**: Green highlight for rising demand products
- **Can Reduce**: Yellow highlight for declining demand products
- **Total Analyzed**: Blue summary of active products

### Trend Distribution
Quick view of:
- ↑ Rising trends (green)
- → Stable trends (amber)
- ↓ Declining trends (red)

### Product Cards
Each product shows:
- Rank badge (1-5)
- Product name and type
- Current stock level
- Recommendation status (colored badge)
- Recent average sales
- Current trend with icon
- Prediction confidence %
- Stock adjustment (current → suggested with %)
- Adjustment reason

**Click to expand**: Shows sales history for last 3 months

## 🚀 Usage

### For Admins

1. **Access Dashboard**: Log in as admin and go to Dashboard → Overview
2. **View Widget**: "📊 Stock Demand Prediction" widget appears at the bottom
3. **Review Predictions**: 
   - Check summary statistics
   - Review trend distribution
   - Read top priority products
4. **Make Decisions**:
   - Click on a product to see detailed sales history
   - Use the recommendation to decide on stock adjustments
   - Take action in Stock Management section

### API Usage (Examples)

```bash
# Get dashboard summary
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/admin/demand-predictions/summary/dashboard

# Get top 10 predictions
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/admin/demand-predictions?limit=10&monthsBack=6"

# Get specific product prediction
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:5000/api/admin/demand-predictions/PRODUCT_ID"
```

## 📊 Prediction Response Format

```json
{
  "product": {
    "_id": "product_id",
    "name": "Product Name",
    "type": "Climber|Bush",
    "category": "Bush Pepper",
    "price": 120,
    "image": "url"
  },
  "currentStock": 15,
  "totalStock": 50,
  "stockHealth": "HEALTHY|ADEQUATE|LOW|OUT_OF_STOCK",
  "salesMetrics": {
    "averageMonthlySales": 8.5,
    "recentAverageMonthlySales": 12.3,
    "trend": "RISING|DECLINING|STABLE",
    "salesHistory": [
      { "month": "2024-01", "sales": 10 },
      { "month": "2024-02", "sales": 12 },
      { "month": "2024-03", "sales": 15 }
    ]
  },
  "prediction": {
    "recommendation": "INCREASE|DECREASE|MAINTAIN|MONITOR",
    "adjustmentPercentage": 20,
    "suggestedStock": 18,
    "reason": "Rising trend with insufficient stock...",
    "confidence": 85
  },
  "urgencyScore": 85
}
```

## 🔍 Decision Tree Example

**Product: Karimunda (Climber)**
- Current Stock: 8 units
- Last 3 months sales: 10, 12, 15 units (avg: 12.3)
- Overall average: 8.5 units
- Trend: RISING (12.3 > 8.5 * 1.2)
- Seasonal: No (current month not in seasonal window)

**Decision Process:**
1. Has sales history? ✓ Yes
2. Has recent sales? ✓ Yes
3. Trend is RISING? ✓ Yes
4. Current stock (8) < Recent avg (12.3)? ✓ Yes
5. Urgency high? Recent sales (12.3) > avg (8.5) * 1.5? ✓ Yes

**Result**: 
- **Recommendation**: INCREASE
- **Adjustment**: +30%
- **Suggested Stock**: 10 units
- **Reason**: Rising trend with insufficient stock. Current: 8, Recent avg: 12
- **Confidence**: 85%

## 🎓 Learning & Customization

### To Modify Seasonal Patterns

Edit `demandPredictionService.js`, `checkSeasonalPattern()` method:

```javascript
static checkSeasonalPattern(month, productType) {
  const seasonalMonths = {
    'Climber': [3, 4, 5, 9, 10, 11], // Modify these months
    'Bush': [4, 5, 6, 7, 8]           // Modify these months
  };
  return (seasonalMonths[productType] || []).includes(month);
}
```

### To Adjust Thresholds

Modify these values in `predictDemand()` method:
- **Rising trend threshold**: `1.2` (20% increase)
- **Declining trend threshold**: `0.8` (20% decrease)
- **Stock turnover threshold**: `0.3` (30%)
- **Critical stock level**: `5` units
- **Increase percentages**: `30`, `20`, `15`, `10`

### To Change Data Window

Modify default parameter in `generatePredictions()`:
```javascript
static async generatePredictions(monthsBack = 6) // Change from 6
```

## 🧪 Testing

### With Sample Data

If you have limited historical data:
1. Seed test orders using the seed script
2. The prediction engine will work with any amount of historical data
3. Confidence scores will reflect data availability

### Manual Testing

1. **Check Backend Endpoint**:
   ```bash
   curl http://localhost:5000/api/admin/demand-predictions/summary/dashboard
   ```

2. **View Widget**: Log in as admin and navigate to Dashboard
3. **Click Refresh**: Test the refresh button
4. **Expand Products**: Click on products to see sales history

## 📝 Notes

- Predictions are calculated on-demand (not cached)
- The decision tree is deterministic (same data = same prediction)
- Confidence scores help assess prediction reliability
- The widget automatically handles missing sales data gracefully
- All API endpoints require admin authentication

## 🐛 Troubleshooting

**Widget not showing:**
- Verify user role is 'admin'
- Check browser console for errors
- Ensure backend API is running on port 5000

**No predictions generating:**
- Confirm there are orders in the database
- Check that orders have products with required fields
- Verify products are marked as `isActive: true`

**Predictions seem incorrect:**
- Review the decision tree logic above
- Check sales data in the database
- Consider current seasonality
- Verify product type is correctly set (Climber/Bush)

## 🚀 Future Enhancements

Potential improvements:
- Machine learning models (Neural Networks, Random Forest)
- Inventory forecasting for multi-month planning
- Supplier lead time integration
- Demand forecasting by customer segment
- A/B testing of different restock amounts
- Webhook alerts for critical stock situations
- Export predictions to CSV/Excel
- Historical accuracy tracking of recommendations

---

**Created**: 2024
**Feature**: Stock Demand Prediction using Decision Trees
**Status**: Active & Production-Ready