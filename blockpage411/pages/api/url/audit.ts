import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import rateLimit from '../../../lib/rateLimit';
import UrlAudit from '../../../lib/urlAuditModel';
import { auditUrl } from '../../../services/urlAudit/auditUrl';
import { notifyAdmin } from '../../../lib/notify';
import notifyEmail from '../../../lib/notifyEmail';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!rateLimit(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { url } = req.body as { url?: string };
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ message: 'url is required' });
  }

  await dbConnect();

  const result = await auditUrl(url);

  const doc = await UrlAudit.create({
    url: result.url,
    finalUrl: result.finalUrl,
    hostname: result.hostname,
    statusCode: result.statusCode,
    contentType: result.contentType,
    truncated: result.truncated,
    riskScore: result.riskScore,
    riskCategory: result.riskCategory,
    reasons: result.reasons,
    signals: result.signals,
    createdAt: new Date(),
  });

  const alertScore = Math.max(0, Math.min(100, parseInt(process.env.URL_AUDIT_ALERT_SCORE || '70', 10) || 70));
  if (result.riskScore >= alertScore) {
    const subject = `[Blockpage411] High-risk URL audit (${result.riskScore})`;
    const body = `URL: ${result.url}\nHost: ${result.hostname}\nScore: ${result.riskScore} (${result.riskCategory})\nReasons: ${result.reasons.join('; ')}`;
    await notifyAdmin(subject, { url: result.url, hostname: result.hostname, score: result.riskScore, reasons: result.reasons });
    await notifyEmail(subject, body);
  }

  return res.status(200).json({ audit: doc });
}
