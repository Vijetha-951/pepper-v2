"""
Flask REST API for Pepper Yield Prediction ML Service
Exposes endpoints for yield prediction and cultivation recommendations
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pepper_yield_predictor import PepperYieldPredictor

app = Flask(__name__)
CORS(app)  # Enable CORS for Node.js integration

# Initialize predictor
predictor = PepperYieldPredictor()

# Load trained models on startup
print("Loading ML models...")
if not predictor.load_models():
    print("Warning: Models not loaded. Train models first by running:")
    print("  python generate_pepper_training_data.py")
    print("  python pepper_yield_predictor.py")


@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        'status': 'healthy',
        'service': 'Pepper Yield Prediction API',
        'models_loaded': predictor.yield_model is not None
    }), 200


@app.route('/predict', methods=['POST'])
def predict_yield():
    """
    Main prediction endpoint
    
    Expected JSON input:
    {
        "soil_type": "Loamy" | "Sandy" | "Clay",
        "water_availability": "Low" | "Medium" | "High",
        "irrigation_frequency": 1-7,
        "crop_stage": "Seedling" | "Vegetative" | "Flowering" | "Fruiting",
        "location": "Kerala" (optional)
    }
    
    Returns:
    {
        "success": true,
        "data": {
            "predicted_yield_kg": 1.45,
            "soil_suitability": "High",
            "suitability_confidence": 85.2,
            "irrigation_recommendation": "...",
            "fertilizer_recommendation": "...",
            "additional_tips": [...]
        }
    }
    """
    try:
        # Check if models are loaded
        if predictor.yield_model is None:
            return jsonify({
                'success': False,
                'error': 'ML models not loaded. Please train models first.'
            }), 503
        
        # Get input data
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['soil_type', 'water_availability', 'irrigation_frequency', 'crop_stage']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Validate field values
        valid_soil_types = ['Sandy', 'Loamy', 'Clay']
        valid_water_avail = ['Low', 'Medium', 'High']
        valid_crop_stages = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting']
        
        if data['soil_type'] not in valid_soil_types:
            return jsonify({
                'success': False,
                'error': f'Invalid soil_type. Must be one of: {", ".join(valid_soil_types)}'
            }), 400
        
        if data['water_availability'] not in valid_water_avail:
            return jsonify({
                'success': False,
                'error': f'Invalid water_availability. Must be one of: {", ".join(valid_water_avail)}'
            }), 400
        
        if data['crop_stage'] not in valid_crop_stages:
            return jsonify({
                'success': False,
                'error': f'Invalid crop_stage. Must be one of: {", ".join(valid_crop_stages)}'
            }), 400
        
        try:
            irrigation_freq = int(data['irrigation_frequency'])
            if irrigation_freq < 1 or irrigation_freq > 7:
                raise ValueError
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': 'irrigation_frequency must be an integer between 1 and 7'
            }), 400
        
        # Make prediction
        result = predictor.predict(data)
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    """
    Batch prediction endpoint for multiple inputs
    
    Expected JSON input:
    {
        "inputs": [
            {
                "soil_type": "Loamy",
                "water_availability": "High",
                ...
            },
            ...
        ]
    }
    """
    try:
        if predictor.yield_model is None:
            return jsonify({
                'success': False,
                'error': 'ML models not loaded. Please train models first.'
            }), 503
        
        data = request.get_json()
        
        if 'inputs' not in data or not isinstance(data['inputs'], list):
            return jsonify({
                'success': False,
                'error': 'Request must contain "inputs" array'
            }), 400
        
        results = []
        for i, input_data in enumerate(data['inputs']):
            try:
                result = predictor.predict(input_data)
                results.append({
                    'index': i,
                    'success': True,
                    'data': result
                })
            except Exception as e:
                results.append({
                    'index': i,
                    'success': False,
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'results': results
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/model-info', methods=['GET'])
def model_info():
    """
    Get information about loaded models
    """
    try:
        if predictor.yield_model is None:
            return jsonify({
                'success': False,
                'error': 'Models not loaded'
            }), 503
        
        return jsonify({
            'success': True,
            'data': {
                'yield_model': str(type(predictor.yield_model).__name__),
                'suitability_model': str(type(predictor.suitability_model).__name__),
                'feature_count': len(predictor.feature_columns),
                'features': predictor.feature_columns,
                'supported_soil_types': ['Sandy', 'Loamy', 'Clay'],
                'supported_water_availability': ['Low', 'Medium', 'High'],
                'supported_crop_stages': ['Seedling', 'Vegetative', 'Flowering', 'Fruiting'],
                'irrigation_frequency_range': [1, 7]
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


if __name__ == '__main__':
    # Get port from environment or use default
    port = int(os.environ.get('ML_API_PORT', 5001))
    
    print(f"\n{'='*60}")
    print(f"Pepper Yield Prediction API")
    print(f"{'='*60}")
    print(f"Server running on: http://localhost:{port}")
    print(f"Health check: http://localhost:{port}/health")
    print(f"Prediction endpoint: http://localhost:{port}/predict")
    print(f"{'='*60}\n")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False  # Set to False in production
    )
