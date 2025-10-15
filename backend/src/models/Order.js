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
      enum: ['PENDING', 'APPROVED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
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
    shippingAddress: AddressSnapshotSchema,
    payment: PaymentSchema,
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model('Order', OrderSchema);