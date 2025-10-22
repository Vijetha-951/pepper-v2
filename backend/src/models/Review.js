import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000 },
    complaintType: { type: String, enum: ['None', 'Damaged', 'Wrong Variety', 'Delayed Delivery', 'Other'], default: 'None' },
    complaintDescription: { type: String, trim: true, maxlength: 1000 },
    isPublished: { type: Boolean, default: true }, // Show on product page
    productSnapshot: { // Store product info at time of review for historical accuracy
      name: String,
      price: Number,
      image: String
    },
    editCount: { type: Number, default: 0 },
    lastEditedAt: { type: Date },
    canEdit: { // Allow edits for 30 days from creation
      type: Boolean,
      default: true,
      get: function() {
        if (!this.createdAt) return false;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return this.createdAt > thirtyDaysAgo;
      }
    }
  },
  { timestamps: true }
);

// Index for efficient queries
ReviewSchema.index({ user: 1, product: 1 }, { unique: true }); // One review per product per user
ReviewSchema.index({ product: 1, isPublished: 1 }); // For fetching product reviews

export default mongoose.model('Review', ReviewSchema);