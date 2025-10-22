import './config/env.js'; // Load environment variables first
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db.js';
import productsRouter from './routes/products.routes.js';
import authRouter from './routes/auth.routes.js';
import adminRouter from './routes/admin.routes.js';
import userRouter from './routes/user.routes.js';
import deliveryRouter from './routes/delivery.routes.js';
import stockRouter from './routes/stockManagement.routes.js';
import cartRouter from './routes/cart.routes.js';
import ordersRouter from './routes/orders.routes.js';
import paymentRouter from './routes/payment.routes.js';
import recommendationsRouter from './routes/recommendations.routes.js';

// Debug environment variables
console.log('Environment variables loaded:');
console.log('PORT from env:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID);

const app = express();
const PORT = process.env.PORT || 5000;

// ====== Middlewares ======
app.use(cors({ origin: true, credentials: true })); // Allow all origins in development
app.use(express.json());
app.use(morgan('dev'));

// ====== Health Check ======
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ====== Routes ======
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/user', userRouter);
app.use('/api/delivery', deliveryRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api', stockRouter);

// ====== Start server after DB connect ======
connectDB()
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to DB:', err);
    process.exit(1);
  });
