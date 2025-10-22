# Quick Setup Guide - Product Recommendation Engine

## Installation & Deployment

### Backend Setup (Already Completed)

1. **New Model Created**:
   - ✅ `src/models/BrowsingHistory.js` - Tracks product views

2. **New Service Created**:
   - ✅ `src/services/recommendationService.js` - KNN recommendation logic

3. **New Route Created**:
   - ✅ `src/routes/recommendations.routes.js` - API endpoints

4. **Backend Updated**:
   - ✅ `src/server.js` - Routes registered

### Frontend Setup (Already Completed)

1. **New Component Created**:
   - ✅ `src/components/RecommendedProducts.jsx` - UI component

2. **Service Updated**:
   - ✅ `src/services/customerProductService.js` - Added recommendation methods

3. **Dashboard Updated**:
   - ✅ `src/pages/Dashboard.jsx` - Integrated recommendations tab
   - ✅ Added browsing tracking on product hover
   - ✅ Added "Recommendations" menu item

## Verification Checklist

### Backend Verification

- [ ] Start backend: `npm run dev` in `/backend`
- [ ] Check database connection
- [ ] Verify MongoDB has collections for:
  - [ ] `browsinghistories` (new)
  - [ ] `products`
  - [ ] `orders`
  - [ ] `users`

### API Endpoints Verification

- [ ] Test recommendations endpoint:
  ```bash
  curl -X GET "http://localhost:5000/api/recommendations/products" \
    -H "Authorization: Bearer {firebaseToken}"
  ```

- [ ] Test browsing tracking:
  ```bash
  curl -X POST "http://localhost:5000/api/recommendations/track" \
    -H "Authorization: Bearer {firebaseToken}" \
    -H "Content-Type: application/json" \
    -d '{"productId": "productId"}'
  ```

### Frontend Verification

- [ ] Start frontend: `npm start` in `/frontend`
- [ ] Login to dashboard
- [ ] Check sidebar has "Recommendations" menu item
- [ ] Click on Products tab and hover over products
- [ ] Check browser console for tracking calls
- [ ] Click Recommendations tab
- [ ] Verify recommendations load (may take time on first run)

## Initial Testing Workflow

### Step 1: Create Test Data

1. **Register multiple test users**:
   - User A
   - User B
   - User C

2. **Have User A browse products**:
   - Go to Products tab
   - Hover over 5-10 different products
   - Notice browsing gets tracked

3. **Have User A make purchases**:
   - Add 2-3 products to cart
   - Complete checkout
   - Orders recorded with purchases

### Step 2: Create Similar Users

1. **Have User B browse similar products** (same varieties as User A):
   - Hover over same or similar products
   - Create similar browsing pattern

2. **Have User B purchase** similar products:
   - Add to cart and checkout
   - Creates matching purchase pattern

### Step 3: Test Recommendations

1. **View recommendations as User A**:
   - Click "Recommendations" tab
   - Should see products User B likes that A hasn't seen
   - Should show insights about purchases/browsing

