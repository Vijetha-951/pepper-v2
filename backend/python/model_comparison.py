"""
Compare Random Forest vs CNN Disease Detection Models
"""

import time
import os
from disease_detector import PlantDiseaseDetector as RandomForestDetector
from cnn_disease_detector import CNNDiseaseDetector

def format_time(seconds):
    """Format time in milliseconds"""
    return f"{seconds * 1000:.2f}ms"

def compare_models(image_path):
    """Compare both models on the same image"""
    
    if not os.path.exists(image_path):
        print(f"❌ Image not found: {image_path}")
        return
    
    print("\n" + "="*70)
    print("🔬 MODEL COMPARISON: Random Forest vs CNN")
    print("="*70)
    print(f"📸 Testing image: {image_path}\n")
    
    # Initialize models
    print("🔄 Loading models...")
    rf_detector = RandomForestDetector()
    cnn_detector = CNNDiseaseDetector()
    
    # Check if models are loaded
    rf_loaded = rf_detector.load_model()
    cnn_loaded = cnn_detector.model is not None
    
    print(f"  Random Forest: {'✅ Loaded' if rf_loaded else '❌ Not loaded'}")
    print(f"  CNN:          {'✅ Loaded' if cnn_loaded else '❌ Not loaded'}")
    print()
    
    # Random Forest prediction
    if rf_loaded:
        print("🌲 RANDOM FOREST MODEL")
        print("-" * 70)
        
        start_time = time.time()
        rf_result = rf_detector.predict(image_path)
        rf_time = time.time() - start_time
        
        print(f"⏱️  Inference Time: {format_time(rf_time)}")
        print(f"🎯 Prediction: {rf_result.get('disease', 'N/A')}")
        print(f"💯 Confidence: {rf_result.get('confidence', 0)*100:.2f}%")
        print(f"📊 Probabilities:")
        for disease, prob in rf_result.get('probabilities', {}).items():
            bar = "█" * int(prob * 50)
            print(f"  {disease:25s}: {prob*100:6.2f}% {bar}")
        print()
    else:
        print("⚠️  Random Forest model not available\n")
        rf_result = None
        rf_time = 0
    
    # CNN prediction
    if cnn_loaded:
        print("🧠 CNN MODEL (MobileNetV2)")
        print("-" * 70)
        
        start_time = time.time()
        cnn_result = cnn_detector.predict(image_path)
        cnn_time = time.time() - start_time
        
        print(f"⏱️  Inference Time: {format_time(cnn_time)}")
        print(f"🎯 Prediction: {cnn_result.get('disease', 'N/A')}")
        print(f"💯 Confidence: {cnn_result.get('confidence', 0)*100:.2f}%")
        print(f"📊 Probabilities:")
        for disease, prob in cnn_result.get('probabilities', {}).items():
            bar = "█" * int(prob * 50)
            print(f"  {disease:25s}: {prob*100:6.2f}% {bar}")
        print()
    else:
        print("⚠️  CNN model not available")
        print("💡 Train the model in Google Colab first!\n")
        cnn_result = None
        cnn_time = 0
    
    # Comparison summary
    if rf_result and cnn_result:
        print("📊 COMPARISON SUMMARY")
        print("=" * 70)
        
        # Agreement
        rf_pred = rf_result.get('disease', '')
        cnn_pred = cnn_result.get('disease', '')
        agreement = rf_pred == cnn_pred
        
        print(f"🤝 Models Agree: {'✅ YES' if agreement else '❌ NO'}")
        if not agreement:
            print(f"  Random Forest: {rf_pred}")
            print(f"  CNN:           {cnn_pred}")
        
        # Speed comparison
        print(f"\n⚡ Speed:")
        print(f"  Random Forest: {format_time(rf_time)}")
        print(f"  CNN:           {format_time(cnn_time)}")
        faster = "Random Forest" if rf_time < cnn_time else "CNN"
        speedup = max(rf_time, cnn_time) / min(rf_time, cnn_time)
        print(f"  Winner:        {faster} ({speedup:.1f}x faster)")
        
        # Confidence comparison
        rf_conf = rf_result.get('confidence', 0)
        cnn_conf = cnn_result.get('confidence', 0)
        print(f"\n💪 Confidence:")
        print(f"  Random Forest: {rf_conf*100:.2f}%")
        print(f"  CNN:           {cnn_conf*100:.2f}%")
        more_confident = "Random Forest" if rf_conf > cnn_conf else "CNN"
        print(f"  Winner:        {more_confident}")
        
        print("\n" + "=" * 70)
    
    return {
        'rf_result': rf_result,
        'rf_time': rf_time,
        'cnn_result': cnn_result,
        'cnn_time': cnn_time
    }


