import mongoose from 'mongoose';

const WishlistItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    addedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const WishlistSchema = new mongoose.Schema(
  {
    user: { type: String, required: true, unique: true }, // Firebase UID
    items: { type: [WishlistItemSchema], default: [] }
  },
  { timestamps: true }
);

// Instance methods
WishlistSchema.methods.addItem = function(productId) {
  const existingItem = this.items.find(item => item.product.toString() === productId.toString());
  if (!existingItem) {
    this.items.push({ product: productId });
  }
  return this.save();
};

WishlistSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(item => item.product.toString() !== productId.toString());
  return this.save();
};

WishlistSchema.methods.hasProduct = function(productId) {
  return this.items.some(item => item.product.toString() === productId.toString());
};

export default mongoose.model('Wishlist', WishlistSchema);
