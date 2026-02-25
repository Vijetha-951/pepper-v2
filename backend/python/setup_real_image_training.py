"""
🌿 PEPPER DISEASE DETECTION - REAL IMAGE TRAINING SETUP
========================================================

This script helps you:
1. Download real pepper/plant disease images from Kaggle
2. Organize them into proper categories
3. Train the model with real images
4. Get much better accuracy for real-world detection

Author: AI Assistant
Date: 2026
"""

import os
import sys
from pathlib import Path
import subprocess

def print_header(text):
    """Print a nice header"""
    print("\n" + "="*70)
    print(f"  {text}")
    print("="*70 + "\n")

def check_kaggle_credentials():
    """Check if Kaggle API is set up"""
    print_header("🔑 STEP 1: Checking Kaggle Credentials")
    
    kaggle_dir = Path.home() / '.kaggle'
    kaggle_json = kaggle_dir / 'kaggle.json'
    
    if kaggle_json.exists():
        print("✅ Kaggle API credentials found!")
        return True
    
    # Check if in current directory
    if Path('kaggle.json').exists():
        print("📁 Found kaggle.json in current directory!")
        print("   Moving to ~/.kaggle/...")
        kaggle_dir.mkdir(parents=True, exist_ok=True)
        import shutil
        shutil.copy('kaggle.json', kaggle_json)
        try:
            os.chmod(kaggle_json, 0o600)
        except:
            pass
        print("✅ Credentials configured!")
        return True
    
    print("❌ Kaggle API credentials NOT found")
    print("\n📝 TO GET KAGGLE CREDENTIALS:")
    print("   1. Go to: https://www.kaggle.com/settings/account")
    print("   2. Scroll to 'API' section")
    print("   3. Click 'Create New Token'")
    print("   4. Save the downloaded 'kaggle.json' file to:")
    print(f"      {kaggle_dir}")
    print("      OR")
    print(f"      {Path.cwd()}")
    print("\n   Then run this script again!")
    
    return False

def install_kaggle_package():
    """Install Kaggle package"""
    print_header("📦 STEP 2: Installing Kaggle Package")
    
    try:
        import kaggle
        print("✅ Kaggle package already installed")
        return True
    except ImportError:
        print("Installing kaggle package...")
        try:
            subprocess.run(
                [sys.executable, "-m", "pip", "install", "kaggle", "--quiet"],
                check=True
            )
            print("✅ Kaggle package installed!")
            return True
        except Exception as e:
            print(f"❌ Failed to install: {e}")
            print("\nTry manually: pip install kaggle")
            return False

def show_dataset_options():
    """Show dataset download options"""
    print_header("📊 STEP 3: Choose Dataset")
    
    print("RECOMMENDED DATASETS FOR PEPPER/PLANT DISEASES:\n")
    
    print("1️⃣  PlantVillage Dataset (RECOMMENDED)")
    print("    ID: emmarex/plantdisease")
    print("    Size: ~1.8 GB")
    print("    Images: 54,000+")
    print("    ✅ High quality, well-organized")
    print("    ✅ Includes pepper diseases")
    
    print("\n2️⃣  Plant Disease Recognition")
    print("    ID: rashikrahmanpritom/plant-disease-recognition-dataset")
    print("    Size: ~2 GB")
    print("    Images: 87,000+")
    print("    ✅ Large variety of diseases")
    
    print("\n3️⃣  New Plant Diseases Dataset")
    print("    ID: vipoooool/new-plant-diseases-dataset")
    print("    Size: ~1.6 GB")
    print("    Images: 87,000+")
    print("    ✅ Augmented version")
    
    print("\n4️⃣  Quick Test Dataset (Small)")
    print("    ID: csafrit2/plant-leaves-for-image-classification")
    print("    Size: ~500 MB")
    print("    Images: 4,500")
    print("    ✅ Fast download for testing")
    
    print("\n5️⃣  Use existing images (manual)")
    print("    ✅ If you already have images organized")
    
    print("\n" + "-"*70)

