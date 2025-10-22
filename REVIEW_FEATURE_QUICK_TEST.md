# Review Feature - Quick Testing Guide

## ⚡ Quick Start Testing

### Step 1: Backend Setup
```bash
# Ensure backend is running
cd backend
npm run dev
# Should see: ✅ Connected to MongoDB
#           🚀 Server running on http://localhost:5000
```

### Step 2: Verify Review Model is Created
```bash
# Check MongoDB
# The Review collection should be created automatically on first insert
# Check indices exist:
db.reviews.getIndexes()
```

### Step 3: Frontend Setup
```bash
# Start frontend dev server
cd frontend
npm start
# Should load on http://localhost:3000
```

---

## 🧪 Testing Scenarios

### Scenario 1: Submit a Review (Happy Path)

**Prerequisites:**
- User must be logged in
- Must have at least one DELIVERED order with products

**Steps:**
1. Navigate to Dashboard → **My Orders**
2. Find an order with status **DELIVERED**
3. You should see a **Review** button (orange star icon) for each product
4. Click any Review button → ReviewModal opens
5. **Fill the form:**
   - Click 5 stars (all turn golden)
   - Type comment: "Great plant! Very healthy and well-packaged."
   - Leave complaint as "None"
   - Click "Submit Review"
6. **Expected Result:**
   - Success message appears
   - Modal closes automatically
   - Modal/button disappears

### Scenario 2: Edit an Existing Review

**Prerequisites:**
- Must have submitted a review (< 30 days ago)

**Steps:**
1. Dashboard → **My Reviews** tab
2. See your review card with:
   - Product image & name
   - Star rating
   - Your comment
   - Edit & Delete buttons
3. Click **Edit** button
4. Modal opens with current values pre-filled
5. Change rating from 5 to 4 stars
6. Update comment to: "Good plant but leaves have some damage"
7. Change complaint to "Damaged"
8. Add description: "A few leaves were bent"
9. Click "Update Review"
10. **Expected Result:**
    - Success message
    - Modal closes
    - Card updates with new info
    - "Edited 1x" badge appears

### Scenario 3: Delete a Review

**Steps:**
1. Dashboard → **My Reviews**
2. Click **Delete** button on any review
3. Confirmation modal appears: "Are you sure?"
4. Click **Delete** to confirm
5. **Expected Result:**
    - Success message
    - Review card disappears
    - If last review, empty state shows

### Scenario 4: Edit Window Expires (30 days)

**Test Preparation:**
- Need to modify a review's createdAt date in MongoDB
- Or wait 30 days 😊

**Expected Behavior:**
- Edit & Delete buttons should disappear
- Status badge shows: "Cannot edit (30 days passed)"

---

## 🔍 Error Testing

### Test 1: Try to Review Undelivered Order
1. Go to Orders page
2. Find order with status PENDING, APPROVED, or OUT_FOR_DELIVERY
3. **Expected:** No Review button appears

### Test 2: Submit Duplicate Review
1. Already submitted a review for a product
2. Click Review button again
3. Fill form and submit
4. **Expected Error:** "You have already reviewed this product. You can edit your existing review."

### Test 3: Invalid Rating
1. Open ReviewModal
2. Click submit WITHOUT selecting any star
3. **Expected:** Button disabled, error message: "Please select a rating"

### Test 4: Comment Too Long
1. ReviewModal open
2. Paste 1001+ characters in comment
3. **Expected:** Textarea prevents input (maxLength enforced)

### Test 5: Complaint Type Changes
1. Select complaint type "Damaged"
2. A textarea appears below
3. Change back to "None"
4. **Expected:** Complaint textarea disappears

---

## 📊 Data Verification

### Check Created Review in Database
```javascript
// MongoDB query
db.reviews.findOne({
  user: ObjectId("YOUR_USER_ID"),
  product: ObjectId("PRODUCT_ID")
})

// Should return object like:
{
  "_id": ObjectId("..."),
  "user": ObjectId("..."),
  "product": ObjectId("..."),
  "order": ObjectId("..."),
  "rating": 5,
  "comment": "Your comment",
  "complaintType": "None",
  "isPublished": true,
  "editCount": 0,
  "createdAt": ISODate("2024-01-15T10:30:00.000Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00.000Z")
}
```

### Test Unique Constraint
1. In MongoDB, try to insert duplicate review:
```javascript
db.reviews.insertOne({
  user: ObjectId("..."),  // Same as existing
  product: ObjectId("..."), // Same as existing
  rating: 3,
  // This should FAIL with duplicate key error
})
```

---

## 🌐 API Testing with Curl/Postman

