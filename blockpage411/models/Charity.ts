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
  hidden?: boolean;
  createdAt: Date;
}

const CharitySchema = new Schema<CharityDocument>({
  givingBlockId: { type: String, index: true },
  charityId: { type: String },
  name: { type: String, required: true },
  description: { type: String, maxlength: 1200 },
  website: { type: String },
  logo: { type: String },
  wallet: { type: String },
  donationAddress: { type: String },
  tags: [{ type: String }],
  categories: [{ type: String }],
  givingBlockEmbedUrl: { type: String },
  hidden: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Compound indexes defined explicitly to avoid duplicates from field-level index flags
CharitySchema.index({ charityId: 1 });
CharitySchema.index({ name: 1 });

export default models.Charity || model<CharityDocument>('Charity', CharitySchema);
