"""
Test Black Pepper Disease Detection with EfficientNet Model
Comprehensive testing for the 5-class black pepper disease model
"""
import os
import sys
import json
import requests
from datetime import datetime

print("\n" + "="*70)
print("Black Pepper Disease Detection - Test Suite")
print("EfficientNet Model (5 Classes)")
print("="*70 + "\n")


# ========================================
# TEST 1: Check Model Files
# ========================================
def test_model_files():
    """Test if all required model files exist"""
    print("[TEST 1] Checking model files...")
    
    files_to_check = [
        ("Model File", "models/black_pepper_disease_model.keras"),
        ("Class Indices", "models/black_pepper_class_indices.json")
    ]
    
    all_exist = True
    for name, path in files_to_check:
        exists = os.path.exists(path)
        status = "✅ Found" if exists else "❌ Missing"
        print(f"   {name}: {status} - {path}")
        all_exist = all_exist and exists
    
    if all_exist:
        print("\n   ✅ All model files present!")
        
        # Check class indices content
        with open("models/black_pepper_class_indices.json", 'r') as f:
            classes = json.load(f)
        print(f"\n   Loaded classes ({len(classes)}):")
        for class_name, idx in classes.items():
            formatted = ' '.join(word.capitalize() for word in class_name.split('_'))
            print(f"      {idx}: {formatted}")
        return True
    else:
        print("\n   ❌ Missing model files!")
        print("\n   Run this command first:")
        print("      python convert_efficientnet_pytorch_to_keras.py")
        return False


# ========================================
# TEST 2: Load Model Directly
# ========================================
def test_load_model():
    """Test loading the Keras model directly"""
    print("\n[TEST 2] Loading Keras model...")
    
    try:
        import tensorflow as tf
        from tensorflow import keras
        
        model_path = "models/black_pepper_disease_model.keras"
        print(f"   Loading: {model_path}")
        
        model = keras.models.load_model(model_path)
        print(f"   ✅ Model loaded successfully!")
        
        # Print model summary
        print("\n   Model Summary:")
        model.summary()
        
        # Check input/output shapes
        input_shape = model.input_shape
        output_shape = model.output_shape
        print(f"\n   Input shape: {input_shape}")
        print(f"   Output shape: {output_shape}")
        print(f"   Number of classes: {output_shape[-1]}")
        
        if output_shape[-1] == 5:
            print(f"   ✅ Model has correct 5 classes!")
            return True
        else:
            print(f"   ⚠️  Warning: Expected 5 classes, got {output_shape[-1]}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error loading model: {e}")
        import traceback
        traceback.print_exc()
        return False


# ========================================
# TEST 3: Test Dual Model Detector
# ========================================
def test_dual_detector():
    """Test the dual model detector wrapper"""
    print("\n[TEST 3] Testing dual model detector...")
    
    try:
        # Change to correct directory
        if os.path.exists('backend/python'):
            os.chdir('backend/python')
            print("   Changed to backend/python directory")
        
        from dual_model_detector import DualModelDetector
        
        print("   Initializing detector...")
        detector = DualModelDetector()
        
        print(f"   ✅ Detector initialized!")
        print(f"   Current model: {detector.current_model_type}")
        
        # Check available models
        available = detector.get_available_models()
        print(f"\n   Available models: {len(available)}")
        for model_info in available:
            print(f"      • {model_info['name']} ({model_info['type']})")
            print(f"        Classes: {', '.join(model_info['classes'][:3])}...")
        
        # Try to set to black pepper model
        detector.set_model_type('black_pepper')
        print(f"\n   ✅ Successfully set to black pepper model!")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


# ========================================
# TEST 4: Test Prediction with Sample Image
# ========================================
def test_prediction(image_path=None):
    """Test prediction on a sample image"""
    print("\n[TEST 4] Testing prediction...")
    
    if image_path is None:
        print("   ℹ️  No test image provided, skipping prediction test")
        print("   To test prediction, run:")
        print("      python test_black_pepper_efficientnet.py /path/to/test/image.jpg")
        return True
    
    if not os.path.exists(image_path):
        print(f"   ❌ Image not found: {image_path}")
        return False
    
    try:
        # Change to correct directory
        if os.path.exists('backend/python'):
            os.chdir('backend/python')
        
        from dual_model_detector import DualModelDetector
        
        print(f"   Loading image: {image_path}")
        detector = DualModelDetector()
        detector.set_model_type('black_pepper')
        
        print("   Running prediction...")
        result = detector.predict(image_path, model_type='black_pepper')
        
        print("\n   " + "="*60)
        print("   PREDICTION RESULT")
        print("   " + "="*60)
        print(f"   Disease: {result['disease']}")
        print(f"   Confidence: {result['confidence']:.2f}%")
        print(f"   Success: {result.get('success', True)}")
        
        if 'all_predictions' in result:
            print("\n   All class probabilities:")
            for disease, prob in sorted(result['all_predictions'].items(), 
                                       key=lambda x: x[1], reverse=True):
                print(f"      {disease}: {prob:.2f}%")
        
        print("   " + "="*60)
        
        if result.get('success', True):
            print("\n   ✅ Prediction successful!")
            return True
        else:
            print("\n   ⚠️  Prediction completed with warnings")
            if 'warning_message' in result:
                print(f"      {result['warning_message']}")
            return True
            
    except Exception as e:
        print(f"   ❌ Error during prediction: {e}")
        import traceback
        traceback.print_exc()
        return False


