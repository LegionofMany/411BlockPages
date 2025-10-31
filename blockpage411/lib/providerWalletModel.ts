import mongoose from 'mongoose';

const ProviderWalletSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
  address: { type: String, required: true, index: true },
  chain: { type: String, required: true, index: true },
  note: { type: String },
  source: { type: String },
}, { timestamps: true });

export default mongoose.models.ProviderWallet || mongoose.model('ProviderWallet', ProviderWalletSchema);
