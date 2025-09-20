import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Wallet from 'lib/walletModel';

import axios from 'axios';
import { fetchSolanaTxs } from '../../../services/solscan';
import { fetchTronTxs } from '../../../services/tronscan';

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY as string;


// Map supported chain slugs to Etherscan V2 chain IDs
const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  bsc: 56,
  polygon: 137,
  arbitrum: 42161,
  optimism: 10,
  base: 8453,
  avalanche: 43114,
  fantom: 250,
  gnosis: 100,
  celo: 42220,
  moonbeam: 1284,
  moonriver: 1285,
  cronos: 25,
  aurora: 1313161554,
  harmony: 1666600000,
  kava: 2222,
  metis: 1088,
  okc: 66,
  polygonzkevm: 1101,
  scroll: 534352,
  zkSync: 324,
  linea: 59144,
  mantle: 5000,
  boba: 288,
  fuse: 122,
  syscoin: 57,
  tomochain: 88,
  xdc: 50,
  canto: 7700,
  conflux: 1030,
  dogechain: 2000,
  evmos: 9001,
  klaytn: 8217,
  moonbase: 1287,
  palm: 11297108109,
  shiden: 336,
  songbird: 19,
  telos: 40,
  xlayer: 196,
  zetachain: 7000,
  // Add more as needed from https://docs.etherscan.io/supported-chains
};

async function fetchEvmTxs(chain: string, address: string) {
  const chainId = CHAIN_IDS[chain];
  if (!chainId) return [];
  const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=account&action=txlist&address=${address}&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
  try {
    const { data } = await axios.get(url);
    // V2 returns { status, message, result }
    if (data.status === '1') return data.result;
  } catch {}
  return [];
}

async function fetchBitcoinTxs(address: string) {
  try {
    const { data } = await axios.get(`https://blockstream.info/api/address/${address}/txs`);
    return data;
  } catch {
    return [];
  }
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { chain, address } = req.query;
  if (!chain || typeof chain !== 'string' || !address || typeof address !== 'string') {
    return res.status(400).json({ message: 'Chain and address required' });
  }
  await dbConnect();
  let wallet = await Wallet.findOne({ address, chain });
  const now = new Date();
  let txs: any[] = [];
  let shouldUpdate = false;
  // Check if we have cached txs and if they are fresh (<= 15 min)
  if (wallet && wallet.lastRefreshed && wallet.transactions && Array.isArray(wallet.transactions)) {
    const age = (now.getTime() - new Date(wallet.lastRefreshed).getTime()) / 1000;
    if (age <= 900) {
      txs = wallet.transactions;
    } else {
      shouldUpdate = true;
    }
  } else {
    shouldUpdate = true;
  }

  if (shouldUpdate) {
    try {
      if (chain === 'bitcoin') {
        txs = await fetchBitcoinTxs(address);
      } else if (chain === 'solana') {
        txs = await fetchSolanaTxs(address);
      } else if (chain === 'tron') {
        txs = await fetchTronTxs(address);
      } else {
        txs = await fetchEvmTxs(chain, address);
      }
      // Upsert wallet with new txs and lastRefreshed
      wallet = await Wallet.findOneAndUpdate(
        { address, chain },
        { $set: { transactions: txs, lastRefreshed: now }, $setOnInsert: { address, chain } },
        { new: true, upsert: true }
      );
    } catch (err) {
      // If API fails, fallback to cached txs if available
      if (wallet && wallet.transactions && Array.isArray(wallet.transactions)) {
        txs = wallet.transactions;
      } else {
        txs = [];
      }
    }
  }

  res.status(200).json({
    address: wallet?.address || address,
    chain: wallet?.chain || chain,
    flags: wallet?.flags || [],
    ratings: wallet?.ratings || [],
    avgRating: wallet?.avgRating || 0,
    transactions: txs,
    ens: wallet?.ens || null,
    nftCount: wallet?.nftCount || 0,
    lastRefreshed: wallet?.lastRefreshed || null,
  });
}
