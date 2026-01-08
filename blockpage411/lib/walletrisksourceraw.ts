import { Schema, models, model } from 'mongoose';

const RawSchema = new Schema({
  source: { type: String, required: true },
  chain: { type: String },
  fetched_at: { type: Date, default: Date.now },
  raw: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

export default models.WalletRiskSourceRaw || model('WalletRiskSourceRaw', RawSchema);
