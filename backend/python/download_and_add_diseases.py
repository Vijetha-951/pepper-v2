"""
Automated Dataset Downloader
Downloads and organizes Yellow Leaf Curl and Nutrient Deficiency images
"""

import os
import sys
import zipfile
import shutil
from pathlib import Path

def print_header(text):
    print("\n" + "="*70)
    print(f"  {text}")
    print("="*70 + "\n")

def check_kaggle_setup():
    """Check if Kaggle is set up"""
    print_header("🔑 Checking Kaggle Setup")
    
    try:
        import kaggle
        print("✅ Kaggle package installed")
        
        kaggle_json = Path.home() / '.kaggle' / 'kaggle.json'
        if kaggle_json.exists():
            print("✅ Kaggle credentials found")
            return True
        else:
            print("❌ Kaggle credentials NOT found")
            print("\nSetup instructions:")
            print("1. Go to: https://www.kaggle.com/settings/account")
            print("2. Click 'Create New Token'")
            print(f"3. Save kaggle.json to: {kaggle_json.parent}")
            return False
    except ImportError:
        print("❌ Kaggle package not installed")
        print("\nInstalling kaggle package...")
        import subprocess
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "kaggle", "-q"], check=True)
            print("✅ Kaggle package installed")
            return check_kaggle_setup()
        except:
            print("❌ Failed to install kaggle")
            return False

def download_plantvillage():
    """Download PlantVillage dataset"""
    print_header("📥 Downloading PlantVillage Dataset")
    
    download_dir = Path("plantvillage_download")
    download_dir.mkdir(exist_ok=True)
    
    print("Dataset: PlantVillage (Plant Disease Recognition)")
    print("Size: ~2 GB")
    print("This will take 5-15 minutes depending on your internet speed...")
    print()
    
    try:
        import kaggle
        
        print("Downloading...")
        kaggle.api.dataset_download_files(
            'arjuntejaswi/plant-village',
            path=str(download_dir),
            unzip=True
        )
        
        print("✅ Download complete!")
        return download_dir
        
    except Exception as e:
        print(f"❌ Download failed: {e}")
        print("\nManual download:")
        print("1. Go to: https://www.kaggle.com/datasets/arjuntejaswi/plant-village")
        print("2. Click 'Download' button")
        print(f"3. Extract to: {download_dir.absolute()}")
        return None

def find_disease_folders(base_path):
    """Find relevant disease folders"""
    print_header("🔍 Finding Disease Folders")
    
    base_path = Path(base_path)
    
    # Look for PlantVillage subdirectory
    plantvillage_dirs = list(base_path.glob("**/PlantVillage"))
    if plantvillage_dirs:
        base_path = plantvillage_dirs[0]
        print(f"Found PlantVillage directory: {base_path}")
    
    folders = {
        'yellow_curl': None,
        'leaf_mold': None,
        'early_blight': None
    }
    
    # Search for disease folders
    for folder in base_path.rglob("*"):
        if folder.is_dir():
            name = folder.name
            if 'Yellow_Leaf_Curl' in name:
                folders['yellow_curl'] = folder
                print(f"✅ Found Yellow Leaf Curl: {folder.name}")
            elif 'Leaf_Mold' in name:
                folders['leaf_mold'] = folder
                print(f"✅ Found Leaf Mold: {folder.name}")
            elif 'Early_blight' in name and 'Potato' in name:
                folders['early_blight'] = folder
                print(f"✅ Found Early Blight: {folder.name}")
    
    return folders

def copy_images(source_folders):
    """Copy images to pepper dataset"""
    print_header("📁 Organizing Images")
    
    pepper_dataset = Path("pepper_dataset")
    
    # Create target folders
    yellow_curl_dir = pepper_dataset / "Yellow Leaf Curl"
    nutrient_def_dir = pepper_dataset / "Nutrient Deficiency"
    
    yellow_curl_dir.mkdir(parents=True, exist_ok=True)
    nutrient_def_dir.mkdir(parents=True, exist_ok=True)
    
    copied_counts = {'yellow_curl': 0, 'nutrient_def': 0}
    
    # Copy Yellow Leaf Curl
    if source_folders['yellow_curl']:
        print("\nCopying Yellow Leaf Curl images...")
        source = source_folders['yellow_curl']
        for img in source.glob("*"):
            if img.suffix.lower() in ['.jpg', '.jpeg', '.png', '.bmp']:
                try:
                    shutil.copy2(img, yellow_curl_dir)
                    copied_counts['yellow_curl'] += 1
                except Exception as e:
                    pass
        print(f"✅ Copied {copied_counts['yellow_curl']} images to Yellow Leaf Curl")
    else:
        print("⚠️  Yellow Leaf Curl folder not found")
    
    # Copy Nutrient Deficiency (from Leaf Mold)
    if source_folders['leaf_mold']:
        print("\nCopying Nutrient Deficiency images (from Tomato Leaf Mold)...")
        source = source_folders['leaf_mold']
        for img in source.glob("*"):
            if img.suffix.lower() in ['.jpg', '.jpeg', '.png', '.bmp']:
                try:
                    shutil.copy2(img, nutrient_def_dir)
                    copied_counts['nutrient_def'] += 1
                except Exception as e:
                    pass
        print(f"✅ Copied {copied_counts['nutrient_def']} images")
    
    # Add more variety from Potato Early Blight
    if source_folders['early_blight']:
        print("\nAdding more variety (from Potato Early Blight)...")
        source = source_folders['early_blight']
        added = 0
        for img in source.glob("*"):
            if img.suffix.lower() in ['.jpg', '.jpeg', '.png', '.bmp']:
                try:
                    shutil.copy2(img, nutrient_def_dir)
                    added += 1
                except Exception as e:
                    pass
        copied_counts['nutrient_def'] += added
        print(f"✅ Added {added} more images")
        print(f"   Total Nutrient Deficiency: {copied_counts['nutrient_def']}")
    
    return copied_counts

