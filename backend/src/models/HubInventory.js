import mongoose from 'mongoose';

/**
 * Hub Inventory Model
 * Tracks product inventory at each hub
 */
const HubInventorySchema = new mongoose.Schema(
  {
    hub: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Hub', 
      required: true, 
      index: true 
    },
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product', 
      required: true, 
      index: true 
    },
    quantity: { 
      type: Number, 
      required: true, 
      min: 0,
      default: 0
    },
    reservedQuantity: { 
      type: Number, 
      default: 0,
      min: 0
    }, // Quantity reserved for pending orders
    lastRestocked: { 
      type: Date, 
      default: Date.now 
    },
    restockHistory: [{
      quantity: Number,
      source: { 
        type: String, 
        enum: ['MAIN_HUB', 'ADMIN', 'PURCHASE'],
        default: 'MAIN_HUB'
      },
      timestamp: { 
        type: Date, 
        default: Date.now 
      },
      notes: String
    }]
  },
  { timestamps: true }
);

// Compound index for unique hub-product combination
HubInventorySchema.index({ hub: 1, product: 1 }, { unique: true });

// Method to get available quantity (total - reserved)
HubInventorySchema.methods.getAvailableQuantity = function() {
  return Math.max(0, this.quantity - this.reservedQuantity);
};

// Method to reserve quantity for an order
HubInventorySchema.methods.reserveQuantity = function(amount) {
  if (this.getAvailableQuantity() < amount) {
    throw new Error('Insufficient available quantity');
  }
  this.reservedQuantity += amount;
  return this.save();
};

// Method to release reserved quantity (e.g., order cancelled)
HubInventorySchema.methods.releaseQuantity = function(amount) {
  this.reservedQuantity = Math.max(0, this.reservedQuantity - amount);
  return this.save();
};

// Method to fulfill order (reduce both quantity and reserved)
HubInventorySchema.methods.fulfillOrder = function(amount) {
  if (this.reservedQuantity < amount || this.quantity < amount) {
    throw new Error('Invalid fulfillment amount');
  }
  this.quantity -= amount;
  this.reservedQuantity -= amount;
  return this.save();
};

// Method to restock
HubInventorySchema.methods.restock = function(amount, source = 'MAIN_HUB', notes = '') {
  this.quantity += amount;
  this.lastRestocked = new Date();
  this.restockHistory.push({
    quantity: amount,
    source,
    timestamp: new Date(),
    notes
  });
  return this.save();
};

export default mongoose.model('HubInventory', HubInventorySchema);
