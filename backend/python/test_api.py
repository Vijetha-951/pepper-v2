import requests
import json
import os

def test_prediction(image_path, expected_class=None):
    print(f"\n{'='*60}")
    print(f"Testing: {os.path.basename(image_path)}")
    print(f"{'='*60}")
    
    url = 'http://localhost:5001/predict'
    
    with open(image_path, 'rb') as f:
        files = {'image': f}
        data = {'pepper_type': 'black_pepper'}
        response = requests.post(url, files=files, data=data)
    
    if response.status_code == 200:
        result = response.json()
        prediction = result.get('prediction', {})
        
        print(f"✅ API Response received")
        
        # Handle disease_info structure if present (API format)
        disease_info = prediction.get('disease_info', {})
        if disease_info:
            print(f"   Disease     : {disease_info.get('name')}")
            print(f"   Severity    : {disease_info.get('severity')}")
        else:
            # Fallback for direct format
            print(f"   Disease     : {prediction.get('disease')}")
            print(f"   Severity    : {prediction.get('severity')}")
        
        print(f"   Confidence  : {prediction.get('confidence')}%")
        
        # Handle metadata if present
        metadata = prediction.get('metadata', {})
        if metadata:
            print(f"   Framework   : {metadata.get('model_type', 'N/A')}")
        else:
            print(f"   Framework   : {prediction.get('model_framework', 'N/A')}")
        
        print(f"\n   All Probabilities:")
        all_preds = prediction.get('all_predictions', [])
        
        # Handle both list (API format) and dict (direct format)
        if isinstance(all_preds, list):
            for pred in all_preds:
                disease = pred.get('disease', '')
                prob = pred.get('probability', 0)
                bar = '█' * int(float(prob) / 5)
                print(f"   {disease:<20} {bar} {float(prob):.2f}%")
        elif isinstance(all_preds, dict):
            for cls, prob in all_preds.items():
                bar = '█' * int(float(prob) / 5)
                print(f"   {cls:<20} {bar} {float(prob):.2f}%")
        
        print(f"\n   Treatment:")
        treatment = disease_info.get('treatment') if disease_info else prediction.get('treatment', [])
        if treatment:
            for t in treatment:
                print(f"   - {t}")
            
        if expected_class:
            actual_disease = disease_info.get('name') if disease_info else prediction.get('disease')
            match = actual_disease == expected_class
            print(f"\n   Expected: {expected_class}")
            print(f"   Match: {'✅ CORRECT' if match else '❌ WRONG'}")
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)

# Test with your actual images
# Replace these paths with real images from your dataset
test_images = [
    # (image_path, expected_class)
    (r"C:\Users\jinu\Downloads\BLACK_PEPPER_DATASET\BLACK_PEPPER_DATASET\Healthy\aug_Copy of PH0320_3.jpg", "Healthy"),
    (r"C:\Users\jinu\Downloads\BLACK_PEPPER_DATASET\BLACK_PEPPER_DATASET\Footrot\10.jpeg", "Footrot"),
    (r"C:\Users\jinu\Downloads\BLACK_PEPPER_DATASET\BLACK_PEPPER_DATASET\Pollu_Disease\12.jpeg", "Pollu Disease"),
    (r"C:\Users\jinu\Downloads\BLACK_PEPPER_DATASET\BLACK_PEPPER_DATASET\Not_Pepper_Leaf\Image_4.jpg", "Not Pepper Leaf"),
]

for image_path, expected in test_images:
    if os.path.exists(image_path):
        test_prediction(image_path, expected)
    else:
        print(f"⚠️ File not found: {image_path}")
