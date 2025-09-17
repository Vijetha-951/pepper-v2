import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { Package, Calendar, IndianRupee, AlertCircle } from 'lucide-react';

const Orders = () => {
  const [user] = useAuthState(auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-blue-100 text-blue-800';
      case 'OUT_FOR_DELIVERY': return 'bg-purple-100 text-purple-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'REFUNDED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
          <p className="mt-4 text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-6">
          <Package className="h-6 w-6 text-green-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">Your Orders</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-600 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">Your order history will appear here once you make your first purchase.</p>
            <button
              onClick={() => navigate('/add-products')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Order Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </h3>
                      <div className="flex items-center mt-1 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-0 flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment.status)}`}>
                        {order.payment.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.product?.image ? (
                            <img
                              src={item.product.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-400 text-xs text-center">No Image</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          <p className="text-sm text-gray-600">Price: ₹{item.priceAtOrder} each</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">₹{item.priceAtOrder * item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Total */}
                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Amount</span>
                      <div className="flex items-center">
                        <IndianRupee className="h-4 w-4 text-gray-600 mr-1" />
                        <span className="text-lg font-semibold text-gray-900">{order.totalAmount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  {order.shippingAddress && (
                    <div className="border-t border-gray-200 mt-4 pt-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Shipping Address</h5>
                      <div className="text-sm text-gray-600">
                        <p>{order.shippingAddress.line1}</p>
                        {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                        <p>
                          {order.shippingAddress.district}
                          {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
                          {order.shippingAddress.pincode && ` - ${order.shippingAddress.pincode}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Payment Method */}
                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Payment Method</span>
                      <span className="text-gray-900">{order.payment.method}</span>
                    </div>
                    {order.payment.transactionId && (
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-600">Transaction ID</span>
                        <span className="text-gray-900 font-mono text-xs">{order.payment.transactionId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;