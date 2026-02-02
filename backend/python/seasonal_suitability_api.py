"""
Seasonal Suitability Prediction API
Flask REST API for pepper variety seasonal suitability predictions
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from seasonal_suitability_model import SeasonalSuitabilityModel

app = Flask(__name__)
CORS(app)  # Enable CORS for Node.js integration

# Initialize model
predictor = SeasonalSuitabilityModel()
model_loaded = False

# Load trained model on startup
print("Loading Seasonal Suitability ML model...")
if predictor.load_model():
    model_loaded = True
    print("✓ Model loaded successfully")
else:
    print("⚠ Warning: Model not loaded. Train model first by running:")
    print("  python seasonal_suitability_model.py")


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Seasonal Suitability Prediction API',
        'model_loaded': model_loaded,
        'version': '1.0.0'
    }), 200


@app.route('/predict', methods=['POST'])
def predict_suitability():
    """
    Main prediction endpoint
    
    Expected JSON input:
    {
        "month": 7,
        "district": "Idukki",
        "pincode": 685501,
        "variety": "Panniyur 5",
        "temperature": 24.5,
        "rainfall": 320.0,
        "humidity": 82.0,
        "water_availability": "High"
    }
    
    Returns:
    {
        "success": true,
        "prediction": "Recommended",
        "confidence": 0.95,
        "confidence_scores": {
            "Not Recommended": 0.02,
            "Plant with Care": 0.03,
            "Recommended": 0.95
        },
        "input": {...}
    }
    """
    if not model_loaded:
        return jsonify({
            'success': False,
            'error': 'Model not loaded. Train the model first.',
            'fallback_available': True
        }), 503
    
    try:
        # Get input data
        data = request.get_json()
        
        # Validate required fields
        required_fields = [
            'month', 'district', 'pincode', 'variety',
            'temperature', 'rainfall', 'humidity', 'water_availability'
        ]
        
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}',
                'required_fields': required_fields
            }), 400
        
        # Validate data types and ranges
        try:
            input_data = {
                'month': int(data['month']),
                'district': str(data['district']),
                'pincode': int(data['pincode']),
                'variety': str(data['variety']),
                'temperature': float(data['temperature']),
                'rainfall': float(data['rainfall']),
                'humidity': float(data['humidity']),
                'water_availability': str(data['water_availability'])
            }
            
            # Validate ranges
            if not 1 <= input_data['month'] <= 12:
                raise ValueError("Month must be between 1 and 12")
            if not 0 <= input_data['temperature'] <= 50:
                raise ValueError("Temperature must be between 0 and 50°C")
            if not 0 <= input_data['rainfall'] <= 1000:
                raise ValueError("Rainfall must be between 0 and 1000mm")
            if not 0 <= input_data['humidity'] <= 100:
                raise ValueError("Humidity must be between 0 and 100%")
            if input_data['water_availability'] not in ['Low', 'Medium', 'High']:
                raise ValueError("Water availability must be Low, Medium, or High")
                
        except (ValueError, TypeError) as e:
            return jsonify({
                'success': False,
                'error': f'Invalid input data: {str(e)}'
            }), 400
        
        # Make prediction
        result = predictor.predict(input_data)
        
        # Return prediction
        return jsonify({
            'success': True,
            'prediction': result['prediction'],
            'confidence': result['confidence'],
            'confidence_scores': result['confidence_scores'],
            'input': input_data,
            'model_type': 'random_forest'
        }), 200
        
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Prediction failed: {str(e)}',
            'fallback_available': True
        }), 500


@app.route('/batch_predict', methods=['POST'])
def batch_predict_suitability():
    """
    Batch prediction endpoint for multiple inputs
    
    Expected JSON input:
    {
        "predictions": [
            {
                "month": 7,
                "district": "Idukki",
                ...
            },
            ...
        ]
    }
    
    Returns array of predictions
    """
    if not model_loaded:
        return jsonify({
            'success': False,
            'error': 'Model not loaded. Train the model first.'
        }), 503
    
    try:
        data = request.get_json()
        
        if 'predictions' not in data or not isinstance(data['predictions'], list):
            return jsonify({
                'success': False,
                'error': 'Invalid input. Expected "predictions" array.'
            }), 400
        
        results = []
        for idx, input_data in enumerate(data['predictions']):
            try:
                result = predictor.predict(input_data)
                results.append({
                    'success': True,
                    'index': idx,
                    'prediction': result['prediction'],
                    'confidence': result['confidence'],
                    'input': input_data
                })
            except Exception as e:
                results.append({
                    'success': False,
                    'index': idx,
                    'error': str(e),
                    'input': input_data
                })
        
        return jsonify({
            'success': True,
            'count': len(results),
            'results': results
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Batch prediction failed: {str(e)}'
        }), 500


@app.route('/model_info', methods=['GET'])
def model_info():
    """Get information about the loaded model"""
    if not model_loaded:
        return jsonify({
            'success': False,
            'error': 'Model not loaded'
        }), 503
    
    # Load metrics if available
    metrics_path = os.path.join(predictor.model_dir, 'seasonal_suitability_model_metrics.json')
    metrics = {}
    if os.path.exists(metrics_path):
        import json
        with open(metrics_path, 'r') as f:
            metrics = json.load(f)
    
    return jsonify({
        'success': True,
        'model_loaded': model_loaded,
        'feature_columns': predictor.feature_columns,
        'target_column': predictor.target_column,
        'classes': list(predictor.label_encoders['suitability'].classes_),
        'metrics': metrics
    }), 200


@app.route('/validate_input', methods=['POST'])
def validate_input():
    """
    Validate input data without making prediction
    Useful for frontend validation
    """
    try:
        data = request.get_json()
        
        required_fields = [
            'month', 'district', 'pincode', 'variety',
            'temperature', 'rainfall', 'humidity', 'water_availability'
        ]
        
        validation_result = {
            'valid': True,
            'errors': [],
            'warnings': []
        }
        
        # Check missing fields
        for field in required_fields:
            if field not in data:
                validation_result['valid'] = False
                validation_result['errors'].append(f'Missing field: {field}')
        
        if not validation_result['valid']:
            return jsonify(validation_result), 200
        
        # Validate ranges
        if not 1 <= int(data['month']) <= 12:
            validation_result['valid'] = False
            validation_result['errors'].append('Month must be between 1 and 12')
        
        if not 0 <= float(data['temperature']) <= 50:
            validation_result['valid'] = False
            validation_result['errors'].append('Temperature must be between 0 and 50°C')
        
        if not 0 <= float(data['rainfall']) <= 1000:
            validation_result['warnings'].append('Rainfall seems unusually high or low')
        
        if not 0 <= float(data['humidity']) <= 100:
            validation_result['valid'] = False
            validation_result['errors'].append('Humidity must be between 0 and 100%')
        
        if data['water_availability'] not in ['Low', 'Medium', 'High']:
            validation_result['valid'] = False
            validation_result['errors'].append('Water availability must be Low, Medium, or High')
        
        # Check if district/variety are known
        if model_loaded:
            if data['district'] not in predictor.label_encoders['district'].classes_:
                validation_result['warnings'].append(f"Unknown district: {data['district']}")
            if data['variety'] not in predictor.label_encoders['variety'].classes_:
                validation_result['warnings'].append(f"Unknown variety: {data['variety']}")
        
        return jsonify(validation_result), 200
        
    except Exception as e:
        return jsonify({
            'valid': False,
            'errors': [str(e)]
        }), 200


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Seasonal Suitability Prediction API')
    parser.add_argument('--host', default='127.0.0.1', help='Host to bind to')
    parser.add_argument('--port', type=int, default=5001, help='Port to bind to')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    
    args = parser.parse_args()
    
    print("\n" + "="*60)
    print("Seasonal Suitability Prediction API")
    print("="*60)
    print(f"Server: http://{args.host}:{args.port}")
    print(f"Health: http://{args.host}:{args.port}/health")
    print(f"Model loaded: {model_loaded}")
    print("="*60 + "\n")
    
    app.run(host=args.host, port=args.port, debug=args.debug)
