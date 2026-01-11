# Pepper ML Module - Quick Reference

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Python 3.8+ installed
- Node.js installed
- Your PEPPER project backend running

### Step 1: Install Python Dependencies (1 min)
```bash
cd backend/python
python -m pip install -r requirements.txt
```

### Step 2: Setup & Train Models (2 min)
```bash
# One command does everything!
python setup_ml_module.py
```

This will:
- ✅ Generate 2000 training samples
- ✅ Train ML models (yield prediction + soil suitability)
- ✅ Save trained models
- ✅ Test predictions

### Step 3: Start ML API (1 min)
```bash
python pepper_ml_api.py
```

Keep this running in a terminal. You should see:
```
Pepper Yield Prediction API
Server running on: http://localhost:5001
```

### Step 4: Start Node.js Backend (1 min)
In a new terminal:
```bash
cd backend
npm start
```

### ✅ You're Done! Test it:
```bash
curl http://localhost:3000/api/pepper-ml/health
```

---

## 📡 API Endpoints

### Base URL: `http://localhost:3000/api/pepper-ml`

### 1. Health Check
```
GET /health
```

### 2. Get Prediction
```
POST /predict
Content-Type: application/json

{
  "soil_type": "Loamy",              // Sandy | Loamy | Clay
  "water_availability": "High",       // Low | Medium | High
  "irrigation_frequency": 4,          // 1-7 (times per week)
  "crop_stage": "Fruiting"           // Seedling | Vegetative | Flowering | Fruiting
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "predicted_yield_kg": 1.45,
    "soil_suitability": "High",
    "suitability_confidence": 87.3,
    "irrigation_recommendation": "Good water availability...",
    "fertilizer_recommendation": "NPK 13:00:45 @ 7g/plant weekly...",
    "additional_tips": ["..."]
  }
}
```

### 3. Get Available Options
```
GET /options
```

Returns all valid values for dropdowns (soil types, water availability, etc.)

### 4. Compare Scenarios
```
POST /compare-scenarios
Content-Type: application/json

{
  "baseParams": {
    "soil_type": "Loamy",
    "water_availability": "Medium",
    "crop_stage": "Vegetative",
    "irrigation_frequency": 3
  },
  "variations": [
    {
      "name": "Increased Irrigation",
      "irrigation_frequency": 5
    },
    {
      "name": "High Water",
      "water_availability": "High"
    }
  ]
}
```

---

## 💡 Usage Examples

### Frontend (React)
```jsx
import { useState } from 'react';
import axios from 'axios';

function PepperYieldPredictor() {
  const [result, setResult] = useState(null);
  
  const predict = async (formData) => {
    const response = await axios.post('/api/pepper-ml/predict', {
      soil_type: formData.soilType,
      water_availability: formData.waterAvail,
      irrigation_frequency: formData.irrigation,
      crop_stage: formData.stage
    });
    
    setResult(response.data.data);
  };
  
  return (
    <div>
      {result && (
        <>
          <h3>Expected Yield: {result.predicted_yield_kg} kg/plant</h3>
          <p>Soil Suitability: {result.soil_suitability}</p>
          <p>{result.irrigation_recommendation}</p>
          <p>{result.fertilizer_recommendation}</p>
        </>
      )}
    </div>
  );
}
```

### Backend (Node.js)
```javascript
import pepperMLService from './services/pepperMLService.js';

// In your controller
const getPrediction = async (req, res) => {
  try {
    const prediction = await pepperMLService.predictYield(req.body);
    res.json({ success: true, data: prediction });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
```

### Direct Python Usage
```python
from pepper_yield_predictor import PepperYieldPredictor

predictor = PepperYieldPredictor()
predictor.load_models()

result = predictor.predict({
    'soil_type': 'Loamy',
    'water_availability': 'High',
    'irrigation_frequency': 4,
    'crop_stage': 'Fruiting'
})

print(f"Yield: {result['predicted_yield_kg']} kg")
```

---

## 🔧 Troubleshooting

### Problem: "Models not loaded"
**Solution:**
```bash
cd backend/python
python generate_pepper_training_data.py
python pepper_yield_predictor.py
```

### Problem: "ML service is not responding"
**Solution:** Make sure Flask API is running:
```bash
cd backend/python
python pepper_ml_api.py
```

### Problem: "Module not found"
**Solution:** Install dependencies:
```bash
pip install -r requirements.txt
```

### Problem: Port 5001 already in use
**Solution:** Change port in `.env`:
```
ML_API_PORT=5002
```
Then restart the Flask API.

---

## 📊 Input Guidelines

