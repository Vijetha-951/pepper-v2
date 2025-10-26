import json
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import math

class BayesianCustomerSegmenter:
    """
    Bayesian Classifier for Customer Segmentation
    Segments customers into: New, Regular, Loyal, Inactive
    Based on: order frequency, total spend, activity level
    """
    
    def __init__(self):
        self.segments = ['New', 'Regular', 'Loyal', 'Inactive']
        self.priors = {
            'New': 0.25,
            'Regular': 0.40,
            'Loyal': 0.25,
            'Inactive': 0.10
        }
        
    def calculate_customer_metrics(self, customer_data: Dict) -> Dict:
        """Calculate metrics from customer data"""
        orders = customer_data.get('orders', [])
        
        if not orders:
            return {
                'order_count': 0,
                'total_spend': 0,
                'order_frequency_per_month': 0,
                'avg_order_value': 0,
                'days_since_last_order': 999999,
                'account_age_days': (datetime.now() - datetime.fromisoformat(customer_data.get('createdAt', datetime.now().isoformat()).replace('Z', '+00:00')).replace(tzinfo=None)).days
            }
        
        account_created = datetime.fromisoformat(customer_data.get('createdAt', datetime.now().isoformat()).replace('Z', '+00:00'))
        account_age_days = (datetime.now() - account_created.replace(tzinfo=None)).days + 1
        
        total_spend = sum(order.get('totalAmount', 0) for order in orders)
        order_count = len(orders)
        avg_order_value = total_spend / order_count if order_count > 0 else 0
        
        last_order_date = max(
            datetime.fromisoformat(order.get('createdAt', datetime.now().isoformat()).replace('Z', '+00:00')).replace(tzinfo=None)
            for order in orders
        )
        days_since_last_order = (datetime.now() - last_order_date).days
        
        order_frequency_per_month = (order_count * 30) / account_age_days if account_age_days > 0 else 0
        
        return {
            'order_count': order_count,
            'total_spend': total_spend,
            'order_frequency_per_month': order_frequency_per_month,
            'avg_order_value': avg_order_value,
            'days_since_last_order': days_since_last_order,
            'account_age_days': account_age_days
        }
    
    def calculate_likelihoods(self, metrics: Dict) -> Dict[str, float]:
        """Calculate likelihood probabilities for each segment"""
        likelihoods = {}
        
        order_freq = metrics['order_frequency_per_month']
        total_spend = metrics['total_spend']
        days_since_order = metrics['days_since_last_order']
        account_age = metrics['account_age_days']
        
        min_spend_threshold = 500
        max_spend_threshold = 5000
        
        for segment in self.segments:
            if segment == 'Inactive':
                likelihood = self._calculate_inactive_likelihood(
                    order_freq, total_spend, days_since_order
                )
            elif segment == 'Loyal':
                likelihood = self._calculate_loyal_likelihood(
                    order_freq, total_spend, avg_order_value=metrics['avg_order_value']
                )
            elif segment == 'Regular':
                likelihood = self._calculate_regular_likelihood(
                    order_freq, total_spend, days_since_order
                )
            else:  # New
                likelihood = self._calculate_new_likelihood(
                    order_freq, total_spend, account_age, days_since_order
                )
            
            likelihoods[segment] = max(0.001, likelihood)
        
        return likelihoods
    
    def _calculate_inactive_likelihood(self, order_freq: float, total_spend: float, days_since_order: int) -> float:
        """Likelihood of being Inactive"""
        if order_freq < 0.2 and total_spend < 500:
            return 0.95
        elif days_since_order > 90:
            return 0.80
        elif order_freq < 0.5 and days_since_order > 60:
            return 0.70
        else:
            return 0.05
    
    def _calculate_loyal_likelihood(self, order_freq: float, total_spend: float, avg_order_value: float) -> float:
        """Likelihood of being Loyal"""
        score = 0.0
        
        if order_freq >= 3:
            score += 0.35
        elif order_freq >= 2:
            score += 0.20
        
        if total_spend > 5000:
            score += 0.40
        elif total_spend > 2000:
            score += 0.25
        
        if avg_order_value > 1000:
            score += 0.25
        elif avg_order_value > 500:
            score += 0.10
        
        return min(0.95, score)
    
    def _calculate_regular_likelihood(self, order_freq: float, total_spend: float, days_since_order: int) -> float:
        """Likelihood of being Regular"""
        score = 0.0
        
        if 1 <= order_freq < 3:
            score += 0.40
        elif order_freq >= 3:
            score += 0.20
        
        if 500 <= total_spend < 2000:
            score += 0.35
        elif total_spend >= 2000:
            score += 0.20
        
        if days_since_order < 60:
            score += 0.25
        elif days_since_order < 90:
            score += 0.10
        
        return min(0.90, score)
    
    def _calculate_new_likelihood(self, order_freq: float, total_spend: float, account_age: int, days_since_order: int) -> float:
        """Likelihood of being New"""
        if account_age < 30 and order_freq > 0:
            return 0.85
        elif account_age < 30 and order_freq == 0:
            return 0.70
        elif account_age < 60 and order_freq < 0.5:
            return 0.50
        elif total_spend < 1000 and order_freq < 1:
            return 0.35
        else:
            return 0.05
    
    def classify(self, customer_data: Dict) -> Tuple[str, Dict]:
        """Classify customer into a segment using Bayesian inference"""
        metrics = self.calculate_customer_metrics(customer_data)
        likelihoods = self.calculate_likelihoods(metrics)
        
        posteriors = {}
        for segment in self.segments:
            posterior = self.priors[segment] * likelihoods[segment]
            posteriors[segment] = posterior
        
        total = sum(posteriors.values())
        for segment in posteriors:
            posteriors[segment] = posteriors[segment] / total if total > 0 else 0
        
        predicted_segment = max(posteriors, key=posteriors.get)
        confidence = posteriors[predicted_segment]
        
        return predicted_segment, {
            'segment': predicted_segment,
            'confidence': round(confidence, 4),
            'posteriors': {k: round(v, 4) for k, v in posteriors.items()},
            'metrics': metrics
        }


