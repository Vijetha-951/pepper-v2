# 🔥 PyTorch Model Integration Guide

You have a trained PyTorch model (`best_black_pepper_model.pth`) and need to integrate it into your PEPPER project.

## Current System Architecture

Your project uses **TensorFlow/Keras** models:
- Bell Pepper: `pepper_disease_model_v3.keras`
- Black Pepper: `black_pepper_disease_model.keras`

---

## ✅ **OPTION 1: Convert PyTorch to TensorFlow (RECOMMENDED)**

### Why This Option?
- ✅ Maintains consistency (your entire system uses TensorFlow)
- ✅ No code changes needed to disease detection API
- ✅ Works with existing `dual_model_detector.py`
- ✅ Simpler deployment

### Step 1: Install Required Packages

```bash
cd c:\xampp\htdocs\PEPPER\backend\python
pip install torch torchvision onnx onnx-tf tensorflow
```

### Step 2: Create Conversion Script

Create `convert_pytorch_to_tf.py`:

```python
"""
Convert PyTorch (.pth) model to TensorFlow (.keras) format
"""
import torch
import torch.nn as nn
import tensorflow as tf
from tensorflow import keras
import onnx
from onnx_tf.backend import prepare
import numpy as np
import os
import json

# ========================================
# STEP 1: Define Your PyTorch Model Architecture
# ========================================
# ⚠️ IMPORTANT: This must match EXACTLY how you trained your model!

class BlackPepperCNN(nn.Module):
    """
    Define your black pepper CNN architecture here
    This is an EXAMPLE - replace with YOUR actual architecture!
    """
    def __init__(self, num_classes=3):
        super(BlackPepperCNN, self).__init__()
        
        # Example architecture - REPLACE WITH YOUR ACTUAL MODEL!
        self.features = nn.Sequential(
            # Conv Block 1
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
            
            # Conv Block 2
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
            
            # Conv Block 3
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=2, stride=2),
        )
        
        self.classifier = nn.Sequential(
            nn.AdaptiveAvgPool2d((7, 7)),
            nn.Flatten(),
            nn.Linear(128 * 7 * 7, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes),
            nn.Softmax(dim=1)
        )
    
    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x


# ========================================
# STEP 2: Load PyTorch Model
# ========================================
def load_pytorch_model(pth_path, num_classes=3):
    """Load the PyTorch model from .pth file"""
    print(f"[1/4] Loading PyTorch model from: {pth_path}")
    
    # Create model instance with same architecture
    model = BlackPepperCNN(num_classes=num_classes)
    
    # Load weights
    checkpoint = torch.load(pth_path, map_location=torch.device('cpu'))
    
    # Handle different checkpoint formats
    if isinstance(checkpoint, dict):
        if 'model_state_dict' in checkpoint:
            model.load_state_dict(checkpoint['model_state_dict'])
            print(f"   Loaded from 'model_state_dict'")
        elif 'state_dict' in checkpoint:
            model.load_state_dict(checkpoint['state_dict'])
            print(f"   Loaded from 'state_dict'")
        else:
            model.load_state_dict(checkpoint)
            print(f"   Loaded state dict directly")
    else:
        model.load_state_dict(checkpoint)
        print(f"   Loaded weights directly")
    
    model.eval()  # Set to evaluation mode
    print(f"   ✅ PyTorch model loaded successfully!")
    return model


# ========================================
# STEP 3: Convert to ONNX (Intermediate Format)
# ========================================
def convert_to_onnx(pytorch_model, onnx_path, input_size=(1, 3, 224, 224)):
    """Convert PyTorch model to ONNX format"""
    print(f"\n[2/4] Converting PyTorch -> ONNX")
    
    # Create dummy input
    dummy_input = torch.randn(*input_size)
    
    # Export to ONNX
    torch.onnx.export(
        pytorch_model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=12,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        }
    )
    print(f"   ✅ ONNX model saved: {onnx_path}")
    return onnx_path


# ========================================
# STEP 4: Convert ONNX to TensorFlow
# ========================================
def convert_onnx_to_tf(onnx_path, tf_path):
    """Convert ONNX model to TensorFlow SavedModel format"""
    print(f"\n[3/4] Converting ONNX -> TensorFlow")
    
    # Load ONNX model
    onnx_model = onnx.load(onnx_path)
    
    # Convert to TensorFlow
    tf_rep = prepare(onnx_model)
    
    # Export as SavedModel
    tf_rep.export_graph(tf_path)
    print(f"   ✅ TensorFlow SavedModel saved: {tf_path}")
    return tf_path


# ========================================
# STEP 5: Convert to Keras Format
# ========================================
def convert_to_keras(tf_path, keras_path):
    """Convert TensorFlow SavedModel to Keras .keras format"""
    print(f"\n[4/4] Converting TensorFlow -> Keras")
    
    # Load TensorFlow SavedModel
    model = tf.saved_model.load(tf_path)
    
    # Create a Keras model wrapper
    class KerasWrapper(keras.Model):
        def __init__(self, saved_model):
            super().__init__()
            self.saved_model = saved_model
        
        def call(self, inputs):
            return self.saved_model(inputs)
    
    keras_model = KerasWrapper(model)
    
    # Save as .keras format
    keras_model.save(keras_path)
    print(f"   ✅ Keras model saved: {keras_path}")
    return keras_path


# ========================================
# MAIN CONVERSION PIPELINE
# ========================================
def main():
    print("\n" + "="*60)
    print("PyTorch to TensorFlow/Keras Converter")
    print("="*60 + "\n")
    
    # File paths
    pth_path = "best_black_pepper_model.pth"  # Your PyTorch model
    onnx_path = "temp_black_pepper_model.onnx"
    tf_path = "temp_black_pepper_model_tf"
    keras_path = "models/black_pepper_disease_model_pytorch.keras"
    
    # Check if source file exists
    if not os.path.exists(pth_path):
        print(f"❌ Error: {pth_path} not found!")
        print(f"   Please place your PyTorch model in the current directory.")
        return
    
    try:
        # Step 1: Load PyTorch model
        pytorch_model = load_pytorch_model(pth_path, num_classes=3)
        
        # Step 2: Convert to ONNX
        convert_to_onnx(pytorch_model, onnx_path)
        
        # Step 3: Convert ONNX to TensorFlow
        convert_onnx_to_tf(onnx_path, tf_path)
        
        # Step 4: Convert to Keras
        convert_to_keras(tf_path, keras_path)
        
        print("\n" + "="*60)
        print("✅ CONVERSION SUCCESSFUL!")
        print("="*60)
        print(f"Output: {keras_path}")
        print("\nNext steps:")
        print("1. Replace black_pepper_disease_model.keras with your new model")
        print("2. Update class indices JSON if classes changed")
        print("3. Test the model with test_black_pepper_model.py")
        print("="*60 + "\n")
        
        # Cleanup temporary files
        if os.path.exists(onnx_path):
            os.remove(onnx_path)
        if os.path.exists(tf_path):
            import shutil
            shutil.rmtree(tf_path)
        
    except Exception as e:
        print(f"\n❌ Error during conversion: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
```

