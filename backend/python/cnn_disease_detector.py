"""
CNN-based Pepper Plant Disease Detection Module
Uses deep learning (MobileNetV2) for superior accuracy
"""

import tensorflow as tf
import numpy as np
import cv2
import json
import os

class CNNDiseaseDetector:
    """
    CNN-based Disease Detection using Transfer Learning
    
    Detects:
    - Healthy
    - Bacterial Spot
    - Yellow Leaf Curl
    - Nutrient Deficiency
    
    Model: MobileNetV2 (trained in Google Colab)
    """
    
    def __init__(self, model_path='models/pepper_disease_model_v3.keras'):
        """Initialize the CNN detector"""
        # Try multiple path variations (prefer .keras format for TF 2.20+)
        possible_paths = [
            model_path,
            'models/pepper_disease_model_v3.keras',
            'models/pepper_disease_model.keras',
            'models/pepper_disease_model.h5',
            'backend/python/models/pepper_disease_model_v3.keras',
            'backend/python/models/pepper_disease_model.h5',
            os.path.join(os.path.dirname(__file__), 'models', 'pepper_disease_model_v3.keras'),
            os.path.join(os.path.dirname(__file__), 'models', 'pepper_disease_model.h5')
        ]
        
        self.model_path = None
        for path in possible_paths:
            if os.path.exists(path):
                self.model_path = path
                break
        
        self.model = None
        self.classes = {}
        self.img_size = 224
        
        # Load model if exists
        if self.model_path:
            self.load_model()
        else:
            print(f"⚠️  Model not found in any of these locations:")
            for path in possible_paths:
                print(f"   - {path}")
            print("Please train the model in Google Colab first!")
        
        # Disease information database
        self.disease_info = {
            'Healthy': {
                'name': 'Healthy Plant',
                'severity': 'None',
                'description': 'Your pepper plant appears healthy with vibrant green leaves.',
                'treatment': [
                    'Continue regular watering schedule',
                    'Maintain current fertilization routine',
                    'Monitor for any changes in leaf color or texture'
                ],
                'prevention': [
                    'Ensure adequate spacing between plants',
                    'Maintain good air circulation',
                    'Regular inspection for early disease detection'
                ]
            },
            'Bacterial_Spot': {
                'name': 'Bacterial Spot',
                'severity': 'Moderate to High',
                'description': 'Bacterial leaf spot causes dark, water-soaked lesions on leaves.',
                'treatment': [
                    'Remove and destroy infected leaves immediately',
                    'Apply copper-based bactericide',
                    'Avoid overhead watering',
                    'Improve air circulation around plants'
                ],
                'prevention': [
                    'Use disease-free seeds and transplants',
                    'Practice crop rotation (3-year cycle)',
                    'Avoid working with plants when wet',
                    'Sanitize tools between plants'
                ]
            },
            'Yellow_Leaf_Curl': {
                'name': 'Yellow Leaf Curl Virus',
                'severity': 'High',
                'description': 'Viral disease causing yellowing, curling, and stunted growth.',
                'treatment': [
                    'Remove and destroy infected plants',
                    'Control whitefly populations (virus vector)',
                    'Use reflective mulches to repel whiteflies',
                    'Apply neem oil or insecticidal soap'
                ],
                'prevention': [
                    'Use virus-resistant varieties',
                    'Install insect-proof screens in greenhouses',
                    'Remove weeds that harbor whiteflies',
                    'Monitor for whitefly presence regularly'
                ]
            },
            'Nutrient_Deficiency': {
                'name': 'Nutrient Deficiency',
                'severity': 'Low to Moderate',
                'description': 'Insufficient nutrients causing yellowing, pale leaves, or poor growth.',
                'treatment': [
                    'Apply balanced fertilizer (10-10-10 NPK)',
                    'Test soil pH (ideal: 6.0-6.8)',
                    'Add organic compost',
                    'Use foliar spray for quick nutrient delivery'
                ],
                'prevention': [
                    'Regular soil testing',
                    'Maintain proper pH levels',
                    'Use slow-release fertilizers',
                    'Add organic matter to soil'
                ]
            }
        }
    
    def load_model(self):
        """Load the trained CNN model"""
        print(f"🔄 Loading model from: {self.model_path}")
        
        # Try multiple loading strategies
        loading_strategies = [
            # Strategy 1: Load with compile=False and safe_mode=False
            lambda: tf.keras.models.load_model(self.model_path, compile=False, safe_mode=False),
            # Strategy 2: Load with compile=False only
            lambda: tf.keras.models.load_model(self.model_path, compile=False),
            # Strategy 3: Standard load
            lambda: tf.keras.models.load_model(self.model_path),
        ]
        
        load_error = None
        for i, strategy in enumerate(loading_strategies, 1):
            try:
                print(f"   Trying loading strategy {i}...")
                self.model = strategy()
                
                # If successful, compile for inference
                if not self.model.optimizer:
                    self.model.compile(
                        optimizer='adam',
                        loss='categorical_crossentropy',
                        metrics=['accuracy']
                    )
                
                print(f"✅ CNN model loaded successfully!")
                print(f"   Input shape: {self.model.input_shape}")
                print(f"   Output shape: {self.model.output_shape}")
                break
                
            except Exception as e:
                load_error = e
                print(f"   ❌ Strategy {i} failed: {str(e)[:100]}")
                continue
        
        if self.model is None:
            print(f"\n❌ All loading strategies failed!")
            print(f"   Last error: {load_error}")
            print(f"\n💡 Solutions:")
            print(f"   1. Install compatible TensorFlow: pip install tensorflow==2.15.0")
            print(f"   2. Re-train in Colab and save as .keras format")
            return False
        
        # Load class indices
        class_indices_path = os.path.join(
            os.path.dirname(self.model_path), 
            'class_indices.json'
        )
        
        if os.path.exists(class_indices_path):
            with open(class_indices_path, 'r') as f:
                class_indices = json.load(f)
            
            # Reverse mapping (index -> class name)
            self.classes = {v: k for k, v in class_indices.items()}
            print(f"✅ Loaded {len(self.classes)} classes: {list(self.classes.values())}")
        else:
            # Fallback to default classes
            self.classes = {
                0: 'Bacterial_Spot',
                1: 'Healthy',
                2: 'Nutrient_Deficiency',
                3: 'Yellow_Leaf_Curl'
            }
            print("⚠️  Using default class mapping")
        
        return True
    
    def preprocess_image(self, image_path):
        """Preprocess image for CNN model"""
        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError(f"Could not read image: {image_path}")
            
            # Convert BGR to RGB
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Resize to model input size
            img = cv2.resize(img, (self.img_size, self.img_size))
            
            # Normalize to [0, 1]
            img_array = img / 255.0
            
            # Add batch dimension
            img_array = np.expand_dims(img_array, axis=0)
            
            return img_array
            
        except Exception as e:
            raise ValueError(f"Error preprocessing image: {e}")
    
    def predict(self, image_path):
        """
        Predict disease from image
        
        Returns:
            dict: {
                'disease': str,
                'confidence': float,
                'probabilities': dict,
                'info': dict
            }
        """
        if self.model is None:
            return {
                'error': 'Model not loaded',
                'message': 'Please train the CNN model in Google Colab first'
            }
        
        try:
            # Preprocess image
            img_array = self.preprocess_image(image_path)
            
            # Predict
            predictions = self.model.predict(img_array, verbose=0)
            
            # Get predicted class
            predicted_idx = np.argmax(predictions[0])
            confidence = float(predictions[0][predicted_idx])
            
            # Get class name
            disease = self.classes.get(predicted_idx, 'Unknown')
            
            # Get all probabilities
            probabilities = {}
            for idx, prob in enumerate(predictions[0]):
                class_name = self.classes.get(idx, f'Class_{idx}')
                probabilities[class_name] = float(prob)
            
            # Get disease info
            info = self.disease_info.get(disease, {})
            
            return {
                'disease': disease,
                'confidence': confidence,
                'probabilities': probabilities,
                'info': info,
                'model_type': 'CNN'
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'message': 'Error during prediction'
            }
    
    def validate_image(self, image_path):
        """
        Validate if image is suitable for disease detection
        
        Returns:
            tuple: (is_valid, reason, confidence)
        """
        try:
            img = cv2.imread(image_path)
            if img is None:
                return False, "Could not read image", 0
            
            # Basic checks
            height, width = img.shape[:2]
            
            # Check image size
            if width < 50 or height < 50:
                return False, "Image too small (min 50x50 pixels)", 0
            
            # Check if image is mostly blank
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            mean_val = np.mean(gray)
            std_val = np.std(gray)
            
            if std_val < 10:
                return False, "Image appears to be blank or uniform", 0
            
            # Convert to HSV for color analysis
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            
            # Check for greenish tones (plant leaves)
            green_mask = cv2.inRange(hsv, np.array([25, 20, 20]), np.array([95, 255, 255]))
            green_pct = np.sum(green_mask > 0) / (width * height) * 100
            
            if green_pct < 10:
                return False, "Image doesn't appear to contain plant material", green_pct
            
            return True, "Valid image", 100
            
        except Exception as e:
            return False, f"Validation error: {str(e)}", 0
    
    def get_model_info(self):
        """Get information about the loaded model"""
        if self.model is None:
            return {
                'loaded': False,
                'message': 'Model not loaded'
            }
        
        return {
            'loaded': True,
            'model_path': self.model_path,
            'model_type': 'CNN (MobileNetV2)',
            'input_size': (self.img_size, self.img_size, 3),
            'num_classes': len(self.classes),
            'classes': list(self.classes.values()),
            'framework': 'TensorFlow/Keras'
        }


# Example usage
if __name__ == '__main__':
    # Initialize detector
    detector = CNNDiseaseDetector('models/pepper_disease_model.h5')
    
    # Get model info
    info = detector.get_model_info()
    print("\n🔍 Model Info:")
    print("-" * 50)
    for key, value in info.items():
        print(f"{key}: {value}")
    
    # Test prediction (if you have a test image)
    test_image = 'path/to/test/image.jpg'
    if os.path.exists(test_image):
        print(f"\n🧪 Testing prediction on: {test_image}")
        result = detector.predict(test_image)
        
        print("\n📊 Prediction Result:")
        print("-" * 50)
        print(f"Disease: {result.get('disease', 'N/A')}")
        print(f"Confidence: {result.get('confidence', 0)*100:.2f}%")
        print(f"\nAll Probabilities:")
        for disease, prob in result.get('probabilities', {}).items():
            print(f"  {disease}: {prob*100:.2f}%")
    else:
        print(f"\n⚠️  Test image not found: {test_image}")
        print("Please provide a valid image path to test predictions")
