"""
Order Cancellation SVM Classifier
Uses Support Vector Machine with RBF kernel to predict order cancellation risk
"""

import json
import sys
import pickle
import os
from datetime import datetime, timedelta
import numpy as np
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import warnings
warnings.filterwarnings('ignore')


class CancellationSVMClassifier:
    """SVM-based Order Cancellation Risk Classifier"""
    
    def __init__(self, model_path='backend/python/models/svm_cancellation_model.pkl'):
        self.model_path = model_path
        self.scaler = StandardScaler()
        self.svm_model = None
        self.feature_names = [
            'is_cod',
            'past_cancellations',
            'order_amount',
            'delivery_days',
            'order_count',
            'account_age_days',
            'avg_order_value',
            'cancellation_rate'
        ]
        self.is_trained = False
        self.load_model()
    
    def extract_features(self, order, customer, customer_orders):
        """Extract 8 features from order and customer data"""
        try:
            # Feature 1: Payment Method (COD = 1, others = 0)
            payment_method = order.get('paymentMethod', '').upper()
            is_cod = 1 if payment_method == 'COD' else 0
            
            # Feature 2: Past Cancellations
            past_cancellations = sum(1 for o in customer_orders if o.get('status') == 'cancelled')
            
            # Feature 3: Order Amount
            order_amount = float(order.get('totalAmount', 0))
            
            # Feature 4: Expected Delivery Days (estimate: 2-7 days)
            # Based on order creation date
            created_at = order.get('createdAt')
            if isinstance(created_at, str):
                try:
                    order_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    delivery_date = order_date + timedelta(days=5)
                    today = datetime.now(delivery_date.tzinfo) if delivery_date.tzinfo else datetime.now()
                    delivery_days = max(0, (delivery_date - today).days)
                except:
                    delivery_days = 5
            else:
                delivery_days = 5
            
            # Feature 5: Total Order Count
            order_count = len(customer_orders) if customer_orders else 1
            
            # Feature 6: Account Age (in days)
            customer_created_at = customer.get('createdAt')
            if isinstance(customer_created_at, str):
                try:
                    account_date = datetime.fromisoformat(customer_created_at.replace('Z', '+00:00'))
                    today = datetime.now(account_date.tzinfo) if account_date.tzinfo else datetime.now()
                    account_age_days = (today - account_date).days
                except:
                    account_age_days = 0
            else:
                account_age_days = 0
            
            # Feature 7: Average Order Value
            if customer_orders and len(customer_orders) > 0:
                total_value = sum(o.get('totalAmount', 0) for o in customer_orders)
                avg_order_value = total_value / len(customer_orders)
            else:
                avg_order_value = order_amount
            
            # Feature 8: Cancellation Rate
            if order_count > 0:
                cancellation_rate = (past_cancellations / order_count) * 100
            else:
                cancellation_rate = 0
            
            features = np.array([
                is_cod,
                past_cancellations,
                order_amount,
                delivery_days,
                order_count,
                account_age_days,
                avg_order_value,
                cancellation_rate
            ]).reshape(1, -1)
            
            return features, {
                'is_cod': is_cod,
                'past_cancellations': past_cancellations,
                'order_amount': order_amount,
                'delivery_days': delivery_days,
                'order_count': order_count,
                'account_age_days': account_age_days,
                'avg_order_value': avg_order_value,
                'cancellation_rate': cancellation_rate
            }
            
        except Exception as e:
            print(f"Error extracting features: {str(e)}", file=sys.stderr)
            # Return zero features on error
            zero_features = np.zeros((1, len(self.feature_names)))
            return zero_features, {}
    
    def predict_risk(self, order, customer, customer_orders):
        """Predict cancellation risk for an order"""
        if not self.is_trained:
            return {
                'risk_level': 'UNKNOWN',
                'risk_score': 0,
                'probability': 0,
                'confidence': 0,
                'message': 'Model not trained yet. Please train the model first.',
                'features': {}
            }
        
        try:
            features, feature_dict = self.extract_features(order, customer, customer_orders)
            features_scaled = self.scaler.transform(features)
            
            # Get prediction
            prediction = self.svm_model.predict(features_scaled)[0]
            
            # Get decision score
            decision_score = self.svm_model.decision_function(features_scaled)[0]
            
            # Calculate probability (0-1 range)
            probability = 1 / (1 + np.exp(-decision_score))
            
            # Risk score (0-100)
            risk_score = probability * 100
            
            # Determine risk level
            if risk_score >= 70:
                risk_level = 'HIGH'
            elif risk_score >= 40:
                risk_level = 'MEDIUM'
            else:
                risk_level = 'LOW'
            
            # Confidence score
            confidence = int(abs(decision_score) * 10)
            confidence = min(100, max(0, confidence))
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                feature_dict, risk_level, order, customer
            )
            
            return {
                'risk_level': risk_level,
                'risk_score': round(risk_score, 1),
                'probability': round(probability, 3),
                'confidence': confidence,
                'recommendations': recommendations,
                'features': feature_dict
            }
            
        except Exception as e:
            print(f"Error in prediction: {str(e)}", file=sys.stderr)
            return {
                'risk_level': 'ERROR',
                'risk_score': 0,
                'probability': 0,
                'confidence': 0,
                'message': f'Prediction error: {str(e)}',
                'features': {}
            }
    
    def _generate_recommendations(self, features, risk_level, order, customer):
        """Generate actionable recommendations based on risk factors"""
        recommendations = []
        
        if risk_level == 'HIGH':
            recommendations.append('⚠️ HIGH RISK: Immediate action recommended')
            
            if features.get('is_cod') == 1:
                recommendations.append('💳 COD payment detected - higher cancellation risk')
            
            if features.get('past_cancellations', 0) >= 2:
                recommendations.append(f'📊 Customer has {features.get("past_cancellations", 0)} past cancellations')
            
            if features.get('cancellation_rate', 0) >= 30:
                recommendations.append(f'📈 Customer cancellation rate: {features.get("cancellation_rate", 0):.1f}%')
            
            recommendations.append('✅ Recommended: Send confirmation call, offer incentive, prioritize delivery')
        
        elif risk_level == 'MEDIUM':
            recommendations.append('⚠️ MEDIUM RISK: Monitor this order')
            
            if features.get('order_amount', 0) > 5000:
                recommendations.append('💰 High order value - track closely')
            
            recommendations.append('✅ Recommended: Confirm delivery address, track order status')
        
        else:  # LOW
            recommendations.append('✅ LOW RISK: Order appears healthy')
            recommendations.append('📊 Standard processing recommended')
        
        return recommendations
    
    def train(self, training_data):
        """Train SVM model with historical data"""
        try:
            X = []
            y = []
            
            for item in training_data:
                order = item.get('order', {})
                customer = item.get('customer', {})
                customer_orders = item.get('customer_orders', [])
                label = 1 if order.get('status') == 'cancelled' else 0
                
                features, _ = self.extract_features(order, customer, customer_orders)
                X.append(features[0])
                y.append(label)
            
            X = np.array(X)
            y = np.array(y)
            
            # Fit scaler
            X_scaled = self.scaler.fit_transform(X)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y, test_size=0.2, random_state=42
            )
            
            # Train SVM
            self.svm_model = SVC(
                kernel='rbf',
                C=1.0,
                gamma='scale',
                probability=True,
                random_state=42
            )
            self.svm_model.fit(X_train, y_train)
            
            # Evaluate
            y_pred = self.svm_model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred, zero_division=0)
            recall = recall_score(y_test, y_pred, zero_division=0)
            f1 = f1_score(y_test, y_pred, zero_division=0)
            
            self.is_trained = True
            
            # Save model
            self.save_model()
            
            return {
                'success': True,
                'message': 'Model trained successfully',
                'metrics': {
                    'accuracy': round(accuracy, 3),
                    'precision': round(precision, 3),
                    'recall': round(recall, 3),
                    'f1_score': round(f1, 3),
                    'training_samples': len(X_train),
                    'test_samples': len(X_test)
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': f'Training failed: {str(e)}'
            }
    
    def save_model(self):
        """Save trained model to disk"""
        try:
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            with open(self.model_path, 'wb') as f:
                pickle.dump({
                    'svm_model': self.svm_model,
                    'scaler': self.scaler,
                    'feature_names': self.feature_names,
                    'is_trained': self.is_trained
                }, f)
            return True
        except Exception as e:
            print(f"Error saving model: {str(e)}", file=sys.stderr)
            return False
    
    def load_model(self):
        """Load trained model from disk"""
        try:
            if os.path.exists(self.model_path):
                with open(self.model_path, 'rb') as f:
                    data = pickle.load(f)
                    self.svm_model = data.get('svm_model')
                    self.scaler = data.get('scaler')
                    self.is_trained = data.get('is_trained', False)
            else:
                self.is_trained = False
        except Exception as e:
            print(f"Error loading model: {str(e)}", file=sys.stderr)
            self.is_trained = False


def main():
    """Main entry point for command-line usage"""
    if len(sys.argv) < 2:
        print("Usage: python cancellation_svm_classifier.py <action> [data]")
        print("Actions: predict, train, test")
        sys.exit(1)
    
    action = sys.argv[1]
    classifier = CancellationSVMClassifier()
    
    if action == 'predict' and len(sys.argv) > 2:
        data = json.loads(sys.argv[2])
        result = classifier.predict_risk(
            data.get('order', {}),
            data.get('customer', {}),
            data.get('customer_orders', [])
        )
        print(json.dumps(result))
    
    elif action == 'train' and len(sys.argv) > 2:
        data = json.loads(sys.argv[2])
        result = classifier.train(data)
        print(json.dumps(result))
    
    elif action == 'test':
        # Test with sample data
        sample_order = {
            'totalAmount': 5000,
            'paymentMethod': 'COD',
            'status': 'pending',
            'createdAt': datetime.now().isoformat() + 'Z'
        }
        sample_customer = {
            'createdAt': (datetime.now() - timedelta(days=30)).isoformat() + 'Z'
        }
        sample_orders = [
            {'status': 'completed', 'totalAmount': 3000},
            {'status': 'cancelled', 'totalAmount': 2000}
        ]
        
        result = classifier.predict_risk(sample_order, sample_customer, sample_orders)
        print(json.dumps(result, indent=2))
    
    else:
        print("Invalid action or missing data")
        sys.exit(1)


if __name__ == '__main__':
    main()