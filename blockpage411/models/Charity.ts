import { Schema, models, model } from 'mongoose';

const CharitySchema = new Schema({
  givingBlockId: { type: String, index: true },
  name: { type: String, required: true, index: true },
  description: { type: String },
  website: { type: String },
  logo: { type: String },
  wallet: { type: String },
  tags: [{ type: String }],
  givingBlockEmbedUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default models.Charity || model('Charity', CharitySchema);
