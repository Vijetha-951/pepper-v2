# 🌶️ Dual Model Disease Detection - Quick Guide

## Overview

The disease detection API now supports **both Bell Pepper and Black Pepper** disease detection models in a single API. You can switch between models by specifying the `pepper_type` parameter in your requests.

## Available Models

### 1. Bell Pepper (Capsicum)
- **Type**: `bell_pepper`
- **Classes**:
  - Bacterial_spot
  - healthy

### 2. Black Pepper (Piper nigrum)
- **Type**: `black_pepper` (default)
- **Classes**:
  - Footrot
  - Healthy
  - Pollu_Disease
  - Slow-Decline

## API Endpoints

### Check Available Models
```bash
GET http://localhost:5001/models
```

Response:
```json
{
  "success": true,
  "current_model": "black_pepper",
  "models": [
    {
      "type": "bell_pepper",
      "name": "Bell Pepper (Capsicum)",
      "classes": ["Bacterial_spot", "healthy"]
    },
    {
      "type": "black_pepper",
      "name": "Black Pepper (Piper nigrum)",
      "classes": ["Footrot", "Healthy", "Pollu_Disease", "Slow-Decline"]
    }
  ]
}
```

### Predict from Image File

```bash
POST http://localhost:5001/predict
Content-Type: multipart/form-data
```

**Parameters:**
- `image` or `file`: Image file (required)
- `pepper_type`: `bell_pepper` or `black_pepper` (optional, defaults to `black_pepper`)

**Example using cURL:**
```bash
# Bell Pepper detection
curl -X POST http://localhost:5001/predict \
  -F "image=@bell_pepper_leaf.jpg" \
  -F "pepper_type=bell_pepper"

# Black Pepper detection (default)
curl -X POST http://localhost:5001/predict \
  -F "image=@black_pepper_leaf.jpg" \
  -F "pepper_type=black_pepper"

# Without specifying (uses black pepper by default)
curl -X POST http://localhost:5001/predict \
  -F "image=@pepper_leaf.jpg"
```

### Predict from Image URL

```bash
POST http://localhost:5001/predict-url
Content-Type: application/json
```

**Body:**
```json
{
  "image_url": "https://example.com/pepper-leaf.jpg",
  "pepper_type": "bell_pepper"
}
```

**Example using cURL:**
```bash
# Bell Pepper detection
curl -X POST http://localhost:5001/predict-url \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/bell-pepper-leaf.jpg",
    "pepper_type": "bell_pepper"
  }'

# Black Pepper detection
curl -X POST http://localhost:5001/predict-url \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/black-pepper-leaf.jpg",
    "pepper_type": "black_pepper"
  }'
```

## Response Format

### Success Response

```json
{
  "success": true,
  "prediction": {
    "disease_info": {
      "name": "Healthy",
      "scientific_name": "Healthy",
      "description": "The plant appears healthy...",
      "severity": "None",
      "treatment": [...],
      "prevention": [...]
    },
    "confidence": 95.5,
    "all_predictions": [
      {
        "disease": "Healthy",
        "probability": 95.5
      },
      {
        "disease": "Footrot",
        "probability": 3.2
      }
    ],
    "metadata": {
      "model_type": "black_pepper",
      "model_name": "Black Pepper (Piper nigrum)",
      "filename": "...",
      "timestamp": "..."
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Not a Bell Pepper Leaf",
  "message": "This model is trained for Bell Pepper leaves...",
  "suggestion": "Please upload a clear photo of a Bell Pepper leaf, or select the correct pepper type.",
  "model_confidence": 45.2,
  "model_type": "bell_pepper"
}
```

## Usage with PowerShell

### Test Script
```powershell
# Run the test script
python test_dual_model_api.py
```

### Manual Testing

```powershell
# 1. Start the API
cd C:\xampp\htdocs\PEPPER\backend\python
python disease_detection_api.py

# 2. In another terminal, test with bell pepper
Invoke-RestMethod -Uri "http://localhost:5001/predict-url" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"image_url":"https://example.com/bell-pepper.jpg","pepper_type":"bell_pepper"}'

# 3. Test with black pepper
Invoke-RestMethod -Uri "http://localhost:5001/predict-url" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"image_url":"https://example.com/black-pepper.jpg","pepper_type":"black_pepper"}'

# 4. Check available models
Invoke-RestMethod -Uri "http://localhost:5001/models" -Method GET
```

## Integration with Frontend

### JavaScript Example

```javascript
// Upload with specific pepper type
async function detectDisease(file, pepperType = 'black_pepper') {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('pepper_type', pepperType);
  
  const response = await fetch('http://localhost:5001/predict', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  return result;
}

// Get available models
async function getModels() {
  const response = await fetch('http://localhost:5001/models');
  const data = await response.json();
  return data.models;
}

// Example usage
const models = await getModels();
console.log('Available models:', models);

// Detect disease with specific model
const file = document.getElementById('imageInput').files[0];
const result = await detectDisease(file, 'bell_pepper');
console.log('Detection result:', result);
```

## Important Notes

1. **Default Model**: If `pepper_type` is not specified, the API defaults to `black_pepper`

2. **Model Validation**: Each model is trained on specific pepper types:
   - Bell pepper model only recognizes bell pepper leaves
   - Black pepper model only recognizes black pepper leaves
   - Using the wrong model may result in low confidence predictions

3. **Automatic Switching**: The API automatically loads the correct model based on the `pepper_type` parameter

4. **Model Selection**: Always specify the correct `pepper_type` based on the plant you're analyzing:
   - Use `'bell_pepper'` for Capsicum (sweet peppers, bell peppers)
   - Use `'black_pepper'` for Piper nigrum (black pepper spice plant)

## Testing

Run the comprehensive test suite:

```bash
python test_dual_model_api.py
```

This will test:
- Health check
- Model listing
- Model information
- Predictions with both models
- Error handling

## Troubleshooting

### Issue: "Model not loaded"
- **Solution**: Make sure both model files exist:
  - `backend/python/models/pepper_disease_model_v3.keras` (Bell Pepper)
  - `backend/python/models/black_pepper_disease_model.keras` (Black Pepper)

### Issue: Low confidence predictions
- **Solution**: Verify you're using the correct pepper_type:
  - Bell pepper images → use `pepper_type=bell_pepper`
  - Black pepper images → use `pepper_type=black_pepper`

### Issue: Wrong disease detected
- **Solution**: Check that:
  1. The image is clear and well-lit
  2. The correct pepper_type is specified
  3. The image is actually of a pepper leaf (not another plant)

## API Health Check

Check if both models are loaded:

```bash
curl http://localhost:5001/health
```

Response shows available models:
```json
{
  "status": "healthy",
  "service": "Disease Detection API (Dual Model)",
  "models_loaded": 2,
  "available_models": ["bell_pepper", "black_pepper"],
  "current_model": "black_pepper"
}
```

## Performance Notes

- Both models are loaded at startup (takes 30-60 seconds)
- Model switching happens instantly (no reload needed)
- Each prediction uses only the selected model
- Memory efficient: models share TensorFlow backend

---

**Need Help?**
- Check API logs for detailed prediction information
- Use `/model-info` endpoint for current model details
- Review test results from `test_dual_model_api.py`
