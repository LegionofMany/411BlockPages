import { Schema, models, model } from 'mongoose';

const ReportSchema = new Schema({
  reporterUserId: { type: String, required: true },
  reporterWalletId: { type: Schema.Types.ObjectId, ref: 'Wallet' },
  providerId: { type: Schema.Types.ObjectId, ref: 'Provider' },
  suspectAddress: { type: String, required: true },
  chain: { type: String, required: true },
  evidence: { type: [String], default: [] },
  status: { type: String, enum: ['open','reviewed','closed'], default: 'open' },
}, { timestamps: true });

export default models.Report || model('Report', ReportSchema);
