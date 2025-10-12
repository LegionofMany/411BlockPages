import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Fundraiser from '../../../models/Fundraiser';
import { isAdminRequest } from '../../../lib/admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdminRequest(req)) return res.status(403).json({ ok: false, message: 'forbidden' });
  await dbConnect();

  const { method } = req;
  if (method === 'POST') {
    const { action, id } = req.body || {};
    if (!action || !id) return res.status(400).json({ ok: false, message: 'missing action or id' });

    if (action === 'approve') {
      await Fundraiser.updateOne({ id }, { $set: { status: 'approved', active: true } });
      return res.json({ ok: true });
    }
    if (action === 'flag') {
      await Fundraiser.updateOne({ id }, { $set: { status: 'flagged' } });
      return res.json({ ok: true });
    }
    if (action === 'close') {
      await Fundraiser.updateOne({ id }, { $set: { status: 'closed', active: false } });
      return res.json({ ok: true });
    }
    return res.status(400).json({ ok: false, message: 'unknown action' });
  }

  // GET: list fundraisers with query filters
  if (method === 'GET') {
    // req.query values can be string | string[] | undefined
    type QueryFilter = { status?: string };
    const q: QueryFilter = {};
    const status = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status;
    if (status) q.status = String(status);
    const list = await Fundraiser.find(q).limit(200).lean();
    return res.json({ ok: true, fundraisers: list });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${method} Not Allowed`);
}
