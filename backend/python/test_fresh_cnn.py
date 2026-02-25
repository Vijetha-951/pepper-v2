"""
Fresh Start: CNN Integration Test
Run this after copying model files to backend/python/models/
"""

import os
import sys

def test_fresh_cnn_integration():
    print("=" * 60)
    print("CNN Integration Test - Fresh Start")
    print("=" * 60)
    
    # Test 1: Check model file exists
    print("\n1️⃣ Checking model file...")
    model_path = "models/pepper_disease_model_v3.keras"
    if os.path.exists(model_path):
        size_mb = os.path.getsize(model_path) / (1024 * 1024)
        print(f"   ✅ Model found: {model_path} ({size_mb:.2f} MB)")
    else:
        print(f"   ❌ Model not found: {model_path}")
        print(f"   Current directory: {os.getcwd()}")
        return False
    
    # Test 2: Check class_indices.json
    print("\n2️⃣ Checking class_indices.json...")
    class_file = "models/class_indices.json"
    if os.path.exists(class_file):
        print(f"   ✅ Class indices found: {class_file}")
    else:
        print(f"   ❌ class_indices.json not found: {class_file}")
        return False
    
    # Test 3: Check TensorFlow
    print("\n3️⃣ Checking TensorFlow...")
    try:
        import tensorflow as tf
        print(f"   ✅ TensorFlow {tf.__version__} installed")
    except ImportError as e:
        print(f"   ❌ TensorFlow not installed: {e}")
        return False
    
    # Test 4: Load CNN model
    print("\n4️⃣ Loading CNN model...")
    try:
        from cnn_disease_detector_v3 import CNNDiseaseDetector
        detector = CNNDiseaseDetector()
        print(f"   ✅ CNN model loaded successfully!")
    except Exception as e:
        print(f"   ❌ Failed to load CNN: {e}")
        return False
    
    # Test 5: Test prediction (if test image exists)
    print("\n5️⃣ Testing prediction...")
    test_images = [
        "test_images/test_leaf.jpg",
        "uploads/test_leaf.jpg",
    ]
    
    test_image = None
    for img_path in test_images:
        if os.path.exists(img_path):
            test_image = img_path
            break
    
    if test_image:
        try:
            result = detector.predict(test_image)
            print(f"   ✅ Prediction successful!")
            print(f"      Disease: {result['disease']}")
            print(f"      Confidence: {result['confidence']:.2f}%")
        except Exception as e:
            print(f"   ❌ Prediction failed: {e}")
            return False
    else:
        print(f"   ⚠️  No test image found, skipping prediction test")
    
    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED! CNN is ready to use!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = test_fresh_cnn_integration()
    sys.exit(0 if success else 1)