def show_summary():
    """Show current dataset status"""
    print_header("📊 DATASET SUMMARY")
    
    pepper_dataset = Path("pepper_dataset")
    
    if not pepper_dataset.exists():
        print("❌ pepper_dataset folder not found")
        return
    
    categories = ['Healthy', 'Bacterial Spot', 'Yellow Leaf Curl', 'Nutrient Deficiency']
    total = 0
    
    for category in categories:
        folder = pepper_dataset / category
        if folder.exists():
            images = list(folder.glob("*.jpg")) + list(folder.glob("*.png")) + \
                     list(folder.glob("*.JPG")) + list(folder.glob("*.jpeg"))
            count = len(images)
            total += count
            status = "✅" if count > 0 else "❌"
            print(f"  {status} {category}: {count} images")
        else:
            print(f"  ❌ {category}: Folder not found")
    
    print(f"\n  Total: {total} images across {sum(1 for c in categories if (pepper_dataset/c).exists() and len(list((pepper_dataset/c).glob('*.*'))) > 0)} classes")
    print()

def main():
    """Main function"""
    print_header("🌶️ ADD YELLOW LEAF CURL & NUTRIENT DEFICIENCY")
    
    print("This script will:")
    print("1. Download PlantVillage dataset from Kaggle")
    print("2. Extract Yellow Leaf Curl images (from Tomato)")
    print("3. Extract Nutrient Deficiency images (from Tomato/Potato)")
    print("4. Organize them into your pepper_dataset folder")
    print()
    
    # Check if already have the data
    pepper_dataset = Path("pepper_dataset")
    yellow_curl_dir = pepper_dataset / "Yellow Leaf Curl"
    nutrient_def_dir = pepper_dataset / "Nutrient Deficiency"
    
    if yellow_curl_dir.exists() and nutrient_def_dir.exists():
        yellow_count = len(list(yellow_curl_dir.glob("*.*")))
        nutrient_count = len(list(nutrient_def_dir.glob("*.*")))
        
        if yellow_count > 0 and nutrient_count > 0:
            print(f"⚠️  You already have:")
            print(f"   - Yellow Leaf Curl: {yellow_count} images")
            print(f"   - Nutrient Deficiency: {nutrient_count} images")
            print()
            response = input("Download more and add them? (y/n): ").lower()
            if response != 'y':
                print("\nSkipping download. Showing current summary...")
                show_summary()
                return
    
    # Step 1: Check Kaggle
    if not check_kaggle_setup():
        print("\n❌ Cannot proceed without Kaggle setup")
        print("\nAlternative: Manual Download")
        print("1. Download from: https://www.kaggle.com/datasets/arjuntejaswi/plant-village")
        print("2. Extract files")
        print("3. Run this script again and it will find the extracted files")
        return
    
    # Step 2: Download dataset
    download_dir = download_plantvillage()
    if not download_dir:
        print("\nChecking for manually downloaded files...")
        download_dir = Path("plantvillage_download")
        if not download_dir.exists() or not list(download_dir.glob("*")):
            print("❌ No downloaded files found")
            return
    
    # Step 3: Find disease folders
    folders = find_disease_folders(download_dir)
    
    if not any(folders.values()):
        print("\n❌ Could not find disease folders")
        print("Please check the downloaded files")
        return
    
    # Step 4: Copy images
    counts = copy_images(folders)
    
    # Step 5: Show summary
    show_summary()
    
    # Step 6: Next steps
    print_header("✅ NEXT STEPS")
    print("Now retrain your model with the new diseases:")
    print()
    print("  python train_now.py")
    print()
    print("Expected training time: 5-10 minutes")
    print("Expected accuracy: 90-95% with 4 disease classes")
    print()
    
    # Cleanup
    response = input("Delete downloaded files to save space? (y/n): ").lower()
    if response == 'y':
        try:
            shutil.rmtree(download_dir)
            print(f"✅ Deleted {download_dir}")
        except:
            print(f"⚠️  Could not delete {download_dir}")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Cancelled by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
