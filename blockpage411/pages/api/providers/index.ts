import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Provider from 'lib/providerModel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  if (req.method === 'GET') {
    const q = (req.query.q as string) || (req.query.query as string) || '';
    if (!q) {
      const list = await Provider.find({ status: { $in: ['seeded','approved'] } }).limit(50).lean();
      return res.status(200).json(list);
    }
    // text search + name startsWith
    const results = await Provider.find({
      $text: { $search: q },
      status: { $in: ['seeded','approved'] }
    }).limit(20).lean();
    if (results.length) return res.status(200).json(results);
    // fallback: regex match
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const fallback = await Provider.find({ name: regex, status: { $in: ['seeded','approved'] } }).limit(20).lean();
    return res.status(200).json(fallback);
  }
  if (req.method === 'POST') {
    // create pending provider (from user)
    const { name, type, website, aliases } = req.body;
    if (!name) return res.status(400).json({ message: 'name required' });
    const existing = await Provider.findOne({ name });
    if (existing) return res.status(200).json(existing);
    const prov = await Provider.create({ name, aliases: aliases || [], type: type || 'Other', website, seeded: false, status: 'pending' });
    return res.status(201).json(prov);
  }
  res.status(405).json({ message: 'Method not allowed' });
}
