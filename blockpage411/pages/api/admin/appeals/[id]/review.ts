import type { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '../../../../../lib/adminMiddleware';
import dbConnect from '../../../../../lib/db';
import { Schema, models, model } from 'mongoose';

const AppealSchema = new Schema({
  chain: { type: String, required: true },
  address: { type: String, required: true },
  contactEmail: { type: String },
  evidence: { type: [String], default: [] },
  status: { type: String, enum: ['under_review','resolved','rejected'], default: 'under_review' },
}, { timestamps: true });

const Appeal = models.Appeal || model('Appeal', AppealSchema);

export default withAdminAuth(async function handler(req: NextApiRequest, res: NextApiResponse){
  const { id } = req.query;
  if (!id) return res.status(400).json({ message: 'id required' });
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const { action } = req.body || {};
  if (!['resolved','rejected'].includes(action)) return res.status(400).json({ message: 'invalid action' });
  await dbConnect();
  const a = await Appeal.findById(String(id));
  if (!a) return res.status(404).json({ message: 'appeal not found' });
  a.status = action;
  await a.save();
  // Audit log and email notification (best-effort)
  try {
    const AuditLog = require('../../../../../lib/auditLogModel').default;
    await AuditLog.create({ type: 'appeal.review', actor: req.headers['x-admin-address'] || 'unknown', target: a.address, action: action, meta: { appealId: a._id } });
  } catch (e) { console.warn('audit log failed', e); }

  try {
    const transporter = require('../../../../../lib/mailer').getTransporter();
    const from = process.env.MAIL_FROM || process.env.SMTP_USER || `no-reply@${(process.env.APP_URL || '').replace(/^https?:\/\//,'')}`;
    const to = a.contactEmail || process.env.ADMIN_NOTIFICATION_EMAIL;
    if (to) {
      const subject = `Appeal ${action}`;
      const text = `Your appeal for ${a.address} on ${a.chain} was marked: ${action}`;
      transporter.sendMail({ from, to, subject, text }).catch((err: any)=> console.warn('appeal notify failed', err && err.message ? err.message : err));
    }
  } catch (e) { console.warn('appeal notify failed', e); }

  res.status(200).json({ success: true, id: a._id, status: a.status });
});
