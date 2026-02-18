"""
Train Disease Detection Model with Real Images
Uses downloaded Kaggle dataset to train the model
"""

import os
import sys
import cv2
import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from disease_detector import PlantDiseaseDetector
import pickle

def load_images_from_directory(dataset_path, max_images_per_class=1000):
    """
    Load images from organized directory structure
    
    Expected structure:
    dataset_path/
        Healthy/
            img1.jpg
            img2.jpg
        Bacterial Spot/
            img1.jpg
            img2.jpg
        Yellow Leaf Curl/
            img1.jpg
        Nutrient Deficiency/
            img1.jpg
    """
    print("\n" + "="*70)
    print("📂 LOADING IMAGES FROM DATASET")
    print("="*70)
    
    dataset_path = Path(dataset_path)
    
    if not dataset_path.exists():
        print(f"❌ Dataset path not found: {dataset_path}")
        return None, None
    
    # Our disease categories
    categories = ['Healthy', 'Bacterial Spot', 'Yellow Leaf Curl', 'Nutrient Deficiency']
    
    X = []  # Features
    y = []  # Labels
    
    detector = PlantDiseaseDetector()
    
    for category in categories:
        category_path = dataset_path / category
        
        if not category_path.exists():
            print(f"⚠️  Warning: Category '{category}' not found, skipping...")
            continue
        
        # Get all image files
        image_files = []
        for ext in ['.jpg', '.jpeg', '.png', '.bmp', '.gif']:
            image_files.extend(list(category_path.glob(f'*{ext}')))
            image_files.extend(list(category_path.glob(f'*{ext.upper()}')))
        
        print(f"\n{category}:")
        print(f"  Found: {len(image_files)} images")
        
        # Limit images per class
        if len(image_files) > max_images_per_class:
            image_files = image_files[:max_images_per_class]
            print(f"  Using: {max_images_per_class} images (limited)")
        else:
            print(f"  Using: {len(image_files)} images")
        
        loaded = 0
        failed = 0
        
        for img_path in image_files:
            try:
                # Extract features using the detector's method
                features = detector.extract_features(str(img_path))
                X.append(features)
                y.append(category)
                loaded += 1
                
                # Progress indicator
                if loaded % 100 == 0:
                    print(f"    Processed: {loaded}/{len(image_files)}", end='\r')
            
            except Exception as e:
                failed += 1
                if failed <= 5:  # Show first 5 errors
                    print(f"    Error processing {img_path.name}: {e}")
        
        print(f"    ✅ Loaded: {loaded} images, Failed: {failed}")
    
    if len(X) == 0:
        print("\n❌ No images were loaded!")
        return None, None
    
    print(f"\n✅ Total images loaded: {len(X)}")
    print(f"   Feature shape: {X[0].shape}")
    
    return np.array(X), np.array(y)

def train_with_real_images(dataset_path, save_path='backend/python/models/disease_model_real.pkl'):
    """Train model with real images"""
    print("\n" + "="*70)
    print("🤖 TRAINING MODEL WITH REAL IMAGES")
    print("="*70)
    
    # Load images
    X, y = load_images_from_directory(dataset_path)
    
    if X is None or len(X) == 0:
        print("\n❌ Failed to load images")
        return False
    
    # Create detector instance
    detector = PlantDiseaseDetector()
    
    # Split data
    print("\nSplitting data...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"  Training samples: {len(X_train)}")
    print(f"  Test samples: {len(X_test)}")
    
    # Scale features
    print("\nScaling features...")
    X_train_scaled = detector.scaler.fit_transform(X_train)
    X_test_scaled = detector.scaler.transform(X_test)
    
    # Train model
    print("\nTraining Random Forest Classifier...")
    from sklearn.ensemble import RandomForestClassifier
    
    detector.model = RandomForestClassifier(
        n_estimators=200,  # More trees for real data
        max_depth=15,      # Deeper trees
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        class_weight='balanced',
        n_jobs=-1  # Use all CPU cores
    )
    
    detector.model.fit(X_train_scaled, y_train)
    
    # Evaluate
    print("\nEvaluating model...")
    from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
    
    y_pred = detector.model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\n{'='*70}")
    print(f"✅ MODEL TRAINING COMPLETE!")
    print(f"{'='*70}")
    print(f"\n📊 Accuracy: {accuracy:.3f} ({accuracy*100:.1f}%)")
    
    print("\n📋 Classification Report:")
    print(classification_report(y_test, y_pred))
    
    print("\n📊 Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # Save model
    detector.is_trained = True
    detector.model_path = save_path
    
    print(f"\nSaving model to: {save_path}")
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    
    with open(save_path, 'wb') as f:
        pickle.dump({
            'model': detector.model,
            'scaler': detector.scaler,
            'is_trained': detector.is_trained,
            'accuracy': accuracy,
            'training_samples': len(X_train),
            'test_samples': len(X_test)
        }, f)
    
    print("✅ Model saved successfully!")
    
    # Feature importance
    print("\n📊 Top 10 Most Important Features:")
    feature_names = [
        'mean_h', 'mean_s', 'mean_v',
        'std_h', 'std_s', 'std_v',
        'green_pct', 'yellow_pct', 'brown_pct',
        'edge_density', 'smoothness', 'uniformity'
    ]
    
    importances = detector.model.feature_importances_
    indices = np.argsort(importances)[::-1]
    
    for i in range(min(10, len(feature_names))):
        idx = indices[i]
        print(f"  {i+1}. {feature_names[idx]}: {importances[idx]:.4f}")
    
    return True

def main():
    """Main function"""
    print("\n" + "="*70)
    print("🌿 TRAIN DISEASE DETECTION WITH REAL IMAGES")
    print("="*70)
    
    # Default dataset path
    default_path = 'backend/python/pepper_dataset'
    
    print(f"\nDefault dataset path: {default_path}")
    print("(This should contain folders: Healthy, Bacterial Spot, etc.)")
    
    custom_path = input("\nEnter custom path or press Enter to use default: ").strip()
    
    dataset_path = custom_path if custom_path else default_path
    
    if not os.path.exists(dataset_path):
        print(f"\n❌ Dataset path not found: {dataset_path}")
        print("\nPlease download and organize dataset first:")
        print("  python download_kaggle_dataset.py")
        input("\nPress Enter to exit...")
        return
    
    # Ask about image limit
    print("\n" + "="*70)
    print("How many images per class do you want to use?")
    print("  - More images = Better accuracy but slower training")
    print("  - Recommended: 500-1000 per class")
    print("="*70)
    
    try:
        max_images = input("\nMax images per class (default: 1000): ").strip()
        max_images = int(max_images) if max_images else 1000
    except ValueError:
        max_images = 1000
    
    print(f"\n✅ Will use up to {max_images} images per class")
    
    # Confirm
    print("\n" + "="*70)
    print("⚠️  Training with real images may take several minutes")
    confirm = input("Start training? (y/n): ").lower()
    
    if confirm == 'y':
        success = train_with_real_images(dataset_path)
        
        if success:
            print("\n" + "="*70)
            print("🎉 SUCCESS!")
            print("="*70)
            print("\nYour model has been trained with real images!")
            print("\nNext steps:")
            print("1. Update disease_detector.py to use the new model")
            print("   Change model_path to: 'backend/python/models/disease_model_real.pkl'")
            print("2. Restart the Flask API")
            print("3. Test with real pepper leaf images")
        else:
            print("\n❌ Training failed")
    else:
        print("\nTraining cancelled")
    
    input("\nPress Enter to exit...")

if __name__ == '__main__':
    main()
