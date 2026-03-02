"""
Test the improved healthy leaf detection logic
"""
import sys
import os
sys.path.insert(0, 'c:\\xampp\\htdocs\\PEPPER\\backend\\python')

from cnn_disease_detector_v3 import CNNDiseaseDetector
import urllib.request
import cv2
import numpy as np

def download_test_image():
    """Download a healthy pepper leaf image for testing"""
    print("📥 Downloading test healthy pepper leaf image...")
    
    # Healthy pepper leaf URL from PlantVillage dataset
    url = "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Pepper__bell___healthy/0a7a870a-46a6-4bd2-9790-bc3fe6dcaed7___JR_HL%200192.JPG"
    
    filepath = "test_healthy_pepper.jpg"
    
    try:
        urllib.request.urlretrieve(url, filepath)
        print(f"✅ Downloaded: {filepath}")
        return filepath
    except Exception as e:
        print(f"❌ Download failed: {e}")
        return None

def create_synthetic_healthy_leaf():
    """Create a synthetic healthy green leaf image"""
    print("🎨 Creating synthetic healthy leaf image...")
    
    # Create a 500x500 image with vibrant green color
    img = np.zeros((500, 500, 3), dtype=np.uint8)
    
    # Fill with healthy green color (HSV converted to BGR)
    # Healthy pepper leaves are bright green
    img[:, :] = [50, 180, 50]  # BGR green color
    
    # Add some natural variation
    noise = np.random.randint(-20, 20, img.shape, dtype=np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    
    # Add some leaf texture (veins)
    for i in range(10):
        x1, y1 = np.random.randint(0, 500, 2)
        x2, y2 = np.random.randint(0, 500, 2)
        cv2.line(img, (x1, y1), (x2, y2), (40, 160, 40), 2)
    
    filepath = "synthetic_healthy_leaf.jpg"
    cv2.imwrite(filepath, img)
    print(f"✅ Created: {filepath}")
    return filepath

def test_image(detector, image_path, expected="healthy"):
    """Test an image with the detector"""
    print(f"\n{'='*70}")
    print(f"🧪 Testing: {os.path.basename(image_path)}")
    print(f"{'='*70}")
    
    if not os.path.exists(image_path):
        print(f"❌ Image not found: {image_path}")
        return False
    
    # Run prediction
    print("🔍 Running prediction...")
    result = detector.predict(image_path)
    
    # Display results
    print(f"\n{'='*70}")
    print("📊 RESULTS")
    print(f"{'='*70}")
    
    if result.get('success') == False:
        print(f"❌ Error: {result.get('error')}")
        print(f"   Message: {result.get('message')}")
        return False
    
    disease = result.get('disease', 'Unknown')
    confidence = result.get('confidence', 0)
    probabilities = result.get('probabilities', {})
    
    print(f"\n🎯 Prediction: {disease}")
    print(f"💯 Confidence: {confidence:.2f}%")
    print(f"\n📊 All Probabilities:")
    for cls, prob in sorted(probabilities.items(), key=lambda x: x[1], reverse=True):
        bar = "█" * max(1, int(prob / 5))
        status = "✅" if prob > 50 else "  "
        print(f"   {status} {cls:40} {prob:6.2f}% {bar}")
    
    # Check if prediction matches expected
    is_healthy = 'healthy' in disease.lower()
    expected_healthy = expected.lower() == 'healthy'
    
    print(f"\n{'='*70}")
    if is_healthy == expected_healthy:
        print(f"✅ PASS: Correctly identified as {expected.upper()}!")
    else:
        print(f"❌ FAIL: Expected {expected.upper()}, got {disease}")
    print(f"{'='*70}")
    
    return is_healthy == expected_healthy

def main():
    print(f"\n{'='*70}")
    print("🌿 HEALTHY LEAF DETECTION - IMPROVEMENT TEST")
    print(f"{'='*70}\n")
    
    # Initialize detector
    print("[1] Loading CNN Disease Detector...")
    try:
        detector = CNNDiseaseDetector()
        print(f"✅ Model loaded successfully")
        print(f"   Classes: {list(detector.class_names.values())}")
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        return
    
    # Test 1: Real healthy leaf from internet
    print(f"\n{'='*70}")
    print("TEST 1: Real Healthy Pepper Leaf (from PlantVillage)")
    print(f"{'='*70}")
    test_img = download_test_image()
    if test_img:
        test_image(detector, test_img, expected="healthy")
    
    # Test 2: Synthetic healthy leaf
    print(f"\n{'='*70}")
    print("TEST 2: Synthetic Healthy Leaf")
    print(f"{'='*70}")
    test_img = create_synthetic_healthy_leaf()
    if test_img:
        test_image(detector, test_img, expected="healthy")
    
    # Test 3: User's uploaded image (if exists)
    print(f"\n{'='*70}")
    print("TEST 3: User's Uploaded Image")
    print(f"{'='*70}")
    
    uploads_dir = 'c:\\xampp\\htdocs\\PEPPER\\backend\\uploads\\disease_images'
    if os.path.exists(uploads_dir):
        import glob
        images = glob.glob(os.path.join(uploads_dir, '*.*'))
        if images:
            latest = max(images, key=os.path.getctime)
            test_image(detector, latest, expected="healthy")
        else:
            print("ℹ️  No uploaded images found")
    else:
        print("ℹ️  Uploads folder doesn't exist yet")
    
    print(f"\n{'='*70}")
    print("✅ TESTING COMPLETE")
    print(f"{'='*70}\n")
    
    print("📝 WHAT WAS FIXED:")
    print("   1. Added logic to check if probabilities are close → defaults to HEALTHY")
    print("   2. Visual validation: checks for green color and dark spots")
    print("   3. Overrides false bacterial spot predictions for healthy-looking leaves")
    print(f"\n{'='*70}\n")

if __name__ == '__main__':
    main()
