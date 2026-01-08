import { Schema, models, model } from 'mongoose';

const FlagSchema = new Schema({
  source: { type: String, required: true },
  category: { type: String, required: true },
  confidence: { type: String, enum: ['low','medium','high'], required: true },
  evidence_url: { type: String },
  first_seen: { type: Date, required: true },
}, { _id: false });

const BehaviorSignalsSchema = new Schema({
  rapid_fund_hopping: { type: Boolean, default: false },
  mixer_proximity: { type: Boolean, default: false },
  scam_cluster_exposure_score: { type: Number, default: 0 },
}, { _id: false });

const WalletRiskSchema = new Schema({
  chain: { type: String, required: true, index: true },
  address: { type: String, required: true, index: true },
  risk_score: { type: Number, default: 0 },
  risk_level: { type: String, enum: ['low','medium','high'], default: 'low' },
  flags: { type: [FlagSchema], default: [] },
  behavior_signals: { type: BehaviorSignalsSchema, default: {} },
  last_updated: { type: Date, default: Date.now },
}, { timestamps: true });

WalletRiskSchema.index({ chain: 1, address: 1 }, { unique: true });

export default models.WalletRisk || model('WalletRisk', WalletRiskSchema);
