import type { NextApiRequest, NextApiResponse } from 'next';
import Alert from '../../../../lib/alertModel';
import { isAdminRequest } from '../../../../lib/admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdminRequest(req)) return res.status(403).json({ error: 'forbidden' });

  try {
    // ensure mongoose connection available (lib/db handles it elsewhere in app startup)
    const pending = await Alert.countDocuments({ status: 'pending' });
    const failed = await Alert.countDocuments({ status: 'failed' });
    const total = await Alert.countDocuments({});

    return res.status(200).json({ ok: true, counts: { pending, failed, total } });
  } catch (err: unknown) {
    console.error('alerts/health error', err);
  const e = err as Record<string, unknown> | undefined;
  const message = e && typeof e.message === 'string' ? e.message : String(err);
  return res.status(500).json({ ok: false, error: message });
  }
}
