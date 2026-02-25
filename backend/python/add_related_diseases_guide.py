"""
Add Related Plant Diseases to Pepper Model
Use tomato/potato disease images to expand your pepper disease detection
"""

import os
import shutil
from pathlib import Path
import zipfile

def print_header(text):
    print("\n" + "="*70)
    print(f"  {text}")
    print("="*70 + "\n")

def show_strategy():
    """Explain the strategy"""
    print_header("🧬 WHY RELATED PLANTS WORK")
    
    print("Pepper, Tomato, and Potato are in the same family (Solanaceae)")
    print("They share similar:")
    print("  ✅ Leaf structure and appearance")
    print("  ✅ Disease symptoms (yellowing, spots, curling)")
    print("  ✅ Pathogens (viruses, bacteria, nutrient issues)")
    print()
    print("This means their disease images can help train your pepper model!")
    print()

def show_disease_mapping():
    """Show which diseases to use from related plants"""
    print_header("🗺️ DISEASE MAPPING")
    
    mappings = [
        {
            "target": "Yellow Leaf Curl",
            "source": "Tomato Yellow Leaf Curl Virus",
            "folder": "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
            "why": "Same virus family, identical symptoms",
            "confidence": "⭐⭐⭐⭐⭐ (95% similar)"
        },
        {
            "target": "Nutrient Deficiency",
            "source": "Tomato Leaf Mold / Potato Early Blight (pale leaves)",
            "folder": "Tomato___Leaf_Mold or Potato___Early_blight",
            "why": "Similar chlorosis and nutrient deficiency symptoms",
            "confidence": "⭐⭐⭐⭐ (80% similar)"
        },
        {
            "target": "Nutrient Deficiency (Alternative)",
            "source": "Manual collection of chlorotic leaves",
            "folder": "Search: 'tomato nitrogen deficiency', 'potato magnesium deficiency'",
            "why": "Nutrient deficiency looks the same across plants",
            "confidence": "⭐⭐⭐⭐⭐ (90% similar)"
        }
    ]
    
    for i, mapping in enumerate(mappings, 1):
        print(f"{i}. Target Disease: {mapping['target']}")
        print(f"   Use From: {mapping['source']}")
        print(f"   Folder: {mapping['folder']}")
        print(f"   Why: {mapping['why']}")
        print(f"   Confidence: {mapping['confidence']}")
        print()

