# 🚨 Disease Detection - Quick Fix Reference

## **The Problem**
- ❌ 500 errors on API calls
- ❌ 400 errors on history endpoint  
- ❌ Disease detection not working

## **The Solution**

### 1️⃣ **Start Python API** (MOST IMPORTANT)
```bash
# Method 1: Simple
cd backend\python
python disease_detection_api.py

# Method 2: With setup
.\start-disease-detection.bat
```

### 2️⃣ **Verify It's Running**
```powershell
netstat -ano | Select-String ":5002"
# Should see: LISTENING on port 5002
```

### 3️⃣ **Train Model** (If Needed)
```powershell
Invoke-RestMethod -Uri "http://localhost:5002/train" -Method Post
```

---

## **What Was Fixed**

### ✅ API endpoint now handles missing userId:
**Before:**
```javascript
if (!userId) {
  return res.status(400).json({ message: 'User ID is required' });
}
```

**After:**
```javascript
if (!userId) {
  // Return recent detections instead
  detections = await getRecentDetections(limit);
}
```

---

## **Files Modified**

1. **`backend/src/routes/diseaseDetection.routes.js`**
   - Line ~279: Modified `/history` endpoint

2. **`backend/src/services/diseaseDetectionService.js`**  
   - Added `getRecentDetections()` method

---

## **Test URLs**

### Python API (Port 5002):
- Health: `http://localhost:5002/health`
- Diseases: `http://localhost:5002/diseases`
- Train: `POST http://localhost:5002/train`

### Node.js Backend (Port 5000):
- Health: `http://localhost:5000/api/disease-detection/health`
- History: `http://localhost:5000/api/disease-detection/history`
- Diseases: `http://localhost:5000/api/disease-detection/diseases`

### Frontend (Port 3000):
- UI: `http://localhost:3000/disease-detection`

---

## **Common Commands**

### Check if API is running:
```powershell
netstat -ano | Select-String ":5002"
```

### Kill process on port 5002:
```powershell
# Find PID first
netstat -ano | Select-String ":5002"
# Kill it
taskkill /PID [PID_NUMBER] /F
```

### Install Python dependencies:
```bash
cd backend\python
pip install -r requirements.txt
```

---

## **Emergency Restart**

If everything is broken:

1. **Kill all processes:**
   ```powershell
   # Kill Python API (if running)
   taskkill /F /IM python.exe
   
   # Kill Node.js (if needed)
   taskkill /F /IM node.exe
   ```

2. **Restart in order:**
   ```bash
   # 1. Start MongoDB (if not running)
   net start MongoDB
   
   # 2. Start Python API
   cd backend\python
   python disease_detection_api.py
   
   # 3. Start Node.js backend (in new terminal)
   cd backend
   npm start
   
   # 4. Start React frontend (in new terminal)
   cd frontend
   npm start
   ```

---

## **Status Check**

Run this to verify everything:

```powershell
# Check all required ports
netstat -ano | Select-String ":5002|:5000|:3000"

# Should see:
# :5002 - Python API (disease detection)
# :5000 - Node.js backend
# :3000 - React frontend
```

---

## **Error Reference**

| Error | Cause | Fix |
|-------|-------|-----|
| 500 on `/diseases` | Python API not running | Start Python API |
| 400 on `/history` | Missing userId | ✅ Fixed in code |
| 404 on page | Routing issue | ✅ Route configured |
| "Model not trained" | Model needs training | Run `/train` endpoint |
| Connection refused | Python API down | Restart Python API |

---

## **Success Indicators**

✅ **Working correctly when:**
- Port 5002 shows LISTENING
- `/health` returns `{"status": "healthy"}`
- No 500 errors in browser console
- No 400 errors on history endpoint
- Can upload and analyze images

---

**Quick Access:**
- Fix Summary: `DISEASE_DETECTION_ERROR_FIX.md`
- Test Guide: `DISEASE_DETECTION_TEST_GUIDE.md`
- This Card: `DISEASE_DETECTION_QUICK_REF.md`

**Last Updated:** February 19, 2026