### Soil Types
- **Sandy**: Fast draining, needs frequent watering
- **Loamy**: Best for pepper (balanced)
- **Clay**: Retains water, watch for drainage

### Water Availability
- **Low**: < 1000mm rainfall/year, limited irrigation
- **Medium**: 1000-2000mm, regular irrigation
- **High**: > 2000mm, abundant water

### Irrigation Frequency
- **1-2 times/week**: Dry conditions
- **3-5 times/week**: Optimal
- **6-7 times/week**: Very dry or sandy soil

### Crop Stages
- **Seedling** (0-2 months): Focus on root development
- **Vegetative** (2-6 months): Rapid growth
- **Flowering** (6-8 months): Flower formation
- **Fruiting** (8+ months): Pepper production

---

## 📈 Expected Results

### Yield Range
- **Low**: 0.2 - 0.7 kg/plant
- **Medium**: 0.8 - 1.3 kg/plant
- **High**: 1.4 - 2.5 kg/plant

### Factors Affecting Yield
1. **Soil Type**: Loamy > Clay > Sandy
2. **Water**: High > Medium > Low
3. **Irrigation**: 3-5 times optimal
4. **Stage**: Fruiting shows max potential
5. **Environmental**: Temperature, pH, NPK levels

---

## 🎯 Best Practices

### For Farmers
1. Test soil before planting
2. Follow irrigation recommendations
3. Adjust fertilizer by crop stage
4. Monitor and record actual yields
5. Compare predictions with results

### For Developers
1. Keep Flask API running as a service
2. Implement caching for frequent predictions
3. Log predictions for model improvement
4. Add authentication to ML endpoints
5. Monitor API performance

### For Retraining
1. Collect real-world yield data
2. Add to training dataset
3. Retrain models quarterly
4. Compare model versions
5. Deploy best performing model

---

## 📁 File Structure

```
backend/python/
├── pepper_yield_predictor.py      # ML model training & prediction
├── generate_pepper_training_data.py  # Data generator
├── pepper_ml_api.py               # Flask REST API
├── setup_ml_module.py             # Quick setup script
├── requirements.txt               # Python dependencies
├── data/                          # Training data (generated)
│   └── pepper_training_data.csv
└── models/                        # Trained models (generated)
    ├── yield_model.pkl
    ├── suitability_model.pkl
    ├── scaler.pkl
    ├── label_encoders.pkl
    └── feature_columns.pkl

backend/src/
├── services/
│   └── pepperMLService.js         # Node.js ML client
└── routes/
    └── pepperML.js                # Express routes
```

---

## 🚀 Production Deployment

### Option 1: PM2 (Recommended for VPS)
```bash
pm2 start backend/python/pepper_ml_api.py --name pepper-ml --interpreter python3
pm2 save
pm2 startup
```

### Option 2: Docker
```bash
cd backend/python
docker build -t pepper-ml .
docker run -d -p 5001:5001 --name pepper-ml pepper-ml
```

### Option 3: Systemd (Linux)
Create `/etc/systemd/system/pepper-ml.service` (see full guide)

---

## 📚 More Information

- **Full Setup Guide**: `PEPPER_ML_SETUP_GUIDE.md`
- **Model Details**: See code comments in `pepper_yield_predictor.py`
- **API Docs**: See `pepper_ml_api.py` for all endpoints
- **Integration**: See `pepperMLService.js` for client usage

---

## 🎓 Understanding the ML Model

### What it does:
1. **Regression**: Predicts exact yield in kg/plant
2. **Classification**: Categorizes soil suitability (High/Medium/Low)

### How it works:
1. User provides 4 simple inputs (soil, water, irrigation, stage)
2. System enriches with environmental data (temp, pH, NPK)
3. ML models analyze patterns from training data
4. Returns yield prediction + recommendations

### Accuracy:
- **Yield Prediction R²**: ~0.85-0.95 (85-95% accuracy)
- **Suitability Accuracy**: ~85-95%
- Based on 2000 synthetic training samples

### Can be improved with:
- Real-world data collection
- Weather API integration
- Soil testing results
- Historical yield tracking
- Regional variations

---

## ⚡ Quick Commands Cheat Sheet

```bash
# Setup everything
cd backend/python && python setup_ml_module.py

# Start ML API
python pepper_ml_api.py

# Test prediction
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{"soil_type":"Loamy","water_availability":"High","irrigation_frequency":4,"crop_stage":"Fruiting"}'

# Check health
curl http://localhost:5001/health

# Retrain models
python generate_pepper_training_data.py
python pepper_yield_predictor.py

# View model info
curl http://localhost:5001/model-info
```

---

**Need Help?** Check `PEPPER_ML_SETUP_GUIDE.md` for detailed documentation.
