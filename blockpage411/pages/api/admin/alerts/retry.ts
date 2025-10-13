import type { NextApiRequest, NextApiResponse } from 'next';
import { isAdminRequest } from '../../../../lib/admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow a poller secret header for Vercel Cron jobs or admin auth
  const secret = req.headers['x-poller-secret'] as string | undefined;
  if (secret && secret === process.env.POLLER_SECRET) {
    // ok
  } else if (!isAdminRequest(req)) {
    return res.status(403).json({ ok: false, error: 'forbidden' });
  }

  const { default: dbConnect } = await import('../../../../lib/db');
  const { default: Alert } = await import('../../../../lib/alertModel');
  const { resendAlert } = await import('../../../../lib/slack');
  await dbConnect();

  // Find pending or failed alerts that have remaining attempts
  const maxAttempts = Number(process.env.SLACK_MAX_ATTEMPTS ?? 3);
  const batchSize = Math.min(50, Number(process.env.ALERT_RETRY_BATCH ?? 10));
  const alerts = await Alert.find({ status: { $in: ['pending', 'failed'] }, attempts: { $lt: maxAttempts } }).sort({ createdAt: 1 }).limit(batchSize).exec();

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];
  for (const a of alerts) {
    try {
      const r = await resendAlert(String(a._id));
      results.push({ id: String(a._id), ok: !!r.ok, error: r.error ? String(r.error) : undefined });
    } catch (err) {
      results.push({ id: String(a._id), ok: false, error: String(err) });
    }
  }

  return res.status(200).json({ ok: true, processed: results.length, results });
}
