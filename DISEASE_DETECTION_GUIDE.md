# 🌿 Pepper Leaves Disease Detection Module

## Overview

A comprehensive AI-powered disease detection system for pepper plants that uses computer vision and machine learning to identify diseases from leaf images. The system provides detailed treatment recommendations and prevention tips.

## 🎯 Features

- **4 Disease Classifications**:
  - Healthy Plant
  - Bacterial Spot
  - Yellow Leaf Curl Virus
  - Nutrient Deficiency

- **Advanced Detection**:
  - Image-based disease identification
  - Confidence scoring
  - Multiple probability predictions
  - Real-time analysis

- **Comprehensive Information**:
  - Disease descriptions
  - Treatment recommendations
  - Prevention tips
  - Severity levels

- **User Management**:
  - Detection history tracking
  - Follow-up reminders
  - User feedback system
  - Analytics and trends

## 📁 Project Structure

```
PEPPER/
├── backend/
│   ├── python/
│   │   ├── disease_detector.py           # Core ML model
│   │   ├── disease_detection_api.py      # Flask REST API
│   │   ├── setup_disease_detection.py    # Setup wizard
│   │   ├── models/                       # Trained models
│   │   └── requirements.txt              # Python dependencies
│   │
│   ├── src/
│   │   ├── models/
│   │   │   └── DiseaseDetection.js       # MongoDB model
│   │   ├── services/
│   │   │   └── diseaseDetectionService.js # Node.js service
│   │   ├── routes/
│   │   │   └── diseaseDetection.routes.js # Express routes
│   │   └── server.js                      # Main server
│   │
│   └── uploads/
│       └── disease_images/                # Uploaded images
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── DiseaseDetection.jsx       # Main UI component
│       │   └── DiseaseDetection.css       # Styles
│       └── services/
│           └── diseaseDetectionService.js # API client
│
└── start-disease-detection.bat            # Quick start script
```

## 🚀 Installation & Setup

### Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- MongoDB
- Git (optional)

### Step 1: Install Python Dependencies

```bash
cd backend/python
pip install -r requirements.txt
```

Or run the setup wizard:

```bash
python setup_disease_detection.py
```

### Step 2: Install Node.js Dependencies (if needed)

```bash
cd backend
npm install multer  # If not already installed
```

### Step 3: Train the Model

Run the setup wizard and choose to train the model:

```bash
python setup_disease_detection.py
```

Or train manually:

```bash
cd backend/python
python disease_detector.py train
```

### Step 4: Start the Services

**Option A: Using Batch File (Windows)**

```bash
start-disease-detection.bat
```

**Option B: Manual Start**

1. Start Disease Detection API:
```bash
cd backend/python
python disease_detection_api.py
```

2. Start Node.js Backend:
```bash
cd backend
npm run dev
```

3. Start Frontend:
```bash
cd frontend
npm start
```

## 🔌 API Endpoints

### Flask API (Port 5002)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/diseases` | GET | List all detectable diseases |
| `/model-info` | GET | Model information |
| `/predict` | POST | Predict disease from image |
| `/predict-url` | POST | Predict from image URL |
| `/batch-predict` | POST | Predict multiple images |
| `/train` | POST | Train the model |

### Node.js API (Port 5000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/disease-detection/health` | GET | Service health check |
| `/api/disease-detection/model-info` | GET | Model information |
| `/api/disease-detection/diseases` | GET | Disease information |
| `/api/disease-detection/predict` | POST | Predict disease |
| `/api/disease-detection/history` | GET | User detection history |
| `/api/disease-detection/all` | GET | All detections (Admin) |
| `/api/disease-detection/analytics` | GET | Analytics data |
| `/api/disease-detection/trends` | GET | Disease trends |
| `/api/disease-detection/:id/status` | PATCH | Update status |
| `/api/disease-detection/:id/feedback` | POST | Add feedback |

## 📱 Usage

### Web Interface

1. Navigate to the Disease Detection page in your application
2. Upload or drag-and-drop a pepper leaf image
3. Optionally add metadata (plant age, variety, notes)
4. Click "Analyze Image"
5. View results with treatment recommendations

