import { Schema, models, model } from 'mongoose';

const FlagSchema = new Schema({
  user: { type: String, required: true },
  reason: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const RatingSchema = new Schema({
  user: { type: String, required: true },
  score: { type: Number, required: true },
  text: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  approved: { type: Boolean, default: false },
  flagged: { type: Boolean, default: false },
  flaggedReason: { type: String, default: '' },
});

const WalletSchema = new Schema({
  address: { type: String, required: true },
  chain: { type: String, required: true },
  exchangeSource: { type: String },
  storageType: { type: String },
  flags: [FlagSchema],
  ratings: [RatingSchema],
  avgRating: { type: Number, default: 0 },
  ens: { type: String },
  nftCount: { type: Number, default: 0 },
  lastRefreshed: { type: Date },
  // risk / tax meter fields
  riskScore: { type: Number, default: 100 }, // 0 (low risk) .. 100 (high risk) - will invert for display if needed
  riskCategory: { type: String, enum: ['black','red','yellow','green'], default: 'black' },
  riskHistory: [ { date: { type: Date, default: Date.now }, score: Number, category: String, note: String } ],
  lastRiskAt: { type: Date },
  // v4 admin fields
  blacklisted: { type: Boolean, default: false },
  blacklistReason: { type: String },
  blacklistedAt: { type: Date },
  // v5 fields for detection logic
  txCount: { type: Number, default: 0 },
  lastTxWithinHours: { type: Number, default: 9999 },
  flagsCount: { type: Number, default: 0 },
  flagThreshold: { type: Number },
  kycStatus: { type: String, default: 'unknown' },
  lastFlagger: { type: String },
  kycDetails: {
    fullName: { type: String },
    dob: { type: String },
    country: { type: String },
    idType: { type: String },
    idNumber: { type: String },
    idDocumentUrl: { type: String },
    selfieUrl: { type: String },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    adminNote: { type: String },
  },
  verificationProof: { type: Schema.Types.Mixed },
  suspicious: { type: Boolean, default: false },
  flagsList: [{ type: String }], // for admin/manual flags
  // role management
  // new campaign/social/trust fields (v7 charity features)
  campaigns: [{
    title: String,
    description: String,
    goal: Number,
    wallet: String,
    expiry: Date,
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }],
  socials: {
    twitter: String,
    telegram: String,
    whatsapp: String,
    instagram: String,
  },
  trustScore: { type: Number, default: 0 },
  role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
});

WalletSchema.index({ address: 1, chain: 1 }, { unique: true });
WalletSchema.index({ exchangeSource: 1 });
WalletSchema.index({ storageType: 1 });

export default models.Wallet || model('Wallet', WalletSchema);