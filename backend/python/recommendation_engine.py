import json
import sys
from datetime import datetime
from typing import List, Dict, Tuple
from math import sqrt


class RecommendationEngine:
    """
    KNN Recommendation Engine
    Recommends pepper plant varieties based on user similarity
    """
    
    def __init__(self, orders_data=None, browsing_data=None, products_data=None):
        """
        Initialize with data sources
        In production, this would connect to MongoDB
        """
        self.orders = orders_data or []
        self.browsing_history = browsing_data or []
        self.products = products_data or []
    
    def calculate_distance(self, vector1: Dict, vector2: Dict) -> float:
        """Calculate Euclidean distance between two user vectors"""
        all_keys = set(list(vector1.keys()) + list(vector2.keys()))
        sum_squared_diff = 0
        
        for key in all_keys:
            val1 = vector1.get(key, 0)
            val2 = vector2.get(key, 0)
            sum_squared_diff += pow(val1 - val2, 2)
        
        return sqrt(sum_squared_diff)
    
    def build_user_vector(self, user_id: str) -> Dict:
        """
        Build user interaction vector from purchase and browsing history
        """
        vector = {}
        
        # Add purchases with higher weight (weight: 3)
        for order in self.orders:
            if str(order.get('user')) == str(user_id) and order.get('status') == 'DELIVERED':
                for item in order.get('items', []):
                    product_id = str(item.get('product', ''))
                    if product_id:
                        vector[product_id] = vector.get(product_id, 0) + 3
        
        # Add browsing with weight based on view count (default: 1)
        for browse in self.browsing_history:
            if str(browse.get('user')) == str(user_id):
                product_id = str(browse.get('product', ''))
                if product_id:
                    view_count = browse.get('viewCount', 1)
                    vector[product_id] = vector.get(product_id, 0) + view_count
        
        return vector
    
    def find_k_nearest_neighbors(self, user_id: str, k: int = 5) -> List[Dict]:
        """
        Get K nearest neighbors (similar users)
        """
        try:
            # Get all unique users
            all_users = set()
            for order in self.orders:
                user = order.get('user')
                if user:
                    all_users.add(str(user))
            
            all_users_list = list(all_users)
            
            if len(all_users_list) <= 1:
                return []
            
            target_user_vector = self.build_user_vector(user_id)
            distances = []
            
            # Calculate distance to all other users
            for other_user_id in all_users_list:
                if str(other_user_id) == str(user_id):
                    continue
                
                other_user_vector = self.build_user_vector(other_user_id)
                distance = self.calculate_distance(target_user_vector, other_user_vector)
                
                distances.append({
                    'userId': str(other_user_id),
                    'distance': distance
                })
            
            # Sort by distance and get K nearest
            distances.sort(key=lambda x: x['distance'])
            return distances[:k]
        
        except Exception as e:
            print(f"Error finding K-nearest neighbors: {str(e)}", file=sys.stderr)
            return []
    
    def get_recommended_products(self, user_id: str, k: int = 5, limit: int = 5) -> List[Dict]:
        """
        Get products liked by similar users
        """
        try:
            # Get user's current preferences
            user_vector = self.build_user_vector(user_id)
            user_product_ids = list(user_vector.keys())
            
            # Get K nearest neighbors
            neighbors = self.find_k_nearest_neighbors(user_id, k)
            
            if not neighbors:
                # Fallback: recommend popular products if no neighbors found
                return self.get_popular_products(user_product_ids, limit)
            
            # Aggregate products from similar users
            neighbor_product_scores = {}
            
            for neighbor in neighbors:
                neighbor_products = self.build_user_vector(neighbor['userId'])
                
                # Only consider products the target user hasn't interacted with
                for product_id, score in neighbor_products.items():
                    if product_id not in user_product_ids:
                        # Weight score by distance (closer users have more influence)
                        weight = 1 / (1 + neighbor['distance'])
                        neighbor_product_scores[product_id] = neighbor_product_scores.get(product_id, 0) + (score * weight)
            
            # Sort products by score and get recommendations
            if not neighbor_product_scores:
                return self.get_popular_products(user_product_ids, limit)
            
            sorted_products = sorted(neighbor_product_scores.items(), key=lambda x: x[1], reverse=True)
            recommended_product_ids = [product_id for product_id, _ in sorted_products[:limit]]
            
            # Fetch product details
            recommended_products = []
            for product_id in recommended_product_ids:
                for product in self.products:
                    if str(product.get('_id')) == str(product_id):
                        if product.get('isActive') and product.get('available_stock', 0) > 0:
                            recommended_products.append(product)
                        break
            
            return recommended_products
        
        except Exception as e:
            print(f"Error getting recommended products: {str(e)}", file=sys.stderr)
            return []
    
    def get_popular_products(self, exclude_product_ids: List[str] = None, limit: int = 5) -> List[Dict]:
        """
        Get popular products as fallback recommendation
        """
        try:
            if exclude_product_ids is None:
                exclude_product_ids = []
            
            exclude_product_ids = [str(id) for id in exclude_product_ids]
            
            # Count product occurrences in delivered orders
            product_counts = {}
            
            for order in self.orders:
                if order.get('status') == 'DELIVERED':
                    for item in order.get('items', []):
                        product_id = str(item.get('product', ''))
                        if product_id and product_id not in exclude_product_ids:
                            product_counts[product_id] = product_counts.get(product_id, 0) + 1
            
            # Sort by count
            sorted_product_ids = sorted(product_counts.items(), key=lambda x: x[1], reverse=True)
            popular_product_ids = [product_id for product_id, _ in sorted_product_ids[:limit * 2]]
            
            # Filter out excluded products
            popular_product_ids = [
                id for id in popular_product_ids 
                if id not in exclude_product_ids
            ][:limit]
            
            # Fetch product details
            popular_products = []
            for product_id in popular_product_ids:
                for product in self.products:
                    if str(product.get('_id')) == str(product_id):
                        if product.get('isActive') and product.get('available_stock', 0) > 0:
                            popular_products.append(product)
                        break
            
            return popular_products
        
        except Exception as e:
            print(f"Error getting popular products: {str(e)}", file=sys.stderr)
            return []
    
    def track_browsing(self, user_id: str, product_id: str) -> Dict:
        """
        Track user browsing activity
        """
        try:
            user_id = str(user_id)
            product_id = str(product_id)
            
            # Find existing browsing record
            for browse in self.browsing_history:
                if str(browse.get('user')) == user_id and str(browse.get('product')) == product_id:
                    browse['viewCount'] = browse.get('viewCount', 1) + 1
                    browse['lastViewedAt'] = datetime.now().isoformat()
                    return browse
            
            # Create new browsing record
            new_browse = {
                'user': user_id,
                'product': product_id,
                'viewCount': 1,
                'lastViewedAt': datetime.now().isoformat()
            }
            self.browsing_history.append(new_browse)
            return new_browse
        
        except Exception as e:
            print(f"Error tracking browsing: {str(e)}", file=sys.stderr)
            return None
    
    def get_recommendation_insights(self, user_id: str) -> Dict:
        """
        Get user's recommendation insights
        """
        try:
            user_id = str(user_id)
            
            # Count delivered orders
            user_orders = sum(
                1 for order in self.orders 
                if str(order.get('user')) == user_id and order.get('status') == 'DELIVERED'
            )
            
            # Count browsing history
            user_browsing = sum(
                1 for browse in self.browsing_history 
                if str(browse.get('user')) == user_id
            )
            
            user_vector = self.build_user_vector(user_id)
            
            return {
                'totalPurchases': user_orders,
                'totalBrowsed': user_browsing,
                'interactedProducts': len(user_vector),
                'vectorDimension': len(user_vector)
            }
        
        except Exception as e:
            print(f"Error getting recommendation insights: {str(e)}", file=sys.stderr)
            return {}


def get_recommendations(user_id: str, input_data: Dict, k: int = 5, limit: int = 5) -> Dict:
    """
    Main function to get recommendations for a user
    """
    try:
        # Initialize engine with data
        engine = RecommendationEngine(
            orders_data=input_data.get('orders', []),
            browsing_data=input_data.get('browsingHistory', []),
            products_data=input_data.get('products', [])
        )
        
        # Get recommendations
        recommended_products = engine.get_recommended_products(user_id, k, limit)
        
        # Get insights
        insights = engine.get_recommendation_insights(user_id)
        
        return {
            'success': True,
            'userId': str(user_id),
            'recommendations': recommended_products,
            'insights': insights,
            'count': len(recommended_products)
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


if __name__ == '__main__':
    try:
        input_data = json.loads(sys.stdin.read())
        user_id = input_data.get('userId')
        k = input_data.get('k', 5)
        limit = input_data.get('limit', 5)
        
        result = get_recommendations(user_id, input_data, k, limit)
        print(json.dumps(result, indent=2, default=str))
    
    except Exception as e:
        output = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(output, indent=2))
        sys.exit(1)