# Fresh Start: CNN Training in Google Colab

## Complete Training Code (Copy all cells to Colab)

### Cell 1: Setup and Dataset Download
```python
# Install and import dependencies
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
import json
from google.colab import files
import os

print(f"TensorFlow version: {tf.__version__}")
print(f"GPU available: {tf.config.list_physical_devices('GPU')}")

# Download PlantVillage dataset
!wget https://data.mendeley.com/public-files/datasets/tywbtsjrjv/files/d5652a28-c1d8-4b76-97f3-72fb80f94efc/file_downloaded -O PlantVillage.zip
!unzip -q PlantVillage.zip
!ls -la
```

### Cell 2: Prepare Dataset Structure
```python
import shutil

# Create train/val directories
os.makedirs('dataset/train', exist_ok=True)
os.makedirs('dataset/val', exist_ok=True)

# Find pepper-related folders
pepper_healthy = None
pepper_spot = None

for root, dirs, files in os.walk('.'):
    for d in dirs:
        if 'Pepper' in d and 'healthy' in d:
            pepper_healthy = os.path.join(root, d)
        elif 'Pepper' in d and 'Bacterial' in d:
            pepper_spot = os.path.join(root, d)

print(f"Found Healthy: {pepper_healthy}")
print(f"Found Bacterial Spot: {pepper_spot}")

# Copy and split data (80% train, 20% val)
import random
random.seed(42)

def split_data(source_dir, class_name, train_dir, val_dir, split_ratio=0.8):
    images = [f for f in os.listdir(source_dir) if f.endswith(('.jpg', '.JPG', '.jpeg', '.png'))]
    random.shuffle(images)
    
    split_idx = int(len(images) * split_ratio)
    train_images = images[:split_idx]
    val_images = images[split_idx:]
    
    # Create class directories
    os.makedirs(os.path.join(train_dir, class_name), exist_ok=True)
    os.makedirs(os.path.join(val_dir, class_name), exist_ok=True)
    
    # Copy train images
    for img in train_images:
        shutil.copy(os.path.join(source_dir, img), os.path.join(train_dir, class_name, img))
    
    # Copy val images
    for img in val_images:
        shutil.copy(os.path.join(source_dir, img), os.path.join(val_dir, class_name, img))
    
    return len(train_images), len(val_images)

# Split both classes
train_healthy, val_healthy = split_data(pepper_healthy, 'Pepper__bell___healthy', 'dataset/train', 'dataset/val')
train_spot, val_spot = split_data(pepper_spot, 'Pepper__bell___Bacterial_spot', 'dataset/train', 'dataset/val')

print(f"\nDataset Split:")
print(f"Train: {train_healthy + train_spot} images ({train_healthy} healthy, {train_spot} bacterial spot)")
print(f"Val: {val_healthy + val_spot} images ({val_healthy} healthy, {val_spot} bacterial spot)")
```

### Cell 3: Create Data Generators
```python
IMG_SIZE = 224
BATCH_SIZE = 32

# Data augmentation for training
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    horizontal_flip=True,
    zoom_range=0.2,
    fill_mode='nearest'
)

# Only rescaling for validation
val_datagen = ImageDataGenerator(rescale=1./255)

train_generator = train_datagen.flow_from_directory(
    'dataset/train',
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=True
)

val_generator = val_datagen.flow_from_directory(
    'dataset/val',
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=False
)

print(f"\nClass indices: {train_generator.class_indices}")
print(f"Number of classes: {train_generator.num_classes}")
```

### Cell 4: Build CNN Model
```python
# Load pre-trained MobileNetV2 (without top layers)
base_model = MobileNetV2(
    input_shape=(IMG_SIZE, IMG_SIZE, 3),
    include_top=False,
    weights='imagenet'
)

# Freeze base model layers
base_model.trainable = False

# Add custom classification head
x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(128, activation='relu')(x)
x = Dropout(0.5)(x)
predictions = Dense(train_generator.num_classes, activation='softmax')(x)

# Create final model
model = Model(inputs=base_model.input, outputs=predictions)

# Compile model
model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()
```

### Cell 5: Train the Model
```python
# Train for 20 epochs
history = model.fit(
    train_generator,
    epochs=20,
    validation_data=val_generator,
    verbose=1
)

# Display final metrics
print(f"\n✅ Training Complete!")
print(f"Final Training Accuracy: {history.history['accuracy'][-1]*100:.2f}%")
print(f"Final Validation Accuracy: {history.history['val_accuracy'][-1]*100:.2f}%")
```

### Cell 6: Save and Download Model (IMPORTANT!)
```python
# Save in .keras format (TensorFlow 2.20+ compatible)
model.save('pepper_disease_model_v3.keras')
print("✅ Model saved as pepper_disease_model_v3.keras")

# Save class indices
with open('class_indices.json', 'w') as f:
    json.dump(train_generator.class_indices, f, indent=2)
print("✅ Class indices saved")

# Download both files
files.download('pepper_disease_model_v3.keras')
files.download('class_indices.json')
print("\n✅ Files ready for download!")
print("Look for 'pepper_disease_model_v3.keras' and 'class_indices.json' in your Downloads folder")
```

## After Training in Colab

Once you have the downloaded files, come back here and I'll help you integrate them into your project!

**Expected files:**
- `pepper_disease_model_v3.keras` (~10-11 MB)
- `class_indices.json` (~70 bytes)

---

**Training time:** ~10-15 minutes
**Expected accuracy:** 95-99% validation accuracy
