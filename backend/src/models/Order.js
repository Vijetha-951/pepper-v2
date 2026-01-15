import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String }, // snapshot name
    priceAtOrder: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const AddressSnapshotSchema = new mongoose.Schema(
  {
    line1: String,
    line2: String,
    district: String,
    state: String,
    pincode: String,
    destinationDistrict: String
  },
  { _id: false }
);

const PaymentSchema = new mongoose.Schema(
  {
    method: { type: String, enum: ['COD', 'ONLINE'], default: 'COD' },
    status: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], default: 'PENDING' },
    transactionId: String,
    refundId: String,
    refundAmount: Number,
    refundStatus: { type: String, enum: ['PENDING', 'PROCESSED', 'FAILED', null], default: null },
    refundInitiatedAt: Date,
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [OrderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'ARRIVED_AT_HUB', 'READY_FOR_COLLECTION'],
      default: 'PENDING',
      index: true,
    },
    deliveryStatus: {
      type: String,
      enum: ['ASSIGNED', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED', null],
      default: null,
      index: true,
    },
    deliveryBoy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    
    // Collection/Delivery Type
    deliveryType: {
      type: String,
      enum: ['HOME_DELIVERY', 'HUB_COLLECTION'],
      default: 'HOME_DELIVERY',
      index: true
    },
    
    // Hub Collection Fields
    collectionHub: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Hub',
      index: true
    }, // Hub selected by user for collection
    collectionOtp: { type: String }, // OTP for hub collection
    collectionOtpGeneratedAt: Date,
    collectedAt: Date, // Timestamp when order was collected
    
    // Multi-Hub Tracking Fields
    currentHub: { type: mongoose.Schema.Types.ObjectId, ref: 'Hub' },
    route: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hub' }], // Planned route
    trackingTimeline: [
      {
        status: String, // e.g., 'ARRIVED_AT_HUB', 'DISPATCHED', 'OUT_FOR_DELIVERY'
        location: String, // Hub name or 'Out for Delivery'
        hub: { type: mongoose.Schema.Types.ObjectId, ref: 'Hub' },
        timestamp: { type: Date, default: Date.now },
        description: String
      }
    ],
    deliveryOtp: { type: String }, // OTP for secure delivery

    shippingAddress: AddressSnapshotSchema,
    payment: PaymentSchema,
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model('Order', OrderSchema);