import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Wallet from 'lib/walletModel';
import Flag from 'models/Flag';
import { getBalanceFlagThreshold } from 'lib/config';
import { computeTrustScore } from 'services/trustScoreService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { chain, address } = req.query;
  if (!chain || typeof chain !== 'string' || !address || typeof address !== 'string') {
    res.status(400).json({ error: 'chain and address required' });
    return;
  }

  await dbConnect();

  const normalizedAddress = address.toLowerCase();
  const normalizedChain = chain.toLowerCase();

  const wallet = await Wallet.findOne({ address: normalizedAddress, chain: normalizedChain }).lean() as any;

  // If Wallet document exists, prefer its flagsCount; otherwise compute from Flag collection
  let flagsCount = wallet?.flagsCount ?? 0;
  if (flagsCount === 0) {
    flagsCount = await Flag.countDocuments({ walletAddress: normalizedAddress, chain: normalizedChain });
  }

  const threshold = wallet?.flagThreshold ?? getBalanceFlagThreshold();
  const showBalance = flagsCount >= threshold;
  const isBlacklisted = !!wallet?.blacklisted;
  const lastFlagger = wallet?.lastFlagger || null;

  const trustScore = computeTrustScore({ verifiedLinksCount: 0, flagsCount });

  res.status(200).json({
    walletAddress: normalizedAddress,
    chain: normalizedChain,
    flags: flagsCount,
    isBlacklisted,
    lastFlagger,
    showBalance,
    trustScore,
  });
}
