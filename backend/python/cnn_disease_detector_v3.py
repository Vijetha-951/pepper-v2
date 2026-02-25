import tensorflow as tf
from tensorflow import keras
import numpy as np
import cv2
import json
import os

class CNNDiseaseDetector:
    def __init__(self, model_path=None):
        """Initialize the CNN-based disease detector"""
        print("[*] Initializing CNN Disease Detector...")
        self.model = None
        self.class_names = None
        
        # Default model path
        if model_path is None:
            model_path = os.path.join(os.path.dirname(__file__), 'models', 'pepper_disease_model_v3.keras')
        
        self.model_path = model_path
        print(f"[*] Model path: {self.model_path}")
        print("[*] Loading model (this may take 30-60 seconds)...")
        self.load_model()
        print("[*] Loading class names...")
        self.load_class_names()
        print("[*] Detector initialization complete!")
    
    def load_model(self):
        """Load the trained CNN model"""
        try:
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
            
            print(f"[*] Loading CNN model from: {self.model_path}")
            print("[*] Please wait, TensorFlow is loading the model...")
            self.model = keras.models.load_model(self.model_path)
            print(f"[*] CNN model loaded successfully!")
            print(f"   Input shape: {self.model.input_shape}")
            print(f"   Output shape: {self.model.output_shape}")
            
        except Exception as e:
            raise RuntimeError(f"Failed to load CNN model: {str(e)}")
    
    def load_class_names(self):
        """Load class names from JSON file"""
        model_dir = os.path.dirname(self.model_path)
        class_file = os.path.join(model_dir, 'class_indices.json')
        
        try:
            with open(class_file, 'r') as f:
                class_indices = json.load(f)
            # Reverse mapping: index -> class name
            self.class_names = {v: k for k, v in class_indices.items()}
            print(f"   Classes: {list(self.class_names.values())}")
        except FileNotFoundError:
            raise FileNotFoundError(f"class_indices.json not found at: {class_file}")
    
    @property
    def is_trained(self):
        """Check if model is loaded and trained"""
        return self.model is not None
    
    def preprocess_image(self, image_path):
        """Preprocess image for CNN prediction"""
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image: {image_path}")
        
        # Save original image for validation if needed
        self._last_img = img.copy()
        
        # Convert BGR to RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Resize to model input size (224x224 for MobileNetV2)
        img_resized = cv2.resize(img_rgb, (224, 224))
        
        # Normalize pixel values to [0, 1]
        img_norm = img_resized.astype(np.float32) / 255.0
        
        # Add batch dimension
        img_batch = np.expand_dims(img_norm, axis=0)
        
        return img_batch
    
    def is_valid_plant_image(self, image_path):
        """
        Validate if the image is actually a plant/leaf photo
        Returns (is_valid, reason, confidence)
        """
        try:
            img = cv2.imread(image_path)
            if img is None:
                return False, "Could not read image", 0
            
            img_resized = cv2.resize(img, (256, 256))
            hsv = cv2.cvtColor(img_resized, cv2.COLOR_BGR2HSV)
            total_pixels = img_resized.shape[0] * img_resized.shape[1]
            
            # Check 1: Green color presence (plants should have green)
            # Expanded range to catch more plant tones
            green_mask = cv2.inRange(hsv, np.array([35, 20, 20]), np.array([90, 255, 255]))
            green_pct = (np.sum(green_mask > 0) / total_pixels) * 100
            
            # Check 2: White/Gray percentage (screenshots/documents have lots of white)
            gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
            white_mask = gray > 230
            white_pct = (np.sum(white_mask) / total_pixels) * 100
            
            # Check 3: Color saturation (natural images have good saturation)
            avg_saturation = np.mean(hsv[:, :, 1])
            
            # Check 4: Natural image variance
            variance = np.var(gray)
            
            # Scoring system
            score = 0
            reasons = []
            
            if green_pct < 5:
                reasons.append(f"No green color detected ({green_pct:.1f}%)")
            elif green_pct < 15:
                score += 40
                reasons.append(f"Very low green content ({green_pct:.1f}%)")
            else:
                score += 100
                
            if white_pct > 70:
                reasons.append(f"Too much white/background ({white_pct:.1f}%) - looks like a document or screenshot")
            elif white_pct > 40:
                score += 30
            else:
                score += 80
                
            if avg_saturation < 20:
                reasons.append(f"Image is too gray/desaturated ({avg_saturation:.1f})")
            else:
                score += 70
                
            if variance < 500:
                reasons.append("Image lacks natural texture/variance")
            else:
                score += 50
                
            max_score = 300
            confidence = (score / max_score) * 100
            
            is_valid = confidence >= 60  # Stricter threshold
            reason = "Valid plant image" if is_valid else "Not a plant image: " + ", ".join(reasons)
            
            return is_valid, reason, round(confidence, 1)
            
        except Exception:
            return False, "Validation error", 0

    def predict(self, image_path):
        """
        Predict disease from image
        """
        try:
            # First validate if it's even a plant
            is_valid, reason, val_conf = self.is_valid_plant_image(image_path)
            
            # If not valid plant, return error early
            if not is_valid:
                return {
                    'success': False,
                    'error': 'Invalid Image',
                    'message': reason,
                    'validation_confidence': val_conf,
                    'suggestion': 'Please upload a clear photo of a pepper plant leaf. Screenshots and documents are not supported.',
                    'detailed_error': True
                }
            
            # Preprocess image
            img = self.preprocess_image(image_path)
            
            # Make prediction
            predictions = self.model.predict(img, verbose=0)[0]
            
            # Get predicted class
            predicted_idx = np.argmax(predictions)
            predicted_class = self.class_names[predicted_idx]
            confidence = float(predictions[predicted_idx]) * 100
            
            # If confidence is very low even for a valid plant image
            if confidence < 40:
                return {
                    'success': False,
                    'error': 'Low Confidence',
                    'message': f'Model is not sure about this image (Confidence: {confidence:.1f}%).',
                    'suggestion': 'Please ensure you are uploading a clear photo of a PEPPER plant leaf.',
                    'detailed_error': True
                }
            
            # Get all class probabilities
            probabilities = {
                self.class_names[i]: float(predictions[i]) * 100
                for i in range(len(predictions))
            }
            
            return {
                'disease': predicted_class,
                'confidence': round(confidence, 2),
                'probabilities': probabilities,
                'is_valid': True
            }
            
        except Exception as e:
            raise RuntimeError(f"Prediction failed: {str(e)}")

# For compatibility with existing API code
PlantDiseaseDetector = CNNDiseaseDetector
