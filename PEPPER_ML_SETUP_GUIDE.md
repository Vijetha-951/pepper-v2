# Pepper Nursery ML Module - Setup Guide

This guide will help you set up the Machine Learning module for pepper yield prediction and cultivation recommendations.

## Overview

The ML module consists of:
- **Python ML Backend**: Training and inference using scikit-learn
- **Flask REST API**: Exposes predictions via HTTP endpoints
- **Node.js Integration**: Service layer to connect with your Express backend

## Architecture

```
Frontend (React)
    ↓
Node.js Backend (Express)
    ↓
pepperMLService.js (Node.js service)
    ↓ HTTP
Flask API (Python) :5001
    ↓
ML Models (scikit-learn)
```

## Step-by-Step Setup

### Step 1: Install Python Dependencies

Navigate to the Python directory:
```bash
cd backend/python
```

Create a virtual environment (recommended):
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

### Step 2: Generate Training Data

Generate synthetic agricultural data for training:
```bash
python generate_pepper_training_data.py
```

This will create `backend/python/data/pepper_training_data.csv` with 2000 samples.

**Output:**
- 2000 training samples
- Features: soil type, water availability, irrigation, crop stage, environmental parameters
- Targets: yield (kg/plant), soil suitability (High/Medium/Low)

### Step 3: Train ML Models

Train the regression and classification models:
```bash
python pepper_yield_predictor.py
```

This will:
- Load the training data
- Train RandomForest models for yield prediction and soil suitability
- Evaluate model performance
- Save trained models to `backend/python/models/`

**Expected Performance:**
- Yield Model R²: ~0.85-0.95
- Suitability Model Accuracy: ~85-95%

### Step 4: Start Flask ML API

Start the Python ML service:
```bash
python pepper_ml_api.py
```

The API will run on `http://localhost:5001`

**Available Endpoints:**
- `GET /health` - Health check
- `POST /predict` - Single prediction
- `POST /batch-predict` - Multiple predictions
- `GET /model-info` - Model information

### Step 5: Configure Node.js Backend

Add the ML routes to your Express server.

Edit `backend/src/server.js` and add:
```javascript
// Add at the top with other route imports
const pepperMLRoutes = require('./routes/pepperML');

// Add with other route registrations
app.use('/api/pepper-ml', pepperMLRoutes);
```

### Step 6: Install Node.js Dependencies

Make sure axios is installed (for HTTP requests to Python API):
```bash
cd backend
npm install axios
```

### Step 7: Set Environment Variables

Add to your `.env` file:
```
ML_API_URL=http://localhost:5001
ML_API_PORT=5001
```

### Step 8: Test the Integration

Test the ML API directly:
```bash
curl http://localhost:5001/health
```

Test via Node.js API:
```bash
curl -X POST http://localhost:3000/api/pepper-ml/predict \
  -H "Content-Type: application/json" \
  -d '{
    "soil_type": "Loamy",
    "water_availability": "High",
    "irrigation_frequency": 4,
    "crop_stage": "Fruiting"
  }'
```

## API Usage Examples

### 1. Single Prediction

**Request:**
```javascript
POST /api/pepper-ml/predict
Content-Type: application/json

{
  "soil_type": "Loamy",
  "water_availability": "Medium",
  "irrigation_frequency": 4,
  "crop_stage": "Flowering"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Prediction generated successfully",
  "data": {
    "predicted_yield_kg": 1.45,
    "soil_suitability": "High",
    "suitability_confidence": 87.3,
    "irrigation_recommendation": "Maintain consistent watering. 3-4 times per week is optimal.",
    "fertilizer_recommendation": "NPK 13:40:13 @ 5g/plant weekly. Increase phosphorus for flowering.",
    "additional_tips": [
      "Loamy soil is ideal for pepper cultivation",
      "Excellent conditions for pepper cultivation!"
    ]
  }
}
```

### 2. Batch Prediction

**Request:**
```javascript
POST /api/pepper-ml/batch-predict
Content-Type: application/json

{
  "inputs": [
    {
      "soil_type": "Sandy",
      "water_availability": "Low",
      "irrigation_frequency": 6,
      "crop_stage": "Vegetative"
    },
    {
      "soil_type": "Loamy",
      "water_availability": "High",
      "irrigation_frequency": 4,
      "crop_stage": "Fruiting"
    }
  ]
}
```

### 3. Get Recommendations (Query Parameters)

**Request:**
```
GET /api/pepper-ml/recommendations?soilType=Loamy&waterAvailability=High&cropStage=Fruiting&irrigationFrequency=4
```

### 4. Compare Scenarios

