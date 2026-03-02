"""
Test the improved pepper leaf validation
"""
import sys
sys.path.insert(0, 'c:\\xampp\\htdocs\\PEPPER\\backend\\python')

from cnn_disease_detector_v3 import CNNDiseaseDetector
import cv2
import numpy as np
import os

def create_person_image():
    """Create an image simulating a person (with skin tones and blue clothing)"""
    print("🎨 Creating person image (should be rejected)...")
    
    img = np.zeros((400, 300, 3), dtype=np.uint8)
    
    # Blue shirt area (top half)
    img[0:200, :] = [180, 100, 50]  # BGR blue
    
    # Skin tone area (simulating face/arms)
    img[50:150, 100:200] = [180, 150, 210]  # BGR skin tone
    
    # Add some noise
    noise = np.random.randint(-10, 10, img.shape, dtype=np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    
    filepath = "test_person.jpg"
    cv2.imwrite(filepath, img)
    print(f"✅ Created: {filepath}")
    return filepath

def create_pepper_leaf():
    """Create a realistic pepper leaf image"""
    print("🎨 Creating pepper leaf image (should be accepted)...")
    
    img = np.zeros((400, 600, 3), dtype=np.uint8)
    
    # Healthy green pepper leaf color
    for i in range(img.shape[0]):
        for j in range(img.shape[1]):
            variation = np.random.randint(-25, 25, 3)
            color = np.clip(np.array([50, 160, 50], dtype=np.int16) + variation, 20, 200).astype(np.uint8)
            img[i, j] = color
    
    # Add leaf veins (darker green)
    for i in range(8):
        start_x = 300
        for y in range(0, 400, 10):
            x = start_x + np.random.randint(-100, 100)
            x = max(0, min(599, x))
            cv2.circle(img, (x, y), 1, (35, 130, 35), -1)
    
    # Blur for natural look
    img = cv2.GaussianBlur(img, (9, 9), 0)
    
    filepath = "test_pepper_leaf.jpg"
    cv2.imwrite(filepath, img)
    print(f"✅ Created: {filepath}")
    return filepath

def create_screenshot_image():
    """Create an image simulating a screenshot (should be rejected)"""
    print("🎨 Creating screenshot image (should be rejected)...")
    
    img = np.ones((300, 500, 3), dtype=np.uint8) * 250  # White background
    
    # Add some text-like rectangles
    cv2.rectangle(img, (50, 50), (450, 80), (0, 0, 0), 2)
    cv2.rectangle(img, (50, 100), (450, 130), (0, 0, 0), 2)
    cv2.rectangle(img, (50, 150), (450, 180), (0, 0, 0), 2)
    
    filepath = "test_screenshot.jpg"
    cv2.imwrite(filepath, img)
    print(f"✅ Created: {filepath}")
    return filepath

def create_other_plant():
    """Create an image of a different colored plant (should be rejected for low confidence)"""
    print("🎨 Creating non-pepper plant image (should be rejected)...")
    
    img = np.zeros((400, 600, 3), dtype=np.uint8)
    
    # Purple/reddish plant (not pepper-like)
    for i in range(img.shape[0]):
        for j in range(img.shape[1]):
            variation = np.random.randint(-20, 20, 3)
            color = np.clip(np.array([80, 50, 150], dtype=np.int16) + variation, 20, 200).astype(np.uint8)
            img[i, j] = color
    
    img = cv2.GaussianBlur(img, (9, 9), 0)
    
    filepath = "test_other_plant.jpg"
    cv2.imwrite(filepath, img)
    print(f"✅ Created: {filepath}")
    return filepath

def test_image(detector, image_path, should_pass=True):
    """Test an image"""
    print(f"\n{'='*70}")
    print(f"🧪 Testing: {os.path.basename(image_path)}")
    print(f"   Expected: {'✅ ACCEPT' if should_pass else '❌ REJECT'}")
    print(f"{'='*70}")
    
    result = detector.predict(image_path)
    
    is_valid = result.get('success', True) and not result.get('error')
    
    if is_valid:
        print(f"\n✅ ACCEPTED as: {result.get('disease', 'Unknown')}")
        print(f"   Confidence: {result.get('confidence', 0):.2f}%")
    else:
        print(f"\n❌ REJECTED")
        print(f"   Error: {result.get('error', 'Unknown error')}")
        print(f"   Message: {result.get('message', 'No message')}")
    
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
    print("🌿 PEPPER LEAF VALIDATION TEST")
    print("="*70)
    
    # Initialize detector
    print("\n[1] Loading CNN Disease Detector...")
    detector = CNNDiseaseDetector()
    print("✅ Detector loaded\n")
    
    results = []
    
    # Test 1: Person image (should reject)
    print("\n" + "="*70)
    print("TEST 1: Person Photo (Blue Shirt + Skin)")
    print("="*70)
    img = create_person_image()
    results.append(("Person Photo", test_image(detector, img, should_pass=False)))
    
    # Test 2: Screenshot (should reject)
    print("\n" + "="*70)
    print("TEST 2: Screenshot/Document")
    print("="*70)
    img = create_screenshot_image()
    results.append(("Screenshot", test_image(detector, img, should_pass=False)))
    
    # Test 3: Other plant (should reject)
    print("\n" + "="*70)
    print("TEST 3: Non-Pepper Plant (Purple/Red)")
    print("="*70)
    img = create_other_plant()
    results.append(("Other Plant", test_image(detector, img, should_pass=False)))
    
    # Test 4: Real pepper leaf (should accept)
    print("\n" + "="*70)
    print("TEST 4: Pepper Leaf")
    print("="*70)
    img = create_pepper_leaf()
    results.append(("Pepper Leaf", test_image(detector, img, should_pass=True)))
    
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
    
    print("\n📝 VALIDATION RULES IMPLEMENTED:")
    print("   ✅ Rejects photos of people (skin tone detection)")
    print("   ✅ Rejects screenshots/documents (white background)")
    print("   ✅ Rejects artificial objects (blue clothing/sky)")
    print("   ✅ Requires at least 20% green content")
    print("   ✅ Validates leaf-like texture and edges")
    print("\n")

if __name__ == '__main__':
    main()
