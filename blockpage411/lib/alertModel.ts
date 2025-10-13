import { Schema, models, model } from 'mongoose';

const AlertSchema = new Schema({
  level: { type: String, enum: ['info', 'warning', 'error'], default: 'info' },
  fundraiserId: { type: String },
  fundraiserTitle: { type: String },
  txHash: { type: String },
  chain: { type: String },
  amount: { type: Schema.Types.Mixed },
  currency: { type: String },
  message: { type: String },
  status: { type: String, enum: ['pending','sent','failed'], default: 'pending' },
  attempts: { type: Number, default: 0 },
  lastError: { type: String },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

export default models.Alert || model('Alert', AlertSchema);
