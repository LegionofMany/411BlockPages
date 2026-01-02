import { Schema, models, model } from 'mongoose';

const AuditLogSchema = new Schema({
  type: { type: String, required: true }, // e.g. 'kyc.request', 'kyc.verify'
  actor: { type: String }, // address of actor (user or admin)
  target: { type: String }, // address of target user/wallet
  action: { type: String, required: true },
  meta: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

export default models.AuditLog || model('AuditLog', AuditLogSchema);
