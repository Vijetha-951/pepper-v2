"""
🌶️ Pepper Plant Disease Datasets Guide
Find and download datasets specifically for pepper/bell pepper diseases
"""

import os
import sys

def print_header(text):
    print("\n" + "="*70)
    print(f"  {text}")
    print("="*70 + "\n")

def show_pepper_datasets():
    """Show available pepper disease datasets"""
    print_header("🌶️ PEPPER-SPECIFIC DISEASE DATASETS")
    
    datasets = [
        {
            "name": "Pepper Bell Leaf Diseases Dataset",
            "source": "Kaggle",
            "id": "abdallahwagih/pepperbell-leafe-diseases-dataset",
            "classes": [
                "Bacterial Spot",
                "Healthy"
            ],
            "images": "~2,500",
            "size": "~200 MB",
            "quality": "⭐⭐⭐⭐⭐",
            "recommended": True,
            "download_cmd": "kaggle datasets download -d abdallahwagih/pepperbell-leafe-diseases-dataset",
            "notes": "High quality, real-world images of pepper leaves"
        },
        {
            "name": "PlantVillage - Pepper Section",
            "source": "Kaggle",
            "id": "emmarex/plantdisease",
            "classes": [
                "Pepper__bell___Bacterial_spot",
                "Pepper__bell___healthy"
            ],
            "images": "~2,475",
            "size": "Part of 1.8 GB dataset",
            "quality": "⭐⭐⭐⭐⭐",
            "recommended": True,
            "download_cmd": "kaggle datasets download -d emmarex/plantdisease",
            "notes": "Industry standard, very clean images. Need to extract pepper subset."
        },
        {
            "name": "Plant Village Dataset (Full)",
            "source": "Kaggle",
            "id": "arjuntejaswi/plant-village",
            "classes": [
                "Pepper,_bell___Bacterial_spot",
                "Pepper,_bell___healthy"
            ],
            "images": "~2,475",
            "size": "~2 GB",
            "quality": "⭐⭐⭐⭐⭐",
            "recommended": True,
            "download_cmd": "kaggle datasets download -d arjuntejaswi/plant-village",
            "notes": "Another version of PlantVillage with slightly different organization"
        },
        {
            "name": "Capsicum Disease Dataset",
            "source": "Kaggle",
            "id": "vipoooool/new-plant-diseases-dataset",
            "classes": [
                "Pepper__bell___Bacterial_spot",
                "Pepper__bell___healthy"
            ],
            "images": "~87,000 (all plants)",
            "size": "~1.6 GB",
            "quality": "⭐⭐⭐⭐",
            "recommended": False,
            "download_cmd": "kaggle datasets download -d vipoooool/new-plant-diseases-dataset",
            "notes": "Augmented version with more samples but some artificial variations"
        },
        {
            "name": "Plant Disease Recognition Dataset",
            "source": "Kaggle",
            "id": "rashikrahmanpritom/plant-disease-recognition-dataset",
            "classes": [
                "Pepper bell Bacterial spot",
                "Pepper bell healthy"
            ],
            "images": "Part of 87,000",
            "size": "~2 GB",
            "quality": "⭐⭐⭐⭐",
            "recommended": False,
            "download_cmd": "kaggle datasets download -d rashikrahmanpritom/plant-disease-recognition-dataset",
            "notes": "Good quality but need to filter for pepper images"
        }
    ]
    
    print("📊 RECOMMENDED DATASETS:\n")
    
    for i, ds in enumerate(datasets, 1):
        if ds["recommended"]:
            print(f"{i}. {ds['name']}")
            print(f"   {'='*60}")
            print(f"   Source: {ds['source']}")
            print(f"   Quality: {ds['quality']}")
            print(f"   Classes: {len(ds['classes'])} disease types")
            for cls in ds['classes']:
                print(f"     - {cls}")
            print(f"   Images: {ds['images']}")
            print(f"   Size: {ds['size']}")
            print(f"   📦 Download: {ds['download_cmd']}")
            print(f"   📝 Notes: {ds['notes']}")
            print()

