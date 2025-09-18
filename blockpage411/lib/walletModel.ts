import mongoose, { Schema, models, model } from 'mongoose';

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
  address: { type: String, required: true, unique: true },
  flags: [FlagSchema],
  ratings: [RatingSchema],
  avgRating: { type: Number, default: 0 },
});

export default models.Wallet || model('Wallet', WalletSchema);