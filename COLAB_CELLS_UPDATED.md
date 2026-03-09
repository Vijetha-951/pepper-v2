# 🌿 Black Pepper Training - Updated Cell Codes

## Essential Cells to Run (In Order)

### Cell 1: Check GPU
```python
import tensorflow as tf

print("TensorFlow version:", tf.__version__)
print("GPU Available:", len(tf.config.list_physical_devices('GPU')) > 0)

if len(tf.config.list_physical_devices('GPU')) > 0:
    print("✅ GPU is enabled! Training will be FAST! 🚀")
else:
    print("⚠️ GPU not enabled. Go to: Runtime → Change runtime type → Select 'GPU'")
```

---

### Cell 2: Mount Google Drive
```python
from google.colab import drive
drive.mount('/content/drive')
print("✅ Google Drive mounted!")
```

---

### Cell 3: Connect to Dataset & Copy to Local Storage
```python
import os
import shutil

# IMPORTANT: Update this path to match YOUR Google Drive folder location
drive_dataset_path = '/content/drive/MyDrive/black_pepper_dataset/BLACK_PEPPER_DATASET'

print("🔍 Checking your Google Drive dataset...")
print("=" * 60)

if os.path.exists(drive_dataset_path):
    print(f"✅ Found dataset at: {drive_dataset_path}\n")
    
    # List all folders
    folders = [f for f in os.listdir(drive_dataset_path) if os.path.isdir(os.path.join(drive_dataset_path, f))]
    
    print("📁 Found these disease folders:")
    print("-" * 60)
    
    total_images = 0
    dataset_summary = {}
    
    for folder in sorted(folders):
        folder_path = os.path.join(drive_dataset_path, folder)
        
        # Count images
        image_files = [f for f in os.listdir(folder_path) 
                      if f.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp'))]
        count = len(image_files)
        total_images += count
        dataset_summary[folder] = count
        
        print(f"   {folder:25s}: {count:4d} images")
    
    print("-" * 60)
    print(f"   TOTAL: {total_images} images\n")
    
    if total_images > 0:
        print("✅ Dataset is ready! Moving to next step...\n")
        
        # Copy dataset to /content for faster training
        local_dataset = '/content/black_pepper_dataset'
        print(f"📋 Copying dataset to {local_dataset} for faster training...")
        
        if os.path.exists(local_dataset):
            shutil.rmtree(local_dataset)
        
        os.makedirs(local_dataset, exist_ok=True)
        
        # Create train directory
        train_dir = os.path.join(local_dataset, 'train')
        os.makedirs(train_dir, exist_ok=True)
        
        # Copy each disease folder
        for folder in folders:
            src = os.path.join(drive_dataset_path, folder)
            dst = os.path.join(train_dir, folder)
            shutil.copytree(src, dst)
            print(f"   ✅ Copied {folder}")
        
        print("\n✅ Dataset ready for training! 🚀")
        print(f"📊 Dataset Statistics:")
        for folder, count in dataset_summary.items():
            print(f"   • {folder}: {count} images")
    else:
        print("❌ No images found in any folder!")
        
else:
    print(f"❌ Dataset not found at: {drive_dataset_path}\n")
    print("📝 Please check:")
    print("   1. Is your folder name exactly 'BLACK_PEPPER_DATASET'?")
    print("   2. Is it inside 'black_pepper_dataset' folder?")
    print("   3. Try updating the 'drive_dataset_path' variable above")
```

---

### Cell 4: Import Required Packages
```python
# Most packages are pre-installed in Colab
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import numpy as np
import matplotlib.pyplot as plt
import json
from pathlib import Path

print("✅ All packages loaded successfully!")
```

---

### Cell 5: ⭐ Prepare Data Generators (UPDATED - NOW INCLUDES IMPORTS)
```python
# Import required modules
import os
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Configuration
IMG_HEIGHT = 224
IMG_WIDTH = 224
BATCH_SIZE = 32

# Dataset location (change this if needed)
DATASET_PATH = '/content/black_pepper_dataset'  # Local Colab storage

train_dir = os.path.join(DATASET_PATH, 'train')
val_dir = os.path.join(DATASET_PATH, 'validation')

# Data augmentation for training
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    vertical_flip=True,
    fill_mode='nearest',
    validation_split=0.2 if not os.path.exists(val_dir) else 0.0
)

# Validation data (only rescaling)
val_datagen = ImageDataGenerator(rescale=1./255)

# Create generators
if not os.path.exists(val_dir):
    print("Using 20% of training data for validation")
    train_generator = train_datagen.flow_from_directory(
        train_dir,
        target_size=(IMG_HEIGHT, IMG_WIDTH),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='training'
    )
    
    validation_generator = train_datagen.flow_from_directory(
        train_dir,
        target_size=(IMG_HEIGHT, IMG_WIDTH),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='validation'
    )
else:
    print("Using separate validation directory")
    train_datagen_no_split = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        vertical_flip=True,
        fill_mode='nearest'
    )
    
    train_generator = train_datagen_no_split.flow_from_directory(
        train_dir,
        target_size=(IMG_HEIGHT, IMG_WIDTH),
        batch_size=BATCH_SIZE,
        class_mode='categorical'
    )
    
    validation_generator = val_datagen.flow_from_directory(
        val_dir,
        target_size=(IMG_HEIGHT, IMG_WIDTH),
        batch_size=BATCH_SIZE,
        class_mode='categorical'
    )

# Store class names
class_names = {v: k for k, v in train_generator.class_indices.items()}
num_classes = len(class_names)

print(f"\n✅ Data generators created!")
print(f"   Training samples: {train_generator.samples}")
print(f"   Validation samples: {validation_generator.samples}")
print(f"   Number of classes: {num_classes}")
print(f"   Classes: {list(class_names.values())}")
```

