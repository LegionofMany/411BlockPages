import type { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '../../../../lib/adminMiddleware';
import dbConnect from '../../../../lib/db';
import { Schema, models, model } from 'mongoose';

const AppealSchema = new Schema({
  chain: { type: String, required: true },
  address: { type: String, required: true },
  contactEmail: { type: String },
  evidence: { type: [String], default: [] },
  status: { type: String, enum: ['under_review','resolved','rejected'], default: 'under_review' },
}, { timestamps: true });

const Appeal = models.Appeal || model('Appeal', AppealSchema);

export default withAdminAuth(async function handler(req: NextApiRequest, res: NextApiResponse){
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  await dbConnect();
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(200, Math.max(10, Number(req.query.limit || 50)));
  const skip = (page - 1) * limit;

  const filter: any = {};
  if (req.query.chain) filter.chain = String(req.query.chain);
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.address) filter.address = String(req.query.address).toLowerCase();

  const [items, total] = await Promise.all([
    Appeal.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Appeal.countDocuments(filter),
  ]);

  res.status(200).json({ items: items || [], page, pageSize: limit, total });
});
