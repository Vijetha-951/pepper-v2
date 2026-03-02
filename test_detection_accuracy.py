"""
Quick test with real pepper leaf image
"""
import sys
sys.path.insert(0, 'c:\\xampp\\htdocs\\PEPPER\\backend\\python')

from cnn_disease_detector_v3 import CNNDiseaseDetector
import cv2
import numpy as np

def create_realistic_healthy_leaf():
    """Create a more realistic healthy pepper leaf"""
    print("🎨 Creating realistic healthy pepper leaf...")
    
    # Create 600x400 image
    img = np.zeros((400, 600, 3), dtype=np.uint8)
    
    # Healthy pepper green (in BGR)
    base_green = np.array([60, 150, 60], dtype=np.uint8)
    
    # Fill with gradient of green
    for i in range(img.shape[0]):
        for j in range(img.shape[1]):
            variation = np.random.randint(-30, 30, 3)
            color = np.clip(base_green.astype(np.int16) + variation, 10, 220).astype(np.uint8)
            img[i, j] = color
    
    # Add darker veins to make it more realistic
    for i in range(5):
        start_x = np.random.randint(0, 600)
        for y in range(0, 400, 20):
            x = start_x + np.random.randint(-50, 50)
            x = max(0, min(599, x))
            cv2.circle(img, (x, y), 2, (40, 120, 40), -1)
    
    # Add slight yellow tint on edges (natural aging)
    cv2.circle(img, (100, 100), 30, (50, 180, 180), -1, cv2.LINE_AA)
    cv2.circle(img, (500, 300), 40, (50, 180, 180), -1, cv2.LINE_AA)
    
    # Blur to make it more natural
    img = cv2.GaussianBlur(img, (15, 15), 0)
    
    filepath = "realistic_healthy_leaf.jpg"
    cv2.imwrite(filepath, img)
    print(f"✅ Created: {filepath}")
    return filepath

def create_bacterial_spot_leaf():
    """Create a leaf with bacterial spots"""
    print("🎨 Creating bacterial spot leaf...")
    
    # Start with greenish base
    img = np.zeros((400, 600, 3), dtype=np.uint8)
    img[:, :] = [60, 140, 50]
    
    # Add noise
    noise = np.random.randint(-20, 20, img.shape, dtype=np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    
    # Add dark bacterial spots
    num_spots = 15
    for _ in range(num_spots):
        x = np.random.randint(50, 550)
        y = np.random.randint(50, 350)
        radius = np.random.randint(10, 30)
        # Dark brown/black spots
        cv2.circle(img, (x, y), radius, (20, 40, 40), -1)
        # Yellow halo around spots
        cv2.circle(img, (x, y), radius + 5, (50, 180, 180), 2)
    
    # Add some yellowing
    yellow_overlay = np.ones_like(img) * [50, 200, 200]
    img = cv2.addWeighted(img, 0.7, yellow_overlay, 0.3, 0)
    
    img = cv2.GaussianBlur(img, (5, 5), 0)
    
    filepath = "bacterial_spot_leaf.jpg"
    cv2.imwrite(filepath, img)
    print(f"✅ Created: {filepath}")
    return filepath

def test():
    print("\n" + "="*70)
    print("🧪 TESTING IMPROVED DETECTION LOGIC")
    print("="*70)
    
    # Load detector
    print("\n[1] Loading detector...")
    detector = CNNDiseaseDetector()
    
    # Test healthy leaf
    print("\n" + "="*70)
    print("TEST 1: Realistic Healthy Leaf")
    print("="*70)
    img = create_realistic_healthy_leaf()
    result = detector.predict(img)
    
    print(f"\n🎯 Prediction: {result.get('disease', 'Error')}")
    print(f"💯 Confidence: {result.get('confidence', 0):.2f}%")
    
    if result.get('probabilities'):
        print("\n📊 Probabilities:")
        for cls, prob in result['probabilities'].items():
            bar = "█" * max(1, int(prob / 5))
            print(f"   {cls:40} {prob:6.2f}% {bar}")
    
    is_healthy = 'healthy' in result.get('disease', '').lower()
    print(f"\n{'✅ PASS' if is_healthy else '❌ FAIL'}: Should be HEALTHY")
    
    # Test diseased leaf
    print("\n" + "="*70)
    print("TEST 2: Bacterial Spot Leaf")
    print("="*70)
    img = create_bacterial_spot_leaf()
    result = detector.predict(img)
    
    print(f"\n🎯 Prediction: {result.get('disease', 'Error')}")
    print(f"💯 Confidence: {result.get('confidence', 0):.2f}%")
    
    if result.get('probabilities'):
        print("\n📊 Probabilities:")
        for cls, prob in result['probabilities'].items():
            bar = "█" * max(1, int(prob / 5))
            print(f"   {cls:40} {prob:6.2f}% {bar}")
    
    is_diseased = 'bacterial' in result.get('disease', '').lower()
    print(f"\n{'✅ PASS' if is_diseased else '❌ FAIL'}: Should be BACTERIAL SPOT")
    
    print("\n" + "="*70)
    print("✅ TESTING COMPLETE")
    print("="*70)

if __name__ == '__main__':
    test()
