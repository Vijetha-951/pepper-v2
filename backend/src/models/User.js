import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema(
  {
    line1: String,
    line2: String,
    district: String,
    state: String,
    pincode: String,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true }, // Firebase user ID
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: ['user', 'admin', 'deliveryboy'], default: 'user', index: true },
    place: { type: String, trim: true },
    district: { type: String, trim: true },
    pincode: { type: String, trim: true },
    address: AddressSchema, // optional structured address
    provider: { type: String, default: 'firebase' }, // firebase, google.com, etc.
    profilePicture: { type: String, trim: true }, // URL to profile picture
    isActive: { type: Boolean, default: true },
    assignedAreas: { // for delivery boys
      pincodes: [String],
      districts: [String],
    },
  },
  { timestamps: true }
);

userSchema.virtual('name').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash; // hide hash by default
  return obj;
};

export default mongoose.model('User', userSchema);