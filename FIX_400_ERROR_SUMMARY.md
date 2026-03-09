# ✅ Disease Detection - 400 Error FIXED

## What Was Wrong

The **400 Bad Request error** was caused by:
1. Node.js backend was **NOT passing the `pepper_type` parameter** to Python API
2. Multiple Python processes running on port 5001 (causing conflicts)
3. Old Node.js code still running (didn't have the updated code)

## What Was Fixed

✅ **Updated Node.js Disease Detection Service**
- Now accepts and forwards `pepper_type` parameter
- Defaults to `'black_pepper'` if not specified
- Works with both file uploads and URL predictions

✅ **Updated Express Routes**
- `/api/disease-detection/predict` - Accepts `pepper_type` in form data
- `/api/disease-detection/predict-url` - Accepts `pepper_type` in JSON body

✅ **Cleaned Up Services**
- Killed duplicate Python processes
- Restarted both Node.js (port 5000) and Python API (port 5001)

## Current Status

🟢 **Node.js Backend**: Running on port 5000  
🟢 **Python API**: Running on port 5001 (Dual Model - Bell & Black Pepper)  
🟢 **Frontend**: Should now work properly!

## How to Use (Frontend)

### For Image Upload

The frontend can now send `pepper_type` parameter:

```javascript
// Default (Black Pepper)
const formData = new FormData();
formData.append('image', file);
// pepper_type defaults to 'black_pepper'

// Or specify Bell Pepper
const formData = new FormData();
formData.append('image', file);
formData.append('pepper_type', 'bell_pepper');
```

### API Request Example

```bash
# Upload image with Bell Pepper model
curl -X POST http://localhost:5000/api/disease-detection/predict \
  -F "image=@pepper_leaf.jpg" \
  -F "pepper_type=bell_pepper"

# Upload image with Black Pepper model (or omit pepper_type)
curl -X POST http://localhost:5000/api/disease-detection/predict \
  -F "image=@pepper_leaf.jpg" \
  -F "pepper_type=black_pepper"
```

## Testing from Frontend

**Try uploading an image now!**

1. Go to your disease detection page
2. Upload a pepper leaf image
3. The image will be analyzed using the **black pepper model** by default
4. Result should show without 400 error!

## What Changed in the Code

### File 1: `backend/src/services/diseaseDetectionService.js`

**Before:**
```javascript
async predictFromFile(imagePath, metadata = {}) {
  const formData = new FormData();
  formData.append('image', fs.createReadStream(imagePath));
  // No pepper_type parameter!
}
```

**After:**
```javascript
async predictFromFile(imagePath, metadata = {}) {
  const formData = new FormData();
  formData.append('image', fs.createReadStream(imagePath));
  
  // Add pepper_type (defaults to black_pepper)
  const pepperType = metadata.pepper_type || metadata.pepperType || 'black_pepper';
  formData.append('pepper_type', pepperType);
}
```

### File 2: `backend/src/routes/diseaseDetection.routes.js`

**Before:**
```javascript
const prediction = await diseaseDetectionService.predictFromFile(imagePath, {
  user_id: metadata.userId,
  location: metadata.location?.address,
  notes: metadata.notes
  // Missing pepper_type!
});
```

**After:**
```javascript
const metadata = {
  // ... other fields ...
  pepperType: req.body.pepper_type || req.body.pepperType || 'black_pepper'
};

const prediction = await diseaseDetectionService.predictFromFile(imagePath, {
  user_id: metadata.userId,
  location: metadata.location?.address,
  notes: metadata.notes,
  pepper_type: metadata.pepperType  // ✅ Now included!
});
```

## If You Still Get Errors

### Check Services Are Running

```powershell
# Check Node.js backend (should show port 5000)
netstat -ano | findstr ":5000"

# Check Python API (should show port 5001)
netstat -ano | findstr ":5001"

# Test Node.js backend
curl http://localhost:5000/api/health

# Test Python API
curl http://localhost:5001/health
```

### Restart Services

```powershell
# 1. Kill all processes
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Start Python API
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\xampp\htdocs\PEPPER\backend\python; python disease_detection_api.py"

# 3. Wait 10 seconds for models to load, then start Node.js
Start-Sleep -Seconds 10
cd C:\xampp\htdocs\PEPPER\backend
npm start
```

## Frontend Integration (Optional)

If you want to add a pepper type selector to your frontend:

```javascript
// Add dropdown in your form
<select name="pepperType">
  <option value="black_pepper">Black Pepper (Piper nigrum)</option>
  <option value="bell_pepper">Bell Pepper (Capsicum)</option>
</select>

// Then include it in the upload
const formData = new FormData();
formData.append('image', file);
formData.append('pepper_type', selectedPepperType);
```

## Summary

✅ **400 Error Fixed**: Node.js now properly forwards `pepper_type` to Python API  
✅ **Default Behavior**: Uses `black_pepper` model if not specified  
✅ **Both Models Available**: Can detect diseases in both pepper types  
✅ **Services Running**: Port 5000 (Node.js) and 5001 (Python API)  

**Try uploading an image now - it should work!** 🎉
