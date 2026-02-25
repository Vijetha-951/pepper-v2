"""
Quick training script - no prompts
"""
import sys
from train_with_real_images import train_with_real_images

# Train with default settings
dataset_path = 'pepper_dataset'
success = train_with_real_images(dataset_path)

if success:
    print("\n" + "="*70)
    print("🎉 SUCCESS!")
    print("="*70)
    print("\nModel trained with real images!")
    print("The disease detection API will now use this model automatically.")
else:
    print("\n❌ Training failed")
    sys.exit(1)
