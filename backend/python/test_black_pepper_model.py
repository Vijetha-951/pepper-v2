"""
Test Black Pepper Disease Detection Model
Quick script to verify the newly trained model works correctly
"""

import os
import sys
import json
from pathlib import Path

print("="*70)
print("🌿 BLACK PEPPER MODEL TEST")
print("="*70)

# Check if model files exist
models_dir = Path(__file__).parent / 'models'
model_file = models_dir / 'black_pepper_disease_model.keras'
class_file = models_dir / 'black_pepper_class_indices.json'

print("\n📂 Checking files...")
print(f"Model directory: {models_dir}")

files_ok = True

if model_file.exists():
    size_mb = model_file.stat().st_size / (1024 * 1024)
    print(f"✅ Model file found: {model_file.name} ({size_mb:.2f} MB)")
else:
    print(f"❌ Model file NOT found: {model_file}")
    files_ok = False

if class_file.exists():
    print(f"✅ Class file found: {class_file.name}")
    print("\n📋 Disease classes:")
    with open(class_file, 'r') as f:
        class_indices = json.load(f)
    for class_name, idx in sorted(class_indices.items(), key=lambda x: x[1]):
        print(f"   {idx}. {class_name}")
else:
    print(f"❌ Class file NOT found: {class_file}")
    files_ok = False

if not files_ok:
    print("\n❌ ERROR: Required files are missing!")
    print("\nPlease ensure you copied these files from Colab:")
    print("  - black_pepper_disease_model.keras")
    print("  - black_pepper_class_names.json")
    sys.exit(1)

print("\n" + "="*70)
print("🔧 TESTING MODEL LOADING...")
print("="*70)

try:
    import tensorflow as tf
    from tensorflow import keras
    
    print(f"\n📦 TensorFlow version: {tf.__version__}")
    
    # Load model
    print("\n⏳ Loading model...")
    model = keras.models.load_model(str(model_file))
    print("✅ Model loaded successfully!")
    
    # Print model info
    print(f"\n📊 Model Information:")
    print(f"   Input shape: {model.input_shape}")
    print(f"   Output shape: {model.output_shape}")
    print(f"   Total parameters: {model.count_params():,}")
    print(f"   Number of layers: {len(model.layers)}")
    
    # Get expected number of classes
    output_classes = model.output_shape[-1]
    print(f"   Output classes: {output_classes}")
    
    # Verify class count matches
    if output_classes == len(class_indices):
        print(f"✅ Class count matches ({output_classes} classes)")
    else:
        print(f"⚠️  WARNING: Model expects {output_classes} classes but {len(class_indices)} classes defined!")
    
    print("\n" + "="*70)
    print("✅ MODEL TEST PASSED!")
    print("="*70)
    
    print("\n🎉 Your Black Pepper model is ready!")
    print("\n📝 Next steps:")
    print("   1. Start the Disease Detection API:")
    print("      python disease_detection_api.py")
    print("\n   2. Test with a Black Pepper leaf image")
    print("      (Upload through the web interface)")
    print("\n   3. Make sure to select 'Black Pepper' as pepper type")
    
except ImportError as e:
    print(f"\n❌ ERROR: Missing required library: {e}")
    print("\nPlease install: pip install tensorflow")
    sys.exit(1)
    
except Exception as e:
    print(f"\n❌ ERROR: Failed to load model!")
    print(f"Error: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "="*70)