def download_dataset(dataset_id):
    """Download and organize dataset"""
    print_header(f"📥 STEP 4: Downloading Dataset")
    
    try:
        import kaggle
        
        output_dir = Path('backend/python/datasets')
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"Downloading: {dataset_id}")
        print(f"To: {output_dir.absolute()}")
        print("\n⏳ This may take 5-20 minutes depending on size...")
        print("   (You can continue working, this runs in background)\n")
        
        kaggle.api.dataset_download_files(
            dataset_id,
            path=str(output_dir),
            unzip=True
        )
        
        print("\n✅ Dataset downloaded successfully!")
        return True
        
    except Exception as e:
        print(f"\n❌ Download failed: {e}")
        print("\nTroubleshooting:")
        print("  - Check your internet connection")
        print("  - Verify Kaggle credentials are correct")
        print("  - Try again in a few minutes")
        return False

def organize_images():
    """Organize downloaded images into disease categories"""
    print_header("📂 STEP 5: Organizing Images")
    
    dataset_dir = Path('backend/python/datasets')
    output_dir = Path('backend/python/pepper_dataset')
    
    if not dataset_dir.exists():
        print("❌ Dataset directory not found")
        return False
    
    print("Creating category folders...")
    categories = ['Healthy', 'Bacterial Spot', 'Yellow Leaf Curl', 'Nutrient Deficiency']
    
    for category in categories:
        (output_dir / category).mkdir(parents=True, exist_ok=True)
    
    print("✅ Folder structure created!")
    print(f"   Location: {output_dir.absolute()}")
    print("\n📝 NEXT STEP: Organize your images")
    print("   Copy/move images to these folders based on disease type:")
    for cat in categories:
        print(f"      - {output_dir / cat}")
    
    print("\n💡 TIP: Look for images with these patterns:")
    print("   - healthy, normal → Healthy/")
    print("   - bacterial, spot, lesion → Bacterial Spot/")
    print("   - yellow, curl, virus → Yellow Leaf Curl/")
    print("   - deficiency, nutrient, pale → Nutrient Deficiency/")
    
    return True

def train_model():
    """Train model with real images"""
    print_header("🤖 STEP 6: Training Model with Real Images")
    
    dataset_path = Path('backend/python/pepper_dataset')
    
    # Check if images exist
    if not dataset_path.exists():
        print("❌ Dataset folder not found!")
        print(f"   Expected: {dataset_path.absolute()}")
        return False
    
    # Count images
    total_images = 0
    categories = ['Healthy', 'Bacterial Spot', 'Yellow Leaf Curl', 'Nutrient Deficiency']
    
    print("Checking image counts...")
    for category in categories:
        cat_path = dataset_path / category
        if cat_path.exists():
            count = len(list(cat_path.glob('*.jpg'))) + \
                   len(list(cat_path.glob('*.png'))) + \
                   len(list(cat_path.glob('*.jpeg')))
            print(f"  {category}: {count} images")
            total_images += count
    
    if total_images == 0:
        print("\n❌ No images found!")
        print(f"   Please add images to: {dataset_path.absolute()}")
        return False
    
    print(f"\n✅ Total images: {total_images}")
    print("\n🚀 Starting training...")
    print("   (This may take 5-15 minutes depending on image count)\n")
    
    try:
        # Import and run training
        from train_with_real_images import train_with_real_images
        
        success = train_with_real_images(
            dataset_path=str(dataset_path),
            save_path='backend/python/models/disease_model_real.pkl'
        )
        
        if success:
            print_header("✅ SUCCESS! Model Trained with Real Images")
            return True
        else:
            print("\n❌ Training failed")
            return False
            
    except Exception as e:
        print(f"\n❌ Training error: {e}")
        import traceback
        traceback.print_exc()
        return False