**Expected Output:**
```
Using 20% of training data for validation
Found 1447 images belonging to 4 classes.
Found 362 images belonging to 4 classes.

✅ Data generators created!
   Training samples: 1447
   Validation samples: 362
   Number of classes: 4
   Classes: ['Footrot', 'Healthy', 'Pollu_Disease', 'Slow-Decline']
```

---

### Cell 6: Visualize Sample Images
```python
# Show sample images
import matplotlib.pyplot as plt
import numpy as np

print("📸 Attempting to load sample images...")
print(f"   Batch size: {BATCH_SIZE}")
print(f"   Total training samples: {train_generator.samples}")

# Check if we have any images
if train_generator.samples == 0:
    print("\n❌ ERROR: No images found in training generator!")
else:
    try:
        # Get a batch of images
        sample_batch = next(train_generator)
        images, labels = sample_batch
        
        # Check how many images we actually got
        actual_count = len(images)
        print(f"   Loaded {actual_count} images in this batch")
        
        if actual_count > 0:
            # Plot images (up to 9)
            num_to_show = min(9, actual_count)
            plt.figure(figsize=(15, 15))
            
            for i in range(num_to_show):
                plt.subplot(3, 3, i + 1)
                plt.imshow(images[i])
                label_idx = np.argmax(labels[i])
                plt.title(class_names[label_idx], fontsize=14, fontweight='bold')
                plt.axis('off')
            
            plt.tight_layout()
            plt.show()
            
            print(f"\n✅ Displayed {num_to_show} sample images above")
                
    except Exception as e:
        print(f"\n❌ ERROR while loading images: {str(e)}")
```

---

### Cell 7: Create CNN Model
```python
print("🏗️ Building CNN Model...")

# Load pre-trained MobileNetV2 (trained on ImageNet)
base_model = keras.applications.MobileNetV2(
    input_shape=(IMG_HEIGHT, IMG_WIDTH, 3),
    include_top=False,
    weights='imagenet'
)

# Freeze the base model
base_model.trainable = False

# Create the full model
inputs = keras.Input(shape=(IMG_HEIGHT, IMG_WIDTH, 3))

# Pre-processing
x = keras.applications.mobilenet_v2.preprocess_input(inputs)

# Base model
x = base_model(x, training=False)

# Classification head
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dropout(0.2)(x)
outputs = layers.Dense(num_classes, activation='softmax')(x)

model = keras.Model(inputs, outputs)

# Compile the model
model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

print("\n✅ Model created!")
print(f"   Total parameters: {model.count_params():,}")
print(f"   Trainable parameters: {sum([tf.size(w).numpy() for w in model.trainable_weights]):,}")

# Show model summary
model.summary()
```

---

### Cell 8: Train the Model (20-30 minutes with GPU)
```python
# Training configuration
EPOCHS = 30

# Callbacks
callbacks = [
    keras.callbacks.EarlyStopping(
        monitor='val_loss',
        patience=5,
        restore_best_weights=True,
        verbose=1
    ),
    keras.callbacks.ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.2,
        patience=3,
        min_lr=0.00001,
        verbose=1
    )
]

print("🚀 Starting training...")
print(f"   Epochs: {EPOCHS}")
print(f"   Batch size: {BATCH_SIZE}")
print(f"   Using: {'GPU' if len(tf.config.list_physical_devices('GPU')) > 0 else 'CPU'}")
print("\n" + "="*70)

# Train the model
history = model.fit(
    train_generator,
    validation_data=validation_generator,
    epochs=EPOCHS,
    callbacks=callbacks,
    verbose=1
)

print("\n" + "="*70)
print("✅ TRAINING COMPLETE!")
print("="*70)

# Print final results
final_accuracy = history.history['accuracy'][-1] * 100
final_val_accuracy = history.history['val_accuracy'][-1] * 100

print(f"\nFinal Training Accuracy: {final_accuracy:.2f}%")
print(f"Final Validation Accuracy: {final_val_accuracy:.2f}%")
```

---

