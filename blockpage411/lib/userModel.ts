import { Schema, models, model } from 'mongoose';

const UserSchema = new Schema({
  address: { type: String, required: true, unique: true },
  nonce: { type: String, required: true },
  nonceCreatedAt: { type: Date, required: true },
  // v3 profile fields
  displayName: { type: String },
  avatarUrl: { type: String },
  nftAvatarUrl: { type: String },
  // Unstoppable Domain (UD) handle (ownership verified via resolution during update)
  udDomain: { type: String },
  // Phone Book directory listing opt-in
  directoryOptIn: { type: Boolean, default: false },
  bio: { type: String },
  telegram: { type: String },
  twitter: { type: String },
  discord: { type: String },
  website: { type: String },
  whatsapp: { type: String },
  facebook: { type: String },
  instagram: { type: String },
  linkedin: { type: String },
  phoneApps: [{ type: String }], // e.g. ['WhatsApp', 'Signal']
  email: { type: String },
  emailVerified: { type: Boolean, default: false },
  socialLinks: {
    twitter: { type: String },
    instagram: { type: String },
    facebook: { type: String },
    telegram: { type: String },
    whatsapp: { type: String },
    discord: { type: String },
    verified: { type: Map, of: Boolean },
    trustScore: { type: Number, default: 0 },
  },
  // pending social verification challenges
  pendingSocialVerifications: [{ platform: { type: String }, handle: { type: String }, code: { type: String }, createdAt: { type: Date } }],
  kycStatus: { type: String, enum: ['unverified', 'pending', 'verified', 'rejected'], default: 'unverified' },
  kycRequestedAt: { type: Date },
  kycVerifiedAt: { type: Date },
  donationRequests: [{
    platform: { type: String }, // e.g. 'Gitcoin', 'OpenCollective', 'Patreon', etc.
    url: { type: String },
    description: { type: String },
    active: { type: Boolean, default: true },
  }],
  fundraisers: [{
    id: { type: String },
    title: { type: String },
    description: { type: String },
    target: { type: Number },
    raised: { type: Number, default: 0 },
    walletAddress: { type: String },
    owner: { type: String },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    active: { type: Boolean, default: true },
    privacy: { type: String, enum: ['public', 'circle'], default: 'public' },
    circle: [{ type: String }],
  }],
  verificationScore: { type: Number, default: 0 },
  profileUpdateHistory: [{ type: Date }], // for rate limiting
  featuredCharityId: { type: String },
  activeEventId: { type: Schema.Types.ObjectId, ref: 'Event' },
  donationLink: { type: String },
  donationWidgetEmbed: {
    widgetId: { type: String },
    charityId: { type: String },
  },

  // v8: wallet follow list
  followedWallets: [{
    chain: { type: String },
    address: { type: String },
    createdAt: { type: Date, default: Date.now },
  }],

  // v4 admin fields
  blacklisted: { type: Boolean, default: false },
  blacklistReason: { type: String },
  blacklistedAt: { type: Date },
  banned: { type: Boolean, default: false },
  bannedReason: { type: String },
  bannedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default models.User || model('User', UserSchema);