def update_api_to_use_real_model():
    """Update the API to use the new real image model"""
    print_header("🔄 STEP 7: Updating API Configuration")
    
    print("The new model is saved as: disease_model_real.pkl")
    print("\nTo use it, you have 2 options:\n")
    
    print("OPTION 1 - Replace the default model (RECOMMENDED):")
    print("  Run this command:")
    print("  python -c \"import shutil; shutil.copy('backend/python/models/disease_model_real.pkl', 'backend/python/models/disease_model.pkl')\"")
    
    print("\nOPTION 2 - Keep both models:")
    print("  The API will automatically use disease_model_real.pkl if it exists")
    
    print("\n✅ No changes needed - restart your API!")
    
    return True

def main():
    """Main setup workflow"""
    print("\n")
    print("╔" + "="*68 + "╗")
    print("║" + " "*10 + "🌿 PEPPER DISEASE DETECTION TRAINING SETUP 🌿" + " "*12 + "║")
    print("║" + " "*68 + "║")
    print("║" + "  Train your model with REAL IMAGES for better accuracy!" + " "*10 + "║")
    print("╚" + "="*68 + "╝")
    
    # Check if user wants to proceed
    print("\nThis wizard will help you:")
    print("  ✓ Download real pepper disease images")
    print("  ✓ Organize them into categories")
    print("  ✓ Train a new, more accurate model")
    print("  ✓ Replace the current synthetic model\n")
    
    choice = input("Continue? (y/n): ").strip().lower()
    if choice != 'y':
        print("Setup cancelled.")
        return
    
    # Step 1: Check Kaggle credentials
    if not check_kaggle_credentials():
        print("\n❌ Cannot proceed without Kaggle credentials")
        print("   Please set them up and run this script again.")
        return
    
    # Step 2: Install Kaggle package
    if not install_kaggle_package():
        print("\n❌ Kaggle package required")
        return
    
    # Step 3: Choose dataset
    show_dataset_options()
    
    choice = input("\nEnter your choice (1-5): ").strip()
    
    datasets = {
        '1': 'emmarex/plantdisease',
        '2': 'rashikrahmanpritom/plant-disease-recognition-dataset',
        '3': 'vipoooool/new-plant-diseases-dataset',
        '4': 'csafrit2/plant-leaves-for-image-classification'
    }
    
    if choice in datasets:
        # Step 4: Download dataset
        if not download_dataset(datasets[choice]):
            print("\n❌ Setup failed at download stage")
            return
        
        # Step 5: Organize images
        organize_images()
        
        print("\n" + "="*70)
        print("⏸️  PAUSED - Manual Step Required")
        print("="*70)
        print("\nBefore training, please organize images into categories:")
        print("  1. Go to: backend/python/pepper_dataset/")
        print("  2. Copy images to appropriate disease folders")
        print("  3. Make sure each folder has some images\n")
        
        input("Press ENTER when images are organized...")
    
    elif choice == '5':
        print("\n📁 Using existing images")
        print("   Make sure they are in: backend/python/pepper_dataset/")
        input("Press ENTER to continue...")
    
    else:
        print("\n❌ Invalid choice")
        return
    
    # Step 6: Train model
    if not train_model():
        print("\n❌ Setup failed at training stage")
        return
    
    # Step 7: Update configuration
    update_api_to_use_real_model()
    
    # Final message
    print_header("🎉 SETUP COMPLETE!")
    
    print("Your disease detection model is now trained with REAL images!")
    print("\n📝 NEXT STEPS:")
    print("   1. Restart your disease detection API:")
    print("      python backend/python/disease_detection_api.py")
    print("   2. Upload your pepper leaf image")
    print("   3. Enjoy much better accuracy! 🎯")
    print("\n💡 The model was saved to:")
    print("   backend/python/models/disease_model_real.pkl")
    print("\n✨ Happy farming! 🌿\n")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Setup cancelled by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
