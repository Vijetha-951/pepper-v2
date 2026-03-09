# 🚀 BLACK PEPPER DISEASE DETECTION - QUICK START

## You Have 3 Files Ready:

### 1. **SETUP_BLACK_PEPPER_DATASET.bat**
   - **Purpose:** Creates the dataset directory structure automatically
   - **How to use:** Double-click this file
   - **What it does:** Creates folders for all disease classes

### 2. **train_black_pepper_cnn.py**
   - **Purpose:** Trains the CNN model for Black Pepper disease detection
   - **How to use:** `python train_black_pepper_cnn.py`
   - **What it does:** 
     - Loads your images
     - Trains AI model using transfer learning
     - Saves trained model
     - Works with as few as 100 images per class

### 3. **BLACK_PEPPER_SETUP_GUIDE.md**
   - **Purpose:** Complete detailed guide
   - **Contains:** Step-by-step instructions, troubleshooting, tips

---

## 🎯 FASTEST WAY TO GET STARTED (30 minutes):

### Step 1: Setup Dataset Structure (1 minute)
```powershell
# Run this from PEPPER directory:
.\SETUP_BLACK_PEPPER_DATASET.bat
```

This creates:
```
black_pepper_dataset/
├── train/
│   ├── healthy/          ← Put 100+ healthy leaf images here
│   ├── bacterial_wilt/   ← Put 100+ bacterial wilt images here
│   ├── foot_rot/         ← Put 100+ foot rot images here
│   ├── anthracnose/      ← Put 100+ anthracnose images here
│   └── yellow_leaf/      ← Put 100+ yellow leaf images here
└── validation/           ← (Optional - auto-split if empty)
```

### Step 2: Collect Images (20 minutes)

**Option A - Quick Test (Start Small):**
1. Google Images: Search "black pepper leaf healthy"
2. Download 20-50 images → Put in `train/healthy/`
3. Google Images: Search "black pepper bacterial wilt"
4. Download 20-50 images → Put in `train/bacterial_wilt/`
5. Repeat for other diseases

**Option B - Use Research Datasets:**
- Search Kaggle: "black pepper disease"
- Search Google Scholar for papers with datasets
- PlantVillage.org

**Option C - Take Your Own Photos:**
- Visit black pepper farm
- Take photos of leaves
- 200+ images per disease = best results

**Minimum Requirements:**
- At least 50 images per class (for testing)
- Better: 100+ images per class
- Best: 500+ images per class

### Step 3: Train the Model (5-30 minutes depending on dataset size)
```powershell
cd backend\python
python train_black_pepper_cnn.py
```

**What you'll see:**
```
========================
STARTING TRAINING
========================
✅ Training samples: 400
✅ Validation samples: 100
✅ Classes: ['healthy', 'bacterial_wilt', ...]

Epoch 1/30
12/12 [==============================] - 45s 3s/step - loss: 1.2345 - accuracy: 0.7500
...
Training complete!
Final Accuracy: 92.50%
```

### Step 4: Update API to Use New Model (2 minutes)

Edit `backend/python/cnn_disease_detector_v3.py`:

**Change line 17:**
```python
# OLD:
model_path = os.path.join(os.path.dirname(__file__), 'models', 'pepper_disease_model_v3.keras')

# NEW:
model_path = os.path.join(os.path.dirname(__file__), 'models', 'black_pepper_disease_model.keras')
```

**Change line 49:**
```python
# OLD:
class_file = os.path.join(model_dir, 'class_indices.json')

# NEW:
class_file = os.path.join(model_dir, 'black_pepper_class_indices.json')
```

### Step 5: Restart API (1 minute)
```powershell
# Stop old API
Get-Process python | Stop-Process -Force

# Start new API
cd backend\python
python disease_detection_api.py
```

### Step 6: Test It! ✅
1. Open your web app
2. Upload a Black Pepper leaf image
3. See the disease prediction!

---

## 📊 What Model Accuracy to Expect:

| Dataset Size | Training Time | Expected Accuracy |
|--------------|---------------|-------------------|
| 50 per class | 5-10 min | 70-80% |
| 100 per class | 10-15 min | 80-85% |
| 200 per class | 15-25 min | 85-90% |
| 500+ per class | 30-60 min | 90-95% |

---

## 🆘 Common Issues & Quick Fixes:

### Issue 1: "Not enough images"
**Fix:** Start with minimum 50 images per class for testing

### Issue 2: "Model accuracy too low (below 70%)"
**Fix:**
- Check if images are correctly labeled
- Make sure images show leaves clearly
- Balance the classes (similar number of images in each folder)
- Collect more images

### Issue 3: "Training is too slow"
**Fix:**
- Reduce batch size in script (change `batch_size=32` to `batch_size=16`)
- Use fewer images (limit to 300 per class)

### Issue 4: "Can't find good dataset"
**Fix:** See BLACK_PEPPER_SETUP_GUIDE.md → Step 2 for detailed sources

---

## 🎯 Pro Tips:

1. **Start Small, Scale Up:** 
   - Begin with 50 images × 2 classes (healthy + 1 disease)
   - Get it working
   - Then add more classes and images

2. **Image Quality Matters:**
   - Clear, focused images
   - Good lighting
   - Leaf taking up most of the frame
   - Consistent background helps

3. **Data Augmentation is Your Friend:**
   - The script automatically generates variations
   - 100 real images → 500+ augmented images

4. **Test Before Full Deployment:**
   - Train with small dataset
   - Test predictions
   - Then scale up for production

---

## 📞 Quick Reference Commands:

```powershell
# 1. Setup dataset structure
.\SETUP_BLACK_PEPPER_DATASET.bat

# 2. Train model
cd backend\python
python train_black_pepper_cnn.py

# 3. Restart API
Get-Process python | Stop-Process -Force
python disease_detection_api.py

# 4. Check if API is running
Test-NetConnection localhost -Port 5001
```

---

## ✅ Checklist:

- [ ] Run SETUP_BLACK_PEPPER_DATASET.bat
- [ ] Add images to train folders (min 50 per class)
- [ ] Run train_black_pepper_cnn.py
- [ ] Wait for training to complete
- [ ] Update cnn_disease_detector_v3.py (2 lines)
- [ ] Restart disease_detection_api.py
- [ ] Test with Black Pepper images

---

## 🎉 Success Indicators:

You know it's working when:
- ✅ Training completes without errors
- ✅ Validation accuracy > 80%
- ✅ Model files created in `models/` folder
- ✅ API starts successfully
- ✅ Black Pepper images get correct predictions

---

## Need More Help?

1. **Read:** BLACK_PEPPER_SETUP_GUIDE.md (detailed guide)
2. **Check:** Training script output for error messages
3. **Verify:** Dataset structure matches the expected format
4. **Test:** With known healthy/diseased images first

---

**Ready to start? Run this:**
```powershell
.\SETUP_BLACK_PEPPER_DATASET.bat
```

**Then collect images and train!** 🚀🌿
