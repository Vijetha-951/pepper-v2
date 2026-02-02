# Pepper ML Module

Machine Learning modules for the PEPPER e-commerce platform, including yield prediction, seasonal suitability, and various AI-powered features.

## 🚀 Quick Start

### For Yield Prediction
```bash
# Install dependencies
pip install -r requirements.txt

# Setup and train (one command!)
python setup_ml_module.py

# Start Yield Prediction API
python pepper_ml_api.py
```

### For Seasonal Suitability (NEW)
```bash
# Install dependencies (if not already installed)
pip install -r requirements.txt

# Generate training data
python seasonal_suitability_dataset.py

# Train model
python seasonal_suitability_model.py

# Start Seasonal Suitability API
python seasonal_suitability_api.py --port 5001
```

## 📁 Files

### Yield Prediction
- **`pepper_yield_predictor.py`** - Core ML model (training & prediction)
- **`generate_pepper_training_data.py`** - Synthetic data generator
- **`pepper_ml_api.py`** - Flask REST API
- **`setup_ml_module.py`** - Automated setup script
- **`test_ml_module.py`** - Verification tests

### Seasonal Suitability (NEW)
- **`seasonal_suitability_dataset.py`** - Training data generator (28,000+ samples)
- **`seasonal_suitability_model.py`** - Random Forest ML trainer
- **`seasonal_suitability_api.py`** - Flask prediction API (port 5001)

### Other ML Modules
- **`demand_prediction.py`** - Demand forecasting
- **`customer_segmentation.py`** - Customer clustering
- **`recommendation_engine.py`** - Product recommendations
- **`disease_detector.py`** - Disease detection
- **`review_sentiment_classifier.py`** - Sentiment analysis
- **`cancellation_svm_classifier.py`** - Cancellation prediction

### Shared
- **`requirements.txt`** - Python dependencies (all modules)

## 🔧 Manual Setup

If you prefer to run steps individually:

### 1. Generate Training Data
```bash
python generate_pepper_training_data.py
```
Creates: `data/pepper_training_data.csv` (2000 samples)

### 2. Train Models
```bash
python pepper_yield_predictor.py
```
Creates: `models/*.pkl` (5 model files)

### 3. Test
```bash
python test_ml_module.py
```

### 4. Start API
```bash
python pepper_ml_api.py
```
Runs on: http://localhost:5001

## 📊 Model Details

### Inputs
- **soil_type**: Sandy | Loamy | Clay
- **water_availability**: Low | Medium | High
- **irrigation_frequency**: 1-7 (times per week)
- **crop_stage**: Seedling | Vegetative | Flowering | Fruiting

### Outputs
- **predicted_yield_kg**: Expected yield (0.2-2.5 kg/plant)
- **soil_suitability**: High | Medium | Low
- **suitability_confidence**: 0-100%
- **irrigation_recommendation**: Text guidance
- **fertilizer_recommendation**: NPK recommendations
- **additional_tips**: Cultivation advice

### Performance
- **Yield Model R²**: ~0.85-0.95
- **Suitability Accuracy**: ~85-95%
- **Training Samples**: 2000
- **Features**: 12 (derived from inputs)

## 🔌 API Endpoints

### Health Check
```
GET /health
```

### Single Prediction
```
POST /predict
Body: {
  "soil_type": "Loamy",
  "water_availability": "High",
  "irrigation_frequency": 4,
  "crop_stage": "Fruiting"
}
```

### Batch Prediction
```
POST /batch-predict
Body: {
  "inputs": [...]
}
```

### Model Info
```
GET /model-info
```

## 🧪 Testing

Test the API:
```bash
# Health check
curl http://localhost:5001/health

# Prediction
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{"soil_type":"Loamy","water_availability":"High","irrigation_frequency":4,"crop_stage":"Fruiting"}'
```

## 📚 Documentation

See project root for comprehensive guides:
- `PEPPER_ML_SETUP_GUIDE.md` - Full setup instructions
- `PEPPER_ML_QUICK_REFERENCE.md` - Quick reference
- `PEPPER_ML_IMPLEMENTATION_CHECKLIST.md` - Step-by-step checklist

## 🐛 Troubleshooting

**Models not loaded?**
```bash
python generate_pepper_training_data.py
python pepper_yield_predictor.py
```

**Import errors?**
```bash
pip install -r requirements.txt
```

**Port 5001 in use?**
Change `ML_API_PORT` environment variable

## 🔄 Retraining

To retrain with new data:
1. Add samples to `data/pepper_training_data.csv`
2. Run: `python pepper_yield_predictor.py`
3. Restart API

## 📦 Dependencies

- scikit-learn 1.3.2
- pandas 2.0.3
- numpy 1.24.3
- Flask 3.0.0
- Flask-CORS 4.0.0

## 🚀 Production

Deploy with PM2:
```bash
pm2 start pepper_ml_api.py --name pepper-ml --interpreter python3
```

Or Docker:
```bash
docker build -t pepper-ml .
docker run -p 5001:5001 pepper-ml
```

## 📊 Training Data Structure

```csv
soil_type,water_availability,irrigation_frequency,crop_stage,temperature,rainfall,humidity,ph_level,nitrogen_level,phosphorus_level,potassium_level,yield_kg_per_plant,soil_suitability
Loamy,High,4,Fruiting,28.5,2100.0,75.0,6.3,55.0,35.0,45.0,1.85,High
Sandy,Low,6,Vegetative,32.0,1600.0,65.0,5.9,40.0,25.0,35.0,0.65,Low
...
```

## 🎯 Feature Engineering

Derived features:
- `irrigation_efficiency` = frequency × water_availability
- `soil_water_interaction` = soil_type × water_availability

Environmental enrichment:
- Temperature (20-35°C)
- Rainfall (1500-3000mm/year)
- Humidity (60-90%)
- Soil pH (5.5-7.5)
- NPK levels (30-80ppm)

## 📈 Model Architecture

**Regression Model (Yield)**
- Algorithm: Random Forest Regressor
- Trees: 200
- Max Depth: 15
- Features: 12

**Classification Model (Suitability)**
- Algorithm: Random Forest Classifier
- Trees: 200
- Max Depth: 15
- Classes: 3 (High, Medium, Low)

## 🔐 Security Notes

For production:
- Add authentication to endpoints
- Use HTTPS
- Rate limit API calls
- Validate all inputs
- Log predictions

## 📞 Integration

Node.js backend already configured!

### Yield Prediction
- Service: `backend/src/services/pepperMLService.js`
- Routes: `backend/src/routes/pepperML.js`

### Seasonal Suitability
- Service: `backend/src/services/seasonalSuitability.service.js`
- Routes: `backend/src/routes/seasonalSuitability.routes.js`
- Model: `backend/src/models/SeasonalSuitabilityAnalytics.js`

## 📚 Documentation

### Seasonal Suitability System
- **Quick Start**: `../../SEASONAL_SUITABILITY_QUICK_REFERENCE.md`
- **Full Guide**: `../../SEASONAL_SUITABILITY_GUIDE.md`
- **Implementation**: `../../SEASONAL_SUITABILITY_IMPLEMENTATION.md`
- **Checklist**: `../../SEASONAL_SUITABILITY_CHECKLIST.md`

## 📝 License

Part of PEPPER project

## 🤝 Contributing

To improve the models:

### Yield Prediction
1. Collect real-world yield data
2. Add to training dataset
3. Retrain and compare performance
4. Submit improved model

### Seasonal Suitability
1. Collect actual planting outcomes
2. Update training data with real results
3. Retrain model with new samples
4. Compare accuracy metrics
5. Deploy improved model
