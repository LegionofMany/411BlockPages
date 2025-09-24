import { Schema, models, model } from 'mongoose';

const AdminActionSchema = new Schema({
  admin: { type: String, required: true },
  action: { type: String, required: true }, // e.g. 'blacklist_wallet', 'dismiss_flag', 'deactivate_donation'
  target: { type: String }, // wallet or donation id
  reason: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export default models.AdminAction || model('AdminAction', AdminActionSchema);
