import nodemailer from 'nodemailer';

export async function notifyEmail(subject: string, text: string, html?: string) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;

  if (!host || !user || !pass || !to) return;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `${process.env.NEXT_PUBLIC_APP_NAME || 'App'} <${user}>`,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.warn('notifyEmail failed', err);
  }
}

export default notifyEmail;
