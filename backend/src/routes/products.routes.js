import express from 'express';
import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';

const router = express.Router();

// GET /api/products - list products
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await Product.find().sort({ createdAt: -1 });
    res.json(items);
  })
);

// GET /api/products/:id - get one
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const item = await Product.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  })
);

// POST /api/products - create
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, description, price, imageUrl, inStock, category } = req.body;
    const created = await Product.create({ name, description, price, imageUrl, inStock, category });
    res.status(201).json(created);
  })
);

// PUT /api/products/:id - update
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { name, description, price, imageUrl, inStock, category } = req.body;
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, price, imageUrl, inStock, category },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  })
);

// DELETE /api/products/:id - delete
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true });
  })
);

export default router;