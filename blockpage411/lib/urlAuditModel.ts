import { Schema, models, model } from 'mongoose';

const UrlAuditSchema = new Schema({
  url: { type: String, required: true },
  finalUrl: { type: String },
  hostname: { type: String },
  statusCode: { type: Number },
  contentType: { type: String },
  truncated: { type: Boolean, default: false },

  riskScore: { type: Number, required: true },
  riskCategory: { type: String, required: true },
  reasons: { type: [String], default: [] },
  signals: { type: Schema.Types.Mixed },

  actor: { type: String },
  createdAt: { type: Date, default: Date.now },
});

UrlAuditSchema.index({ createdAt: -1 });
UrlAuditSchema.index({ hostname: 1, createdAt: -1 });

export default models.UrlAudit || model('UrlAudit', UrlAuditSchema);
