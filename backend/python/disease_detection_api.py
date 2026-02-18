"""
Disease Detection API
Flask REST API for pepper plant disease detection from leaf images
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
from datetime import datetime
from werkzeug.utils import secure_filename
import traceback

# Import the disease detector
from disease_detector import PlantDiseaseDetector

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

# Initialize disease detector
detector = PlantDiseaseDetector()


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Disease Detection API',
        'model_trained': detector.is_trained,
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
    
    Expects:
        - File upload with key 'image'
        - Optional metadata (location, user_id, etc.)
    
    Returns:
        Disease prediction with confidence and treatment recommendations
    """
    try:
        # Check if model is trained
        if not detector.is_trained:
            return jsonify({
                'success': False,
                'error': 'Model not trained. Please train the model first.',
                'hint': 'Call POST /train to train the model'
            }), 400
        
        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No image file provided',
                'hint': 'Send image as multipart/form-data with key "image"'
            }), 400
        
        file = request.files['image']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Check file type
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': f'Invalid file type. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400
        
        # Save file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)
        
        # Get optional metadata
        metadata = {
            'user_id': request.form.get('user_id'),
            'location': request.form.get('location'),
            'notes': request.form.get('notes')
        }
        
        # Predict disease
        result = detector.predict(filepath)
        
        # Add metadata to result
        if result['success']:
            result['metadata'] = {
                'filename': unique_filename,
                'upload_time': timestamp,
                'file_size': os.path.getsize(filepath),
                **metadata
            }
        
        return jsonify(result)
        
    except Exception as e:
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
        data = request.get_json()
        
        if not data or 'image_url' not in data:
            return jsonify({
                'success': False,
                'error': 'No image_url provided in request body'
            }), 400
        
        image_url = data['image_url']
        
        # Download and save image
        import urllib.request
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_url_image.jpg"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        urllib.request.urlretrieve(image_url, filepath)
        
        # Predict disease
        result = detector.predict(filepath)
        
        if result['success']:
            result['metadata'] = {
                'source': 'url',
                'image_url': image_url,
                'timestamp': timestamp
            }
        
        return jsonify(result)
        
    except Exception as e:
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
        diseases = []
        for disease_name, info in detector.disease_info.items():
            diseases.append({
                'name': disease_name,
                **info
            })
        
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
    """
    Get information about the trained model
    
    Returns:
        Model metadata and configuration
    """
    try:
        info = {
            'success': True,
            'is_trained': detector.is_trained,
            'model_type': 'Random Forest Classifier',
            'features_count': 12,
            'classes': list(detector.disease_info.keys()),
            'class_count': len(detector.disease_info),
            'supported_formats': list(ALLOWED_EXTENSIONS),
            'max_file_size': f"{MAX_FILE_SIZE / (1024*1024):.0f}MB"
        }
        
        if detector.model is not None:
            info['model_params'] = {
                'n_estimators': detector.model.n_estimators,
                'max_depth': detector.model.max_depth,
                'n_features': detector.model.n_features_in_
            }
        
        return jsonify(info)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


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
        if not detector.is_trained:
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
                prediction['filename'] = filename
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
    # Train model on startup if not already trained
    if not detector.is_trained:
        print("Training disease detection model...")
        result = detector.train()
        if result['success']:
            print(f"Model trained successfully! Accuracy: {result['accuracy']}")
        else:
            print(f"Training failed: {result.get('error')}")
    else:
        print("Model already trained and loaded.")
    
    # Start Flask server
    print("\n🌿 Disease Detection API Starting...")
    print("=" * 50)
    print(f"📍 URL: http://localhost:5002")
    print(f"🏥 Health Check: http://localhost:5002/health")
    print(f"🔬 Predict: POST http://localhost:5002/predict")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=5002, debug=True)
