import mongoose from 'mongoose';

const HubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true, index: true },
    order: { type: Number, required: true, index: true },
    type: { 
      type: String, 
      enum: ['WAREHOUSE', 'REGIONAL_HUB', 'LOCAL_HUB'], 
      required: true 
    },
    location: {
      address: String,
      city: String,
      state: String,
      pincode: { type: String, required: true, index: true },
      coordinates: { // Optional: for map visualization
        lat: Number,
        lng: Number
      }
    },
    managedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Hub Managers
    coverage: {
      pincodes: [String], // List of pincodes this hub serves (for Local Hubs)
      districts: [String] // List of districts this hub serves (for Regional Hubs)
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('Hub', HubSchema);
