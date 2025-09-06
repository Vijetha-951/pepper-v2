import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, default: '' },
    inStock: { type: Boolean, default: true },
    category: { type: String, default: 'general' },
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);