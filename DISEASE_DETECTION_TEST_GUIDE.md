# Disease Detection - Testing Guide

## ✅ **Fixes Applied Successfully**

### What Was Fixed:
1. ✅ **Python Flask API** - Now running on port 5002
2. ✅ **500 Errors** - Fixed by starting the Python service
3. ✅ **400 History Errors** - Modified to work without userId
4. ✅ **Routing** - Verified `/disease-detection` route is properly configured

---

## 🧪 **How to Test**

### 1. Verify Python API is Running

**PowerShell:**
```powershell
netstat -ano | Select-String ":5002"
# Should show: TCP 0.0.0.0:5002 ... LISTENING
```

**Expected Output:**
```
TCP    0.0.0.0:5002    0.0.0.0:0    LISTENING    [PID]
```

---

### 2. Test API Health Endpoint

**Option A: Using Browser**
```
http://localhost:5002/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "Disease Detection API",
  "model_trained": true,
  "timestamp": "2026-02-19T09:25:00"
}
```

**Option B: Using PowerShell**
```powershell
(Invoke-WebRequest -Uri "http://localhost:5002/health" -UseBasicParsing).Content
```

---

### 3. Test Diseases Endpoint

**Browser URL:**
```
http://localhost:5002/diseases
```

**Expected Response:**
```json
{
  "success": true,
  "count": 4,
  "diseases": [
    {
      "name": "Healthy",
      "description": "Your pepper plant appears healthy...",
      "severity": "None",
      "treatment": [...],
      "prevention": [...]
    },
    ...
  ]
}
```

---

### 4. Test Node.js Backend Endpoints

**Prerequisites:** 
- Node.js backend must be running (usually on port 5000 or 5001)
- Python API must be running on port 5002

#### Test 1: Backend Health Check
```
http://localhost:5000/api/disease-detection/health
```

#### Test 2: Get Diseases Info
```
http://localhost:5000/api/disease-detection/diseases
```

#### Test 3: Get History (Now works without userId!)
```
http://localhost:5000/api/disease-detection/history?limit=10
```

**Expected:** No more 400 errors! Should return:
```json
{
  "success": true,
  "count": 0,
  "detections": []
}
```
*Note: Empty array is normal if no detections have been made yet*

---

### 5. Test Frontend UI

#### Access the Page:
```
http://localhost:3000/disease-detection
```

#### What Should Work:
1. ✅ Page loads without 404 error
2. ✅ Diseases info section displays (no 500 error)
3. ✅ Upload area is visible
4. ✅ No 400 errors in console for history

#### How to Test Disease Detection:
1. Click "Select Image" or drag & drop a plant leaf image
2. (Optional) Add metadata:
   - Plant Age
   - Variety
   - Notes
3. Click "Analyze Disease"
4. Should see prediction results with:
   - Disease name
   - Confidence percentage
   - Treatment recommendations
   - Prevention tips

---

## 🐛 **Troubleshooting**

### Issue: Python API Not Responding

**Check if running:**
```powershell
netstat -ano | Select-String ":5002"
```

**If not running, start it:**
```bash
cd backend\python
python disease_detection_api.py
```

**Or use the batch script:**
```bash
.\start-disease-detection.bat
```

---

### Issue: "Model not trained" Error

**Train the model:**

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5002/train" -Method Post -ContentType "application/json"
```

**curl:**
```bash
curl -X POST http://localhost:5002/train
```

**Expected Response:**
```json
{
  "success": true,
  "accuracy": 0.983,
  "training_samples": 800,
  "test_samples": 200,
  "classes": ["Healthy", "Bacterial Spot", "Yellow Leaf Curl", "Nutrient Deficiency"]
}
```

---

### Issue: Image Upload Fails

**Common Causes:**
1. File too large (max 10MB)
2. Invalid file type (only jpg, png, gif, bmp allowed)
3. Python API not running

**Check:**
```powershell
# Verify API is running
netstat -ano | Select-String ":5002"

# Check Python API logs
# Look at the terminal where you started disease_detection_api.py
```

---

### Issue: History Still Showing Errors

**If 400 errors persist:**
1. Restart Node.js backend server
2. Clear browser cache and reload
3. Check backend logs for errors

**If 500 errors persist:**
1. Check MongoDB connection
2. Verify DiseaseDetection model is properly imported
3. Check backend console for errors

---

## 📊 **Expected vs Actual Results**

### Before Fix:
| Endpoint | Status | Error |
|----------|--------|-------|
| `/api/disease-detection/diseases` | ❌ 500 | Service unavailable |
| `/api/disease-detection/history` | ❌ 400 | User ID required |
| `/api/disease-detection/predict` | ❌ 500 | Service unavailable |
| `http://localhost:5002/health` | ❌ | Connection refused |

### After Fix:
| Endpoint | Status | Response |
|----------|--------|----------|
| `/api/disease-detection/diseases` | ✅ 200 | Disease list |
| `/api/disease-detection/history` | ✅ 200 | Detections array |
| `/api/disease-detection/predict` | ✅ 200 | Prediction results |
| `http://localhost:5002/health` | ✅ 200 | Healthy status |

---

## 🔍 **Verify Fix with Browser Console**

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Navigate to: `http://localhost:3000/disease-detection`
4. Check for errors:

**Before Fix:**
```
❌ GET /api/disease-detection/history?limit=10  400 (Bad Request)
❌ GET /api/disease-detection/diseases          500 (Internal Server Error)
```

**After Fix:**
```
✅ GET /api/disease-detection/history?limit=10  200 OK
✅ GET /api/disease-detection/diseases          200 OK
```

---

## 📝 **Test Checklist**

Use this checklist to verify everything works:

- [ ] Python API is running on port 5002
- [ ] `/health` endpoint returns "healthy"
- [ ] `/diseases` endpoint returns disease list
- [ ] Node.js backend is running
- [ ] `/api/disease-detection/history` returns 200 (not 400)
- [ ] `/api/disease-detection/diseases` returns 200 (not 500)
- [ ] Frontend `/disease-detection` page loads
- [ ] No 500 errors in browser console
- [ ] No 400 errors in browser console
- [ ] Can upload image successfully
- [ ] Prediction returns results

---

## 🎯 **Success Criteria**

✅ **All Tests Passed** if:
1. No 500 errors (API is running)
2. No 400 errors (history works without userId)
3. Page loads without 404
4. Can make predictions successfully

---

## 📞 **Support**

If issues persist:
1. Check Python API terminal for error messages
2. Check Node.js backend console for errors
3. Verify MongoDB is running
4. Check browser console for JavaScript errors
5. Review `DISEASE_DETECTION_ERROR_FIX.md` for detailed information

---

**Last Updated:** February 19, 2026  
**Status:** ✅ All major fixes applied successfully
