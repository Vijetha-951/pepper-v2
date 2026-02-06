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
    variety: { 
      type: String, 
      enum: ['Panniyur 1', 'Panniyur 5', 'Karimunda', 'Subhakara', 'Pournami', 'IISR Shakthi', 'IISR Thevam', 'Sreekara', 'Other'],
      default: 'Karimunda'
    },
    propagationMethod: { type: String, default: 'Rooted Cutting' },
    // Dynamic fields for calculating specifications
    propagationDate: { type: Date, default: Date.now }, // When the plant was propagated
    maturityMonths: { type: Number, default: 24 }, // Months to reach maturity (e.g., 24 = 2 years)
    bloomingMonths: { type: [Number], default: [4, 5, 6] }, // Months when it blooms (1=Jan, 12=Dec)
    location: { 
      type: { 
        region: String, 
        climate: { type: String, enum: ['Tropical', 'Subtropical', 'Temperate'], default: 'Tropical' }
      }, 
      default: { region: 'Kerala', climate: 'Tropical' }
    },
    // Legacy fields (kept for backward compatibility)
    maturityDuration: { type: String },
    bloomingSeason: { type: String },
    plantAge: { type: String },
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

// Calculate dynamic product specifications
productSchema.methods.getDynamicSpecifications = function() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  
  // Calculate plant age
  const propagationDate = this.propagationDate || this.createdAt;
  const ageInMonths = Math.floor((now - propagationDate) / (1000 * 60 * 60 * 24 * 30.44));
  const ageYears = Math.floor(ageInMonths / 12);
  const ageMonthsRemainder = ageInMonths % 12;
  
  let plantAge;
  if (ageYears > 0) {
    plantAge = ageMonthsRemainder > 0 
      ? `${ageYears} year${ageYears > 1 ? 's' : ''} ${ageMonthsRemainder} month${ageMonthsRemainder > 1 ? 's' : ''}`
      : `${ageYears} year${ageYears > 1 ? 's' : ''}`;
  } else {
    plantAge = `${ageInMonths} month${ageInMonths !== 1 ? 's' : ''}`;
  }
  
  // Check if currently blooming
  const isBloomingSeason = this.bloomingMonths && this.bloomingMonths.includes(currentMonth);
  const bloomingMonthNames = this.bloomingMonths ? this.bloomingMonths.map(m => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[m - 1];
  }).join(', ') : 'All season';
  
  const bloomingSeason = isBloomingSeason 
    ? `🌸 Currently Blooming (${bloomingMonthNames})`
    : `Blooms in ${bloomingMonthNames}`;
  
  // Calculate maturity status
  const maturityMonths = this.maturityMonths || 24;
  const monthsToMaturity = maturityMonths - ageInMonths;
  
  let maturityDuration;
  if (monthsToMaturity <= 0) {
    maturityDuration = '✅ Mature Plant';
  } else {
    const yearsToMaturity = Math.floor(monthsToMaturity / 12);
    const monthsRemainder = monthsToMaturity % 12;
    if (yearsToMaturity > 0) {
      maturityDuration = monthsRemainder > 0
        ? `Matures in ${yearsToMaturity}y ${monthsRemainder}m`
        : `Matures in ${yearsToMaturity} year${yearsToMaturity > 1 ? 's' : ''}`;
    } else {
      maturityDuration = `Matures in ${monthsToMaturity} month${monthsToMaturity !== 1 ? 's' : ''}`;
    }
  }
  
  return {
    propagationMethod: this.propagationMethod || 'Rooted Cutting',
    plantAge,
    bloomingSeason,
    maturityDuration,
    location: this.location?.region || 'Kerala',
    climate: this.location?.climate || 'Tropical',
    isCurrentlyBlooming: isBloomingSeason,
    isMature: monthsToMaturity <= 0
  };
};

productSchema.methods.toDashboardJSON = function() {
  const stockInfo = this.getStockInfo();
  const dynamicSpecs = this.getDynamicSpecifications();
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
    updatedAt: this.updatedAt,
    // Dynamic specifications
    propagationMethod: dynamicSpecs.propagationMethod,
    plantAge: dynamicSpecs.plantAge,
    bloomingSeason: dynamicSpecs.bloomingSeason,
    maturityDuration: dynamicSpecs.maturityDuration,
    location: dynamicSpecs.location,
    climate: dynamicSpecs.climate,
    isCurrentlyBlooming: dynamicSpecs.isCurrentlyBlooming,
    isMature: dynamicSpecs.isMature
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