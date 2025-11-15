import { Schema, models, model, Document } from 'mongoose';

export interface CharityDocument extends Document {
  givingBlockId?: string;
  charityId?: string;
  name: string;
  description?: string;
  website?: string;
  logo?: string;
  wallet?: string;
  donationAddress?: string;
  tags?: string[];
  categories?: string[];
  givingBlockEmbedUrl?: string;
  createdAt: Date;
}

const CharitySchema = new Schema<CharityDocument>({
  givingBlockId: { type: String, index: true },
  charityId: { type: String, index: true },
  name: { type: String, required: true, index: true },
  description: { type: String },
  website: { type: String },
  logo: { type: String },
  wallet: { type: String },
  donationAddress: { type: String },
  tags: [{ type: String }],
  categories: [{ type: String }],
  givingBlockEmbedUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

CharitySchema.index({ charityId: 1 });
CharitySchema.index({ name: 1 });

export default models.Charity || model<CharityDocument>('Charity', CharitySchema);
