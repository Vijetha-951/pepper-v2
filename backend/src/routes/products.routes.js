import express from 'express';
import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';

const router = express.Router();

// GET /api/products - list products
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { q, type, available, minPrice, maxPrice } = req.query;
    const filter = {};
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (type) filter.type = type;
    if (available === 'true') filter.stock = { $gt: 0 };
    if (minPrice || maxPrice) filter.price = {
      ...(minPrice ? { $gte: Number(minPrice) } : {}),
      ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
    };
    const items = await Product.find(filter).sort({ createdAt: -1 });
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
    const { name, type, category, description, price, stock, image, isActive } = req.body;
    const created = await Product.create({ name, type, category, description, price, stock, image, isActive });
    res.status(201).json(created);
  })
);

// PUT /api/products/:id - update
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { name, type, category, description, price, stock, image, isActive } = req.body;
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { name, type, category, description, price, stock, image, isActive },
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