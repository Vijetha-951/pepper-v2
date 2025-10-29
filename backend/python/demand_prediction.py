import json
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from dateutil.relativedelta import relativedelta

class DemandPredictionService:
    """
    Decision Tree Service for Stock Demand Prediction
    Predicts upcoming product demand based on:
    - Month of year
    - Past sales trend
    - Product type (Climber/Bush)
    """

    @staticmethod
    def get_month_key(date: datetime) -> str:
        """Get month key in format YYYY-MM"""
        year = date.year
        month = str(date.month).zfill(2)
        return f"{year}-{month}"

    @staticmethod
    def get_current_month_number() -> int:
        """Get current month for seasonal analysis (1-12)"""
        return datetime.now().month

    @staticmethod
    def aggregate_sales_by_product_and_month(orders: List[Dict]) -> Dict:
        """Aggregate sales data by product and month"""
        sales_data = {}

        for order in orders:
            for item in order.get('items', []):
                product = item.get('product', {})
                product_id = str(product.get('_id', ''))
                
                if not product_id:
                    continue

                if product_id not in sales_data:
                    sales_data[product_id] = {
                        'byMonth': {},
                        'total': 0,
                        'orderCount': 0
                    }

                # Get month key from product creation date or order date
                date_str = product.get('createdAt') or order.get('createdAt')
                if date_str:
                    try:
                        # Handle ISO format datetime strings
                        if isinstance(date_str, str):
                            date_str = date_str.replace('Z', '+00:00')
                            date_obj = datetime.fromisoformat(date_str)
                        else:
                            date_obj = date_str
                    except (ValueError, AttributeError):
                        date_obj = datetime.now()
                else:
                    date_obj = datetime.now()

                month = DemandPredictionService.get_month_key(date_obj)
                
                if month not in sales_data[product_id]['byMonth']:
                    sales_data[product_id]['byMonth'][month] = 0

                quantity = item.get('quantity', 0)
                sales_data[product_id]['byMonth'][month] += quantity
                sales_data[product_id]['total'] += quantity
                sales_data[product_id]['orderCount'] += 1

        return sales_data

    @staticmethod
    def calculate_trend(months: List[str], monthly_data: Dict) -> str:
        """Calculate sales trend (RISING, DECLINING, STABLE)"""
        if len(months) < 2:
            return 'STABLE'

        recent = [monthly_data.get(m, 0) for m in months[-3:]]
        if len(recent) < 2:
            return 'STABLE'

        avg_older = sum(recent[:-1]) / (len(recent) - 1)
        newest = recent[-1]

        if newest > avg_older * 1.2:
            return 'RISING'
        if newest < avg_older * 0.8:
            return 'DECLINING'
        return 'STABLE'

    @staticmethod
    def check_seasonal_pattern(month: int, product_type: str) -> bool:
        """Check if current month typically has seasonal demand"""
        seasonal_months = {
            'Climber': [3, 4, 5, 9, 10, 11],  # Spring and Fall for climbing plants
            'Bush': [4, 5, 6, 7, 8]  # Summer for bush peppers
        }

        return month in seasonal_months.get(product_type, [])

    @staticmethod
    def calculate_urgency_score(recommendation: str, current_stock: int, recent_average: float) -> int:
        """Calculate urgency score for sorting predictions"""
        score = 0

        # Recommendation weight
        weights = {
            'INCREASE': 80,
            'REDUCE': 40,
            'MAINTAIN': 20,
            'MONITOR': 30
        }
        score = weights.get(recommendation, 20)

        # Stock criticality
        if current_stock <= 5:
            score += 20
        elif current_stock <= 10:
            score += 10

        # Demand strength
        if recent_average > 20:
            score += 10
        elif recent_average > 10:
            score += 5

        return min(score, 100)

    @staticmethod
    def get_stock_health(stock: int) -> str:
        """Get stock health status"""
        if stock > 30:
            return 'HEALTHY'
        if stock > 10:
            return 'ADEQUATE'
        if stock > 0:
            return 'LOW'
        return 'OUT_OF_STOCK'

    @staticmethod
    def calculate_confidence(data_points: int, average_sales: float) -> int:
        """Calculate prediction confidence based on data availability"""
        confidence = 0.5  # Base confidence

        # More data points = higher confidence
        if data_points >= 12:
            confidence = 0.9
        elif data_points >= 6:
            confidence = 0.8
        elif data_points >= 3:
            confidence = 0.7
        elif data_points >= 1:
            confidence = 0.6

        # High volume = higher confidence
        if average_sales > 20:
            confidence = min(confidence + 0.1, 0.95)

        return round(confidence * 100)

    @staticmethod
    def format_sales_history(months: List[str], monthly_data: Dict) -> List[Dict]:
        """Format sales history for display"""
        return [
            {
                'month': month,
                'sales': monthly_data.get(month, 0)
            }
            for month in months
        ]

    @staticmethod
    def predict_demand(product: Dict, sales_data: Dict) -> Dict:
        """Decision Tree: Predict demand and stock adjustment"""
        current_month = DemandPredictionService.get_current_month_number()
        months = sorted(sales_data.get('byMonth', {}).keys())
        recent_months = months[-3:] if months else []

        # Calculate metrics
        average_monthly_sales = 0
        if sales_data.get('total') and months:
            average_monthly_sales = sales_data['total'] / len(months)

        recent_sales = sum(sales_data.get('byMonth', {}).get(m, 0) for m in recent_months)
        recent_average = recent_sales / len(recent_months) if recent_months else 0

        # Determine trend
        trend = DemandPredictionService.calculate_trend(months, sales_data.get('byMonth', {}))

        # Current stock info
        current_stock = product.get('available_stock') or product.get('stock') or 0
        total_stock = product.get('total_stock') or product.get('stock') or 0

        # **DECISION TREE LOGIC**
        recommendation = 'MAINTAIN'
        adjustment_percentage = 0
        reason = ''

        # Decision Node 1: Check if product has sales history
        if not months:
            # No sales history
            recommendation = 'MONITOR'
            reason = 'New product with no sales history. Monitor initial demand.'
            adjustment_percentage = 0
        elif recent_average == 0:
            # No recent sales
            recommendation = 'REDUCE'
            reason = 'No sales in recent months. Consider reducing stock.'
            adjustment_percentage = -10
        else:
            # Decision Node 2: Check trend direction
            if trend == 'RISING':
                # Sales trending up - increase stock
                urgency = 'HIGH' if recent_average > average_monthly_sales * 1.5 else 'MEDIUM'

                # Decision Node 3: Check current stock level
                if current_stock < recent_average:
                    recommendation = 'INCREASE'
                    adjustment_percentage = 30 if urgency == 'HIGH' else 20
                    reason = f'Rising trend with insufficient stock. Current: {current_stock}, Recent avg: {round(recent_average)}.'
                else:
                    recommendation = 'MONITOR'
                    adjustment_percentage = 0
                    reason = 'Rising trend but adequate stock available.'

            elif trend == 'DECLINING':
                # Sales trending down - decrease stock
                # Decision Node 4: Check stock utilization
                stock_turnover = recent_average / current_stock if current_stock > 0 else 0

                if stock_turnover < 0.3:
                    recommendation = 'REDUCE'
                    adjustment_percentage = -20
                    reason = f'Declining trend with poor stock turnover ({stock_turnover * 100:.1f}%).'
                else:
                    recommendation = 'MAINTAIN'
                    adjustment_percentage = 0
                    reason = 'Declining trend but acceptable stock movement.'

            else:
                # STABLE trend
                # Decision Node 5: Check seasonal patterns
                is_seasonal = DemandPredictionService.check_seasonal_pattern(current_month, product.get('type', ''))

                if is_seasonal:
                    recommendation = 'INCREASE'
                    adjustment_percentage = 15
                    reason = f'Stable trend with seasonal demand spike expected for {product.get("type")} type in month {current_month}.'
                else:
                    # Check if stock is critically low
                    if current_stock <= 5:
                        recommendation = 'INCREASE'
                        adjustment_percentage = 10
                        reason = f'Critical stock level ({current_stock} units). Reorder recommended.'
                    else:
                        recommendation = 'MAINTAIN'
                        adjustment_percentage = 0
                        reason = 'Stable trend with adequate stock level.'

        # Calculate urgency score (0-100) for sorting
        urgency_score = DemandPredictionService.calculate_urgency_score(
            recommendation, current_stock, recent_average
        )

        # Calculate suggested stock based on recent average or current stock (whichever is higher)
        base_stock_for_suggestion = max(current_stock, recent_average)
        suggested_stock = round(base_stock_for_suggestion * (1 + adjustment_percentage / 100))

        return {
            'product': {
                '_id': str(product.get('_id', '')),
                'name': product.get('name', ''),
                'type': product.get('type', ''),
                'category': product.get('category', ''),
                'price': product.get('price', 0),
                'image': product.get('image', '')
            },
            'currentStock': current_stock,
            'totalStock': total_stock,
            'stockHealth': DemandPredictionService.get_stock_health(current_stock),
            'salesMetrics': {
                'averageMonthlySales': round(average_monthly_sales * 10) / 10,
                'recentAverageMonthlySales': round(recent_average * 10) / 10,
                'trend': trend,
                'salesHistory': DemandPredictionService.format_sales_history(
                    recent_months, sales_data.get('byMonth', {})
                )
            },
            'prediction': {
                'recommendation': recommendation,
                'adjustmentPercentage': adjustment_percentage,
                'suggestedStock': suggested_stock,
                'reason': reason,
                'confidence': DemandPredictionService.calculate_confidence(
                    len(recent_months), recent_average
                )
            },
            'urgencyScore': urgency_score
        }

    @staticmethod
    def generate_predictions(orders_data: List[Dict], products_data: List[Dict], months_back: int = 6) -> List[Dict]:
        """
        Analyze historical sales data and generate predictions
        
        Args:
            orders_data: List of orders with populated items and products
            products_data: List of active products
            months_back: Number of months of history to analyze
            
        Returns:
            Array of predictions sorted by urgency score
        """
        try:
            # Aggregate sales data by product and month
            sales_data = DemandPredictionService.aggregate_sales_by_product_and_month(orders_data)

            # Generate predictions for each product
            predictions = []
            for product in products_data:
                product_sales = sales_data.get(str(product.get('_id', '')), {})
                prediction = DemandPredictionService.predict_demand(product, product_sales)
                predictions.append(prediction)

            # Sort by urgency score (descending)
            predictions.sort(key=lambda x: x['urgencyScore'], reverse=True)
            return predictions

        except Exception as error:
            raise Exception(f'Demand prediction failed: {str(error)}')

    @staticmethod
    def get_top_predictions(orders_data: List[Dict], products_data: List[Dict], limit: int = 10, months_back: int = 6) -> List[Dict]:
        """Get top products by urgency"""
        predictions = DemandPredictionService.generate_predictions(orders_data, products_data, months_back)
        return predictions[:limit]

    @staticmethod
    def get_prediction_for_product(product_id: str, product_data: Dict, orders_data: List[Dict]) -> Dict:
        """Get predictions for a specific product"""
        try:
            sales_data = DemandPredictionService.aggregate_sales_by_product_and_month(orders_data)
            
            if product_id not in sales_data:
                product_sales = {}
            else:
                product_sales = sales_data[product_id]

            if not product_data:
                raise Exception('Product not found')

            return DemandPredictionService.predict_demand(product_data, product_sales)

        except Exception as error:
            raise Exception(f'Failed to get prediction for product: {str(error)}')


