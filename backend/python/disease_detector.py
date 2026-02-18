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
        self.model_path = model_path
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
            # Extract features
            features = self.extract_features(image_path)
            features_scaled = self.scaler.transform(features.reshape(1, -1))
            
            # Predict
            prediction = self.model.predict(features_scaled)[0]
            probabilities = self.model.predict_proba(features_scaled)[0]
            
            # Get class names
            classes = self.model.classes_
            
            # Create probability dict
            prob_dict = {cls: float(prob) for cls, prob in zip(classes, probabilities)}
            
            # Get confidence
            confidence = float(max(probabilities)) * 100
            
            # Get disease info
            disease_data = self.disease_info.get(prediction, {})
            
            return {
                'success': True,
                'prediction': prediction,
                'confidence': round(confidence, 1),
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
