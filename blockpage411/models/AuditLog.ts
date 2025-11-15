import { Schema, models, model } from 'mongoose';

const AuditLogSchema = new Schema({
  action: { type: String, required: true },
  user: { type: String },
  targetType: { type: String },
  targetId: { type: String },
  data: { type: Schema.Types.Mixed },
  ip: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default models.AuditLog || model('AuditLog', AuditLogSchema);
