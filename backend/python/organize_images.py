"""
Manual Image Organizer
Helps you organize downloaded plant disease images into categories
"""

import os
import shutil
from pathlib import Path

def find_all_images(source_dir):
    """Find all image files in directory"""
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.JPG', '.JPEG', '.PNG'}
    images = []
    
    source_path = Path(source_dir)
    
    for ext in image_extensions:
        images.extend(source_path.glob(f'**/*{ext}'))
    
    return images

def is_pepper_image(image_path):
    """Check if image is from pepper plant"""
    path_str = str(image_path).lower()
    pepper_keywords = ['pepper', 'capsicum', 'bell_pepper', 'chilli', 'chili']
    return any(keyword in path_str for keyword in pepper_keywords)

def categorize_by_name(image_path):
    """Try to determine category from filename/folder name"""
    path_str = str(image_path).lower()
    
    # First check if it's a pepper image
    if not is_pepper_image(image_path):
        return 'Not_Pepper'
    
    # Our categories and their keywords
    categories = {
        'Healthy': ['healthy', 'normal', 'good'],
        'Bacterial Spot': ['bacterial', 'spot', 'bacteria'],
        'Yellow Leaf Curl': ['yellow', 'curl', 'leaf_curl', 'virus', 'ylc'],
        'Nutrient Deficiency': ['deficiency', 'nutrient', 'nitrogen', 'chlorosis', 'deficient']
    }
    
    for category, keywords in categories.items():
        if any(keyword in path_str for keyword in keywords):
            return category
    
    return 'Unknown'

def organize_images(source_dir, output_dir='backend/python/pepper_dataset'):
    """Organize images into category folders"""
    print("\n" + "="*70)
    print("🗂️  ORGANIZING IMAGES")
    print("="*70)
    
    source_path = Path(source_dir)
    output_path = Path(output_dir)
    
    if not source_path.exists():
        print(f"\n❌ Source directory not found: {source_dir}")
        print("\nPlease download dataset first!")
        return False
    
    # Create category folders  
    categories = ['Healthy', 'Bacterial Spot', 'Yellow Leaf Curl', 'Nutrient Deficiency', 'Unknown']
    for category in categories:
        (output_path / category).mkdir(parents=True, exist_ok=True)
    
    # Track non-pepper images separately
    pepper_count = 0
    non_pepper_count = 0
    
    # Find all images
    print(f"\n📁 Searching for images in: {source_dir}")
    images = find_all_images(source_dir)
    print(f"   Found: {len(images)} images")
    
    if len(images) == 0:
        print("\n❌ No images found!")
        print("   Make sure you extracted the dataset ZIP file")
        return False
    
    # Categorize and copy
    print("\n📋 Categorizing images (pepper images only)...")
    counts = {cat: 0 for cat in categories}
    
    for i, img_path in enumerate(images):
        if i % 100 == 0 and i > 0:
            print(f"   Processed: {i}/{len(images)} | Pepper: {pepper_count} | Skipped: {non_pepper_count}", end='\r')
        
        category = categorize_by_name(img_path)
        
        # Skip non-pepper images
        if category == 'Not_Pepper':
            non_pepper_count += 1
            continue
        
        pepper_count += 1
        counts[category] += 1
        
        try:
            dest = output_path / category / img_path.name
            shutil.copy2(img_path, dest)
        except Exception as e:
            print(f"\n   Error copying {img_path.name}: {e}")
    
    # Show results
    print("\n✅ Organization complete!")
    print(f"\n🌶️  Total pepper images: {pepper_count}")
    print(f"⏭️  Skipped non-pepper: {non_pepper_count}")
    print(f"\n📊 Pepper images by category:")
    
    print(f"\n   Processed: {len(images)}/{len(images)}")
    
    # Show results
    print("\n✅ Organization complete!")
    print(f"\n📊 Results (saved to: {output_path}):")
    for category, count in counts.items():
        if count > 0:
            emoji = "✅" if category != "Unknown" else "⚠️ "
            print(f"   {emoji} {category}: {count} images")
    
    # Handle unknown
    if counts['Unknown'] > 0:
        print(f"\n⚠️  {counts['Unknown']} images couldn't be auto-categorized")
        print(f"   Check: {output_path / 'Unknown'}")
        print(f"   Manually move them to correct folders")
    
    print(f"\n📂 Dataset ready at: {output_path.absolute()}")
    
    return True

def main():
    """Main function"""
    print("\n" + "="*70)
    print("🌿 MANUAL IMAGE ORGANIZER")
    print("="*70)
    
    print("\nThis script helps organize downloaded disease images.")
    print("\nStep 1: Download a dataset (from links above)")
    print("Step 2: Extract the ZIP file")
    print("Step 3: Run this script")
    
    print("\n" + "="*70)
    
    # Ask for source directory
    print("\nWhere did you extract the dataset?")
    print("Example: C:\\Users\\YourName\\Downloads\\PlantVillage")
    print("Example: backend/python/datasets/PlantVillage")
    
    source_dir = input("\nEnter path (or press Enter for default): ").strip()
    
    if not source_dir:
        source_dir = "backend/python/datasets"
    
    # Remove quotes if user copied path with quotes
    source_dir = source_dir.strip('"').strip("'")
    
    print(f"\n📁 Source: {source_dir}")
    
    # Ask for confirmation
    confirm = input("\nOrganize images? (y/n): ").lower()
    
    if confirm == 'y':
        success = organize_images(source_dir)
        
        if success:
            print("\n" + "="*70)
            print("🎉 SUCCESS!")
            print("="*70)
            print("\nYour images are organized and ready!")
            print("\nNext step:")
            print("  python train_with_real_images.py")
        else:
            print("\n❌ Organization failed")
            print("\nMake sure:")
            print("  1. You downloaded a dataset")
            print("  2. You extracted the ZIP file")
            print("  3. The path is correct")
    else:
        print("\nCancelled")
    
    input("\nPress Enter to exit...")

if __name__ == '__main__':
    main()
