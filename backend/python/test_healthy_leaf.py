"""
Test script to verify healthy leaf detection improvements
"""
import sys
sys.path.insert(0, 'c:\\xampp\\htdocs\\PEPPER\\backend\\python')

from cnn_disease_detector_v3 import CNNDiseaseDetector
import os

def test_healthy_detection():
    print("="*70)
    print("🧪 Testing Healthy Leaf Detection")
    print("="*70)
    
    # Initialize detector
    print("\n[1] Loading CNN Model...")
    detector = CNNDiseaseDetector()
    
    # Check model classes
    print(f"\n[2] Model Classes: {list(detector.class_names.values())}")
    
    # Test with image
    print("\n[3] Testing uploaded image...")
    
    # Find the most recent uploaded image (your fresh pepper leaf)
    uploads_dir = 'c:\\xampp\\htdocs\\PEPPER\\backend\\python\\uploads'
    
    if not os.path.exists(uploads_dir):
        print(f"❌ Uploads directory not found: {uploads_dir}")
        return
    
    # Get all image files
    image_files = []
    for ext in ['*.jpg', '*.jpeg', '*.png']:
        import glob
        image_files.extend(glob.glob(os.path.join(uploads_dir, ext)))
    
    if not image_files:
        print("❌ No images found in uploads folder")
        print("Please upload your fresh pepper leaf image first")
        return
    
    # Get most recent file
    latest_image = max(image_files, key=os.path.getctime)
    print(f"\n📸 Testing image: {os.path.basename(latest_image)}")
    
    # Predict
    result = detector.predict(latest_image)
    
    print("\n" + "="*70)
    print("🔬 DETECTION RESULTS")
    print("="*70)
    
    if result.get('success') == False:
        print(f"❌ Error: {result.get('error')}")
        print(f"   Message: {result.get('message')}")
        return
    
    disease = result.get('disease', 'Unknown')
    confidence = result.get('confidence', 0)
    probabilities = result.get('probabilities', {})
    
    print(f"\n🎯 Prediction: {disease}")
    print(f"💯 Confidence: {confidence:.2f}%")
    print(f"\n📊 All Probabilities:")
    for cls, prob in sorted(probabilities.items(), key=lambda x: x[1], reverse=True):
        bar = "█" * int(prob / 5)
        print(f"   {cls:40} {prob:6.2f}% {bar}")
    
    # Verdict
    print("\n" + "="*70)
    if 'healthy' in disease.lower():
        print("✅ VERDICT: Correctly identified as HEALTHY!")
    else:
        print("⚠️  VERDICT: Incorrectly identified as DISEASED")
        print("   This should be a healthy leaf based on the image")
    print("="*70)

if __name__ == '__main__':
    test_healthy_detection()
