import type { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from 'lib/adminMiddleware';
import dbConnect from 'lib/db';
import Report from 'lib/reportModel';
import Wallet from 'lib/walletModel';
import AuditLog from 'lib/auditLogModel';
import User from 'lib/userModel';
import getTransporter from 'lib/mailer';

export default withAdminAuth(async function handler(req: NextApiRequest, res: NextApiResponse){
  const { id } = req.query;
  const admin = req.headers['x-admin-address']?.toString().toLowerCase();
  if (!id) return res.status(400).json({ message: 'id required' });
  await dbConnect();
  const report = await Report.findById(String(id));
  if (!report) return res.status(404).json({ message: 'report not found' });
  report.status = 'closed';
  await report.save();

  // Audit log
  try {
    await AuditLog.create({ type: 'report.dismiss', actor: admin || 'unknown', target: report.suspectAddress, action: 'dismiss', meta: { reportId: report._id } });
  } catch (e) { console.warn('audit log failed', e); }

  // Optionally remove mirrored wallet flag (best-effort)
  try{
    if (report.suspectAddress && report.chain){
      const wallet = await Wallet.findOne({ address: report.suspectAddress, chain: report.chain });
      if (wallet && Array.isArray(wallet.flags)){
        wallet.flags = wallet.flags.filter((f: { user?: string; reason?: string })=> !(f.user === report.reporterUserId && f.reason && f.reason.includes('Reported via provider')));
        await wallet.save();
      }
    }
  }catch(e){ console.warn('failed removing wallet flag', e); }

  // Send notification email to reporter if they have email on file
  try {
    if (report.reporterUserId) {
      const user = await User.findOne({ address: String(report.reporterUserId).toLowerCase() }).lean();
      if (user && user.email) {
        const transporter = getTransporter();
        const from = process.env.MAIL_FROM || process.env.SMTP_USER || `no-reply@${(process.env.APP_URL || '').replace(/^https?:\/\//,'')}`;
        const subject = 'Your report was dismissed';
        const text = `Your report for ${report.suspectAddress} on ${report.chain} was dismissed by moderation.`;
        transporter.sendMail({ from, to: user.email, subject, text }).catch(err => console.warn('notify reporter failed', err && err.message ? err.message : err));
      }
    }
  } catch (e) { console.warn('report dismiss notify failed', e); }

  res.status(200).json({ success: true });
});
