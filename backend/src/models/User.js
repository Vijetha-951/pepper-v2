import mongoose from 'mongoose';
import { validateMeaningfulEmail } from '../middleware/emailValidation.js';

const AddressSchema = new mongoose.Schema(
  {
    line1: String,
    line2: String,
    district: String,
    state: String,
    pincode: String,
    phone: String,
  },
  { _id: false }
);

// For address book entries we want stable IDs for updates/deletes
const AddressItemSchema = new mongoose.Schema(
  {
    line1: String,
    line2: String,
    district: String,
    state: String,
    pincode: String,
    phone: String,
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true }, // Firebase user ID
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true,
      validate: {
        validator: function(email) {
          const validation = validateMeaningfulEmail(email);
          return validation.isValid;
        },
        message: function(props) {
          const validation = validateMeaningfulEmail(props.value);
          return validation.reason || 'Invalid email address';
        }
      }
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: ['user', 'admin', 'deliveryboy'], default: 'user', index: true },
    place: { type: String, trim: true },
    district: { type: String, trim: true },
    pincode: { type: String, trim: true },
    address: AddressSchema, // optional structured address (legacy/primary)
    addresses: { type: [AddressItemSchema], default: [] }, // address book
    provider: { type: String, default: 'firebase' }, // firebase, google.com, etc.
    profilePicture: { type: String, trim: true }, // URL to profile picture
    isActive: { type: Boolean, default: null }, // null = pending, true = approved, false = rejected
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