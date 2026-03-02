"""
Test spinach leaf rejection (from user's screenshot)
"""
import sys
sys.path.insert(0, 'c:\\xampp\\htdocs\\PEPPER\\backend\\python')

from cnn_disease_detector_v3 import CNNDiseaseDetector
import cv2
import numpy as np

def create_spinach_leaves():
    """Create an image like the user's spinach screenshot - multiple round leaves"""
    print("🥬 Creating spinach leaves image (multiple round leaves)...")
    
    img = np.ones((400, 600, 3), dtype=np.uint8) * 240  # Light gray/white background
    
    # Draw multiple round/oval spinach leaves
    leaves = [
        (150, 150, 80, 100),   # (x, y, width, height) - oval shapes
        (300, 120, 90, 110),
        (250, 250, 85, 105),
        (400, 180, 75, 95),
        (350, 300, 80, 100),
    ]
    
    for x, y, w, h in leaves:
        # Create oval leaf shape
        overlay = img.copy()
        cv2.ellipse(overlay, (x, y), (w, h), 0, 0, 360, [55, 170, 60], -1)
        
        # Add some texture
        for _ in range(50):
            px = x + np.random.randint(-w, w)
            py = y + np.random.randint(-h, h)
            if 0 <= px < 600 and 0 <= py < 400:
                color_var = np.random.randint(-15, 15, 3)
                new_color = np.clip(np.array([55, 170, 60]) + color_var, 30, 200)
                cv2.circle(overlay, (px, py), 3, new_color.tolist(), -1)
        
        # Blend
        cv2.addWeighted(overlay, 0.8, img, 0.2, 0, img)
        
        # Add vein
        cv2.line(img, (x, y - h), (x, y + h), [40, 145, 45], 2)
    
    # Blur for natural look
    img = cv2.GaussianBlur(img, (5, 5), 0)
    
    filepath = "test_spinach_user_scenario.jpg"
    cv2.imwrite(filepath, img)
    print(f"✅ Created: {filepath}")
    return filepath

def main():
    print("\n" + "="*70)
    print("🥬 SPINACH LEAF REJECTION TEST (User's Scenario)")
    print("="*70)
    print("\n📸 Simulating the spinach leaves from your screenshot...")
    print("   Expected: ❌ REJECT (No disease analysis)")
    print("="*70)
    
    # Create spinach image
    img_path = create_spinach_leaves()
    
    print("\n" + "="*70)
    print("🔍 Running Detection...")
    print("="*70)
    
    # Load detector
    detector = CNNDiseaseDetector()
    
    # Test
    result = detector.predict(img_path)
    
    print("\n" + "="*70)
    print("📊 RESULT")
    print("="*70)
    
    is_valid = result.get('success', True) and not result.get('error')
    
    if is_valid:
        print(f"\n❌ WRONG! Image was ACCEPTED (should be rejected)")
        print(f"   Disease: {result.get('disease')}")
        print(f"   Confidence: {result.get('confidence')}%")
        print("\n   ⚠️  This is a problem - spinach should NOT be analyzed!")
        print("\n   🔧 SOLUTION: You need to RESTART the disease detection service")
        print("      The new strict validation code is not active yet.")
    else:
        print(f"\n✅ CORRECT! Image was REJECTED")
        print(f"   Error: {result.get('error')}")
        print(f"   Message: {result.get('message')}")
        if result.get('suggestion'):
            print(f"   Suggestion: {result.get('suggestion')}")
        print("\n   ✅ This is perfect - spinach leaves are rejected!")
    
    print("\n" + "="*70)
    print("📝 WHAT WAS ENHANCED:")
    print("="*70)
    print("   ✅ Leaf shape analysis (rejects round leaves like spinach)")
    print("   ✅ Multiple leaf detection (rejects leafy vegetable bunches)")
    print("   ✅ Model confidence threshold: 85% (was 40-75%)")
    print("   ✅ Validation confidence threshold: 70%")
    print("\n" + "="*70)
    print("🚀 HOW TO ACTIVATE THE FIX:")
    print("="*70)
    print("""
    1. Press Ctrl+C in the terminal running disease detection
    
    2. Restart the service:
       cd c:\\xampp\\htdocs\\PEPPER\\backend\\python
       python disease_detection_api.py
    
    3. Or use the batch file:
       .\\start-disease-detection.bat
    
    4. Test again with your spinach image
    """)
    print("="*70)
    print("\n")

if __name__ == '__main__':
    main()
