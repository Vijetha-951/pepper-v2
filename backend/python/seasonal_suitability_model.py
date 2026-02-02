"""
Seasonal Suitability ML Model Trainer
Trains Random Forest classifier for pepper variety seasonal suitability prediction
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
import os
import json
from datetime import datetime


class SeasonalSuitabilityModel:
    """ML Model for predicting pepper variety seasonal suitability"""
    
    def __init__(self):
        self.model = None
        self.label_encoders = {}
        self.feature_columns = None
        self.target_column = 'suitability'
        self.model_dir = os.path.join(os.path.dirname(__file__), 'models')
        self.metrics = {}
        
        # Create models directory if it doesn't exist
        os.makedirs(self.model_dir, exist_ok=True)
    
    def load_dataset(self, filepath='seasonal_suitability_training_data.csv'):
        """Load training dataset"""
        full_path = os.path.join(os.path.dirname(__file__), filepath)
        
        if not os.path.exists(full_path):
            raise FileNotFoundError(
                f"Dataset not found at {full_path}. "
                "Run seasonal_suitability_dataset.py first to generate data."
            )
        
        self.df = pd.read_csv(full_path)
        print(f"Dataset loaded: {self.df.shape}")
        print(f"Columns: {list(self.df.columns)}")
        print(f"\nClass distribution:")
        print(self.df[self.target_column].value_counts())
        return self.df
    
    def preprocess_data(self):
        """Preprocess and encode features"""
        print("\n" + "="*60)
        print("Preprocessing Data")
        print("="*60)
        
        # Define categorical and numerical features
        categorical_features = ['district', 'variety', 'water_availability']
        numerical_features = ['month', 'pincode', 'temperature', 'rainfall', 'humidity']
        
        # Store original data for reference
        self.raw_data = self.df.copy()
        
        # Encode categorical features
        for col in categorical_features:
            le = LabelEncoder()
            self.df[col + '_encoded'] = le.fit_transform(self.df[col])
            self.label_encoders[col] = le
            print(f"Encoded {col}: {len(le.classes_)} unique values")
        
        # Encode target variable
        le_target = LabelEncoder()
        self.df['suitability_encoded'] = le_target.fit_transform(self.df[self.target_column])
        self.label_encoders['suitability'] = le_target
        print(f"Encoded {self.target_column}: {le_target.classes_}")
        
        # Define feature columns for model training
        self.feature_columns = numerical_features + [f"{col}_encoded" for col in categorical_features]
        
        print(f"\nFeature columns for training: {self.feature_columns}")
        print(f"Total features: {len(self.feature_columns)}")
        
        return self.df
    
    def train_model(self, model_type='random_forest', test_size=0.2, optimize=True):
        """Train ML model"""
        print("\n" + "="*60)
        print(f"Training {model_type.upper()} Model")
        print("="*60)
        
        # Prepare features and target
        X = self.df[self.feature_columns]
        y = self.df['suitability_encoded']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
        
        print(f"\nTraining set size: {len(X_train)}")
        print(f"Test set size: {len(X_test)}")
        
        # Train model based on type
        if model_type == 'random_forest':
            if optimize:
                print("\nPerforming hyperparameter optimization...")
                self.model = self._train_optimized_random_forest(X_train, y_train)
            else:
                self.model = RandomForestClassifier(
                    n_estimators=100,
                    max_depth=15,
                    min_samples_split=10,
                    min_samples_leaf=5,
                    random_state=42,
                    n_jobs=-1
                )
                self.model.fit(X_train, y_train)
                
        elif model_type == 'decision_tree':
            if optimize:
                print("\nPerforming hyperparameter optimization...")
                self.model = self._train_optimized_decision_tree(X_train, y_train)
            else:
                self.model = DecisionTreeClassifier(
                    max_depth=10,
                    min_samples_split=20,
                    min_samples_leaf=10,
                    random_state=42
                )
                self.model.fit(X_train, y_train)
        else:
            raise ValueError(f"Unknown model type: {model_type}")
        
        # Evaluate model
        print("\n" + "="*60)
        print("Model Evaluation")
        print("="*60)
        
        # Training accuracy
        train_pred = self.model.predict(X_train)
        train_accuracy = accuracy_score(y_train, train_pred)
        print(f"\nTraining Accuracy: {train_accuracy:.4f}")
        
        # Test accuracy
        y_pred = self.model.predict(X_test)
        test_accuracy = accuracy_score(y_test, y_pred)
        print(f"Test Accuracy: {test_accuracy:.4f}")
        
        # Cross-validation
        cv_scores = cross_val_score(self.model, X_train, y_train, cv=5)
        print(f"\nCross-validation scores: {cv_scores}")
        print(f"CV Mean: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
        
        # Classification report
        print("\n" + "="*60)
        print("Classification Report")
        print("="*60)
        target_names = self.label_encoders['suitability'].classes_
        print(classification_report(y_test, y_pred, target_names=target_names))
        
        # Confusion matrix
        print("Confusion Matrix:")
        cm = confusion_matrix(y_test, y_pred)
        print(cm)
        
        # Feature importance
        if hasattr(self.model, 'feature_importances_'):
            print("\n" + "="*60)
            print("Feature Importance")
            print("="*60)
            feature_importance = pd.DataFrame({
                'feature': self.feature_columns,
                'importance': self.model.feature_importances_
            }).sort_values('importance', ascending=False)
            print(feature_importance)
        
        # Store metrics
        self.metrics = {
            'model_type': model_type,
            'train_accuracy': float(train_accuracy),
            'test_accuracy': float(test_accuracy),
            'cv_mean': float(cv_scores.mean()),
            'cv_std': float(cv_scores.std()),
            'training_date': datetime.now().isoformat(),
            'n_samples': len(self.df),
            'n_features': len(self.feature_columns),
            'classes': target_names.tolist()
        }
        
        return self.model
    
    def _train_optimized_random_forest(self, X_train, y_train):
        """Train Random Forest with hyperparameter optimization"""
        param_grid = {
            'n_estimators': [50, 100, 150],
            'max_depth': [10, 15, 20, None],
            'min_samples_split': [5, 10, 20],
            'min_samples_leaf': [2, 5, 10]
        }
        
        rf = RandomForestClassifier(random_state=42, n_jobs=-1)
        grid_search = GridSearchCV(
            rf, param_grid, cv=3, scoring='accuracy', 
            verbose=1, n_jobs=-1
        )
        grid_search.fit(X_train, y_train)
        
        print(f"\nBest parameters: {grid_search.best_params_}")
        print(f"Best CV score: {grid_search.best_score_:.4f}")
        
        return grid_search.best_estimator_
    
    def _train_optimized_decision_tree(self, X_train, y_train):
        """Train Decision Tree with hyperparameter optimization"""
        param_grid = {
            'max_depth': [5, 10, 15, 20, None],
            'min_samples_split': [10, 20, 50],
            'min_samples_leaf': [5, 10, 20]
        }
        
        dt = DecisionTreeClassifier(random_state=42)
        grid_search = GridSearchCV(
            dt, param_grid, cv=3, scoring='accuracy',
            verbose=1, n_jobs=-1
        )
        grid_search.fit(X_train, y_train)
        
        print(f"\nBest parameters: {grid_search.best_params_}")
        print(f"Best CV score: {grid_search.best_score_:.4f}")
        
        return grid_search.best_estimator_
    
    def save_model(self, model_name='seasonal_suitability_model'):
        """Save trained model and encoders"""
        if self.model is None:
            raise ValueError("No model trained. Call train_model() first.")
        
        # Save model
        model_path = os.path.join(self.model_dir, f'{model_name}.pkl')
        joblib.dump(self.model, model_path)
        print(f"\nModel saved to: {model_path}")
        
        # Save label encoders
        encoders_path = os.path.join(self.model_dir, f'{model_name}_encoders.pkl')
        joblib.dump(self.label_encoders, encoders_path)
        print(f"Encoders saved to: {encoders_path}")
        
        # Save feature columns
        features_path = os.path.join(self.model_dir, f'{model_name}_features.json')
        with open(features_path, 'w') as f:
            json.dump({
                'feature_columns': self.feature_columns,
                'target_column': self.target_column
            }, f, indent=2)
        print(f"Features saved to: {features_path}")
        
        # Save metrics
        metrics_path = os.path.join(self.model_dir, f'{model_name}_metrics.json')
        with open(metrics_path, 'w') as f:
            json.dump(self.metrics, f, indent=2)
        print(f"Metrics saved to: {metrics_path}")
        
        return True
    
    def load_model(self, model_name='seasonal_suitability_model'):
        """Load trained model and encoders"""
        model_path = os.path.join(self.model_dir, f'{model_name}.pkl')
        encoders_path = os.path.join(self.model_dir, f'{model_name}_encoders.pkl')
        features_path = os.path.join(self.model_dir, f'{model_name}_features.json')
        
        if not os.path.exists(model_path):
            return False
        
        self.model = joblib.load(model_path)
        self.label_encoders = joblib.load(encoders_path)
        
        with open(features_path, 'r') as f:
            feature_data = json.load(f)
            self.feature_columns = feature_data['feature_columns']
            self.target_column = feature_data['target_column']
        
        print(f"Model loaded from: {model_path}")
        return True
    
    def predict(self, input_data):
        """
        Make prediction for new data
        
        Args:
            input_data: dict with keys: month, district, pincode, variety,
                       temperature, rainfall, humidity, water_availability
        
        Returns:
            dict with prediction and confidence scores
        """
        if self.model is None:
            raise ValueError("No model loaded. Call load_model() or train_model() first.")
        
        # Encode categorical features
        encoded_data = input_data.copy()
        for col in ['district', 'variety', 'water_availability']:
            if col in self.label_encoders:
                try:
                    encoded_data[col + '_encoded'] = self.label_encoders[col].transform([input_data[col]])[0]
                except ValueError:
                    # Handle unknown categories with fallback
                    print(f"Warning: Unknown {col} '{input_data[col]}', using default")
                    encoded_data[col + '_encoded'] = 0
        
        # Prepare feature vector
        feature_vector = []
        for col in self.feature_columns:
            if col.endswith('_encoded'):
                feature_vector.append(encoded_data[col])
            else:
                feature_vector.append(input_data[col])
        
        # Make prediction
        X = np.array([feature_vector])
        prediction_encoded = self.model.predict(X)[0]
        prediction_proba = self.model.predict_proba(X)[0]
        
        # Decode prediction
        prediction = self.label_encoders['suitability'].inverse_transform([prediction_encoded])[0]
        
        # Get confidence scores for all classes
        classes = self.label_encoders['suitability'].classes_
        confidence_scores = {
            classes[i]: float(prediction_proba[i])
            for i in range(len(classes))
        }
        
        return {
            'prediction': prediction,
            'confidence': float(max(prediction_proba)),
            'confidence_scores': confidence_scores
        }


def main():
    """Main training pipeline"""
    print("="*60)
    print("Seasonal Suitability Model Training Pipeline")
    print("="*60)
    
    # Initialize model
    model = SeasonalSuitabilityModel()
    
    # Load dataset
    try:
        model.load_dataset()
    except FileNotFoundError as e:
        print(f"\nError: {e}")
        print("\nGenerating dataset first...")
        from seasonal_suitability_dataset import SeasonalSuitabilityDataGenerator
        generator = SeasonalSuitabilityDataGenerator()
        generator.generate_dataset(samples_per_combination=5)
        generator.save_dataset()
        model.load_dataset()
    
    # Preprocess data
    model.preprocess_data()
    
    # Train Random Forest model (default, better for this use case)
    print("\n" + "="*60)
    print("Training Random Forest Classifier")
    print("="*60)
    model.train_model(model_type='random_forest', optimize=False)
    
    # Save model
    model.save_model()
    
    # Test prediction
    print("\n" + "="*60)
    print("Testing Prediction")
    print("="*60)
    
    test_input = {
        'month': 7,  # July (peak planting season)
        'district': 'Idukki',
        'pincode': 685501,
        'variety': 'Panniyur 5',
        'temperature': 24.5,
        'rainfall': 320.0,
        'humidity': 82.0,
        'water_availability': 'High'
    }
    
    print(f"\nTest input: {test_input}")
    result = model.predict(test_input)
    print(f"\nPrediction: {result['prediction']}")
    print(f"Confidence: {result['confidence']:.4f}")
    print(f"All confidence scores: {result['confidence_scores']}")
    
    print("\n" + "="*60)
    print("Training Complete!")
    print("="*60)


if __name__ == '__main__':
    main()
