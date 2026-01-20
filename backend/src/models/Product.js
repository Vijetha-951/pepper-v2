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
    // Product Specifications
    propagationMethod: { type: String, default: 'Cutting' },
    maturityDuration: { type: String, default: '1.5 years' },
    bloomingSeason: { type: String, default: 'All season' },
    plantAge: { type: String, default: '3 Months' },
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

// Post-save middleware to sync with Kottayam hub inventory
productSchema.post('save', async function(doc) {
  try {
    // Import models (avoid circular dependency by importing inside hook)
    const Hub = mongoose.model('Hub');
    const HubInventory = mongoose.model('HubInventory');
    
    // Find Kottayam hub
    const kottayamHub = await Hub.findOne({ district: 'Kottayam' });
    if (!kottayamHub) {
      console.log('⚠️  Kottayam hub not found for auto-sync');
      return;
    }
    
    // Find or create hub inventory for this product
    let hubInventory = await HubInventory.findOne({
      hub: kottayamHub._id,
      product: doc._id
    });
    
    if (!hubInventory) {
      // Create new inventory entry
      hubInventory = new HubInventory({
        hub: kottayamHub._id,
        product: doc._id,
        quantity: doc.available_stock || 0,
        reservedQuantity: 0
      });
      await hubInventory.save();
      console.log(`✅ Created Kottayam inventory for ${doc.name}: ${doc.available_stock}`);
    } else {
      // Update existing inventory to match product stock
      const oldQuantity = hubInventory.quantity;
      hubInventory.quantity = doc.available_stock || 0;
      await hubInventory.save();
      
      if (oldQuantity !== hubInventory.quantity) {
        console.log(`🔄 Synced ${doc.name}: Kottayam hub ${oldQuantity} → ${hubInventory.quantity}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error syncing ${doc.name} with Kottayam hub:`, error.message);
  }
});

export default mongoose.model('Product', productSchema);