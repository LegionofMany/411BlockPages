import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../../lib/db';
import Pledge from '../../../../models/Pledge';
import { isAdminRequest } from '../../../../lib/admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdminRequest(req)) return res.status(403).json({ ok: false, message: 'forbidden' });
  await dbConnect();
  const { method } = req;
  if (method === 'GET') {
    const q: Record<string, unknown> = {};
    if (req.query.fundraiserId) q.fundraiserId = String(req.query.fundraiserId);
    const list = await Pledge.find(q).sort({ createdAt: -1 }).limit(1000).lean();
    if (String(req.query.format || '').toLowerCase() === 'csv') {
      // stream CSV
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="pledges.csv"');
      const rows = list.map(p => `${p.fundraiserId},${p.externalId},${p.amount},${p.currency},${(p.donor||'').replace(/,/g,'')},${p.status || ''},${p.createdAt}`);
      res.send(['fundraiserId,externalId,amount,currency,donor,status,createdAt', ...rows].join('\n'));
      return;
    }
    return res.json({ ok: true, pledges: list });
  }
  res.setHeader('Allow', ['GET']);
  res.status(405).end(`Method ${method} Not Allowed`);
}
