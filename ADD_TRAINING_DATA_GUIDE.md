# 📚 How to Add New Training Data to Black Pepper Model

## Current Dataset Status

```
black_pepper_dataset/
├── train/
│   ├── healthy/          ← ADD YOUR NEW IMAGES HERE
│   ├── anthracnose/
│   ├── bacterial_wilt/
│   ├── foot_rot/
│   └── yellow_leaf/
├── validation/
│   └── (same structure)
└── test/
    └── (same structure)
```

**Current Status**: All folders are EMPTY (0 images)

## Steps to Add Your New Healthy Leaf Dataset

### Option 1: Manual Copy (Simple)

1. **Locate your new dataset folder** 
   - Example: `D:\my_datasets\black_pepper_healthy\`

2. **Copy images to training folder**:
   ```powershell
   # Copy all images to the healthy folder
   Copy-Item "D:\path\to\your\healthy\images\*.jpg" -Destination "C:\xampp\htdocs\PEPPER\backend\python\black_pepper_dataset\train\healthy\"
   
   # Or PNG images
   Copy-Item "D:\path\to\your\healthy\images\*.png" -Destination "C:\xampp\htdocs\PEPPER\backend\python\black_pepper_dataset\train\healthy\"
   ```

3. **Split for validation (20% of images)**:
   ```powershell
   # Move some images to validation folder for testing
   $files = Get-ChildItem "C:\xampp\htdocs\PEPPER\backend\python\black_pepper_dataset\train\healthy\*.jpg" | Sort-Object {Get-Random} | Select-Object -First 20
   Move-Item $files -Destination "C:\xampp\htdocs\PEPPER\backend\python\black_pepper_dataset\validation\healthy\"
   ```

### Option 2: Using PowerShell Script (Automated)

Create this script as `add_healthy_images.ps1`:

```powershell
# Configuration
$sourceFolder = "D:\path\to\your\healthy\images"  # CHANGE THIS
$targetTrain = "C:\xampp\htdocs\PEPPER\backend\python\black_pepper_dataset\train\healthy"
$targetVal = "C:\xampp\htdocs\PEPPER\backend\python\black_pepper_dataset\validation\healthy"

# Get all images
$images = Get-ChildItem "$sourceFolder\*" -Include *.jpg,*.jpeg,*.png,*.JPG,*.PNG

Write-Host "Found $($images.Count) images"

# Shuffle and split (80% train, 20% validation)
$shuffled = $images | Sort-Object {Get-Random}
$splitIndex = [math]::Floor($images.Count * 0.8)
$trainImages = $shuffled[0..($splitIndex-1)]
$valImages = $shuffled[$splitIndex..($shuffled.Count-1)]

# Copy to train folder
Write-Host "Copying $($trainImages.Count) images to training folder..."
foreach ($img in $trainImages) {
    Copy-Item $img.FullName -Destination $targetTrain
}

# Copy to validation folder
Write-Host "Copying $($valImages.Count) images to validation folder..."
foreach ($img in $valImages) {
    Copy-Item $img.FullName -Destination $targetVal
}

Write-Host "✅ Done!"
Write-Host "Train: $($trainImages.Count) images"
Write-Host "Validation: $($valImages.Count) images"
```

Run it:
```powershell
powershell -ExecutionPolicy Bypass -File add_healthy_images.ps1
```

### Option 3: Quick Command (All at Once)

Replace `YOUR_SOURCE_PATH` with your actual path:

```powershell
# Set source path
$source = "D:\your\healthy\images\folder"
$trainDest = "C:\xampp\htdocs\PEPPER\backend\python\black_pepper_dataset\train\healthy"
$valDest = "C:\xampp\htdocs\PEPPER\backend\python\black_pepper_dataset\validation\healthy"

# Get all images and shuffle
$images = Get-ChildItem "$source\*" -Include *.jpg,*.jpeg,*.png | Sort-Object {Get-Random}
$splitIdx = [math]::Floor($images.Count * 0.8)

# Copy 80% to train
$images[0..($splitIdx-1)] | ForEach-Object { Copy-Item $_.FullName -Destination $trainDest }

