import { Schema, models, model } from 'mongoose';

const TransactionFlagSchema = new Schema({
  reason: { type: String, required: true },
  user: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const TransactionSchema = new Schema({
  txid: { type: String, required: true },
  chain: { type: String, required: true },
  address: { type: String, required: true }, // wallet address
  from: { type: String },
  to: { type: String },
  value: { type: String },
  date: { type: Date },
  type: { type: String },
  flagged: { type: Boolean, default: false },
  flags: [TransactionFlagSchema],
});

TransactionSchema.index({ txid: 1, chain: 1, address: 1 }, { unique: true });

export default models.Transaction || model('Transaction', TransactionSchema);
