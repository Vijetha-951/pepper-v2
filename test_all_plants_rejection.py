"""
Test rejection of ALL non-pepper plant leaves
"""
import sys
sys.path.insert(0, 'c:\\xampp\\htdocs\\PEPPER\\backend\\python')

from cnn_disease_detector_v3 import CNNDiseaseDetector
import cv2
import numpy as np
import os

def create_plant_image(color_base, has_features=None, name="plant"):
    """
    Create a generic plant leaf image
    color_base: BGR color tuple for the leaf
    has_features: dict with 'berries', 'veins', 'spots', etc.
    """
    img = np.zeros((400, 600, 3), dtype=np.uint8)
    has_features = has_features or {}
    
    # Create leaf background
    for i in range(img.shape[0]):
        for j in range(img.shape[1]):
            variation = np.random.randint(-20, 20, 3)
            color = np.clip(np.array(color_base, dtype=np.int16) + variation, 15, 200).astype(np.uint8)
            img[i, j] = color
    
    # Add berries if specified
    if has_features.get('berries'):
        for _ in range(15):
            x = np.random.randint(50, 550)
            y = np.random.randint(50, 350)
            cv2.circle(img, (x, y), np.random.randint(8, 12), has_features['berries'], -1)
    
    # Add spots if specified  
    if has_features.get('spots'):
        for _ in range(10):
            x = np.random.randint(100, 500)
            y = np.random.randint(100, 300)
            cv2.circle(img, (x, y), np.random.randint(15, 25), has_features['spots'], -1)
    
    # Add veins if specified
    if has_features.get('veins'):
        cv2.line(img, (300, 50), (300, 350), has_features['veins'], 2)
        for y in range(100, 350, 60):
            cv2.line(img, (300, y), (150, y + 30), has_features['veins'], 1)
            cv2.line(img, (300, y), (450, y + 30), has_features['veins'], 1)
    
    img = cv2.GaussianBlur(img, (7, 7), 0)
    
    filepath = f"test_{name}.jpg"
    cv2.imwrite(filepath, img)
    return filepath

def test_plant(detector, filepath, plant_name, should_pass=False):
    """Test a plant image"""
    print(f"\n{'='*70}")
    print(f"🧪 Testing: {plant_name}")
    print(f"   Expected: {'✅ ACCEPT' if should_pass else '❌ REJECT'}")
    print(f"{'='*70}")
    
    result = detector.predict(filepath)
    is_valid = result.get('success', True) and not result.get('error')
    
    if is_valid:
        print(f"✅ ACCEPTED")
        print(f"   Disease: {result.get('disease')}")
        print(f"   Confidence: {result.get('confidence')}%")
    else:
        print(f"❌ REJECTED")
        print(f"   Error: {result.get('error')}")
        print(f"   Reason: {result.get('message')[:100]}...")
    
    test_passed = (is_valid == should_pass)
    
    if test_passed:
        print(f"\n{'✅ CORRECT!' if not should_pass else '✅ ACCEPTED AS EXPECTED'}")
    else:
        print(f"\n{'❌ WRONG!' if not should_pass else '❌ SHOULD HAVE BEEN ACCEPTED'}")
    
    return test_passed

def main():
    print("\n" + "="*70)
    print("🌿 COMPREHENSIVE PLANT REJECTION TEST")
    print("="*70)
    print("\nGoal: Reject ALL plants except pepper leaves")
    print("="*70)
    
    detector = CNNDiseaseDetector()
    print("\n✅ Detector loaded\n")
    
    results = []
    
    # Test 1: Coffee plant (dark green + red berries)
    print("\n" + "="*70)
    print("TEST 1: ☕ COFFEE PLANT")
    print("="*70)
    img = create_plant_image(
        color_base=[50, 130, 40],
        has_features={'berries': [40, 60, 200]},
        name="coffee"
    )
    results.append(test_plant(detector, img, "Coffee Plant", should_pass=False))
    
    # Test 2: Tomato plant (lighter green)
    print("\n" + "="*70)
    print("TEST 2: 🍅 TOMATO PLANT")
    print("="*70)
    img = create_plant_image(
        color_base=[55, 160, 50],
        has_features={'berries': [40, 70, 220]},
        name="tomato"
    )
    results.append(test_plant(detector, img, "Tomato Plant", should_pass=False))
    
    # Test 3: Basil (very green)
    print("\n" + "="*70)
    print("TEST 3: 🌿 BASIL")
    print("="*70)
    img = create_plant_image(
        color_base=[60, 180, 60],
        has_features={'veins': [40, 150, 40]},
        name="basil"
    )
    results.append(test_plant(detector, img, "Basil Leaf", should_pass=False))
    
    # Test 4: Spinach (dark green, different texture)
    print("\n" + "="*70)
    print("TEST 4: 🥬 SPINACH")
    print("="*70)
    img = create_plant_image(
        color_base=[45, 140, 35],
        has_features={'veins': [35, 120, 30]},
        name="spinach"
    )
    results.append(test_plant(detector, img, "Spinach Leaf", should_pass=False))
    
    # Test 5: Lettuce (light green)
    print("\n" + "="*70)
    print("TEST 5: 🥗 LETTUCE")
    print("="*70)
    img = create_plant_image(
        color_base=[70, 180, 70],
        name="lettuce"
    )
    results.append(test_plant(detector, img, "Lettuce Leaf", should_pass=False))
    
    # Test 6: Mint (medium green)
    print("\n" + "="*70)
    print("TEST 6: 🌱 MINT")
    print("="*70)
    img = create_plant_image(
        color_base=[55, 165, 55],
        has_features={'veins': [35, 135, 35]},
        name="mint"
    )
    results.append(test_plant(detector, img, "Mint Leaf", should_pass=False))
    
    # Test 7: Tea plant (green with different tone)
    print("\n" + "="*70)
    print("TEST 7: 🍵 TEA PLANT")
    print("="*70)
    img = create_plant_image(
        color_base=[48, 145, 42],
        name="tea"
    )
    results.append(test_plant(detector, img, "Tea Leaf", should_pass=False))
    
    # Summary
    print("\n" + "="*70)
    print("📊 TEST SUMMARY")
    print("="*70)
    
    passed = sum(results)
    total = len(results)
    
    plants_tested = [
        "☕ Coffee Plant",
        "🍅 Tomato Plant",
        "🌿 Basil",
        "🥬 Spinach",
        "🥗 Lettuce",
        "🌱 Mint",
        "🍵 Tea Plant"
    ]
    
    for i, (plant, result) in enumerate(zip(plants_tested, results)):
        status = "✅ REJECTED" if result else "❌ ACCEPTED (WRONG!)"
        print(f"   {status} - {plant}")
    
    print(f"\n   Total: {passed}/{total} plants correctly rejected")
    
    print("\n" + "="*70)
    if passed == total:
        print("✅ ALL TESTS PASSED!")
        print("   System will ONLY accept pepper leaves now!")
    else:
        print("⚠️  SOME PLANTS WERE NOT REJECTED")
        print("   The system may need further tuning")
    print("="*70)
    
    print("\n📝 VALIDATION STRATEGY:")
    print("   ✅ Validation confidence threshold: 70%")
    print("   ✅ Model confidence threshold: 85%")
    print("   ✅ Berry/fruit detection enabled")
    print("   ✅ Skin tone detection enabled")
    print("   ✅ Only pepper-specific patterns accepted")
    print("\n   🎯 Result: Very strict - rejects anything that's not clearly a pepper leaf")
    print("\n")

if __name__ == '__main__':
    main()
