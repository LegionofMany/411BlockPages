import axios from "axios";
import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from 'lib/db';
import Wallet from 'lib/walletModel';
import { Transaction } from 'lib/types';

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

// ...existing code...
import { fetchSolanaTxs } from '../../../../services/solscan';
import { fetchTronTxs } from '../../../../services/tronscan';
// (removed duplicate import)
// Fetch XRP transactions using public API (xrpscan) and map to Transaction type
async function fetchXrpTxs(address: string) {
  try {
    const { data } = await axios.get(`https://api.xrpscan.com/api/v1/account/${address}/transactions`);
    // xrpscan returns {transactions: [...]}
    const txs = Array.isArray(data.transactions) ? data.transactions : Array.isArray(data) ? data : [];
    return txs.map((item: Record<string, unknown>) => ({
      hash: typeof item.hash === 'string' ? item.hash : typeof item.tx_hash === 'string' ? item.tx_hash : '',
      from: typeof item.tx === 'object' && item.tx !== null && 'Account' in item.tx ? (item.tx as Record<string, unknown>).Account as string : '',
      to: typeof item.tx === 'object' && item.tx !== null && 'Destination' in item.tx ? (item.tx as Record<string, unknown>).Destination as string : '',
      value: typeof item.tx === 'object' && item.tx !== null && typeof (item.tx as Record<string, unknown>).Amount === 'string' ? (item.tx as Record<string, unknown>).Amount as string : (typeof item.tx === 'object' && item.tx !== null && typeof (item.tx as Record<string, unknown>).Amount === 'object' ? ((item.tx as Record<string, unknown>).Amount as Record<string, unknown>).value as string : ''),
      date: typeof item.date === 'string' ? item.date : typeof item.tx === 'object' && item.tx !== null && 'date' in item.tx ? (item.tx as Record<string, unknown>).date as string : '',
      type: typeof item.tx === 'object' && item.tx !== null && 'TransactionType' in item.tx ? (item.tx as Record<string, unknown>).TransactionType as string : '',
    }));
  } catch {
    return [];
  }
}

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

// Map Bitcoin txs to Transaction type
async function fetchBitcoinTxs(address: string) {
  try {
    const { data } = await axios.get(`https://blockstream.info/api/address/${address}/txs`);
    if (!Array.isArray(data)) return [];
    return data.map((tx: Record<string, unknown>) => {
      // Collect all input addresses
      const vinArr = Array.isArray(tx.vin) ? tx.vin : [];
      const fromAddresses = vinArr.map((vin) => typeof vin === 'object' && vin !== null && 'prevout' in vin && vin.prevout && typeof vin.prevout === 'object' && 'scriptpubkey_address' in vin.prevout ? (vin.prevout as Record<string, unknown>).scriptpubkey_address as string : '').filter(Boolean);
      // Collect all output addresses and values
      const voutArr = Array.isArray(tx.vout) ? tx.vout : [];
      const outputs = voutArr.map((vout) => typeof vout === 'object' && vout !== null && 'scriptpubkey_address' in vout && 'value' in vout ? { to: vout.scriptpubkey_address as string, value: vout.value as number } : { to: '', value: 0 });
      return {
        txid: typeof tx.txid === 'string' ? tx.txid : '',
        hash: typeof tx.txid === 'string' ? tx.txid : '',
        from: fromAddresses.join(', '),
        to: outputs.map(o => o.to).join(', '),
        value: outputs.map(o => o.value).join(', '),
        vout: voutArr,
        block: tx.status && typeof tx.status === 'object' && tx.status !== null && 'block_height' in tx.status ? (tx.status as Record<string, unknown>).block_height as number : null,
        date: tx.status && typeof tx.status === 'object' && tx.status !== null && 'block_time' in tx.status ? new Date(((tx.status as Record<string, unknown>).block_time as number) * 1000).toISOString() : '',
        type: 'transfer',
      };
    });
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
  if (wallet && wallet.blacklisted) {
    return res.status(403).json({ message: 'This wallet is blacklisted.' });
  }
  const now = new Date();
  let txs: Transaction[] = [];
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
      } else if (chain === 'xrp') {
        txs = await fetchXrpTxs(address);
      } else {
        txs = await fetchEvmTxs(chain, address);
      }
      // Upsert wallet with new txs and lastRefreshed
      wallet = await Wallet.findOneAndUpdate(
        { address, chain },
        { $set: { transactions: txs, lastRefreshed: now }, $setOnInsert: { address, chain } },
        { new: true, upsert: true }
      );
    } catch {
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
    ratings: (wallet?.ratings || []).map((r: {
      user: string;
      score: number;
      date: string;
      text?: string;
      approved?: boolean;
      flagged?: boolean;
      flaggedReason?: string;
    }) => ({
      user: r.user,
      score: r.score,
      date: r.date,
      text: r.text,
      approved: r.approved,
      flagged: r.flagged,
      flaggedReason: r.flaggedReason,
    })),
    avgRating: wallet?.avgRating || 0,
    transactions: txs,
    ens: wallet?.ens || null,
    nftCount: wallet?.nftCount || 0,
    lastRefreshed: wallet?.lastRefreshed || null,
    statusTags: getStatusTags(wallet),
  });
}
