import express from 'express';
import asyncHandler from 'express-async-handler';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { PythonShell } from 'python-shell';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
router.use(requireAuth, requireAdmin);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Call Python SVM classifier
const predictCancellation = async (order, customer, customerOrders) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', '..', 'python', 'cancellation_svm_classifier.py');
    const data = {
      order,
      customer,
      customer_orders: customerOrders
    };
    
    const pyshell = new PythonShell('cancellation_svm_classifier.py', {
      pythonPath: process.env.PYTHON_PATH || 'python',
      scriptPath: path.dirname(scriptPath),
      args: ['predict', JSON.stringify(data)]
    });
    
    let result = '';
    pyshell.on('message', msg => result += msg);
    pyshell.end(err => {
      if (err) {
        console.error('Python error:', err);
        reject(err);
      } else {
        try {
          const parsed = JSON.parse(result);
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse Python response: ${result}`));
        }
      }
    });
  });
};

// Route 1: Batch Predictions & Analytics
// GET /api/cancellation/analytics
router.get('/analytics', asyncHandler(async (req, res) => {
  const { startDate, endDate, limit = 100 } = req.query;
  
  // Build filter
  const filter = {
    status: { $nin: ['cancelled', 'delivered'] }
  };
  
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }
  
  // Fetch orders
  const orders = await Order.find(filter)
    .populate('customer')
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });
  
  // Process batch predictions
  const predictions = [];
  const stats = {
    totalOrders: orders.length,
    highRiskCount: 0,
    mediumRiskCount: 0,
    lowRiskCount: 0,
    totalRevenueAtRisk: 0,
    averageRiskScore: 0,
    riskDistribution: {
      HIGH: [],
      MEDIUM: [],
      LOW: []
    },
    paymentMethodAnalysis: {
      COD: { total: 0, highRisk: 0 },
      CARD: { total: 0, highRisk: 0 }
    },
    topRiskOrders: []
  };
  
  let totalRiskScore = 0;
  const riskScores = [];
  
  // Predict each order
  for (const order of orders) {
    try {
      const customerOrders = await Order.find({ customer: order.customer._id });
      const prediction = await predictCancellation(
        {
          _id: order._id,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod || 'UNKNOWN',
          status: order.status,
          createdAt: order.createdAt.toISOString()
        },
        {
          _id: order.customer._id,
          createdAt: order.customer.createdAt.toISOString()
        },
        customerOrders.map(o => ({
          _id: o._id,
          totalAmount: o.totalAmount,
          status: o.status,
          createdAt: o.createdAt.toISOString()
        }))
      );
      
      predictions.push({
        orderId: order._id,
        customerName: order.customer.firstName + ' ' + order.customer.lastName,
        customerPhone: order.customer.phone,
        amount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        ...prediction
      });
      
      // Update statistics
      if (prediction.risk_level === 'HIGH') {
        stats.highRiskCount++;
        stats.totalRevenueAtRisk += order.totalAmount || 0;
      } else if (prediction.risk_level === 'MEDIUM') {
        stats.mediumRiskCount++;
      } else if (prediction.risk_level === 'LOW') {
        stats.lowRiskCount++;
      }
      
      totalRiskScore += prediction.risk_score;
      riskScores.push(prediction.risk_score);
      
      // Risk distribution
      if (prediction.risk_level && stats.riskDistribution[prediction.risk_level]) {
        stats.riskDistribution[prediction.risk_level].push({
          orderId: order._id,
          amount: order.totalAmount,
          riskScore: prediction.risk_score
        });
      }
      
      // Payment method analysis
      const pm = order.paymentMethod || 'UNKNOWN';
      if (stats.paymentMethodAnalysis[pm]) {
        stats.paymentMethodAnalysis[pm].total++;
        if (prediction.risk_level === 'HIGH') {
          stats.paymentMethodAnalysis[pm].highRisk++;
        }
      }
      
    } catch (err) {
      console.error(`Error predicting order ${order._id}:`, err);
      // Continue with next order
    }
  }
  
  // Calculate averages
  stats.averageRiskScore = stats.totalOrders > 0 
    ? Math.round(totalRiskScore / stats.totalOrders) 
    : 0;
  
  // Top risk orders
  stats.topRiskOrders = predictions
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 10);
  
  // Trend data: group by date
  const trendData = {};
  predictions.forEach(pred => {
    const date = new Date(pred.createdAt).toISOString().split('T')[0];
    if (!trendData[date]) {
      trendData[date] = { HIGH: 0, MEDIUM: 0, LOW: 0, total: 0 };
    }
    trendData[date][pred.risk_level]++;
    trendData[date].total++;
  });
  
  const trends = Object.entries(trendData).map(([date, data]) => ({
    date,
    ...data
  })).sort((a, b) => new Date(a.date) - new Date(b.date));
  
  res.json({
    success: true,
    data: {
      stats,
      predictions,
      trends,
      summary: {
        analyzed: predictions.length,
        errors: orders.length - predictions.length,
        generatedAt: new Date().toISOString()
      }
    }
  });
}));

// Route 2: Single Order Prediction
// POST /api/cancellation/predict/:orderId
router.post('/predict/:orderId', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).populate('customer');
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  const customerOrders = await Order.find({ customer: order.customer._id });
  
  const prediction = await predictCancellation(
    {
      _id: order._id,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      status: order.status,
      createdAt: order.createdAt.toISOString()
    },
    {
      _id: order.customer._id,
      createdAt: order.customer.createdAt.toISOString()
    },
    customerOrders.map(o => ({
      _id: o._id,
      totalAmount: o.totalAmount,
      status: o.status,
      createdAt: o.createdAt.toISOString()
    }))
  );
  
  res.json({
    success: true,
    orderId: order._id,
    customerName: `${order.customer.firstName} ${order.customer.lastName}`,
    amount: order.totalAmount,
    ...prediction
  });
}));

// Route 3: Dashboard Summary
// GET /api/cancellation/dashboard-summary
router.get('/dashboard-summary', asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  
  // Get recent orders
  const orders = await Order.find({
    createdAt: { $gte: startDate },
    status: { $nin: ['cancelled', 'delivered'] }
  }).populate('customer');
  
  // Quick predictions for summary
  const summary = {
    totalOrders: orders.length,
    highRiskCount: 0,
    mediumRiskCount: 0,
    lowRiskCount: 0,
    totalRevenueAtRisk: 0,
    codOrdersCount: 0,
    cardOrdersCount: 0,
    averageOrderValue: 0,
    lastUpdated: new Date()
  };
  
  if (orders.length === 0) {
    return res.json({ success: true, data: summary });
  }
  
  // Calculate quick stats without predictions (for speed)
  let totalAmount = 0;
  orders.forEach(order => {
    totalAmount += order.totalAmount || 0;
    if (order.paymentMethod === 'COD') {
      summary.codOrdersCount++;
    } else {
      summary.cardOrdersCount++;
    }
  });
  
  summary.averageOrderValue = Math.round(totalAmount / orders.length);
  
  // Predict for sample of orders for detailed stats
  const sampleSize = Math.min(20, orders.length);
  const sampleOrders = orders.slice(0, sampleSize);
  
  let sampleHighRisk = 0;
  for (const order of sampleOrders) {
    try {
      const customerOrders = await Order.find({ customer: order.customer._id });
      const prediction = await predictCancellation(
        {
          _id: order._id,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          status: order.status,
          createdAt: order.createdAt.toISOString()
        },
        {
          _id: order.customer._id,
          createdAt: order.customer.createdAt.toISOString()
        },
        customerOrders.map(o => ({
          totalAmount: o.totalAmount,
          status: o.status
        }))
      );
      
      if (prediction.risk_level === 'HIGH') {
        sampleHighRisk++;
        summary.totalRevenueAtRisk += order.totalAmount;
      }
    } catch (err) {
      console.error('Prediction error:', err);
    }
  }
  
  // Extrapolate to all orders
  const highRiskRatio = sampleSize > 0 ? sampleHighRisk / sampleSize : 0;
  summary.highRiskCount = Math.round(orders.length * highRiskRatio);
  summary.mediumRiskCount = Math.round(orders.length * 0.2); // Estimate
  summary.lowRiskCount = Math.round(orders.length * (1 - highRiskRatio - 0.2));
  
  res.json({ success: true, data: summary });
}));

// Route 4: Risk Comparison by Payment Method
// GET /api/cancellation/payment-analysis
router.get('/payment-analysis', asyncHandler(async (req, res) => {
  const orders = await Order.find({
    status: { $nin: ['cancelled', 'delivered'] }
  }).populate('customer').limit(50);
  
  const analysis = {
    COD: { total: 0, predictions: [] },
    CARD: { total: 0, predictions: [] },
    OTHER: { total: 0, predictions: [] }
  };
  
  for (const order of orders) {
    const pm = order.paymentMethod || 'OTHER';
    const key = analysis[pm] ? pm : 'OTHER';
    
    try {
      const customerOrders = await Order.find({ customer: order.customer._id });
      const prediction = await predictCancellation(
        {
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          status: order.status,
          createdAt: order.createdAt.toISOString()
        },
        {
          createdAt: order.customer.createdAt.toISOString()
        },
        customerOrders.map(o => ({
          totalAmount: o.totalAmount,
          status: o.status
        }))
      );
      
      analysis[key].total++;
      analysis[key].predictions.push({
        orderId: order._id,
        amount: order.totalAmount,
        riskScore: prediction.risk_score,
        riskLevel: prediction.risk_level
      });
    } catch (err) {
      console.error('Error:', err);
    }
  }
  
  // Calculate averages
  Object.keys(analysis).forEach(pm => {
    const preds = analysis[pm].predictions;
    if (preds.length > 0) {
      const avgRisk = preds.reduce((sum, p) => sum + p.riskScore, 0) / preds.length;
      const highRiskCount = preds.filter(p => p.riskLevel === 'HIGH').length;
      
      analysis[pm].averageRiskScore = Math.round(avgRisk);
      analysis[pm].highRiskPercentage = Math.round((highRiskCount / preds.length) * 100);
      analysis[pm].totalRevenue = preds.reduce((sum, p) => sum + p.amount, 0);
    }
  });
  
  res.json({ success: true, data: analysis });
}));

export default router;