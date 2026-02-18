# 🚀 Disease Detection Quick Start

## Fast Setup (5 minutes)

### Step 1: Install Python Dependencies (2 min)

```bash
cd backend\python
pip install -r requirements.txt
```

### Step 2: Train the Model (1 min)

```bash
python setup_disease_detection.py
```

When prompted:
- Install dependencies: **Y**
- Train model: **Y**
- Test model: **Y**

### Step 3: Start Disease Detection API (30 sec)

**Option A: Double-click** `start-disease-detection.bat`

**Option B: Command line**
```bash
cd backend\python
python disease_detection_api.py
```

API will start at: `http://localhost:5002`

### Step 4: Start Backend (if not running) (30 sec)

```bash
cd backend
npm run dev
```

Backend will start at: `http://localhost:5000`

### Step 5: Start Frontend (if not running) (30 sec)

```bash
cd frontend
npm start
```

Frontend will open at: `http://localhost:3000`

### Step 6: Access Disease Detection

Navigate to: `http://localhost:3000/disease-detection`

## 🎯 Quick Test

1. Visit `http://localhost:3000/disease-detection`
2. Upload a pepper leaf image
3. Click "Analyze Image"
4. View disease prediction with treatment recommendations

## ✅ Verify Setup

Test the API is working:

```bash
# Test Flask API
curl http://localhost:5002/health

# Test Node.js API
curl http://localhost:5000/api/disease-detection/health
```

## 📝 What You Can Do

- ✅ Upload pepper leaf images
- ✅ Get instant disease detection
- ✅ View confidence scores
- ✅ Get treatment recommendations
- ✅ See prevention tips
- ✅ Track detection history
- ✅ View analytics

## 🐛 Quick Fixes

**Problem**: Model not found
```bash
cd backend\python
python disease_detector.py train
```

**Problem**: Port 5002 in use
- Kill the process or change port in `disease_detection_api.py`

**Problem**: Import errors
```bash
pip install opencv-python scikit-learn Flask Flask-CORS
```

## 🎨 Add to Navigation (Optional)

In your frontend navigation component, add:

```jsx
<Link to="/disease-detection">Disease Detection</Link>
```

## 📚 Full Documentation

See `DISEASE_DETECTION_GUIDE.md` for complete documentation.

---

That's it! You're ready to detect pepper plant diseases! 🌿
