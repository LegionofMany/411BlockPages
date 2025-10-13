#!/usr/bin/env ts-node
/**
 * Simple retry worker that finds failed or pending alerts and retries delivery.
 * Intended to be run from a process manager or cron job.
 */
import dbConnect from '../lib/db';

async function main() {
  await dbConnect();
  const { default: Alert } = await import('../lib/alertModel');
  const { resendAlert } = await import('../lib/slack');

  // Find alerts that are pending or failed but with attempts less than max
  const maxAttempts = Number(process.env.SLACK_MAX_ATTEMPTS ?? 3);
  const candidates = await Alert.find({ status: { $in: ['pending','failed'] }, attempts: { $lt: maxAttempts } }).limit(50).sort({ createdAt: 1 }).lean();
  for (const c of candidates) {
    try {
      console.log('Retrying alert', c._id?.toString());
      await resendAlert(String(c._id));
    } catch (err) {
      console.error('Retry failed for', c._id, err);
    }
  }
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(2); });
