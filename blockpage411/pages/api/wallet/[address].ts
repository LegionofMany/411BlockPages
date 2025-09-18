import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Wallet from 'lib/walletModel';
import axios from 'axios';

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY as string;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query;
  if (!address || typeof address !== 'string') {
    return res.status(400).json({ message: 'Address required' });
  }
  await dbConnect();
  let wallet = await Wallet.findOne({ address });
  if (!wallet) {
    wallet = await Wallet.create({ address });
  }
  // Fetch transactions from Etherscan
  let txs = [];
  try {
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
    const { data } = await axios.get(url);
    if (data.status === '1') {
      txs = data.result;
    }
  } catch (e) {
    // ignore tx errors
  }
  res.status(200).json({
    address: wallet.address,
    flags: wallet.flags,
    ratings: wallet.ratings,
    avgRating: wallet.avgRating,
    transactions: txs,
  });
}
