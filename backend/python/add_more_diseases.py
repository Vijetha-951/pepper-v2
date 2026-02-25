"""
Add More Disease Types to Your Model
This script helps you add Yellow Leaf Curl and Nutrient Deficiency detection
"""

import os
import sys
from pathlib import Path

def print_header(text):
    print("\n" + "="*70)
    print(f"  {text}")
    print("="*70 + "\n")

def check_current_status():
    """Check current dataset status"""
    print_header("📊 CURRENT DATASET STATUS")
    
    dataset_path = Path('pepper_dataset')
    if not dataset_path.exists():
        print("❌ Dataset folder not found!")
        return False
    
    categories = ['Healthy', 'Bacterial Spot', 'Yellow Leaf Curl', 'Nutrient Deficiency']
    
    for category in categories:
        folder = dataset_path / category
        if folder.exists():
            image_count = len(list(folder.glob('*.jpg')) + list(folder.glob('*.png')) + 
                             list(folder.glob('*.jpeg')) + list(folder.glob('*.JPG')))
            status = "✅" if image_count > 0 else "❌"
            print(f"{status} {category}: {image_count} images")
        else:
            print(f"❌ {category}: Folder not found")
    
    return True

def show_options():
    """Show options to add more diseases"""
    print_header("💡 OPTIONS TO ADD MORE DISEASES")
    
    print("Option 1: Download from Internet")
    print("-" * 70)
    print("Search Google Images for:")
    print("  • 'pepper leaf yellow curl virus'")
    print("  • 'pepper nutrient deficiency yellow leaves'")
    print("  • 'capsicum nitrogen deficiency'")
    print("  • 'bell pepper magnesium deficiency'")
    print("")
    print("Need: 200-500 images per disease for good accuracy")
    print("")
    
    print("Option 2: Download Different Kaggle Dataset")
    print("-" * 70)
    print("Try these datasets with more pepper diseases:")
    print("  1. 'abdallahwagih/pepperbell-leafe-diseases-dataset'")
    print("  2. 'arjuntejaswi/plant-village'")
    print("  3. Search Kaggle for 'pepper disease' or 'capsicum disease'")
    print("")
    
    print("Option 3: Use Tomato/Similar Plant Images")
    print("-" * 70)
    print("Yellow Leaf Curl affects multiple plants:")
    print("  • Tomato Yellow Leaf Curl images can work")
    print("  • Nutrient deficiency looks similar across plants")
    print("  • Download from PlantVillage dataset's tomato section")
    print("")
    
    print("Option 4: Train with 2 Classes Only (Current)")
    print("-" * 70)
    print("Keep model as-is with just Healthy and Bacterial Spot")
    print("This might be sufficient if these are most common issues")
    print("")

def download_specific_dataset():
    """Guide to download specific pepper dataset"""
    print_header("🔧 DOWNLOAD PEPPER-SPECIFIC DATASET")
    
    print("To download a pepper disease dataset from Kaggle:")
    print("")
    print("1. Make sure you have Kaggle credentials set up")
    print("   (kaggle.json in ~/.kaggle/)")
    print("")
    print("2. Run these commands:")
    print("")
    print("   # For pepper bell leaf diseases:")
    print("   kaggle datasets download -d abdallahwagih/pepperbell-leafe-diseases-dataset")
    print("")
    print("   # Extract the zip file")
    print("   # Then organize images into folders:")
    print("   #   pepper_dataset/Yellow Leaf Curl/")
    print("   #   pepper_dataset/Nutrient Deficiency/")
    print("")

def manual_organization_guide():
    """Guide for manually organizing images"""
    print_header("📁 MANUAL IMAGE ORGANIZATION GUIDE")
    
    dataset_path = Path('pepper_dataset')
    
    print("For Yellow Leaf Curl:")
    print(f"  1. Create/use folder: {dataset_path / 'Yellow Leaf Curl'}")
    print("  2. Add 200+ images of leaves with:")
    print("     - Yellowing and curling")
    print("     - Upward or downward curl")
    print("     - Stunted growth patterns")
    print("")
    
    print("For Nutrient Deficiency:")
    print(f"  1. Create/use folder: {dataset_path / 'Nutrient Deficiency'}")
    print("  2. Add 200+ images showing:")
    print("     - Yellowing between veins (chlorosis)")
    print("     - Purple/red discoloration")
    print("     - Pale or light green leaves")
    print("     - Tip burn or edge browning")
    print("")
    
    print("After adding images, retrain:")
    print("  python train_now.py")
    print("")

def main():
    print_header("🌿 ADD MORE DISEASES TO YOUR MODEL")
    
    # Check current status
    check_current_status()
    
    # Show options
    show_options()
    
    # Ask what user wants to do
    print_header("🎯 WHAT WOULD YOU LIKE TO DO?")
    print("1. Show manual organization guide")
    print("2. Show download instructions")
    print("3. Train with current 2 classes only")
    print("4. Exit")
    
    try:
        choice = input("\nEnter your choice (1-4): ").strip()
        
        if choice == '1':
            manual_organization_guide()
        elif choice == '2':
            download_specific_dataset()
        elif choice == '3':
            print("\n✅ Your model is already trained with 2 classes!")
            print("   It will accurately detect:")
            print("   - Healthy plants")
            print("   - Bacterial Spot disease")
        elif choice == '4':
            print("\nExiting...")
        else:
            print("\n❌ Invalid choice")
    except KeyboardInterrupt:
        print("\n\nExiting...")

if __name__ == '__main__':
    main()