### API Usage

**Python (Direct ML API)**

```python
import requests

# Upload image for prediction
url = 'http://localhost:5002/predict'
files = {'image': open('leaf_image.jpg', 'rb')}
response = requests.post(url, files=files)
result = response.json()

print(f"Disease: {result['prediction']}")
print(f"Confidence: {result['confidence']}%")
```

**JavaScript (Node.js API)**

```javascript
const formData = new FormData();
formData.append('image', imageFile);

const response = await fetch('http://localhost:5000/api/disease-detection/predict', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log('Disease:', result.prediction.prediction);
console.log('Confidence:', result.prediction.confidence);
```

## 🧪 Testing

### Test the Flask API

```bash
# Health check
curl http://localhost:5002/health

# Get diseases info
curl http://localhost:5002/diseases

# Predict disease
curl -X POST http://localhost:5002/predict \
  -F "image=@path/to/leaf_image.jpg"
```

### Test with Node.js

```bash
# Health check
curl http://localhost:5000/api/disease-detection/health

# Get model info
curl http://localhost:5000/api/disease-detection/model-info
```

## 🎨 Frontend Integration

Add the Disease Detection page to your React Router:

```jsx
import DiseaseDetection from './pages/DiseaseDetection';

// In your routes
<Route path="/disease-detection" element={<DiseaseDetection />} />
```

Add a navigation link:

```jsx
<Link to="/disease-detection">Disease Detection</Link>
```

## 📊 Model Details

### Technology Stack

- **ML Framework**: scikit-learn
- **Algorithm**: Random Forest Classifier
- **Features**: 12 engineered features from color and texture analysis
- **Image Processing**: OpenCV

### Features Extracted

1. Mean HSV values (Hue, Saturation, Value)
2. Standard deviation of HSV
3. Color distribution (green, yellow, brown percentages)
4. Texture features (edge density, smoothness, uniformity)

### Training Data

- Synthetic dataset generated based on agricultural best practices
- 1000 samples (250 per class)
- Balanced classes for better accuracy

## 🔐 Security Considerations

1. **File Upload Validation**:
   - Only image files allowed
   - Maximum file size: 10MB
   - File type checking

2. **Authentication**:
   - Add authentication middleware to protect routes
   - User-specific detection history

3. **Rate Limiting**:
   - Consider adding rate limiting for prediction endpoints

## 🐛 Troubleshooting

### Common Issues

**1. Module Import Errors**

```bash
# Solution: Install missing dependencies
pip install -r backend/python/requirements.txt
```

**2. Model Not Trained**

```bash
# Solution: Train the model
python backend/python/disease_detector.py train
```

**3. Port Already in Use**

```bash
# Solution: Change port in .env or kill existing process
kill -9 $(lsof -t -i:5002)  # Linux/Mac
# Windows: Use Task Manager or change port
```

**4. OpenCV Installation Issues**

```bash
# Solution: Install OpenCV separately
pip install opencv-python==4.8.1.78 --upgrade
```

**5. Image Upload Not Working**

- Check CORS settings in Flask API
- Verify upload directory exists and is writable
- Check file size limits

## 📈 Future Enhancements

- [ ] Support for more disease types
- [ ] Real image dataset for better accuracy
- [ ] Deep learning model (CNN)
- [ ] Multi-language support
- [ ] Mobile app integration
- [ ] Offline mode
- [ ] Expert consultation integration
- [ ] Disease progression tracking

## 🤝 Contributing

1. Test the disease detection on various pepper leaf images
2. Report accuracy issues
3. Suggest new disease types to detect
4. Improve UI/UX

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section
2. Review error logs in terminal
3. Verify all dependencies are installed
4. Ensure MongoDB is running

## 📄 License

This disease detection module is part of the PEPPER project.

## 🎓 Credits

Developed using agricultural best practices and machine learning techniques for pepper plant disease identification.

---

**Last Updated**: February 2026

**Version**: 1.0.0
