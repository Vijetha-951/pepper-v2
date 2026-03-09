# 🎉 Dual Model Disease Detection - QUICK REFERENCE

## ✅ What's New

You can now use **BOTH** trained models in a single API:
- **Bell Pepper** (Capsicum) - 2 classes
- **Black Pepper** (Piper nigrum) - 4 classes  

## 🚀 Quick Start

### 1. Start the API (Port 5001)
```bash
cd C:\xampp\htdocs\PEPPER\backend\python
python disease_detection_api.py
```
Wait 30-60 seconds for both models to load.

### 2. Check Status
```bash
python -c "import requests; print(requests.get('http://localhost:5001/health').json())"
```

Should show:
```json
{
  "status": "healthy",
  "models_loaded": 2,
  "available_models": ["bell_pepper", "black_pepper"]
}
```

## 📤 How to Use

### Option A: Upload Image File

```bash
# Bell Pepper Detection
curl -X POST http://localhost:5001/predict \
  -F "image=@bell_pepper_leaf.jpg" \
  -F "pepper_type=bell_pepper"

# Black Pepper Detection
curl -X POST http://localhost:5001/predict \
  -F "image=@black_pepper_leaf.jpg" \
  -F "pepper_type=black_pepper"
```

### Option B: Image URL

```python
import requests

# Bell Pepper
response = requests.post('http://localhost:5001/predict-url', json={
    'image_url': 'https://example.com/bell-pepper.jpg',
    'pepper_type': 'bell_pepper'
})

# Black Pepper (or omit pepper_type, defaults to black_pepper)
response = requests.post('http://localhost:5001/predict-url', json={
    'image_url': 'https://example.com/black-pepper.jpg',
    'pepper_type': 'black_pepper'
})
```

## 🔑 Key Parameters

| Parameter | Values | Default | Required |
|-----------|--------|---------|----------|
| `pepper_type` | `bell_pepper` or `black_pepper` | `black_pepper` | No |
| `image` or `file` | Image file | - | Yes (for /predict) |
| `image_url` | Image URL | - | Yes (for /predict-url) |

## 📊 Response Format

```json
{
  "success": true,
  "prediction": {
    "disease_info": {
      "name": "Healthy",
      "confidence": 95.5,
      ...
    },
    "metadata": {
      "model_type": "black_pepper",
      "model_name": "Black Pepper (Piper nigrum)",
      ...
    }
  }
}
```

## 🎯 Disease Classes

### Bell Pepper Model
- Bacterial_spot
- healthy

### Black Pepper Model
- Footrot
- Healthy
- Pollu_Disease
- Slow-Decline

## 🧪 Testing

```bash
# Run full test suite
python test_dual_model_api.py

# Quick health check
python -c "import requests; print(requests.get('http://localhost:5001/models').json())"
```

## ⚠️ Important Notes

1. **Always specify the correct pepper_type**:
   - Use `bell_pepper` for Capsicum (sweet/bell peppers)
   - Use `black_pepper` for Piper nigrum (spice plant)

2. **Default behavior**: If you don't specify `pepper_type`, it defaults to `black_pepper`

3. **Model accuracy**: Each model only works accurately on its specific pepper type

4. **Both models run on the same port (5001)** - no need for multiple servers!

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Check API status |
| `/models` | GET | List available models |
| `/model-info` | GET | Current model details |
| `/predict` | POST | Predict from file upload |
| `/predict-url` | POST | Predict from image URL |

## 🔧 Troubleshooting

**Issue**: "Model not loaded"
- ✅ Check both model files exist in `backend/python/models/`

**Issue**: Low confidence prediction
- ✅ Verify you're using the correct `pepper_type`
- ✅ Ensure image is clear and of the right plant type

**Issue**: Port already in use
- ✅ Stop old processes: `Get-Process python | Stop-Process -Force`

## 📚 Full Documentation

- **Complete Guide**: [DUAL_MODEL_DISEASE_DETECTION_GUIDE.md](DUAL_MODEL_DISEASE_DETECTION_GUIDE.md)
- **Test Script**: [test_dual_model_api.py](test_dual_model_api.py)

## ✨ Summary

✅ Both models load automatically at startup  
✅ Switch between models using `pepper_type` parameter  
✅ No need to restart API to change models  
✅ Runs on port 5001 (same as before)  
✅ Backward compatible (defaults to black_pepper)  
