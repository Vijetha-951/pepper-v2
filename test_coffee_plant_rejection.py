"""
Test rejection of coffee plants and other similar plants
"""
import sys
sys.path.insert(0, 'c:\\xampp\\htdocs\\PEPPER\\backend\\python')

from cnn_disease_detector_v3 import CNNDiseaseDetector
import cv2
import numpy as np
import os

def create_coffee_plant_image():
    """Create an image simulating a coffee plant with berries"""
    print("☕ Creating coffee plant image (should be rejected)...")
    
    img = np.zeros((400, 600, 3), dtype=np.uint8)
    
    # Green leaves background
    for i in range(img.shape[0]):
        for j in range(img.shape[1]):
            variation = np.random.randint(-20, 20, 3)
            color = np.clip(np.array([50, 140, 50], dtype=np.int16) + variation, 20, 180).astype(np.uint8)
            img[i, j] = color
    
    # Add coffee berries (red/brown clusters)
    berry_positions = [
        (100, 80), (150, 100), (180, 90), (120, 120),
        (300, 150), (350, 170), (380, 160), (320, 190),
        (200, 250), (250, 270), (280, 260), (220, 290),
        (450, 300), (500, 320), (480, 340), (460, 360)
    ]
    
    for x, y in berry_positions:
        # Red/brown berries
        radius = np.random.randint(8, 15)
        colors = [[40, 50, 200], [60, 80, 180], [80, 100, 160]]  # Red, Reddish, Brown-red
        color = colors[np.random.randint(0, 3)]
        cv2.circle(img, (x, y), radius, color, -1)
        # Add highlight
        cv2.circle(img, (x-3, y-3), 3, [100, 150, 255], -1)
    
    # Blur for natural look
    img = cv2.GaussianBlur(img, (5, 5), 0)
    
    filepath = "test_coffee_plant.jpg"
    cv2.imwrite(filepath, img)
    print(f"✅ Created: {filepath}")
    return filepath

def create_tomato_plant_image():
    """Create an image simulating a tomato plant"""
    print("🍅 Creating tomato plant image (should be rejected)...")
    
    img = np.zeros((400, 600, 3), dtype=np.uint8)
    
    # Slightly different green tone for tomato
    for i in range(img.shape[0]):
        for j in range(img.shape[1]):
            variation = np.random.randint(-15, 15, 3)
            color = np.clip(np.array([45, 150, 55], dtype=np.int16) + variation, 25, 190).astype(np.uint8)
            img[i, j] = color
    
    # Add tomatoes (large red objects)
    tomato_positions = [(200, 150), (400, 200), (300, 300)]
    
    for x, y in tomato_positions:
        radius = np.random.randint(25, 35)
        cv2.circle(img, (x, y), radius, [40, 60, 220], -1)  # Red tomato
        # Highlight
        cv2.circle(img, (x-8, y-8), 8, [80, 120, 255], -1)
    
    img = cv2.GaussianBlur(img, (7, 7), 0)
    
    filepath = "test_tomato_plant.jpg"
    cv2.imwrite(filepath, img)
    print(f"✅ Created: {filepath}")
    return filepath

def create_pepper_leaf_closeup():
    """Create a proper pepper leaf close-up"""
    print("🌶️ Creating pepper leaf close-up (should be accepted)...")
    
    img = np.zeros((400, 600, 3), dtype=np.uint8)
    
    # Healthy pepper green
    for i in range(img.shape[0]):
        for j in range(img.shape[1]):
            # Create leaf shape gradient
            center_dist = np.sqrt((i - 200)**2 + (j - 300)**2)
            brightness_factor = max(0.7, 1 - center_dist / 400)
            
            variation = np.random.randint(-15, 15, 3)
            base_color = np.array([45, 165, 45], dtype=np.int16)
            color = np.clip((base_color * brightness_factor).astype(np.int16) + variation, 25, 200).astype(np.uint8)
            img[i, j] = color
    
    # Add prominent leaf veins (darker green)
    cv2.line(img, (300, 50), (300, 350), (30, 130, 30), 3)  # Main vein
    
    # Side veins
    for y in range(100, 350, 50):
        x_offset = np.random.randint(-20, 20)
        cv2.line(img, (300, y), (150 + x_offset, y + 30), (30, 130, 30), 2)
        cv2.line(img, (300, y), (450 + x_offset, y + 30), (30, 130, 30), 2)
    
    # Slight blur for natural look
    img = cv2.GaussianBlur(img, (7, 7), 0)
    
    filepath = "test_pepper_closeup.jpg"
    cv2.imwrite(filepath, img)
    print(f"✅ Created: {filepath}")
    return filepath

