import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db.js';   // ✅ make sure db.js uses `export default`
import productsRouter from './routes/products.routes.js';
import authRouter from './routes/auth.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ====== Middlewares ======
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// ====== Health Check ======
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// ====== Routes ======
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);

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
