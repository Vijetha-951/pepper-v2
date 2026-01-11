import mongoose from 'mongoose';

/**
 * Restock Request Model
 * Tracks restock requests from hubs to main hub
 */
const RestockRequestSchema = new mongoose.Schema(
  {
    requestingHub: { 
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
    requestedQuantity: { 
      type: Number, 
      required: true, 
      min: 1 
    },
    requestedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['PENDING', 'APPROVED', 'IN_TRANSIT', 'FULFILLED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    priority: { 
      type: String, 
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM'
    },
    reason: { 
      type: String, 
      trim: true 
    },
    approvedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    approvedAt: Date,
    fulfilledAt: Date,
    rejectedReason: String,
    notes: String
  },
  { timestamps: true }
);

// Index for quick filtering
RestockRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('RestockRequest', RestockRequestSchema);