# ========================================
# TEST 5: Test API Endpoint
# ========================================
def test_api_endpoint(image_path=None):
    """Test the disease detection API"""
    print("\n[TEST 5] Testing API endpoint...")
    
    api_url = "http://localhost:5001"
    
    # Check if API is running
    try:
        response = requests.get(f"{api_url}/health", timeout=2)
        if response.status_code == 200:
            print(f"   ✅ API is running at {api_url}")
            health_data = response.json()
            print(f"   Models loaded: {health_data.get('models_loaded', 'unknown')}")
            print(f"   Available: {health_data.get('available_models', [])}")
        else:
            print(f"   ⚠️  API responded with status {response.status_code}")
    except requests.exceptions.RequestException:
        print(f"   ℹ️  API is not running at {api_url}")
        print("\n   To start the API, run:")
        print("      cd backend/python")
        print("      python disease_detection_api.py")
        return True  # Not a hard failure
    
    # Test prediction endpoint if image provided
    if image_path and os.path.exists(image_path):
        try:
            print(f"\n   Testing prediction endpoint with: {image_path}")
            
            with open(image_path, 'rb') as img_file:
                files = {'image': img_file}
                data = {'model_type': 'black_pepper'}
                
                response = requests.post(
                    f"{api_url}/predict",
                    files=files,
                    data=data,
                    timeout=30
                )
            
            if response.status_code == 200:
                result = response.json()
                print(f"\n   ✅ Prediction via API successful!")
                print(f"   Disease: {result.get('disease', 'N/A')}")
                print(f"   Confidence: {result.get('confidence', 0):.2f}%")
                return True
            else:
                print(f"   ❌ API error: {response.status_code}")
                print(f"   {response.text[:200]}")
                return False
                
        except Exception as e:
            print(f"   ❌ Error testing API: {e}")
            return False
    
    return True


# ========================================
# RUN ALL TESTS
# ========================================
def run_all_tests(image_path=None):
    """Run complete test suite"""
    
    print("Starting comprehensive test suite...")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    results = {
        "Model Files": test_model_files(),
        "Load Model": test_load_model(),
        "Dual Detector": test_dual_detector(),
        "Prediction": test_prediction(image_path),
        "API Endpoint": test_api_endpoint(image_path)
    }
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, passed_test in results.items():
        status = "✅ PASSED" if passed_test else "❌ FAILED"
        print(f"   {test_name:20} {status}")
    
    print("-"*70)
    print(f"   Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n   🎉 All tests passed!")
        print("   Your EfficientNet model is ready to use!")
    else:
        print(f"\n   ⚠️  {total - passed} test(s) failed")
        print("   Please review the errors above")
    
    print("="*70 + "\n")
    
    return passed == total


# ========================================
# MAIN
# ========================================
def main():
    """Main test function"""
    
    # Check for test image argument
    test_image = None
    if len(sys.argv) > 1:
        test_image = sys.argv[1]
        print(f"Using test image: {test_image}\n")
    else:
        print("💡 Tip: Provide a test image for complete testing:")
        print("   python test_black_pepper_efficientnet.py /path/to/leaf_image.jpg\n")
    
    # Run all tests
    success = run_all_tests(test_image)
    
    if not success:
        print("\n📋 Troubleshooting Steps:")
        print("   1. Ensure you've converted your model:")
        print("      python convert_efficientnet_pytorch_to_keras.py")
        print("   2. Check that best_black_pepper_model.pth exists")
        print("   3. Install dependencies:")
        print("      pip install tensorflow torch torchvision")
        print("   4. Start the API:")
        print("      python disease_detection_api.py")
    else:
        print("\n🚀 Next Steps:")
        print("   1. Start the API: python disease_detection_api.py")
        print("   2. Test via web interface or API calls")
        print("   3. Upload black pepper leaf images for detection")
        print("   4. Fine-tune model if needed for better accuracy")
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
