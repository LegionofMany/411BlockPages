import getTransporter from '../lib/mailer';

type Status = 'approved' | 'rejected' | 'verified' | 'rejected';

export async function sendKycEmail(opts: { to: string; status: 'approved' | 'rejected'; address?: string; chain?: string; fullName?: string }) {
  const to = opts.to;
  if (!to) throw new Error('Recipient email required');

  const from = process.env.MAIL_FROM || process.env.SMTP_USER || `no-reply@${(process.env.APP_URL || '').replace(/^https?:\/\//, '')}`;
  const appUrl = process.env.APP_URL || 'https://www.blockpages411.com';

  const subject = opts.status === 'approved' ? 'Your KYC was approved' : 'Your KYC was rejected';

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.4;color:#111;">
      <h2>${subject}</h2>
      <p>Hi ${opts.fullName || ''},</p>
      <p>Your KYC for wallet <strong>${opts.address || ''}</strong> on <strong>${opts.chain || ''}</strong> has been <strong>${opts.status}</strong>.</p>
      ${opts.status === 'rejected' ? '<p>If you believe this was a mistake, please contact support via the website.</p>' : ''}
      <p>View your account: <a href="${appUrl}">${appUrl}</a></p>
      <hr />
      <p style="font-size:12px;color:#666">This message was sent by Blockpages411. Do not reply to this email.</p>
    </div>
  `;

  const transporter = getTransporter();
  const mailOptions = {
    from,
    to,
    subject,
    text: `${subject} - ${appUrl}`,
    html,
  };

  const t = transporter as any;
  return t.sendMail(mailOptions);
}

export default sendKycEmail;
