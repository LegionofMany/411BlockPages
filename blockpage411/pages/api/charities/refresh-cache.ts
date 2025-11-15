import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchGivingBlockCharities } from '../../../utils/givingblock';
import { withAdminAuth } from '../../../lib/adminMiddleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }
  try {
    const list = await fetchGivingBlockCharities();
    return res.status(200).json({ ok: true, count: Array.isArray(list) ? list.length : 0 });
  } catch (e: unknown) {
    const errMsg = e && typeof e === 'object' && Object.prototype.hasOwnProperty.call(e, 'message') ? String((e as Record<string, unknown>)['message']) : String(e);
    return res.status(500).json({ error: errMsg });
  }
}

let exported: any = handler;
if (process.env.NODE_ENV !== 'development') exported = withAdminAuth(handler);
export default exported;
