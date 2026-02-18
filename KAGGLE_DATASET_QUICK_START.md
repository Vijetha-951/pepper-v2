# 🎯 QUICK START: Using Kaggle Datasets for Disease Detection

## 📋 Overview

This guide shows you how to download and use real pepper disease images from Kaggle to improve your disease detection model accuracy.

## 🚀 Quick Steps

### Step 1: Get Kaggle API Credentials

1. Go to [Kaggle Account Settings](https://www.kaggle.com/settings/account)
2. Scroll to the **API** section
3. Click **"Create New Token"**
4. This downloads `kaggle.json` file
5. Place it in: `C:\Users\YourName\.kaggle\kaggle.json` (Windows)
   - Or in project root (scripts will move it for you)

**Set permissions (if on Linux/Mac):**
```bash
chmod 600 ~/.kaggle/kaggle.json
```

### Step 2: Install Kaggle Package

```bash
pip install kaggle
```

Or install from requirements:
```bash
cd backend/python
pip install -r requirements.txt
```

### Step 3: Download Dataset

Run the interactive downloader:

```bash
cd backend/python
python download_kaggle_dataset.py
```

**What it does:**
- ✅ Checks for Kaggle credentials
- ✅ Shows recommended datasets
- ✅ Downloads your chosen dataset
- ✅ Organizes images into disease categories

**Recommended datasets:**
1. **PlantVillage** - `emmarex/plantdisease` (1.8 GB, 54K+ images)
2. **Plant Disease Recognition** - `rashikrahmanpritom/plant-disease-recognition-dataset` (2 GB, 87K+ images)
3. **New Plant Diseases** - `vipoooool/new-plant-diseases-dataset` (1.6 GB, 87K+ images)

### Step 4: Train Model with Real Images

After downloading and organizing:

```bash
python train_with_real_images.py
```

**This will:**
- Load images from `pepper_dataset/` folder
- Extract features from each image
- Train Random Forest with real data
- Save model as `disease_model_real.pkl`
- Show accuracy and performance metrics

### Step 5: Use the New Model

Update [disease_detector.py](disease_detector.py) line 29:

```python
# Change from:
def __init__(self, model_path='backend/python/models/disease_model.pkl'):

# To:
def __init__(self, model_path='backend/python/models/disease_model_real.pkl'):
```

Or keep both models and choose at runtime!

### Step 6: Restart API

```bash
python disease_detection_api.py
```

Or use the batch file:
```bash
start-disease-detection.bat
```

## 📂 Expected Dataset Structure

After organization, you should have:

```
backend/python/pepper_dataset/
├── Healthy/
│   ├── img001.jpg
│   ├── img002.jpg
│   └── ...
├── Bacterial Spot/
│   ├── img001.jpg
│   ├── img002.jpg
│   └── ...
├── Yellow Leaf Curl/
│   ├── img001.jpg
│   └── ...
└── Nutrient Deficiency/
    ├── img001.jpg
    └── ...
```

## 🎯 Manual Dataset Organization

If automatic organization doesn't work perfectly:

1. **Open the downloaded dataset folder**
   - Located in `backend/python/datasets/`

2. **Identify pepper/relevant images**
   - Look for folders with pepper, capsicum, or bell pepper

3. **Copy images to organized structure**
   ```bash
   # Example: Copying healthy pepper images
   cp datasets/PlantVillage/Pepper_healthy/*.jpg pepper_dataset/Healthy/
   ```

4. **Match disease names**
   - Dataset: `Pepper_bacterial_spot` → Our category: `Bacterial Spot`
   - Dataset: `Pepper_healthy` → Our category: `Healthy`

## 💡 Tips for Best Results

### Image Quality
- ✅ Use clear, well-lit images
- ✅ Single leaf per image works best
- ✅ Avoid blurry or dark images

### Dataset Size
- **Minimum**: 100 images per disease (basic accuracy)
- **Recommended**: 500-1000 images per disease (good accuracy)
- **Optimal**: 2000+ images per disease (best accuracy)

### Training Parameters

Edit in [train_with_real_images.py](train_with_real_images.py):

```python
# For faster training (less accuracy):
n_estimators=100,  # Default: 200
max_depth=10,      # Default: 15

# For better accuracy (slower):
n_estimators=300,
max_depth=20,
```

## 🔍 Alternative: Manual Kaggle Download

If you prefer manual download:

1. **Go to Kaggle dataset page**
   - Example: https://www.kaggle.com/datasets/emmarex/plantdisease

2. **Click "Download" button**
   - Requires Kaggle account (free)

3. **Extract ZIP file**
   ```bash
   unzip plantdisease.zip -d backend/python/datasets/
   ```

4. **Organize manually**
   - Create folders: Healthy, Bacterial Spot, etc.
   - Copy relevant images to each folder

5. **Train model**
   ```bash
   python train_with_real_images.py
   ```

## 📊 Expected Accuracy Improvements

| Model Type | Accuracy | Training Time |
|------------|----------|---------------|
| Synthetic Data | 80-85% | < 1 minute |
| Real Images (500/class) | 90-95% | 5-10 minutes |
| Real Images (2000+/class) | 95-98% | 20-30 minutes |

## 🐛 Troubleshooting

### "No kaggle.json found"
- Download from Kaggle account settings
- Place in `~/.kaggle/` or project root

### "Dataset not found"
- Check dataset ID (copy from Kaggle URL)
- Ensure you have internet connection

### "Images not loading"
- Check file extensions (.jpg, .png)
- Verify directory structure matches expected format

### "Low accuracy after training"
- Need more images per class
- Check image quality
- Ensure proper disease classification

### "Training takes too long"
- Reduce `max_images_per_class` parameter
- Use fewer estimators in Random Forest

## 🔄 Using Both Models

Keep both synthetic and real models:

```python
# In disease_detection_api.py
model_type = 'real'  # or 'synthetic'

if model_type == 'real':
    detector = PlantDiseaseDetector('backend/python/models/disease_model_real.pkl')
else:
    detector = PlantDiseaseDetector('backend/python/models/disease_model.pkl')
```

## 📞 Need Help?

1. Check the troubleshooting section above
2. Review error messages in terminal
3. Verify all files are in correct locations
4. Ensure all dependencies are installed

## 🎓 Credits

Datasets from [Kaggle](https://www.kaggle.com):
- PlantVillage Dataset
- Plant Disease Recognition Dataset
- Community contributors

---

**Last Updated**: February 2026
