import { Schema, models, model, Document } from 'mongoose';

export interface FlagDocument extends Document {
  walletAddress: string;
  chain: string;
  flaggerAddress: string;
  reason?: string;
  createdAt: Date;
}

const FlagSchema = new Schema<FlagDocument>({
  walletAddress: { type: String, required: true },
  chain: { type: String, required: true },
  flaggerAddress: { type: String, required: true },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now },
});

FlagSchema.index({ walletAddress: 1, chain: 1 });
FlagSchema.index({ flaggerAddress: 1 });

export default models.Flag || model<FlagDocument>('Flag', FlagSchema);
