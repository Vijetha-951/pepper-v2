# ML Systems Implementation Guide

## Overview
The PEPPER application has **3 main ML/AI features**:
1. **Recommendation Engine** (KNN - K-Nearest Neighbors)
2. **Customer Segmentation** (Bayesian Classification)
3. **Stock Demand Prediction** (Decision Tree)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│              FRONTEND (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Product Recs │  │ Admin Panel  │  │   Tracking │ │
│  └──────────────┘  └──────────────┘  └────────────┘ │
└─────────────────┬───────────────────────────────────┘
                  │ HTTP API Calls
┌─────────────────▼───────────────────────────────────┐
│         BACKEND (Node.js/Express)                    │
│  ┌──────────────────────────────────────────────┐  │
│  │ Routes:                                      │  │
│  │ • GET /api/recommendations/products          │  │
│  │ • GET /api/admin/customer-segments           │  │
│  │ • GET /api/admin/demand-predictions          │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Services:                                    │  │
│  │ • recommendationService.js                   │  │
│  │ • customerSegmentationService.js             │  │
│  │ • demandPredictionService.js                 │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ MongoDB:                                     │  │
│  │ • Users, Orders, Products, BrowsingHistory  │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────────┘
                  │ spawn child_process
                  │ JSON stdin/stdout
┌─────────────────▼───────────────────────────────────┐
│         PYTHON SCRIPTS                              │
│  ┌──────────────────────────────────────────────┐  │
│  │ • recommendation_engine.py                   │  │
│  │ • customer_segmentation.py                   │  │
│  │ • demand_prediction.py                       │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## System 1: Recommendation Engine (KNN)

### Overview
Uses **K-Nearest Neighbors** algorithm to recommend products based on similar users' purchases.

### Location
- **Frontend**: `frontend/src/components/ProductRecommendations.jsx`
- **Backend Route**: `backend/src/routes/recommendations.routes.js`
- **Backend Service**: `backend/src/services/recommendationService.js`
- **Python**: `backend/python/recommendation_engine.py`

### Step-by-Step Implementation

#### Step 1: User Tracking
```
When user views a product:
POST /api/recommendations/track
├─ Body: { productId: "123" }
├─ Service: recommendationService.trackBrowsing()
├─ Database: Insert/Update BrowsingHistory
│  └─ { user: userId, product: productId, viewCount: ++, lastViewedAt: now }
└─ Response: { success: true }
```

#### Step 2: Build User Vector
```
User Vector = Interaction scores for all products
┌─────────────────────────────────┐
│ Product 1: 3 (purchased) + 1    │
│           (browsed)      = 4    │
├─────────────────────────────────┤
│ Product 2: 3 (purchased)        │ = 3
├─────────────────────────────────┤
│ Product 3: 1 (browsed 3x)       │ = 3
└─────────────────────────────────┘

Weights:
- Purchases: 3x weight (strong signal)
- Browsing: 1x per view (weak signal)
```

#### Step 3: Find Similar Users (KNN)
```
GET /api/recommendations/products

Step A: Calculate Distance to ALL other users
┌────────────────────────────────────────────┐
│ Target User Vector: {P1:4, P2:3, P3:3}     │
├────────────────────────────────────────────┤
│ User A Vector:     {P1:3, P2:5, P3:2}      │
│ Distance = √((4-3)² + (3-5)² + (3-2)²)    │
│         = √(1 + 4 + 1) = √6 ≈ 2.45        │
├────────────────────────────────────────────┤
│ User B Vector:     {P1:4, P2:3, P4:4}      │
│ Distance = √((4-4)² + (3-3)² + (3-0)²)    │
│         = √(0 + 0 + 9) = 3.0               │
├────────────────────────────────────────────┤
│ User C Vector:     {P2:1, P5:2}            │
│ Distance = √((4-0)² + (3-1)² + (3-0)²)    │
│         = √(16 + 4 + 9) ≈ 5.39             │
└────────────────────────────────────────────┘

Sort by distance (ascending):
1. User A (distance: 2.45) ← NEAREST
2. User B (distance: 3.0)
3. User C (distance: 5.39)

Select K=5 nearest neighbors (or all if < 5 users exist)
```

#### Step 4: Aggregate Neighbor Products
```
For each similar user's products:
- Skip products target user already interacted with
- Weight score by distance: score = neighborScore × (1 / (1 + distance))

Example:
User A products: {P5: 5, P6: 3}
Weight: 1 / (1 + 2.45) ≈ 0.289

Recommendations:
P5: 5 × 0.289 = 1.45
P6: 3 × 0.289 = 0.87

User B products: {P3: 4, P7: 2} (skip P3, already viewed)
Weight: 1 / (1 + 3.0) = 0.25

P7: 2 × 0.25 = 0.50

Final Scores:
P5: 1.45 ← HIGHEST
P6: 0.87
P7: 0.50
```

#### Step 5: Return Products
```
Sort by score (descending), take top N products
├─ Filter: isActive = true, available_stock > 0
├─ Fetch full product details
└─ Return to frontend
```

### Data Flow
```
Frontend Component
    ↓ (mount)
Track browsing: POST /api/recommendations/track
    ↓
Load recommendations: GET /api/recommendations/products
    ↓
recommendationService.getRecommendedProducts(userId)
    ↓
Build user vectors from orders & browsing
    ↓
Find K-nearest neighbors using Euclidean distance
    ↓
Aggregate products from neighbors
    ↓
Fetch product details from MongoDB
    ↓
Return recommendations to frontend
```

### Key Methods
```javascript
// Calculate Euclidean distance
distance = √(Σ(vector1[i] - vector2[i])²)

// Weight by distance (closer = more influence)
weight = 1 / (1 + distance)

// Fallback: Popular products if no neighbors found
```

---

## System 2: Customer Segmentation (Bayesian Classifier)

### Overview
Classifies customers into **4 segments**: New, Regular, Loyal, Inactive using **Bayesian inference**.

### Location
- **Frontend**: `frontend/src/pages/AdminDashboard.jsx`
- **Backend Route**: `backend/src/routes/admin.routes.js` (line 603-640)
- **Backend Service**: `backend/src/services/customerSegmentationService.js`
- **Python**: `backend/python/customer_segmentation.py`

### Step-by-Step Implementation

#### Step 1: Call API
```
GET /api/admin/customer-segments

Backend fetches:
├─ All users (role = 'user')
├─ Their orders with amounts and dates
└─ Spawn Python process to segment them
```

#### Step 2: Calculate Metrics
For each customer:
```
Metrics Calculated:
├─ order_count: Total number of orders
├─ total_spend: Sum of all order amounts
├─ order_frequency_per_month: (order_count × 30) / account_age_days
├─ avg_order_value: total_spend / order_count
├─ days_since_last_order: Days since most recent order
└─ account_age_days: Days since account creation
```

#### Step 3: Calculate Likelihoods (Per Segment)
For each segment (New, Regular, Loyal, Inactive):

**INACTIVE Likelihood:**
```
if order_freq < 0.2 AND total_spend < 500:
    likelihood = 0.95 (Very likely inactive)
elif days_since_order > 90:
    likelihood = 0.80 (Hasn't ordered in 3 months)
elif order_freq < 0.5 AND days_since_order > 60:
    likelihood = 0.70 (Low activity + no recent orders)
else:
    likelihood = 0.05 (Probably not inactive)
```

**LOYAL Likelihood:**
```
score = 0.0
if order_freq >= 3:      score += 0.35 (Frequent buyer)
elif order_freq >= 2:    score += 0.20

if total_spend > 5000:   score += 0.40 (High spender)
elif total_spend > 2000: score += 0.25

if avg_order_value > 1000: score += 0.25 (Premium buyer)
elif avg_order_value > 500: score += 0.10

likelihood = min(score, 0.95)
```

**REGULAR Likelihood:**
```
score = 0.0
if 1 <= order_freq < 3:    score += 0.40 (Medium frequency)
elif order_freq >= 3:      score += 0.20

if 500 <= total_spend < 2000:    score += 0.35
elif total_spend >= 2000:        score += 0.20

if days_since_order < 60:        score += 0.25 (Recent buyer)
elif days_since_order < 90:      score += 0.10

likelihood = min(score, 0.90)
```

**NEW Likelihood:**
```
if account_age < 30 days AND order_freq > 0:
    likelihood = 0.85 (New but already bought)
elif account_age < 30 days AND order_freq = 0:
    likelihood = 0.70 (New, no purchases yet)
elif account_age < 60 days AND order_freq < 0.5:
    likelihood = 0.50 (Still new, low activity)
elif total_spend < 1000 AND order_freq < 1:
    likelihood = 0.35 (Small spend, infrequent)
else:
    likelihood = 0.05 (Probably not new)
```

#### Step 4: Apply Bayesian Formula
```
Posterior = Prior × Likelihood
Normalized Posterior = Posterior / Σ(All Posteriors)

Example:
Priors (default beliefs):
- New:      0.25
- Regular:  0.40
- Loyal:    0.25
- Inactive: 0.10

For Customer A with metrics:
Likelihoods:
- New:      0.05
- Regular:  0.70
- Loyal:    0.50
- Inactive: 0.05

Posteriors (before normalization):
- New:      0.25 × 0.05  = 0.0125
- Regular:  0.40 × 0.70  = 0.280  ← HIGHEST
- Loyal:    0.25 × 0.50  = 0.125
- Inactive: 0.10 × 0.05  = 0.005

Sum = 0.4225

Normalized (after dividing by sum):
- New:      0.0125 / 0.4225 = 0.0296 (2.96%)
- Regular:  0.280 / 0.4225  = 0.6625 (66.25%) ← PREDICTED SEGMENT
- Loyal:    0.125 / 0.4225  = 0.2959 (29.59%)
- Inactive: 0.005 / 0.4225  = 0.0118 (1.18%)

Confidence: 0.6625 = 66.25%
```

#### Step 5: Generate Summary
```
Summary Statistics:
├─ New:
│  ├─ count: 15
│  ├─ avg_confidence: 0.78
│  └─ percentage: 7.5%
├─ Regular:
│  ├─ count: 120
│  ├─ avg_confidence: 0.72
│  └─ percentage: 60%
├─ Loyal:
│  ├─ count: 55
│  ├─ avg_confidence: 0.81
│  └─ percentage: 27.5%
└─ Inactive:
   ├─ count: 10
   ├─ avg_confidence: 0.65
   └─ percentage: 5%
```

### Data Flow
```
Admin Panel
    ↓
GET /api/admin/customer-segments
    ↓
Backend: Fetch all users + their orders
    ↓
CustomerSegmentationService.segmentCustomers()
    ↓
Spawn: python customer_segmentation.py
    ↓ (stdin)
Send JSON: [{ user data with orders }]
    ↓
Python: Calculate metrics for each user
    ↓
Python: Calculate likelihoods for each segment
    ↓
Python: Apply Bayesian formula
    ↓
Python: Normalize posteriors
    ↓ (stdout)
Return JSON: { customers: [...], summary: {...} }
    ↓
Backend: Parse output
    ↓
Frontend: Display segmentation results
```

### Key Formulas
```
Order Frequency = (order_count × 30) / account_age_days

Posterior = Prior × Likelihood

Normalized Posterior = Posterior / Σ(All Posteriors)

Confidence = max(Normalized Posteriors)
```

### Segment Characteristics
```
┌──────────┬──────────────┬───────────┬─────────────┬─────────────┐
│ Segment  │ Frequency    │ Spending  │ Recency     │ Action      │
├──────────┼──────────────┼───────────┼─────────────┼─────────────┤
│ New      │ Low/None     │ Low       │ Very Recent │ Onboard     │
│ Regular  │ Medium       │ Medium    │ Recent      │ Engage      │
│ Loyal    │ High         │ High      │ Recent      │ Retain      │
│ Inactive │ Low/None     │ Low       │ Very Old    │ Re-activate │
└──────────┴──────────────┴───────────┴─────────────┴─────────────┘
```

---

## System 3: Stock Demand Prediction (Decision Tree)

### Overview
Uses **Decision Tree logic** to predict product demand and recommend stock adjustments based on sales trends.

### Location
- **Frontend**: `frontend/src/pages/AdminDashboard.jsx`
- **Backend Route**: `backend/src/routes/admin.routes.js` (line 516-599)
- **Backend Service**: `backend/src/services/demandPredictionService.js`
- **Python**: `backend/python/demand_prediction.py`

### Step-by-Step Implementation

#### Step 1: Call API
```
GET /api/admin/demand-predictions?monthsBack=6&limit=10

Backend:
├─ Fetch orders from past N months
├─ Populate product details
├─ Get all active products
└─ Generate predictions for each
```

#### Step 2: Aggregate Sales Data
```
Group orders by product and month:

Product A (Chili Pepper):
├─ 2024-01: 10 units
├─ 2024-02: 15 units
├─ 2024-03: 18 units
├─ 2024-04: 12 units
├─ 2024-05: 20 units
└─ 2024-06: 25 units (most recent)

Total: 100 units
Order Count: 6 months

Metrics:
├─ Average Monthly Sales: 100 / 6 = 16.67
├─ Recent 3 Months: (18 + 12 + 20 + 25) = 75 units
├─ Recent Average: 75 / 4 = 18.75
└─ Trend: RISING (25 > 18.75)
```

#### Step 3: Calculate Trend
```
Compare last 3 months with previous average:

Months: [10, 15, 18, 12, 20, 25]
Recent 3: [18, 12, 20, 25]
Previous Average: (18 + 12 + 20) / 3 = 16.67
Newest: 25

If newest > average × 1.2:
    25 > 16.67 × 1.2 = 20
    25 > 20 = TRUE → RISING ✓

If newest < average × 0.8:
    25 < 16.67 × 0.8 = 13.33
    25 < 13.33 = FALSE

Otherwise: STABLE

Trend = RISING
```

#### Step 4: Decision Tree Logic
```
DECISION TREE STRUCTURE:

Root: Does product have sales history?
├─ NO → MONITOR (Watch new product)
├─ YES
│   ├─ Recent Average = 0?
│   │  └─ YES → REDUCE (No recent demand)
│   │  └─ NO
│   │      ├─ Trend = RISING?
│   │      │  └─ Current Stock < Recent Average?
│   │      │     ├─ YES → INCREASE (by 20-30%)
│   │      │     └─ NO → MONITOR
│   │      │
│   │      ├─ Trend = DECLINING?
│   │      │  └─ Stock Turnover < 0.3?
│   │      │     ├─ YES → REDUCE (by 20%)
│   │      │     └─ NO → MAINTAIN
│   │      │
│   │      └─ Trend = STABLE?
│   │         ├─ Is Seasonal Month?
│   │         │  └─ YES → INCREASE (by 15%)
│   │         │  └─ NO
│   │         │     ├─ Stock ≤ 5?
│   │         │     │  └─ YES → INCREASE (by 10%)
│   │         │     │  └─ NO → MAINTAIN
```

#### Step 5: Example Execution
```
Product A (Chili Pepper) with:
├─ Current Stock: 15 units
├─ Average Monthly Sales: 16.67
├─ Recent Average: 18.75
├─ Trend: RISING
├─ Type: Bush
├─ Current Month: June (6)
└─ Stock Turnover: 18.75 / 15 = 1.25

DECISION TREE PATH:
1. Has sales history? YES ✓
2. Recent average = 0? NO ✓
3. Trend = RISING? YES ✓
4. Stock (15) < Recent Avg (18.75)? YES ✓
   → Urgency HIGH (18.75 > 16.67 × 1.5)? NO
   → Urgency MEDIUM
   → INCREASE by 20%

RESULT:
├─ Recommendation: INCREASE
├─ Adjustment: +20%
├─ Current Stock: 15
├─ Suggested Stock: 15 × 1.20 = 18
└─ Reason: "Rising trend with insufficient stock. Current: 15, Recent avg: 18.75"
```

#### Step 6: Calculate Urgency Score
```
Base Score = Recommendation Weight:
├─ INCREASE: 80
├─ REDUCE: 40
├─ MAINTAIN: 20
└─ MONITOR: 30

Bonus for Critical Stock:
├─ Stock ≤ 5: +20
├─ Stock ≤ 10: +10

Bonus for High Demand:
├─ Recent Avg > 20: +10
├─ Recent Avg > 10: +5

Example:
Base: 80 (INCREASE)
Stock: 15 (none)
Demand: 18.75 (add +5)
Total: 85 / 100

Products sorted by urgency score (highest first)
```

#### Step 7: Generate Summary
```
Dashboard Summary:
├─ Total Products: 150
├─ Critical Stocks (≤5): 8
├─ Need INCREASE: 32
├─ Need REDUCE: 15
├─ Trends:
│  ├─ RISING: 45
│  ├─ DECLINING: 30
│  └─ STABLE: 75
├─ Stock Health:
│  ├─ HEALTHY (>30): 90
│  ├─ ADEQUATE (10-30): 45
│  ├─ LOW (1-10): 12
│  └─ OUT_OF_STOCK: 3
└─ Top 5 Urgent Actions: [...]
```

### Seasonal Patterns
```
Climber Pepper: Months [3,4,5,9,10,11] (Spring & Fall)
Bush Pepper: Months [4,5,6,7,8] (Summer)

Current month is seasonal?
├─ YES → INCREASE stock (seasonal spike expected)
└─ NO → Follow trend-based logic
```

### Stock Health Status
```
Health = get_stock_health(current_stock)

if stock > 30:   HEALTHY (plenty)
if stock ≤ 30:   ADEQUATE (good)
if stock ≤ 10:   LOW (warning)
if stock = 0:    OUT_OF_STOCK (critical)
```

### Confidence Calculation
```
Base Confidence: 0.5 (50%)

Bonus for data points:
├─ 12+ months: +0.4 (90%)
├─ 6-11 months: +0.3 (80%)
├─ 3-5 months: +0.2 (70%)
└─ 1-2 months: +0.1 (60%)

Bonus for high sales volume:
├─ Average > 20 units: +10%
└─ Max confidence: 95%

Example: 4 months of data, avg 15 units
├─ Base: 0.5
├─ Data bonus: +0.2
├─ Volume bonus: +0.05
└─ Confidence: 75%
```

### Data Flow
```
Admin Dashboard
    ↓
GET /api/admin/demand-predictions?monthsBack=6
    ↓
Backend: Fetch orders (past 6 months) + all active products
    ↓
demandPredictionService.generatePredictions()
    ↓
Aggregate sales by product and month
    ↓
For each product:
│   ├─ Calculate metrics (avg, recent avg, trend)
│   ├─ Walk through decision tree
│   ├─ Determine recommendation
│   ├─ Calculate urgency score
│   └─ Generate prediction object
    ↓
Sort by urgency score (descending)
    ↓
Return top N predictions
    ↓
Frontend: Display predictions with:
   ├─ Current stock vs suggested stock
   ├─ Sales trend graph
   ├─ Recommendation reason
   ├─ Confidence level
   └─ Urgency indicators
```

---

## Integration Points

### 1. Frontend → Backend Communication
```javascript
// Recommendations
GET /api/recommendations/products?k=5&limit=5
POST /api/recommendations/track
GET /api/recommendations/insights

// Customer Segmentation
GET /api/admin/customer-segments?page=1&limit=50

// Demand Prediction
GET /api/admin/demand-predictions?monthsBack=6&limit=10
GET /api/admin/demand-predictions/summary/dashboard
GET /api/admin/demand-predictions/:productId
```

### 2. Backend → Python Communication
```javascript
// Using child_process.spawn()
const pythonProcess = spawn('python', [path_to_script]);

// Send data via stdin
pythonProcess.stdin.write(JSON.stringify(inputData));

// Receive output via stdout
pythonProcess.stdout.on('data', (data) => {
    result = JSON.parse(data);
});
```

### 3. Database Models
```javascript
// User Model
└─ _id, email, firstName, lastName, createdAt, orders

// Order Model
└─ _id, user, items[], totalAmount, status, createdAt

// Product Model
└─ _id, name, type, category, price, available_stock, isActive

// BrowsingHistory Model
└─ _id, user, product, viewCount, lastViewedAt
```

---

## Performance Considerations

### Recommendations (KNN)
- **Complexity**: O(n²) where n = number of users
- **Optimization**: Cache user vectors, limit to top K=5
- **Scalability Issue**: Becomes slow with 10k+ users
- **Solution**: Use approximate KNN (LSH, Product Quantization)

### Customer Segmentation (Bayesian)
- **Complexity**: O(n) where n = number of customers
- **Optimization**: Batch process customers
- **Scalability**: Can handle 100k+ customers
- **Current Approach**: Process all customers at once (admin API)

### Demand Prediction (Decision Tree)
- **Complexity**: O(n×m) where n = products, m = months of history
- **Optimization**: Aggregate sales data efficiently
- **Scalability**: Can handle 1000+ products easily
- **Current Approach**: Processes all products, sorts by urgency

---

## Example Outputs

### Recommendation Response
```json
{
  "success": true,
  "count": 5,
  "recommendations": [
    {
      "_id": "product123",
      "name": "Thai Red Chili",
      "price": 299,
      "image": "..."
    }
  ]
}
```

### Customer Segmentation Response
```json
{
  "success": true,
  "customers": [
    {
      "_id": "user123",
      "email": "john@example.com",
      "segment": "Loyal",
      "confidence": 0.82,
      "posteriors": {
        "New": 0.05,
        "Regular": 0.1,
        "Loyal": 0.82,
        "Inactive": 0.03
      },
      "metrics": {
        "order_count": 12,
        "total_spend": 5000,
        "order_frequency_per_month": 2.5
      }
    }
  ],
  "summary": {
    "New": { "count": 5, "percentage": 5 },
    "Regular": { "count": 50, "percentage": 50 },
    "Loyal": { "count": 35, "percentage": 35 },
    "Inactive": { "count": 10, "percentage": 10 }
  }
}
```

### Demand Prediction Response
```json
{
  "success": true,
  "predictions": [
    {
      "product": {
        "_id": "prod123",
        "name": "Chili Pepper",
        "type": "Bush"
      },
      "currentStock": 15,
      "totalStock": 50,
      "stockHealth": "ADEQUATE",
      "salesMetrics": {
        "averageMonthlySales": 16.67,
        "recentAverageMonthlySales": 18.75,
        "trend": "RISING",
        "salesHistory": [
          { "month": "2024-04", "sales": 12 },
          { "month": "2024-05", "sales": 20 },
          { "month": "2024-06", "sales": 25 }
        ]
      },
      "prediction": {
        "recommendation": "INCREASE",
        "adjustmentPercentage": 20,
        "suggestedStock": 18,
        "reason": "Rising trend with insufficient stock",
        "confidence": 85
      },
      "urgencyScore": 85
    }
  ]
}
```

---

## Troubleshooting

### KNN Recommendation Issues
- **Problem**: Returns empty recommendations
- **Cause**: No neighbors found (insufficient users)
- **Solution**: Falls back to popular products
- **Check**: `findKNearestNeighbors()` returns empty array

### Bayesian Segmentation Issues
- **Problem**: Python process fails
- **Cause**: Invalid input JSON or calculation error
- **Solution**: Check customer data structure
- **Check**: `customerSegmentationService.js` error handling

### Decision Tree Prediction Issues
- **Problem**: All products return "MAINTAIN"
- **Cause**: Insufficient sales history
- **Solution**: Need at least 1 month of data
- **Check**: `predict_demand()` decision path

---

## Future Improvements

1. **Recommendations**: Implement matrix factorization or deep learning
2. **Segmentation**: Add RFM analysis alongside Bayesian
3. **Demand Prediction**: Use ARIMA, Prophet, or LSTM for time series
4. **Caching**: Redis cache for frequent predictions
5. **Real-time**: WebSocket updates instead of polling
6. **A/B Testing**: Test different K values, segment names, recommendations