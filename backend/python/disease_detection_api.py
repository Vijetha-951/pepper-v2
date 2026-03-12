"""
Disease Detection API
Flask REST API for pepper plant disease detection from leaf images
"""

print("\n" + "="*60)
print("BLACK PEPPER DISEASE DETECTION API")
print("="*60)
print("Step 1/4: Importing libraries...")

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
from datetime import datetime
from werkzeug.utils import secure_filename
import traceback

print("Step 2/4: Importing disease detector...")
# Import the black pepper disease detector
from dual_model_detector import DualModelDetector as PlantDiseaseDetector
print("Step 3/4: Initializing Flask app...")

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'backend/uploads/disease_images'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

print("Step 4/4: Initializing disease detector (may take 20-30 seconds)...")
print("Loading TensorFlow and Black Pepper CNN model...\n")
# Initialize black pepper disease detector
detector = PlantDiseaseDetector()
print("\nAll initialization complete!")


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_disease_description(disease_name):
    """Get disease description"""
    descriptions = {
        # Bell Pepper Diseases
        'Pepper__bell___Bacterial_spot': 'Bacterial leaf spot caused by Xanthomonas bacteria. Causes dark spots with yellow halos on leaves.',
        'Pepper__bell___healthy': 'The plant appears healthy with no visible signs of disease.',
        'Pepper__bell___Yellow_Leaf_Curl': 'Viral disease causing yellowing, curling, and stunted growth of leaves.',
        'Pepper__bell___Nutrient_Deficiency': 'Yellowing or discoloration due to lack of essential nutrients like Nitrogen, Potassium or Magnesium.',
        # Black Pepper Diseases - EXACT class names from PyTorch model
        'Footrot': 'Phytophthora capsici fungal disease affecting roots and stem base, causing wilting, yellowing, and eventual plant death. Major disease in high rainfall areas.',
        'Healthy': 'The black pepper plant appears healthy with no visible signs of disease.',
        'Not_Pepper_Leaf': 'The uploaded image does not appear to be a pepper leaf. Please upload a clear image of a black pepper plant leaf.',
        'Pollu_Disease': 'Pollu beetle (Longitarsus nigripennis) infestation causing leaf damage, shot holes, and defoliation. Beetles feed on tender leaves and shoots.',
        'Slow-Decline': 'Slow wilt syndrome caused by various pathogens including nematodes and fungi, leading to gradual yellowing, wilting, and progressive plant decline over months.',
        # Legacy black pepper diseases (formatted names for backward compatibility)
        'Black Pepper Footrot': 'Phytophthora capsici fungal disease affecting roots and stem base, causing wilting, yellowing, and eventual plant death. Major disease in high rainfall areas.',
        'Black Pepper Healthy': 'The black pepper plant appears healthy with no visible signs of disease.',
        'Black Pepper Not Pepper Leaf': 'The uploaded image does not appear to be a pepper leaf. Please upload a clear image of a black pepper plant leaf.',
        'Black Pepper Pollu Disease': 'Pollu beetle (Longitarsus nigripennis) infestation causing leaf damage, shot holes, and defoliation. Beetles feed on tender leaves and shoots.',
        'Black Pepper Slow Decline': 'Slow wilt syndrome caused by various pathogens including nematodes and fungi, leading to gradual yellowing, wilting, and progressive plant decline over months.',
        'Black Pepper Leaf Blight': 'A fungal disease causing brown lesions on leaves, leading to defoliation and reduced yield.',
        'Black Pepper Yellow Mottle Virus': 'A viral disease causing yellow mottling and mosaic patterns on leaves, transmitted by aphids.'
    }
    return descriptions.get(disease_name, 'No description available')


