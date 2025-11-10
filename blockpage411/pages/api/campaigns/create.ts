import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/db';
import Wallet from '../../../lib/walletModel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  await dbConnect();
  const { address, chain, title, description, goal, wallet, expiry } = req.body;
  if (!address || !chain || !title || !wallet) return res.status(400).json({ error: 'missing' });
  // enforce expiry <= 90 days
  const maxExpiry = new Date();
  maxExpiry.setDate(maxExpiry.getDate() + 90);
  const exp = expiry ? new Date(expiry) : maxExpiry;
  if (exp > maxExpiry) return res.status(400).json({ error: 'expiry too long' });

  let w = await Wallet.findOne({ address: address.toLowerCase(), chain }).exec();
  if (!w) {
    w = await Wallet.create({ address: address.toLowerCase(), chain });
  }
  w.campaigns = w.campaigns || [];
  w.campaigns.unshift({ title, description, goal: Number(goal) || 0, wallet, expiry: exp, active: true, createdAt: new Date() });
  await w.save();
  return res.status(201).json({ ok: true, campaigns: w.campaigns });
}
