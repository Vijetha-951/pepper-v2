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
            model_path = os.path.join(os.path.dirname(__file__), 'models', 'black_pepper_disease_model.keras')
        
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
        class_file = os.path.join(model_dir, 'black_pepper_class_indices.json')
        
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
        Validate if the image contains plant/leaf content
        Accepts both Bell Pepper (Capsicum) and Black Pepper (Piper nigrum) leaves
        Returns (is_valid, reason, confidence)
        """
        try:
            img = cv2.imread(image_path)
            if img is None:
                return False, "Could not read image", 0
            
            img_resized = cv2.resize(img, (256, 256))
            hsv = cv2.cvtColor(img_resized, cv2.COLOR_BGR2HSV)
            total_pixels = img_resized.shape[0] * img_resized.shape[1]
            
            print(f"[DEBUG] ===== IMAGE VALIDATION START =====")
            
            # ============= BASIC REJECTION CHECKS =============
            # Goal: Only filter out obviously non-plant images (people, screenshots, etc.)
            
            # Check 1: Plant color presence (Green, Yellow, Brown)
            green_mask = cv2.inRange(hsv, np.array([35, 20, 20]), np.array([90, 255, 255]))
            green_pct = (np.sum(green_mask > 0) / total_pixels) * 100
            
            # Yellow/Brown (diseased/stressed/necrotic tissue)
            yellow_mask = cv2.inRange(hsv, np.array([10, 20, 20]), np.array([35, 255, 255]))
            yellow_pct = (np.sum(yellow_mask > 0) / total_pixels) * 100
            
            brown_mask = cv2.inRange(hsv, np.array([0, 0, 20]), np.array([30, 255, 100]))
            brown_pct = (np.sum(brown_mask > 0) / total_pixels) * 100
            
            plant_pct = green_pct + yellow_pct + brown_pct
            print(f"[DEBUG] Total plant percentage: {plant_pct:.2f}% (G:{green_pct:.1f}, Y:{yellow_pct:.1f}, B:{brown_pct:.1f})")
            
            # Very lenient - just needs SOME plant content (lowered from 8)
            if plant_pct < 2:
                print(f"[DEBUG] ❌ REJECTED: Not enough plant content")
                return False, "This is not a pepper plant leaf. Please upload a clear photo of a pepper plant leaf.", 0
            
            # Check 2: Detect human skin (reject photos of people)
            # Tightened ranges to avoid brown/yellow leaf spots
            skin_lower1 = np.array([0, 30, 80])
            skin_upper1 = np.array([20, 130, 255])
            skin_lower2 = np.array([0, 20, 70])
            skin_upper2 = np.array([25, 140, 255])
            
            skin_mask1 = cv2.inRange(hsv, skin_lower1, skin_upper1)
            skin_mask2 = cv2.inRange(hsv, skin_lower2, skin_upper2)
            skin_mask = cv2.bitwise_or(skin_mask1, skin_mask2)
            skin_pct = (np.sum(skin_mask > 0) / total_pixels) * 100
            print(f"[DEBUG] Skin tone percentage: {skin_pct:.2f}%")
            
            # Correct plant content by excluding skin tones
            plant_pct = green_pct + max(0, yellow_pct - skin_pct/2) + max(0, brown_pct - skin_pct)
            
            # Re-check plant content
            if plant_pct < 2:
                print(f"[DEBUG] ❌ REJECTED: Not enough plant content (excluding skin)")
                return False, "This is not a pepper plant leaf. Please upload a clear photo of a pepper plant leaf.", 0
            
            # Reject if it's likely a person
            # RESTORED green_pct check: If there's enough green, it's likely a leaf with some skin-like spots
            if (skin_pct > 20 and green_pct < 15) or skin_pct > 40:
                print(f"[DEBUG] ❌ REJECTED: This looks like a photo of a person or hand")
                return False, f"This appears to be a photo of a person (skin: {skin_pct:.1f}%). Please upload a photo of the actual pepper plant leaf.", 0
            
            # Check 3: Artificial blue (sky, screens, clothing)
            blue_mask = cv2.inRange(hsv, np.array([90, 50, 50]), np.array([130, 255, 255]))
            blue_pct = (np.sum(blue_mask > 0) / total_pixels) * 100
            print(f"[DEBUG] Blue percentage: {blue_pct:.2f}%")
            
            if blue_pct > 35:
                print(f"[DEBUG] ❌ REJECTED: Too much blue (sky/artificial)")
                return False, "This is not a pepper plant leaf. Please upload a clear photo of a pepper plant leaf.", 0
            
            # Check 4: Screenshots/documents
            gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
            white_mask = gray > 220
            white_pct = (np.sum(white_mask) / total_pixels) * 100
            print(f"[DEBUG] White percentage: {white_pct:.2f}%")
            
            if white_pct > 85:
                print(f"[DEBUG] ❌ REJECTED: Looks like a document/screenshot")
                return False, "This is not a pepper plant leaf. Please upload a clear photo of a pepper plant leaf.", 0
            
            # Check 5: Too dark
            black_gray_mask = gray < 50
            black_gray_pct = (np.sum(black_gray_mask > 0) / total_pixels) * 100
            print(f"[DEBUG] Dark percentage: {black_gray_pct:.2f}%")
            
            if black_gray_pct > 60 and green_pct < 20:
                print(f"[DEBUG] ❌ REJECTED: Image too dark")
                return False, "This is not a pepper plant leaf. Please upload a clear photo of a pepper plant leaf.", 0
            
            # Check 6: Aspect Ratio Check (New) - Reject broad non-pepper leaves
            leaf_mask = cv2.bitwise_or(cv2.bitwise_or(green_mask, yellow_mask), brown_mask)
            contours, _ = cv2.findContours(leaf_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if contours:
                largest_contour = max(contours, key=cv2.contourArea)
                if cv2.contourArea(largest_contour) > 1000:
                    x, y, w, h = cv2.boundingRect(largest_contour)
                    # Orientation-independent aspect ratio
                    long_side = max(w, h)
                    short_side = min(w, h)
                    ratio = float(long_side) / short_side if short_side > 0 else 0
                    print(f"[DEBUG] Leaf ratio: {ratio:.2f} (w:{w}, h:{h})")
                    
                    # Loosened to prevent false rejections
                    if ratio < 1.0 or ratio > 8.0:
                        print(f"[DEBUG] ❌ REJECTED: Shape not typical of pepper")
                        return False, f"This leaf shape is not typical of a pepper plant (ratio: {ratio:.2f}). Please upload a clear photo of a pepper plant leaf.", 0
            
            print(f"[DEBUG] ✅ Passed basic rejection checks (not a person/screenshot/etc.)")
            
            # ============= SIMPLE PLANT VALIDATION =============
            # Just verify it looks like a plant - let the CNN model do the heavy lifting
            
            # If we got here, it passed basic checks (has green, not a person, not a screenshot)
            # Give it to the CNN model to make the final decision
            
            print(f"[DEBUG] ✅ IMAGE VALIDATION PASSED")
            print(f"[DEBUG] Image has sufficient plant characteristics")
            print(f"[DEBUG] Passing to CNN model for pepper leaf identification...")
            print(f"[DEBUG] ===== IMAGE VALIDATION END =====")
            
            # Return True with high confidence - we trust the CNN model
            return True, "Valid plant image", 100
            
        except Exception as e:
            return False, f"Validation error: {str(e)}", 0

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
            
            # Get all class probabilities
            probabilities = {
                self.class_names[i]: float(predictions[i]) * 100
                for i in range(len(predictions))
            }
            
            # Get predicted class
            predicted_idx = np.argmax(predictions)
            predicted_class = self.class_names[predicted_idx]
            confidence = float(predictions[predicted_idx]) * 100
            
            # SMART HEALTHY DETECTION LOGIC
            # Find the healthy class
            healthy_classes = [cls for cls in self.class_names.values() if 'healthy' in cls.lower()]
            bacterial_classes = [cls for cls in self.class_names.values() if 'bacterial' in cls.lower()]
            
            if healthy_classes and bacterial_classes:
                healthy_class = healthy_classes[0]
                bacterial_class = bacterial_classes[0]
                
                healthy_prob = probabilities.get(healthy_class, 0)
                bacterial_prob = probabilities.get(bacterial_class, 0)
                
                # Rule 1: If both probabilities are close (difference < 25%), default to healthy
                prob_diff = abs(healthy_prob - bacterial_prob)
                if prob_diff < 25:
                    predicted_class = healthy_class
                    confidence = max(healthy_prob, bacterial_prob)
                    print(f"[*] Probabilities too close ({bacterial_prob:.1f}% vs {healthy_prob:.1f}%) - Defaulting to HEALTHY")
                
                # Rule 2: If bacterial spot is predicted but confidence < 70%, check for healthy indicators
                elif predicted_class == bacterial_class and confidence < 70:
                    # Check if image looks healthy
                    img_cv = cv2.imread(image_path)
                    hsv = cv2.cvtColor(img_cv, cv2.COLOR_BGR2HSV)
                    
                    # Check for vibrant green (healthy indicator)
                    green_mask = cv2.inRange(hsv, np.array([35, 40, 40]), np.array([90, 255, 255]))
                    green_pct = (np.sum(green_mask > 0) / (img_cv.shape[0] * img_cv.shape[1])) * 100
                    
                    # Check for dark spots (disease indicator)
                    lower_dark = np.array([0, 0, 0])
                    upper_dark = np.array([180, 255, 80])
                    dark_mask = cv2.inRange(hsv, lower_dark, upper_dark)
                    dark_pct = (np.sum(dark_mask > 0) / (img_cv.shape[0] * img_cv.shape[1])) * 100
                    
                    # If image is mostly green with few dark spots, override to healthy
                    if green_pct > 50 and dark_pct < 15:
                        predicted_class = healthy_class
                        confidence = max(healthy_prob, 60.0)  # Give at least 60% confidence
                        print(f"[*] Image shows healthy indicators (green: {green_pct:.1f}%, dark: {dark_pct:.1f}%) - Overriding to HEALTHY")
                
                # Rule 3: If bacterial spot predicted with high confidence, verify with visual checks
                elif predicted_class == bacterial_class and confidence >= 70:
                    img_cv = cv2.imread(image_path)
                    hsv = cv2.cvtColor(img_cv, cv2.COLOR_BGR2HSV)
                    
                    # Check for dark lesions/spots (bacterial spot indicator)
                    lower_dark = np.array([0, 0, 0])
                    upper_dark = np.array([180, 255, 80])
                    dark_mask = cv2.inRange(hsv, lower_dark, upper_dark)
                    dark_pct = (np.sum(dark_mask > 0) / (img_cv.shape[0] * img_cv.shape[1])) * 100
                    
                    # Check for brown/yellow spots (disease indicator)
                    brown_yellow_mask = cv2.inRange(hsv, np.array([10, 40, 40]), np.array([30, 255, 255]))
                    brown_yellow_pct = (np.sum(brown_yellow_mask > 0) / (img_cv.shape[0] * img_cv.shape[1])) * 100
                    
                    # If no significant dark or brown spots, likely a false positive
                    if dark_pct < 10 and brown_yellow_pct < 10:
                        predicted_class = healthy_class
                        confidence = max(healthy_prob, 65.0)
                        print(f"[*] No disease indicators found (dark: {dark_pct:.1f}%, brown: {brown_yellow_pct:.1f}%) - Overriding to HEALTHY")
            
            # TRUST THE CNN MODEL
            # The model was trained specifically on pepper leaves (Bell Pepper - Capsicum)
            # If confidence is low, it means the image doesn't match the training data
            print(f"[DEBUG] ===== CNN MODEL PREDICTION =====")
            print(f"[DEBUG] Predicted class: {predicted_class}")
            print(f"[DEBUG] Model confidence: {confidence:.2f}%")
            print(f"[DEBUG] All probabilities: {probabilities}")
            
            # If CNN model has low confidence, it's likely not a bell pepper leaf
            # Note: This model was trained on BELL PEPPER, not BLACK PEPPER
            if confidence < 75:  # Model is uncertain
                print(f"[DEBUG] ❌ MODEL REJECTION: Confidence too low ({confidence:.2f}%)")
                print(f"[DEBUG] This may be a different type of pepper plant or another plant entirely")
                return {
                    'success': False,
                    'error': 'Unknown Species',
                    'message': f"I'm only {confidence:.1f}% confident this is a pepper leaf. It might be a different plant species.",
                    'confidence': round(confidence, 2)
                }
            
            return {
                'success': True,
                'disease': predicted_class,
                'confidence': round(confidence, 2),
                'probabilities': probabilities
            }
            
        except Exception as e:
            raise RuntimeError(f"Prediction failed: {str(e)}")

# For compatibility with existing API code
PlantDiseaseDetector = CNNDiseaseDetector
