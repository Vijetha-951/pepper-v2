import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    type: { type: String, enum: ['Climber', 'Bush'], required: true },
    category: { type: String, default: 'Bush Pepper' },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 }, // Legacy field for backward compatibility
    total_stock: { type: Number, default: function() { return this.stock || 0; } },
    available_stock: { type: Number, default: function() { return this.stock || 0; } },
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Instance methods for stock management
productSchema.methods.getStockInfo = function() {
  return {
    total_stock: this.total_stock || this.stock || 0,
    available_stock: this.available_stock !== undefined ? this.available_stock : (this.stock || 0),
    sold: (this.total_stock || this.stock || 0) - (this.available_stock !== undefined ? this.available_stock : (this.stock || 0)),
    status: this.getStockStatus()
  };
};

productSchema.methods.getStockStatus = function() {
  const available = this.available_stock !== undefined ? this.available_stock : (this.stock || 0);
  if (available > 5) return 'In Stock';
  if (available >= 1) return 'Low Stock';
  return 'Out of Stock';
};

productSchema.methods.toDashboardJSON = function() {
  const stockInfo = this.getStockInfo();
  return {
    _id: this._id,
    name: this.name,
    type: this.type,
    category: this.category,
    description: this.description,
    price: this.price,
    stock: this.stock, // Legacy field
    total_stock: stockInfo.total_stock,
    available_stock: stockInfo.available_stock,
    sold: stockInfo.sold,
    status: stockInfo.status,
    image: this.image,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Pre-save middleware to sync stock fields
productSchema.pre('save', function(next) {
  // Ensure total_stock and available_stock are set
  if (this.total_stock === undefined && this.stock !== undefined) {
    this.total_stock = this.stock;
  }
  if (this.available_stock === undefined && this.stock !== undefined) {
    this.available_stock = this.stock;
  }
  
  // Keep legacy stock field in sync with available_stock for backward compatibility
  if (this.available_stock !== undefined) {
    this.stock = this.available_stock;
  }
  
  next();
});

export default mongoose.model('Product', productSchema);