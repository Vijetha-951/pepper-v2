"""
Disease Detection Setup Script
Installs dependencies, trains model, and tests the system
"""

import os
import sys
import subprocess

def run_command(command, description):
    """Run a command and print status"""
    print(f"\n{'='*60}")
    print(f"📋 {description}")
    print(f"{'='*60}")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        print(e.stderr)
        return False

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    print(f"Python version: {version.major}.{version.minor}.{version.micro}")
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print("✅ Python version is compatible")
    return True

def install_dependencies():
    """Install required Python packages"""
    print("\n" + "="*60)
    print("📦 Installing Dependencies")
    print("="*60)
    
    packages = [
        "scikit-learn==1.3.2",
        "numpy==1.24.3",
        "pandas==2.0.3",
        "Flask==3.0.0",
        "Flask-CORS==4.0.0",
        "opencv-python==4.8.1.78",
        "Pillow==10.1.0",
        "joblib==1.3.2",
        "scipy==1.11.4"
    ]
    
    for package in packages:
        print(f"\nInstalling {package}...")
        try:
            subprocess.run(
                f"pip install {package}",
                shell=True,
                check=True,
                capture_output=True
            )
            print(f"✅ {package} installed successfully")
        except subprocess.CalledProcessError:
            print(f"⚠️  Warning: Failed to install {package}")
    
    return True

def train_model():
    """Train the disease detection model"""
    print("\n" + "="*60)
    print("🤖 Training Disease Detection Model")
    print("="*60)
    
    try:
        from disease_detector import PlantDiseaseDetector
        
        detector = PlantDiseaseDetector()
        result = detector.train()
        
        if result['success']:
            print(f"\n✅ Model trained successfully!")
            print(f"   Accuracy: {result['accuracy']}")
            print(f"   Training samples: {result['training_samples']}")
            print(f"   Test samples: {result['test_samples']}")
            print(f"   Classes: {', '.join(result['classes'])}")
            return True
        else:
            print(f"❌ Training failed: {result.get('error')}")
            return False
    except Exception as e:
        print(f"❌ Error during training: {str(e)}")
        return False

def test_model():
    """Test the trained model"""
    print("\n" + "="*60)
    print("🧪 Testing Disease Detection Model")
    print("="*60)
    
    try:
        from disease_detector import PlantDiseaseDetector
        
        detector = PlantDiseaseDetector()
        
        if not detector.is_trained:
            print("❌ Model is not trained. Please train first.")
            return False
        
        print("✅ Model is loaded and ready")
        print(f"   Model type: Random Forest Classifier")
        print(f"   Detectable diseases: {len(detector.disease_info)}")
        
        # List diseases
        print("\n📋 Detectable Diseases:")
        for disease in detector.disease_info.keys():
            print(f"   - {disease}")
        
        return True
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")
        return False

def create_directories():
    """Create necessary directories"""
    print("\n" + "="*60)
    print("📁 Creating Directories")
    print("="*60)
    
    directories = [
        'backend/python/models',
        'backend/uploads/disease_images'
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        print(f"✅ {directory}")
    
    return True

def main():
    """Main setup function"""
    print("\n" + "="*70)
    print("🌿 PEPPER DISEASE DETECTION - SETUP WIZARD")
    print("="*70)
    
    # Check Python version
    if not check_python_version():
        input("\nPress Enter to exit...")
        sys.exit(1)
    
    # Create directories
    if not create_directories():
        print("\n❌ Failed to create directories")
        input("\nPress Enter to exit...")
        sys.exit(1)
    
    # Install dependencies
    print("\n❓ Do you want to install/update dependencies? (y/n): ", end='')
    if input().lower() == 'y':
        install_dependencies()
    
    # Train model
    print("\n❓ Do you want to train the disease detection model? (y/n): ", end='')
    if input().lower() == 'y':
        if not train_model():
            print("\n⚠️  Warning: Model training failed")
    
    # Test model
    print("\n❓ Do you want to test the model? (y/n): ", end='')
    if input().lower() == 'y':
        test_model()
    
    # Summary
    print("\n" + "="*70)
    print("🎉 SETUP COMPLETE!")
    print("="*70)
    print("\n📝 Next Steps:")
    print("   1. Start the Flask API:")
    print("      python disease_detection_api.py")
    print("   2. Or use the batch file:")
    print("      start-disease-detection.bat")
    print("   3. The API will be available at http://localhost:5002")
    print("\n📚 API Endpoints:")
    print("   - GET  /health           - Health check")
    print("   - GET  /diseases         - List all diseases")
    print("   - GET  /model-info       - Model information")
    print("   - POST /predict          - Predict disease (multipart/form-data)")
    print("   - POST /predict-url      - Predict from URL")
    print("   - POST /batch-predict    - Batch prediction")
    print("   - POST /train            - Train model")
    print("\n" + "="*70)
    
    input("\nPress Enter to exit...")

if __name__ == '__main__':
    main()
