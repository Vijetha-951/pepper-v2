# 🚀 CNN Disease Detection - Colab Quick Start

## Overview

This guide helps you train a CNN-based disease detection model in Google Colab and integrate it with your Flask API.

**Upgrade:** Random Forest → CNN (MobileNetV2)
- **Better accuracy:** 90-95%+ (vs 70-80%)
- **Automatic feature learning** (no manual feature engineering)
- **Transfer learning** (pre-trained on ImageNet)

---

## 📋 Quick Steps

### 1️⃣ Open the Notebook in Colab

**Method A: Upload to Colab**
1. Go to [colab.research.google.com](https://colab.research.google.com)
2. Click `File` → `Upload notebook`
3. Upload `pepper_disease_detection_cnn.ipynb`

**Method B: Open from GitHub** (if you push to GitHub)
1. Push the notebook to your GitHub repo
2. Go to Colab
3. Click `File` → `Open notebook` → `GitHub` tab
4. Enter your repo URL

---

### 2️⃣ Prepare Your Dataset

Your dataset should be organized like this:

```
dataset/
├── Healthy/
│   ├── img1.jpg
│   ├── img2.jpg
│   └── ...
├── Bacterial_Spot/
│   ├── img1.jpg
│   └── ...
├── Yellow_Leaf_Curl/
│   ├── img1.jpg
│   └── ...
└── Nutrient_Deficiency/
    ├── img1.jpg
    └── ...
```

**Option 1: Use Google Drive**
1. Upload your dataset folder to Google Drive
2. In Colab, mount Drive and set the path

**Option 2: Upload ZIP**
1. Zip your dataset folder
2. Run the upload cell in Colab

---

### 3️⃣ Enable GPU in Colab

**IMPORTANT:** Enable GPU for faster training!

1. Click `Runtime` → `Change runtime type`
2. Select `T4 GPU` (free tier)
3. Click `Save`

---

### 4️⃣ Run All Cells

1. Click `Runtime` → `Run all`
2. Or press `Ctrl+F9`
3. Wait for training to complete (~10-20 minutes)

**The notebook will:**
- ✅ Install dependencies
- ✅ Load and visualize data
- ✅ Build CNN model
- ✅ Train with data augmentation
- ✅ Evaluate performance
- ✅ Test on sample images
- ✅ Save model files

---

### 5️⃣ Download Model Files

At the end, the notebook will download:

1. **pepper_disease_model.h5** - Main model file
2. **class_indices.json** - Class mappings
3. **pepper_predictor.py** - Python predictor class

These files are also saved to your Google Drive!

---

### 6️⃣ Integrate with Flask API

#### Step A: Copy Files
```bash
# Copy downloaded files to your project
cp pepper_disease_model.h5 backend/python/models/
cp class_indices.json backend/python/models/
```

#### Step B: Update Flask API

Create `backend/python/cnn_disease_detector.py`:

```python
import tensorflow as tf
import numpy as np
import cv2
import json

class CNNDiseaseDetector:
    def __init__(self, model_path='backend/python/models/pepper_disease_model.h5'):
        self.model = tf.keras.models.load_model(model_path)
        
        # Load class indices
        with open('backend/python/models/class_indices.json', 'r') as f:
            class_indices = json.load(f)
        
        self.classes = {v: k for k, v in class_indices.items()}
        self.img_size = 224
        
        # Disease info (same as before)
        self.disease_info = {
            'Healthy': {
                'name': 'Healthy Plant',
                'severity': 'None',
                'description': 'Your pepper plant appears healthy.',
                'treatment': [...],
                'prevention': [...]
            },
            # ... rest of disease info
        }
    
    def predict(self, image_path):
        """Predict disease from image"""
        # Preprocess
        img = cv2.imread(image_path)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (self.img_size, self.img_size))
        img_array = img / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        
        # Predict
        predictions = self.model.predict(img_array, verbose=0)
        predicted_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_idx])
        
        disease = self.classes[predicted_idx]
        
        # Get probabilities for all classes
        probabilities = {}
        for idx, prob in enumerate(predictions[0]):
            class_name = self.classes[idx]
            probabilities[class_name] = float(prob)
        
        return {
            'disease': disease,
            'confidence': confidence,
            'probabilities': probabilities,
            'info': self.disease_info.get(disease, {})
        }
```

#### Step C: Update API Endpoint

In `backend/python/disease_detection_api.py`:

```python
from cnn_disease_detector import CNNDiseaseDetector

# Initialize
detector = CNNDiseaseDetector('models/pepper_disease_model.h5')

@app.route('/detect', methods=['POST'])
def detect_disease():
    # ... file upload handling ...
    
    # Use CNN model
    result = detector.predict(filepath)
    
    return jsonify(result)
```

---

## 📊 Expected Results

### Training Metrics
- **Training Accuracy:** 95-98%
- **Validation Accuracy:** 90-95%
- **Training Time:** 10-20 minutes (with GPU)

### Model Size
- **H5 format:** ~15 MB
- **TFLite format:** ~5 MB (for mobile)

### Inference Speed
- **CPU:** ~100-200ms per image
- **GPU:** ~20-50ms per image

---

## 🔧 Troubleshooting

### Issue: Out of Memory
**Solution:** Reduce batch size
```python
BATCH_SIZE = 16  # Instead of 32
```

### Issue: Low Accuracy
**Solutions:**
1. Get more training data (aim for 500+ images per class)
2. Increase epochs
3. Use a larger model (ResNet50 instead of MobileNetV2)

### Issue: Model won't load in Flask
**Solution:** Check TensorFlow version
```bash
pip install tensorflow==2.13.0  # Match Colab version
```

---

## 🚀 Advanced: Fine-Tuning

For even better accuracy, unfreeze the base model:

```python
# After initial training, unfreeze last layers
base_model.trainable = True

# Freeze early layers
for layer in base_model.layers[:-20]:
    layer.trainable = False

# Recompile with lower learning rate
model.compile(
    optimizer=keras.optimizers.Adam(1e-5),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Train again
history_fine = model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=10
)
```

---

## 📈 Model Comparison

| Feature | Random Forest | CNN (MobileNetV2) |
|---------|--------------|-------------------|
| Accuracy | 70-80% | 90-95% |
| Training Time | 1-2 minutes | 10-20 minutes |
| Model Size | <1 MB | ~15 MB |
| Inference Speed | 50-100ms | 100-200ms (CPU) |
| Feature Engineering | Manual (12 features) | Automatic |
| Robustness | Lower | Higher |
| Deployment | Easier | Needs TensorFlow |

---

## 💡 Tips

1. **More Data = Better Model**
   - Aim for 500+ images per class
   - Use data augmentation (already in notebook)

2. **Balance Classes**
   - Similar number of images per class
   - Use `class_weight='balanced'` if imbalanced

3. **Test with Real Images**
   - Take photos with your phone
   - Various lighting conditions
   - Different angles

4. **Monitor Training**
   - Watch for overfitting (train acc >> val acc)
   - Early stopping will handle this

5. **Save Checkpoints**
   - Model automatically saves best version
   - Check Google Drive for backups

---

## 🎯 Next Steps

1. ✅ Train model in Colab
2. ✅ Download model files
3. ✅ Integrate with Flask API
4. ✅ Test with new images
5. 🔄 Collect more data and retrain
6. 🚀 Deploy to production

---

## 📚 Resources

- **TensorFlow Docs:** https://www.tensorflow.org/
- **MobileNet Paper:** https://arxiv.org/abs/1801.04381
- **Transfer Learning Guide:** https://www.tensorflow.org/tutorials/images/transfer_learning

---

**Questions?**
- Check the notebook comments
- TensorFlow errors → Google the error message
- Model issues → Try fine-tuning or more data

**Good luck! 🌶️🚀**