def get_disease_severity(disease_name):
    """Get disease severity"""
    severity_map = {
        # Bell Pepper
        'Pepper__bell___Bacterial_spot': 'Moderate',
        'Pepper__bell___healthy': 'None',
        'Pepper__bell___Yellow_Leaf_Curl': 'High',
        'Pepper__bell___Nutrient_Deficiency': 'Low to Moderate',
        # Black Pepper - EXACT class names from PyTorch model
        'Footrot': 'Critical',
        'Healthy': 'None',
        'Not_Pepper_Leaf': 'N/A',
        'Pollu_Disease': 'High',
        'Slow-Decline': 'High to Critical',
        # Legacy formatted names
        'Black Pepper Footrot': 'Critical',
        'Black Pepper Healthy': 'None',
        'Black Pepper Not Pepper Leaf': 'N/A',
        'Black Pepper Pollu Disease': 'High',
        'Black Pepper Slow Decline': 'High to Critical',
        'Black Pepper Leaf Blight': 'High',
        'Black Pepper Yellow Mottle Virus': 'High'
    }
    return severity_map.get(disease_name, 'Unknown')


def get_disease_treatment(disease_name):
    """Get treatment recommendations"""
    treatments = {
        # Bell Pepper
        'Pepper__bell___Bacterial_spot': [
            'Remove and destroy infected leaves',
            'Apply copper-based bactericide',
            'Improve air circulation around plants',
            'Avoid overhead watering',
            'Use drip irrigation if possible'
        ],
        'Pepper__bell___healthy': [
            'Continue regular care practices',
            'Monitor plants regularly',
            'Maintain good plant hygiene'
        ],
        'Pepper__bell___Yellow_Leaf_Curl': [
            'Remove and destroy infected plants',
            'Control whitefly populations (virus vector)',
            'Use reflective mulches to repel whiteflies',
            'Apply neem oil or insecticidal soap'
        ],
        'Pepper__bell___Nutrient_Deficiency': [
            'Apply balanced NPK fertilizer (10-10-10)',
            'For nitrogen deficiency: add blood meal or fish emulsion',
            'For magnesium deficiency: apply Epsom salt solution',
            'Test soil pH and adjust if needed (optimal: 6.0-6.8)'
        ],
        # Black Pepper - EXACT class names from PyTorch model
        'Footrot': [
            'Improve drainage immediately - avoid waterlogging',
            'Apply Bordeaux mixture (1%) or metalaxyl-based fungicide to stem base',
            'Remove soil around root collar for better aeration',
            'Apply Trichoderma viride as biocontrol agent',
            'Drench soil with copper oxychloride (0.25%)',
            'Remove and burn severely infected plants to prevent spread',
            'Apply neem cake around plant base (500g per plant)'
        ],
        'Healthy': [
            'Continue regular care practices',
            'Monitor plants regularly',
            'Maintain proper irrigation and drainage',
            'Apply organic mulch around plants'
        ],
        'Not_Pepper_Leaf': [
            'Please upload a clear image of a black pepper plant leaf',
            'Ensure the image shows the leaf clearly with good lighting',
            'Avoid uploading images of other plants, objects, or people'
        ],
        'Pollu_Disease': [
            'Spray quinalphos (0.05%) or chlorpyriphos (0.04%)',
            'Apply neem-based insecticide (1500 ppm azadirachtin)',
            'Remove and destroy affected leaves',
            'Practice field sanitation - remove fallen leaves',
            'Apply soil drenching with phorate granules',
            'Spray early morning when beetles are active',
            'Repeat treatment every 15 days during infestation period'
        ],
        'Slow-Decline': [
            'Apply nematicide if root-knot nematodes detected',
            'Improve soil drainage and aeration',
            'Apply Trichoderma harzianum to soil',
            'Foliar spray with micronutrients (zinc, boron, magnesium)',
            'Apply organic matter and compost to improve soil health',
            'Drench with copper-based fungicide around root zone',
            'Consider replanting with disease-free, resistant varieties if condition worsens',
            'Test soil for nematode presence and nutrient deficiencies'
        ],
        # Legacy formatted names
        'Black Pepper Footrot': [
            'Improve drainage immediately - avoid waterlogging',
            'Apply Bordeaux mixture (1%) or metalaxyl-based fungicide to stem base',
            'Remove soil around root collar for better aeration',
            'Apply Trichoderma viride as biocontrol agent',
            'Drench soil with copper oxychloride (0.25%)',
            'Remove and burn severely infected plants to prevent spread',
            'Apply neem cake around plant base (500g per plant)'
        ],
        'Black Pepper Healthy': [
            'Continue regular care practices',
            'Monitor plants regularly',
            'Maintain proper irrigation and drainage',
            'Apply organic mulch around plants'
        ],
        'Black Pepper Not Pepper Leaf': [
            'Please upload a clear image of a black pepper plant leaf',
            'Ensure the image shows the leaf clearly with good lighting',
            'Avoid uploading images of other plants, objects, or people'
        ],
        'Black Pepper Pollu Disease': [
            'Spray quinalphos (0.05%) or chlorpyriphos (0.04%)',
            'Apply neem-based insecticide (1500 ppm azadirachtin)',
            'Remove and destroy affected leaves',
            'Practice field sanitation - remove fallen leaves',
            'Apply soil drenching with phorate granules',
            'Spray early morning when beetles are active',
            'Repeat treatment every 15 days during infestation period'
        ],
        'Black Pepper Slow Decline': [
            'Apply nematicide if root-knot nematodes detected',
            'Improve soil drainage and aeration',
            'Apply Trichoderma harzianum to soil',
            'Foliar spray with micronutrients (zinc, boron, magnesium)',
            'Apply organic matter and compost to improve soil health',
            'Drench with copper-based fungicide around root zone',
            'Consider replanting with disease-free, resistant varieties if condition worsens',
            'Test soil for nematode presence and nutrient deficiencies'
        ],
        # Legacy
        'Black Pepper Leaf Blight': [
            'Remove and destroy infected leaves immediately',
            'Apply fungicide (Bordeaux mixture or copper oxychloride)',
            'Improve air circulation by pruning dense growth',
            'Avoid overhead irrigation',
            'Apply fungicide spray every 10-15 days during rainy season'
        ],
        'Black Pepper Yellow Mottle Virus': [
            'Remove and destroy infected plants to prevent spread',
            'Control aphid populations using insecticides or neem oil',
            'Use virus-free planting material',
            'Maintain field hygiene and remove weed hosts',
            'No chemical cure available - prevention is key'
        ]
    }
    return treatments.get(disease_name, [])


