"""
Pepper Plant Disease Detection Module
Uses computer vision (OpenCV) and machine learning to identify plant diseases from leaf images
"""

import cv2
import numpy as np
import pickle
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import warnings
warnings.filterwarnings('ignore')


class PlantDiseaseDetector:
    """
    Plant Disease Detection using Image Analysis
    
    Detects:
    - Healthy
    - Bacterial Spot
    - Yellow Leaf Curl
    - Nutrient Deficiency
    """
    
    def __init__(self, model_path='backend/python/models/disease_model_real.pkl'):
        # Prefer real image model if it exists, fallback to synthetic
        real_model_path = 'backend/python/models/disease_model_real.pkl'
        synthetic_model_path = 'backend/python/models/disease_model.pkl'
        
        if os.path.exists(real_model_path):
            self.model_path = real_model_path
            self.model_type = 'real'
        elif os.path.exists(synthetic_model_path):
            self.model_path = synthetic_model_path
            self.model_type = 'synthetic'
        else:
            self.model_path = model_path
            self.model_type = 'unknown'
        
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        
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
            'Bacterial Spot': {
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
            'Yellow Leaf Curl': {
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
            'Nutrient Deficiency': {
                'name': 'Nutrient Deficiency',
                'severity': 'Low to Moderate',
                'description': 'Yellowing or discoloration due to lack of essential nutrients.',
                'treatment': [
                    'Apply balanced NPK fertilizer (10-10-10)',
                    'For nitrogen deficiency: add blood meal or fish emulsion',
                    'For magnesium deficiency: apply Epsom salt solution',
                    'Test soil pH and adjust if needed (optimal: 6.0-6.8)'
                ],
                'prevention': [
                    'Regular soil testing (every 6 months)',
                    'Maintain proper fertilization schedule',
                    'Use compost to improve soil quality',
                    'Ensure proper drainage to prevent nutrient leaching'
                ]
            }
        }
        
        self.load_model()
    
    def is_valid_plant_image(self, image_path):
        """
        Validate if the image is actually a plant/leaf photo
        Returns (is_valid, reason, confidence)
        """
        try:
            img = cv2.imread(image_path)
            if img is None:
                return False, "Could not read image", 0
            
            img = cv2.resize(img, (256, 256))
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            total_pixels = img.shape[0] * img.shape[1]
            
            # Check 1: Green color presence (plants should have green)
            green_mask = cv2.inRange(hsv, np.array([35, 30, 30]), np.array([85, 255, 255]))
            green_pct = (np.sum(green_mask > 0) / total_pixels) * 100
            
            # Check 2: White/Gray percentage (screenshots/documents have lots of white)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            white_mask = gray > 240
            white_pct = (np.sum(white_mask) / total_pixels) * 100
            
            # Check 3: Color saturation (natural images have good saturation)
            avg_saturation = np.mean(hsv[:, :, 1])
            
            # Check 4: Blue color (screenshots/UI often have blue)
            blue_mask = cv2.inRange(hsv, np.array([100, 50, 50]), np.array([130, 255, 255]))
            blue_pct = (np.sum(blue_mask > 0) / total_pixels) * 100
            
            # Check 5: Texture complexity (screenshots/text have different texture)
            edges = cv2.Canny(gray, 50, 150)
            edge_pct = (np.sum(edges > 0) / total_pixels) * 100
            
            # Check 6: PEPPER-SPECIFIC - Check for pepper leaf characteristics
            # Pepper leaves are typically elongated with smooth edges
            # Look for leaf shape and aspect ratio
            contours, _ = cv2.findContours(green_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            pepper_like = False
            aspect_ratio = 0
            
            if contours:
                # Find largest green contour (likely the leaf)
                largest_contour = max(contours, key=cv2.contourArea)
                if cv2.contourArea(largest_contour) > 1000:  # Significant size
                    x, y, w, h = cv2.boundingRect(largest_contour)
                    aspect_ratio = float(w) / h if h > 0 else 0
                    # Pepper leaves typically have aspect ratio between 0.4-0.8 (elongated)
                    # Other plants like potato have different ratios
                    if 0.35 < aspect_ratio < 0.85:
                        pepper_like = True
            
            # Check 7: Color distribution - peppers have specific green tones
            # Check for dark green (mature pepper leaves)
            dark_green_mask = cv2.inRange(hsv, np.array([40, 40, 30]), np.array([75, 255, 120]))
            dark_green_pct = (np.sum(dark_green_mask > 0) / total_pixels) * 100
            
            # Scoring system
            score = 0
            reasons = []
            pepper_score = 0
            
            # Green presence (most important for plants)
            if green_pct < 10:
                reasons.append(f"Very low green content ({green_pct:.1f}%)")
            elif green_pct < 20:
                score += 30
                reasons.append(f"Low green content ({green_pct:.1f}%)")
            else:
                score += 100
            
            # White/Screenshot detection
            if white_pct > 50:
                reasons.append(f"Too much white/background ({white_pct:.1f}%)")
            elif white_pct > 30:
                score += 40
            else:
                score += 80
            
            # Saturation check
            if avg_saturation < 30:
                reasons.append(f"Low color saturation ({avg_saturation:.1f})")
            elif avg_saturation < 50:
                score += 50
            else:
                score += 80
            
            # Blue UI elements check
            if blue_pct > 15:
                reasons.append(f"Contains UI-like blue colors ({blue_pct:.1f}%)")
            else:
                score += 60
            
            # Natural texture check
            if edge_pct > 50:
                reasons.append(f"Too many edges/text-like patterns ({edge_pct:.1f}%)")
            elif edge_pct < 5:
                reasons.append(f"Too smooth/artificial ({edge_pct:.1f}%)")
            else:
                score += 80
            
            # PEPPER-SPECIFIC CHECKS
            if pepper_like:
                pepper_score += 50
            else:
                if aspect_ratio > 0:  # If we detected a leaf but it's not pepper-like
                    reasons.append(f"Leaf shape not typical of pepper (aspect ratio: {aspect_ratio:.2f})")
            
            if dark_green_pct > 15:
                pepper_score += 30
            else:
                reasons.append(f"Color tone doesn't match pepper leaves")
            
            # Add warning if it looks like a plant but not pepper-specific
            if score > 200 and pepper_score < 40:
                reasons.append("Looks like a plant leaf, but NOT pepper-specific characteristics")
            
            # Calculate confidence
            max_score = 480  # Updated with pepper checks
            total_score = score + pepper_score
            confidence = (total_score / max_score) * 100
            
            # Decision threshold - stricter now
            is_valid = confidence >= 55
            
            if not is_valid:
                reason = "Not a valid pepper leaf image: " + ", ".join(reasons)
            else:
                reason = "Valid pepper leaf image"
            
            return is_valid, reason, round(confidence, 1)
            
        except Exception as e:
            return False, f"Validation error: {str(e)}", 0
    
    def extract_features(self, image_path):
        """
        Extract color and texture features from leaf image
        
        Features extracted:
        1-3: Mean HSV values
        4-6: Standard deviation of HSV
        7-9: Dominant color percentages
        10-12: Texture features (edge density, smoothness, uniformity)
        """
        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError(f"Could not read image: {image_path}")
            
            # Resize for consistent processing
            img = cv2.resize(img, (256, 256))
            
            # Convert to HSV color space
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            
            # Feature 1-3: Mean HSV values
            mean_h = np.mean(hsv[:, :, 0])
            mean_s = np.mean(hsv[:, :, 1])
            mean_v = np.mean(hsv[:, :, 2])
            
            # Feature 4-6: Standard deviation of HSV
            std_h = np.std(hsv[:, :, 0])
            std_s = np.std(hsv[:, :, 1])
            std_v = np.std(hsv[:, :, 2])
            
            # Feature 7-9: Color distribution
            # Percentage of green, yellow, and brown pixels
            green_mask = cv2.inRange(hsv, np.array([35, 40, 40]), np.array([85, 255, 255]))
            yellow_mask = cv2.inRange(hsv, np.array([20, 100, 100]), np.array([35, 255, 255]))
            brown_mask = cv2.inRange(hsv, np.array([10, 100, 20]), np.array([20, 255, 200]))
            
            total_pixels = img.shape[0] * img.shape[1]
            green_pct = np.sum(green_mask > 0) / total_pixels * 100
            yellow_pct = np.sum(yellow_mask > 0) / total_pixels * 100
            brown_pct = np.sum(brown_mask > 0) / total_pixels * 100
            
            # Feature 10-12: Texture features
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Edge density (using Canny edge detection)
            edges = cv2.Canny(gray, 50, 150)
            edge_density = np.sum(edges > 0) / total_pixels * 100
            
            # Smoothness (inverse of variance)
            variance = np.var(gray)
            smoothness = 1 - (1 / (1 + variance))
            
            # Uniformity (histogram-based)
            hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
            hist = hist / np.sum(hist)
            uniformity = np.sum(hist ** 2)
            
            features = np.array([
                mean_h, mean_s, mean_v,
                std_h, std_s, std_v,
                green_pct, yellow_pct, brown_pct,
                edge_density, smoothness * 100, uniformity * 100
            ])
            
            return features
            
        except Exception as e:
            raise Exception(f"Feature extraction failed: {str(e)}")
    
    def train(self, synthetic_data=True):
        """
        Train the disease detection model
        
        Args:
            synthetic_data: If True, generates synthetic training data
        """
        try:
            if synthetic_data:
                X, y = self._generate_synthetic_training_data()
            else:
                raise NotImplementedError("Real image training not yet implemented")
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train Random Forest Classifier
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                class_weight='balanced'
            )
            
            self.model.fit(X_train_scaled, y_train)
            
            # Evaluate
            y_pred = self.model.predict(X_test_scaled)
            accuracy = accuracy_score(y_test, y_pred)
            
            self.is_trained = True
            self.save_model()
            
            return {
                'success': True,
                'accuracy': round(accuracy, 3),
                'training_samples': len(X_train),
                'test_samples': len(X_test),
                'classes': list(self.disease_info.keys())
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _generate_synthetic_training_data(self, samples_per_class=250):
        """
        Generate synthetic feature data for training
        Based on typical characteristics of each disease
        """
        X = []
        y = []
        
        # Healthy: High green, low yellow/brown, uniform
        for _ in range(samples_per_class):
            features = [
                np.random.normal(50, 10),   # mean_h (green hue)
                np.random.normal(100, 20),  # mean_s
                np.random.normal(120, 15),  # mean_v
                np.random.normal(15, 5),    # std_h
                np.random.normal(30, 10),   # std_s
                np.random.normal(25, 8),    # std_v
                np.random.normal(70, 10),   # green_pct (high)
                np.random.normal(5, 3),     # yellow_pct (low)
                np.random.normal(2, 2),     # brown_pct (low)
                np.random.normal(15, 5),    # edge_density
                np.random.normal(75, 10),   # smoothness
                np.random.normal(60, 10)    # uniformity
            ]
            X.append(features)
            y.append('Healthy')
        
        # Bacterial Spot: Dark spots, moderate yellow, high edge density
        for _ in range(samples_per_class):
            features = [
                np.random.normal(45, 15),   # mean_h
                np.random.normal(80, 25),   # mean_s
                np.random.normal(90, 20),   # mean_v (darker)
                np.random.normal(25, 8),    # std_h (more variation)
                np.random.normal(45, 12),   # std_s
                np.random.normal(35, 10),   # std_v
                np.random.normal(50, 15),   # green_pct (reduced)
                np.random.normal(15, 8),    # yellow_pct
                np.random.normal(20, 10),   # brown_pct (spots)
                np.random.normal(35, 10),   # edge_density (high - spots)
                np.random.normal(50, 15),   # smoothness (reduced)
                np.random.normal(40, 12)    # uniformity (reduced)
            ]
            X.append(features)
            y.append('Bacterial Spot')
        
        # Yellow Leaf Curl: High yellow, curled (high edge density)
        for _ in range(samples_per_class):
            features = [
                np.random.normal(30, 10),   # mean_h (yellow hue)
                np.random.normal(120, 20),  # mean_s
                np.random.normal(130, 15),  # mean_v
                np.random.normal(20, 7),    # std_h
                np.random.normal(35, 10),   # std_s
                np.random.normal(30, 8),    # std_v
                np.random.normal(30, 12),   # green_pct (low)
                np.random.normal(50, 15),   # yellow_pct (high)
                np.random.normal(5, 4),     # brown_pct
                np.random.normal(40, 12),   # edge_density (curling)
                np.random.normal(55, 12),   # smoothness
                np.random.normal(45, 10)    # uniformity
            ]
            X.append(features)
            y.append('Yellow Leaf Curl')
        
        # Nutrient Deficiency: Pale/yellow, uniform discoloration
        for _ in range(samples_per_class):
            features = [
                np.random.normal(35, 12),   # mean_h (pale yellow-green)
                np.random.normal(60, 20),   # mean_s (desaturated)
                np.random.normal(140, 15),  # mean_v (bright)
                np.random.normal(12, 5),    # std_h (uniform)
                np.random.normal(20, 8),    # std_s
                np.random.normal(20, 7),    # std_v
                np.random.normal(40, 15),   # green_pct
                np.random.normal(35, 12),   # yellow_pct (moderate)
                np.random.normal(3, 3),     # brown_pct (low)
                np.random.normal(18, 6),    # edge_density (low)
                np.random.normal(70, 10),   # smoothness (high - uniform)
                np.random.normal(65, 10)    # uniformity (high)
            ]
            X.append(features)
            y.append('Nutrient Deficiency')
        
        return np.array(X), np.array(y)
    
    def predict(self, image_path):
        """
        Predict disease from leaf image
        
        Args:
            image_path: Path to the leaf image
            
        Returns:
            dict with prediction results
        """
        if not self.is_trained:
            return {
                'success': False,
                'error': 'Model not trained. Please train the model first.'
            }
        
        try:
            # STEP 1: Validate if image is actually a plant/leaf
            is_valid, reason, validation_confidence = self.is_valid_plant_image(image_path)
            
            if not is_valid:
                return {
                    'success': False,
                    'error': 'Invalid Image',
                    'message': reason,
                    'validation_confidence': validation_confidence,
                    'suggestion': 'Please upload a clear photo of a pepper plant leaf'
                }
            
            # STEP 2: Extract features
            features = self.extract_features(image_path)
            features_scaled = self.scaler.transform(features.reshape(1, -1))
            
            # STEP 3: Predict
            prediction = self.model.predict(features_scaled)[0]
            probabilities = self.model.predict_proba(features_scaled)[0]
            
            # Get class names
            classes = self.model.classes_
            
            # Create probability dict
            prob_dict = {cls: float(prob) for cls, prob in zip(classes, probabilities)}
            
            # Get confidence
            confidence = float(max(probabilities)) * 100
            
            # STEP 4: Advanced validation checks
            CONFIDENCE_THRESHOLD = 70.0  # Minimum confidence required
            MAX_UNCERTAINTY = 0.4  # Maximum allowed uncertainty (closer probs = more uncertain)
            
            # Calculate uncertainty (entropy-like measure)
            # If probabilities are similar (e.g., 55% vs 45%), model is uncertain
            prob_diff = abs(probabilities[0] - probabilities[1]) if len(probabilities) >= 2 else 1.0
            
            # Check 1: Low confidence
            if confidence < CONFIDENCE_THRESHOLD:
                return {
                    'success': False,
                    'error': 'Low Confidence Detection',
                    'message': f'Model confidence too low ({confidence:.1f}%). This may not be a pepper leaf, or the image quality is poor.',
                    'confidence': round(confidence, 1),
                    'validation_confidence': validation_confidence,
                    'probabilities': prob_dict,
                    'suggestion': 'Please ensure you are uploading a clear photo of a PEPPER plant leaf. Other plant species may not be recognized correctly.',
                    'detected_as': prediction
                }
            
            # Check 2: High uncertainty (probabilities too similar)
            if prob_diff < MAX_UNCERTAINTY:
                return {
                    'success': False,
                    'error': 'Uncertain Detection',
                    'message': f'Model is uncertain about this image. The probabilities are too close ({confidence:.1f}% vs {(100-confidence):.1f}%).',
                    'confidence': round(confidence, 1),
                    'validation_confidence': validation_confidence,
                    'probabilities': prob_dict,
                    'suggestion': 'This might not be a pepper leaf, or the image is unclear. Please upload a clear photo of a PEPPER plant leaf.',
                    'detected_as': prediction,
                    'probability_difference': round(prob_diff * 100, 1)
                }
            
            # Check 3: Validation confidence vs prediction confidence mismatch
            # If validation confidence is low but prediction confidence is high, suspicious
            if validation_confidence < 60 and confidence > 80:
                return {
                    'success': False,
                    'error': 'Suspicious Image',
                    'message': 'Image validation confidence is low, suggesting this may not be a typical plant photo.',
                    'confidence': round(confidence, 1),
                    'validation_confidence': validation_confidence,
                    'probabilities': prob_dict,
                    'suggestion': 'Please upload a clear, well-lit photo of a pepper plant leaf.',
                    'detected_as': prediction
                }
            
            # Get disease info
            disease_data = self.disease_info.get(prediction, {})
            
            return {
                'success': True,
                'prediction': prediction,
                'confidence': round(confidence, 1),
                'validation_confidence': validation_confidence,
                'probabilities': prob_dict,
                'disease_info': disease_data,
                'all_predictions': [
                    {
                        'disease': cls,
                        'probability': round(float(prob) * 100, 1)
                    }
                    for cls, prob in sorted(prob_dict.items(), key=lambda x: x[1], reverse=True)
                ]
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Prediction failed: {str(e)}'
            }
    
    def save_model(self):
        """Save trained model to disk"""
        try:
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            with open(self.model_path, 'wb') as f:
                pickle.dump({
                    'model': self.model,
                    'scaler': self.scaler,
                    'is_trained': self.is_trained
                }, f)
            return True
        except Exception as e:
            print(f"Error saving model: {str(e)}")
            return False
    
    def load_model(self):
        """Load trained model from disk"""
        try:
            if os.path.exists(self.model_path):
                with open(self.model_path, 'rb') as f:
                    data = pickle.load(f)
                    self.model = data['model']
                    self.scaler = data['scaler']
                    self.is_trained = data.get('is_trained', False)
                
                model_type = getattr(self, 'model_type', 'unknown')
                print(f"✅ Loaded {model_type} model from: {self.model_path}")
                return True
            else:
                self.is_trained = False
                return False
        except Exception as e:
            print(f"Error loading model: {str(e)}")
            self.is_trained = False
            return False


# CLI usage
if __name__ == '__main__':
    import sys
    
    detector = PlantDiseaseDetector()
    
    if len(sys.argv) > 1:
        action = sys.argv[1]
        
        if action == 'train':
            print("Training disease detection model...")
            result = detector.train()
            print(f"Training result: {result}")
        
        elif action == 'predict' and len(sys.argv) > 2:
            image_path = sys.argv[2]
            print(f"Analyzing image: {image_path}")
            result = detector.predict(image_path)
            
            if result['success']:
                print(f"\nPrediction: {result['prediction']}")
                print(f"Confidence: {result['confidence']}%")
                print(f"\nDisease Info:")
                print(f"  Name: {result['disease_info']['name']}")
                print(f"  Severity: {result['disease_info']['severity']}")
                print(f"  Description: {result['disease_info']['description']}")
            else:
                print(f"Error: {result['error']}")
        
        else:
            print("Usage:")
            print("  python disease_detector.py train")
            print("  python disease_detector.py predict <image_path>")
    else:
        print("Usage:")
        print("  python disease_detector.py train")
        print("  python disease_detector.py predict <image_path>")