def test_image(detector, image_path, should_pass=True, description=""):
    """Test an image"""
    print(f"\n{'='*70}")
    print(f"🧪 Testing: {description}")
    print(f"   File: {os.path.basename(image_path)}")
    print(f"   Expected: {'✅ ACCEPT' if should_pass else '❌ REJECT'}")
    print(f"{'='*70}")
    
    result = detector.predict(image_path)
    
    is_valid = result.get('success', True) and not result.get('error')
    
    if is_valid:
        print(f"\n✅ ACCEPTED")
        print(f"   Disease: {result.get('disease', 'Unknown')}")
        print(f"   Confidence: {result.get('confidence', 0):.2f}%")
    else:
        print(f"\n❌ REJECTED")
        print(f"   Error: {result.get('error', 'Unknown error')}")
        print(f"   Message: {result.get('message', 'No message')}")
        if result.get('suggestion'):
            print(f"   Suggestion: {result.get('suggestion')}")
    
    # Check if result matches expectation
    test_passed = (is_valid == should_pass)
    
    print(f"\n{'='*70}")
    if test_passed:
        print(f"✅ TEST PASSED!")
    else:
        print(f"❌ TEST FAILED! Expected {'accept' if should_pass else 'reject'}, got {'accept' if is_valid else 'reject'}")
    print(f"{'='*70}")
    
    return test_passed

def main():
    print("\n" + "="*70)
    print("☕ COFFEE PLANT & OTHER CROPS REJECTION TEST")
    print("="*70)
    
    # Initialize detector
    print("\n[1] Loading CNN Disease Detector...")
    detector = CNNDiseaseDetector()
    print("✅ Detector loaded\n")
    
    results = []
    
    # Test 1: Coffee plant (should reject)
    print("\n" + "="*70)
    print("TEST 1: Coffee Plant with Berries")
    print("="*70)
    img = create_coffee_plant_image()
    results.append(("Coffee Plant", test_image(detector, img, should_pass=False, description="Coffee plant with red berries")))
    
    # Test 2: Tomato plant (should reject)
    print("\n" + "="*70)
    print("TEST 2: Tomato Plant")
    print("="*70)
    img = create_tomato_plant_image()
    results.append(("Tomato Plant", test_image(detector, img, should_pass=False, description="Tomato plant with tomatoes")))
    
    # Test 3: Pepper leaf closeup (should accept)
    print("\n" + "="*70)
    print("TEST 3: Pepper Leaf Close-up")
    print("="*70)
    img = create_pepper_leaf_closeup()
    results.append(("Pepper Leaf", test_image(detector, img, should_pass=True, description="Close-up of pepper leaf with veins")))
    
    # Summary
    print("\n" + "="*70)
    print("📊 TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status} - {test_name}")
    
    print(f"\n   Total: {passed}/{total} tests passed")
    
    print("\n" + "="*70)
    print("✅ TESTING COMPLETE")
    print("="*70)
    
    print("\n📝 NEW VALIDATION RULES:")
    print("   ✅ Detects berry/fruit clusters (coffee, etc.)")
    print("   ✅ Counts small circular objects (berries)")
    print("   ✅ Requires 75%+ model confidence (up from 40%)")
    print("   ✅ Rejects low-confidence predictions even if image looks green")
    print("\n")

if __name__ == '__main__':
    main()
