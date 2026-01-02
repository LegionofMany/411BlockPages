import nodemailer, { type Transporter } from 'nodemailer';

const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = Number(process.env.SMTP_PORT || 587);
const secureEnv = process.env.SMTP_SECURE || 'false';
const secure = secureEnv === 'true' || secureEnv === '1' || port === 465;

const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

let transporter: Transporter<any> | null = null;

export function getTransporter(): Transporter<any> {
  if (transporter) return transporter;
  const opts: any = {
    host,
    port,
    secure,
  };
  if (user && pass) opts.auth = { user, pass };
  // Use pooling for production to improve throughput
  opts.pool = true;
  opts.tls = { rejectUnauthorized: false };

  // Add configurable connection and verify timeouts to avoid long blocking waits
  const connectionTimeout = Number(process.env.SMTP_CONNECTION_TIMEOUT || 5000);
  opts.connectionTimeout = connectionTimeout;
  opts.greetingTimeout = connectionTimeout;

  transporter = nodemailer.createTransport(opts) as Transporter<any>;

  // Verify but don't block the request; use a timeout so failures are fast and logged
  const verifyTimeout = Number(process.env.SMTP_VERIFY_TIMEOUT || 5000);
  const verifyPromise = transporter.verify();
  const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('verify timeout')), verifyTimeout));
  Promise.race([verifyPromise, timeoutPromise])
    .then(() => {
      console.log('[mailer] SMTP transporter verified');
    })
    .catch((err) => {
      console.warn('[mailer] SMTP transporter verify failed', err && err.message ? err.message : err);
    });

  return transporter;
}

export default getTransporter;