# For direct CLI usage
if __name__ == '__main__':
    try:
        input_data = json.loads(sys.stdin.read())

        # Expected input format:
        # {
        #   "action": "generatePredictions" | "getTopPredictions" | "getPredictionForProduct",
        #   "orders": [...],
        #   "products": [...],
        #   "productId": "...", (for getPredictionForProduct)
        #   "monthsBack": 6 (optional)
        # }

        action = input_data.get('action', 'generatePredictions')
        orders = input_data.get('orders', [])
        products = input_data.get('products', [])
        months_back = input_data.get('monthsBack', 6)

        output = {
            'success': True,
            'data': None
        }

        if action == 'generatePredictions':
            output['data'] = DemandPredictionService.generate_predictions(orders, products, months_back)

        elif action == 'getTopPredictions':
            limit = input_data.get('limit', 10)
            output['data'] = DemandPredictionService.get_top_predictions(orders, products, limit, months_back)

        elif action == 'getPredictionForProduct':
            product_id = input_data.get('productId')
            product_data = next((p for p in products if str(p.get('_id')) == product_id), None)
            if product_data:
                output['data'] = DemandPredictionService.get_prediction_for_product(product_id, product_data, orders)
            else:
                output['success'] = False
                output['error'] = 'Product not found'

        else:
            output['success'] = False
            output['error'] = f'Unknown action: {action}'

        print(json.dumps(output, indent=2))

    except Exception as e:
        output = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(output, indent=2))
        sys.exit(1)