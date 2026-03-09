# 🌿 BLACK PEPPER DISEASE DETECTION - COMPLETE SETUP GUIDE

## Overview
This guide will help you train a CNN model to detect diseases in **Black Pepper (Piper nigrum)** leaves.

---

## Step 1: Understand Black Pepper Diseases

Common Black Pepper leaf diseases you should detect:

1. **Healthy** ✅
   - Vibrant green leaves
   - No spots or discoloration
   - Prominent venation

2. **Bacterial Wilt** (Ralstonia solanacearum)
   - Yellowing of leaves
   - Wilting starting from tips
   - Browning of veins

3. **Phytophthora Foot Rot**
   - Yellowing and drooping leaves
   - Black water-soaked lesions
   - Leaf fall

4. **Anthracnose** (Colletotrichum gloeosporioides)
   - Circular brown spots on leaves
   - Leaf blight
   - Premature leaf drop

5. **Yellow Leaf Disease**
   - Yellowing from base to tip
   - Chlorosis
   - Stunted growth

---

## Step 2: Collect Dataset Images

### Option A: Use Existing Datasets

**Search for datasets on:**

1. **Kaggle** (https://www.kaggle.com/datasets)
   - Search: "black pepper disease"
   - Search: "piper nigrum disease"
   - Search: "black pepper leaf"

2. **PlantVillage** (https://plantvillage.psu.edu/)
   - May have pepper disease images

3. **GitHub**
   ```bash
   Search: "black pepper disease dataset"
   ```

4. **Research Papers**
   - Search Google Scholar: "black pepper disease detection dataset"
   - Contact authors for datasets

### Option B: Create Your Own Dataset

**Take photos of Black Pepper leaves:**

1. **Equipment:**
   - Smartphone camera (12MP+)
   - Good natural lighting
   - White or green background

2. **Photo Guidelines:**
   - Take 200-500 photos per disease class
   - Different angles (top view, side view)
   - Different stages of disease
   - Different lighting conditions
   - Close-ups of disease symptoms

3. **Photo Quality:**
   - Resolution: Minimum 800x800 pixels
   - Format: JPG or PNG
   - Clear focus on leaf
   - Include the entire leaf when possible

### Option C: Data Augmentation

If you have limited images (100-200), the training script will automatically:
- Rotate images
- Flip horizontally/vertically
- Zoom in/out
- Adjust brightness
- This can multiply your dataset 5-10x

---

## Step 3: Organize Your Dataset

### Create Directory Structure:

```
C:\xampp\htdocs\PEPPER\backend\python\black_pepper_dataset\
├── train\
│   ├── healthy\
│   │   ├── image001.jpg
│   │   ├── image002.jpg
│   │   └── ... (min 100+ images)
│   ├── bacterial_wilt\
│   │   ├── image001.jpg
│   │   ├── image002.jpg
│   │   └── ... (min 100+ images)
│   ├── foot_rot\
│   │   ├── image001.jpg
│   │   └── ...
│   ├── anthracnose\
│   │   ├── image001.jpg
│   │   └── ...
│   └── yellow_leaf\
│       ├── image001.jpg
│       └── ...
├── validation\ (optional - will use 20% of train if not provided)
│   ├── healthy\
│   ├── bacterial_wilt\
│   ├── foot_rot\
│   ├── anthracnose\
│   └── yellow_leaf\
└── test\ (optional - for final evaluation)
    ├── healthy\
    ├── bacterial_wilt\
    ├── foot_rot\
    ├── anthracnose\
    └── yellow_leaf\
```

### Quick Setup Commands:

Open PowerShell in `C:\xampp\htdocs\PEPPER\backend\python\` and run:

```powershell
# Create the dataset structure
$baseDir = "black_pepper_dataset"
$sets = @("train", "validation", "test")
$classes = @("healthy", "bacterial_wilt", "foot_rot", "anthracnose", "yellow_leaf")

foreach ($set in $sets) {
    foreach ($class in $classes) {
        New-Item -ItemType Directory -Force -Path "$baseDir\$set\$class"
    }
}

Write-Host "✅ Dataset directories created!"
Write-Host "📁 Location: $(Resolve-Path $baseDir)"
Write-Host ""
Write-Host "📝 Next steps:"
Write-Host "1. Add images to each folder (min 100+ per class)"
Write-Host "2. Run: python train_black_pepper_cnn.py"
```

---

## Step 4: Download Sample Dataset (If Available)

### Check Kaggle for Black Pepper Datasets:

```powershell
# Install Kaggle CLI
pip install kaggle

# Configure Kaggle API (get key from kaggle.com/account)
# Place kaggle.json in C:\Users\YourUsername\.kaggle\

# Search for datasets
kaggle datasets list -s "black pepper"
kaggle datasets list -s "pepper disease"
kaggle datasets list -s "piper nigrum"

# Download (example - replace with actual dataset)
# kaggle datasets download -d username/black-pepper-disease
```

---

## Step 5: Train the Model

### Requirements Check:

```powershell
cd C:\xampp\htdocs\PEPPER\backend\python

# Ensure TensorFlow is installed
pip install tensorflow opencv-python pillow

# Check if it works
python -c "import tensorflow as tf; print('TensorFlow version:', tf.__version__)"
```

### Start Training:

```powershell
python train_black_pepper_cnn.py
```

**The script will:**
1. ✅ Verify your dataset structure
2. ✅ Count images in each class
3. ✅ Create CNN model (Transfer Learning with MobileNetV2)
4. ✅ Train for 30 epochs (with early stopping)
5. ✅ Save the best model
6. ✅ Save class indices

**Training time:**
- Small dataset (500 images): 10-20 minutes
- Medium dataset (2000 images): 30-60 minutes
- Large dataset (5000+ images): 1-3 hours

---

## Step 6: Use the Trained Model

### Update the Disease Detection API:

After training completes, update `cnn_disease_detector_v3.py`:

```python
# Update line 17:
model_path = os.path.join(os.path.dirname(__file__), 'models', 'black_pepper_disease_model.keras')

# Update line 49:
class_file = os.path.join(model_dir, 'black_pepper_class_indices.json')
```

### Restart the API:

```powershell
# Stop current API
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force

# Start with new model
cd C:\xampp\htdocs\PEPPER\backend\python
python disease_detection_api.py
```

---

## Step 7: Test Your Model

Upload Black Pepper leaf images through your web interface. The model should now correctly identify:
- ✅ Healthy Black Pepper leaves
- ✅ Bacterial Wilt
- ✅ Foot Rot
- ✅ Anthracnose
- ✅ Yellow Leaf Disease

---

## Troubleshooting

### Problem: "Not enough images"
**Solution:** You need minimum 100 images per class. Use data augmentation or collect more images.

### Problem: "Low accuracy (below 70%)"
**Solutions:**
- Collect more diverse images
- Ensure images are correctly labeled
- Train for more epochs
- Check if images are clear and well-lit

### Problem: "Model takes too long to train"
**Solutions:**
- Reduce number of images per class to 500
- Reduce epochs to 20
- Use smaller batch size (batch_size=16)

### Problem: "Out of memory error"
**Solutions:**
- Reduce batch size to 16 or 8
- Close other applications
- Use smaller images (reduce img_height/img_width to 128)

---

## Expected Results

### Good Model Performance:
- Training Accuracy: 90-95%
- Validation Accuracy: 85-90%
- Test Accuracy: 80-90%

### If accuracy is low:
- Need more training data
- Need better quality images
- Need to balance classes (similar number of images per class)

---

## Quick Dataset Collection Tips

### 🎯 Fast Track (2-3 days):
1. **Day 1:** Collect 50 images per class from internet
2. **Day 2:** Use data augmentation scripts to generate 500+ images
3. **Day 3:** Train the model

### 🎯 Quality Track (1-2 weeks):
1. **Week 1:** Visit farm, photograph 200+ images per disease
2. **Week 2:** Label, organize, and train model
3. Better accuracy, more reliable

---

## Need Help?

If you're stuck:
1. Make sure directory structure is correct
2. Check that images are in JPG/PNG format
3. Verify minimum 100 images per class
4. Run: `python train_black_pepper_cnn.py` and read error messages

---

## Next Steps

1. ✅ Create dataset directory structure
2. ✅ Collect/download Black Pepper disease images
3. ✅ Run training script
4. ✅ Update API to use new model
5. ✅ Test with real images

**Good luck with your Black Pepper Disease Detection system! 🌿🔬**
