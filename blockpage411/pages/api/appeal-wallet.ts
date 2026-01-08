import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/db';
import { Schema, models, model } from 'mongoose';

const AppealSchema = new Schema({
  chain: { type: String, required: true },
  address: { type: String, required: true },
  contactEmail: { type: String },
  evidence: { type: [String], default: [] },
  status: { type: String, enum: ['under_review','resolved','rejected'], default: 'under_review' },
}, { timestamps: true });

const Appeal = models.Appeal || model('Appeal', AppealSchema);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { chain, address, contactEmail, evidence } = req.body || {};
  if (!chain || !address) return res.status(400).json({ error: 'Missing required fields' });

  await dbConnect();

  try {
    const a = await Appeal.create({ chain, address: String(address).toLowerCase(), contactEmail, evidence: Array.isArray(evidence) ? evidence : (evidence ? [evidence] : []) } as any);
    return res.status(201).json({ ok: true, id: a._id });
  } catch (err) {
    console.error('appeal-wallet error', err);
    return res.status(500).json({ error: 'Failed to store appeal' });
  }
}
