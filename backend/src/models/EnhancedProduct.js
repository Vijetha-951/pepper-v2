import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    type: { type: String, enum: ['Climber', 'Bush'], required: true },
    category: { type: String, default: 'Bush Pepper' },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    
    // Enhanced stock management fields
    total_stock: { 
      type: Number, 
      required: true, 
      min: 0,
      validate: {
        validator: function(v) {
          return v >= 0;
        },
        message: 'total_stock must be non-negative'
      }
    },
    available_stock: { 
      type: Number, 
      required: true, 
      min: 0,
      validate: {
        validator: function(v) {
          return v >= 0 && v <= this.total_stock;
        },
        message: 'available_stock must be non-negative and cannot exceed total_stock'
      }
    },
    
    // Legacy field for backward compatibility
    stock: { type: Number, min: 0 },
    
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Virtual for calculating sold quantity
productSchema.virtual('sold').get(function() {
  return this.total_stock - this.available_stock;
});

// Method to get stock status
productSchema.methods.getStockStatus = function() {
  if (this.available_stock === 0) return 'Out of Stock';
  if (this.available_stock <= 5) return 'Low Stock';
  return 'In Stock';
};

// Method to get stock status color
productSchema.methods.getStockStatusColor = function() {
  const status = this.getStockStatus();
  switch (status) {
    case 'Out of Stock': return 'red';
    case 'Low Stock': return 'yellow';
    case 'In Stock': return 'green';
    default: return 'gray';
  }
};

// Method to get sold quantity
productSchema.methods.getSoldQuantity = function() {
  return this.total_stock - this.available_stock;
};

// Method to make a purchase (reduce available_stock)
productSchema.methods.makePurchase = function(quantity) {
  if (quantity <= 0) return;
  if (quantity > this.available_stock) {
    throw new Error(`Purchase quantity (${quantity}) exceeds available stock (${this.available_stock})`);
  }
  this.available_stock -= quantity;
  // Update legacy stock field for backward compatibility
  this.stock = this.available_stock;
};

// Method to restock (increase both total_stock and available_stock)
productSchema.methods.restock = function(quantity) {
  if (quantity <= 0) return;
  this.total_stock += quantity;
  this.available_stock += quantity;
  // Update legacy stock field for backward compatibility
  this.stock = this.available_stock;
};

// Method to get complete stock information
productSchema.methods.getStockInfo = function() {
  return {
    total_stock: this.total_stock,
    available_stock: this.available_stock,
    sold: this.getSoldQuantity(),
    status: this.getStockStatus(),
    statusColor: this.getStockStatusColor()
  };
};

// Method to format for admin dashboard
productSchema.methods.toDashboardJSON = function() {
  const obj = this.toObject();
  return {
    ...obj,
    sold: this.getSoldQuantity(),
    status: this.getStockStatus(),
    statusColor: this.getStockStatusColor()
  };
};

// Pre-save middleware to sync legacy stock field
productSchema.pre('save', function(next) {
  // Keep legacy stock field in sync with available_stock for backward compatibility
  if (this.available_stock !== undefined) {
    this.stock = this.available_stock;
  }
  next();
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export default mongoose.model('Product', productSchema);