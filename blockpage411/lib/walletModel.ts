import { Schema, models, model } from 'mongoose';

const FlagSchema = new Schema({
  user: { type: String, required: true },
  reason: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const RatingSchema = new Schema({
  user: { type: String, required: true },
  score: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});


const WalletSchema = new Schema({
  address: { type: String, required: true },
  chain: { type: String, required: true },
  flags: [FlagSchema],
  ratings: [RatingSchema],
  avgRating: { type: Number, default: 0 },
  ens: { type: String },
  nftCount: { type: Number, default: 0 },
  lastRefreshed: { type: Date },
});

WalletSchema.index({ address: 1, chain: 1 }, { unique: true });

export default models.Wallet || model('Wallet', WalletSchema);