### Cell 9: Visualize Training Results
```python
# Plot training history
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5))

# Accuracy
ax1.plot(history.history['accuracy'], label='Training Accuracy')
ax1.plot(history.history['val_accuracy'], label='Validation Accuracy')
ax1.set_xlabel('Epoch')
ax1.set_ylabel('Accuracy')
ax1.set_title('Model Accuracy')
ax1.legend()
ax1.grid(True)

# Loss
ax2.plot(history.history['loss'], label='Training Loss')
ax2.plot(history.history['val_loss'], label='Validation Loss')
ax2.set_xlabel('Epoch')
ax2.set_ylabel('Loss')
ax2.set_title('Model Loss')
ax2.legend()
ax2.grid(True)

plt.tight_layout()
plt.show()

print("✅ Training charts displayed above")
```

---

### Cell 10: Save the Model
```python
# Save model
model_filename = 'black_pepper_disease_model.keras'
model.save(model_filename)
print(f"✅ Model saved: {model_filename}")

# Save class indices
class_indices = {v: k for k, v in class_names.items()}
with open('black_pepper_class_indices.json', 'w') as f:
    json.dump(class_indices, f, indent=2)
print(f"✅ Class indices saved: black_pepper_class_indices.json")

# Also save to Google Drive for backup
drive_save_path = '/content/drive/MyDrive/'
if os.path.exists(drive_save_path):
    import shutil
    shutil.copy(model_filename, os.path.join(drive_save_path, model_filename))
    shutil.copy('black_pepper_class_indices.json', os.path.join(drive_save_path, 'black_pepper_class_indices.json'))
    print(f"✅ Files also backed up to Google Drive")

print("\n📦 Files ready for download:")
print(f"   1. {model_filename}")
print(f"   2. black_pepper_class_indices.json")
```

---

### Cell 11: Test the Model
```python
# Test on a few random images from validation set
import numpy as np

# Get a batch
test_images, test_labels = next(validation_generator)

# Make predictions
predictions = model.predict(test_images[:9])

# Display results
plt.figure(figsize=(15, 15))
for i in range(9):
    plt.subplot(3, 3, i + 1)
    plt.imshow(test_images[i])
    
    # True label
    true_label_idx = np.argmax(test_labels[i])
    true_label = class_names[true_label_idx]
    
    # Predicted label
    pred_label_idx = np.argmax(predictions[i])
    pred_label = class_names[pred_label_idx]
    confidence = predictions[i][pred_label_idx] * 100
    
    # Color: green if correct, red if wrong
    color = 'green' if true_label == pred_label else 'red'
    
    plt.title(f"True: {true_label}\nPred: {pred_label} ({confidence:.1f}%)", color=color)
    plt.axis('off')

plt.tight_layout()
plt.show()

print("✅ Test predictions displayed above")
print("   Green = Correct prediction")
print("   Red = Incorrect prediction")
```

---

### Cell 12: Download Model Files
```python
from google.colab import files

print("📥 Downloading files...")

# Download model
files.download('black_pepper_disease_model.keras')
print("✅ Downloaded: black_pepper_disease_model.keras")

# Download class indices
files.download('black_pepper_class_indices.json')
print("✅ Downloaded: black_pepper_class_indices.json")

print("\n" + "="*70)
print("🎉 ALL DONE!")
print("="*70)
print("\n📝 Next steps:")
print("   1. Save downloaded files to: C:\\xampp\\htdocs\\PEPPER\\backend\\python\\models\\")
print("   2. Restart your Disease Detection API")
print("   3. Test with Black Pepper leaf images!")
```

---

## 🎯 Quick Run Order Summary:

1. ✅ **Cell 1** - Check GPU (must see "GPU is enabled")
2. ✅ **Cell 2** - Mount Google Drive
3. ✅ **Cell 3** - Copy dataset (should copy 1,809 images)
4. ✅ **Cell 4** - Import packages
5. ✅ **Cell 5** - Create data generators (should show 1,447 training, 362 validation)
6. ✅ **Cell 6** - Visualize samples (optional, shows 9 images)
7. ✅ **Cell 7** - Create model
8. ⏳ **Cell 8** - **TRAIN** (20-30 min, watch accuracy increase)
9. ✅ **Cell 9** - View training charts
10. ✅ **Cell 10** - Save model
11. ✅ **Cell 11** - Test predictions (optional)
12. 📥 **Cell 12** - **DOWNLOAD** model files

---

## ⚠️ Key Fix Applied:

**Cell 5 now includes the missing imports at the top:**
```python
import os
from tensorflow.keras.preprocessing.image import ImageDataGenerator
```

This fixes the `NameError: name 'os' is not defined` error you encountered.

---

## 📝 After Training:

1. **Copy downloaded files** to your local project:
   - `black_pepper_disease_model.keras` → `C:\xampp\htdocs\PEPPER\backend\python\models\`
   - `black_pepper_class_indices.json` → `C:\xampp\htdocs\PEPPER\backend\python\models\`

2. **Restart your Python API** (it will automatically load the new model)

3. **Test with your original image** - should now get much higher confidence!
