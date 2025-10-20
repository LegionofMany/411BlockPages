import { Schema, models, model } from 'mongoose';

const FundraiserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  target: { type: Number, required: true },
  raised: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  walletAddress: { type: String, required: true, index: true },
  owner: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  active: { type: Boolean, default: true },
  status: { type: String, enum: ['pending','approved','closed','flagged'], default: 'approved' },
  privacy: { type: String, enum: ['public','circle'], default: 'public' },
  circle: [{ type: String }],
  recentDonors: [{ type: String }],
  // tax settings
  taxRate: { type: Number, default: 0 }, // tax rate as a decimal fraction (e.g., 0.05 = 5%)
  taxCollected: { type: Number, default: 0 },
}, { timestamps: true });

export default models.Fundraiser || model('Fundraiser', FundraiserSchema);
