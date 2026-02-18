"""
Kaggle Dataset Downloader for Disease Detection
Downloads and prepares plant disease datasets from Kaggle
"""

import os
import sys
import zipfile
import shutil
from pathlib import Path

def setup_kaggle():
    """Setup Kaggle API credentials"""
    print("\n" + "="*70)
    print("🔑 KAGGLE API SETUP")
    print("="*70)
    
    kaggle_dir = Path.home() / '.kaggle'
    kaggle_json = kaggle_dir / 'kaggle.json'
    
    if kaggle_json.exists():
        print("✅ Kaggle API credentials found")
        return True
    
    print("\n❌ Kaggle API credentials not found")
    print("\nTo download datasets from Kaggle, you need to:")
    print("\n1. Go to https://www.kaggle.com/settings/account")
    print("2. Scroll to 'API' section")
    print("3. Click 'Create New Token' (downloads kaggle.json)")
    print("4. Place kaggle.json in one of these locations:")
    print(f"   - {kaggle_dir}")
    print(f"   - Current directory: {Path.cwd()}")
    
    # Check if kaggle.json is in current directory
    if Path('kaggle.json').exists():
        print("\n📁 Found kaggle.json in current directory!")
        print("Moving to ~/.kaggle/...")
        kaggle_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy('kaggle.json', kaggle_json)
        os.chmod(kaggle_json, 0o600)
        print("✅ Kaggle credentials configured")
        return True
    
    return False

def install_kaggle_package():
    """Install Kaggle package if not present"""
    try:
        import kaggle
        print("✅ Kaggle package already installed")
        return True
    except ImportError:
        print("📦 Installing Kaggle package...")
        import subprocess
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "kaggle"], 
                         check=True, capture_output=True)
            print("✅ Kaggle package installed successfully")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install Kaggle package: {e}")
            return False

def list_recommended_datasets():
    """List recommended plant disease datasets"""
    print("\n" + "="*70)
    print("📊 RECOMMENDED KAGGLE DATASETS")
    print("="*70)
    
    datasets = [
        {
            "name": "PlantVillage Dataset",
            "id": "emmarex/plantdisease",
            "size": "~1.8 GB",
            "images": "54,000+",
            "diseases": "38 classes",
            "recommended": True,
            "description": "Comprehensive plant disease dataset with peppers included"
        },
        {
            "name": "Plant Disease Recognition",
            "id": "rashikrahmanpritom/plant-disease-recognition-dataset",
            "size": "~2 GB",
            "images": "87,000+",
            "diseases": "38 classes",
            "recommended": True,
            "description": "High-quality images of various plant diseases"
        },
        {
            "name": "New Plant Diseases Dataset",
            "id": "vipoooool/new-plant-diseases-dataset",
            "size": "~1.6 GB",
            "images": "87,000+",
            "diseases": "38 classes",
            "recommended": True,
            "description": "Augmented version with more samples"
        },
        {
            "name": "Plant Leaf Disease Dataset",
            "id": "csafrit2/plant-leaves-for-image-classification",
            "size": "~500 MB",
            "images": "4,502",
            "diseases": "22 classes",
            "recommended": False,
            "description": "Smaller dataset for quick testing"
        }
    ]
    
    for i, dataset in enumerate(datasets, 1):
        star = "⭐" if dataset["recommended"] else "  "
        print(f"\n{star} {i}. {dataset['name']}")
        print(f"   ID: {dataset['id']}")
        print(f"   Size: {dataset['size']}")
        print(f"   Images: {dataset['images']}")
        print(f"   Classes: {dataset['diseases']}")
        print(f"   Description: {dataset['description']}")
    
    return datasets

def download_dataset(dataset_id, output_dir='backend/python/datasets'):
    """Download dataset from Kaggle"""
    print(f"\n" + "="*70)
    print(f"📥 DOWNLOADING: {dataset_id}")
    print("="*70)
    
    try:
        import kaggle
        
        # Create output directory
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        print(f"\nDownloading to: {output_path}")
        print("This may take several minutes depending on dataset size...")
        
        # Download dataset
        kaggle.api.dataset_download_files(
            dataset_id,
            path=output_path,
            unzip=True
        )
        
        print("\n✅ Dataset downloaded successfully!")
        print(f"📁 Location: {output_path.absolute()}")
        
        # List downloaded files
        files = list(output_path.glob('**/*'))
        print(f"\n📊 Total files: {len(files)}")
        
        # Find image directories
        image_dirs = [d for d in output_path.glob('*') if d.is_dir()]
        if image_dirs:
            print(f"\n📂 Directories found: {len(image_dirs)}")
            for dir in image_dirs[:10]:  # Show first 10
                file_count = len(list(dir.glob('*.*')))
                print(f"   - {dir.name}: {file_count} files")
        
        return output_path
        
    except Exception as e:
        print(f"\n❌ Error downloading dataset: {e}")
        return None

