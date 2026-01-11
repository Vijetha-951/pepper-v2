"""
Quick start script for Pepper ML Module
Runs all setup steps in sequence
"""

import os
import sys
import subprocess

def print_step(step_num, description):
    """Print formatted step header"""
    print(f"\n{'='*60}")
    print(f"Step {step_num}: {description}")
    print(f"{'='*60}\n")

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"Running: {description}")
    print(f"Command: {command}\n")
    
    result = subprocess.run(command, shell=True)
    
    if result.returncode != 0:
        print(f"\n❌ Error: {description} failed")
        return False
    
    print(f"\n✅ Success: {description} completed")
    return True

def main():
    """Run all setup steps"""
    print("="*60)
    print("Pepper ML Module - Quick Start")
    print("="*60)
    
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Step 1: Generate training data
    print_step(1, "Generating Training Data")
    if not run_command(
        f"{sys.executable} generate_pepper_training_data.py",
        "Generate training data"
    ):
        return
    
    # Step 2: Train models
    print_step(2, "Training ML Models")
    if not run_command(
        f"{sys.executable} pepper_yield_predictor.py",
        "Train ML models"
    ):
        return
    
    # Step 3: Test prediction
    print_step(3, "Testing Prediction")
    print("Testing with sample input...")
    
    test_code = """
from pepper_yield_predictor import PepperYieldPredictor

predictor = PepperYieldPredictor()
predictor.load_models()

test_input = {
    'soil_type': 'Loamy',
    'water_availability': 'High',
    'irrigation_frequency': 4,
    'crop_stage': 'Fruiting'
}

result = predictor.predict(test_input)
print('\\n=== Test Prediction Result ===')
print(f"Predicted Yield: {result['predicted_yield_kg']} kg/plant")
print(f"Soil Suitability: {result['soil_suitability']} ({result['suitability_confidence']}% confidence)")
print(f"\\nIrrigation: {result['irrigation_recommendation']}")
print(f"Fertilizer: {result['fertilizer_recommendation']}")
print(f"\\nTips:")
for tip in result['additional_tips']:
    print(f"  - {tip}")
"""
    
    with open('test_prediction.py', 'w') as f:
        f.write(test_code)
    
    if not run_command(
        f"{sys.executable} test_prediction.py",
        "Test prediction"
    ):
        return
    
    # Cleanup test file
    if os.path.exists('test_prediction.py'):
        os.remove('test_prediction.py')
    
    # Final summary
    print("\n" + "="*60)
    print("🎉 Setup Complete!")
    print("="*60)
    print("\n✓ Training data generated")
    print("✓ ML models trained and saved")
    print("✓ Prediction test passed")
    print("\nNext steps:")
    print("1. Start the Flask API:")
    print(f"   {sys.executable} pepper_ml_api.py")
    print("\n2. In another terminal, start your Node.js backend:")
    print("   cd ..")
    print("   npm start")
    print("\n3. Test the API:")
    print("   curl http://localhost:5001/health")
    print("\n4. See PEPPER_ML_SETUP_GUIDE.md for detailed documentation")
    print("="*60)

if __name__ == "__main__":
    main()
