// pages/api/scanSuspicious.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Wallet from 'lib/walletModel';
import rateLimit from 'lib/rateLimit';

// Basic suspicious activity detection rules
function isSuspicious(wallet: { flags?: string[]; blacklisted?: boolean; suspicious?: boolean }) {
  // Example rules: many flags, recent large tx, blacklisted, etc.
  if ((wallet.flags?.length || 0) > 3) return true;
  if (wallet.blacklisted) return true;
  // Add more rules as needed
  return false;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  if (!rateLimit(req, res)) return;
  await dbConnect();
  const wallets = await Wallet.find({});
  let updated = 0;
  for (const wallet of wallets) {
    const suspicious = isSuspicious(wallet);
    if (wallet.suspicious !== suspicious) {
      wallet.suspicious = suspicious;
      await wallet.save();
      updated++;
    }
  }
  res.status(200).json({ success: true, updated });
}
