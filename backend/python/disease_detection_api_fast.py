"""
Disease Detection API - Fast Start Version
Flask REST API that loads TensorFlow only when first prediction is made
"""
import sys
import io

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("\n" + "="*60)
print("PEPPER DISEASE DETECTION API (Fast Start)")
print("="*60)
print("Starting Flask server first, model loads on first request...")

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
from datetime import datetime
from werkzeug.utils import secure_filename
import traceback

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

# Lazy load detector
detector = None

def get_detector():
    """Lazy load the disease detector on first use"""
    global detector
    if detector is None:
        print("\n[*] Loading disease detector for first time...")
        print("[*] This will take 30-60 seconds...")
        from cnn_disease_detector_v3 import CNNDiseaseDetector as PlantDiseaseDetector
        detector = PlantDiseaseDetector()
        print("[*] Detector loaded and ready!\n")
    return detector


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
        'model_loaded': detector is not None,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/diseases', methods=['GET'])
def get_diseases():
    """Get information about all detectable diseases"""
    diseases = [
        {
            'name': 'Bacterial Spot',
            'scientific_name': 'Xanthomonas',
            'description': get_disease_description('Pepper__bell___Bacterial_spot'),
            'severity': get_disease_severity('Pepper__bell___Bacterial_spot'),
            'treatment': get_disease_treatment('Pepper__bell___Bacterial_spot'),
            'prevention': get_disease_prevention('Pepper__bell___Bacterial_spot')
        },
        {
            'name': 'Healthy',
            'scientific_name': 'N/A',
            'description': get_disease_description('Pepper__bell___healthy'),
            'severity': get_disease_severity('Pepper__bell___healthy'),
            'treatment': get_disease_treatment('Pepper__bell___healthy'),
            'prevention': get_disease_prevention('Pepper__bell___healthy')
        },
        {
            'name': 'Yellow Leaf Curl',
            'scientific_name': 'TYLCV',
            'description': get_disease_description('Pepper__bell___Yellow_Leaf_Curl'),
            'severity': get_disease_severity('Pepper__bell___Yellow_Leaf_Curl'),
            'treatment': get_disease_treatment('Pepper__bell___Yellow_Leaf_Curl'),
            'prevention': get_disease_prevention('Pepper__bell___Yellow_Leaf_Curl')
        },
        {
            'name': 'Nutrient Deficiency',
            'scientific_name': 'N/A',
            'description': get_disease_description('Pepper__bell___Nutrient_Deficiency'),
            'severity': get_disease_severity('Pepper__bell___Nutrient_Deficiency'),
            'treatment': get_disease_treatment('Pepper__bell___Nutrient_Deficiency'),
            'prevention': get_disease_prevention('Pepper__bell___Nutrient_Deficiency')
        }
    ]
    
    return jsonify({
        'success': True,
        'diseases': diseases
    })


@app.route('/model-info', methods=['GET'])
def get_model_info():
    """Get information about the disease detection model"""
    try:
        det = get_detector() if detector else None
        
        return jsonify({
            'success': True,
            'model': {
                'name': 'MobileNetV2 CNN',
                'version': '3.0',
                'classes': 2,
                'input_size': [224, 224, 3],
                'trained': det is not None,
                'framework': 'TensorFlow',
                'accuracy': '98.39%'
            }
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/predict', methods=['POST'])
def predict():
    """Predict disease from uploaded image"""
    try:
        # Check if file is present
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No image file provided'
            }), 400
        
        file = request.files['image']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No image file selected'
            }), 400
        
        # Validate file type
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': 'Invalid file type',
                'message': 'Please upload an image file (PNG, JPG, JPEG, GIF, BMP)',
                'suggestion': 'Allowed formats: ' + ', '.join(ALLOWED_EXTENSIONS)
            }), 400
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Get detector (lazy load on first use)
        det = get_detector()
        
        # Make prediction
        result = det.predict(filepath)
        
        # Check for validation errors from detector
        if not result.get('success', True) and result.get('error') == 'Invalid Image':
            return jsonify({
                'success': False,
                'error': result.get('error'),
                'message': result.get('message'),
                'suggestion': result.get('suggestion'),
                'confidence': result.get('validation_confidence')
            }), 400
        
        # Get disease information
        disease_name = result['disease']
        confidence = result['confidence']
        
        # Build response
        response = {
            'success': True,
            'prediction': {
                'disease_info': {
                    'name': disease_name,
                    'description': get_disease_description(disease_name),
                    'severity': get_disease_severity(disease_name),
                    'treatment': get_disease_treatment(disease_name),
                    'prevention': get_disease_prevention(disease_name)
                },
                'confidence': confidence,
                'all_predictions': [
                    {
                        'disease': disease,
                        'probability': prob
                    }
                    for disease, prob in result['probabilities'].items()
                ]
            },
            'timestamp': datetime.now().isoformat()
        }
        
        # Clean up uploaded file
        try:
            os.remove(filepath)
        except:
            pass
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


@app.route('/predict-url', methods=['POST'])
def predict_url():
    """Predict disease from image URL"""
    try:
        data = request.get_json()
        image_url = data.get('image_url')
        
        if not image_url:
            return jsonify({
                'success': False,
                'error': 'No image URL provided'
            }), 400
        
        # Download image
        import urllib.request
        import ssl
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_url_image.jpg"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
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
        except urllib.error.HTTPError as e:
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
            return jsonify({
                'success': False,
                'error': f'Failed to download image: {str(e)}'
            }), 400
        
        # Get detector (lazy load)
        det = get_detector()
        
        # Make prediction
        result = det.predict(filepath)
        
        # Check for validation errors from detector
        if not result.get('success', True) and result.get('error') == 'Invalid Image':
            return jsonify({
                'success': False,
                'error': result.get('error'),
                'message': result.get('message'),
                'suggestion': result.get('suggestion'),
                'confidence': result.get('validation_confidence')
            }), 400
        
        # Get disease information
        disease_name = result['disease']
        confidence = result['confidence']
        
        # Build response
        response = {
            'success': True,
            'prediction': {
                'disease_info': {
                    'name': disease_name,
                    'description': get_disease_description(disease_name),
                    'severity': get_disease_severity(disease_name),
                    'treatment': get_disease_treatment(disease_name),
                    'prevention': get_disease_prevention(disease_name)
                },
                'confidence': confidence,
                'all_predictions': [
                    {
                        'disease': disease,
                        'probability': prob
                    }
                    for disease, prob in result['probabilities'].items()
                ]
            },
            'timestamp': datetime.now().isoformat()
        }
        
        # Clean up
        try:
            os.remove(filepath)
        except:
            pass
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


# Proxy routes for frontend
@app.route('/api/disease-detection/predict', methods=['POST'])
def api_predict():
    return predict()


@app.route('/api/disease-detection/predict-url', methods=['POST'])
def api_predict_url():
    return predict_url()


if __name__ == '__main__':
    print("\nDisease Detection API Starting...")
    print("=" * 50)
    print(f"URL: http://localhost:5001")
    print(f"Health Check: http://localhost:5001/health")
    print(f"Predict: POST http://localhost:5001/predict")
    print("=" * 50)
    print("\nFast start mode: Model loads on first prediction\n")
    
    app.run(host='0.0.0.0', port=5001, debug=True)