def segment_customers(customers_data: List[Dict]) -> List[Dict]:
    """Segment a list of customers"""
    segmenter = BayesianCustomerSegmenter()
    results = []
    
    for customer in customers_data:
        segment, details = segmenter.classify(customer)
        results.append({
            '_id': customer.get('_id'),
            'email': customer.get('email'),
            'firstName': customer.get('firstName'),
            'lastName': customer.get('lastName'),
            **details
        })
    
    return results


def get_segment_summary(results: List[Dict]) -> Dict:
    """Get summary statistics of segmentation"""
    summary = {
        'New': {'count': 0, 'avg_confidence': 0},
        'Regular': {'count': 0, 'avg_confidence': 0},
        'Loyal': {'count': 0, 'avg_confidence': 0},
        'Inactive': {'count': 0, 'avg_confidence': 0}
    }
    
    for result in results:
        segment = result['segment']
        if segment in summary:
            summary[segment]['count'] += 1
            summary[segment]['avg_confidence'] += result['confidence']
    
    for segment in summary:
        if summary[segment]['count'] > 0:
            summary[segment]['avg_confidence'] = round(
                summary[segment]['avg_confidence'] / summary[segment]['count'], 4
            )
    
    total = len(results)
    for segment in summary:
        summary[segment]['percentage'] = round(
            (summary[segment]['count'] / total * 100) if total > 0 else 0, 2
        )
    
    return summary


if __name__ == '__main__':
    try:
        input_data = json.loads(sys.stdin.read())
        
        if isinstance(input_data, list):
            results = segment_customers(input_data)
            summary = get_segment_summary(results)
            output = {
                'success': True,
                'customers': results,
                'summary': summary
            }
        else:
            segment, details = BayesianCustomerSegmenter().classify(input_data)
            output = {
                'success': True,
                'customer': {
                    '_id': input_data.get('_id'),
                    'email': input_data.get('email'),
                    **details
                }
            }
        
        print(json.dumps(output, indent=2))
        
    except Exception as e:
        output = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(output, indent=2))
        sys.exit(1)
