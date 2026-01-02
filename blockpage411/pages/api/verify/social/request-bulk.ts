import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/db';
import User from '../../../../lib/userModel';
import redisRateLimit from '../../../../lib/redisRateLimit';
import getTransporter from '../../../../lib/mailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  const jwt = await import('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET as string;
  let payload: any;
  try { payload = jwt.verify(token, JWT_SECRET); } catch { return res.status(401).json({ message: 'Invalid token' }); }
  const userAddress = typeof payload === 'object' && payload !== null ? payload.address as string : undefined;
  if (!userAddress) return res.status(401).json({ message: 'Invalid token payload' });

  const allowed = await redisRateLimit(req, res, { windowSec: 300, max: 5, keyPrefix: 'rl:verify:request-bulk:' });
  if (!allowed) return;

  const { handles } = req.body as { handles?: Array<{ platform: string; handle: string }> };
  if (!Array.isArray(handles) || handles.length === 0) return res.status(400).json({ message: 'No handles provided' });

  await dbConnect();
  const user = await User.findOne({ address: userAddress });
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.pendingSocialVerifications = user.pendingSocialVerifications || [];
  const added: Array<{ platform: string; handle: string }> = [];
  for (const entry of handles) {
    const platform = String(entry.platform || '').trim();
    const handle = String(entry.handle || '').trim();
    if (!platform || !handle) continue;
    // avoid duplicates
    const exists = (user.pendingSocialVerifications || []).some((p: any) => p.platform === platform && p.handle === handle);
    if (exists) continue;
    user.pendingSocialVerifications.push({ platform, handle, adminRequested: true, createdAt: new Date() } as any);
    added.push({ platform, handle });
  }
  user.updatedAt = new Date();
  await user.save();

  // Notify admins by email about the new pending social verification requests
  (async () => {
    try {
      const adminTo = (process.env.ADMIN_NOTIFICATION_EMAIL || '').split(',').map(s => s.trim()).filter(Boolean);
      if (adminTo.length > 0 && added.length > 0) {
        const from = process.env.MAIL_FROM || process.env.SMTP_USER || `no-reply@${(process.env.APP_URL || '').replace(/^https?:\/\//, '')}`;
        const appUrl = process.env.APP_URL || 'https://www.blockpages411.com';
        const transporter = getTransporter();

        const rows = added.map(a => `<li><strong>${a.platform}</strong>: <code>${a.handle}</code></li>`).join('');
        const html = `
          <div style="font-family:Arial,Helvetica,sans-serif;color:#111;">
            <h3>New social verification requests</h3>
            <p>User: <code>${user.address}</code></p>
            <p>Requests:</p>
            <ul>${rows}</ul>
            <p>Review here: <a href="${appUrl}/admin/kyc-review">${appUrl}/admin/kyc-review</a></p>
            <hr/>
            <p style="font-size:12px;color:#666">Sent by Blockpages411</p>
          </div>
        `;

        await (transporter as any).sendMail({
          from,
          to: adminTo,
          subject: `[Blockpages411] ${added.length} new social verification request(s)`,
          html,
          text: `${added.length} new social verification request(s) for ${user.address}. Review: ${appUrl}/admin/kyc-review`,
        });
      }
    } catch (err) {
      console.warn('[notify] failed to send admin notification', err && (err as any).message ? (err as any).message : err);
    }
  })();

  res.status(200).json({ ok: true, message: `Requested review for ${added.length} handle(s)`, added });
}
