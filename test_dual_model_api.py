"""
Test script for Dual Model Disease Detection API
Tests both Bell Pepper and Black Pepper models
"""

import requests
import json

BASE_URL = 'http://localhost:5001'

def print_section(title):
    """Print a section header"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_health_check():
    """Test health check endpoint"""
    print_section("1. Health Check")
    
    try:
        response = requests.get(f'{BASE_URL}/health')
        data = response.json()
        
        print(f"Status: {data.get('status')}")
        print(f"Service: {data.get('service')}")
        print(f"Models Loaded: {data.get('models_loaded')}")
        print(f"Available Models: {data.get('available_models')}")
        print(f"Current Model: {data.get('current_model')}")
        print("✅ Health check passed!")
        return True
        
    except Exception as e:
        print(f"❌ Health check failed: {str(e)}")
        return False

def test_get_models():
    """Test getting available models"""
    print_section("2. Available Models")
    
    try:
        response = requests.get(f'{BASE_URL}/models')
        data = response.json()
        
        print(f"Current Model: {data.get('current_model')}")
        print(f"\nAvailable Models:")
        for model in data.get('models', []):
            print(f"\n  Type: {model['type']}")
            print(f"  Name: {model['name']}")
            print(f"  Classes: {', '.join(model['classes'])}")
        
        print("✅ Models retrieved successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Failed to get models: {str(e)}")
        return False

def test_model_info():
    """Test model info endpoint"""
    print_section("3. Model Information")
    
    try:
        response = requests.get(f'{BASE_URL}/model-info')
        data = response.json()
        
        print(f"Model Type: {data.get('model_type')}")
        print(f"Current Model: {data.get('current_model_name')}")
        print(f"Class Count: {data.get('class_count')}")
        print(f"Supported Formats: {data.get('supported_formats')}")
        print(f"Max File Size: {data.get('max_file_size')}")
        
        print("✅ Model info retrieved successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Failed to get model info: {str(e)}")
        return False

def test_predict_with_url(pepper_type='black_pepper'):
    """Test prediction with URL"""
    print_section(f"4. Test Prediction - {pepper_type.replace('_', ' ').title()}")
    
    # Sample image URLs
    test_urls = {
        'bell_pepper': 'https://www.researchgate.net/publication/358987628/figure/fig1/AS:1129596795793410@1646328271744/Sample-bell-pepper-leaves-for-healthy-left-and-bacteria-spot-disease-right.jpg',
        'black_pepper': 'https://example.com/black-pepper-leaf.jpg'  # Replace with actual URL
    }
    
    image_url = test_urls.get(pepper_type)
    
    try:
        payload = {
            'image_url': image_url,
            'pepper_type': pepper_type
        }
        
        print(f"Testing with URL: {image_url}")
        print(f"Pepper Type: {pepper_type}")
        
        response = requests.post(
            f'{BASE_URL}/predict-url',
            json=payload,
            timeout=30
        )
        
        data = response.json()
        
        if data.get('success'):
            pred = data.get('prediction', {})
            disease_info = pred.get('disease_info', {})
            metadata = pred.get('metadata', {})
            
            print(f"\n✅ Prediction Successful!")
            print(f"\nDisease: {disease_info.get('name')}")
            print(f"Confidence: {pred.get('confidence')}%")
            print(f"Model Used: {metadata.get('model_name')} ({metadata.get('model_type')})")
            print(f"\nDescription: {disease_info.get('description')}")
            print(f"Severity: {disease_info.get('severity')}")
            
            print(f"\nAll Predictions:")
            for p in pred.get('all_predictions', []):
                print(f"  - {p['disease']}: {p['probability']:.2f}%")
            
            return True
        else:
            print(f"❌ Prediction failed: {data.get('error')}")
            print(f"   Message: {data.get('message')}")
            return False
            
    except Exception as e:
        print(f"❌ Prediction error: {str(e)}")
        return False

def test_file_upload(pepper_type='black_pepper', file_path=None):
    """Test prediction with file upload"""
    print_section(f"5. Test File Upload - {pepper_type.replace('_', ' ').title()}")
    
    if not file_path:
        print("⚠️  No test file provided. Skipping file upload test.")
        print("   To test file upload, provide a file path:")
        print(f"   test_file_upload('{pepper_type}', 'path/to/image.jpg')")
        return False
    
    try:
        with open(file_path, 'rb') as f:
            files = {'image': f}
            data = {'pepper_type': pepper_type}
            
            print(f"Uploading file: {file_path}")
            print(f"Pepper Type: {pepper_type}")
            
            response = requests.post(
                f'{BASE_URL}/predict',
                files=files,
                data=data,
                timeout=30
            )
            
            result = response.json()
            
            if result.get('success'):
                pred = result.get('prediction', {})
                disease_info = pred.get('disease_info', {})
                metadata = pred.get('metadata', {})
                
                print(f"\n✅ Prediction Successful!")
                print(f"\nDisease: {disease_info.get('name')}")
                print(f"Confidence: {pred.get('confidence')}%")
                print(f"Model Used: {metadata.get('model_name')} ({metadata.get('model_type')})")
                
                return True
            else:
                print(f"❌ Prediction failed: {result.get('error')}")
                return False
                
    except FileNotFoundError:
        print(f"❌ File not found: {file_path}")
        return False
    except Exception as e:
        print(f"❌ Upload error: {str(e)}")
        return False

def run_all_tests():
    """Run all tests"""
    print("\n" + "🌶️"*30)
    print("   DUAL MODEL DISEASE DETECTION API - TEST SUITE")
    print("🌶️"*30)
    
    results = []
    
    # Test health check
    results.append(("Health Check", test_health_check()))
    
    # Test get models
    results.append(("Get Models", test_get_models()))
    
    # Test model info
    results.append(("Model Info", test_model_info()))
    
    # Test prediction with bell pepper model
    results.append(("Bell Pepper URL Test", test_predict_with_url('bell_pepper')))
    
    # Test prediction with black pepper model
    # results.append(("Black Pepper URL Test", test_predict_with_url('black_pepper')))
    
    # Print summary
    print_section("TEST SUMMARY")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:30} {status}")
    
    print(f"\n{passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")

if __name__ == '__main__':
    print("\n📋 Testing Dual Model Disease Detection API")
    print("🔗 API Base URL:", BASE_URL)
    print("\n⚠️  Make sure the API is running on port 5001!")
    print("   Run: python backend/python/disease_detection_api.py\n")
    
    import time
    time.sleep(2)
    
    run_all_tests()
    
    print("\n" + "="*60)
    print("Testing complete!")
    print("="*60)
    
    print("\n📝 Usage Examples:")
    print("\n1. Predict with Bell Pepper model:")
    print("   POST http://localhost:5001/predict")
    print("   Body: image file + pepper_type='bell_pepper'")
    
    print("\n2. Predict with Black Pepper model:")
    print("   POST http://localhost:5001/predict")
    print("   Body: image file + pepper_type='black_pepper'")
    
    print("\n3. Get available models:")
    print("   GET http://localhost:5001/models")
    
    print("\n4. If pepper_type is not specified, defaults to 'black_pepper'")
    print()