# Copy 20% to validation
$images[$splitIdx..($images.Count-1)] | ForEach-Object { Copy-Item $_.FullName -Destination $valDest }

Write-Host "✅ Done! Train: $splitIdx | Validation: $($images.Count - $splitIdx)"
```

## Recommended Dataset Size

| Quality | Images per Class |
|---------|------------------|
| Minimum | 100+ images |
| Good | 500+ images |
| Excellent | 1000+ images |

**Your healthy folder should have at least 100 images for decent results!**

## After Adding Images

### 1. Verify the data:
```powershell
cd C:\xampp\htdocs\PEPPER\backend\python
Get-ChildItem "black_pepper_dataset\train" -Directory | ForEach-Object { 
    $count = (Get-ChildItem $_.FullName -File).Count
    Write-Output "$($_.Name): $count images" 
}
```

Expected output:
```
healthy: 400 images
anthracnose: 0 images
bacterial_wilt: 0 images
foot_rot: 0 images
yellow_leaf: 0 images
```

### 2. Train the model:
```powershell
cd C:\xampp\htdocs\PEPPER\backend\python
python train_black_pepper_cnn.py
```

### 3. Training will take time:
- **With 100 images**: ~5-10 minutes
- **With 500 images**: ~15-30 minutes
- **With 1000+ images**: ~30-60 minutes

## Important Notes

### Image Requirements
- ✅ **Format**: JPG, JPEG, PNG
- ✅ **Size**: Any size (will be resized to 224x224)
- ✅ **Quality**: Clear, well-lit photos
- ✅ **Content**: Single leaf closeups work best
- ❌ **Avoid**: Blurry, too dark, multiple leaves overlapping

### Adding Disease Images Later

If you also have diseased leaf images, add them to other folders:

```
black_pepper_dataset/train/
├── healthy/          ← Your new dataset
├── foot_rot/         ← Add foot rot disease images here
├── anthracnose/      ← Add anthracnose disease images here
├── bacterial_wilt/   ← Add bacterial wilt images here
└── yellow_leaf/      ← Add yellow leaf images here
```

**Note**: You need images for ALL classes if you want to detect multiple diseases!

## If You Only Have Healthy Images

If you only have healthy images and no disease images, you can:

### Option A: Binary Classification (Healthy vs Unhealthy)

1. Rename folders:
```powershell
cd C:\xampp\htdocs\PEPPER\backend\python\black_pepper_dataset\train
Remove-Item anthracnose, bacterial_wilt, foot_rot, yellow_leaf -Recurse
# Now you only have: healthy/
```

2. Add a generic "diseased" folder later when you get disease images

### Option B: Use Only What You Have

Train with just healthy images, but the model won't be very useful since it can't distinguish diseases.

## Quick Start Command

**One-line command to copy all your images** (edit the source path):

```powershell
$src="YOUR_FOLDER_PATH_HERE"; $train="C:\xampp\htdocs\PEPPER\backend\python\black_pepper_dataset\train\healthy"; $val="C:\xampp\htdocs\PEPPER\backend\python\black_pepper_dataset\validation\healthy"; $imgs=Get-ChildItem "$src\*" -Include *.jpg,*.jpeg,*.png | Sort-Object {Get-Random}; $split=[math]::Floor($imgs.Count*0.8); $imgs[0..($split-1)] | Copy-Item -Destination $train; $imgs[$split..($imgs.Count-1)] | Copy-Item -Destination $val; Write-Host "✅ Done! Train:$split Val:$($imgs.Count-$split)"
```

## After Training

Once trained, the new model will be saved as:
```
backend/python/models/black_pepper_disease_model.keras
```

Restart the Python API to use the new model:
```powershell
cd C:\xampp\htdocs\PEPPER\backend\python
python disease_detection_api.py
```

## Need Help?

If you're stuck, tell me:
1. **Where is your healthy dataset located?** (full path)
2. **How many images do you have?**
3. **Do you also have disease images?**

I can create a custom script for your specific situation!
