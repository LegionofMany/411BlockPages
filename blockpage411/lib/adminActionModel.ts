import { Schema, models, model } from 'mongoose';

const AdminActionSchema = new Schema({
  admin: { type: String, required: true },
  action: { type: String, required: true }, // e.g. 'blacklist_wallet', 'dismiss_flag', 'deactivate_donation'
  target: { type: String }, // wallet or donation id
  reason: { type: String },
  timestamp: { type: Date, default: Date.now },
});

// Create a TTL index on timestamp to allow automatic expiry of old admin audit entries.
// Retention can be configured via ADMIN_ACTION_RETENTION_DAYS (default: 365 days)
const retentionDays = Number(process.env.ADMIN_ACTION_RETENTION_DAYS || 365);
if (retentionDays > 0){
  // expireAfterSeconds requires a numeric value in seconds
  try{
    AdminActionSchema.index({ timestamp: 1 }, { expireAfterSeconds: retentionDays * 24 * 60 * 60 });
  }catch{
    // index creation may be racy or happen later; ignore here
    console.warn('[adminActionModel] TTL index setup skipped');
  }
}

export default models.AdminAction || model('AdminAction', AdminActionSchema);
