"""
Test to verify that low confidence predictions (like 65%) are rejected
"""
import sys
sys.path.insert(0, 'c:\\xampp\\htdocs\\PEPPER\\backend\\python')

from cnn_disease_detector_v3 import CNNDiseaseDetector
import cv2
import numpy as np

print("\n" + "="*70)
print("🔍 CONFIDENCE THRESHOLD TEST")
print("="*70)

print("\n📝 Testing scenario from user's screenshot:")
print("   - Image: Coffee plant with berries")
print("   - Old behavior: Detected as 'Healthy' with 65% confidence ❌")
print("   - New behavior: Should be REJECTED ✅")
print("\n")

# Create image similar to what user uploaded
print("Creating test image...")
img = np.zeros((400, 600, 3), dtype=np.uint8)

# Green background (leaves)
img[:, :] = [50, 140, 50]
noise = np.random.randint(-15, 15, img.shape, dtype=np.int16)
img = np.clip(img.astype(np.int16) + noise, 20, 180).astype(np.uint8)

# Add red berries all over (coffee style)
for _ in range(20):
    x = np.random.randint(50, 550)
    y = np.random.randint(50, 350)
    cv2.circle(img, (x, y), np.random.randint(8, 12), [40, 60, 200], -1)

img = cv2.GaussianBlur(img, (5, 5), 0)
filepath = "test_65_confidence.jpg"
cv2.imwrite(filepath, img)

print("\n" + "="*70)
print("Running Detection...")
print("="*70)

detector = CNNDiseaseDetector()
result = detector.predict(filepath)

print("\n" + "="*70)
print("📊 RESULT")
print("="*70)

if result.get('success') and not result.get('error'):
    print(f"\n❌ FAIL: Image was ACCEPTED (should be rejected)")
    print(f"   Disease: {result.get('disease')}")
    print(f"   Confidence: {result.get('confidence')}%")
    print("\n   This is WRONG - we don't want to accept other plants!")
else:
    print(f"\n✅ SUCCESS: Image was REJECTED")
    print(f"   Error: {result.get('error')}")
    print(f"   Message: {result.get('message')}")
    if result.get('suggestion'):
        print(f"   Suggestion: {result.get('suggestion')}")
    print("\n   This is CORRECT - other plants should be rejected!")

print("\n" + "="*70)
print("📝 VALIDATION IMPROVEMENTS:")
print("="*70)
print("   ✅ Berry/fruit cluster detection (catches coffee plants)")
print("   ✅ Minimum confidence increased to 75% (from 40%)")
print("   ✅ Better error messages explaining what went wrong")
print("   ✅ Only PEPPER leaves will get disease analysis")
print("\n")
