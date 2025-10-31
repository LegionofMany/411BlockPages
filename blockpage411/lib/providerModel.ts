import { Schema, models, model } from 'mongoose';

const ProviderSchema = new Schema({
  name: { type: String, required: true, index: true },
  aliases: { type: [String], default: [] },
  type: { type: String, enum: ['CEX', 'DEX', 'Wallet', 'Other'], default: 'CEX' },
  website: { type: String },
  market_cap: { type: Number },
  rank: { type: Number },
  status: { type: String, enum: ['seeded', 'pending', 'approved'], default: 'seeded' },
  seeded: { type: Boolean, default: false },
  readyForOutreach: { type: Boolean, default: false },
  reportsCount: { type: Number, default: 0 },
  uniqueReporters: { type: Number, default: 0 },
}, { timestamps: true });

ProviderSchema.index({ name: 'text', aliases: 'text' });

export default models.Provider || model('Provider', ProviderSchema);