2. **View recommendations as User B**:
   - Should see different recommendations (based on A's behavior)
   - May include products A purchased

3. **Compare with User C**:
   - If C has different pattern (Bush varieties vs Climber)
   - Recommendations should be completely different

## Common Issues & Solutions

### Issue: Recommendations tab appears but shows no products

**Likely Cause**: Not enough user interaction data

**Solutions**:
1. Ensure you've browsed/purchased products first
2. Check browser console for errors
3. Verify API is returning data:
   ```bash
   curl -X GET "http://localhost:5000/api/recommendations/products" \
     -H "Authorization: Bearer {firebaseToken}"
   ```

### Issue: "Error tracking browsing" in console

**Likely Cause**: Authentication or network issue

**Solutions**:
1. Check Firebase token is valid
2. Verify backend is running
3. Check network tab for failed requests

### Issue: Recommendations are always the same

**Likely Cause**: Not enough similar users or algorithm needs tuning

**Solutions**:
1. Create more test users with varied patterns
2. Adjust K parameter in `recommendationService.js`
3. Check if fallback (popular products) is being used

### Issue: Slow loading recommendations

**Likely Cause**: Large dataset or inefficient queries

**Solutions**:
1. Check database indexes exist:
   ```javascript
   // In MongoDB
   db.browsinghistories.getIndexes()
   ```
2. Reduce K value to lower computation
3. Implement caching for frequent queries

## Database Cleanup (if needed)

### Reset Browsing History
```javascript
// In MongoDB shell
db.browsinghistories.deleteMany({})
```

### Reset Orders
```javascript
// In MongoDB shell
db.orders.deleteMany({})
```

## Performance Tuning

### Recommended Settings for Different Scales

| User Count | K Value | Limit | Recommended Cache |
|-----------|---------|-------|-------------------|
| < 100     | 5       | 5     | None              |
| 100-1K    | 5       | 5     | 1 hour            |
| 1K-10K    | 3-5     | 3     | 30 min            |
| > 10K     | 3       | 3     | 15 min            |

### Caching Implementation (Future)

```javascript
// Example: Add Redis caching
const cacheKey = `recommendations:${userId}:k${k}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const recommendations = await recommendationService.getRecommendedProducts(userId, k, limit);
await redis.setex(cacheKey, 3600, JSON.stringify(recommendations)); // 1 hour cache
```

## Monitoring

### Key Metrics to Track

1. **Recommendation Quality**:
   - Click-through rate on recommendations
   - Add-to-cart rate from recommendations
   - Conversion rate

2. **Performance**:
   - Recommendation query time
   - Browsing tracking latency
   - API response times

3. **Engagement**:
   - Recommendations tab visits
   - Refresh rate
   - User interaction with recommendations

### Log Monitoring

Check for errors in:
- Backend console (Node.js)
- Browser console (React)
- Database logs (MongoDB)

## Rollout Plan

### Phase 1: Test Environment (Now)
- ✅ Implementation complete
- [ ] Run through verification checklist
- [ ] Test with multiple users
- [ ] Verify performance

### Phase 2: Staging Environment
- [ ] Deploy to staging server
- [ ] Load test with realistic data
- [ ] Monitor for 1 week
- [ ] Gather user feedback

### Phase 3: Production Rollout
- [ ] Deploy to production
- [ ] Monitor closely first 24 hours
- [ ] Have rollback plan ready
- [ ] Gather user analytics

## Documentation Links

- **Full Documentation**: `RECOMMENDATION_ENGINE.md`
- **API Reference**: See `RECOMMENDATION_ENGINE.md` → API Reference
- **Configuration**: See `RECOMMENDATION_ENGINE.md` → Configuration
- **Troubleshooting**: See `RECOMMENDATION_ENGINE.md` → Troubleshooting

## Support

### Debug Mode

Enable detailed logging:
```javascript
// In recommendationService.js
const DEBUG = true; // Set to true for verbose logging
```

### Common Questions

**Q: How long until recommendations appear?**
A: Instantly (if you have similar users with history). First-time users see popular products.

**Q: How often are recommendations updated?**
A: Real-time - updated each time you browse or make changes. Click "Refresh" to reload.

**Q: Can users control their recommendations?**
A: Currently automatic. Future versions can add preferences (Climber/Bush preference, price range, etc.)

**Q: How much data is stored for tracking?**
A: Only product views and purchases. Minimal storage footprint (~1KB per 100 views).

## Next Steps

1. **Verify setup** using the checklist above
2. **Test with sample users** using the workflow above
3. **Monitor performance** and gather metrics
4. **Optimize** based on results
5. **Deploy to production** when satisfied

---

**Setup Completed By**: Zencoder AI Assistant
**Date**: 2024
**Version**: 1.0