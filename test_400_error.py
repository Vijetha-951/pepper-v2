"""
Test script to diagnose 400 Bad Request error
"""
import requests
import io
from PIL import Image
import sys

# Create a simple test image
print("Creating test image...")
img = Image.new('RGB', (224, 224), color='green')
img_bytes = io.BytesIO()
img.save(img_bytes, format='JPEG')
img_bytes.seek(0)

# Test 1: Direct to Python API (port 5001)
print("\n" + "="*60)
print("TEST 1: Direct to Python API (port 5001)")
print("="*60)

try:
    files = {'image': ('test_leaf.jpg', img_bytes, 'image/jpeg')}
    data = {'pepper_type': 'black_pepper'}
    
    response = requests.post(
        'http://localhost:5001/predict',
        files=files,
        data=data,
        timeout=30
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    
except Exception as e:
    print(f"ERROR: {e}")

# Reset image bytes for next test
img_bytes.seek(0)

# Test 2: Through Node.js backend (port 5000)
print("\n" + "="*60)
print("TEST 2: Through Node.js Backend (port 5000)")
print("="*60)

try:
    files = {'image': ('test_leaf.jpg', img_bytes, 'image/jpeg')}
    data = {'pepper_type': 'black_pepper'}
    
    response = requests.post(
        'http://localhost:5000/api/disease-detection/predict',
        files=files,
        data=data,
        timeout=30
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Body: {response.text}")
    
    if response.status_code == 400:
        print("\n❌ 400 Bad Request Error Found!")
        print("This is the error your frontend is getting.")
    
except Exception as e:
    print(f"ERROR: {e}")

# Test 3: Check backends are running
print("\n" + "="*60)
print("TEST 3: Service Health Checks")
print("="*60)

try:
    # Check Node.js
    r1 = requests.get('http://localhost:5000/api/health', timeout=5)
    print(f"✅ Node.js Backend (5000): {r1.json()}")
except Exception as e:
    print(f"❌ Node.js Backend (5000): {e}")

try:
    # Check Python API
    r2 = requests.get('http://localhost:5001/health', timeout=5)
    print(f"✅ Python API (5001): {r2.json()}")
except Exception as e:
    print(f"❌ Python API (5001): {e}")

print("\n" + "="*60)
print("Testing Complete")
print("="*60)
