"""
Pepper Yield Prediction ML Model
Predicts pepper yield and soil suitability using supervised learning
"""

import numpy as np
import pandas as pd
import pickle
import os
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_squared_error, r2_score, accuracy_score, classification_report

class PepperYieldPredictor:
    """
    ML model for predicting pepper yield and providing cultivation recommendations
    """
    
    def __init__(self):
        self.yield_model = None  # Regression model for yield prediction
        self.suitability_model = None  # Classification model for soil suitability
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = []
        self.models_dir = os.path.join(os.path.dirname(__file__), 'models')
        
        # Create models directory if it doesn't exist
        os.makedirs(self.models_dir, exist_ok=True)
    
    def prepare_features(self, data, is_training=True):
        """
        Convert categorical features to numeric and scale
        """
        df = data.copy()
        
        # Define categorical columns
        categorical_cols = ['soil_type', 'water_availability', 'crop_stage', 'region']
        
        # Encode categorical variables
        for col in categorical_cols:
            if col in df.columns:
                if is_training:
                    self.label_encoders[col] = LabelEncoder()
                    df[f'{col}_encoded'] = self.label_encoders[col].fit_transform(df[col])
                else:
                    if col in self.label_encoders:
                        df[f'{col}_encoded'] = self.label_encoders[col].transform(df[col])
        
        # Create derived features
        df['irrigation_efficiency'] = df['irrigation_frequency'] * df['water_availability_encoded']
        df['soil_water_interaction'] = df['soil_type_encoded'] * df['water_availability_encoded']
        
        # Select numeric features for model
        feature_cols = [
            'soil_type_encoded', 'water_availability_encoded', 
            'irrigation_frequency', 'crop_stage_encoded',
            'temperature', 'rainfall', 'humidity',
            'ph_level', 'nitrogen_level', 'phosphorus_level', 'potassium_level',
            'irrigation_efficiency', 'soil_water_interaction'
        ]
        
        # Filter only existing columns
        feature_cols = [col for col in feature_cols if col in df.columns]
        
        if is_training:
            self.feature_columns = feature_cols
        
        X = df[feature_cols]
        
        return X
    
    def train(self, data_path):
        """
        Train both yield prediction and soil suitability models
        """
        print("Loading training data...")
        df = pd.read_csv(data_path)
        
        print(f"Dataset shape: {df.shape}")
        print(f"Features: {df.columns.tolist()}")
        
        # Prepare features
        X = self.prepare_features(df, is_training=True)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train yield prediction model (Regression)
        print("\n=== Training Yield Prediction Model (Regression) ===")
        y_yield = df['yield_kg_per_plant']
        
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y_yield, test_size=0.2, random_state=42
        )
        
        self.yield_model = RandomForestRegressor(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        
        self.yield_model.fit(X_train, y_train)
        
        # Evaluate yield model
        y_pred = self.yield_model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"Yield Model - MSE: {mse:.4f}, R²: {r2:.4f}")
        print(f"Yield Model - RMSE: {np.sqrt(mse):.4f}")
        
        # Cross-validation
        cv_scores = cross_val_score(self.yield_model, X_scaled, y_yield, cv=5, 
                                    scoring='neg_mean_squared_error')
        print(f"Cross-validation RMSE: {np.sqrt(-cv_scores.mean()):.4f} (+/- {np.sqrt(cv_scores.std()):.4f})")
        
        # Train soil suitability model (Classification)
        print("\n=== Training Soil Suitability Model (Classification) ===")
        y_suitability = df['soil_suitability']
        
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y_suitability, test_size=0.2, random_state=42, stratify=y_suitability
        )
        
        self.suitability_model = RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
            class_weight='balanced'
        )
        
        self.suitability_model.fit(X_train, y_train)
        
        # Evaluate suitability model
        y_pred = self.suitability_model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"Suitability Model - Accuracy: {accuracy:.4f}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))
        
        # Feature importance
        print("\n=== Feature Importance (Top 10) ===")
        feature_importance = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': self.yield_model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print(feature_importance.head(10))
        
        # Save models
        self.save_models()
        
        print("\n✓ Training completed successfully!")
        return {
            'yield_mse': mse,
            'yield_r2': r2,
            'suitability_accuracy': accuracy
        }
    
    def predict(self, input_data):
        """
        Make predictions for new data
        Input: dict or DataFrame with required features
        """
        # Convert dict to DataFrame if necessary
        if isinstance(input_data, dict):
            df = pd.DataFrame([input_data])
        else:
            df = input_data.copy()
        
        # Add derived environmental features if not present
        df = self._enrich_input_data(df)
        
        # Prepare features
        X = self.prepare_features(df, is_training=False)
        X_scaled = self.scaler.transform(X)
        
        # Predict yield
        yield_pred = self.yield_model.predict(X_scaled)[0]
        
        # Predict soil suitability
        suitability_pred = self.suitability_model.predict(X_scaled)[0]
        suitability_proba = self.suitability_model.predict_proba(X_scaled)[0]
        
        # Get suitability confidence
        suitability_confidence = max(suitability_proba) * 100
        
        # Generate recommendations
        recommendations = self._generate_recommendations(df.iloc[0], yield_pred, suitability_pred)
        
        return {
            'predicted_yield_kg': round(yield_pred, 2),
            'soil_suitability': suitability_pred,
            'suitability_confidence': round(suitability_confidence, 2),
            'irrigation_recommendation': recommendations['irrigation'],
            'fertilizer_recommendation': recommendations['fertilizer'],
            'additional_tips': recommendations['tips']
        }
    
    def _enrich_input_data(self, df):
        """
        Add derived environmental features based on location and inputs
        This simulates looking up environmental data
        """
        # Default environmental parameters (would be region-specific in production)
        if 'temperature' not in df.columns:
            df['temperature'] = 28.0  # Celsius
        if 'rainfall' not in df.columns:
            df['rainfall'] = 2000.0  # mm/year
        if 'humidity' not in df.columns:
            df['humidity'] = 75.0  # percentage
        
        # Soil parameters based on soil type
        if 'ph_level' not in df.columns:
            soil_ph_map = {'Sandy': 6.0, 'Loamy': 6.5, 'Clay': 7.0}
            df['ph_level'] = df['soil_type'].map(soil_ph_map).fillna(6.5)
        
        # Default NPK levels (would be soil-test based in production)
        if 'nitrogen_level' not in df.columns:
            df['nitrogen_level'] = 50.0
        if 'phosphorus_level' not in df.columns:
            df['phosphorus_level'] = 30.0
        if 'potassium_level' not in df.columns:
            df['potassium_level'] = 40.0
        
        # Add region if not present
        if 'region' not in df.columns:
            df['region'] = 'Kerala'
        
        return df
    
    def _generate_recommendations(self, input_row, yield_pred, suitability):
        """
        Generate cultivation recommendations based on predictions and input
        """
        recommendations = {
            'irrigation': '',
            'fertilizer': '',
            'tips': []
        }
        
        # Irrigation recommendations
        water_avail = input_row['water_availability']
        irrigation_freq = input_row['irrigation_frequency']
        
        if water_avail == 'Low':
            recommendations['irrigation'] = 'Install drip irrigation. Water 4-5 times per week during dry season.'
        elif water_avail == 'Medium':
            recommendations['irrigation'] = 'Maintain consistent watering. 3-4 times per week is optimal.'
        else:
            recommendations['irrigation'] = 'Good water availability. Ensure proper drainage. Water 2-3 times per week.'
        
        if irrigation_freq < 3:
            recommendations['tips'].append('Increase irrigation frequency for better yield')
        
        # Fertilizer recommendations based on crop stage
        crop_stage = input_row['crop_stage']
        
        if crop_stage == 'Seedling':
            recommendations['fertilizer'] = 'NPK 19:19:19 @ 2g/plant weekly. Focus on nitrogen for vegetative growth.'
        elif crop_stage == 'Vegetative':
            recommendations['fertilizer'] = 'NPK 19:19:19 @ 5g/plant weekly. Add organic compost monthly.'
        elif crop_stage == 'Flowering':
            recommendations['fertilizer'] = 'NPK 13:40:13 @ 5g/plant weekly. Increase phosphorus for flowering.'
        else:  # Fruiting
            recommendations['fertilizer'] = 'NPK 13:00:45 @ 7g/plant weekly. High potassium for fruit development.'
        
        # Soil-specific tips
        soil_type = input_row['soil_type']
        
        if soil_type == 'Sandy':
            recommendations['tips'].append('Sandy soil drains quickly - increase organic matter and irrigation frequency')
        elif soil_type == 'Clay':
            recommendations['tips'].append('Clay soil retains water - ensure good drainage and avoid overwatering')
        else:
            recommendations['tips'].append('Loamy soil is ideal for pepper cultivation')
        
        # Suitability-based tips
        if suitability == 'Low':
            recommendations['tips'].append('Soil suitability is low - consider soil amendment and pH adjustment')
        elif suitability == 'Medium':
            recommendations['tips'].append('Moderate conditions - optimize water and fertilizer for better results')
        else:
            recommendations['tips'].append('Excellent conditions for pepper cultivation!')
        
        # Yield-based tips
        if yield_pred < 0.5:
            recommendations['tips'].append('Expected yield is low - review soil health and irrigation practices')
        elif yield_pred > 1.5:
            recommendations['tips'].append('Conditions are favorable for high yield - maintain current practices')
        
        return recommendations
    
    def save_models(self):
        """
        Save trained models and preprocessors
        """
        model_files = {
            'yield_model.pkl': self.yield_model,
            'suitability_model.pkl': self.suitability_model,
            'scaler.pkl': self.scaler,
            'label_encoders.pkl': self.label_encoders,
            'feature_columns.pkl': self.feature_columns
        }
        
        for filename, obj in model_files.items():
            filepath = os.path.join(self.models_dir, filename)
            with open(filepath, 'wb') as f:
                pickle.dump(obj, f)
        
        print(f"Models saved to {self.models_dir}")
    
    def load_models(self):
        """
        Load pre-trained models
        """
        try:
            model_files = {
                'yield_model.pkl': 'yield_model',
                'suitability_model.pkl': 'suitability_model',
                'scaler.pkl': 'scaler',
                'label_encoders.pkl': 'label_encoders',
                'feature_columns.pkl': 'feature_columns'
            }
            
            for filename, attr in model_files.items():
                filepath = os.path.join(self.models_dir, filename)
                with open(filepath, 'rb') as f:
                    setattr(self, attr, pickle.load(f))
            
            print("Models loaded successfully")
            return True
        except FileNotFoundError:
            print("Model files not found. Please train the model first.")
            return False


if __name__ == "__main__":
    # Example usage
    predictor = PepperYieldPredictor()
    
    # Train models
    print("Training models...")
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'pepper_training_data.csv')
    
    if os.path.exists(data_path):
        predictor.train(data_path)
        
        # Test prediction
        print("\n=== Testing Prediction ===")
        test_input = {
            'soil_type': 'Loamy',
            'water_availability': 'High',
            'irrigation_frequency': 4,
            'crop_stage': 'Fruiting'
        }
        
        result = predictor.predict(test_input)
        print("\nPrediction Result:")
        print(f"Predicted Yield: {result['predicted_yield_kg']} kg/plant")
        print(f"Soil Suitability: {result['soil_suitability']} ({result['suitability_confidence']}% confidence)")
        print(f"Irrigation: {result['irrigation_recommendation']}")
        print(f"Fertilizer: {result['fertilizer_recommendation']}")
        print(f"Tips: {', '.join(result['additional_tips'])}")
    else:
        print(f"Training data not found at {data_path}")
        print("Please run generate_pepper_training_data.py first")