### Test 1: Get Product Reviews (Public - No Auth)
```bash
curl http://localhost:5000/api/reviews/public/product/64a5f3c2e1b9c8d7e6f5a432

# Response should have:
{
  "reviews": [...],
  "stats": {
    "totalReviews": 2,
    "averageRating": "4.5",
    "ratingBreakdown": { "5": 1, "4": 1, ... }
  }
}
```

### Test 2: Submit Review (With Auth)
```bash
curl -X POST http://localhost:5000/api/reviews \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "64a5f3c2e1b9c8d7e6f5a432",
    "orderId": "64a5f3c2e1b9c8d7e6f5a433",
    "rating": 5,
    "comment": "Excellent!",
    "complaintType": "None"
  }'

# Should return 201 Created with review object
```

### Test 3: Get User Reviews (With Auth)
```bash
curl http://localhost:5000/api/reviews/user/my-reviews \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should return array of user's reviews with canEdit flag
```

### Test 4: Update Review (With Auth)
```bash
curl -X PUT http://localhost:5000/api/reviews/REVIEW_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4,
    "comment": "Good plant!"
  }'

# Should return 200 with updated review
```

---

## 📱 Frontend Component Tests

### ReviewModal Component
- [ ] Opens with product image displayed
- [ ] Opens with order ID shown (truncated)
- [ ] Star rating hovers work (turn golden on hover)
- [ ] Stars persist after click
- [ ] Comment counts characters (X/1000)
- [ ] Complaint dropdown filters description field visibility
- [ ] Submit button enabled only with rating selected
- [ ] Close button (X) closes modal
- [ ] Clicking overlay closes modal

### MyReviews Page
- [ ] Shows loading spinner while fetching
- [ ] Shows empty state if no reviews
- [ ] Displays reviews in card grid
- [ ] Product thumbnail loads correctly
- [ ] Stars display with correct count
- [ ] Edit/Delete buttons only show if < 30 days
- [ ] Delete confirmation modal appears
- [ ] Edit count badge shows on edited reviews
- [ ] Status badges display correct state

### Orders Integration
- [ ] Review buttons only show on DELIVERED orders
- [ ] Review button per product (not per order)
- [ ] Modal opens with correct product
- [ ] Modal opens with correct order
- [ ] Success message after submit

---

## 🐛 Debug Checklist

If something doesn't work:

### Backend Issues
- [ ] Check `backend/src/models/Review.js` exists
- [ ] Check `backend/src/routes/reviews.routes.js` exists
- [ ] Check `reviewsRouter` imported in `server.js`
- [ ] Check route registered: `app.use('/api/reviews', reviewsRouter)`
- [ ] Check MongoDB connection (`✅ Connected to MongoDB`)
- [ ] Check browser console for 401/403 auth errors
- [ ] Test API directly with Postman/curl

### Frontend Issues
- [ ] Check console for JavaScript errors (F12)
- [ ] Check network tab for failed requests
- [ ] Verify `ReviewModal.jsx` imported in `Orders.jsx`
- [ ] Verify `MyReviews.jsx` imported in `Dashboard.jsx`
- [ ] Verify CSS files are in correct locations
- [ ] Check `.env` has correct API base URL

### Common 401 Errors
- Token expired → Re-login
- Missing Authorization header → Check review service is getting token
- Invalid token → Check token format is "Bearer <token>"

---

## 📋 Sign-Off Checklist

After testing, verify:
- [ ] Can submit review for delivered order
- [ ] Can view review in My Reviews
- [ ] Can edit review within 30 days
- [ ] Can delete review within 30 days
- [ ] Cannot edit/delete after 30 days
- [ ] Cannot duplicate review
- [ ] Modal validates rating selection
- [ ] Error messages display correctly
- [ ] Success messages appear
- [ ] Public product reviews endpoint works
- [ ] Responsive design on mobile
- [ ] No console errors

---

## 🎯 Expected File Sizes

After implementation, verify these files exist:
- `backend/src/models/Review.js` - ~1.5 KB
- `backend/src/routes/reviews.routes.js` - ~7 KB
- `frontend/src/services/reviewService.js` - ~2 KB
- `frontend/src/components/ReviewModal.jsx` - ~4 KB
- `frontend/src/components/ReviewModal.css` - ~4 KB
- `frontend/src/pages/MyReviews.jsx` - ~6 KB
- `frontend/src/pages/MyReviews.css` - ~5 KB

**Total: ~29 KB** of new code/styles

---

## 📞 Still Having Issues?

1. Check REVIEW_FEATURE_GUIDE.md for detailed architecture
2. Verify all file paths are correct
3. Check that MongoDB indexes were created
4. Restart both backend and frontend servers
5. Clear browser cache (Ctrl+Shift+Del)

Happy Testing! 🎉