def organize_pepper_dataset(dataset_path, output_dir='backend/python/pepper_dataset'):
    """Organize dataset to match our disease categories"""
    print("\n" + "="*70)
    print("📁 ORGANIZING DATASET")
    print("="*70)
    
    output_path = Path(output_dir)
    
    # Our disease categories
    our_categories = {
        'Healthy': ['healthy', 'pepper_healthy', 'bell_pepper_healthy'],
        'Bacterial Spot': ['bacterial', 'spot', 'pepper_bacterial'],
        'Yellow Leaf Curl': ['yellow', 'curl', 'virus', 'leaf_curl'],
        'Nutrient Deficiency': ['deficiency', 'nutrient', 'chlorosis']
    }
    
    # Create category directories
    for category in our_categories.keys():
        (output_path / category).mkdir(parents=True, exist_ok=True)
    
    dataset_path = Path(dataset_path)
    
    # Find all image files
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif'}
    all_images = []
    for ext in image_extensions:
        all_images.extend(dataset_path.glob(f'**/*{ext}'))
        all_images.extend(dataset_path.glob(f'**/*{ext.upper()}'))
    
    print(f"\nFound {len(all_images)} images")
    print("\nCategorizing images based on folder/file names...")
    
    categorized = {cat: 0 for cat in our_categories.keys()}
    uncategorized = 0
    
    for img_path in all_images:
        # Check parent directory and filename
        full_path = str(img_path).lower()
        matched = False
        
        for category, keywords in our_categories.items():
            if any(keyword in full_path for keyword in keywords):
                try:
                    dest = output_path / category / img_path.name
                    if not dest.exists():
                        shutil.copy2(img_path, dest)
                        categorized[category] += 1
                    matched = True
                    break
                except Exception as e:
                    print(f"Error copying {img_path.name}: {e}")
        
        if not matched:
            uncategorized += 1
    
    print("\n✅ Organization complete!")
    print("\n📊 Results:")
    for category, count in categorized.items():
        print(f"   - {category}: {count} images")
    print(f"   - Uncategorized: {uncategorized} images")
    
    if uncategorized > 0:
        print(f"\n⚠️  Note: {uncategorized} images couldn't be automatically categorized")
        print(f"   Check the original dataset at: {dataset_path}")
        print(f"   Manually organize relevant images to: {output_path}")
    
    return output_path

def main():
    """Main function"""
    print("\n" + "="*70)
    print("🌿 KAGGLE DATASET DOWNLOADER - DISEASE DETECTION")
    print("="*70)
    
    # Step 1: Check/Setup Kaggle credentials
    if not setup_kaggle():
        print("\n❌ Cannot proceed without Kaggle credentials")
        print("\nAfter setting up credentials, run this script again.")
        input("\nPress Enter to exit...")
        return
    
    # Step 2: Install Kaggle package
    if not install_kaggle_package():
        print("\n❌ Cannot proceed without Kaggle package")
        input("\nPress Enter to exit...")
        return
    
    # Step 3: Show recommended datasets
    datasets = list_recommended_datasets()
    
    # Step 4: Ask user to choose
    print("\n" + "="*70)
    print("Which dataset would you like to download?")
    print("="*70)
    print("\nOptions:")
    for i in range(len(datasets)):
        print(f"  {i+1}. {datasets[i]['name']}")
    print("  0. Cancel")
    
    try:
        choice = int(input("\nEnter your choice (0-{}): ".format(len(datasets))))
        
        if choice == 0:
            print("\nDownload cancelled.")
            return
        
        if 1 <= choice <= len(datasets):
            selected = datasets[choice - 1]
            print(f"\n✅ Selected: {selected['name']}")
            
            # Confirm download
            print(f"\n⚠️  This will download ~{selected['size']} of data")
            confirm = input("Continue? (y/n): ").lower()
            
            if confirm == 'y':
                # Download dataset
                dataset_path = download_dataset(selected['id'])
                
                if dataset_path:
                    # Ask to organize
                    print("\n" + "="*70)
                    organize = input("\nOrganize pepper images into categories? (y/n): ").lower()
                    
                    if organize == 'y':
                        organized_path = organize_pepper_dataset(dataset_path)
                        
                        print("\n" + "="*70)
                        print("✅ SETUP COMPLETE!")
                        print("="*70)
                        print(f"\nDataset ready at: {organized_path}")
                        print("\nNext steps:")
                        print("1. Review the organized images")
                        print("2. Manually adjust any mis-categorized images")
                        print("3. Run: python train_with_real_images.py")
            else:
                print("\nDownload cancelled.")
        else:
            print("\n❌ Invalid choice")
    
    except ValueError:
        print("\n❌ Invalid input")
    except KeyboardInterrupt:
        print("\n\n❌ Cancelled by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
    
    input("\nPress Enter to exit...")

if __name__ == '__main__':
    main()
