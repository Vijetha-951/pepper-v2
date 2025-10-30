# ⚡ SVM Cancellation Risk - Quick Start (5 Minutes)

## 🚀 Get Started Now

### Step 1: Access Dashboard
1. Login as Admin
2. Click **"SVM Cancellation Analysis"** in sidebar
3. You'll see the analytics dashboard

### Step 2: Run Predictions
```
Click "Refresh Analytics" button
↓
Wait for analysis (30-60 seconds)
↓
See results instantly
```

### Step 3: Understand the Data

**Summary Cards:**
- **Total Orders**: Active orders being analyzed
- **High Risk**: Orders with >70% cancellation chance
- **Medium Risk**: Orders with 40-70% chance
- **Low Risk**: Orders with <40% chance
- **Avg Risk Score**: Average score (0-100)
- **Revenue at Risk**: $ value of high-risk orders

### Step 4: Take Action

**For HIGH RISK orders:**
1. ✅ Send order confirmation call
2. ✅ Offer 10-15% discount or free delivery
3. ✅ Expedite delivery
4. ✅ Monitor payment

**For MEDIUM RISK orders:**
1. ✅ Confirm delivery address via SMS
2. ✅ Send tracking updates
3. ✅ Quick follow-up if delayed

**For LOW RISK orders:**
1. ✅ Standard processing

---

## 📊 Dashboard Tabs Explained

### 📈 Overview Tab
Shows:
- Risk distribution (pie/bar chart)
- Top 10 highest-risk orders
- Current metrics

**Action:** Review top orders, contact customers

### 📉 Trends Tab
Shows:
- Risk trend over time
- Daily breakdown
- Pattern identification

**Action:** Identify peak risk periods, adjust strategies

### 💳 Payment Analysis Tab
Shows:
- COD vs CARD comparison
- Risk by payment method
- Revenue breakdown

**Action:** Focus on riskier payment methods

---

## 🎯 Risk Levels Quick Reference

| Level | Score | What It Means | Action |
|-------|-------|--------------|--------|
| 🔴 HIGH | 70-100 | Very likely to cancel | Call customer, offer incentive |
| 🟡 MEDIUM | 40-70 | Might cancel | Confirm details, track order |
| 🟢 LOW | 0-40 | Unlikely to cancel | Normal processing |

---

## 📋 Features

| Feature | Where | How to Use |
|---------|-------|-----------|
| See All Predictions | Overview Tab | Scroll table for details |
| Filter by Risk | Sort dropdown | Select HIGH/MEDIUM/LOW |
| Search Orders | Search box | Enter Order ID or customer name |
| Export Data | Download button | Get CSV file for reports |
| See Trends | Trends Tab | Check patterns over time |
| Payment Analysis | Payment Tab | Compare payment methods |

---

## 🔢 Behind the Scenes: 8 Risk Factors

The system checks these 8 factors:

1. **Payment Method**: COD = higher risk ⚠️
2. **Past Cancellations**: More cancellations = higher risk 📊
3. **Order Amount**: Very high amounts = higher risk 💰
4. **Delivery Time**: Longer delivery = higher risk ⏱️
5. **Order Count**: Regular customers = lower risk 👥
6. **Account Age**: New customers = higher risk 🆕
7. **Average Spending**: Higher spenders = lower risk 💵
8. **Cancellation Rate**: % of orders cancelled = higher risk 📉

---

## 💡 Tips & Tricks

### ✅ Best Practices
- ✅ Check dashboard daily for new high-risk orders
- ✅ Act quickly on RED orders (within 30 mins)
- ✅ Use export feature to create reports for team
- ✅ Watch trends to identify patterns
- ✅ Focus retention efforts on COD orders

### ❌ Common Mistakes
- ❌ Don't ignore MEDIUM risk orders
- ❌ Don't wait - call HIGH risk customers immediately
- ❌ Don't only look at overview - check trends too
- ❌ Don't ignore payment method insights

---

## 🆘 Quick Troubleshooting

**Q: Dashboard shows "Analyzing..."**
A: Normal - wait 30-60 seconds, takes time to process all orders

**Q: Why is my favorite customer HIGH RISK?**
A: Could be: COD payment, past cancellations, or large order amount

**Q: How often should I refresh?**
A: Once daily for comprehensive view, or after new orders come in

**Q: Can I export the data?**
A: Yes! Click "Export CSV" to download Excel file

---

## 📱 Mobile View

Dashboard works on mobile too:
1. Click menu button ☰
2. Select "SVM Cancellation Analysis"
3. All features available
4. Swipe charts left/right to see more

---

## 🎓 Learn More

For detailed technical info, see: `SVM_CANCELLATION_SETUP.md`

For API documentation, see: Backend routes in `backend/src/routes/cancellation.routes.js`

---

## ⏱️ Quick Stats

- **Time to see results**: 30-60 seconds
- **Predictions per order**: <100ms
- **Accuracy**: Improves with historical data
- **Max orders analyzed**: 200+ per request
- **Data export**: CSV format

---

## 🎯 Success Metrics

Track these:
- Average risk score (lower is better)
- % HIGH risk orders (target: <30%)
- Revenue at risk (monitor trends)
- Cancellation rate (should decrease)
- Customer satisfaction (should improve)

---

## 🚀 You're Ready!

1. ✅ Log in as admin
2. ✅ Click "SVM Cancellation Analysis"
3. ✅ Click "Refresh Analytics"
4. ✅ Review results
5. ✅ Take action on HIGH risk orders

**That's it! Dashboard is live and working.**

---

**Last Updated**: 2024
**Version**: 1.0
**Status**: Production Ready ✅