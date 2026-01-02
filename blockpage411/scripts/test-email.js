require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

(async () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = (process.env.SMTP_SECURE === 'true' || port === 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.error('Missing SMTP_USER or SMTP_PASS in environment');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('SMTP verified');

    const to = process.env.ADMIN_NOTIFICATION_EMAIL || user;
    const from = process.env.MAIL_FROM || user;
    const subject = 'Blockpages411 SMTP test';
    const text = `Test email from Blockpages411 at ${new Date().toISOString()}`;
    const html = `<p>Test email from <strong>Blockpages411</strong></p><p>Time: ${new Date().toISOString()}</p><p>App URL: ${process.env.APP_URL || ''}</p>`;

    const info = await transporter.sendMail({ from, to, subject, text, html });
    console.log('Message sent OK');
    console.log(info);
  } catch (err) {
    console.error('Error sending test email:', err && err.message ? err.message : err);
    process.exit(2);
  }
})();