def get_disease_prevention(disease_name):
    """Get prevention tips"""
    prevention = {
        # Bell Pepper
        'Pepper__bell___Bacterial_spot': [
            'Use disease-free seeds',
            'Rotate crops annually',
            'Maintain proper plant spacing',
            'Water at the base of plants',
            'Remove plant debris regularly'
        ],
        'Pepper__bell___healthy': [
            'Continue current care practices',
            'Regular inspection for early detection',
            'Maintain balanced fertilization'
        ],
        'Pepper__bell___Yellow_Leaf_Curl': [
            'Use virus-resistant varieties',
            'Install insect-proof screens in greenhouses',
            'Remove weeds that harbor whiteflies',
            'Monitor for whitefly presence regularly'
        ],
        'Pepper__bell___Nutrient_Deficiency': [
            'Regular soil testing (every 6 months)',
            'Maintain proper fertilization schedule',
            'Use compost to improve soil quality',
            'Ensure proper drainage to prevent nutrient leaching'
        ],
        # Black Pepper
        'Black Pepper Footrot': [
            'Ensure excellent drainage - avoid low-lying waterlogged areas',
            'Plant on raised beds or mounds (30-45 cm height)',
            'Use disease-free cuttings from certified sources',
            'Apply Trichoderma viride to soil before planting',
            'Avoid over-irrigation, especially during monsoon',
            'Maintain proper spacing (2-3 meters) for air circulation',
            'Apply organic mulch but avoid stem contact',
            'Monitor regularly during rainy season'
        ],
        'Black Pepper Healthy': [
            'Regular inspection for early disease detection',
            'Maintain proper drainage and avoid waterlogging',
            'Practice crop rotation if possible',
            'Use disease-free planting material'
        ],
        'Black Pepper Not Pepper Leaf': [
            'Take clear, well-lit photos of pepper leaves',
            'Ensure the leaf fills most of the frame',
            'Upload actual pepper plant leaves only'
        ],
        'Black Pepper Pollu Disease': [
            'Monitor plants regularly for beetle presence',
            'Remove weeds and alternate hosts from field',
            'Use light traps to monitor beetle populations',
            'Apply neem cake to soil (200g per plant) as repellent',
            'Maintain field sanitation - remove fallen leaves',
            'Avoid planting near heavily infested areas',
            'Practice crop rotation with non-host crops'
        ],
        'Black Pepper Slow Decline': [
            'Use certified disease-free, nematode-free planting material',
            'Test soil for nematodes before planting',
            'Apply organic matter (5-10 kg per plant annually)',
            'Ensure good drainage - avoid waterlogging',
            'Practice crop rotation with non-host plants',
            'Use resistant or tolerant varieties (e.g., Panniyur-1)',
            'Maintain proper nutrition with balanced fertilization',
            'Avoid root damage during cultivation'
        ],
        # Legacy
        'Black Pepper Leaf Blight': [
            'Plant resistant varieties',
            'Maintain proper spacing (2-3 meters between plants)',
            'Prune regularly to ensure good air circulation',
            'Apply preventive fungicide before monsoon season',
            'Remove fallen infected leaves from ground'
        ],
        'Black Pepper Yellow Mottle Virus': [
            'Use certified virus-free cuttings for planting',
            'Control aphid vectors through regular monitoring',
            'Remove infected plants immediately to prevent spread',
            'Maintain weed-free field to reduce aphid habitats',
            'Avoid planting near infected areas'
        ]
    }
    return prevention.get(disease_name, [])


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    available_models = detector.get_available_models()
    return jsonify({
        'status': 'healthy',
        'service': 'Black Pepper Disease Detection API',
        'models_loaded': len(available_models),
        'available_models': [m['type'] for m in available_models],
        'current_model': detector.current_model_type,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/train', methods=['POST'])
def train_model():
    """
    Train the disease detection model
    
    Returns:
        Training results with accuracy metrics
    """
    try:
        result = detector.train(synthetic_data=True)
        return jsonify(result)
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/predict', methods=['POST'])
def predict_disease():
    """
    Predict disease from uploaded leaf image
    """
    try:
        print("\n" + "="*50)
        print("[PREDICT] PREDICT ENDPOINT CALLED")
        print("="*50)
        
        # Debug: Print all request info
        print(f"[INFO] Request files: {list(request.files.keys())}")
        print(f"[INFO] Request form: {list(request.form.keys())}")
        print(f"[INFO] Content Type: {request.content_type}")
        
        # Check if model is trained
        if detector.model is None:
            print("[X] ERROR: Model is None!")
            return jsonify({
                'success': False,
                'error': 'Model not trained. Please train the model first.',
                'hint': 'Call POST /train to train the model'
            }), 400
        
        print("[OK] Model is loaded")
        
        # Check if image file is present (accept both 'image' and 'file' keys)
        if 'image' in request.files:
            file = request.files['image']
            print(f"[OK] Found 'image' key: {file.filename}")
        elif 'file' in request.files:
            file = request.files['file']
            print(f"[OK] Found 'file' key: {file.filename}")
        else:
            print(f"[X] ERROR: No image/file found!")
            print(f"Available keys: {list(request.files.keys())}")
            return jsonify({
                'success': False,
                'error': 'No image file provided',
                'hint': 'Send image as multipart/form-data with key "image" or "file"'
            }), 400
        
        # Check if file is selected
        if file.filename == '':
            print("[X] ERROR: Empty filename")
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        print(f"[INFO] Processing file: {file.filename}")
        
        # Check file type
        if not allowed_file(file.filename):
            print(f"[X] ERROR: Invalid file type")
            return jsonify({
                'success': False,
                'error': f'Invalid file type. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400
        
        print(f"[OK] File type valid")
        
        # Save file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        print(f"[SAVE] Saving to: {filepath}")
        file.save(filepath)
        print(f"[OK] File saved successfully")
        
        # Get optional metadata and model type
        metadata = {
            'user_id': request.form.get('user_id'),
            'location': request.form.get('location'),
            'notes': request.form.get('notes')
        }
        
        # Get pepper type (defaults to black_pepper)
        pepper_type = request.form.get('pepper_type', 'black_pepper')
        if pepper_type not in ['bell_pepper', 'black_pepper']:
            pepper_type = 'black_pepper'
        print(f"[MODEL] Using model: {pepper_type}")
        
        # Predict disease
        print(f"[PREDICT] Running prediction...")
        result = detector.predict(filepath, model_type=pepper_type)
        print(f"[OK] Prediction result: {result}")
        
        # Check for validation errors or model rejection (handles validation, confidence, and wrong pepper type)
        if not result.get('success', True):
            error_type = result.get('error', 'Prediction failed')
            print(f"[X] ERROR: {error_type}: {result.get('message')}")
            return jsonify({
                'success': False,
                'error': error_type,
                'message': result.get('message', 'Prediction failed'),
                'suggestion': result.get('suggestion', 'Please try uploading a different image'),
                'confidence': result.get('validation_confidence', result.get('model_confidence', 0)),
                'model_type': result.get('detected_type', pepper_type),
                'detailed_error': result.get('detailed_error', False)
            }), 400
        
        # Transform result to match frontend expectations
        if 'disease' in result:
            # Map disease name to disease info structure
            disease_name = result['disease']
            
            # Create disease_info object
            disease_info = {
                'name': disease_name.replace('Pepper__bell___', '').replace('_', ' ').title(),
                'scientific_name': disease_name,
                'description': get_disease_description(disease_name),
                'severity': get_disease_severity(disease_name),
                'treatment': get_disease_treatment(disease_name),
                'prevention': get_disease_prevention(disease_name)
            }
            
            # Create all_predictions array from probabilities
            all_predictions = []
            # PyTorch returns 'all_predictions' as dict, Keras returns 'probabilities'
            if 'all_predictions' in result and isinstance(result['all_predictions'], dict):
                # PyTorch format: dict of {class_name: probability}
                for disease, prob in result['all_predictions'].items():
                    all_predictions.append({
                        'disease': disease.replace('Pepper__bell___', '').replace('_', ' ').title(),
                        'probability': prob
                    })
            elif 'probabilities' in result:
                # Keras format
                for disease, prob in result['probabilities'].items():
                    all_predictions.append({
                        'disease': disease.replace('Pepper__bell___', '').replace('_', ' ').title(),
                        'probability': prob
                    })
            
            response = {
                'success': True,
                'prediction': {
                    'disease_info': disease_info,
                    'confidence': result.get('confidence', 0),
                    'all_predictions': all_predictions,
                    'metadata': {
                        'filename': unique_filename,
                        'upload_time': timestamp,
                        'file_size': os.path.getsize(filepath),
                        'model_type': result.get('model_type', pepper_type),
                        'model_name': result.get('model_name', ''),
                        **metadata
                    }
                }
            }
        else:
            response = {
                'success': False,
                'error': 'Prediction failed',
                'details': result
            }
        
        print(f"[OK] Returning formatted response")
        print("="*50 + "\n")
        return jsonify(response)
        
    except Exception as e:
        print(f"\n[X] EXCEPTION CAUGHT:")
        print(f"Error: {str(e)}")
        print(f"Traceback:")
        traceback.print_exc()
        print("="*50 + "\n")
        
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/predict-url', methods=['POST'])
def predict_from_url():
    """
    Predict disease from image URL
    
    Expects:
        JSON body with 'image_url' field
    
    Returns:
        Disease prediction results
    """
    try:
        print("\n" + "="*50)
        print("[PREDICT-URL] PREDICT-URL ENDPOINT CALLED")
        print("="*50)
        
        # Check if model is trained
        if detector.model is None:
            print("[X] ERROR: Model is None!")
            return jsonify({
                'success': False,
                'error': 'Model not trained. Please train the model first.',
                'hint': 'Call POST /train to train the model'
            }), 400
        
        print("[OK] Model is loaded")
        
        data = request.get_json()
        
        if not data or 'image_url' not in data:
            print("[X] ERROR: No image_url provided")
            return jsonify({
                'success': False,
                'error': 'No image_url provided in request body'
            }), 400
        
        image_url = data['image_url']
        print(f"[INFO] Image URL: {image_url}")
        
        # Get pepper type (defaults to black_pepper)
        pepper_type = data.get('pepper_type', 'black_pepper')
        if pepper_type not in ['bell_pepper', 'black_pepper']:
            pepper_type = 'black_pepper'
        print(f"[MODEL] Using model: {pepper_type}")
        
        # Download and save image with proper headers to avoid 403 errors
        import urllib.request
        import ssl
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_url_image.jpg"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        print(f"[DOWNLOAD] Downloading image from URL...")
        
        # Add comprehensive headers to mimic real browser request
        req = urllib.request.Request(
            image_url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'image',
                'Sec-Fetch-Mode': 'no-cors',
                'Sec-Fetch-Site': 'cross-site'
            }
        )
        
        # Create SSL context that doesn't verify certificates (for some restrictive sites)
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        
        try:
            with urllib.request.urlopen(req, context=ssl_context, timeout=15) as response:
                with open(filepath, 'wb') as out_file:
                    out_file.write(response.read())
            
            print(f"[OK] Image downloaded successfully: {filepath}")
            print(f"[SAVE] File size: {os.path.getsize(filepath)} bytes")
            
        except urllib.error.HTTPError as e:
            print(f"[X] HTTP Error {e.code}: {e.reason}")
            if e.code == 403:
                return jsonify({
                    'success': False,
                    'error': f'Access to image URL forbidden (403). The website may be blocking automated downloads. Please download the image manually and upload it instead.',
                    'hint': 'Try downloading the image to your device and using file upload instead'
                }), 400
            elif e.code == 404:
                return jsonify({
                    'success': False,
                    'error': 'Image not found at the provided URL (404)'
                }), 400
            else:
                return jsonify({
                    'success': False,
                    'error': f'Failed to download image: HTTP {e.code} - {e.reason}'
                }), 400
        except Exception as e:
            print(f"[X] Download error: {str(e)}")
            return jsonify({
                'success': False,
                'error': f'Failed to download image: {str(e)}'
            }), 400
        
        # Predict disease
        print(f"[PREDICT] Running prediction...")
        result = detector.predict(filepath, model_type=pepper_type)
        print(f"[OK] Prediction result: {result}")
        
        # Check for validation errors or model rejection (handles validation, confidence, and wrong pepper type)
        if not result.get('success', True):
            error_type = result.get('error', 'Prediction failed')
            print(f"[X] ERROR: {error_type}: {result.get('message')}")
            return jsonify({
                'success': False,
                'error': error_type,
                'message': result.get('message', 'Prediction failed'),
                'suggestion': result.get('suggestion', 'Please try uploading a different image'),
                'confidence': result.get('validation_confidence', result.get('model_confidence', 0)),
                'model_type': result.get('detected_type', pepper_type),
                'detailed_error': result.get('detailed_error', False)
            }), 400
        
        # Transform result
        if 'disease' in result:
            disease_name = result['disease']
            
            disease_info = {
                'name': disease_name.replace('Pepper__bell___', '').replace('_', ' ').title(),
                'scientific_name': disease_name,
                'description': get_disease_description(disease_name),
                'severity': get_disease_severity(disease_name),
                'treatment': get_disease_treatment(disease_name),
                'prevention': get_disease_prevention(disease_name)
            }
            
            all_predictions = []
            # PyTorch returns 'all_predictions' as dict, Keras returns 'probabilities'
            if 'all_predictions' in result and isinstance(result['all_predictions'], dict):
                # PyTorch format: dict of {class_name: probability}
                for disease, prob in result['all_predictions'].items():
                    all_predictions.append({
                        'disease': disease.replace('Pepper__bell___', '').replace('_', ' ').title(),
                        'probability': prob
                    })
            elif 'probabilities' in result:
                # Keras format
                for disease, prob in result['probabilities'].items():
                    all_predictions.append({
                        'disease': disease.replace('Pepper__bell___', '').replace('_', ' ').title(),
                        'probability': prob
                    })
            
            response = {
                'success': True,
                'prediction': {
                    'disease_info': disease_info,
                    'confidence': result.get('confidence', 0),
                    'all_predictions': all_predictions,
                    'metadata': {
                        'source': 'url',
                        'image_url': image_url,
                        'timestamp': timestamp,
                        'model_type': result.get('model_type', pepper_type),
                        'model_name': result.get('model_name', '')
                    }
                }
            }
        else:
            response = {
                'success': False,
                'error': 'Prediction failed',
                'details': result
            }
        
        print(f"[OK] Returning response")
        print("="*50 + "\n")
        return jsonify(response)
        
    except Exception as e:
        print(f"\n[X] EXCEPTION in predict-url:")
        print(f"Error: {str(e)}")
        print(f"Traceback:")
        traceback.print_exc()
        print("="*50 + "\n")
        
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/diseases', methods=['GET'])
def get_diseases_info():
    """
    Get information about all detectable diseases
    
    Returns:
        List of diseases with descriptions and treatments
    """
    try:
        # Manual disease info since CNN detector doesn't have disease_info attribute
        diseases = [
            {
                'name': 'Pepper__bell___Bacterial_spot',
                'description': get_disease_description('Pepper__bell___Bacterial_spot'),
                'symptoms': ['Dark spots on leaves', 'Yellow halos around spots', 'Premature leaf drop'],
                'treatment': get_disease_treatment('Pepper__bell___Bacterial_spot'),
                'prevention': get_disease_prevention('Pepper__bell___Bacterial_spot')
            },
            {
                'name': 'Pepper__bell___healthy',
                'description': get_disease_description('Pepper__bell___healthy'),
                'symptoms': ['Green vibrant leaves', 'No spots or discoloration', 'Normal growth pattern'],
                'treatment': get_disease_treatment('Pepper__bell___healthy'),
                'prevention': get_disease_prevention('Pepper__bell___healthy')
            },
            {
                'name': 'Pepper__bell___Yellow_Leaf_Curl',
                'description': get_disease_description('Pepper__bell___Yellow_Leaf_Curl'),
                'symptoms': ['Yellowing of leaves', 'Curling/Rolling of leaves', 'Stunted plant growth'],
                'treatment': get_disease_treatment('Pepper__bell___Yellow_Leaf_Curl'),
                'prevention': get_disease_prevention('Pepper__bell___Yellow_Leaf_Curl')
            },
            {
                'name': 'Pepper__bell___Nutrient_Deficiency',
                'description': get_disease_description('Pepper__bell___Nutrient_Deficiency'),
                'symptoms': ['Pale or yellow leaves', 'Uniform discoloration', 'Slow growth'],
                'treatment': get_disease_treatment('Pepper__bell___Nutrient_Deficiency'),
                'prevention': get_disease_prevention('Pepper__bell___Nutrient_Deficiency')
            }
        ]
        
        return jsonify({
            'success': True,
            'count': len(diseases),
            'diseases': diseases
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/model-info', methods=['GET'])
def get_model_info():
    """Get information about the trained model"""
    try:
        current_model_type = detector.current_model_type
        info = {
            'success': True,
            'model_type': 'CNN - EfficientNetB0 (Black Pepper)',
            'current_model': current_model_type,
            'current_model_name': detector.model_configs[current_model_type]['display_name'],
            'classes': detector.class_names.get(current_model_type, {}),
            'class_count': len(detector.class_names.get(current_model_type, {})),
            'supported_formats': list(ALLOWED_EXTENSIONS),
            'max_file_size': f"{MAX_FILE_SIZE / (1024*1024):.0f}MB",
            'input_shape': str(detector.model.input_shape) if detector.model else None,
            'output_shape': str(detector.model.output_shape) if detector.model else None,
            'available_models': detector.get_available_models()
        }
        
        return jsonify(info)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/models', methods=['GET'])
def get_available_models():
    """Get list of available pepper models"""
    try:
        models = detector.get_available_models()
        return jsonify({
            'success': True,
            'current_model': detector.current_model_type,
            'models': models
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ==================== NEW API ROUTES FOR FRONTEND ====================

@app.route('/api/disease-detection/predict', methods=['POST'])
def api_predict():
    """Predict endpoint for frontend"""
    return predict_disease()


@app.route('/api/disease-detection/predict-url', methods=['POST'])
def api_predict_url():
    """Predict from URL endpoint for frontend"""
    return predict_from_url()


@app.route('/api/disease-detection/diseases', methods=['GET'])
def get_diseases():
    """Get list of detectable diseases"""
    diseases = [
        {
            "id": 1,
            "name": "Bacterial Spot",
            "scientific_name": "Xanthomonas spp.",
            "description": get_disease_description('Pepper__bell___Bacterial_spot'),
            "severity": get_disease_severity('Pepper__bell___Bacterial_spot'),
            "symptoms": ["Dark spots on leaves", "Yellow halos", "Leaf drop"],
            "treatment": get_disease_treatment('Pepper__bell___Bacterial_spot'),
            "prevention": get_disease_prevention('Pepper__bell___Bacterial_spot')
        },
        {
            "id": 2,
            "name": "Healthy",
            "scientific_name": "N/A",
            "description": get_disease_description('Pepper__bell___healthy'),
            "severity": get_disease_severity('Pepper__bell___healthy'),
            "symptoms": ["Green leaves", "No spots", "Normal growth"],
            "treatment": get_disease_treatment('Pepper__bell___healthy'),
            "prevention": get_disease_prevention('Pepper__bell___healthy')
        },
        {
            "id": 3,
            "name": "Yellow Leaf Curl",
            "scientific_name": "TYLCV",
            "description": get_disease_description('Pepper__bell___Yellow_Leaf_Curl'),
            "severity": get_disease_severity('Pepper__bell___Yellow_Leaf_Curl'),
            "symptoms": ["Yellowing of leaves", "Curling", "Stunted growth"],
            "treatment": get_disease_treatment('Pepper__bell___Yellow_Leaf_Curl'),
            "prevention": get_disease_prevention('Pepper__bell___Yellow_Leaf_Curl')
        },
        {
            "id": 4,
            "name": "Nutrient Deficiency",
            "scientific_name": "N/A",
            "description": get_disease_description('Pepper__bell___Nutrient_Deficiency'),
            "severity": get_disease_severity('Pepper__bell___Nutrient_Deficiency'),
            "symptoms": ["Pale leaves", "Uniform yellowing", "Slow growth"],
            "treatment": get_disease_treatment('Pepper__bell___Nutrient_Deficiency'),
            "prevention": get_disease_prevention('Pepper__bell___Nutrient_Deficiency')
        }
    ]
    return jsonify({"success": True, "diseases": diseases})


@app.route('/api/disease-detection/history', methods=['GET'])
def get_history():
    """Get prediction history"""
    limit = request.args.get('limit', 10, type=int)
    return jsonify({
        "success": True,
        "history": [],
        "total": 0
    })

# ==================== END NEW ROUTES ====================


@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    """
    Predict diseases for multiple images
    
    Expects:
        Multiple files with key 'images[]'
    
    Returns:
        List of predictions for all images
    """
    try:
        if detector.model is None:
            return jsonify({
                'success': False,
                'error': 'Model not trained'
            }), 400
        
        if 'images' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No images provided'
            }), 400
        
        files = request.files.getlist('images')
        
        if len(files) == 0:
            return jsonify({
                'success': False,
                'error': 'No files selected'
            }), 400
        
        results = []
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        for idx, file in enumerate(files):
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_filename = f"{timestamp}_{idx}_{filename}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                file.save(filepath)
                
                prediction = detector.predict(filepath)
                
                # Transform prediction
                if 'disease' in prediction:
                    prediction['success'] = True
                    prediction['filename'] = filename
                else:
                    prediction = {
                        'success': False,
                        'filename': filename,
                        'error': 'Prediction failed'
                    }
                
                results.append(prediction)
            else:
                results.append({
                    'success': False,
                    'filename': file.filename if file else 'unknown',
                    'error': 'Invalid file type'
                })
        
        return jsonify({
            'success': True,
            'count': len(results),
            'results': results
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


if __name__ == '__main__':
    # Check model status on startup
    if detector.model is None:
        print("[!] Warning: Model not loaded!")
    else:
        print("[*] Model already trained and loaded.")
    
    # Start Flask server
    print("\nBlack Pepper Disease Detection API Starting...")
    print("=" * 50)
    print(f"URL: http://localhost:5001")
    print(f"Health Check: http://localhost:5001/health")
    print(f"Predict: POST http://localhost:5001/predict")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5001, debug=True)