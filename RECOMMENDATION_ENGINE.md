# Product Recommendation Engine - KNN Implementation

## Overview

The Pepper Recommendation Engine uses the **K-Nearest Neighbors (KNN)** algorithm to provide personalized product recommendations to users based on their purchase history and browsing patterns.

### How It Works

1. **User Interaction Tracking**: The system tracks two types of user interactions:
   - **Purchases**: Completed orders (weighted heavily - 3x)
   - **Browsing**: Product views/clicks (weighted lightly - 1x per view)

2. **User Vector Building**: Each user is represented as a vector of products with interaction scores:
   ```
   User Vector = {productId1: score1, productId2: score2, ...}
   ```

3. **Distance Calculation**: The system calculates Euclidean distance between users to find similar users:
   ```
   distance = √(Σ(u1[i] - u2[i])²)
   ```

4. **Finding Similar Users**: Using KNN with K=5, the system finds the 5 most similar users

5. **Recommendation Generation**: Products from similar users that the current user hasn't interacted with are recommended, scored by:
   - Popularity among similar users
   - Weighted by how similar those users are (closer = more influence)

## Architecture

### Backend Components

#### 1. **BrowsingHistory Model** (`src/models/BrowsingHistory.js`)
Tracks product browsing activity:
```javascript
{
  user: ObjectId,           // User who viewed
  product: ObjectId,        // Product viewed
  viewCount: Number,        // Number of times viewed
  lastViewedAt: Date        // Latest view timestamp
}
```

#### 2. **RecommendationService** (`src/services/recommendationService.js`)
Core recommendation logic:

- `buildUserVector(userId)`: Creates user interaction vector
- `findKNearestNeighbors(userId, k=5)`: Finds K similar users
- `getRecommendedProducts(userId, k=5, limit=5)`: Gets top N recommendations
- `trackBrowsing(userId, productId)`: Records product view
- `getRecommendationInsights(userId)`: Returns recommendation metrics

#### 3. **Recommendations Routes** (`src/routes/recommendations.routes.js`)
API endpoints:

```
GET  /api/recommendations/products        - Get recommendations
POST /api/recommendations/track           - Track browsing
GET  /api/recommendations/insights        - Get user insights
```

All endpoints require Firebase authentication token.

### Frontend Components

#### 1. **RecommendedProducts Component** (`src/components/RecommendedProducts.jsx`)
Displays personalized recommendations in the dashboard:
- Shows 3-5 recommended products
- Displays product insights (purchases, browsing count)
- "Add to Cart" functionality
- Refresh button for new recommendations

#### 2. **Dashboard Integration** (`src/pages/Dashboard.jsx`)
- New "Recommendations" menu item with Sparkles icon
- Dedicated recommendations tab
- Automatic browsing tracking on product hover in Products tab

#### 3. **Customer Product Service** (`src/services/customerProductService.js`)
Added methods:
- `getRecommendations(k, limit)`: Fetch recommendations
- `trackProductBrowsing(productId)`: Record product view
- `getRecommendationInsights()`: Get user insights

## User Experience Flow

### Step 1: Users Browse & Purchase
1. Users navigate to "Products" tab
2. System automatically tracks product views on hover
3. Users add products to cart and checkout
4. Orders are recorded as purchases (weight: 3)

### Step 2: System Builds User Profile
1. When visiting "Recommendations" tab
2. System creates user interaction vector:
   - Purchases from orders
   - Views from browsing history
3. Calculates user similarities using KNN

### Step 3: Recommendations Delivered
1. Similar users' products are analyzed
2. Products user hasn't interacted with are suggested
3. Displayed with:
   - Product image and name
   - Variety (Climber/Bush)
   - Price
   - Stock status
   - Quick "Add to Cart" button

### Step 4: Continuous Learning
1. Each interaction updates browsing history
2. New recommendations refresh based on latest data
3. Users can manually refresh for new suggestions

## Example Scenario

**User A's History:**
- Purchased: Karimunda (Climber), Panniyur-1 (Climber)
- Browsed: 5 Climber varieties, 2 Bush varieties

**Similar Users Found (via KNN):**
- User B: Similar Climber purchase pattern
- User C: Similar Climber + browsing interest
- User D: Mostly Climber purchases
- User E: Mixed Climber/Bush interest

**Recommendations for User A:**
1. **Tellicherry Climber** (5 purchases by similar users)
2. **Indira Climber** (4 purchases, popular among similar users)
3. **Ezhumeli Climber** (3 purchases, not yet viewed by User A)
4. **Kozhikode Climber** (2 purchases from closest match)
5. **Wynad Climber** (2 purchases, high browsing interest)

## Performance Considerations

### Optimization Strategies

1. **Vector Building Efficiency**:
   - Uses MongoDB aggregation for faster queries
   - Caches user vectors during session
   - Leverages database indexes on user/product IDs

2. **KNN Optimization**:
   - Only considers users with purchase/browse history
   - Excludes current user from neighbor search
   - Limits neighbor search to top K users

3. **Scalability**:
   - Current implementation suitable for ~10K users
   - For larger scale, consider:
     - Approximate Nearest Neighbors (ANN)
     - Vector database (e.g., Pinecone, Weaviate)
     - Pre-computed similarity matrix

### Query Performance