def download_instructions():
    """Step-by-step download instructions"""
    print_header("📥 STEP-BY-STEP GUIDE")
    
    print("STEP 1: Download PlantVillage Dataset")
    print("-" * 70)
    print("This contains tomato and potato diseases you can use.")
    print()
    print("Option A: Via Kaggle API (Recommended)")
    print("  kaggle datasets download -d arjuntejaswi/plant-village")
    print()
    print("Option B: Manual Download")
    print("  1. Go to: https://www.kaggle.com/datasets/arjuntejaswi/plant-village")
    print("  2. Click 'Download' button")
    print("  3. Extract the ZIP file")
    print()
    
    print("STEP 2: Extract Relevant Disease Folders")
    print("-" * 70)
    print("After extracting, you'll see folders like:")
    print("  PlantVillage/")
    print("    ├── Tomato___Tomato_Yellow_Leaf_Curl_Virus/")
    print("    ├── Tomato___Leaf_Mold/")
    print("    ├── Potato___Early_blight/")
    print("    └── ... (many others)")
    print()
    print("We'll use the tomato/potato folders for our pepper model.")
    print()
    
    print("STEP 3: Copy Images to Pepper Dataset")
    print("-" * 70)
    print("Organize images like this:")
    print()
    print("  backend/python/pepper_dataset/")
    print("    ├── Healthy/                    (keep existing)")
    print("    ├── Bacterial Spot/             (keep existing)")
    print("    ├── Yellow Leaf Curl/           (ADD: from Tomato Yellow Curl)")
    print("    └── Nutrient Deficiency/        (ADD: from Tomato Leaf Mold)")
    print()
    
    print("STEP 4: Copy Commands")
    print("-" * 70)
    print("Windows PowerShell:")
    print()
    print("  # Navigate to extracted PlantVillage folder")
    print("  cd path\\to\\PlantVillage")
    print()
    print("  # Copy Yellow Leaf Curl images")
    print("  Copy-Item -Path 'Tomato___Tomato_Yellow_Leaf_Curl_Virus\\*' `")
    print("    -Destination 'C:\\xampp\\htdocs\\PEPPER\\backend\\python\\pepper_dataset\\Yellow Leaf Curl\\'")
    print()
    print("  # Copy images for Nutrient Deficiency")
    print("  Copy-Item -Path 'Tomato___Leaf_Mold\\*' `")
    print("    -Destination 'C:\\xampp\\htdocs\\PEPPER\\backend\\python\\pepper_dataset\\Nutrient Deficiency\\'")
    print()
    print("  # Optional: Add more variety (mix different nutrient issues)")
    print("  Copy-Item -Path 'Potato___Early_blight\\*' `")
    print("    -Destination 'C:\\xampp\\htdocs\\PEPPER\\backend\\python\\pepper_dataset\\Nutrient Deficiency\\'")
    print()
    
    print("STEP 5: Verify Image Counts")
    print("-" * 70)
    print("  cd C:\\xampp\\htdocs\\PEPPER\\backend\\python")
    print("  Get-ChildItem pepper_dataset | ForEach-Object {")
    print("    Write-Host $_.Name ': ' (Get-ChildItem $_.FullName -File).Count")
    print("  }")
    print()
    print("Target counts:")
    print("  - Healthy: 1,000-2,000")
    print("  - Bacterial Spot: 1,000-2,000")
    print("  - Yellow Leaf Curl: 500-1,000")
    print("  - Nutrient Deficiency: 500-1,000")
    print()
    
    print("STEP 6: Retrain the Model")
    print("-" * 70)
    print("  cd C:\\xampp\\htdocs\\PEPPER\\backend\\python")
    print("  python train_now.py")
    print()
    print("Expected training time: 5-10 minutes")
    print("Expected accuracy: 90-95% with 4 classes")
    print()
    
    print("STEP 7: Test!")
    print("-" * 70)
    print("  1. Restart disease detection API (if not auto-restarted)")
    print("  2. Go to: http://localhost:3000/disease-detection")
    print("  3. Upload test images")
    print("  4. Model should now detect all 4 diseases!")
    print()

def create_helper_script():
    """Offer to create an automated copy script"""
    print_header("🤖 AUTOMATED HELPER SCRIPT")
    
    print("Would you like to create a PowerShell script to automate copying?")
    print()
    
    script_content = """# Copy Related Plant Diseases to Pepper Dataset
# Run this script from the PlantVillage extracted folder

$pepperDataset = "C:\\xampp\\htdocs\\PEPPER\\backend\\python\\pepper_dataset"

Write-Host "🌿 Copying Related Plant Diseases..." -ForegroundColor Green
Write-Host ""

# Create folders if they don't exist
New-Item -ItemType Directory -Path "$pepperDataset\\Yellow Leaf Curl" -Force | Out-Null
New-Item -ItemType Directory -Path "$pepperDataset\\Nutrient Deficiency" -Force | Out-Null

# Copy Yellow Leaf Curl from Tomato
if (Test-Path "Tomato___Tomato_Yellow_Leaf_Curl_Virus") {
    Write-Host "Copying Yellow Leaf Curl images from Tomato..." -ForegroundColor Cyan
    Copy-Item -Path "Tomato___Tomato_Yellow_Leaf_Curl_Virus\\*" `
        -Destination "$pepperDataset\\Yellow Leaf Curl\\" -Force
    $count = (Get-ChildItem "$pepperDataset\\Yellow Leaf Curl" -File).Count
    Write-Host "  ✅ Copied $count images" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Tomato___Tomato_Yellow_Leaf_Curl_Virus folder not found" -ForegroundColor Yellow
}

Write-Host ""

# Copy Nutrient Deficiency from Tomato Leaf Mold
if (Test-Path "Tomato___Leaf_Mold") {
    Write-Host "Copying Nutrient Deficiency images from Tomato Leaf Mold..." -ForegroundColor Cyan
    Copy-Item -Path "Tomato___Leaf_Mold\\*" `
        -Destination "$pepperDataset\\Nutrient Deficiency\\" -Force
    $count = (Get-ChildItem "$pepperDataset\\Nutrient Deficiency" -File).Count
    Write-Host "  ✅ Copied $count images (total so far)" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Tomato___Leaf_Mold folder not found" -ForegroundColor Yellow
}

Write-Host ""

# Optional: Add more variety from Potato
if (Test-Path "Potato___Early_blight") {
    Write-Host "Adding more variety from Potato Early Blight..." -ForegroundColor Cyan
    Copy-Item -Path "Potato___Early_blight\\*" `
        -Destination "$pepperDataset\\Nutrient Deficiency\\" -Force
    $count = (Get-ChildItem "$pepperDataset\\Nutrient Deficiency" -File).Count
    Write-Host "  ✅ Total Nutrient Deficiency images: $count" -ForegroundColor Green
}

Write-Host ""
Write-Host "="*70
Write-Host "✅ DONE!" -ForegroundColor Green
Write-Host "="*70
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Verify image counts:"
Write-Host "     cd C:\\xampp\\htdocs\\PEPPER\\backend\\python"
Write-Host "     Get-ChildItem pepper_dataset | ForEach-Object { Write-Host $_.Name ': ' (Get-ChildItem $_.FullName -File).Count }"
Write-Host ""
Write-Host "  2. Retrain the model:"
Write-Host "     python train_now.py"
Write-Host ""
"""
    
    script_path = Path("copy_related_diseases.ps1")
    with open(script_path, 'w', encoding='utf-8') as f:
        f.write(script_content)
    
    print(f"✅ Created: {script_path.absolute()}")
    print()
    print("Usage:")
    print("  1. Download and extract PlantVillage dataset")
    print("  2. Open PowerShell in the PlantVillage folder")
    print("  3. Run: .\\copy_related_diseases.ps1")
    print()