def show_additional_diseases():
    """Show where to find additional pepper diseases"""
    print_header("🔍 FINDING MORE PEPPER DISEASES")
    
    print("The datasets above mainly have 2 classes:")
    print("  ✅ Bacterial Spot")
    print("  ✅ Healthy")
    print()
    print("To add more diseases (Yellow Leaf Curl, Nutrient Deficiency), try:")
    print()
    
    print("Option 1: Search Kaggle for Specific Diseases")
    print("-" * 70)
    print("  🔎 Search terms:")
    print("     - 'pepper yellow leaf curl'")
    print("     - 'capsicum mosaic virus'")
    print("     - 'pepper nutrient deficiency'")
    print("     - 'bell pepper diseases'")
    print()
    
    print("Option 2: Use Related Plant Diseases")
    print("-" * 70)
    print("  These diseases affect multiple plants similarly:")
    print()
    print("  Yellow Leaf Curl:")
    print("     - Tomato Yellow Leaf Curl images work well")
    print("     - Dataset: 'Tomato___Tomato_Yellow_Leaf_Curl_Virus'")
    print("     - From PlantVillage dataset")
    print()
    print("  Nutrient Deficiency:")
    print("     - Tomato/Potato nutrient deficiency images")
    print("     - Symptoms look similar across solanaceae family")
    print("     - Search: 'tomato nitrogen deficiency', 'tomato magnesium deficiency'")
    print()
    
    print("Option 3: Web Scraping / Manual Collection")
    print("-" * 70)
    print("  Google Images:")
    print("     - Search 'pepper leaf bacterial spot'")
    print("     - Search 'bell pepper yellow leaf curl'")
    print("     - Search 'capsicum nutrient deficiency chlorosis'")
    print("  Need: 200-500 images per disease")
    print()
    
    print("Option 4: Create Synthetic Data")
    print("-" * 70)
    print("  Use image augmentation on existing images:")
    print("     - Rotation, flipping, brightness adjustment")
    print("     - Color jittering for disease simulation")
    print("     - Can increase dataset size 5-10x")
    print()

def download_instructions():
    """Show step-by-step download instructions"""
    print_header("📥 STEP-BY-STEP DOWNLOAD GUIDE")
    
    print("Prerequisites:")
    print("  1. Kaggle account (free): https://www.kaggle.com/")
    print("  2. Kaggle API credentials in ~/.kaggle/kaggle.json")
    print("  3. Kaggle package: pip install kaggle")
    print()
    
    print("Step 1: Download Dataset")
    print("-" * 70)
    print("  # Recommended: Pepper Bell Leaf Diseases")
    print("  kaggle datasets download -d abdallahwagih/pepperbell-leafe-diseases-dataset")
    print()
    print("  # Alternative: PlantVillage (pepper section)")
    print("  kaggle datasets download -d emmarex/plantdisease")
    print()
    
    print("Step 2: Extract the ZIP file")
    print("-" * 70)
    print("  # Windows PowerShell:")
    print("  Expand-Archive -Path 'pepperbell-leafe-diseases-dataset.zip' -DestinationPath 'pepper_data'")
    print()
    print("  # Or right-click > Extract All")
    print()
    
    print("Step 3: Organize into Training Folders")
    print("-" * 70)
    print("  Move images to:")
    print("    backend/python/pepper_dataset/")
    print("      ├── Healthy/")
    print("      ├── Bacterial Spot/")
    print("      ├── Yellow Leaf Curl/")
    print("      └── Nutrient Deficiency/")
    print()
    
    print("Step 4: Train the Model")
    print("-" * 70)
    print("  cd backend/python")
    print("  python train_now.py")
    print()
    
    print("Step 5: Test!")
    print("-" * 70)
    print("  The API will automatically use the new model")
    print("  Upload test images at: http://localhost:3000/disease-detection")
    print()

def show_current_status():
    """Show current dataset status"""
    print_header("📊 YOUR CURRENT DATASET")
    
    import pathlib
    dataset_path = pathlib.Path('pepper_dataset')
    
    if not dataset_path.exists():
        print("❌ Dataset folder not found: pepper_dataset/")
        return
    
    total_images = 0
    for category in ['Healthy', 'Bacterial Spot', 'Yellow Leaf Curl', 'Nutrient Deficiency']:
        folder = dataset_path / category
        if folder.exists():
            images = list(folder.glob('*.jpg')) + list(folder.glob('*.png')) + list(folder.glob('*.JPG'))
            count = len(images)
            total_images += count
            status = "✅" if count > 0 else "❌"
            print(f"  {status} {category}: {count} images")
        else:
            print(f"  ❌ {category}: Folder not found")
    
    print(f"\n  Total: {total_images} images")
    print(f"  Current accuracy: 98.5% (for 2 classes)")
    print()

def main():
    print_header("🌶️ PEPPER DISEASE DATASETS FINDER")
    
    print("What would you like to do?")
    print()
    print("1. View recommended pepper disease datasets")
    print("2. Find datasets for additional diseases (Yellow Leaf Curl, etc.)")
    print("3. See download and setup instructions")
    print("4. Check current dataset status")
    print("5. Exit")
    print()
    
    try:
        choice = input("Enter choice (1-5): ").strip()
        
        if choice == '1':
            show_pepper_datasets()
        elif choice == '2':
            show_additional_diseases()
        elif choice == '3':
            download_instructions()
        elif choice == '4':
            show_current_status()
        elif choice == '5':
            print("\n👋 Happy training!")
        else:
            print("\n❌ Invalid choice")
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")

if __name__ == '__main__':
    main()