def batch_compare(image_folder):
    """Compare models on multiple images"""
    
    if not os.path.exists(image_folder):
        print(f"❌ Folder not found: {image_folder}")
        return
    
    # Find all images
    image_extensions = ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG']
    images = []
    for filename in os.listdir(image_folder):
        if any(filename.endswith(ext) for ext in image_extensions):
            images.append(os.path.join(image_folder, filename))
    
    if not images:
        print(f"❌ No images found in: {image_folder}")
        return
    
    print(f"\n📁 Found {len(images)} images\n")
    
    # Compare each image
    results = []
    for i, image_path in enumerate(images, 1):
        print(f"\n{'='*70}")
        print(f"Image {i}/{len(images)}: {os.path.basename(image_path)}")
        print('='*70)
        
        result = compare_models(image_path)
        results.append(result)
    
    # Overall statistics
    print("\n" + "="*70)
    print("📊 OVERALL STATISTICS")
    print("="*70)
    
    # Agreement rate
    agreements = sum(1 for r in results 
                    if r['rf_result'] and r['cnn_result'] 
                    and r['rf_result'].get('disease') == r['cnn_result'].get('disease'))
    total_compared = sum(1 for r in results if r['rf_result'] and r['cnn_result'])
    
    if total_compared > 0:
        agreement_rate = (agreements / total_compared) * 100
        print(f"🤝 Agreement Rate: {agreement_rate:.1f}% ({agreements}/{total_compared})")
    
    # Average times
    rf_times = [r['rf_time'] for r in results if r['rf_time'] > 0]
    cnn_times = [r['cnn_time'] for r in results if r['cnn_time'] > 0]
    
    if rf_times:
        avg_rf_time = sum(rf_times) / len(rf_times)
        print(f"⚡ Avg RF Time:  {format_time(avg_rf_time)}")
    
    if cnn_times:
        avg_cnn_time = sum(cnn_times) / len(cnn_times)
        print(f"⚡ Avg CNN Time: {format_time(avg_cnn_time)}")
    
    # Average confidence
    rf_confs = [r['rf_result'].get('confidence', 0) for r in results if r['rf_result']]
    cnn_confs = [r['cnn_result'].get('confidence', 0) for r in results if r['cnn_result']]
    
    if rf_confs:
        avg_rf_conf = sum(rf_confs) / len(rf_confs)
        print(f"💪 Avg RF Confidence:  {avg_rf_conf*100:.2f}%")
    
    if cnn_confs:
        avg_cnn_conf = sum(cnn_confs) / len(cnn_confs)
        print(f"💪 Avg CNN Confidence: {avg_cnn_conf*100:.2f}%")
    
    print("="*70)


def print_model_info():
    """Print information about both models"""
    print("\n" + "="*70)
    print("📋 MODEL INFORMATION")
    print("="*70 + "\n")
    
    # Random Forest info
    print("🌲 RANDOM FOREST MODEL")
    print("-" * 70)
    print("Algorithm:       RandomForestClassifier")
    print("Features:        12 handcrafted features (HSV, texture, color)")
    print("Training:        scikit-learn")
    print("Model Size:      < 1 MB")
    print("Inference:       50-100ms (CPU)")
    print("Accuracy:        70-85% (typical)")
    print("Deployment:      Easy (sklearn only)")
    print()
    
    # CNN info
    print("🧠 CNN MODEL")
    print("-" * 70)
    print("Algorithm:       MobileNetV2 (Transfer Learning)")
    print("Features:        Automatic feature learning")
    print("Training:        TensorFlow/Keras + Google Colab GPU")
    print("Model Size:      ~15 MB")
    print("Inference:       100-200ms (CPU), 20-50ms (GPU)")
    print("Accuracy:        90-95% (typical)")
    print("Deployment:      Needs TensorFlow")
    print()
    
    print("="*70)


if __name__ == '__main__':
    import sys
    
    print("\n🔬 Disease Detection Model Comparison Tool")
    
    # Print model info
    print_model_info()
    
    # Check command line arguments
    if len(sys.argv) < 2:
        print("\n📖 Usage:")
        print("  Compare single image:")
        print("    python model_comparison.py path/to/image.jpg")
        print()
        print("  Compare folder of images:")
        print("    python model_comparison.py path/to/folder/")
        print()
        
        # Try to find test images
        test_folders = [
            'backend/python/test_images',
            'backend/uploads/disease_images',
            'test_images'
        ]
        
        for folder in test_folders:
            if os.path.exists(folder):
                print(f"💡 Found test folder: {folder}")
                print(f"   Run: python model_comparison.py {folder}")
                break
    else:
        path = sys.argv[1]
        
        if os.path.isfile(path):
            # Single image
            compare_models(path)
        elif os.path.isdir(path):
            # Folder of images
            batch_compare(path)
        else:
            print(f"❌ Path not found: {path}")
