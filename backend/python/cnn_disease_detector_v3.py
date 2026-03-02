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
        Validate if the image is specifically a PEPPER LEAF photo
        Returns (is_valid, reason, confidence)
        """
        try:
            img = cv2.imread(image_path)
            if img is None:
                return False, "Could not read image", 0
            
            img_resized = cv2.resize(img, (256, 256))
            hsv = cv2.cvtColor(img_resized, cv2.COLOR_BGR2HSV)
            total_pixels = img_resized.shape[0] * img_resized.shape[1]
            
            # ============= REJECTION CHECKS (Must pass all) =============
            
            # Check 1: Detect human skin tones (reject photos of people)
            skin_lower1 = np.array([0, 20, 70])
            skin_upper1 = np.array([20, 150, 255])
            skin_lower2 = np.array([0, 10, 60])
            skin_upper2 = np.array([25, 160, 255])
            
            skin_mask1 = cv2.inRange(hsv, skin_lower1, skin_upper1)
            skin_mask2 = cv2.inRange(hsv, skin_lower2, skin_upper2)
            skin_mask = cv2.bitwise_or(skin_mask1, skin_mask2)
            skin_pct = (np.sum(skin_mask > 0) / total_pixels) * 100
            
            if skin_pct > 15:
                return False, "This appears to be a photo of a person, not a pepper leaf. Please upload a clear photo of a pepper plant leaf.", 0
            
            # Check 2: Green color presence (MUST have significant green)
            green_mask = cv2.inRange(hsv, np.array([35, 25, 25]), np.array([90, 255, 255]))
            green_pct = (np.sum(green_mask > 0) / total_pixels) * 100
            
            if green_pct < 20:
                return False, f"This doesn't appear to be a pepper leaf (only {green_pct:.1f}% green content). Please upload a clear photo of a pepper plant leaf.", 0
            
            # Check 3: Blue color detection (sky, clothing, artificial objects)
            blue_mask = cv2.inRange(hsv, np.array([90, 50, 50]), np.array([130, 255, 255]))
            blue_pct = (np.sum(blue_mask > 0) / total_pixels) * 100
            
            if blue_pct > 20:
                return False, "This appears to be a photo with artificial objects or clothing, not a pepper leaf. Please upload a clear photo of a pepper plant leaf.", 0
            
            # Check 4: White/Gray background (screenshots, documents)
            gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
            white_mask = gray > 220
            white_pct = (np.sum(white_mask) / total_pixels) * 100
            
            if white_pct > 60:
                return False, "This appears to be a screenshot or document, not a pepper leaf. Please upload a real photo of a pepper plant leaf.", 0
            
            # Check 5: Too dark or black
            black_gray_mask = gray < 50
            black_gray_pct = (np.sum(black_gray_mask > 0) / total_pixels) * 100
            
            if black_gray_pct > 40 and green_pct < 30:
                return False, "Image is too dark or doesn't show a clear pepper leaf. Please take a well-lit photo of a pepper plant leaf.", 0
            
            # Check 6: Berry/Fruit detection (coffee berries, other fruits)
            # Red/brown clusters that aren't pepper-like
            red_brown_lower1 = np.array([0, 50, 50])
            red_brown_upper1 = np.array([15, 255, 255])
            red_brown_lower2 = np.array([160, 50, 50])
            red_brown_upper2 = np.array([180, 255, 255])
            
            red_mask1 = cv2.inRange(hsv, red_brown_lower1, red_brown_upper1)
            red_mask2 = cv2.inRange(hsv, red_brown_lower2, red_brown_upper2)
            red_brown_mask = cv2.bitwise_or(red_mask1, red_mask2)
            red_brown_pct = (np.sum(red_brown_mask > 0) / total_pixels) * 100
            
            # If we see lots of red/brown (like coffee berries) with green leaves, likely not pepper
            if red_brown_pct > 15 and green_pct > 30:
                return False, "This appears to be a different plant (possibly coffee or other berry plant), not a pepper leaf. Please upload a photo of a pepper plant leaf only.", 0
            
            # Check 7: Detect multiple small objects (berries/fruits)
            # Find contours of potential berries
            berry_mask = red_brown_mask.copy()
            contours, _ = cv2.findContours(berry_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Count small circular objects (berries)
            berry_count = 0
            for contour in contours:
                area = cv2.contourArea(contour)
                if 20 < area < 500:  # Berry-sized objects
                    berry_count += 1
            
            if berry_count > 10:
                return False, "This image shows berry/fruit clusters that are not typical of pepper leaves. Please upload a close-up photo of a single pepper plant leaf.", 0
            
            # Check 8: Leaf shape analysis (reject round/oval leaves like spinach)
            # Find the largest contour (should be the leaf)
            green_mask_bgr = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
            green_only = cv2.cvtColor(green_mask_bgr, cv2.COLOR_RGB2GRAY)
            _, thresh = cv2.threshold(green_only, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            contours_leaf, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if len(contours_leaf) > 0:
                # Get largest contour
                largest_contour = max(contours_leaf, key=cv2.contourArea)
                area = cv2.contourArea(largest_contour)
                
                if area > 1000:  # Only analyze if contour is significant
                    # Get bounding rectangle
                    x, y, w, h = cv2.boundingRect(largest_contour)
                    aspect_ratio = float(w) / h if h > 0 else 0
                    
                    # Pepper leaves are typically elongated (aspect ratio 0.4-0.8)
                    # Spinach/round leaves have aspect ratio close to 1.0
                    if 0.85 < aspect_ratio < 1.15:
                        # This is a round/oval leaf (like spinach, lettuce)
                        return False, "This appears to be a round leafy vegetable (like spinach or lettuce), not a pepper leaf. Pepper leaves are more elongated. Please upload a photo of a pepper plant leaf only.", 0
            
            # Check 9: Multiple overlapping leaves detection (like spinach bunches)
            # If we see too many separate leaf-like regions, it's likely a bunch of leafy greens
            contours_all, _ = cv2.findContours(cv2.Canny(gray, 30, 100), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            large_regions = [c for c in contours_all if cv2.contourArea(c) > 500]
            
            if len(large_regions) > 8:
                return False, "This image shows multiple overlapping leaves (like spinach or lettuce bunches). Please upload a clear photo of a SINGLE pepper plant leaf only.", 0
            
            # ============= PEPPER LEAF POSITIVE INDICATORS =============
            
            score = 0
            
            # Strong green presence
            if green_pct >= 40:
                score += 150
            elif green_pct >= 30:
                score += 100
            elif green_pct >= 20:
                score += 60
            
            # Color saturation
            avg_saturation = np.mean(hsv[:, :, 1])
            if avg_saturation >= 60:
                score += 80
            elif avg_saturation >= 40:
                score += 50
            elif avg_saturation >= 20:
                score += 30
            
            # Natural texture variance
            variance = np.var(gray)
            if variance > 1000:
                score += 70
            elif variance > 500:
                score += 50
            elif variance > 200:
                score += 30
            
            # Leaf-like color distribution
            std_hue = np.std(hsv[:, :, 0])
            if 10 < std_hue < 30:
                score += 50
            
            # Natural leaf edges
            edges = cv2.Canny(gray, 50, 150)
            edge_pct = (np.sum(edges > 0) / total_pixels) * 100
            if 5 < edge_pct < 25:
                score += 50
            
            # Calculate confidence
            max_score = 400
            confidence = min(100, (score / max_score) * 100)
            
            # VERY STRICT: Only accept if validation confidence is high
            if confidence >= 70:  # Increased from 60 to 70
                return True, "Valid pepper leaf image", round(confidence, 1)
            else:
                return False, f"This doesn't appear to be a pepper plant leaf (validation confidence: {confidence:.1f}%). This might be a different plant species. Please upload a clear, close-up photo of a PEPPER plant leaf only.", round(confidence, 1)
            
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
                
                # Rule 1: If both probabilities are close (difference < 20%), default to healthy
                prob_diff = abs(healthy_prob - bacterial_prob)
                if prob_diff < 20:
                    predicted_class = healthy_class
                    confidence = healthy_prob
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
            
            # EXTREMELY STRICT CONFIDENCE CHECK
            # The model was trained ONLY on pepper leaves. Low confidence = NOT a pepper leaf
            if confidence < 85:  # Increased from 75 to 85 - very strict!
                return {
                    'success': False,
                    'error': 'Not a Pepper Plant Leaf',
                    'message': f'This does not appear to be a pepper plant leaf. The model confidence is only {confidence:.1f}%, which indicates this is likely a different plant species (such as coffee, tomato, basil, spinach, lettuce, or other crops).',
                    'suggestion': 'This system is designed SPECIFICALLY for pepper plant leaves. Please upload a clear, close-up photo of a PEPPER plant leaf ONLY - no other plant species will be analyzed.',
                    'detailed_error': True,
                    'model_confidence': round(confidence, 2)
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
