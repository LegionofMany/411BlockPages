import { Schema, models, model } from 'mongoose';

const PledgeSchema = new Schema({
  fundraiserId: { type: String, required: true, index: true },
  externalId: { type: String, required: true }, // payment id or tx hash
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  donor: { type: String },
  status: { type: String, enum: ['pending','completed','failed'], default: 'pending' },
  raw: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

PledgeSchema.index({ fundraiserId: 1, externalId: 1 }, { unique: true });

export default models.Pledge || model('Pledge', PledgeSchema);