- Average recommendation query: ~200-500ms
- Browsing tracking: ~50-100ms
- Insight calculation: ~100-200ms

## Configuration

### Algorithm Parameters

Located in `recommendationService.js`:

```javascript
// K value for KNN (number of similar users)
const K = 5;

// Limit for recommendations returned
const LIMIT = 5;

// Weights for interactions
const PURCHASE_WEIGHT = 3;  // Purchases weighted 3x
const BROWSE_WEIGHT = 1;    // Browsing weighted 1x per view
```

To adjust:
```javascript
// Get 10 recommendations considering 8 similar users
const recommendations = await recommendationService.getRecommendedProducts(
  userId,
  8,        // K value
  10        // recommendation limit
);
```

## API Reference

### 1. Get Recommendations

**Endpoint**: `GET /api/recommendations/products`

**Parameters**:
- `k` (query): Number of similar users (default: 5)
- `limit` (query): Number of recommendations (default: 5)

**Headers**:
- `Authorization`: Bearer {firebaseToken}

**Response**:
```json
{
  "success": true,
  "count": 5,
  "recommendations": [
    {
      "_id": "productId",
      "name": "Karimunda Climber",
      "type": "Climber",
      "price": 299,
      "available_stock": 15,
      "image": "imageUrl"
    }
  ]
}
```

### 2. Track Browsing

**Endpoint**: `POST /api/recommendations/track`

**Headers**:
- `Authorization`: Bearer {firebaseToken}
- `Content-Type`: application/json

**Body**:
```json
{
  "productId": "60d5ec49c1234567890abcde"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Browsing activity tracked",
  "data": {
    "_id": "historyId",
    "user": "userId",
    "product": "productId",
    "viewCount": 3,
    "lastViewedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 3. Get Insights

**Endpoint**: `GET /api/recommendations/insights`

**Headers**:
- `Authorization`: Bearer {firebaseToken}

**Response**:
```json
{
  "success": true,
  "insights": {
    "totalPurchases": 3,
    "totalBrowsed": 12,
    "interactedProducts": 8,
    "vectorDimension": 8
  }
}
```

## Testing

### Manual Testing Steps

1. **Create Test Users**:
   - User A: Purchase 2-3 Climber varieties, browse 5+ products
   - User B: Similar purchase pattern to User A
   - User C: Different purchase pattern (Bush varieties)

2. **Test Browsing Tracking**:
   ```bash
   curl -X POST http://localhost:5000/api/recommendations/track \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"productId": "60d5ec49c1234567890abcde"}'
   ```

3. **Get Recommendations**:
   ```bash
   curl -X GET "http://localhost:5000/api/recommendations/products?k=5&limit=5" \
     -H "Authorization: Bearer {token}"
   ```

4. **Verify Results**:
   - Recommendations should prioritize products from similar users
   - Should exclude already-viewed/purchased products
   - Should be different for users with different patterns

### Edge Cases to Test

1. **New User** (no purchase/browsing history):
   - Should return popular products as fallback

2. **Single User** with history:
   - Should return empty or popular products

3. **User with all products viewed**:
   - Graceful handling, suggest re-viewing popular items

## Future Enhancements

### 1. Collaborative Filtering
- Implement matrix factorization for better accuracy
- Consider user ratings/reviews

### 2. Content-Based Filtering
- Incorporate product attributes (variety, price, climate zone)
- Hybrid approach combining KNN + content similarity

### 3. Real-time Updates
- WebSocket for live recommendation updates
- Real-time browsing tracking

### 4. A/B Testing
- Test different K values
- Compare KNN vs other algorithms
- Measure conversion impact

### 5. Analytics Dashboard
- Track recommendation effectiveness
- Monitor most recommended products
- Analyze user segments

### 6. Personalization Options
- User preference for Climber vs Bush
- Price range preferences
- New vs Familiar product balance

## Troubleshooting

### Issue: No recommendations returned

**Causes**:
- User has no purchase/browsing history
- System unable to find similar users
- All similar users' products already viewed

**Solutions**:
- Ensure user has browsed or purchased products
- Check browsing tracking is working
- Review fallback to popular products

### Issue: Slow recommendation queries

**Causes**:
- Large number of users/products
- Inefficient database queries
- Network latency

**Solutions**:
- Add database indexes
- Implement caching layer
- Consider ANN algorithms for scale

### Issue: Irrelevant recommendations

**Causes**:
- Weights (purchase vs browse) not optimal
- K value too high/low
- Insufficient user data

**Solutions**:
- Adjust PURCHASE_WEIGHT and BROWSE_WEIGHT
- Tune K parameter for dataset
- Collect more user interaction data

## Monitoring & Logs

The system logs:
- Failed recommendation queries
- Browsing tracking errors
- User vector build failures

Enable debug logging:
```javascript
// In recommendationService.js
console.log('Building vector for user:', userId);
console.log('Found neighbors:', neighbors);
console.log('Final recommendations:', recommendations);
```

## References

- [K-Nearest Neighbors Algorithm](https://en.wikipedia.org/wiki/K-nearest_neighbors_algorithm)
- [Collaborative Filtering Basics](https://developers.google.com/machine-learning/recommendation/collaborative-filtering)
- [Recommendation Systems Best Practices](https://www.coursera.org/learn/recommendation-systems)