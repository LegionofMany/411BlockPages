import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Report from 'lib/reportModel';
import jwt from 'jsonwebtoken';
import Provider from 'lib/providerModel';
import Wallet from 'lib/walletModel';

const JWT_SECRET = process.env.JWT_SECRET as string;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  let payload: unknown;
  try { payload = jwt.verify(token, JWT_SECRET); } catch { return res.status(401).json({ message: 'Invalid token' }); }
  const reporterUserId = (payload && typeof payload === 'object' && 'address' in payload) ? (payload as { address?: string }).address : undefined;
  if (!reporterUserId) return res.status(401).json({ message: 'Invalid token payload' });
  const { reporterWalletId, providerId, suspectAddress, chain, evidence } = req.body;
  if (!suspectAddress || !chain) return res.status(400).json({ message: 'suspectAddress and chain required' });
  await dbConnect();
  // optionally ensure wallet belongs to user
  if (reporterWalletId) {
    const w = await Wallet.findById(reporterWalletId);
    if (!w) return res.status(400).json({ message: 'reporter wallet not found' });
  }
  // if providerId is provided but doesn't exist, reject
  if (providerId) {
    const p = await Provider.findById(providerId);
    if (!p) return res.status(400).json({ message: 'provider not found' });
  }
  const report = await Report.create({ reporterUserId, reporterWalletId, providerId, suspectAddress, chain, evidence: evidence || [] });
  // mirror to Wallet.flags if the suspect wallet exists
  try {
    const wallet = await Wallet.findOne({ address: suspectAddress, chain });
    if (wallet) {
      wallet.flags.push({ user: reporterUserId, reason: 'Reported via provider flow', date: new Date() });
      await wallet.save();
    }
  } catch (e) {
    console.warn('mirror to wallet.flags failed', e);
  }
  // update provider counters if providerId provided
  if (providerId) {
    try {
      // increment total reports
      await Provider.findByIdAndUpdate(providerId, { $inc: { reportsCount: 1 } });
      // increment unique reporters if this user hasn't reported this provider before
      const seen = await Report.findOne({ providerId, reporterUserId });
      if (!seen) {
        await Provider.findByIdAndUpdate(providerId, { $inc: { uniqueReporters: 1 } });
      }
    } catch (e) {
      console.warn('failed updating provider counters', e);
    }
  }
  res.status(201).json(report);
}