**Request:**
```javascript
POST /api/pepper-ml/compare-scenarios
Content-Type: application/json

{
  "baseParams": {
    "soil_type": "Loamy",
    "water_availability": "Medium",
    "crop_stage": "Vegetative"
  },
  "variations": [
    {
      "name": "Increased Irrigation",
      "irrigation_frequency": 5
    },
    {
      "name": "High Water Access",
      "water_availability": "High"
    }
  ]
}
```

## Input Parameters

### soil_type
- **Sandy**: Well-draining, requires frequent irrigation
- **Loamy**: Ideal for pepper, balanced drainage and retention
- **Clay**: High water retention, ensure good drainage

### water_availability
- **Low**: Limited water access
- **Medium**: Moderate water access
- **High**: Abundant water

### irrigation_frequency
- Range: 1-7 (times per week)
- Optimal: 3-5 times per week

### crop_stage
- **Seedling**: 0-2 months, young plants
- **Vegetative**: 2-6 months, active growth
- **Flowering**: 6-8 months, flower formation
- **Fruiting**: 8+ months, fruit development

## Production Deployment

### Running ML API as a Service

**Windows (using PM2 or similar):**
```bash
npm install -g pm2
pm2 start backend/python/pepper_ml_api.py --name pepper-ml --interpreter python
```

**Linux (using systemd):**
Create `/etc/systemd/system/pepper-ml.service`:
```ini
[Unit]
Description=Pepper ML API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/PEPPER/backend/python
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/python pepper_ml_api.py
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Start the service:
```bash
sudo systemctl start pepper-ml
sudo systemctl enable pepper-ml
```

### Docker Deployment

Create `backend/python/Dockerfile`:
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5001

CMD ["python", "pepper_ml_api.py"]
```

Build and run:
```bash
docker build -t pepper-ml-api ./backend/python
docker run -p 5001:5001 pepper-ml-api
```

## Troubleshooting

### Issue: Models not loading
**Solution:** Ensure you've run the training script first:
```bash
python generate_pepper_training_data.py
python pepper_yield_predictor.py
```

### Issue: Flask API not accessible from Node.js
**Solution:** Check if the API is running and firewall allows port 5001:
```bash
curl http://localhost:5001/health
```

### Issue: Poor prediction accuracy
**Solution:** 
1. Generate more training data
2. Adjust model parameters in `pepper_yield_predictor.py`
3. Add more environmental features

### Issue: Connection timeout
**Solution:** Increase timeout in `pepperMLService.js`:
```javascript
this.timeout = 30000; // 30 seconds
```

## Model Retraining

To retrain with new data:

1. Add new samples to the training data CSV
2. Run training script:
```bash
python pepper_yield_predictor.py
```
3. Restart Flask API

## Frontend Integration Example

```javascript
// Example React component
import { useState } from 'react';
import axios from 'axios';

function PepperYieldCalculator() {
  const [prediction, setPrediction] = useState(null);

  const getPrediction = async () => {
    const response = await axios.post('/api/pepper-ml/predict', {
      soil_type: 'Loamy',
      water_availability: 'High',
      irrigation_frequency: 4,
      crop_stage: 'Fruiting'
    });
    
    setPrediction(response.data.data);
  };

  return (
    <div>
      <button onClick={getPrediction}>Get Yield Prediction</button>
      {prediction && (
        <div>
          <h3>Predicted Yield: {prediction.predicted_yield_kg} kg/plant</h3>
          <p>Soil Suitability: {prediction.soil_suitability}</p>
          <p>{prediction.irrigation_recommendation}</p>
          <p>{prediction.fertilizer_recommendation}</p>
        </div>
      )}
    </div>
  );
}
```

## Support

For issues or questions:
1. Check the logs: Flask API prints detailed error messages
2. Verify all dependencies are installed
3. Ensure Python environment is activated
4. Check that port 5001 is not in use

## Next Steps

1. ✅ Set up the ML module using this guide
2. Create a frontend UI for farmers to input their data
3. Add user authentication to protect endpoints
4. Implement data logging for continuous improvement
5. Add more sophisticated features (weather API integration, soil testing results, etc.)
6. Deploy to production with proper monitoring

## Files Created

```
backend/python/
├── pepper_yield_predictor.py          # ML training and prediction logic
├── generate_pepper_training_data.py   # Training data generator
├── pepper_ml_api.py                   # Flask REST API
├── requirements.txt                   # Python dependencies
├── data/                              # Generated after step 2
│   └── pepper_training_data.csv
└── models/                            # Generated after step 3
    ├── yield_model.pkl
    ├── suitability_model.pkl
    ├── scaler.pkl
    ├── label_encoders.pkl
    └── feature_columns.pkl

backend/src/
├── services/
│   └── pepperMLService.js             # Node.js ML service integration
└── routes/
    └── pepperML.js                    # Express API routes
```
