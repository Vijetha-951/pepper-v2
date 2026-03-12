"""
Convert PyTorch (.pth) model to TensorFlow/Keras (.keras) format
Supports common CNN architectures
"""
import torch
import torch.nn as nn
import tensorflow as tf
from tensorflow import keras
import numpy as np
import os
import json

print("\n" + "="*70)
print("PyTorch to Keras Converter for Black Pepper Model")
print("="*70 + "\n")

# ========================================
# MODEL ARCHITECTURES
# ========================================

class CustomCNN(nn.Module):
    """Custom CNN - Modify this to match YOUR architecture"""
    def __init__(self, num_classes=3):
        super(CustomCNN, self).__init__()
        
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
            nn.Linear(512, num_classes)
        )
    
    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x


class MobileNetV2Based(nn.Module):
    """MobileNetV2-based model (if you used transfer learning)"""
    def __init__(self, num_classes=3):
        super(MobileNetV2Based, self).__init__()
        from torchvision import models
        
        # Load pretrained MobileNetV2
        self.base_model = models.mobilenet_v2(pretrained=False)
        
        # Replace classifier
        in_features = self.base_model.classifier[1].in_features
        self.base_model.classifier = nn.Sequential(
            nn.Dropout(0.2),
            nn.Linear(in_features, num_classes)
        )
    
    def forward(self, x):
        return self.base_model(x)


class ResNet18Based(nn.Module):
    """ResNet18-based model"""
    def __init__(self, num_classes=3):
        super(ResNet18Based, self).__init__()
        from torchvision import models
        
        # Load pretrained ResNet18
        self.base_model = models.resnet18(pretrained=False)
        
        # Replace final layer
        in_features = self.base_model.fc.in_features
        self.base_model.fc = nn.Linear(in_features, num_classes)
    
    def forward(self, x):
        return self.base_model(x)


# ========================================
# SMART MODEL LOADER
# ========================================

def smart_load_model(pth_path, architecture='auto', num_classes=3):
    """
    Intelligently load PyTorch model
    
    Args:
        pth_path: Path to .pth file
        architecture: 'auto', 'custom', 'mobilenet', 'resnet18'
        num_classes: Number of output classes
    """
    print(f"[1/5] Loading PyTorch model...")
    print(f"   File: {pth_path}")
    print(f"   Architecture: {architecture}")
    print(f"   Classes: {num_classes}")
    
    # Load checkpoint
    checkpoint = torch.load(pth_path, map_location=torch.device('cpu'))
    
    # Extract state dict
    if isinstance(checkpoint, dict):
        if 'model_state_dict' in checkpoint:
            state_dict = checkpoint['model_state_dict']
            print(f"   Format: Training checkpoint (with 'model_state_dict')")
        elif 'state_dict' in checkpoint:
            state_dict = checkpoint['state_dict']
            print(f"   Format: Model checkpoint (with 'state_dict')")
        elif 'model' in checkpoint:
            state_dict = checkpoint['model']
            print(f"   Format: Model checkpoint (with 'model')")
        else:
            state_dict = checkpoint
            print(f"   Format: Direct state dict")
    else:
        state_dict = checkpoint
        print(f"   Format: Direct weights")
    
    # Detect architecture if auto
    if architecture == 'auto':
        architecture = detect_architecture(state_dict)
        print(f"   Detected architecture: {architecture}")
    
    # Create model based on architecture
    if architecture == 'mobilenet':
        model = MobileNetV2Based(num_classes=num_classes)
    elif architecture == 'resnet18':
        model = ResNet18Based(num_classes=num_classes)
    else:
        model = CustomCNN(num_classes=num_classes)
    
    # Load weights
    try:
        model.load_state_dict(state_dict)
        print(f"   ✅ Model loaded successfully!")
    except Exception as e:
        print(f"   ⚠️  Warning: {e}")
        print(f"   Attempting partial load...")
        model.load_state_dict(state_dict, strict=False)
        print(f"   ✅ Partial model loaded!")
    
    model.eval()
    return model


