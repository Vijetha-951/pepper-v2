import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const CartSchema = new mongoose.Schema(
  {
    user: { type: String, required: true, unique: true }, // Firebase UID is string
    items: { type: [CartItemSchema], default: [] },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Instance methods
CartSchema.methods.getCartTotal = async function() {
  await this.populate('items.product');
  let total = 0;
  for (const item of this.items) {
    if (item.product) {
      total += item.product.price * item.quantity;
    }
  }
  return total;
};

CartSchema.methods.clearCart = function() {
  this.items = [];
  this.updatedAt = new Date();
  return this.save();
};

export default mongoose.model('Cart', CartSchema);