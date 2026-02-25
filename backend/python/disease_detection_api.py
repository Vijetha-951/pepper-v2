"""
Disease Detection API
Flask REST API for pepper plant disease detection from leaf images
"""

print("\n" + "="*60)
print("PEPPER DISEASE DETECTION API")
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
# Import the disease detector
from cnn_disease_detector_v3 import CNNDiseaseDetector as PlantDiseaseDetector
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

print("Step 4/4: Initializing disease detector (may take 30-60 seconds)...")
print("Loading TensorFlow and CNN model...\n")
# Initialize disease detector
detector = PlantDiseaseDetector()
print("\nAll initialization complete!")


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_disease_description(disease_name):
    """Get disease description"""
    descriptions = {
        'Pepper__bell___Bacterial_spot': 'Bacterial leaf spot caused by Xanthomonas bacteria. Causes dark spots with yellow halos on leaves.',
        'Pepper__bell___healthy': 'The plant appears healthy with no visible signs of disease.',
        'Pepper__bell___Yellow_Leaf_Curl': 'Viral disease causing yellowing, curling, and stunted growth of leaves.',
        'Pepper__bell___Nutrient_Deficiency': 'Yellowing or discoloration due to lack of essential nutrients like Nitrogen, Potassium or Magnesium.'
    }
    return descriptions.get(disease_name, 'No description available')


def get_disease_severity(disease_name):
    """Get disease severity"""
    severity_map = {
        'Pepper__bell___Bacterial_spot': 'Moderate',
        'Pepper__bell___healthy': 'None',
        'Pepper__bell___Yellow_Leaf_Curl': 'High',
        'Pepper__bell___Nutrient_Deficiency': 'Low to Moderate'
    }
    return severity_map.get(disease_name, 'Unknown')


def get_disease_treatment(disease_name):
    """Get treatment recommendations"""
    treatments = {
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
        ]
    }
    return treatments.get(disease_name, [])