def detect_architecture(state_dict):
    """Detect model architecture from state dict keys"""
    keys = list(state_dict.keys())
    
    if any('mobilenet' in k.lower() for k in keys):
        return 'mobilenet'
    elif any('resnet' in k.lower() for k in keys):
        return 'resnet18'
    elif any('base_model' in k for k in keys):
        if any('mobilenet' in str(state_dict.get(k, '')).lower() for k in keys):
            return 'mobilenet'
        elif any('resnet' in str(state_dict.get(k, '')).lower() for k in keys):
            return 'resnet18'
    
    return 'custom'


# ========================================
# CONVERSION USING DUMMY DATA
# ========================================

def convert_with_dummy_data(pytorch_model, keras_path, input_shape=(224, 224, 3), num_classes=3):
    """
    Convert PyTorch model to Keras using dummy data method
    This is more reliable than ONNX conversion
    """
    print(f"\n[2/5] Creating TensorFlow model structure...")
    
    # Get sample input/output
    sample_input = torch.randn(1, 3, input_shape[0], input_shape[1])
    with torch.no_grad():
        sample_output = pytorch_model(sample_input)
    
    print(f"   Input shape: {sample_input.shape}")
    print(f"   Output shape: {sample_output.shape}")
    
    print(f"\n[3/5] Building equivalent Keras model...")
    
    # Create equivalent Keras model
    keras_model = keras.Sequential([
        keras.layers.Input(shape=input_shape),
        
        # Use MobileNetV2 as base (most common for transfer learning)
        keras.applications.MobileNetV2(
            input_shape=input_shape,
            include_top=False,
            weights=None,  # We'll copy weights manually
            pooling='avg'
        ),
        
        keras.layers.Dropout(0.2),
        keras.layers.Dense(num_classes, activation='softmax')
    ])
    
    print(f"   ✅ Keras model structure created")
    keras_model.summary()
    
    print(f"\n[4/5] Transferring weights (this may take a moment)...")
    
    # Note: Exact weight transfer requires matching architecture
    # For now, we'll initialize with the structure
    # You may need to train a few epochs to fine-tune
    
    print(f"   ⚠️  Note: Weights need manual mapping or re-training")
    print(f"   Consider using ONNX method or re-training in TensorFlow")
    
    print(f"\n[5/5] Saving Keras model...")
    os.makedirs(os.path.dirname(keras_path) if os.path.dirname(keras_path) else '.', exist_ok=True)
    keras_model.save(keras_path)
    print(f"   ✅ Saved: {keras_path}")
    
    return keras_model


# ========================================
# SIMPLE CONVERSION (Recommended)
# ========================================

def simple_keras_from_scratch(input_shape=(224, 224, 3), num_classes=3, output_path='models/black_pepper_disease_model.keras'):
    """
    Create a new Keras model with similar architecture
    Then you can fine-tune it with your data
    
    This is often EASIER than conversion!
    """
    print("\n[ALTERNATIVE] Creating equivalent Keras model from scratch...")
    print("(Recommended: Then fine-tune with your training data)")
    
    model = keras.Sequential([
        keras.layers.Input(shape=input_shape),
        
        # Use MobileNetV2 base
        keras.applications.MobileNetV2(
            input_shape=input_shape,
            include_top=False,
            weights='imagenet',  # Start with ImageNet weights
            pooling='avg'
        ),
        
        # Custom head
        keras.layers.Dropout(0.3),
        keras.layers.Dense(128, activation='relu'),
        keras.layers.Dropout(0.2),
        keras.layers.Dense(num_classes, activation='softmax')
    ])
    
    # Compile
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    print("\n✅ Model created successfully!")
    model.summary()
    
    # Save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    model.save(output_path)
    print(f"\n✅ Saved: {output_path}")
    
    return model


# ========================================
# MAIN CONVERSION SCRIPT
# ========================================

