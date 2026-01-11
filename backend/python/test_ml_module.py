"""
Test script to verify ML module is working correctly
"""

import sys
import os

def test_imports():
    """Test if all required packages are installed"""
    print("Testing package imports...")
    try:
        import numpy
        import pandas
        import sklearn
        import flask
        import flask_cors
        print("✓ All required packages installed")
        return True
    except ImportError as e:
        print(f"✗ Missing package: {e}")
        print("\nInstall missing packages with:")
        print("  pip install -r requirements.txt")
        return False

def test_training_data():
    """Test if training data exists"""
    print("\nTesting training data...")
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'pepper_training_data.csv')
    
    if os.path.exists(data_path):
        print(f"✓ Training data found: {data_path}")
        return True
    else:
        print(f"✗ Training data not found: {data_path}")
        print("\nGenerate training data with:")
        print("  python generate_pepper_training_data.py")
        return False

def test_models():
    """Test if trained models exist"""
    print("\nTesting trained models...")
    models_dir = os.path.join(os.path.dirname(__file__), 'models')
    
    required_files = [
        'yield_model.pkl',
        'suitability_model.pkl',
        'scaler.pkl',
        'label_encoders.pkl',
        'feature_columns.pkl'
    ]
    
    all_exist = True
    for filename in required_files:
        filepath = os.path.join(models_dir, filename)
        if os.path.exists(filepath):
            print(f"✓ {filename}")
        else:
            print(f"✗ {filename} not found")
            all_exist = False
    
    if not all_exist:
        print("\nTrain models with:")
        print("  python pepper_yield_predictor.py")
        return False
    
    print("✓ All model files found")
    return True

def test_prediction():
    """Test making a prediction"""
    print("\nTesting prediction...")
    try:
        from pepper_yield_predictor import PepperYieldPredictor
        
        predictor = PepperYieldPredictor()
        
        # Load models
        if not predictor.load_models():
            print("✗ Failed to load models")
            return False
        
        # Make test prediction
        test_input = {
            'soil_type': 'Loamy',
            'water_availability': 'High',
            'irrigation_frequency': 4,
            'crop_stage': 'Fruiting'
        }
        
        result = predictor.predict(test_input)
        
        # Validate result
        required_keys = [
            'predicted_yield_kg',
            'soil_suitability',
            'suitability_confidence',
            'irrigation_recommendation',
            'fertilizer_recommendation',
            'additional_tips'
        ]
        
        all_keys_present = all(key in result for key in required_keys)
        
        if all_keys_present:
            print("✓ Prediction successful")
            print(f"  Yield: {result['predicted_yield_kg']} kg/plant")
            print(f"  Suitability: {result['soil_suitability']}")
            return True
        else:
            print("✗ Prediction result incomplete")
            return False
            
    except Exception as e:
        print(f"✗ Prediction failed: {e}")
        return False

def test_api_imports():
    """Test if Flask API can be imported"""
    print("\nTesting Flask API...")
    try:
        import pepper_ml_api
        print("✓ Flask API can be imported")
        return True
    except Exception as e:
        print(f"✗ Flask API import failed: {e}")
        return False

def main():
    print("="*60)
    print("Pepper ML Module - Verification Test")
    print("="*60)
    
    results = []
    
    # Run all tests
    results.append(("Package Installation", test_imports()))
    
    if results[-1][1]:  # Only continue if packages are installed
        results.append(("Training Data", test_training_data()))
        results.append(("Trained Models", test_models()))
        
        if results[-1][1]:  # Only test prediction if models exist
            results.append(("Prediction", test_prediction()))
        
        results.append(("Flask API", test_api_imports()))
    
    # Print summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    
    for test_name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    all_passed = all(result[1] for result in results)
    
    print("\n" + "="*60)
    if all_passed:
        print("✅ ALL TESTS PASSED!")
        print("\nYour ML module is ready to use.")
        print("\nNext steps:")
        print("1. Start the Flask API:")
        print("   python pepper_ml_api.py")
        print("\n2. Test the API:")
        print("   curl http://localhost:5001/health")
    else:
        print("❌ SOME TESTS FAILED")
        print("\nFollow the instructions above to fix the issues.")
        print("\nOr run the automated setup:")
        print("   python setup_ml_module.py")
    print("="*60)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