def get_disease_prevention(disease_name):
    """Get prevention tips"""
    prevention = {
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
        ]
    }
    return prevention.get(disease_name, [])


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Disease Detection API',
        'model_trained': detector.model is not None,
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
        print("🔬 PREDICT ENDPOINT CALLED")
        print("="*50)
        
        # Debug: Print all request info
        print(f"📋 Request files: {list(request.files.keys())}")
        print(f"📋 Request form: {list(request.form.keys())}")
        print(f"📋 Content Type: {request.content_type}")
        
        # Check if model is trained
        if detector.model is None:
            print("❌ ERROR: Model is None!")
            return jsonify({
                'success': False,
                'error': 'Model not trained. Please train the model first.',
                'hint': 'Call POST /train to train the model'
            }), 400
        
        print("✅ Model is loaded")
        
        # Check if image file is present (accept both 'image' and 'file' keys)
        if 'image' in request.files:
            file = request.files['image']
            print(f"✅ Found 'image' key: {file.filename}")
        elif 'file' in request.files:
            file = request.files['file']
            print(f"✅ Found 'file' key: {file.filename}")
        else:
            print(f"❌ ERROR: No image/file found!")
            print(f"Available keys: {list(request.files.keys())}")
            return jsonify({
                'success': False,
                'error': 'No image file provided',
                'hint': 'Send image as multipart/form-data with key "image" or "file"'
            }), 400
        
        # Check if file is selected
        if file.filename == '':
            print("❌ ERROR: Empty filename")
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        print(f"📁 Processing file: {file.filename}")
        
        # Check file type
        if not allowed_file(file.filename):
            print(f"❌ ERROR: Invalid file type")
            return jsonify({
                'success': False,
                'error': f'Invalid file type. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400
        
        print(f"✅ File type valid")
        
        # Save file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        print(f"💾 Saving to: {filepath}")
        file.save(filepath)
        print(f"✅ File saved successfully")
        
        # Get optional metadata
        metadata = {
            'user_id': request.form.get('user_id'),
            'location': request.form.get('location'),
            'notes': request.form.get('notes')
        }
        
        # Predict disease
        print(f"🔍 Running prediction...")
        result = detector.predict(filepath)
        print(f"✅ Prediction result: {result}")
        
        # Check for validation errors from detector
        if not result.get('success', True) and result.get('error') == 'Invalid Image':
            print(f"❌ ERROR: Image validation failed: {result.get('message')}")
            return jsonify({
                'success': False,
                'error': result.get('error'),
                'message': result.get('message'),
                'suggestion': result.get('suggestion'),
                'confidence': result.get('validation_confidence')
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
            if 'probabilities' in result:
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
        
        print(f"✅ Returning formatted response")
        print("="*50 + "\n")
        return jsonify(response)
        
    except Exception as e:
        print(f"\n❌ EXCEPTION CAUGHT:")
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
        print("🔬 PREDICT-URL ENDPOINT CALLED")
        print("="*50)
        
        # Check if model is trained
        if detector.model is None:
            print("❌ ERROR: Model is None!")
            return jsonify({
                'success': False,
                'error': 'Model not trained. Please train the model first.',
                'hint': 'Call POST /train to train the model'
            }), 400
        
        print("✅ Model is loaded")
        
        data = request.get_json()
        
        if not data or 'image_url' not in data:
            print("❌ ERROR: No image_url provided")
            return jsonify({
                'success': False,
                'error': 'No image_url provided in request body'
            }), 400
        
        image_url = data['image_url']
        print(f"📥 Image URL: {image_url}")
        
        # Download and save image with proper headers to avoid 403 errors
        import urllib.request
        import ssl
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_url_image.jpg"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        print(f"⬇️ Downloading image from URL...")
        
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
            
            print(f"✅ Image downloaded successfully: {filepath}")
            print(f"💾 File size: {os.path.getsize(filepath)} bytes")
            
        except urllib.error.HTTPError as e:
            print(f"❌ HTTP Error {e.code}: {e.reason}")
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
            print(f"❌ Download error: {str(e)}")
            return jsonify({
                'success': False,
                'error': f'Failed to download image: {str(e)}'
            }), 400
        
        # Predict disease
        print(f"🔍 Running prediction...")
        result = detector.predict(filepath)
        print(f"✅ Prediction result: {result}")
        
        # Check for validation errors from detector
        if not result.get('success', True) and result.get('error') == 'Invalid Image':
            print(f"❌ ERROR: Image validation failed: {result.get('message')}")
            return jsonify({
                'success': False,
                'error': result.get('error'),
                'message': result.get('message'),
                'suggestion': result.get('suggestion'),
                'confidence': result.get('validation_confidence')
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
            if 'probabilities' in result:
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
                        'timestamp': timestamp
                    }
                }
            }
        else:
            response = {
                'success': False,
                'error': 'Prediction failed',
                'details': result
            }
        
        print(f"✅ Returning response")
        print("="*50 + "\n")
        return jsonify(response)
        
    except Exception as e:
        print(f"\n❌ EXCEPTION in predict-url:")
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
        info = {
            'success': True,
            'model_type': 'CNN - MobileNetV2',
            'classes': detector.class_names,
            'class_count': len(detector.class_names),
            'supported_formats': list(ALLOWED_EXTENSIONS),
            'max_file_size': f"{MAX_FILE_SIZE / (1024*1024):.0f}MB",
            'input_shape': str(detector.model.input_shape) if detector.model else None,
            'output_shape': str(detector.model.output_shape) if detector.model else None
        }
        
        return jsonify(info)
        
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
    print("\nDisease Detection API Starting...")
    print("=" * 50)
    print(f"URL: http://localhost:5001")
    print(f"Health Check: http://localhost:5001/health")
    print(f"Predict: POST http://localhost:5001/predict")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5001, debug=True)