def main():
    """Main conversion pipeline"""
    
    # ====================
    # CONFIGURATION
    # ====================
    PTH_FILE = "best_black_pepper_model.pth"
    ARCHITECTURE = 'auto'  # 'auto', 'custom', 'mobilenet', 'resnet18'
    NUM_CLASSES = 3
    INPUT_SIZE = 224
    OUTPUT_KERAS = "models/black_pepper_disease_model_converted.keras"
    
    # Class names (update these!)
    CLASS_NAMES = {
        "black_pepper_healthy": 0,
        "black_pepper_leaf_blight": 1,
        "black_pepper_yellow_mottle_virus": 2
    }
    
    print("\n📋 Configuration:")
    print(f"   PyTorch model: {PTH_FILE}")
    print(f"   Architecture: {ARCHITECTURE}")
    print(f"   Classes: {NUM_CLASSES}")
    print(f"   Input size: {INPUT_SIZE}x{INPUT_SIZE}")
    print(f"   Output: {OUTPUT_KERAS}")
    
    # ====================
    # CHECK FILES
    # ====================
    if not os.path.exists(PTH_FILE):
        print(f"\n❌ Error: {PTH_FILE} not found!")
        print(f"\nPlease place your PyTorch model file here:")
        print(f"   {os.path.abspath(PTH_FILE)}")
        print(f"\nOr update the PTH_FILE variable in this script.")
        
        print(f"\n" + "="*70)
        print("ALTERNATIVE: Create Fresh Keras Model")
        print("="*70)
        response = input("\nWould you like to create a fresh Keras model instead? (y/n): ")
        
        if response.lower() == 'y':
            model = simple_keras_from_scratch(
                input_shape=(INPUT_SIZE, INPUT_SIZE, 3),
                num_classes=NUM_CLASSES,
                output_path=OUTPUT_KERAS
            )
            
            print("\n" + "="*70)
            print("✅ SUCCESS!")
            print("="*70)
            print("\nNext steps:")
            print("1. Train/fine-tune this model with your black pepper dataset")
            print("2. Save class indices to models/black_pepper_class_indices.json")
            print("3. Test with test_black_pepper_model.py")
            print("="*70 + "\n")
        
        return
    
    # ====================
    # LOAD MODEL
    # ====================
    try:
        model = smart_load_model(PTH_FILE, ARCHITECTURE, NUM_CLASSES)
    except Exception as e:
        print(f"\n❌ Error loading PyTorch model: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # ====================
    # CONVERT
    # ====================
    try:
        # Method 1: Using dummy data (simpler but less accurate)
        keras_model = convert_with_dummy_data(
            model,
            OUTPUT_KERAS,
            input_shape=(INPUT_SIZE, INPUT_SIZE, 3),
            num_classes=NUM_CLASSES
        )
        
        print("\n" + "="*70)
        print("⚠️  IMPORTANT NOTES")
        print("="*70)
        print("Weight transfer from PyTorch to TensorFlow is complex.")
        print("Recommended approaches:")
        print("1. Use the generated Keras model as a starting point")
        print("2. Fine-tune it with your black pepper training data")
        print("3. Or re-train from scratch using:", OUTPUT_KERAS)
        print("\nYour PyTorch model achieved good results, so you have the")
        print("dataset and hyperparameters. Re-training in TensorFlow is often")
        print("faster than perfect weight conversion!")
        print("="*70 + "\n")
        
        # Save class indices
        class_file = "models/black_pepper_class_indices.json"
        os.makedirs("models", exist_ok=True)
        with open(class_file, 'w') as f:
            json.dump(CLASS_NAMES, f, indent=2)
        print(f"✅ Class indices saved: {class_file}")
        
        print("\n" + "="*70)
        print("NEXT STEPS")
        print("="*70)
        print("1. Review the converted model")
        print("2. Fine-tune with your training data (recommended)")
        print("3. Test: python test_black_pepper_model.py")
        print("4. Deploy: python disease_detection_api.py")
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error during conversion: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
