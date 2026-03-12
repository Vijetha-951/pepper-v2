# ⚡ Quick Start: EfficientNet Integration

## 🚀 5-Minute Setup

### 1. Prepare Files
```powershell
cd c:\xampp\htdocs\PEPPER\backend\python

# Place your PyTorch model here:
# best_black_pepper_model.pth
```

### 2. Install & Convert
```powershell
# Install dependencies
pip install torch torchvision tensorflow

# Convert PyTorch → Keras
python convert_efficientnet_pytorch_to_keras.py
```

### 3. Test
```powershell
# Test the integration
python test_black_pepper_efficientnet.py

# Test with image
python test_black_pepper_efficientnet.py path\to\leaf_image.jpg
```

### 4. Run API
```powershell
# Start disease detection API
python disease_detection_api.py
```

### 5. Test Prediction
```powershell
# Test via curl
curl -X POST http://localhost:5001/predict `
  -F "image=@test_leaf.jpg" `
  -F "model_type=black_pepper"
```

---

## ✅ What You Get

**5 Disease Classes:**
- Footrot (Critical fungal disease)
- Healthy
- Not Pepper Leaf (validation)
- Pollu Disease (beetle infestation)
- Slow Decline (progressive syndrome)

**JSON Response:**
```json
{
  "disease": "Black Pepper Healthy",
  "confidence": 92.45,
  "description": "...",
  "treatment": [...],
  "prevention": [...]
}
```

**Preprocessing:**
- Auto resize to 224×224
- RGB conversion
- [0, 1] normalization

---

## ⚠️ Important

**Weight Transfer Note:**
- Conversion creates correct structure
- Initialized with ImageNet weights
- **Recommended:** Fine-tune 3-5 epochs for best results

---

## 📚 Files Created

1. `convert_efficientnet_pytorch_to_keras.py` - Converter
2. `models/black_pepper_class_indices.json` - Classes
3. `test_black_pepper_efficientnet.py` - Test suite
4. `EFFICIENTNET_INTEGRATION_GUIDE.md` - Full guide

---

## 🔧 Troubleshooting

**"Model file not found"**
→ Place `best_black_pepper_model.pth` in `backend/python/`

**"Cannot load state dict"**
→ Edit `EfficientNetB0Model` class to match your architecture

**Low accuracy**
→ Fine-tune the converted model with your dataset

---

## 📖 Full Documentation

See [EFFICIENTNET_INTEGRATION_GUIDE.md](EFFICIENTNET_INTEGRATION_GUIDE.md) for complete details.

---

**Ready to go! 🎉**
