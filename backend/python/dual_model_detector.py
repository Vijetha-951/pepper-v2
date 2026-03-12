"""
Dual Model Disease Detector
Supports both Bell Pepper and Black Pepper disease detection
"""

import tensorflow as tf
from tensorflow import keras
import numpy as np
import cv2
import json
import os

class DualModelDetector:
    """
    Disease detector that supports both Bell Pepper and Black Pepper models
    """
    
    def __init__(self):
        """Initialize the dual-model detector"""
        print("[*] Initializing Black Pepper Disease Detector...")
        self.models = {}
        self.class_names = {}
        self.current_model_type = 'black_pepper'  # Default
        self.using_pytorch = False  # Flag for PyTorch model
        self.pytorch_detector = None  # PyTorch detector instance
        
        # Model configurations
        self.model_configs = {
            'bell_pepper': {
                'model_path': os.path.join(os.path.dirname(__file__), 'models', 'pepper_disease_model_v3.keras'),
                'class_file': os.path.join(os.path.dirname(__file__), 'models', 'class_indices.json'),
                'display_name': 'Bell Pepper (Capsicum)'
            },
            'black_pepper': {
                'model_path': os.path.join(os.path.dirname(__file__), 'models', 'black_pepper_disease_model.keras'),
                'class_file': os.path.join(os.path.dirname(__file__), 'models', 'black_pepper_class_indices.json'),
                'display_name': 'Black Pepper (Piper nigrum)'
            }
        }
        
        # Load only black pepper model
        print("[*] Loading Black Pepper model...")
        model_type = 'black_pepper'
        config = self.model_configs[model_type]
        try:
            print(f"[*] Loading {config['display_name']} model...")
            self._load_model(model_type)
            print(f"[OK] {config['display_name']} model loaded successfully!")
        except Exception as e:
            print(f"[!] Error: Failed to load {config['display_name']} model: {str(e)}")
            raise e
        
        print("[*] Black Pepper Detector initialization complete!")
        self._print_status()
    
    def _load_model(self, model_type):
        """Load a specific model (PyTorch if available, otherwise Keras)"""
        config = self.model_configs[model_type]
        
        # Check for PyTorch model first (for black pepper only)
        if model_type == 'black_pepper':
            pytorch_path = os.path.join(os.path.dirname(__file__), 'best_black_pepper_model.pth')
            if os.path.exists(pytorch_path):
                print(f"[*] Found PyTorch model: {pytorch_path}")
                print(f"[*] Loading trained PyTorch EfficientNet model...")
                try:
                    from pytorch_black_pepper_detector import get_detector
                    self.pytorch_detector = get_detector()
                    self.models[model_type] = 'pytorch'  # Mark as PyTorch
                    self.using_pytorch = True
                    
                    # Load class names from PyTorch detector
                    self.class_names[model_type] = self.pytorch_detector.class_names
                    print(f"[OK] PyTorch model loaded with trained weights!")
                    return
                except Exception as e:
                    print(f"[!] Warning: Could not load PyTorch model: {e}")
                    print(f"[*] Falling back to Keras model...")
        
        # Load Keras model (default)
        if not os.path.exists(config['model_path']):
            raise FileNotFoundError(f"Model file not found: {config['model_path']}")
        
        model = keras.models.load_model(config['model_path'])
        self.models[model_type] = model
        
        # Load class names
        if not os.path.exists(config['class_file']):
            raise FileNotFoundError(f"Class file not found: {config['class_file']}")
        
        with open(config['class_file'], 'r') as f:
            class_indices = json.load(f)
        
        # Reverse mapping: index -> class name
        self.class_names[model_type] = {v: k for k, v in class_indices.items()}
    
    def _print_status(self):
        """Print the status of loaded models"""
        print("\n" + "="*60)
        print("BLACK PEPPER MODEL STATUS")
        print("="*60)
        model_type = 'black_pepper'
        config = self.model_configs[model_type]
        status = "[OK] Loaded" if self.models.get(model_type) is not None else "[X] Not Available"
        
        if self.using_pytorch:
            framework = "PyTorch (Trained EfficientNet-B0)"
        else:
            framework = "TensorFlow/Keras"
        
        print(f"{config['display_name']:30} {status}")
        print(f"  Framework: {framework}")
        
        if self.models.get(model_type) is not None:
            if self.using_pytorch and self.pytorch_detector:
                # Show exact class names from PyTorch detector
                classes = self.pytorch_detector.class_names
            else:
                classes = list(self.class_names[model_type].values())
            print(f"  Classes ({len(classes)}): {', '.join(classes)}")
        print("="*60 + "\n")
    
    def _format_class_name(self, raw_class_name):
        """
        Convert model class names to MongoDB enum format
        
        Examples:
            'black_pepper_healthy' -> 'Black Pepper Healthy'
            'black_pepper_leaf_blight' -> 'Black Pepper Leaf Blight'
            'Pepper__bell___healthy' -> 'Healthy'
            'Pepper__bell___Bacterial_spot' -> 'Bacterial Spot'
        """
        # Handle Bell Pepper format (e.g., 'Pepper__bell___healthy')
        if 'Pepper__bell___' in raw_class_name:
            class_part = raw_class_name.replace('Pepper__bell___', '')
            # Special case mappings for Bell Pepper
            mapping = {
                'healthy': 'Healthy',
                'Bacterial_spot': 'Bacterial Spot',
                'Yellow_Leaf_Curl': 'Yellow Leaf Curl',
                'Nutrient_Deficiency': 'Nutrient Deficiency'
            }
            return mapping.get(class_part, class_part.replace('_', ' ').title())
        
        # Handle Black Pepper format (e.g., 'black_pepper_healthy')
        elif 'black_pepper_' in raw_class_name:
            # Replace underscores with spaces and convert to Title Case
            formatted = raw_class_name.replace('_', ' ').title()
            return formatted
        
        # Default: just replace underscores and title case
        return raw_class_name.replace('_', ' ').title()
    
    @property
    def model(self):
        """Get the current active model"""
        return self.models.get(self.current_model_type)
    
    def set_model_type(self, model_type):
        """
        Set the active model type
        
        Args:
            model_type: 'bell_pepper' or 'black_pepper'
        """
        if model_type not in self.model_configs:
            raise ValueError(f"Invalid model type. Choose from: {list(self.model_configs.keys())}")
        
        if self.models.get(model_type) is None:
            raise ValueError(f"{self.model_configs[model_type]['display_name']} model not loaded")
        
        self.current_model_type = model_type
        print(f"[*] Switched to {self.model_configs[model_type]['display_name']} model")
    
    def get_available_models(self):
        """Get list of available models"""
        available = []
        for model_type, config in self.model_configs.items():
            if self.models.get(model_type) is not None:
                available.append({
                    'type': model_type,
                    'name': config['display_name'],
                    'classes': list(self.class_names[model_type].values())
                })
        return available
    
    def preprocess_image(self, image_path):
        """Preprocess image for CNN prediction"""
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Failed to load image: {image_path}")
        
        # Resize to model input size (224x224 for both models)
        img_resized = cv2.resize(img, (224, 224))
        
        # Convert BGR to RGB
        img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
        
        # Normalize to [0, 1]
        img_normalized = img_rgb.astype(np.float32) / 255.0
        
        # Add batch dimension
        img_batch = np.expand_dims(img_normalized, axis=0)
        
        return img_batch
    
    def is_valid_plant_image(self, image_path):
        """
        Robust validation to ensure image contains pepper plant leaves
        Rejects: screenshots, documents, people, objects, non-plant images
        Returns: (is_valid, reason, confidence)
        """
        try:
            img = cv2.imread(image_path)
            if img is None:
                return False, "Could not read image file", 0
            
            # Get original image dimensions
            height, width = img.shape[:2]
            
            # Check 1: Image too small
            if height < 50 or width < 50:
                return False, "Image resolution too low. Please upload a higher quality image.", 0
            
            # Resize for consistent analysis
            img_resized = cv2.resize(img, (256, 256))
            gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
            hsv = cv2.cvtColor(img_resized, cv2.COLOR_BGR2HSV)
            
            total_pixels = 256 * 256
            
            # ============= STRICT REJECTION CHECKS =============
            
            # Check 2: Plant color presence (Green, Yellow, Brown - for diseased leaves)
            # Green (standard healthy leaves)
            green_lower = np.array([35, 20, 20])
            green_upper = np.array([90, 255, 255])
            green_mask = cv2.inRange(hsv, green_lower, green_upper)
            green_pct = (np.sum(green_mask > 0) / total_pixels) * 100
            self._last_green_pct = green_pct
            
            # Yellow/Light Brown (diseased/stressed leaves)
            yellow_lower = np.array([10, 20, 20])
            yellow_upper = np.array([35, 255, 255])
            yellow_mask = cv2.inRange(hsv, yellow_lower, yellow_upper)
            yellow_pct = (np.sum(yellow_mask > 0) / total_pixels) * 100
            self._last_yellow_pct = yellow_pct
            
            plant_pct = green_pct + yellow_pct
            self._last_plant_pct = plant_pct
            
            # Minimum plant content threshold - much more lenient to allow diseased leaves
            if plant_pct < 5:
                return False, "WARNING: Not a pepper plant leaf! Please upload a clear photo showing the actual pepper plant leaf. Avoid screenshots, documents, or non-plant images.", 0
            
            # Check 3: Detect human skin (reject photos of people)
            skin_lower1 = np.array([0, 20, 70])
            skin_upper1 = np.array([20, 150, 255])
            skin_lower2 = np.array([0, 10, 60])
            skin_upper2 = np.array([25, 160, 255])
            
            skin_mask1 = cv2.inRange(hsv, skin_lower1, skin_upper1)
            skin_mask2 = cv2.inRange(hsv, skin_lower2, skin_upper2)
            skin_mask = cv2.bitwise_or(skin_mask1, skin_mask2)
            skin_pct = (np.sum(skin_mask > 0) / total_pixels) * 100
            
            # Reject if it's clearly a person photo
            if skin_pct > 45 and green_pct < 25:
                return False, "WARNING: This appears to be a photo of a person, not a pepper plant. Please upload a photo of the actual pepper plant leaf.", 0
            
            # Check 4: Detect artificial blue (sky, screens, clothing, logos)
            blue_lower = np.array([90, 50, 50])
            blue_upper = np.array([130, 255, 255])
            blue_mask = cv2.inRange(hsv, blue_lower, blue_upper)
            blue_pct = (np.sum(blue_mask > 0) / total_pixels) * 100
            
            if blue_pct > 35:
                return False, "WARNING: Not a pepper plant leaf! This looks like a screenshot, logo, or artificial image. Please upload a real photo of a pepper plant leaf.", 0
            
            # Check 5: Screenshots/documents (too much white)
            white_mask = gray > 220
            white_pct = (np.sum(white_mask) / total_pixels) * 100
            
            if white_pct > 85:
                return False, "WARNING: This looks like a screenshot or document, not a pepper plant. Please upload a real photo of a pepper plant leaf.", 0
            
            # Check 6: Completely black/very dark images
            black_mask = gray < 30
            black_pct = (np.sum(black_mask) / total_pixels) * 100
            
            if black_pct > 80:
                return False, "WARNING: Image is too dark to analyze. Please upload a well-lit photo of the pepper plant leaf.", 0
            
            # Check 7: Detect text/numbers (reject screenshots with text)
            edges = cv2.Canny(gray, 50, 150)
            edge_pct = (np.sum(edges > 0) / total_pixels) * 100
            
            # Too many edges + low green = likely screenshot/document
            if edge_pct > 25 and green_pct < 15 and white_pct > 60:
                return False, "WARNING: This looks like a screenshot or document with text. Please upload a real photo of a pepper plant leaf.", 0
            
            # Check 8: Color variety check (natural leaves have varied hues)
            hsv_std = np.std(hsv[:, :, 0])  # Hue standard deviation
            if hsv_std < 2 and plant_pct < 15:  # Much more lenient
                return False, "WARNING: This doesn't look like a natural pepper plant image. Please upload a clear photo of an actual pepper plant leaf.", 0
            
            # Check 9: Red/orange dominant (reject peppers/fruits instead of leaves)
            red_lower1 = np.array([0, 50, 50])
            red_upper1 = np.array([10, 255, 255])
            red_lower2 = np.array([170, 50, 50])
            red_upper2 = np.array([180, 255, 255])
            
            red_mask1 = cv2.inRange(hsv, red_lower1, red_upper1)
            red_mask2 = cv2.inRange(hsv, red_lower2, red_upper2)
            red_mask = cv2.bitwise_or(red_mask1, red_mask2)
            red_pct = (np.sum(red_mask > 0) / total_pixels) * 100
            
            # If mostly red/orange and very little green, likely a pepper fruit not a leaf
            if red_pct > 40 and green_pct < 10:
                return False, "WARNING: This appears to be a pepper fruit, not a leaf. Please upload a photo of the pepper plant LEAF (the green foliage), not the fruit/pepper itself.", 0
            
            # ============= FINAL VALIDATION =============
            
            # Must have reasonable plant content
            if plant_pct < 8:
                return False, "WARNING: Not enough pepper leaf content detected in the photo. Please upload a clearer photo of the actual plant leaf.", 0
            
            # Calculate confidence score based on plant content and image quality
            confidence = min(100, plant_pct * 3.0)
            
            # Additional confidence boost for good leaf characteristics
            if plant_pct > 25 and skin_pct < 10 and blue_pct < 15:
                confidence = min(100, confidence + 10)
            
            return True, "Image appears to be a valid pepper plant leaf", confidence
            
        except Exception as e:
            return False, f"Image validation error: {str(e)}", 0
    
    def predict(self, image_path, model_type=None):
        """
        Predict disease from image
        
        Args:
            image_path: Path to the image file
            model_type: 'bell_pepper' or 'black_pepper' (uses current if None)
        
        Returns:
            dict with prediction results
        """
        try:
            # Set model type if provided
            if model_type is not None:
                self.set_model_type(model_type)
            
            # Use PyTorch detector if available (black pepper only)
            if self.current_model_type == 'black_pepper' and self.using_pytorch:
                print("[*] Using trained PyTorch model for prediction...")
                
                # Validate image first
                is_valid, reason, validation_confidence = self.is_valid_plant_image(image_path)
                if not is_valid:
                    return {
                        'success': False,
                        'error': 'Invalid Image',
                        'message': reason,
                        'validation_confidence': validation_confidence
                    }
                
                # Use PyTorch detector
                result = self.pytorch_detector.predict(image_path)
                return result
            
            # Otherwise use Keras model (default)
            # Validate image
            is_valid, reason, validation_confidence = self.is_valid_plant_image(image_path)
            if not is_valid:
                return {
                    'success': False,
                    'error': 'Invalid Image',
                    'message': reason,
                    'validation_confidence': validation_confidence
                }
            
            # Preprocess image
            img_preprocessed = self.preprocess_image(image_path)
            
            # Get current model
            model = self.models[self.current_model_type]
            if model is None:
                return {
                    'success': False,
                    'error': 'Model not loaded',
                    'message': f'{self.model_configs[self.current_model_type]["display_name"]} model is not available'
                }
            
            # Predict
            predictions = model.predict(img_preprocessed, verbose=0)
            predicted_class_idx = np.argmax(predictions[0])
            confidence = float(predictions[0][predicted_class_idx] * 100)
            
            # Get class name and format it for database
            raw_class_name = self.class_names[self.current_model_type][predicted_class_idx]
            predicted_class = self._format_class_name(raw_class_name)
            
            # Get all probabilities with formatted class names
            probabilities = {
                self._format_class_name(self.class_names[self.current_model_type][i]): float(predictions[0][i] * 100)
                for i in range(len(predictions[0]))
            }
            
            # SMART HEALTHY DETECTION LOGIC (Improve Accuracy)
            # Find the healthy class key
            healthy_key = next((k for k in probabilities.keys() if 'Healthy' in k), None)
            if healthy_key:
                # Get the highest disease probability
                disease_probs = [(k, v) for k, v in probabilities.items() if k != healthy_key]
                max_disease_name, max_disease_prob = max(disease_probs, key=lambda x: x[1]) if disease_probs else (None, 0)
                healthy_prob = probabilities[healthy_key]
                
                # Rule 1: If probabilities are close (difference < 15%), default to healthy to avoid false positives
                if abs(healthy_prob - max_disease_prob) < 15:
                    predicted_class = healthy_key
                    confidence = healthy_prob
                    print(f"[*] Probabilities too close ({healthy_prob:.1f}% vs {max_disease_prob:.1f}%) - Defaulting to HEALTHY")
                
                # Rule 2: If a disease is predicted but leaf looks very green/healthy
                elif 'Healthy' not in predicted_class:
                    green_val = getattr(self, '_last_green_pct', 0)
                    yellow_val = getattr(self, '_last_yellow_pct', 0)
                    
                    # Moderate confidence disease prediction on very green leaf
                    if confidence < 80 and green_val > 50 and yellow_val < 10:
                        predicted_class = healthy_key
                        confidence = max(healthy_prob, 65.0)
                        print(f"[*] Image looks visually healthy (green: {green_val:.1f}%, yellow: {yellow_val:.1f}%) - Overriding to HEALTHY")
                        
                    # High confidence disease prediction on EXTREMELY green leaf (likely model bias)
                    elif green_val > 80:
                        predicted_class = healthy_key
                        confidence = max(healthy_prob, 85.0)
                        print(f"[*] Extremely green image ({green_val:.1f}%) - Overriding high-confidence disease prediction to HEALTHY")
            
            # Check confidence threshold (lowered to 20% to allow predictions for valid leaves)
            if confidence < 20:
                return {
                    'success': False,
                    'error': f'Not a {self.model_configs[self.current_model_type]["display_name"]} Leaf',
                    'message': f'This model is trained for {self.model_configs[self.current_model_type]["display_name"]} leaves. Your image may be a different type of plant.',
                    'suggestion': f'Please upload a clear photo of a {self.model_configs[self.current_model_type]["display_name"]} leaf.',
                    'model_confidence': round(confidence, 2),
                    'detected_type': self.current_model_type
                }
            
            # Show result with low confidence warning if confidence is between 20-50%
            result = {
                'success': True,
                'disease': predicted_class,
                'confidence': round(confidence, 2),
                'probabilities': probabilities,
                'model_type': self.current_model_type,
                'model_name': self.model_configs[self.current_model_type]['display_name'],
                'is_valid': True
            }
            
            # Add warning for low confidence predictions
            if confidence < 50:
                result['warning'] = 'Low Confidence'
                result['warning_message'] = f'The model has low confidence ({round(confidence, 2)}%). The prediction may not be accurate.'
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': 'Prediction failed',
                'message': str(e)
            }
    
    @property
    def is_trained(self):
        """Check if at least one model is loaded"""
        return any(model is not None for model in self.models.values())


if __name__ == '__main__':
    # Test the dual model detector
    detector = DualModelDetector()
    
    print("\nAvailable models:")
    for model in detector.get_available_models():
        print(f"  - {model['name']} ({model['type']})")
        print(f"    Classes: {', '.join(model['classes'])}")
