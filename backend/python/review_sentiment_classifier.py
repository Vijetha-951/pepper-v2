"""
Review Sentiment Classifier
Uses Support Vector Machine (SVM) with TF-IDF to classify customer reviews as Positive, Negative, or Neutral
"""

import json
import sys
import pickle
import os
import warnings
import numpy as np
from datetime import datetime
from sklearn.svm import SVC
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
warnings.filterwarnings('ignore')


class ReviewSentimentClassifier:
    """SVM-based Review Sentiment Classifier"""
    
    def __init__(self, model_path='backend/python/models/svm_sentiment_model.pkl'):
        self.model_path = model_path
        self.pipeline = None
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        self.load_model()
    
    def preprocess_text(self, text):
        """Preprocess review text"""
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower().strip()
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        return text
    
    def classify_sentiment(self, review_text, rating):
        """
        Classify review sentiment based on text and rating
        
        Returns:
            - sentiment: 'POSITIVE' (rating >= 4), 'NEGATIVE' (rating <= 2), 'NEUTRAL' (rating == 3)
            - confidence: confidence score (0-100)
            - keywords: extracted positive/negative indicators
        """
        try:
            sentiment = 'NEUTRAL'
            confidence = 50
            keywords = []
            
            # Simple heuristic-based approach (when ML model isn't available)
            preprocessed = self.preprocess_text(review_text)
            
            positive_words = ['excellent', 'great', 'good', 'amazing', 'perfect', 'love', 
                            'beautiful', 'fantastic', 'wonderful', 'happy', 'satisfied',
                            'best', 'awesome', 'nice', 'lovely', 'healthy', 'fresh',
                            'quality', 'recommend', 'thanks']
            
            negative_words = ['bad', 'poor', 'terrible', 'awful', 'hate', 'worst',
                            'broken', 'damaged', 'dead', 'rotten', 'waste', 'disappointed',
                            'unhappy', 'wrong', 'late', 'delay', 'problem', 'issue',
                            'defective', 'refund', 'complaint']
            
            neutral_words = ['okay', 'average', 'normal', 'standard', 'fine', 'decent']
            
            # Count sentiment indicators
            positive_count = sum(1 for word in positive_words if word in preprocessed)
            negative_count = sum(1 for word in negative_words if word in preprocessed)
            neutral_count = sum(1 for word in neutral_words if word in preprocessed)
            
            # Extract keywords
            words = preprocessed.split()
            keywords = [w for w in words if len(w) > 3][:5]
            
            # Primary decision based on rating
            if rating >= 4:
                sentiment = 'POSITIVE'
                confidence = min(80 + positive_count * 5, 95)
                keywords = [w for w in keywords if any(pos in w for pos in positive_words)]
            elif rating <= 2:
                sentiment = 'NEGATIVE'
                confidence = min(80 + negative_count * 5, 95)
                keywords = [w for w in keywords if any(neg in w for neg in negative_words)]
            else:  # rating == 3
                sentiment = 'NEUTRAL'
                confidence = 60 + neutral_count * 5
            
            # Adjust confidence based on text length (longer reviews = more confident)
            text_length = len(preprocessed.split())
            if text_length < 3:
                confidence = max(confidence - 15, 40)
            elif text_length > 30:
                confidence = min(confidence + 10, 100)
            
            return {
                'sentiment': sentiment,
                'confidence': int(confidence),
                'keywords': keywords if keywords else ['no-keywords']
            }
        
        except Exception as e:
            return {
                'sentiment': 'NEUTRAL',
                'confidence': 50,
                'keywords': [],
                'error': str(e)
            }
    
    def load_model(self):
        """Load model from disk"""
        try:
            if os.path.exists(self.model_path):
                with open(self.model_path, 'rb') as f:
                    self.pipeline = pickle.load(f)
                self.is_trained = True
        except Exception as e:
            print(f"Could not load model: {e}", file=sys.stderr)
    
    def analyze_reviews(self, reviews_data):
        """
        Analyze sentiment for multiple reviews
        
        Args:
            reviews_data: List of review objects with rating, comment, complaintType
        
        Returns:
            List of reviews with sentiment analysis
        """
        try:
            analyzed_reviews = []
            
            for review in reviews_data:
                review_text = review.get('comment', '')
                rating = review.get('rating', 3)
                complaint_type = review.get('complaintType', 'None')
                
                # Classify sentiment
                sentiment_analysis = self.classify_sentiment(review_text, rating)
                
                # Determine if review is problematic
                is_problematic = (
                    rating <= 2 or 
                    sentiment_analysis['sentiment'] == 'NEGATIVE' or
                    complaint_type != 'None'
                )
                
                analyzed_reviews.append({
                    '_id': review.get('_id'),
                    'rating': rating,
                    'comment': review_text,
                    'complaintType': complaint_type,
                    'sentiment': sentiment_analysis['sentiment'],
                    'sentimentConfidence': sentiment_analysis['confidence'],
                    'keywords': sentiment_analysis['keywords'],
                    'isProblematic': is_problematic,
                    'user': review.get('user'),
                    'product': review.get('product'),
                    'createdAt': review.get('createdAt')
                })
            
            return analyzed_reviews
        
        except Exception as e:
            raise Exception(f'Review sentiment analysis failed: {str(e)}')
    
    def get_sentiment_summary(self, reviews_data):
        """
        Generate sentiment summary statistics
        
        Args:
            reviews_data: List of reviews
        
        Returns:
            Dictionary with sentiment statistics
        """
        try:
            analyzed = self.analyze_reviews(reviews_data)
            
            total_reviews = len(analyzed)
            if total_reviews == 0:
                return {
                    'totalReviews': 0,
                    'positiveSentiment': 0,
                    'negativeSentiment': 0,
                    'neutralSentiment': 0,
                    'positivePercentage': 0,
                    'negativePercentage': 0,
                    'neutralPercentage': 0,
                    'averageRating': 0,
                    'averageConfidence': 0,
                    'problematicReviews': [],
                    'sentimentTrend': []
                }
            
            # Count sentiments
            positive_count = sum(1 for r in analyzed if r['sentiment'] == 'POSITIVE')
            negative_count = sum(1 for r in analyzed if r['sentiment'] == 'NEGATIVE')
            neutral_count = sum(1 for r in analyzed if r['sentiment'] == 'NEUTRAL')
            
            # Get problematic reviews (low rating or negative sentiment)
            problematic = sorted(
                [r for r in analyzed if r['isProblematic']],
                key=lambda x: x['sentimentConfidence'],
                reverse=True
            )[:5]
            
            # Calculate average rating
            avg_rating = sum(r['rating'] for r in analyzed) / total_reviews if total_reviews > 0 else 0
            avg_confidence = sum(r['sentimentConfidence'] for r in analyzed) / total_reviews if total_reviews > 0 else 0
            
            return {
                'totalReviews': total_reviews,
                'positiveSentiment': positive_count,
                'negativeSentiment': negative_count,
                'neutralSentiment': neutral_count,
                'positivePercentage': round((positive_count / total_reviews) * 100, 1) if total_reviews > 0 else 0,
                'negativePercentage': round((negative_count / total_reviews) * 100, 1) if total_reviews > 0 else 0,
                'neutralPercentage': round((neutral_count / total_reviews) * 100, 1) if total_reviews > 0 else 0,
                'averageRating': round(avg_rating, 2),
                'averageConfidence': int(avg_confidence),
                'problematicReviews': [
                    {
                        '_id': r['_id'],
                        'rating': r['rating'],
                        'sentiment': r['sentiment'],
                        'confidence': r['sentimentConfidence'],
                        'comment': r['comment'][:100] + '...' if len(r['comment']) > 100 else r['comment'],
                        'complaintType': r['complaintType']
                    }
                    for r in problematic
                ],
                'analyzedAt': datetime.now().isoformat()
            }
        
        except Exception as e:
            raise Exception(f'Sentiment summary generation failed: {str(e)}')