### Step 3: Prepare Class Names

Create `class_names_mapping.json` with your class labels:

```json
{
  "0": "black_pepper_healthy",
  "1": "black_pepper_leaf_blight",
  "2": "black_pepper_yellow_mottle_virus"
}
```

### Step 4: Run Conversion

```bash
# Place your best_black_pepper_model.pth in backend/python/
cd c:\xampp\htdocs\PEPPER\backend\python

# Run conversion
python convert_pytorch_to_tf.py
```

### Step 5: Update Class Indices

Update `models/black_pepper_class_indices.json`:

```json
{
  "black_pepper_healthy": 0,
  "black_pepper_leaf_blight": 1,
  "black_pepper_yellow_mottle_virus": 2
}
```

### Step 6: Test Your Model

```bash
python test_black_pepper_model.py
```

### Step 7: Restart API

```bash
python disease_detection_api.py
```

---

## 🔥 **OPTION 2: Add Native PyTorch Support**

### Why This Option?
- ✅ Keep your model in its native format
- ✅ No quality loss from conversion
- ❌ Requires more code changes
- ❌ Two different frameworks in one project

### Step 1: Install PyTorch

```bash
cd c:\xampp\htdocs\PEPPER\backend\python
pip install torch torchvision
```

### Step 2: Create PyTorch Model Loader

I can create a `pytorch_black_pepper_detector.py` that:
- Loads your `.pth` model
- Provides the same interface as the TensorFlow detector
- Integrates with your existing API

### Step 3: Modify Dual Model Detector

Update `dual_model_detector.py` to support both TensorFlow and PyTorch models.

---

## 📋 **Which Option Should You Choose?**

| Criteria | Option 1 (Convert) | Option 2 (PyTorch Support) |
|----------|-------------------|---------------------------|
| Simplicity | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Consistency | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Code Changes | ✅ None | ❌ Significant |
| Model Quality | ⚠️ Possible small loss | ✅ No loss |
| Deployment | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**My Recommendation: Option 1** - It's cleaner and maintains your existing architecture.

---

## 🚨 Important Notes

### For Option 1:
1. **Model Architecture Must Match**: The PyTorch architecture in the conversion script must EXACTLY match how you trained the model
2. **Input Size**: Ensure the input size (e.g., 224x224) matches your training
3. **Number of Classes**: Verify num_classes matches your dataset
4. **Preprocessing**: Ensure normalization/preprocessing matches training

### For Option 2:
1. I can help you implement the full PyTorch integration if needed
2. This adds about 200 lines of code
3. Requires careful testing

---

## ❓ What Do You Need?

Please tell me:
1. **Which option do you prefer?** (1 or 2)
2. **What's your model architecture?** (ResNet? Custom CNN? MobileNet?)
3. **How many classes?** (2, 3, more?)
4. **Input image size?** (224x224? 256x256?)

I'll then customize the implementation for your specific model! 🚀
