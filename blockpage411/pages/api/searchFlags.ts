import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Wallet from 'lib/walletModel';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  await dbConnect();
  const { address, chain, search, flaggedOnly } = req.query;
  const query: Record<string, unknown> = {};
  if (address) query.address = address;
  if (chain) query.chain = chain;
  if (flaggedOnly === 'true') query['flags.0'] = { $exists: true };
  let wallets = await Wallet.find(query);
  // Filter flags by comment search if provided
  if (search) {
    wallets = wallets.map((wallet) => {
      wallet.flags = wallet.flags.filter((flag: { comment?: string }) => flag.comment && flag.comment.includes(search as string));
      return wallet;
    });
  }
  res.status(200).json(wallets);
}
