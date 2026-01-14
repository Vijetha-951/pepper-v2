import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema(
  {
    // Who should receive this notification
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // Type of notification
    type: {
      type: String,
      enum: ['ORDER_PLACED', 'ORDER_ARRIVED', 'ORDER_DISPATCHED', 'ORDER_READY', 'ORDER_DELIVERED', 'RESTOCK_REQUEST'],
      required: true,
      index: true
    },
    // Title of notification
    title: {
      type: String,
      required: true
    },
    // Detailed message
    message: {
      type: String,
      required: true
    },
    // Related order
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      index: true
    },
    // Related hub (for hub manager notifications)
    hub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hub',
      index: true
    },
    // Read status
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    // Read timestamp
    readAt: {
      type: Date
    },
    // Additional data for navigation/context
    metadata: {
      district: String,
      orderStatus: String,
      customerName: String,
      orderId: String
    }
  },
  { timestamps: true }
);

// Index for efficient querying
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Mark as read
NotificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

export default mongoose.model('Notification', NotificationSchema);
