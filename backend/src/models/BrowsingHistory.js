import mongoose from 'mongoose';

const browsingHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    viewCount: { type: Number, default: 1, min: 1 },
    lastViewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for efficient user-based queries
browsingHistorySchema.index({ user: 1, product: 1 }, { unique: true });

export default mongoose.model('BrowsingHistory', browsingHistorySchema);