import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../lib/db';
import Wallet from '../../lib/walletModel';

// Types for Wallet document
type WalletDoc = {
  address: string;
  chain: string;
  ens?: string;
  avgRating?: number;
  nftCount?: number;
  blacklisted?: boolean;
  flags?: { reason: string; user: string; date: string }[];
  kycStatus?: string;
};
// Helper to get status tags for a wallet
function getStatusTags(wallet: WalletDoc) {
  const tags = [];
  if (wallet?.blacklisted) tags.push('Blacklisted');
  if (wallet?.flags && wallet.flags.length > 0) tags.push(`Flagged (${wallet.flags.length})`);
  if (wallet?.kycStatus === 'verified') tags.push('Verified');
  return tags;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let { q, chain } = req.query;
  // Ensure q and chain are always strings
  q = Array.isArray(q) ? q[0] : q;
  chain = Array.isArray(chain) ? chain[0] : chain;
  await dbConnect();
  // Simple search: match address substring, filter by chain if provided
  const query: Record<string, unknown> = { };
  if (q) query.address = { $regex: q, $options: 'i' };
  if (chain) query.chain = chain;
  query.blacklisted = { $ne: true };
  console.log('SEARCH API: query', query);
  const results = await Wallet.find(query).limit(20);
  console.log('SEARCH API: found', results.length, 'results');
  let profiles = results.map((w: WalletDoc) => ({
    address: w.address,
    chain: w.chain,
    ens: w.ens,
    avgRating: w.avgRating,
    nftCount: w.nftCount,
    statusTags: getStatusTags(w),
  }));
  // If no results, return a default profile for the searched address/chain
  if (profiles.length === 0 && q && chain) {
    profiles = [{
      address: q,
      chain: chain,
      ens: undefined,
      avgRating: undefined,
      nftCount: undefined,
      statusTags: [],
    }];
  }
  res.status(200).json({ results: profiles });
}