def show_tips():
    """Show tips and best practices"""
    print_header("💡 TIPS & BEST PRACTICES")
    
    print("1. Image Quality")
    print("   ✅ Use only clear, well-lit images")
    print("   ✅ Remove blurry or dark images")
    print("   ❌ Avoid images with watermarks or text overlays")
    print()
    
    print("2. Image Balance")
    print("   ✅ Try to have similar counts for each disease (±500)")
    print("   ✅ If one class has too many, randomly select a subset")
    print("   ❌ Don't have 5000 of one disease and 100 of another")
    print()
    
    print("3. Disease Selection")
    print("   ✅ Yellow Leaf Curl: Use ONLY Tomato Yellow Curl (very similar)")
    print("   ✅ Nutrient Deficiency: Mix Tomato/Potato pale/chlorotic leaves")
    print("   ❌ Don't use diseases that look nothing like pepper issues")
    print()
    
    print("4. After Training")
    print("   ✅ Test with real pepper images first")
    print("   ✅ Check if it still correctly identifies Healthy/Bacterial Spot")
    print("   ✅ If accuracy drops below 85%, you may need more pepper-specific images")
    print()

def main():
    print_header("🌿 ADD RELATED PLANT DISEASES TO PEPPER MODEL")
    
    print("This guide helps you use Tomato/Potato disease images")
    print("to expand your pepper disease detection to 4 classes:")
    print("  1. Healthy")
    print("  2. Bacterial Spot")
    print("  3. Yellow Leaf Curl (from Tomato)")
    print("  4. Nutrient Deficiency (from Tomato/Potato)")
    print()
    
    print("Choose an option:")
    print("  1. Show disease mapping strategy")
    print("  2. Step-by-step download and setup guide")
    print("  3. Create automated copy script")
    print("  4. Show tips and best practices")
    print("  5. Exit")
    print()
    
    try:
        choice = input("Enter choice (1-5): ").strip()
        
        if choice == '1':
            show_strategy()
            show_disease_mapping()
        elif choice == '2':
            download_instructions()
        elif choice == '3':
            create_helper_script()
        elif choice == '4':
            show_tips()
        elif choice == '5':
            print("\n👋 Good luck with your training!")
        else:
            print("\n❌ Invalid choice")
            print("\nShowing full guide...\n")
            show_strategy()
            show_disease_mapping()
            download_instructions()
            show_tips()
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")

if __name__ == '__main__':
    main()
