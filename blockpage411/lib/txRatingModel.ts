import { Schema, models, model } from 'mongoose';

const TxRatingSchema = new Schema(
  {
    chain: { type: String, required: true, index: true },
    txHash: { type: String, required: true, index: true },
    from: { type: String, required: true, index: true },
    to: { type: String },
    amountNative: { type: String, default: '' },
    rater: { type: String, required: true, index: true },
    score: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, default: '' },
  },
  { timestamps: true },
);

TxRatingSchema.index({ chain: 1, txHash: 1, rater: 1 }, { unique: true });
TxRatingSchema.index({ chain: 1, from: 1, createdAt: -1 });

export default models.TxRating || model('TxRating', TxRatingSchema);
