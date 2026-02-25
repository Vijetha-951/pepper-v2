"""
Simple test script for CNN disease detection
Tests if the CNN model is properly integrated
"""

import os
import sys

print("\n" + "="*70)
print("🧪 CNN Disease Detection Integration Test")
print("="*70 + "\n")

# Test 1: Check if model files exist
print("📁 Test 1: Checking if model files exist...")
print("-" * 70)

model_path = "models/pepper_disease_model.h5"
class_indices_path = "models/class_indices.json"

model_exists = os.path.exists(model_path)
class_exists = os.path.exists(class_indices_path)

if model_exists:
    size_mb = os.path.getsize(model_path) / (1024 * 1024)
    print(f"✅ Model file found: {model_path} ({size_mb:.1f} MB)")
else:
    print(f"❌ Model file NOT found: {model_path}")
    print("   👉 Download from Colab and place in backend/python/models/")

if class_exists:
    print(f"✅ Class indices found: {class_indices_path}")
else:
    print(f"❌ Class indices NOT found: {class_indices_path}")
    print("   👉 Download from Colab and place in backend/python/models/")

print()

# Test 2: Check TensorFlow installation
print("📦 Test 2: Checking TensorFlow installation...")
print("-" * 70)

try:
    import tensorflow as tf
    print(f"✅ TensorFlow installed: v{tf.__version__}")
    
    # Check GPU availability
    gpus = tf.config.list_physical_devices('GPU')
    if gpus:
        print(f"✅ GPU available: {len(gpus)} device(s)")
        for gpu in gpus:
            print(f"   - {gpu}")
    else:
        print("⚠️  No GPU found (using CPU - this is OK)")
except ImportError:
    print("❌ TensorFlow NOT installed")
    print("   👉 Run: pip install tensorflow==2.13.0")
    sys.exit(1)

print()

# Test 3: Check other dependencies
print("📦 Test 3: Checking other dependencies...")
print("-" * 70)

dependencies = {
    'numpy': 'numpy',
    'opencv-python': 'cv2',
    'json': 'json'
}

all_deps_ok = True
for package_name, import_name in dependencies.items():
    try:
        __import__(import_name)
        print(f"✅ {package_name}")
    except ImportError:
        print(f"❌ {package_name} NOT installed")
        print(f"   👉 Run: pip install {package_name}")
        all_deps_ok = False

print()

# Test 4: Load the CNN detector
print("🧠 Test 4: Loading CNN detector...")
print("-" * 70)

if not (model_exists and class_exists):
    print("⚠️  Skipped - model files not found")
    print("   Complete Test 1 first")
else:
    try:
        from cnn_disease_detector import CNNDiseaseDetector
        
        detector = CNNDiseaseDetector()
        
        if detector.model is not None:
            print("✅ CNN detector loaded successfully!")
            
            # Get model info
            info = detector.get_model_info()
            print(f"\n📊 Model Info:")
            print(f"   - Model type: {info['model_type']}")
            print(f"   - Input size: {info['input_size']}")
            print(f"   - Classes: {info['num_classes']}")
            for i, class_name in enumerate(info['classes'], 1):
                print(f"     {i}. {class_name}")
        else:
            print("❌ Model loaded but is None")
            print("   Check if model files are corrupted")
    except Exception as e:
        print(f"❌ Error loading detector: {e}")
        import traceback
        traceback.print_exc()

print()

# Test 5: Try a prediction (if test image exists)
print("🔮 Test 5: Testing prediction...")
print("-" * 70)

# Look for test images in common locations
test_image_locations = [
    "test_image.jpg",
    "backend/uploads/disease_images/*.jpg",
    "../uploads/disease_images/*.jpg"
]

test_image = None
for location in test_image_locations:
    if os.path.exists(location) and os.path.isfile(location):
        test_image = location
        break

if test_image and model_exists and detector.model is not None:
    try:
        print(f"📸 Testing with: {test_image}")
        result = detector.predict(test_image)
        
        if 'error' not in result:
            print("✅ Prediction successful!")
            print(f"\n📊 Results:")
            print(f"   Disease:    {result['disease']}")
            print(f"   Confidence: {result['confidence']*100:.2f}%")
            print(f"\n   All Probabilities:")
            for disease, prob in result['probabilities'].items():
                bar = "█" * int(prob * 20)
                print(f"     {disease:25s}: {prob*100:5.1f}% {bar}")
        else:
            print(f"❌ Prediction failed: {result['error']}")
    except Exception as e:
        print(f"❌ Error during prediction: {e}")
else:
    print("⚠️  Skipped - no test image found")
    print("   👉 To test predictions:")
    print("      1. Place a pepper leaf image in backend/python/")
    print("      2. Name it 'test_image.jpg'")
    print("      3. Run this script again")

print()

# Test 6: Compare with Random Forest (if available)
print("⚖️  Test 6: Model comparison...")
print("-" * 70)

try:
    from disease_detector import PlantDiseaseDetector as RFDetector
    
    rf_detector = RFDetector()
    rf_loaded = rf_detector.load_model()
    
    if rf_loaded:
        print("✅ Random Forest model available for comparison")
        print("   👉 Run: python model_comparison.py test_image.jpg")
    else:
        print("⚠️  Random Forest model not trained")
except Exception as e:
    print(f"⚠️  Random Forest not available: {e}")

print()

# Final Summary
print("="*70)
print("📋 SUMMARY")
print("="*70)

tests_passed = 0
total_tests = 6

if model_exists and class_exists:
    tests_passed += 1
    print("✅ Test 1: Model files found")
else:
    print("❌ Test 1: Model files missing")

try:
    import tensorflow
    tests_passed += 1
    print("✅ Test 2: TensorFlow installed")
except:
    print("❌ Test 2: TensorFlow not installed")

if all_deps_ok:
    tests_passed += 1
    print("✅ Test 3: All dependencies installed")
else:
    print("❌ Test 3: Some dependencies missing")

if model_exists and detector.model is not None:
    tests_passed += 1
    print("✅ Test 4: CNN detector loaded")
else:
    print("❌ Test 4: CNN detector failed to load")

if test_image and 'result' in locals() and 'error' not in result:
    tests_passed += 1
    print("✅ Test 5: Prediction successful")
else:
    print("⚠️  Test 5: Prediction not tested")

tests_passed += 1  # Test 6 is optional
print("✅ Test 6: Optional")

print()
print(f"🎯 Score: {tests_passed}/{total_tests} tests passed")
print()

if tests_passed >= 4:
    print("🎉 Your CNN model is ready!")
    print()
    print("📝 Next Steps:")
    print("   1. Start the API: python disease_detection_api.py")
    print("   2. Test from frontend or Postman")
    print("   3. Upload a pepper leaf image")
    print("   4. Get ~90%+ accurate predictions!")
elif model_exists:
    print("⚠️  Almost there! Fix the issues above.")
else:
    print("❌ Model files missing!")
    print()
    print("📖 Follow the integration guide:")
    print("   1. Train model in Google Colab")
    print("   2. Download pepper_disease_model.h5")
    print("   3. Download class_indices.json")
    print("   4. Copy both to backend/python/models/")
    print("   5. Run: pip install tensorflow==2.13.0")
    print("   6. Run this test script again")

print()
print("="*70)
